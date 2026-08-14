# COLOR_SYSTEM.md

Two palettes, one architecture. Every row below exists in both `light.json` and `dark.json` at the
exact same layer id — only the color changed.

## Light palette

| Role | Layer id | Color |
|---|---|---|
| Background | `background` | `#F8F8F6` |
| Forest | `landcover-wood` | `#D4E8CE` |
| Park | `park` | `#DCEFD8` |
| Residential quarters | `landuse-residential` | `#F5F5F5` |
| Commercial quarters | `landuse-commercial` | `#F2EFE9` |
| Industrial quarters | `landuse-industrial` | `#EFEEEA` |
| Water | `water`, `waterway`, `water-name` (text) | `#CFE6FF` fill / `#9FB9CF` text |
| Buildings | `building` | fill `#E6E2DC`, outline `#D8D4CD` (Bishkek center: `#EDE9E2`) |
| Minor/tunnel roads | `tunnel-minor`, `road-minor` | `#F5F3EF` |
| Tertiary roads | `road-tertiary` | `#F4F2EE` |
| Secondary roads | `road-secondary` | `#F3F1ED` |
| Primary streets | `road-primary` | `#FFFFFF` |
| Avenues (trunk) | `road-trunk` | `#F2ECE1 → #FBE7C6` (zoom-interpolated) |
| Motorways | `road-motorway` | `#F5EEE1 → #FFDDA8` (zoom-interpolated) |
| Railway | `railway` | `#BDBDBD` |
| Boundaries | `boundary-country`, `boundary-city` | `#D8D4CD` |
| Capital label | `place-city-capital` | `#302F2D` |
| Major city label | `place-city-major` | `#3A3A38` |
| Minor city label | `place-city-minor` | `#5A5A56` |
| District label | `place-district` | `#8A8783` |
| Street/avenue label | `road-label-major` | `#6B6862` |

## Dark palette

| Role | Layer id | Color |
|---|---|---|
| Background | `background` | `#17181A` |
| Forest | `landcover-wood` | `#1E2A1E` |
| Park | `park` | `#20301F` |
| Residential quarters | `landuse-residential` | `#1F2022` |
| Commercial quarters | `landuse-commercial` | `#232321` |
| Industrial quarters | `landuse-industrial` | `#202224` |
| Water | `water`, `waterway`, `water-name` (text) | `#16232E` fill / `#6E8FAE` text |
| Buildings | `building` | fill `#2A2A2C`, outline `#3A3A3C` (Bishkek center: `#313133`, closer to fill = lower contrast) |
| Minor/tunnel roads | `tunnel-minor`, `road-minor` | `#2C2C2E` |
| Tertiary roads | `road-tertiary` | `#2E2E30` |
| Secondary roads | `road-secondary` | `#333335` |
| Primary streets | `road-primary` | `#4A4A4C` |
| Avenues (trunk) | `road-trunk` | `#3A342A → #5C4726` (zoom-interpolated) |
| Motorways | `road-motorway` | `#3F3728 → #704F22` (zoom-interpolated) |
| Railway | `railway` | `#5A5A5C` |
| Boundaries | `boundary-country`, `boundary-city` | `#3A3A3C` |
| Capital label | `place-city-capital` | `#F2F1EF` |
| Major city label | `place-city-major` | `#E7E6E3` |
| Minor city label | `place-city-minor` | `#C9C7C3` |
| District label | `place-district` | `#9A968F` |
| Street/avenue label | `road-label-major` | `#B9B6B0` |

Text halo color always matches its layer's local background tone (`#F8F8F6`/`#17181A` for most
labels, `#FFFFFF`/`#1F2022` for road labels sitting on top of light/dark road fills) so text stays
readable without a harsh outline.

## Design rules for adding a color

1. **Stay inside the tint family.** Every non-accent color in this system is a near-neutral —
   background, quarters, buildings and boundaries all sit within a few percent of each other in
   lightness. If a new color is more than ~8% different in lightness/saturation from its
   neighbors, it will read as an accent and compete with price markers — don't do that.
   Roads: `motorway > trunk > primary > secondary > tertiary > minor`.
2. **Reserve warmth for roads.** Avenues and motorways are the only warm (yellow/gold-leaning)
   tones on the map — that's what makes them read as a distinct, faster network. Don't introduce
   warmth anywhere else (parks, water, buildings) or that signal gets diluted.
3. **Keep the light/dark pair symmetric.** When you add a layer, add its color to both palettes in
   the same pass, and add a row to both tables above — the two styles must never drift out of
   sync structurally, only in color value.
4. **Markers own the saturation budget.** This entire palette is deliberately near-monochrome so
   that price markers, the selected-listing highlight, and cluster badges — which will use real,
   saturated brand colors — are the only saturated elements on screen.
