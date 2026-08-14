#!/usr/bin/env python3
"""
clip.py
=======

CLI tool that physically clips every vector-tile layer in an MBTiles (MVT)
file against a country border polygon, writing the result to a new MBTiles
file. Geometry outside the border is cropped or removed at the data level
(not hidden by styling / filters).

Usage
-----
    python clip.py --input kyrgyzstan.mbtiles --border kyrgyzstan.geojson --output jaymap.mbtiles

See README.md for details.
"""

from __future__ import annotations

import argparse
import hashlib
import logging
import sqlite3
import sys
import time
from pathlib import Path

from tqdm import tqdm
import shapely
from shapely.geometry import box as shapely_box
from shapely.geometry import shape as shapely_shape

from geometry import Border, load_border
from mvt import (
    clip_decoded_tile,
    count_features,
    decode_tile_blob,
    encode_tile_layers,
    is_gzipped,
    process_tile,
)
from tile_transform import get_tile_bounds

log = logging.getLogger("clip_mbtiles")


# --------------------------------------------------------------------------
# Source schema detection
# --------------------------------------------------------------------------

class SourceSchema:
    PLAIN = "plain"          # simple `tiles` table
    PLANETILER = "planetiler"  # tiles_shallow + tiles_data (+ `tiles` view)


def detect_schema(conn: sqlite3.Connection) -> str:
    cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = {row[0] for row in cur.fetchall()}
    if {"tiles_shallow", "tiles_data"}.issubset(tables):
        return SourceSchema.PLANETILER
    # Covers both the plain `tiles` table schema and the `map` + `images`
    # schema (which always exposes a `tiles` view per the MBTiles spec) --
    # either way, `SELECT ... FROM tiles` works.
    cur = conn.execute(
        "SELECT name FROM sqlite_master WHERE type IN ('table','view') AND name='tiles'"
    )
    if cur.fetchone():
        return SourceSchema.PLAIN
    raise ValueError(
        "Unrecognized MBTiles schema: expected a `tiles` table/view, or a "
        "Planetiler-style `tiles_shallow`/`tiles_data` schema."
    )


def count_tiles(conn: sqlite3.Connection) -> int:
    return conn.execute("SELECT COUNT(*) FROM tiles").fetchone()[0]


def iter_tiles(conn: sqlite3.Connection):
    """Yield (zoom_level, tile_column, tile_row, tile_data) for every tile,
    ordered by zoom level then column then row, streaming one row at a time
    (sqlite3 cursors are already lazy/streaming server-side-cursor style)."""
    cur = conn.execute(
        "SELECT zoom_level, tile_column, tile_row, tile_data "
        "FROM tiles ORDER BY zoom_level, tile_column, tile_row"
    )
    for row in cur:
        yield row


# --------------------------------------------------------------------------
# Output writer
# --------------------------------------------------------------------------

class OutputWriter:
    """Writes tiles to a new MBTiles file, mirroring the schema style of the
    source file (plain `tiles` table, or Planetiler `tiles_shallow` /
    `tiles_data` with content-hash deduplication)."""

    def __init__(self, path: str, schema: str):
        self.schema = schema
        self.path = path
        if Path(path).exists():
            Path(path).unlink()
        self.conn = sqlite3.connect(path)
        self.conn.execute("PRAGMA synchronous=OFF")
        self.conn.execute("PRAGMA journal_mode=MEMORY")
        self._create_schema()
        self._hash_to_id: dict[bytes, int] = {}
        self._next_id = 1
        self._shallow_batch = []
        self._data_batch = []
        self._plain_batch = []
        self._batch_size = 2000

    def _create_schema(self):
        self.conn.execute("CREATE TABLE metadata (name TEXT, value TEXT)")
        if self.schema == SourceSchema.PLANETILER:
            self.conn.execute(
                "CREATE TABLE tiles_data (tile_data_id INTEGER PRIMARY KEY, tile_data BLOB)"
            )
            self.conn.execute(
                "CREATE TABLE tiles_shallow ("
                "zoom_level INTEGER, tile_column INTEGER, tile_row INTEGER, "
                "tile_data_id INTEGER)"
            )
            self.conn.execute(
                "CREATE VIEW tiles AS "
                "SELECT tiles_shallow.zoom_level AS zoom_level, "
                "tiles_shallow.tile_column AS tile_column, "
                "tiles_shallow.tile_row AS tile_row, "
                "tiles_data.tile_data AS tile_data "
                "FROM tiles_shallow "
                "JOIN tiles_data ON tiles_shallow.tile_data_id = tiles_data.tile_data_id"
            )
        else:
            self.conn.execute(
                "CREATE TABLE tiles ("
                "zoom_level INTEGER, tile_column INTEGER, tile_row INTEGER, "
                "tile_data BLOB)"
            )
        self.conn.commit()

    def write_metadata(self, rows):
        self.conn.executemany("INSERT INTO metadata (name, value) VALUES (?, ?)", rows)
        self.conn.commit()

    def write_tile(self, z: int, x: int, y: int, blob: bytes):
        if self.schema == SourceSchema.PLANETILER:
            digest = hashlib.sha256(blob).digest()
            tile_data_id = self._hash_to_id.get(digest)
            if tile_data_id is None:
                tile_data_id = self._next_id
                self._next_id += 1
                self._hash_to_id[digest] = tile_data_id
                self._data_batch.append((tile_data_id, blob))
            self._shallow_batch.append((z, x, y, tile_data_id))
            if len(self._shallow_batch) >= self._batch_size:
                self._flush()
        else:
            self._plain_batch.append((z, x, y, blob))
            if len(self._plain_batch) >= self._batch_size:
                self._flush()

    def _flush(self):
        if self._data_batch:
            self.conn.executemany(
                "INSERT INTO tiles_data (tile_data_id, tile_data) VALUES (?, ?)",
                self._data_batch,
            )
            self._data_batch.clear()
        if self._shallow_batch:
            self.conn.executemany(
                "INSERT INTO tiles_shallow (zoom_level, tile_column, tile_row, tile_data_id) "
                "VALUES (?, ?, ?, ?)",
                self._shallow_batch,
            )
            self._shallow_batch.clear()
        if self._plain_batch:
            self.conn.executemany(
                "INSERT INTO tiles (zoom_level, tile_column, tile_row, tile_data) "
                "VALUES (?, ?, ?, ?)",
                self._plain_batch,
            )
            self._plain_batch.clear()
        self.conn.commit()

    def finalize(self):
        self._flush()
        if self.schema == SourceSchema.PLANETILER:
            self.conn.execute(
                "CREATE UNIQUE INDEX tiles_shallow_index ON "
                "tiles_shallow (zoom_level, tile_column, tile_row)"
            )
        else:
            self.conn.execute(
                "CREATE UNIQUE INDEX tiles_index ON tiles (zoom_level, tile_column, tile_row)"
            )
        self.conn.commit()
        self.conn.execute("VACUUM")
        self.conn.close()


