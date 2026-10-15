"""Offline DATA-01 screening only; never imported by inference or publication.

Uses only the standard library. Polygon tests are planar in CRS84 and scoped to
the Philippine study rectangle. This is not a topology validator, a navigational
coastline, a jurisdiction check, or a production ocean-eligibility predicate.
"""

import argparse
from collections import Counter
import hashlib
import json
import math
from pathlib import Path


HERE = Path(__file__).resolve().parent
STUDY_BOUNDS = (117.0, 5.0, 127.0, 21.0)  # west, south, east, north; not an EEZ
SOURCE_COMMIT = "ace5fed0eaf3c6c03c951e75b439ba8fffbc218e"
SOURCE_URL = (
    "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/"
    f"{SOURCE_COMMIT}/geojson/ne_10m_land.geojson"
)
SOURCE_SHA256 = "1ac90796408bc6ad6911d69448485d3c4dbf2190370080368a09976e1c9f7416"
SUBSET_SHA256 = "e3944b196f38446ab971b53a188ac9b12b1b1a2bb05bbf4259c4202b9d069107"


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def position(value):
    """Require explicit [longitude, latitude]; do not coerce or swap values."""
    return (
        isinstance(value, (list, tuple))
        and len(value) == 2
        and all(type(v) in (int, float) and math.isfinite(v) for v in value)
        and -180 <= value[0] <= 180
        and -90 <= value[1] <= 90
    )


def bounds(ring):
    return (min(p[0] for p in ring), min(p[1] for p in ring),
            max(p[0] for p in ring), max(p[1] for p in ring))


def inside_box(point, box):
    return box[0] <= point[0] <= box[2] and box[1] <= point[1] <= box[3]


def overlapping(a, b):
    return a[0] <= b[2] and b[0] <= a[2] and a[1] <= b[3] and b[1] <= a[3]


def polygons(document):
    """Read Polygon/MultiPolygon only; reject missing/unsupported geometries."""
    if not isinstance(document, dict) or document.get("type") != "FeatureCollection":
        raise ValueError("Expected a land FeatureCollection")
    crs = document.get("crs")
    if crs is not None and crs != {
        "type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}
    }:
        raise ValueError("Only CRS84 longitude/latitude geometry is supported")
    features = document.get("features")
    if not isinstance(features, list) or not features:
        raise ValueError("Empty or missing land features")
    for feature in features:
        if not isinstance(feature, dict) or feature.get("type") != "Feature":
            raise ValueError("Expected a GeoJSON Feature")
        geometry = feature.get("geometry")
        if not isinstance(geometry, dict):
            raise ValueError("Missing land geometry")
        coordinates = geometry.get("coordinates")
        if not isinstance(coordinates, list) or not coordinates:
            raise ValueError("Empty or missing polygon coordinates")
        if geometry.get("type") == "Polygon":
            yield coordinates
        elif geometry.get("type") == "MultiPolygon":
            yield from coordinates
        else:
            raise ValueError("Only Polygon/MultiPolygon land geometry is supported")


def validate_polygon(polygon):
    if not isinstance(polygon, list) or not polygon:
        raise ValueError("Empty polygon")
    for ring in polygon:
        if (not isinstance(ring, list) or len(ring) < 4
                or not all(position(p) for p in ring) or ring[0] != ring[-1]):
            raise ValueError("Rings must be closed with finite CRS84 positions")
        area2 = sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(ring, ring[1:]))
        if area2 == 0 or any(abs(a[0] - b[0]) > 180 for a, b in zip(ring, ring[1:])):
            raise ValueError("Degenerate or antimeridian-crossing ring")


def on_segment(point, a, b):
    # Numerical tolerance only (~sub-mm here), not a shore buffer in metres.
    cross = (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0])
    return abs(cross) <= 1e-12 and inside_box(point, bounds((a, b)))


def in_ring(point, ring):
    inside = False
    x, y = point
    for a, b in zip(ring, ring[1:]):
        if on_segment(point, a, b):
            return "boundary"
        if (a[1] > y) != (b[1] > y):
            crossing_x = a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1])
            if x < crossing_x:
                inside = not inside
    return "inside" if inside else "outside"


def edge_meets_box(a, b, box):
    """Segment/rectangle clipping, including a segment enclosing the box."""
    start, end = 0.0, 1.0
    for axis, low, high in ((0, box[0], box[2]), (1, box[1], box[3])):
        delta = b[axis] - a[axis]
        if delta == 0:
            if not low <= a[axis] <= high:
                return False
        else:
            t1, t2 = sorted(((low - a[axis]) / delta, (high - a[axis]) / delta))
            start, end = max(start, t1), min(end, t2)
            if start > end:
                return False
    return True


def polygon_meets_box(polygon, box):
    outer = polygon[0]
    return overlapping(bounds(outer), box) and (
        any(edge_meets_box(a, b, box) for a, b in zip(outer, outer[1:]))
        or in_ring(box[:2], outer) != "outside"
    )


