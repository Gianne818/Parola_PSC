"""Offline behavioral checks; synthetic geometry is not Philippine ground truth."""

import copy
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from backend.science.ocean_mask.evaluate import (
    HERE, STUDY_BOUNDS, ScreeningMask, digest, edge_meets_box, evaluate,
    polygon_meets_box, prepare,
)


def rectangle(west, south, east, north):
    return [[west, south], [east, south], [east, north], [west, north], [west, south]]


def collection(*polygons):
    return {"type": "FeatureCollection", "features": [
        {"type": "Feature", "properties": {},
         "geometry": {"type": "Polygon", "coordinates": polygon}}
        for polygon in polygons
    ]}


class GeometryTests(unittest.TestCase):
    def setUp(self):
        self.outer = rectangle(122, 10, 123, 11)
        self.mask = ScreeningMask(collection([self.outer]))

    def test_land_and_water_are_decided_by_geometry_within_study_area(self):
        self.assertEqual(self.mask.point([122.5, 10.5]), "land")
        self.assertEqual(self.mask.point([120, 8]), "water_candidate")

    def test_ring_direction_does_not_change_classification(self):
        reverse = ScreeningMask(collection([self.outer[::-1]]))
        for p in ([122.5, 10.5], [120, 8], [122, 10.5]):
            with self.subTest(point=p):
                self.assertEqual(reverse.point(p), self.mask.point(p))

    def test_shoreline_vertices_and_edges_are_never_water_candidates(self):
        for p in ([122, 10], [123, 11], [122, 10.5], [122.5, 11]):
            with self.subTest(point=p):
                self.assertEqual(self.mask.point(p), "boundary")

    def test_water_near_shore_has_no_blanket_one_km_buffer(self):
        self.assertEqual(self.mask.point([121.99999, 10.5]), "water_candidate")
        self.assertEqual(self.mask.point([122.00001, 10.5]), "land")

    def test_holes_are_unknown_and_not_assumed_to_be_ocean(self):
        hole = rectangle(122.2, 10.2, 122.8, 10.8)
        mask = ScreeningMask(collection([self.outer, hole]))
        self.assertEqual(mask.point([122.5, 10.5]), "unknown")
        self.assertEqual(mask.point([122.2, 10.5]), "boundary")
        self.assertEqual(mask.point([122.1, 10.5]), "land")
        self.assertEqual(mask.cell([122.3, 10.3, 122.4, 10.4]), "unknown")

    def test_an_island_in_a_hole_remains_land(self):
        mask = ScreeningMask(collection(
            [self.outer, rectangle(122.2, 10.2, 122.8, 10.8)],
            [rectangle(122.4, 10.4, 122.6, 10.6)],
        ))
        self.assertEqual(mask.point([122.5, 10.5]), "land")

    def test_multipolygons_keep_small_islands(self):
        document = collection([self.outer])
        document["features"][0]["geometry"] = {
            "type": "MultiPolygon",
            "coordinates": [[self.outer], [rectangle(124, 10, 124.001, 10.001)]],
        }
        self.assertEqual(ScreeningMask(document).point([124.0005, 10.0005]), "land")

    def test_invalid_or_unknown_coordinates_never_become_water(self):
        for p in (None, [], {}, [120], [120, 8, 0], ["120", 8], [True, 8],
                  [120, float("nan")], [float("inf"), 8], [123, 91],
                  [181, 10], [10.31, 123.89], [0, 0], [116, 10]):
            with self.subTest(point=p):
                self.assertEqual(self.mask.point(p), "unknown")

    def test_all_land_and_all_water_cells(self):
        self.assertEqual(self.mask.cell([122.2, 10.2, 122.8, 10.8]), "land")
        self.assertEqual(self.mask.cell([119.9, 7.9, 120.1, 8.1]), "water_candidate")

    def test_coastal_cell_is_not_classified_from_its_centroid(self):
        self.assertEqual(self.mask.point([121.95, 10.5]), "water_candidate")
        self.assertEqual(self.mask.cell([121.8, 10.3, 122.1, 10.7]), "coastal_or_mixed")

    def test_island_inside_cell_with_four_water_corners_is_detected(self):
        box = [121.9, 9.9, 123.1, 11.1]
        for p in ([box[0], box[1]], [box[0], box[3]], [box[2], box[1]], [box[2], box[3]]):
            self.assertEqual(self.mask.point(p), "water_candidate")
        self.assertEqual(self.mask.cell(box), "coastal_or_mixed")

    def test_tangent_cell_stays_coastal(self):
        self.assertEqual(self.mask.cell([121.5, 10, 122, 10.5]), "coastal_or_mixed")

    def test_invalid_partial_coverage_and_zero_area_cells_stay_unknown(self):
        for box in (None, [], [120, 8, 120, 9], [121, 9, 120, 8],
                    [116, 8, 118, 9], [120, "8", 121, 9], [120, 8, 121, float("nan")]):
            with self.subTest(box=box):
                self.assertEqual(self.mask.cell(box), "unknown")

    def test_selection_handles_containing_contained_crossing_and_disjoint_polygons(self):
        cases = [
            ([rectangle(116, 4, 128, 22)], True),
            ([rectangle(120, 10, 121, 11)], True),
            ([rectangle(116, 10, 118, 11)], True),
            ([rectangle(110, 0, 111, 1)], False),
            # Its bbox touches the study box; its triangle never does.
            ([[[116, 20.9], [116, 22], [117.1, 22], [116, 20.9]]], False),
        ]
        for polygon, expected in cases:
            with self.subTest(polygon=polygon):
                self.assertEqual(polygon_meets_box(polygon, STUDY_BOUNDS), expected)

    def test_segment_clipping_handles_a_line_passing_across_a_cell(self):
        self.assertTrue(edge_meets_box([121, 10.5], [124, 10.5], [122, 10, 123, 11]))
        self.assertFalse(edge_meets_box([121, 9], [124, 9], [122, 10, 123, 11]))

    def test_missing_malformed_or_unsupported_geometry_is_rejected(self):
        bad_documents = [None, {}, collection(), {"type": "FeatureCollection", "features": [None]}]
        good = collection([self.outer])
        for geometry in (None, {"type": "Point", "coordinates": [122, 10]},
                         {"type": "MultiPolygon", "coordinates": []},
                         {"type": "Polygon", "coordinates": [[]]}):
            document = copy.deepcopy(good)
            document["features"][0]["geometry"] = geometry
            bad_documents.append(document)
        bad_documents.append({**good, "crs": {"type": "name", "properties": {"name": "EPSG:3857"}}})
        for ring in (self.outer[:-1], [[122, 10], [122, 10], [122, 10], [122, 10]],
                     [[122, 10], [123, 10], [123, float("nan")], [122, 10]]):
            bad_documents.append(collection([ring]))
        for document in bad_documents:
            with self.subTest(document=document), self.assertRaises(ValueError):
                ScreeningMask(document)


