# Planting checks and neighborhood projects

Implemented October 25, 2026 (UTC). The experience starts on the cartoon East Bay map and can zoom out across the Bay Area. Controls are Check a spot, Start a garden, and Projects.

## Geography and the planting check

Every chosen screen point is inverted through the active map camera and the saved map projection to a latitude/longitude. Zooming and panning do not change the meaning of a chosen point. Dragging pans without opening a check; Enter or Choose center offers keyboard selection. Existing place drawings can be checked in Check a spot mode while Explore retains their educational visits.

OpenStreetMap polygons identify mapped water, buildings, and green space, with nearby road geometry providing a short spot label. These features are not ownership records or soil measurements. The server repeats the mapped-feature check when creating or editing a project; a client cannot claim a water pin is confirmed garden land.

Outside the detailed Oakland window, the saved regional layer provides generalized land/water context and a nearby city label. Streets, buildings, planting-site geometry, elevation, slope, and local climate are unknown there. No distant point is labeled with the nearest Oakland street. Choosing a city label zooms the map; an empty spot or Choose center selects geographic coordinates. Garden proposals, joining, and organizer edits work throughout the rectangular Bay Area coverage window documented in [map provenance](map-provenance.md).

The six-plant shortlist covers food and habitat: tomatoes, lettuce, kale, California poppy, California fuchsia, and California buckwheat. Its screening rules use reported sun, water, drainage, growing medium, soil-review status, and planting season. They return Check first, Needs a change, or Promising with your answers. Incomplete observations never produce Promising. Water access includes establishment care even for low-water natives. California-native status does not establish that every variety is locally native or suitable at every site.

This is a simplified educational screen, not professional site design. It does not calculate building/tree shade, parcel sun hours, soil pH, contamination, property boundaries, utilities, or exact frost dates. Garden dimensions, mature plant sizes, local varieties, and the suitability of any “other plants” still need review. A visitor selecting “Test reviewed for this use” reports their own review; the app has not read or certified that test.

## Primary sources and saved environmental data

