"""Clip Natural Earth's public-domain overview to the Bay Area; standard library only."""

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "scripts/data/natural-earth"
BOUNDS = [-123.6, 36.85, -121.1, 38.95]
# A context halo fills wide and tall viewports without inventing ocean at the
# eastern edge of the Bay Area window. Picking and navigation use BOUNDS.
WEST, SOUTH, EAST, NORTH = DATA_BOUNDS = [-125, 35.7, -119.7, 40.1]


def inside(point):
    return WEST <= point[0] <= EAST and SOUTH <= point[1] <= NORTH


def intersects(points):
    return bool(points) and not (
        max(p[0] for p in points) < WEST or min(p[0] for p in points) > EAST
        or max(p[1] for p in points) < SOUTH or min(p[1] for p in points) > NORTH
    )


def rounded(points):
    return [[round(p[0], 6), round(p[1], 6)] for p in points]


def clip_ring(points):
    """Sutherland–Hodgman clipping against the four sides of the window."""
    result = points[:-1] if points and points[0] == points[-1] else points[:]
    for axis, boundary, lower in [(0, WEST, True), (0, EAST, False), (1, SOUTH, True), (1, NORTH, False)]:
        output = []
        if not result:
            break
        previous = result[-1]
        previous_inside = previous[axis] >= boundary if lower else previous[axis] <= boundary
        for point in result:
            current_inside = point[axis] >= boundary if lower else point[axis] <= boundary
            if current_inside != previous_inside:
                fraction = (boundary - previous[axis]) / (point[axis] - previous[axis])
                output.append([previous[i] + fraction * (point[i] - previous[i]) for i in (0, 1)])
            if current_inside:
                output.append(point)
            previous, previous_inside = point, current_inside
        result = output
    if len(result) < 3:
        return []
    return rounded(result + [result[0]])


def clip_segment(a, b):
    """Liang–Barsky clipping preserves roads that cross the entire window."""
    dx, dy = b[0] - a[0], b[1] - a[1]
    low, high = 0, 1
    for p, q in [(-dx, a[0] - WEST), (dx, EAST - a[0]), (-dy, a[1] - SOUTH), (dy, NORTH - a[1])]:
        if p == 0:
            if q < 0:
                return None
            continue
        ratio = q / p
        if p < 0:
            low = max(low, ratio)
        else:
            high = min(high, ratio)
        if low > high:
            return None
    return rounded([[a[0] + low * dx, a[1] + low * dy], [a[0] + high * dx, a[1] + high * dy]])


def clip_line(points):
    parts, current = [], []
    for a, b in zip(points, points[1:]):
        segment = clip_segment(a, b)
        if segment:
            if current and current[-1] != segment[0]:
                parts.append(current)
                current = []
            current.extend(segment if not current else segment[1:])
        elif current:
            parts.append(current)
            current = []
    if current:
        parts.append(current)
    return parts


def features(name):
    return json.loads((RAW / f"ne_10m_{name}.geojson").read_text())["features"]


def polygons(name):
    output = []
    for feature in features(name):
        geometry = feature["geometry"]
        if not geometry:
            continue
        shapes = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
        for polygon in shapes:
            if not polygon or not intersects(polygon[0]):
                continue
            rings = [clip_ring(ring) for ring in polygon]
            if rings and rings[0]:
                output.append({"rings": [ring for ring in rings if ring]})
    return output


roads = []
for feature in features("roads"):
    geometry = feature["geometry"]
    if not geometry:
        continue
    lines = [geometry["coordinates"]] if geometry["type"] == "LineString" else geometry["coordinates"]
    for points in lines:
        if not intersects(points):
            continue
        properties = feature["properties"]
        for part in clip_line(points):
            roads.append({
                "kind": properties.get("type", "Road"),
                "name": properties.get("name") or properties.get("number") or "",
                "points": part,
            })

cities = []
for feature in features("populated_places"):
    point = feature["geometry"]["coordinates"]
    if BOUNDS[0] <= point[0] <= BOUNDS[2] and BOUNDS[1] <= point[1] <= BOUNDS[3]:
        properties = feature["properties"]
        cities.append({"name": properties["NAME"], "coordinates": rounded([point])[0], "population": properties.get("POP_MAX", 0)})

places = json.loads((ROOT / "scripts/data/bay-area-places.json").read_text())
by_name = {city["name"]: city for city in cities}
for place in places["places"]:
    existing = by_name.get(place["name"], {})
    by_name[place["name"]] = {
        "name": place["name"],
        "coordinates": place["coordinates"],
        # Population is only a historical label-priority hint, never a displayed statistic.
        "population": max(place["population"], existing.get("population", 0)),
    }
cities = list(by_name.values())

data = {
    "version": 1,
    "bounds": BOUNDS,
    "dataBounds": DATA_BOUNDS,
    "source": json.loads((ROOT / "scripts/data/bay-area-source.json").read_text()),
    "placesSource": places["source"],
    "land": polygons("land"),
    "lakes": polygons("lakes"),
    "urban": polygons("urban_areas"),
    "roads": roads,
    "cities": sorted(cities, key=lambda city: -city["population"]),
}
destination = ROOT / "src/data/bay-area-map.json"
destination.write_text(json.dumps(data, separators=(",", ":")) + "\n")
print(json.dumps({
    "bytes": destination.stat().st_size,
    "land": len(data["land"]), "lakes": len(data["lakes"]), "urban": len(data["urban"]),
    "roads": len(roads), "cities": cities,
}))