class EvidenceTests(unittest.TestCase):
    def test_bundled_report_is_reproducible_and_preserves_review_limits(self):
        report = evaluate(HERE / "fixtures", HERE / "fixtures" / "controls.json")
        expected = json.loads((HERE / "screening-report.json").read_text())
        self.assertEqual(report, expected)
        self.assertFalse(report["production_approved"])
        self.assertEqual(report["pending_gates"], ["C01", "D08"])
        self.assertEqual(report["counts"], {"match": 6, "unscored": 3})
        self.assertEqual(report["review_counts"], {"provisional": 6, "unreviewed": 3})

    def test_tampering_cannot_silently_change_the_pinned_candidate(self):
        with tempfile.TemporaryDirectory() as directory:
            target = Path(directory)
            geometry = (HERE / "fixtures" / "natural_earth_land.geojson").read_bytes()
            original = json.loads((HERE / "fixtures" / "source.json").read_text())
            for key, value in (("geometry_sha256", "changed"), ("upstream_sha256", "changed"),
                               ("upstream_commit", "changed"), ("upstream_url", "changed"),
                               ("study_bounds", [0, 0, 1, 1]), ("production_approved", True)):
                with self.subTest(key=key):
                    (target / "natural_earth_land.geojson").write_bytes(geometry)
                    (target / "source.json").write_text(json.dumps({**original, key: value}))
                    with self.assertRaises(ValueError):
                        evaluate(target, HERE / "fixtures" / "controls.json")
            changed = geometry + b" "
            (target / "natural_earth_land.geojson").write_bytes(changed)
            (target / "source.json").write_text(json.dumps({**original, "geometry_sha256": digest(changed)}))
            with self.assertRaises(ValueError):
                evaluate(target, HERE / "fixtures" / "controls.json")

    def test_missing_source_does_not_fall_back_to_an_empty_ocean_mask(self):
        with tempfile.TemporaryDirectory() as directory, self.assertRaises(OSError):
            evaluate(Path(directory), HERE / "fixtures" / "controls.json")

    def test_prepare_rejects_other_source_bytes_before_writing(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "wrong.geojson"
            source.write_text(json.dumps(collection([rectangle(122, 10, 123, 11)])))
            output = Path(directory) / "output"
            with self.assertRaises(ValueError):
                prepare(source, output)
            self.assertFalse(output.exists())

    def test_cli_produces_report_and_fails_visibly_for_missing_input(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "report.json"
            result = subprocess.run([
                sys.executable, "-m", "backend.science.ocean_mask.evaluate", "evaluate",
                "--output", str(output),
            ], capture_output=True, text=True, check=False)
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertFalse(json.loads(output.read_text())["production_approved"])
            failed = subprocess.run([
                sys.executable, "-m", "backend.science.ocean_mask.evaluate", "evaluate",
                "--candidate-dir", str(Path(directory) / "missing"), "--output", str(output),
            ], capture_output=True, text=True, check=False)
            self.assertEqual(failed.returncode, 2)
            self.assertIn("Screening failed:", failed.stderr)


if __name__ == "__main__":
    unittest.main()