- UC ANR / UC Master Gardeners: [Creating a Family Garden Bed](https://ucanr.edu/blog/hort-coco-uc-master-gardener-program-contra-costa/article/creating-family-garden-bed) and [Vegetable Gardening Handbook for Beginners](https://ucanr.edu/sites/default/files/2025-03/vegetable_gardening_handbook_for_beginners.pdf). Sun bands and the shortlist’s numerical screening thresholds are authored simplifications, rather than exact universal plant requirements.
- CNPS / Calscape: [California poppy](https://calscape.org/plant/1602/Eschscholzia-californica-(California-Poppy)), [California fuchsia](https://calscape.org/plant/1413/Epilobium-canum-(California-Fuchsia)), and [California buckwheat](https://calscape.org/plant/1502/Eriogonum-fasciculatum-(California-Buckwheat)). Care links accompany each plant.
- UC ANR: [Soil contaminants and soil testing](https://ucanr.edu/site/urban-agriculture/soil-contaminants-and-soil-testing). Unknown soil remains an explicit check; verified imported container soil is a visitor report.
- [Open-Meteo / Copernicus ERA5 historical weather](https://open-meteo.com/en/docs/historical-weather-api): all 3,653 daily records for 2016–2025 at one regional reference. The fixed ERA5 model is approximately 25 km resolution. The requested reference is 37.81175, −122.26775; the returned grid reference is 37.75, −122.25. Daily modeled highs/lows and precipitation are aggregated by month and year. They are reanalysis estimates, not local station measurements, official 30-year climate normals, a USDA hardiness-zone lookup, or a prediction for a particular bed.
- [Open-Meteo / Copernicus DEM GLO-90 (2021)](https://open-meteo.com/en/docs/elevation-api): 504 elevation samples in a 28 × 18 grid covering the same pilot bounds. Source resolution is 90 m; sample spacing is about 205 m. Displayed height uses the nearest sample. Area slope uses neighboring elevation differences and geographic distance; it cannot resolve beds, walls, street drains, or small slopes.

The model gives average annual precipitation of 477.7 mm and June–August precipitation of 1.4 mm over this reference period. These are regional context, not watering prescriptions. The same climate reference is deliberately used throughout this small Oakland window instead of inventing differences between adjacent map clicks.

The climate reference is only shown for spots within the Oakland pilot. The terrain grid likewise returns no value beyond its own bounds. Other Bay Area spots display **Unknown** for these measurements and an explicit coverage note; their plant shortlist uses reported observations, with local climate and variety review still required.

`src/data/site-environment.json` records source names, documentation links, exact request URLs, requested/returned coordinates, model period, resolutions, bounds, and check date. The build copies it to a locally served asset. A missing dataset produces Unknown rather than invented measurements. Attribution is visible in the site’s expandable evidence and Sources.

Manual refresh: `node scripts/prepare-site-data.mjs --refresh --terrain`. This downloads public provider data and regenerates the compact asset. Without refresh flags the script derives the asset from cached raw responses. Normal dev/build makes no environmental API calls and requires no API key.

## Project workflow

The organizer picks a point and creates a New garden, Revive a garden, or Landscape proposal. The form has two steps: the idea, then people and resources. Required information covers a name, goal, plants or other named plants, USD budget, 1–50 additional volunteers, requested roles, organizer nickname, permission status, and a continuing care plan. Optional information includes a work day, budget breakdown, and meetup note. The organizer is not counted against the requested volunteer spaces.

Projects retain the selected point, mapped context, and reported site answers. Existing garden destinations default to Revive a garden; this is a proposed activity, not a change to a provider’s factual listing. Pending permission is visibly Planning only. Reported confirmed permission needs an explanation and stays labeled as unverified.

Project pins and the board open the same detail page. Neighbors can join once per visitor identity, choose a requested role, share availability, update their part, or leave. Organizers can update resources and close/reopen signups. Edits preserve joined members and their roles, reject stale revisions, and cannot shrink capacity below the team already joined. An idempotent creation key prevents duplicate proposals when retrying a submission.

The budget is a planning target. Publishing and joining involve no payments, legal commitments, direct messages, or private contact fields.

## Local persistence and visitor identity

The Vite development and preview servers both mount `/api/community`. Projects and memberships are shared server data in `.local-data/gardens.sqlite`, not browser-only mock records. Node 24’s built-in SQLite adds no database dependency. Transactions and a write lock protect concurrent joins, including when two local server processes share the same database.

A random HttpOnly, SameSite cookie identifies the anonymous visitor; only its hash is stored. Public responses omit that hash and the creation key. A retained cookie preserves organizer/member controls after a server restart. Clearing cookies or ending a private browser session loses that identity; there is no account recovery yet. Dev and preview use separate cookies. Keep one origin/profile for organizer work.

The default data directory is ignored by Git and kept separate from generated assets. To back up a pilot, stop its server and copy the `.local-data` directory. `COMMON_GROUND_DATA_DIR` overrides the directory for an isolated test. Saved data is validated before mutations; damaged data returns an error and is retained rather than replaced by an empty board. An existing `gardens.json`, if present, is imported only when the SQLite store has no initial record.

The browser refreshes the shared board while visible and on focus. Submitted changes update the acting visitor immediately. Journal progress and local directory reviews retain their previous separate storage.

Both servers bind to loopback. The API accepts local Host values and same-origin writes, so this implementation can be exercised by separate browser visitors on this computer. A copied link does not make the server reachable from neighbors’ computers.

## Online pilot boundary

An online neighborhood pilot would add a hosted API/database, recoverable accounts, moderation, an agreed steward-permission process, and appropriate contact/privacy controls. The current local API accepts local hosts and same-origin writes. The source is maintained in the public [KuanL1u/common-ground repository](https://github.com/KuanL1u/common-ground); an online deployment remains future work.

The sources support preliminary planning and learning. A youth/steward review and a real educational evaluation remain separate from software playtesting.
