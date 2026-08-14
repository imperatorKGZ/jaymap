# STYLE_GUIDE.md — design rationale

## Brief, in one line

A calm, premium, near-monochrome basemap that gets out of the way of price markers, the selected
listing, clusters, filters and search — inspired by Apple Maps / Airbnb / ArcGIS Light, but not a
copy of any of them, and explicitly not an OSM-default, tourist, or navigation map.

## Priority hierarchy (as specified)

1. Price markers, selected apartment, clusters — **frontend UI, not part of this style file.**
   Everything below exists to stay visually quiet enough for these to dominate.
2. Buildings — the single most important cartographic layer (`building`).
3. Roads — full hierarchy from motorway down to service lanes.
4. Parks — soft, never draws the eye.
5. Water — soft blue, never draws the eye.
6. Labels — cities, districts, major streets/avenues, large parks, rivers, lakes only.
7. Everything else (POI, tourism, religious sites, cemeteries, shields, house numbers) — removed.

## Road hierarchy — smooth by construction, not by accident

Every road layer uses `["interpolate", ["exponential", 1.3], ["zoom"], ...]` for width — the same
exponential base OpenFreeMap's own production styles use for road width, which is what keeps a
single road from visibly "jumping" a step as you zoom. On top of that, the class list itself is
split into six steps instead of the brief's minimum three (`motorway / trunk / primary / secondary
/ tertiary / minor+service+track`), so no single step has to cover too wide a visual range.

Avenues (`trunk`) and motorways additionally interpolate **color**, not just width, across zoom:
muted/desaturated when viewed as an intercity connector (zoom 6–10), progressively warmer once
you're inside a city (zoom 12–14+). This gives the same road a different personality depending on
whether you're looking at "which city is this near" or "which street is this," without needing any
extra tags or a second source of data.

## Districts get their own character

`landuse` is split into three layers (`residential`, `commercial`, `industrial`) instead of one,
each with its own barely-there tint (see COLOR_SYSTEM.md). The difference is subtle by design —
enough that a business district or an industrial zone reads slightly differently from a
residential one at a glance, without introducing a loud new color that would compete with price
markers.

## Typography

Three real, verified font weights only: `Noto Sans Regular`, `Noto Sans Bold`, `Noto Sans Italic`
(confirmed to exist on OpenFreeMap's glyph server / the `openmaptiles/fonts` project — no
"Medium" weight is generated there, so none is used here). Hierarchy is built from weight + size +
letter-spacing + halo, not from color alone:

- **Capital** (`place-city-capital`): Bold, largest, earliest zoom (3).
- **Major cities/towns** (`place-city-major`): Regular, large, zoom 5.
- **Minor towns** (`place-city-minor`): Regular, smaller, zoom 8. Villages/hamlets: never shown.
- **Districts** (`place-district`): Italic, uppercase, wide letter-spacing, quietest color —
  reads as a category label, not a place name.
- **Avenues/motorway names** (`road-label-major`, `class in [motorway, trunk]`): Bold.
- **Ordinary named streets** (`road-label-major`, `class in [primary, secondary]`): Regular.

All labels localize through `["coalesce", name:ru, name:ky, name]` — Russian first, Kyrgyz second,
OSM default last (see LAYERS.md for how to extend to more languages).

## Bishkek-specific rules

Two rules apply only inside a hand-picked bbox covering Bishkek's historic downtown grid
(`74.585–74.625° E, 42.865–42.885° N`), using MapLibre's `within` filter/paint expression directly
against an inline `Polygon` — no extra source or tileset needed:

1. **`building`**: `fill-outline-color` is a `case`/`within` expression — a softer, lower-contrast
   outline inside the bbox (`#EDE9E2` light / `#313133` dark) versus the normal outline elsewhere
   (`#D8D4CD` light / `#3A3A3C` dark). Downtown Bishkek's block density is high enough that the
   default outline weight turns into visual noise; softening it there (and only there) keeps the
   center legible without weakening building definition everywhere else.
2. **`place-district`**: suburb/quarter/neighbourhood labels are filtered *out* inside the same
   bbox. In the center, the capital label plus avenue/street names already carry enough
   orientation — extra district labels overlapping a dense downtown just add clutter.

To apply the same treatment to another city (e.g. Osh), duplicate the `Polygon` with that city's
downtown coordinates and reuse it in the same two places — no new layers required.

## Zoom logic

| Zoom | What appears |
|---|---|
| 1–2 | Country boundary only (`boundary-country`). |
| 3–5 | National capital label (bold, earliest of all place labels). |
| 5 | Major cities/towns by rank. |
| 6 | Motorways and avenues (trunk) — muted, intercity color. Rivers/canals. |
| 8 | Primary streets. Minor towns. Water body names. Residential quarter fill. |
| 9 | Commercial/industrial quarter fill. |
| 10 | Secondary streets. District labels (outside Bishkek center). City boundary lines. |
| 11 | Tertiary streets. Railway. |
| 12 | Avenue/street name labels start appearing along roads. |
| 13 | **Buildings appear** — the map's most important layer, right on schedule per the brief. |
| 14 | Building outlines resolve (already present as part of the same `building` layer). Alleys/service roads and their tunnels. |
| 15+ | Full detail across every layer; all zoom-interpolated widths/colors reach their final values. |

## Performance

- 25 layers total, no duplicates. Buildings collapse fill + outline into one layer via
  `fill-outline-color` (a `case`/`within` expression instead of a second stacked layer).
- No `fill-extrusion`, no shadow layers, no icon/sprite pipeline, no road-shield layers — all
  explicitly out of scope, all removed rather than left at zero-opacity.
- Every zoom transition uses `interpolate` (linear or exponential) — no `step` expressions that
  would cause a visible width/color "pop" as the user zooms.
- Boundary layers filter out `maritime`/`disputed`/`claimed_by` features at the data level, so the
  renderer never has to draw (and immediately hide) contested-border geometry.
