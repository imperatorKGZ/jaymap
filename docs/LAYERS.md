# LAYERS.md — layer-by-layer reference

Schema: **OpenMapTiles**, served unmodified by OpenFreeMap. Source id in both styles:
`openmaptiles`. All `source-layer` names and field names below are verified against
openmaptiles.org/schema and against OpenFreeMap's own production `positron` style.

Draw order = array order in the JSON (bottom → top), same in `light.json` and `dark.json`.

| # | Layer id | source-layer | Draws | minzoom | Notes |
|---|----------|-------------|-------|---------|-------|
| 1 | `background` | — | flat background | 0 | Base canvas color. |
| 2 | `landcover-wood` | `landcover` | forests | 4 | `class == "wood"`. |
| 3 | `park` | `park` | parks/reserves | 4 | No class filter — every polygon in this layer is a park/protected-area by definition. |
| 4 | `landuse-residential` | `landuse` | housing quarters | 8 | `class == "residential"`. |
| 5 | `landuse-commercial` | `landuse` | business/retail quarters | 9 | `class == "commercial"`. |
| 6 | `landuse-industrial` | `landuse` | industrial quarters | 9 | `class == "industrial"`. |
| 7 | `water` | `water` | oceans, lakes, rivers (polygons) | 0 | Excludes `brunnel == "tunnel"` (underground water segments — matches OpenFreeMap's own production filter). |
| 8 | `waterway` | `waterway` | rivers/canals (lines) | 6 | `class in [river, canal]`. Streams/drains/ditches intentionally excluded — too minor for this map. |
| 9 | `building` | `building` | buildings | 13 | Single layer: `fill-color` + `fill-outline-color`. The outline color is a `case`/`within` expression — full-contrast outline everywhere, a softer one inside the Bishkek downtown bbox. No second layer needed. |
| 10 | `tunnel-minor` | `transportation` | alleys/service roads in tunnels | 13 | `brunnel == "tunnel"`, `class in [minor, service, track]`. |
| 11 | `road-minor` | `transportation` | alleys/service roads | 14 | Same classes, not in tunnel. Thinnest/lightest step. |
| 12 | `road-tertiary` | `transportation` | tertiary roads | 11 | `class == "tertiary"` — its own step between minor and secondary. |
| 13 | `road-secondary` | `transportation` | secondary roads | 10 | `class == "secondary"`. |
| 14 | `road-primary` | `transportation` | ordinary main streets | 8 | `class == "primary"`. Plain white — distinct from avenues below. |
| 15 | `road-trunk` | `transportation` | avenues/проспекты | 6 | `class == "trunk"`. Own warm palette, zoom-interpolated color (muted far out, warmer up close). |
| 16 | `road-motorway` | `transportation` | motorways | 6 | `class == "motorway"`. Strongest tone in the hierarchy, same zoom-color behavior as trunk. |
| 17 | `railway` | `transportation` | passenger rail lines | 11 | `class == "rail"`, excludes anything with a `service` value (sidings/yards). |
| 18 | `boundary-country` | `boundary` | national borders | 1 | `admin_level <= 2`, excludes `maritime`, `disputed`, `claimed_by` — a rental map shouldn't render contested/at-sea borders. |
| 19 | `boundary-city` | `boundary` | city/regional borders | 6 | `2 < admin_level <= 6`, same exclusions. |
| 20 | `water-name` | `water_name` | river/lake names | 8 | Localized label (see below). |
| 21 | `place-city-capital` | `place` | national capital | 3 | `class == "city"`, `capital == 2`. Largest, boldest, earliest. |
| 22 | `place-city-major` | `place` | important cities/towns | 5 | `class in [city, town]`, not the capital, `rank <= 5`. |
| 23 | `place-city-minor` | `place` | ordinary towns | 8 | `class in [city, town]`, `rank > 5`. Villages/hamlets are never included — not delayed, excluded. |
| 24 | `place-district` | `place` | suburb/quarter/neighbourhood names | 10 | `class in [suburb, quarter, neighbourhood]`, **excluded inside the Bishkek downtown bbox** (see STYLE_GUIDE.md). |
| 25 | `road-label-major` | `transportation_name` | avenue/street names | 12 | `class in [motorway, trunk, primary, secondary]`. Bold for motorway/trunk, Regular for primary/secondary. |

## Deliberately not included

- `poi` — no source-layer reference anywhere (removes shops, cafés, hotels, ATMs, schools,
  pharmacies, parking, stops, museums, monuments, religious buildings, cemeteries, all tourism/
  landmark points).
- `aeroway`, `aerodrome_label`, `mountain_peak`, `housenumber` — out of scope for a rental map.
- Road shields (`ref`/`network` fields on `transportation_name`) — a premium, minimal map doesn't
  need numbered-highway badges.
- Any `fill-extrusion` layer — the brief explicitly forbids 3D buildings.

## Localization

Every symbol layer resolves labels with:

```json
["coalesce", ["get", "name:ru"], ["get", "name:ky"], ["get", "name"]]
```

Russian first, then Kyrgyz, then whatever local name OpenStreetMap has by default. To add another
language, add another `["get", "name:xx"]` before the final `["get", "name"]` fallback in each
symbol layer's `text-field`.

## Extending

- **New landuse category** (e.g. cemetery, university): copy `landuse-industrial`, change the
  `class` filter value (see COLOR_SYSTEM.md for a fitting tint) and pick a `minzoom` between 8–10.
- **New city rules** (e.g. add Osh-specific decluttering): duplicate the Bishkek bbox pattern —
  build a `Polygon` covering the target downtown, use it in a `within` filter/expression exactly
  like `building` and `place-district` do.
- **Add a road shield or house numbers later**: this will require a `sprite` (for shield icons)
  or the `housenumber` source-layer — both are absent today by design, add them only if a real
  product need appears.
