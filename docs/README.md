# MapKG Map Style

Production-ready, custom MapLibre GL JS map style for **MapKG**, a long-term rental real-estate
platform. Built directly on **OpenFreeMap** (unmodified OpenMapTiles schema) — no MapTiler, no
Mapbox, no API keys, nothing to replace before deploying.

```
styles/
  light.json      ← primary style, ready to use as-is
  dark.json       ← dark variant, same architecture, different palette
docs/
  STYLE_GUIDE.md   ← design rationale, zoom logic, Bishkek-specific rules
  COLOR_SYSTEM.md  ← full color palette + how to extend it
  LAYERS.md        ← every layer: source-layer, filter, purpose, how to edit
README.md          ← this file
```

There is no `sprites/` or `glyphs/` folder in this project on purpose — see "Why no sprite, why no
local fonts" below.

## Quick start

```js
const map = new maplibregl.Map({
  container: 'map',
  style: '/styles/light.json', // host this file yourself, e.g. served alongside your frontend
  center: [74.601, 42.876],    // Bishkek
  zoom: 12,
});
```

Both `light.json` and `dark.json` point at:

```
"url": "https://tiles.openfreemap.org/planet"
```

This is OpenFreeMap's free public endpoint — verified directly against their live `positron`
style — no API key, no request limits, no registration. If you outgrow the public instance or want
guaranteed uptime, you can self-host it: <https://github.com/hyperknot/openfreemap>. Either way,
only the `url` field needs to change — nothing else in the style depends on the provider.

## Why no sprite, why no local fonts

- **Sprite**: none of the layers use `icon-image`. Every price marker, cluster, card, filter
  chip and route in the product is a frontend UI element layered on top of the map (per the brief:
  the interface must dominate the map), so the basemap itself has zero icons and needs no sprite
  sheet.
- **Fonts**: `glyphs` points at OpenFreeMap's public glyph server
  (`https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf`), which is free and requires no
  key. Only `Noto Sans Regular`, `Noto Sans Bold` and `Noto Sans Italic` are used — confirmed to
  actually exist on that server (the underlying `openmaptiles/fonts` project only builds those
  three weights; there is no "Medium", so it was deliberately not used anywhere in this style).

## Editing the style

Both styles were hand-built to be edited directly, or opened in
[Maputnik](https://maputnik.github.io/editor) for visual tweaking (load the raw `light.json` /
`dark.json` file via Maputnik's "Open" → upload).

See `docs/LAYERS.md` for what each layer does and `docs/COLOR_SYSTEM.md` before changing any color,
so the change stays consistent across the whole hierarchy.

## Validation performed before delivery

- ✔ Valid Style Specification v8 JSON (`json.load` parses cleanly, both files)
- ✔ Every `source-layer` name checked against the official OpenMapTiles schema
  (openmaptiles.org/schema) *and* against OpenFreeMap's actual live `positron` style output
  (fetched directly), not assumed from memory
- ✔ Every `class`/`subclass`/field name used in filters (e.g. `admin_level`, `capital`, `rank`,
  `brunnel`, `maritime`, `disputed`, `claimed_by`) exists in the verified schema
- ✔ No `poi` source-layer referenced anywhere — no POI icons or labels
- ✔ No duplicated layers: buildings use one layer with a `case`/`within` paint expression for the
  Bishkek-center exception instead of a second stacked layer
- ✔ No `icon-image` / sprite dependency
- ✔ No 3D, no `fill-extrusion`, no shadows, no animation
- ✔ `light.json` and `dark.json` share the exact same layer IDs, filters and zoom breaks — only
  paint colors differ, so they can be swapped at runtime without re-deriving logic
