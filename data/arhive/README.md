# clip_mbtiles

Physically clips every vector-tile layer inside an **MBTiles (MVT)** file
against a country border polygon. Geometry outside the border is cropped or
deleted **at the data level** -- nothing is hidden by styling, filters, or
masks. The result is a new, smaller MBTiles file containing only the parts
of each feature that fall inside the border.

No layer names are hard-coded anywhere in the pipeline: every layer found
inside a tile (`transportation`, `waterway`, `water`, `landuse`, `landcover`,
`building`, `place`, `boundary`, `aeroway`, `park`, `natural`, or anything
else) is discovered dynamically and processed by the same generic
geometry-clipping code.

## Install

```bash
pip install -r requirements.txt
```

## Usage

```bash
python clip.py \
  --input kyrgyzstan.mbtiles \
  --border kyrgyzstan.geojson \
  --output jaymap.mbtiles
```

Add `-v` / `--verbose` to log a line per tile (`z/x/y`, features
before/after/removed, processing time):

```bash
python clip.py --input kyrgyzstan.mbtiles --border kyrgyzstan.geojson --output jaymap.mbtiles -v
```

The tool prints a `tqdm` progress bar (`15423/79398 tiles ...`) and, at the
end, a summary of how many tiles were fully inside the border (copied
unchanged), fully outside (dropped), or straddling the border (clipped),
plus total feature counts before/after.

The original `kyrgyzstan.mbtiles` is never modified; a brand-new
`jaymap.mbtiles` is written.

## How it works

### 1. Border loading (`geometry.py`)

The border GeoJSON (any number of `Polygon`/`MultiPolygon` features) is
loaded and merged into a single validated `(Multi)Polygon` with Shapely,
plus a `shapely.prepared` version for fast repeated `contains` /
`intersects` tests.

### 2. Tile <-> WGS84 coordinate transform (`tile_transform.py`)

MBTiles stores `tile_row` using the **TMS** convention (row 0 = south),
while the tile's own pixel space (as decoded by `mapbox_vector_tile` with
its default options) is a bottom-up cartesian frame: `x=0` west, `x=extent`
east, `y=0` south, `y=extent` north. Both conventions were verified against
known landmark coordinates (Bishkek) before being used anywhere.

`mercantile.bounds()` gives the exact WGS84 bounding box of a tile once its
TMS row is converted to the XYZ row mercantile expects
(`xyz_row = 2**z - 1 - tms_row`). Coordinate conversion is then a simple
linear interpolation within that bounding box -- exact for the OpenMapTiles /
Planetiler tile grid, so no geodetic reprojection library is needed for this
step.

### 3. Per-tile clipping (`mvt.py`, `geometry.py`)

For every tile:

1. Decompress (if gzipped) and decode the raw MVT blob (`mapbox_vector_tile.decode`).
2. For every layer, transform every feature's geometry from tile-pixel
   space to WGS84 lon/lat (`shapely.transform`).
3. Clip against the border with Shapely, geometry-type aware:
   * **Point / MultiPoint** -- kept if inside/touching the border, dropped
     otherwise.
   * **LineString / MultiLineString** -- dropped if fully outside, kept
     unchanged if fully inside, `intersection()`-clipped otherwise.
   * **Polygon / MultiPolygon** -- same as above using `intersection()` /
     `contains()`; invalid (self-intersecting) input polygons -- which do
     occasionally occur after MVT's integer pixel quantization -- are
     repaired with `shapely.make_valid` before any boolean operation.
   * **GeometryCollection** -- recursed into and rebuilt from its clipped
     parts (defensive; real MVT tiles never actually contain one).
4. Transform surviving geometry back from WGS84 to tile-pixel space and
   round to integers.
5. Re-encode the tile (`mapbox_vector_tile.encode`), preserving every
   feature's properties, id, layer name and extent unchanged -- only the
   geometry is touched.