# --------------------------------------------------------------------------
# Fast-path tile bounding-box classification
# --------------------------------------------------------------------------

INSIDE = "inside"     # tile bbox fully inside border -> copy unchanged
OUTSIDE = "outside"   # tile bbox fully outside border -> drop tile
BOUNDARY = "boundary"  # tile bbox straddles the border -> full clip needed


def classify_tile(z: int, x: int, tms_row: int, border: Border) -> str:
    bounds = get_tile_bounds(z, x, tms_row)
    tile_box = shapely_box(bounds.west, bounds.south, bounds.east, bounds.north)

    if not border.prepared.intersects(tile_box):
        return OUTSIDE
    if border.prepared.contains(tile_box):
        return INSIDE
    return BOUNDARY


def point_features_match_expected_side(
    decoded: dict, z: int, x: int, tms_row: int, border: Border, expect_inside: bool
) -> bool:
    """A tile whose *bounding box* lies fully inside (or fully outside) the
    border can still contain individual Point/MultiPoint features (label
    points such as ``place``, ``poi``, ``mountain_peak``,
    ``aerodrome_label`` ...) whose pixel coordinates are far outside the
    tile's normal ``[0, extent]`` range -- vector tile generators commonly
    replicate label points into neighbouring tiles (for label-collision /
    anti-pop-in purposes) with offsets of a full tile width or more. Such a
    duplicated point can legitimately sit geographically outside the
    border even though its tile's bbox is fully interior -- or, the other
    way around, a point replicated into a tile whose bbox is fully
    exterior can still have its true location inside the border.

    This check cheaply verifies every Point/MultiPoint feature's real
    geographic location against the border; polygon/line geometries are
    not subject to this replication pattern (generators only give them a
    small buffer, well within the tile bbox) so they are not re-checked
    here.

    Returns True if every Point/MultiPoint feature's membership matches
    ``expect_inside`` (so the tile-bbox-based fast path decision is safe to
    use as-is); False if at least one point feature contradicts it (the
    caller should fall back to full per-feature clipping instead).
    """
    bounds = get_tile_bounds(z, x, tms_row)
    for layer in decoded.values():
        extent = layer.get("extent", 4096)
        to_lonlat = make_pixel_to_lonlat_cached(bounds, extent)
        for feature in layer["features"]:
            geom = feature["geometry"]
            gt = geom["type"]
            if gt not in ("Point", "MultiPoint"):
                continue

            pt_geom = shapely_shape(geom)
            pt_lonlat = shapely.transform(pt_geom, to_lonlat)
            is_inside = border.prepared.intersects(pt_lonlat)
            if is_inside != expect_inside:
                return False
    return True


_pixel_to_lonlat_cache = {}


def make_pixel_to_lonlat_cached(bounds, extent):
    key = (bounds, extent)
    fn = _pixel_to_lonlat_cache.get(key)
    if fn is None:
        from tile_transform import make_pixel_to_lonlat as _make
        fn = _make(bounds, extent)
        _pixel_to_lonlat_cache.clear()  # keep memory bounded; only 1 tile live at a time
        _pixel_to_lonlat_cache[key] = fn
    return fn