class ScreeningMask:
    """Candidate classification, with boundary/hole/unknown kept distinct."""

    def __init__(self, document):
        self.parts = []
        for polygon in polygons(document):
            validate_polygon(polygon)
            self.parts.append((bounds(polygon[0]), polygon))

    def point(self, point):
        if not position(point) or not inside_box(point, STUDY_BOUNDS):
            return "unknown"
        result = "water_candidate"
        for box, polygon in self.parts:
            if not inside_box(point, box):
                continue
            outer = in_ring(point, polygon[0])
            if outer == "boundary":
                return "boundary"
            if outer == "outside":
                continue
            holes = [in_ring(point, ring) for ring in polygon[1:]]
            if "boundary" in holes:
                return "boundary"
            if "inside" in holes:
                result = "unknown"  # A lake/hole is not evidence of ocean.
            else:
                return "land"
        return result

    def cell(self, box):
        if (not isinstance(box, (list, tuple)) or len(box) != 4
                or not position(box[:2]) or not position(box[2:])
                or not box[0] < box[2] or not box[1] < box[3]
                or not inside_box(box[:2], STUDY_BOUNDS)
                or not inside_box(box[2:], STUDY_BOUNDS)):
            return "unknown"
        for part_box, polygon in self.parts:
            if overlapping(box, part_box) and any(
                edge_meets_box(a, b, box)
                for ring in polygon for a, b in zip(ring, ring[1:])
            ):
                # Includes islands entirely inside a cell with four wet corners.
                return "coastal_or_mixed"
        corners = ((box[0], box[1]), (box[2], box[1]),
                   (box[2], box[3]), (box[0], box[3]))
        labels = {self.point(p) for p in corners}
        return labels.pop() if len(labels) == 1 else "coastal_or_mixed"


def prepare(source_path, output_dir):
    """Reproduce the bundled subset from exactly the pinned upstream bytes."""
    raw = source_path.read_bytes()
    if digest(raw) != SOURCE_SHA256:
        raise ValueError("Upstream SHA-256 differs from the pinned Natural Earth snapshot")
    selected = []
    for polygon in polygons(json.loads(raw)):
        if polygon_meets_box(polygon, STUDY_BOUNDS):
            validate_polygon(polygon)
            selected.append({"type": "Feature", "properties": {}, "geometry": {
                "type": "Polygon", "coordinates": polygon
            }})
    document = {"type": "FeatureCollection", "features": selected}
    ScreeningMask(document)
    output_dir.mkdir(parents=True, exist_ok=True)
    geometry_path = output_dir / "natural_earth_land.geojson"
    # Compact encoding preserves all upstream coordinate values without rounding.
    geometry_path.write_text(json.dumps(document, separators=(",", ":"), allow_nan=False) + "\n",
                             encoding="utf-8")
    write_json(output_dir / "source.json", {
        "candidate": "Natural Earth 1:10 million land, v5.0.0 GeoJSON snapshot",
        "upstream_url": SOURCE_URL,
        "upstream_commit": SOURCE_COMMIT,
        "upstream_sha256": SOURCE_SHA256,
        "geometry_sha256": digest(geometry_path.read_bytes()),
        "license": "Public domain",
        "license_url": "https://www.naturalearthdata.com/about/terms-of-use/",
        "coordinate_order": "longitude,latitude (CRS84)",
        "study_bounds": list(STUDY_BOUNDS),
        "selection": "Keep every complete polygon whose exterior intersects study_bounds; no clipping, simplification, buffering or coordinate rounding",
        "polygon_count": len(selected),
        "production_approved": False,
    })


def evaluate(candidate_dir, fixtures_path):
    raw = (candidate_dir / "natural_earth_land.geojson").read_bytes()
    source = json.loads((candidate_dir / "source.json").read_text(encoding="utf-8"))
    if (source.get("geometry_sha256") != digest(raw)
            or digest(raw) != SUBSET_SHA256
            or source.get("upstream_sha256") != SOURCE_SHA256
            or source.get("upstream_commit") != SOURCE_COMMIT
            or source.get("upstream_url") != SOURCE_URL
            or source.get("study_bounds") != list(STUDY_BOUNDS)
            or source.get("production_approved") is not False):
        raise ValueError("Candidate checksum/provenance/study bounds mismatch; re-run prepare")
    fixture_raw = fixtures_path.read_bytes()
    fixtures = json.loads(fixture_raw)
    if not isinstance(fixtures.get("cases"), list) or not fixtures["cases"]:
        raise ValueError("Nonempty screening fixtures required")
    mask = ScreeningMask(json.loads(raw))
    rows = []
    for case in fixtures["cases"]:
        if case["kind"] == "point":
            actual = mask.point(case["coordinates"])
        elif case["kind"] == "cell":
            actual = mask.cell(case["bounds"])
        else:
            raise ValueError("Unknown fixture kind")
        expected = case.get("expected")
        rows.append({"id": case["id"], "expected": expected, "actual": actual,
                     "review_status": case["review_status"],
                     "screening": "unscored" if expected is None else
                     ("match" if actual == expected else "mismatch")})
    return {
        "purpose": "Offline candidate screening; matches are not accuracy or release approval",
        "production_approved": False,
        "pending_gates": ["C01", "D08"],
        "source": source,
        "fixture_version": fixtures["version"],
        "fixture_sha256": digest(fixture_raw),
        "counts": dict(sorted(Counter(row["screening"] for row in rows).items())),
        "review_counts": dict(sorted(Counter(row["review_status"] for row in rows).items())),
        "cases": rows,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    prep = subparsers.add_parser("prepare", help="Extract the pinned source for offline evaluation")
    prep.add_argument("source", type=Path)
    prep.add_argument("output_dir", type=Path)
    run = subparsers.add_parser("evaluate", help="Report screening agreements, never approval")
    run.add_argument("--candidate-dir", type=Path, default=HERE / "fixtures")
    run.add_argument("--fixtures", type=Path, default=HERE / "fixtures" / "controls.json")
    run.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        if args.command == "prepare":
            prepare(args.source, args.output_dir)
        else:
            write_json(args.output, evaluate(args.candidate_dir, args.fixtures))
    except (OSError, ValueError, KeyError, TypeError) as exc:
        parser.exit(2, f"Screening failed: {exc}\n")


if __name__ == "__main__":
    main()