Only the geometry is ever modified. Layers, attributes/properties, and
feature ids are passed through untouched.

### 4. Performance (streaming, one tile at a time)

Tiles are streamed one row at a time from a read-only SQLite connection --
the whole MBTiles is never loaded into memory. For each tile, its WGS84
bounding box is compared against the border first:

* **fully outside the border** -> the tile is dropped without running the
  (expensive) per-feature clip.
* **fully inside the border** -> the tile is copied through byte-for-byte
  unchanged, without running the per-feature clip.
* **straddling the border** -> full per-feature clipping is performed.

Vector tile generators (Planetiler included) commonly replicate label
points (`place`, `poi`, `mountain_peak`, `aerodrome_label`, ...) into
neighbouring tiles -- with pixel offsets of a full tile width or more -- for
label-collision purposes across tile/zoom boundaries. That means a tile
whose *bounding box* is fully inside (or outside) the border can still
contain an individual point feature whose *true* geographic location is
outside (or inside) it. To stay correct, both fast paths run one cheap
extra check first: every `Point`/`MultiPoint` feature in the tile is
verified against the border; if any of them contradicts the fast-path
tile-level decision, that single tile falls back to full per-feature
clipping instead. Polygon/line geometries are not subject to this
replication pattern (generators only ever give them a small buffer, well
within the tile's own bounding box), so they are not re-checked here.

This turns an `O(all features in the tileset)` clipping cost into
`O(features in border tiles)`, while still guaranteeing no feature is ever
kept or dropped incorrectly. On the reference `kyrgyzstan.mbtiles`
(79,398 tiles / 14 zoom levels) this brings total runtime for the whole
tileset down from tens of minutes to well under 5 minutes.

### 5. MBTiles schema support (`clip.py`)

The input schema is auto-detected and the output mirrors it:

* **Plain MBTiles** -- a `tiles` table (`zoom_level`, `tile_column`,
  `tile_row`, `tile_data`), the schema used by `mb-util`, `tippecanoe`, etc.
  (This also transparently covers the legacy `map` + `images` variant,
  since that schema always exposes a `tiles` VIEW with the same columns.)
* **Planetiler schema** -- `tiles_data` (deduplicated blobs) +
  `tiles_shallow` (`zoom_level`/`tile_column`/`tile_row` -> `tile_data_id`) +
  a `tiles` VIEW joining them.

When writing a Planetiler-style output, identical output tile blobs are
deduplicated by content hash (SHA-256) exactly the way Planetiler itself
deduplicates, so e.g. the very large number of now-identical "no data here"
tiles produced by dropping exterior features don't bloat the file.

`metadata` rows are copied verbatim from the source file.

## Project layout

```
clip_mbtiles/
├── clip.py              # CLI entry point / orchestration / MBTiles I/O
├── mvt.py               # MVT tile decode/encode + per-tile clip pipeline
├── geometry.py          # border loading + geometry-type-aware clipping
├── tile_transform.py    # tile <-> WGS84 coordinate conversion
├── requirements.txt
└── README.md
```

## Requirements guarantees

* **No lost interior objects** -- every feature (or the part of it) that
  falls inside the border is preserved; the point-replication safety check
  described above specifically protects against silently dropping an
  interior duplicated label point.
* **No corrupted MVT** -- every output tile is produced by
  `mapbox_vector_tile.encode`, the same library used to decode, guaranteeing
  a spec-valid tile; round-trip fidelity (decode -> encode -> decode gives
  back identical geometries/properties) was verified before any clipping
  logic was added.
* **Attributes/properties/layers unchanged** -- only the `geometry` key of
  each feature dict is ever replaced; `properties`, `id`, layer name and
  layer `extent`/`version` pass straight through.
* **Works on any layer set** -- layers are discovered from
  `mapbox_vector_tile.decode()`'s output dict at runtime; nothing is
  hard-coded, so additional/unknown layers are handled automatically.