# --------------------------------------------------------------------------
# Main pipeline
# --------------------------------------------------------------------------

def run(input_path: str, border_path: str, output_path: str) -> None:
    log.info("Loading border polygon from %s", border_path)
    border = load_border(border_path)
    log.info(
        "Border bounds: west=%.5f south=%.5f east=%.5f north=%.5f",
        *border.bounds,
    )

    src_uri = f"file:{input_path}?mode=ro"
    src_conn = sqlite3.connect(src_uri, uri=True)

    schema = detect_schema(src_conn)
    log.info("Detected source MBTiles schema: %s", schema)

    total_tiles = count_tiles(src_conn)
    log.info("Total tiles to process: %d", total_tiles)

    writer = OutputWriter(output_path, schema)

    meta_rows = list(src_conn.execute("SELECT name, value FROM metadata"))
    writer.write_metadata(meta_rows)

    n_inside = n_outside = n_boundary = 0
    n_written = 0
    total_features_before = 0
    total_features_after = 0

    progress = tqdm(total=total_tiles, unit="tile", dynamic_ncols=True)

    for z, x, tms_row, blob in iter_tiles(src_conn):
        t0 = time.perf_counter()
        mode = classify_tile(z, x, tms_row, border)

        if mode == OUTSIDE:
            decoded = decode_tile_blob(blob)
            features_before = count_features(decoded)
            if point_features_match_expected_side(decoded, z, x, tms_row, border, expect_inside=False):
                n_outside += 1
                features_after = 0
                new_blob = None
            else:
                # A replicated label point actually lands inside the
                # border even though this tile's bbox is fully exterior --
                # rescue it via full clipping instead of dropping the tile.
                n_boundary += 1
                new_layers = clip_decoded_tile(decoded, z, x, tms_row, border)
                features_after = count_features(new_layers)
                new_blob = (
                    encode_tile_layers(new_layers, gzip_output=is_gzipped(blob))
                    if new_layers else None
                )

        elif mode == INSIDE:
            decoded = decode_tile_blob(blob)
            features_before = count_features(decoded)
            if point_features_match_expected_side(decoded, z, x, tms_row, border, expect_inside=True):
                n_inside += 1
                features_after = features_before
                new_blob = blob  # unchanged, copied verbatim
            else:
                # A replicated label point escapes the tile's own bbox and
                # lands outside the border -- fall back to full clipping.
                n_boundary += 1
                new_layers = clip_decoded_tile(decoded, z, x, tms_row, border)
                features_after = count_features(new_layers)
                new_blob = (
                    encode_tile_layers(new_layers, gzip_output=is_gzipped(blob))
                    if new_layers else None
                )

        else:  # BOUNDARY
            n_boundary += 1
            new_blob, stats = process_tile(blob, z, x, tms_row, border)
            features_before = stats.features_before
            features_after = stats.features_after

        elapsed = time.perf_counter() - t0
        removed = features_before - features_after

        total_features_before += features_before
        total_features_after += features_after

        log.debug(
            "tile z=%d x=%d y=%d | before=%d after=%d removed=%d | %.4fs | %s",
            z, x, tms_row, features_before, features_after, removed, elapsed, mode,
        )

        if new_blob is not None:
            writer.write_tile(z, x, tms_row, new_blob)
            n_written += 1

        progress.update(1)
        progress.set_postfix(
            inside=n_inside, boundary=n_boundary, outside=n_outside, refresh=False
        )

    progress.close()
    writer.finalize()
    src_conn.close()

    log.info("Done.")
    log.info(
        "Tiles: %d total | %d fully inside | %d boundary (clipped) | %d fully outside (dropped)",
        total_tiles, n_inside, n_boundary, n_outside,
    )
    log.info("Tiles written to output: %d", n_written)
    log.info(
        "Features: %d before -> %d after (%d removed)",
        total_features_before, total_features_after,
        total_features_before - total_features_after,
    )
    log.info("Output written to: %s", output_path)


def main():
    parser = argparse.ArgumentParser(
        description="Physically clip an MBTiles (MVT) file against a country border polygon."
    )
    parser.add_argument("--input", required=True, help="Path to the source .mbtiles file")
    parser.add_argument("--border", required=True, help="Path to the border .geojson file")
    parser.add_argument("--output", required=True, help="Path to the output .mbtiles file")
    parser.add_argument(
        "--verbose", "-v", action="store_true",
        help="Enable per-tile DEBUG logging (z/x/y, features before/after/removed, timing)",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)-7s %(message)s",
        datefmt="%H:%M:%S",
    )

    start = time.perf_counter()
    try:
        run(args.input, args.border, args.output)
    except Exception:
        log.exception("Fatal error while processing MBTiles")
        sys.exit(1)
    log.info("Total time: %.1fs", time.perf_counter() - start)


if __name__ == "__main__":
    main()
