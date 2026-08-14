"""
tile_transform.py
==================

Coordinate transformation utilities between MVT (Mapbox Vector Tile) local
tile-pixel space and WGS84 (lon/lat) geographic space.

Tile numbering conventions
---------------------------
MBTiles files store the tile row using the **TMS** convention: row 0 is the
southernmost row at a given zoom level (row index grows to the north).
``mercantile`` (and the XYZ / "Google" / "Slippy Map" convention used almost
everywhere else, e.g. OpenStreetMap, MapLibre, etc.) numbers tiles the other
way around: row 0 is the northernmost row.

To convert an MBTiles (TMS) row into an XYZ row for a zoom level ``z``:

    xyz_row = 2**z - 1 - tms_row

Pixel space convention
-----------------------
This project decodes/encodes MVT tiles using the default options of the
``mapbox_vector_tile`` library (``y_coord_down=False``). Empirically (and
consistently with the TMS row convention above) this means:

    * x = 0            -> west edge of the tile
    * x = extent        -> east edge of the tile
    * y = 0            -> south edge of the tile
    * y = extent        -> north edge of the tile

i.e. a plain bottom-up cartesian frame local to the tile, scaled to
``extent`` units (usually 4096). Coordinates can legitimately fall outside
the ``[0, extent]`` range (e.g. buffered geometries, or label points shared
between neighbouring tiles) -- this is normal and must be preserved.

This module converts between that pixel frame and WGS84 lon/lat using the
tile's geographic bounding box (computed via ``mercantile``), which is exact
(the OpenMapTiles / Planetiler tile grid is standard spherical-mercator
slippy-map grid).
"""

from __future__ import annotations

from typing import NamedTuple

import mercantile


class TileBounds(NamedTuple):
    """Geographic bounding box of a tile (WGS84 degrees)."""

    west: float
    south: float
    east: float
    north: float


def tms_row_to_xyz_row(z: int, tms_row: int) -> int:
    """Convert an MBTiles/TMS row index into an XYZ (slippy-map) row index."""
    return (2 ** z) - 1 - tms_row


def xyz_row_to_tms_row(z: int, xyz_row: int) -> int:
    """Convert an XYZ (slippy-map) row index into an MBTiles/TMS row index."""
    return (2 ** z) - 1 - xyz_row


def get_tile_bounds(z: int, x: int, tms_row: int) -> TileBounds:
    """Return the WGS84 (lon/lat) bounding box for tile (z, x, tms_row).

    ``tms_row`` must be given in MBTiles/TMS convention (row 0 = south).
    """
    xyz_row = tms_row_to_xyz_row(z, tms_row)
    b = mercantile.bounds(x, xyz_row, z)
    return TileBounds(west=b.west, south=b.south, east=b.east, north=b.north)


def make_pixel_to_lonlat(bounds: TileBounds, extent: int):
    """Build a coordinate transform function: tile-pixel -> (lon, lat).

    The returned function has the signature required by
    ``shapely.transform``: it takes an (N, 2) numpy-like array of
    coordinates and returns a transformed array of the same shape.
    """
    west, south, east, north = bounds
    dlon = east - west
    dlat = north - south

    def _transform(coords):
        out = coords.copy()
        out[:, 0] = west + (coords[:, 0] / extent) * dlon
        out[:, 1] = south + (coords[:, 1] / extent) * dlat
        return out

    return _transform


def make_lonlat_to_pixel(bounds: TileBounds, extent: int):
    """Build a coordinate transform function: (lon, lat) -> tile-pixel.

    The returned function has the signature required by
    ``shapely.transform``. Output pixel coordinates are NOT clamped to
    ``[0, extent]`` -- geometries are allowed to extend outside of the
    tile (this is normal/expected in MVT tiles, e.g. buffered features).
    """
    west, south, east, north = bounds
    dlon = east - west
    dlat = north - south

    def _transform(coords):
        out = coords.copy()
        out[:, 0] = (coords[:, 0] - west) / dlon * extent
        out[:, 1] = (coords[:, 1] - south) / dlat * extent
        return out

    return _transform
