"""Derive attributed cartoon-map geometry and routes from saved OSM extracts."""

import heapq
import json
from pathlib import Path
import sys
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent
region = sys.argv[1] if len(sys.argv) > 1 else "east-bay"
assert region in {"west-oakland", "ivy-hill", "east-bay"}, "Choose east-bay, west-oakland, or ivy-hill."
source = ROOT / f"scripts/data/{region}.osm"
metadata = None
if region == "east-bay":
    metadata = json.loads((ROOT / "scripts/data/east-bay-source.json").read_text())
    assert all(extract["ok"] for extract in metadata["extracts"]), "Every map tile must be complete."
    elements = {}
    for extract in metadata["extracts"]:
        for element in ET.parse(ROOT / extract["filename"]).getroot():
            if element.tag not in {"node", "way", "relation"}:
                continue
            key = (element.tag, element.attrib["id"])
            if key not in elements or int(element.attrib.get("version", 0)) > int(elements[key].attrib.get("version", 0)):
                elements[key] = element
    tree = ET.Element("osm")
    tree.extend(elements.values())
else:
    tree = ET.parse(source).getroot()
nodes = {
    node.attrib["id"]: (float(node.attrib["lat"]), float(node.attrib["lon"]))
    for node in tree.findall("node")
}
WEST, SOUTH, EAST, NORTH = {
    "west-oakland": (-122.2948, 37.8096, -122.2792, 37.8247),
    "ivy-hill": (-122.2462, 37.7988, -122.2382, 37.8051),
    "east-bay": (-122.299, 37.7965, -122.2365, 37.827),
}[region]
WIDTH, HEIGHT = (2520, 1580) if region == "east-bay" else (1180, 920)


def project(lat, lon):
    return [
        round(65 + (lon - WEST) / (EAST - WEST) * (WIDTH - 130), 2),
        round(50 + (NORTH - lat) / (NORTH - SOUTH) * (HEIGHT - 100), 2),
    ]


def inside(coord):
    lat, lon = coord
    return SOUTH <= lat <= NORTH and WEST <= lon <= EAST


roads, buildings, greens, water, pitches, trees, anchors = [], [], [], [], [], [], {}
if region in {"ivy-hill", "east-bay"}:
    anchors["gravity"] = {
        "osmId": "477141854",
        "coordinates": [37.8019293, -122.2421346],
        "note": "Approximate point for the provider-published 2519 7th Avenue address, geocoded with OpenStreetMap. Not a surveyed garden boundary or entrance.",
        "addressSource": "https://garden-steward.beehiiv.com/p/earth-day-block-party-2026",
    }
graph = {}
walkable = {"residential", "tertiary", "secondary", "unclassified", "living_street", "pedestrian", "footway", "path"}
for way in tree.findall("way"):
    tags = {tag.attrib["k"]: tag.attrib["v"] for tag in way.findall("tag")}
    refs = [node.attrib["ref"] for node in way.findall("nd") if node.attrib["ref"] in nodes]
    coords = [nodes[ref] for ref in refs]
    if not coords or not any(inside(coord) for coord in coords):
        continue
    points = [project(*coord) for coord in coords]
    name = tags.get("name", "")
    way_id = way.attrib["id"]
    if region in {"west-oakland", "east-bay"} and "Farm Park" in name:
        anchors["farm"] = {"osmId": way_id, "coordinates": [sum(c[i] for c in coords[:-1]) / (len(coords) - 1) for i in (0, 1)]}
    if region in {"west-oakland", "east-bay"} and way_id == "25001377":
        anchors["park"] = {"osmId": way_id, "coordinates": [37.8124217, -122.2870094]}
    if region in {"west-oakland", "east-bay"} and way_id == "43919891":
        anchors["library"] = {"osmId": way_id, "coordinates": [sum(c[i] for c in coords[:-1]) / (len(coords) - 1) for i in (0, 1)]}
    highway = tags.get("highway")
    if highway and highway not in {"proposed", "construction", "steps", "motorway_link", "trunk_link"}:
        roads.append({"id": way_id, "name": name, "kind": highway, "points": points})
        if highway in walkable and tags.get("access") != "private" and tags.get("foot") != "no":
            for a, b in zip(refs, refs[1:]):
                if not inside(nodes[a]) or not inside(nodes[b]):
                    continue
                pa, pb = project(*nodes[a]), project(*nodes[b])
                distance = ((pa[0] - pb[0]) ** 2 + (pa[1] - pb[1]) ** 2) ** .5
                graph.setdefault(a, {})[b] = distance
                graph.setdefault(b, {})[a] = distance
    if "building" in tags and tags["building"] != "no" and len(points) >= 4:
        area = abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(points, points[1:]))) / 2
        if area > 9:
            buildings.append({"id": way_id, "points": points, "area": round(area)})
    if tags.get("leisure") in {"park", "garden"} or tags.get("landuse") in {"grass", "forest", "farmland", "recreation_ground"}:
        greens.append({"id": way_id, "name": name, "points": points})
    if tags.get("natural") == "water" or tags.get("leisure") == "swimming_pool":
        water.append({"id": way_id, "name": name, "points": points})
    if tags.get("leisure") == "pitch":
        pitches.append({"id": way_id, "kind": tags.get("sport", ""), "points": points})

