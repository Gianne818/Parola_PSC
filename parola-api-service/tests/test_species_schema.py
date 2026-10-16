"""Guard ORM queries against the actual deployed catalog schema reported by Son."""
import importlib.util
import sys
import types
import unittest
from pathlib import Path
from unittest.mock import patch
from sqlalchemy import select
from sqlalchemy.orm import declarative_base


class SpeciesSchemaTests(unittest.TestCase):
    def test_orm_queries_use_only_observed_catalog_columns(self):
        database = types.ModuleType('database')
        database.Base = declarative_base()
        path = Path(__file__).resolve().parents[1] / 'models.py'
        spec = importlib.util.spec_from_file_location('catalog_models_under_test', path)
        models = importlib.util.module_from_spec(spec)
        with patch.dict(sys.modules, {'database': database}):
            spec.loader.exec_module(models)
        shared = {'id', 'family', 'common_name', 'representative_species', 'depth_min_m', 'depth_max_m', 'environment'}
        observed = {
            models.PelagicSpecies: shared | {'sst_min_c', 'sst_max_c', 'salinity_min', 'salinity_max'},
            models.DemersalSpecies: shared | {'temp_min_c', 'temp_max_c', 'max_distance_to_reef_km'},
        }
        for model, columns in observed.items():
            with self.subTest(table=model.__tablename__):
                self.assertEqual(set(model.__table__.columns.keys()), columns)
                statement = str(select(model))
                for absent in ('species_name', 'local_name', 'temp_opt_low', 'temp_opt_high'):
                    self.assertNotIn('.' + absent, statement)


if __name__ == '__main__':
    unittest.main()
