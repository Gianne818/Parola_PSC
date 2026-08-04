import os
from typing import Any, Dict

from dotenv import load_dotenv

load_dotenv()


def _get_float(name: str, default: float) -> float:
    value = os.getenv(name)
    if value is None or value == "":
        return default
    return float(value)


def _get_int(name: str, default: int) -> int:
    value = os.getenv(name)
    if value is None or value == "":
        return default
    return int(value)


def _get_str(name: str, default: str) -> str:
    value = os.getenv(name)
    if value is None or value == "":
        return default
    return value


def get_settings() -> Dict[str, Any]:
    return {
        "weather": {
            "latitude": _get_float("WEATHER_LATITUDE", 10.3157),
            "longitude": _get_float("WEATHER_LONGITUDE", 123.8854),
        },
        "ocean": {
            "bbox": {
                "min_longitude": _get_float("OCEAN_MIN_LONGITUDE", 116.0),
                "max_longitude": _get_float("OCEAN_MAX_LONGITUDE", 127.0),
                "min_latitude": _get_float("OCEAN_MIN_LATITUDE", 4.0),
                "max_latitude": _get_float("OCEAN_MAX_LATITUDE", 22.0),
                "min_depth": _get_float("OCEAN_MIN_DEPTH", 0.49402499198913574),
                "max_depth": _get_float("OCEAN_MAX_DEPTH", 0.49402499198913574),
            },
            "time_window_hours": _get_int("OCEAN_TIME_WINDOW_HOURS", 6),
        },
        "chlorophyll": {
            "bbox": {
                "min_longitude": _get_float("CHLOROPHYLL_MIN_LONGITUDE", 123.0),
                "max_longitude": _get_float("CHLOROPHYLL_MAX_LONGITUDE", 124.0),
                "min_latitude": _get_float("CHLOROPHYLL_MIN_LATITUDE", 10.0),
                "max_latitude": _get_float("CHLOROPHYLL_MAX_LATITUDE", 11.0),
            },
            "lookback_days": _get_int("CHLOROPHYLL_LOOKBACK_DAYS", 8),
        },
        "datasets": {
            "sea_surface_height": {
                "dataset_id": _get_str(
                    "SEA_SURFACE_HEIGHT_DATASET_ID",
                    "cmems_mod_glo_phy_anfc_0.083deg_PT1H-m",
                ),
                "variable": _get_str("SEA_SURFACE_HEIGHT_VARIABLE", "zos"),
            },
            "bottom_temperature": {
                "dataset_id": _get_str(
                    "BOTTOM_TEMPERATURE_DATASET_ID",
                    "cmems_mod_glo_phy-thetao_anfc_0.083deg_PT6H-i",
                ),
                "variable": _get_str("BOTTOM_TEMPERATURE_VARIABLE", "thetao"),
            },
            "bottom_currents": {
                "dataset_id": _get_str(
                    "BOTTOM_CURRENTS_DATASET_ID",
                    "cmems_mod_glo_phy-cur_anfc_0.083deg_PT6H-i",
                ),
                "u_variable": _get_str("BOTTOM_CURRENTS_U_VARIABLE", "uo"),
                "v_variable": _get_str("BOTTOM_CURRENTS_V_VARIABLE", "vo"),
            },
            "tidal_amplitude": {
                "dataset_id": _get_str(
                    "TIDAL_AMPLITUDE_DATASET_ID",
                    "cmems_mod_glo_phy-tide_anfc_0.083deg_PT6H-i",
                ),
                "variable": _get_str("TIDAL_AMPLITUDE_VARIABLE", "tide"),
            },
        },
        "output_dir": _get_str("OUTPUT_DIR", "ocean_data"),
    }