# Lakes are often multipolygons: join their actual outer boundary segments.
ways_by_id = {way.attrib["id"]: way for way in tree.findall("way")}
for relation in tree.findall("relation"):
    tags = {tag.attrib["k"]: tag.attrib["v"] for tag in relation.findall("tag")}
    if tags.get("natural") != "water" or tags.get("type") != "multipolygon":
        continue
    segments = []
    for member in relation.findall("member"):
        if member.attrib["type"] != "way" or member.attrib.get("role", "") not in {"outer", ""}:
            continue
        way = ways_by_id.get(member.attrib["ref"])
        if way is not None:
            refs = [nd.attrib["ref"] for nd in way.findall("nd") if nd.attrib["ref"] in nodes]
            if refs:
                segments.append(refs)
    rings = []
    while segments:
        ring = segments.pop()
        while ring[0] != ring[-1]:
            for index, segment in enumerate(segments):
                if ring[-1] == segment[0]:
                    ring.extend(segment[1:])
                elif ring[-1] == segment[-1]:
                    ring.extend(list(reversed(segment))[1:])
                else:
                    continue
                segments.pop(index)
                break
            else:
                break
        if ring[0] == ring[-1] and any(inside(nodes[ref]) for ref in ring):
            rings.append(ring)
    for index, ring in enumerate(rings):
        water.append({"id": f"relation-{relation.attrib['id']}-{index}", "name": tags.get("name", ""), "points": [project(*nodes[ref]) for ref in ring]})

for node in tree.findall("node"):
    tags = {tag.attrib["k"]: tag.attrib["v"] for tag in node.findall("tag")}
    if tags.get("natural") == "tree" and inside(nodes[node.attrib["id"]]):
        trees.append(project(*nodes[node.attrib["id"]]))

expected = {"west-oakland": {"farm", "park", "library"}, "ivy-hill": {"gravity"}, "east-bay": {"farm", "park", "library", "gravity"}}
assert set(anchors) == expected[region], "Checked destinations must be present."
for anchor in anchors.values():
    anchor["point"] = project(*anchor["coordinates"])
    anchor["streetNode"] = min(graph, key=lambda ref: sum((project(*nodes[ref])[i] - anchor["point"][i]) ** 2 for i in (0, 1)))


def route(start, end):
    source_node, end_node = anchors[start]["streetNode"], anchors[end]["streetNode"]
    frontier, distances, previous = [(0, source_node)], {source_node: 0}, {}
    while frontier:
        cost, node = heapq.heappop(frontier)
        if node == end_node:
            break
        if cost > distances[node]:
            continue
        for neighbor, weight in graph[node].items():
            next_cost = cost + weight
            if next_cost < distances.get(neighbor, float("inf")):
                distances[neighbor] = next_cost
                previous[neighbor] = node
                heapq.heappush(frontier, (next_cost, neighbor))
    assert end_node in distances, f"No public-street route from {start} to {end}."
    refs, current = [end_node], end_node
    while current != source_node:
        current = previous[current]
        refs.append(current)
    return [project(*nodes[ref]) for ref in reversed(refs)]


routes = {f"{a}-{b}": route(a, b) for a in anchors for b in anchors if a != b}
for anchor in anchors.values():
    anchor["arrival"] = project(*nodes[anchor.pop("streetNode")])

data = {
    "width": WIDTH,
    "height": HEIGHT,
    "bounds": [WEST, SOUTH, EAST, NORTH],
    "source": {
        "name": "OpenStreetMap contributors",
        "url": "https://www.openstreetmap.org/copyright",
        "license": "ODbL 1.0",
        "checkedAt": metadata["checkedAt"] if metadata else "2026-10-24" if region == "west-oakland" else "2026-10-25",
        "extractUrl": {
            "west-oakland": "https://api.openstreetmap.org/api/0.6/map?bbox=-122.301,37.808,-122.278,37.832",
            "ivy-hill": "https://api.openstreetmap.org/api/0.6/map?bbox=-122.2473,37.7975,-122.2372,37.8064",
            "east-bay": "https://www.openstreetmap.org/api/0.6/map",
        }[region],
        **({"extractUrls": [extract["url"] for extract in metadata["extracts"]]} if metadata else {}),
        "note": "Projected, simplified public map geometry. Illustrations are original and are not surveyed site plans.",
    },
    "anchors": anchors,
    "routes": routes,
    "roads": roads,
    "buildings": buildings,
    "greens": greens,
    "water": water,
    "pitches": pitches,
    "trees": trees,
}
for destination in (ROOT / f"src/data/{region}-map.json", ROOT / f"public/data/{region}-map.json"):
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(json.dumps(data, separators=(",", ":")) + "\n")
print(json.dumps({"region": region, "roads": len(roads), "buildings": len(buildings), "greens": len(greens), "water": len(water), "namedWater": [{"id": shape["id"], "name": shape["name"]} for shape in water if shape["name"]], "trees": len(trees), "anchors": anchors, "routes": {key: len(value) for key, value in routes.items()}}))
