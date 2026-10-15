import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from species_catalog import resolve_species


class SpeciesCatalogTests(unittest.TestCase):
    def setUp(self):
        self.rows = [
            {'id': 1, 'category': 'pelagic', 'species_name': 'Tamban / Tunsoy', 'family': 'Clupeidae', 'local_name': 'Sardines'},
            {'id': 1, 'category': 'demersal', 'species_name': 'Lapu-lapu', 'family': 'Serranidae', 'local_name': 'Groupers'},
        ]

    def test_exact_aliases_and_scoped_ids(self):
        for query in ('Tamban', ' TUNSOY ', 'Clupeidae', 'Sardines', 'pelagic:1'):
            with self.subTest(query=query):
                self.assertEqual(resolve_species(self.rows, query), self.rows[0])

    def test_deployed_common_name_and_representative_species(self):
        row = {'id': 7, 'category': 'pelagic', 'species_name': 'Sardines', 'common_name': 'Sardines',
               'family': 'Clupeidae', 'local_name': None, 'representative_species': 'Sardinella lemuru'}
        self.assertEqual(resolve_species([row], 'Sardinella lemuru'), row)
        self.assertEqual(resolve_species([row], 'Sardines'), row)
        self.assertIsNone(resolve_species([row], 'lemuru'))

    def test_unknown_and_partial_queries_never_choose_first_row(self):
        for query in ('unknown', 'Tam', '%', '_', '', ' ', '1'):
            with self.subTest(query=query):
                self.assertIsNone(resolve_species(self.rows, query))

    def test_ambiguous_alias_requires_scoped_id(self):
        self.rows[1]['local_name'] = 'Sardines'
        self.assertIsNone(resolve_species(self.rows, 'Sardines'))
        self.assertEqual(resolve_species(self.rows, 'demersal:1'), self.rows[1])


if __name__ == '__main__':
    unittest.main()
