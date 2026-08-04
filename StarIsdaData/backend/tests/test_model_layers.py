import importlib
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))


def test_model_layers_import():
    model_layers = importlib.import_module("model_layers")
    assert hasattr(model_layers, "get_sea_surface_temperature")
    assert hasattr(model_layers, "get_sea_surface_height")
    assert hasattr(model_layers, "get_bottom_temperature")
    assert hasattr(model_layers, "get_bottom_currents")
    assert hasattr(model_layers, "get_tidal_amplitude")
