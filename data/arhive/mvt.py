"""
mvt.py
======

Decoding / encoding of a single MVT (Mapbox Vector Tile) blob, and the
per-tile clipping pipeline that ties together ``tile_transform.py`` and
``geometry.py``.

No list of known layer names is ever used: every layer found in the decoded
tile is processed the same generic way, so arbitrary/unknown layers (or a
whole different OpenMapTiles schema version) are handled automatically.
"""

from __future__ import annotations

import gzip
import time
from dataclasses import dataclass
from typing import Optional

import mapbox_vector_tile
import shapely
from shapely.geometry import shape as shapely_shape
from shapely.geometry import mapping as shapely_mapping

from geometry import Border, clip_geometry
from tile_transform import get_tile_bounds, make_pixel_to_lonlat, make_lonlat_to_pixel

GZIP_MAGIC = b"\x1f\x8b"

DEFAULT_EXTENT = 4096


@dataclass
class TileStats:
    z: int
    x: int
    y: int
    features_before: int = 0
    features_after: int = 0
    elapsed: float = 0.0

    @property
    def removed(self) -> int:
        return self.features_before - self.features_after


def is_gzipped(blob: bytes) -> bool:
    return len(blob) >= 2 and blob[:2] == GZIP_MAGIC


def decode_tile_blob(blob: bytes) -> dict:
    """Decompress (if needed) and decode a raw MVT tile blob.

    Returns the ``mapbox_vector_tile.decode`` output: a dict keyed by layer
    name, each value having ``extent``, ``version`` and ``features``.
    """
    raw = gzip.decompress(blob) if is_gzipped(blob) else blob
    return mapbox_vector_tile.decode(raw)


def encode_tile_layers(layers: dict, gzip_output: bool = True) -> bytes:
    """Encode a dict-of-layers (same shape as ``decode_tile_blob`` output)
    back into a raw (optionally gzip-compressed) MVT tile blob."""
    encode_input = []
    per_layer_options = {}
    for name, layer in layers.items():
        encode_input.append({"name": name, "features": layer["features"]})
        per_layer_options[name] = {"extents": layer.get("extent", DEFAULT_EXTENT)}

    pbf = mapbox_vector_tile.encode(
        encode_input,
        per_layer_options=per_layer_options,
        default_options={"extents": DEFAULT_EXTENT, "quantize_bounds": None},
    )
    return gzip.compress(pbf) if gzip_output else pbf


def _round_coords(obj):
    """Recursively round every numeric coordinate pair produced by
    ``shapely.mapping`` down to plain Python ints (MVT coordinates are
    integers)."""
    if not obj:
        return obj
    # A coordinate pair: [x, y] (or [x, y, z], but MVT is 2D only).
    if isinstance(obj[0], (int, float)):
        return [int(round(obj[0])), int(round(obj[1]))]
    return [_round_coords(sub) for sub in obj]


def _clip_feature_geometry(geom_dict: dict, border: Border, to_lonlat, to_pixel) -> Optional[dict]:
    """Clip one decoded MVT feature geometry (tile-pixel space) against the
    border. Returns a new geometry dict (tile-pixel space, rounded to ints)
    or ``None`` if nothing remains."""
    pixel_geom = shapely_shape(geom_dict)

    lonlat_geom = shapely.transform(pixel_geom, to_lonlat)

    clipped = clip_geometry(lonlat_geom, border)
    if clipped is None:
        return None

    back_in_pixels = shapely.transform(clipped, to_pixel)

    result = shapely_mapping(back_in_pixels)
    result = dict(result)
    result["coordinates"] = _round_coords(list(result["coordinates"]))
    return result


def count_features(decoded: dict) -> int:
    return sum(len(layer["features"]) for layer in decoded.values())


def clip_decoded_tile(decoded: dict, z: int, x: int, tms_row: int, border: Border) -> dict:
    """Clip every feature of every layer of an already-decoded tile against
    the country border.

    Returns a new dict in the same shape as ``decode_tile_blob``'s output
    (layer name -> {extent, version, features}), containing only the
    layers that still have at least one feature left.
    """
    bounds = get_tile_bounds(z, x, tms_row)
    new_layers = {}

    for layer_name, layer in decoded.items():
        extent = layer.get("extent", DEFAULT_EXTENT)
        to_lonlat = make_pixel_to_lonlat(bounds, extent)
        to_pixel = make_lonlat_to_pixel(bounds, extent)

        kept_features = []
        for feature in layer["features"]:
            new_geom = _clip_feature_geometry(feature["geometry"], border, to_lonlat, to_pixel)
            if new_geom is None:
                continue
            new_feature = {
                "geometry": new_geom,
                "properties": feature["properties"],
            }
            if "id" in feature:
                new_feature["id"] = feature["id"]
            kept_features.append(new_feature)

        if kept_features:
            new_layers[layer_name] = {
                "extent": extent,
                "version": layer.get("version", 2),
                "features": kept_features,
            }

    return new_layers


def process_tile(
    blob: bytes,
    z: int,
    x: int,
    tms_row: int,
    border: Border,
) -> tuple[Optional[bytes], TileStats]:
    """Full pipeline for one tile: decode -> clip -> encode.

    Returns ``(new_blob, stats)``. ``new_blob`` is ``None`` if the tile ends
    up with zero features in every layer (caller should drop the tile
    entirely from the output MBTiles).
    """
    t0 = time.perf_counter()

    decoded = decode_tile_blob(blob)
    features_before = count_features(decoded)

    new_layers = clip_decoded_tile(decoded, z, x, tms_row, border)
    features_after = count_features(new_layers)

    elapsed = time.perf_counter() - t0
    stats = TileStats(
        z=z, x=x, y=tms_row,
        features_before=features_before,
        features_after=features_after,
        elapsed=elapsed,
    )

    if not new_layers:
        return None, stats

    new_blob = encode_tile_layers(new_layers, gzip_output=is_gzipped(blob))
    return new_blob, stats
