# East Bay map provenance

The current game uses one continuous **Oakland pilot window** connecting West Oakland, the Lake Merritt area, and Ivy Hill. Its display name is **East Bay**. Original cartoon SVG art sits over projected OpenStreetMap streets, buildings, parks, trees, and water shapes.

- Attribution: **© OpenStreetMap contributors**.
- Data license: **ODbL 1.0**.
- License information: https://www.openstreetmap.org/copyright
- Extract date: **October 25, 2026 (UTC)**.
- Source: twelve overlapping extracts from the official OpenStreetMap map API, `https://www.openstreetmap.org/api/0.6/map`.
- Every exact extract URL and fetch result is saved in `scripts/data/east-bay-source.json` and copied into the derived dataset's source metadata.
- Rendered bounds, west/south/east/north: `[-122.299, 37.7965, -122.2365, 37.827]`.
- Drawing: **2520 × 1580**.
- Derived dataset: `src/data/east-bay-map.json`, distributed at `/data/east-bay-map.json`.

The dataset contains 10,567 road segments, 16,716 building footprints, 1,308 green-space shapes, 98 water shapes, and 914 mapped tree points. These are geometry records, not a site inventory. The renderer samples tree points and adds original destination illustrations. It joins Lake Merritt's mapped multipolygon boundary instead of inventing a lake outline.

`scripts/prepare-world.py` deduplicates shared OSM elements by type/id and version, projects the geometry, and computes **twelve routes** between the four places using connected street segments. Route selection excludes motorway travel and ways marked private or prohibiting foot access. These are game animation routes, not checked pedestrian directions. Every generated route is tested against the extracted street segments.

| Place | Checked public address | Approximate anchor, latitude/longitude |
| --- | --- | --- |
| West Oakland Farm Park | 2847 Peralta Street | `37.8221718, -122.2858882` |
| deFremery Park | 1651 Adeline Street | `37.8124217, -122.2870094` |
| West Oakland Library | 1801 Adeline Street | `37.81295879, -122.28537639` |
| Gravity Garden | 2519 7th Avenue | `37.8019293, -122.2421346` |

The first three addresses were checked October 24 against ANV, the City of Oakland, and Oakland Public Library. Gravity Garden's address was checked October 25 against the OUFP-linked Garden Steward newsletter: https://garden-steward.beehiiv.com/p/earth-day-block-party-2026. OUFP describes its neighborhood as Ivy Hill: https://www.oufp.org/.

Gravity Garden's point is geocoded from its provider-published address. OSM way 477141854 is an address/building reference, **not a surveyed garden boundary or entrance**. Other anchors use mapped public sites and checked addresses. Destination drawings, beds, benches, people, interiors, learning experiments, and future indicators are stylized teaching material. Their positions and quantities do not establish site conditions or access.

## Regeneration and distribution

Normal `npm run dev` and `npm run build` copy the saved derived datasets into `public/data/`; they do not call an external map service. The game fetches its local East Bay JSON separately from the JavaScript bundle.

For an optional source refresh:

```sh
node scripts/download-world.mjs
python3 scripts/prepare-world.py east-bay
```

The downloader uses twelve small overlapping boxes and at most two simultaneous requests. Raw XML tiles are ignored. Keep the source manifest and derived attribution when distributing the map.

The earlier `west-oakland-map.json` and `ivy-hill-map.json` remain as historical source artifacts. They are no longer separate game views. Their corresponding generator arguments still work with the saved legacy extracts.
