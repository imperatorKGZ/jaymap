"""
geometry.py
===========

Loading of the country border polygon and clipping of individual feature
geometries against it.

All clipping is performed in WGS84 (lon/lat) space using Shapely. Geometries
coming out of / going into MVT tiles are always in the tile-local pixel
space (see ``tile_transform.py``) -- conversion is the caller's
responsibility (see ``mvt.py::process_tile``).

Supported geometry types (matches everything ``mapbox_vector_tile`` can
decode, plus ``GeometryCollection`` defensively even though real MVT tiles
never contain one):

    Point, MultiPoint, LineString, MultiLineString,
    Polygon, MultiPolygon, GeometryCollection
"""

from __future__ import annotations

import json
from typing import Optional

import shapely
from shapely.geometry import shape, mapping
from shapely.geometry.base import BaseGeometry
from shapely.ops import unary_union
from shapely.prepared import PreparedGeometry, prep
from shapely.validation import make_valid


class Border:
    """Holds the (unioned, validated) country border polygon."""

    __slots__ = ("geom", "prepared", "bounds")

    def __init__(self, geom: BaseGeometry):
        self.geom: BaseGeometry = geom
        self.prepared: PreparedGeometry = prep(geom)
        self.bounds = geom.bounds  # (minx, miny, maxx, maxy)


def load_border(geojson_path: str) -> Border:
    """Load the state border from a GeoJSON file.

    Accepts a FeatureCollection, a single Feature, or a bare geometry, with
    any number of (Multi)Polygon features -- they are unioned into a single
    geometry so the rest of the pipeline only has to deal with one polygon.
    """
    with open(geojson_path, "r", encoding="utf-8") as f:
        gj = json.load(f)

    geometries = []

    def _collect(obj):
        t = obj.get("type")
        if t == "FeatureCollection":
            for feat in obj["features"]:
                _collect(feat)
        elif t == "Feature":
            _collect(obj["geometry"])
        elif t in (
            "Polygon",
            "MultiPolygon",
            "GeometryCollection",
        ):
            if t == "GeometryCollection":
                for g in obj["geometries"]:
                    _collect(g)
            else:
                geometries.append(shape(obj))
        else:
            raise ValueError(f"Unsupported / non-polygonal geometry type in border file: {t}")

    _collect(gj)

    if not geometries:
        raise ValueError("No polygon geometry found in border GeoJSON file")

    merged = unary_union(geometries)
    if not merged.is_valid:
        merged = make_valid(merged)

    if merged.geom_type not in ("Polygon", "MultiPolygon"):
        raise ValueError(
            f"Border geometry must resolve to Polygon/MultiPolygon, got {merged.geom_type}"
        )

    return Border(merged)


def _clean_polygonal(geom: Optional[BaseGeometry]) -> Optional[BaseGeometry]:
    """Keep only the polygonal parts of a geometry (drop points/lines that
    can appear in a GeometryCollection returned by ``intersection`` at
    tangency points), and drop empty / degenerate results."""
    if geom is None or geom.is_empty:
        return None
    if geom.geom_type in ("Polygon", "MultiPolygon"):
        return geom if geom.area > 0 else None
    if geom.geom_type == "GeometryCollection":
        polys = [g for g in geom.geoms if g.geom_type in ("Polygon", "MultiPolygon") and g.area > 0]
        if not polys:
            return None
        merged = unary_union(polys)
        return merged if not merged.is_empty else None
    return None


def _clean_lineal(geom: Optional[BaseGeometry]) -> Optional[BaseGeometry]:
    """Keep only the lineal parts of a geometry, drop empties/points."""
    if geom is None or geom.is_empty:
        return None
    if geom.geom_type in ("LineString", "MultiLineString"):
        return geom if geom.length > 0 else None
    if geom.geom_type == "GeometryCollection":
        lines = [
            g for g in geom.geoms
            if g.geom_type in ("LineString", "MultiLineString") and g.length > 0
        ]
        if not lines:
            return None
        merged = unary_union(lines)
        return merged if not merged.is_empty else None
    return None


def clip_geometry(geom: BaseGeometry, border: Border) -> Optional[BaseGeometry]:
    """Clip a single (lon/lat) geometry against the border.

    Returns the clipped geometry, or ``None`` if nothing of it remains
    inside the border (the caller should drop the feature in that case).
    """
    gt = geom.geom_type

    if gt in ("Point", "MultiPoint"):
        if gt == "Point":
            return geom if border.prepared.intersects(geom) else None
        kept = [p for p in geom.geoms if border.prepared.intersects(p)]
        if not kept:
            return None
        return kept[0] if len(kept) == 1 else shapely.geometry.MultiPoint(kept)

    if gt in ("LineString", "MultiLineString"):
        # Fast path: fully inside -> no change needed.
        if border.prepared.contains(geom):
            return geom
        if not border.prepared.intersects(geom):
            return None
        clipped = geom.intersection(border.geom)
        return _clean_lineal(clipped)

    if gt in ("Polygon", "MultiPolygon"):
        if not geom.is_valid:
            # MVT geometries occasionally end up self-intersecting after
            # integer pixel quantization; repair before any GEOS operation
            # that requires valid input (contains/intersects tolerate
            # invalid geometry inconsistently, intersection does not).
            geom = make_valid(geom)
            if geom.is_empty:
                return None
            if geom.geom_type not in ("Polygon", "MultiPolygon"):
                geom = _clean_polygonal(geom)
                if geom is None:
                    return None
        if border.prepared.contains(geom):
            return geom
        if not border.prepared.intersects(geom):
            return None
        clipped = geom.intersection(border.geom)
        return _clean_polygonal(clipped)

    if gt == "GeometryCollection":
        parts = []
        for sub in geom.geoms:
            clipped_sub = clip_geometry(sub, border)
            if clipped_sub is not None:
                parts.append(clipped_sub)
        if not parts:
            return None
        if len(parts) == 1:
            return parts[0]
        return shapely.geometry.GeometryCollection(parts)

    raise ValueError(f"Unsupported geometry type: {gt}")


def geojson_geom_to_shapely(geom_dict: dict) -> BaseGeometry:
    """Convert a decoded MVT geometry dict (GeoJSON-like, tile-pixel coords)
    into a Shapely geometry object."""
    return shape(geom_dict)


def shapely_geom_to_geojson(geom: BaseGeometry) -> dict:
    """Convert a Shapely geometry back into a GeoJSON-like dict suitable for
    ``mapbox_vector_tile.encode``."""
    return mapping(geom)
