import importlib
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend_dir))


def test_settings_read_environment_overrides(monkeypatch):
    monkeypatch.setenv("WEATHER_LATITUDE", "11.11")
    monkeypatch.setenv("WEATHER_LONGITUDE", "124.22")
    monkeypatch.setenv("OCEAN_MIN_LONGITUDE", "115")
    monkeypatch.setenv("OCEAN_MAX_LONGITUDE", "128")
    monkeypatch.setenv("OCEAN_MIN_LATITUDE", "3")
    monkeypatch.setenv("OCEAN_MAX_LATITUDE", "21")
    monkeypatch.setenv("OCEAN_MIN_DEPTH", "0.2")
    monkeypatch.setenv("OCEAN_MAX_DEPTH", "0.3")
    monkeypatch.setenv("OCEAN_TIME_WINDOW_HOURS", "12")
    monkeypatch.setenv("CHLOROPHYLL_LOOKBACK_DAYS", "7")
    monkeypatch.setenv("OUTPUT_DIR", "custom_data")

    import config

    importlib.reload(config)

    settings = config.get_settings()

    assert settings["weather"]["latitude"] == 11.11
    assert settings["weather"]["longitude"] == 124.22
    assert settings["ocean"]["bbox"]["min_longitude"] == 115
    assert settings["ocean"]["bbox"]["max_longitude"] == 128
    assert settings["ocean"]["bbox"]["min_latitude"] == 3
    assert settings["ocean"]["bbox"]["max_latitude"] == 21
    assert settings["ocean"]["bbox"]["min_depth"] == 0.2
    assert settings["ocean"]["bbox"]["max_depth"] == 0.3
    assert settings["ocean"]["time_window_hours"] == 12
    assert settings["chlorophyll"]["lookback_days"] == 7
    assert settings["output_dir"] == "custom_data"
