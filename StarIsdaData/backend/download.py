import subprocess
import glob
import os
from datetime import datetime, timedelta, timezone

from config import get_settings

settings = get_settings()
OUTPUT_DIR = settings["output_dir"]

_download_cache = {}
_chlorophyll_cache = {"date": None, "file": None}


def latest_window():
    now = datetime.now(timezone.utc)
    window_hours = settings["ocean"]["time_window_hours"]
    hour = (now.hour // window_hours) * window_hours

    end = now.replace(hour=hour, minute=0, second=0, microsecond=0)
    if end == now.replace(minute=0, second=0, microsecond=0):
        end -= timedelta(hours=window_hours)

    start = end - timedelta(hours=window_hours)

    return (
        start.strftime("%Y-%m-%dT%H:%M:%S"),
        end.strftime("%Y-%m-%dT%H:%M:%S")
    )


def _download(dataset_id, variables, min_depth=None, max_depth=None):
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    start, end = latest_window()
    min_depth = min_depth if min_depth is not None else settings["ocean"]["bbox"]["min_depth"]
    max_depth = max_depth if max_depth is not None else settings["ocean"]["bbox"]["max_depth"]

    cache_key = (dataset_id, tuple(variables), start, end, min_depth, max_depth)

    cached_file = _download_cache.get(cache_key)
    if cached_file and os.path.exists(cached_file):
        print(f"Cache hit for {dataset_id} [{start} -> {end}], skipping download")
        return cached_file

    command = [
        "copernicusmarine",
        "subset",

        "--dataset-id",
        dataset_id,

        "--minimum-longitude", str(settings["ocean"]["bbox"]["min_longitude"]),
        "--maximum-longitude", str(settings["ocean"]["bbox"]["max_longitude"]),

        "--minimum-latitude", str(settings["ocean"]["bbox"]["min_latitude"]),
        "--maximum-latitude", str(settings["ocean"]["bbox"]["max_latitude"]),

        "--minimum-depth", str(min_depth),
        "--maximum-depth", str(max_depth),

        "--start-datetime", start,
        "--end-datetime", end,

        "--output-directory", OUTPUT_DIR
    ]

    for variable in variables:
        command.extend(["--variable", variable])

    try:
        subprocess.run(command, check=True, capture_output=True, text=True)
    except subprocess.CalledProcessError as exc:
        print(f"Download failed for dataset {dataset_id}: {exc.stderr or exc}")
        return None

    files = glob.glob(os.path.join(OUTPUT_DIR, "*.nc"))

    if not files:
        print(f"No NetCDF file downloaded for dataset {dataset_id}.")
        return None

    result = max(files, key=os.path.getctime)
    _download_cache[cache_key] = result
    return result


def download_latest_ocean_data():
    return _download(
        "cmems_mod_glo_phy-thetao_anfc_0.083deg_PT6H-i",
        ["thetao"]
    )

def download_latest_current_data():
    return _download(
        "cmems_mod_glo_phy-cur_anfc_0.083deg_PT6H-i",
        ["uo", "vo"]
    )

def download_latest_salinity_data():
    return _download(
        "cmems_mod_glo_phy-so_anfc_0.083deg_PT6H-i",
        ["so"]
    )

def download_latest_sea_surface_height_data():
    return _download(
        settings["datasets"]["sea_surface_height"]["dataset_id"],
        [settings["datasets"]["sea_surface_height"]["variable"]],
    )

def download_latest_bottom_temperature_data():
    cfg = settings["datasets"]["bottom_temperature"]
    return _download(
        cfg["dataset_id"],
        [cfg["variable"]],
        min_depth=cfg["min_depth"],
        max_depth=cfg["max_depth"],
    )

def download_latest_bottom_currents_data():
    cfg = settings["datasets"]["bottom_currents"]
    return _download(
        cfg["dataset_id"],
        [cfg["u_variable"], cfg["v_variable"]],
        min_depth=cfg["min_depth"],
        max_depth=cfg["max_depth"],
    )


def download_latest_chlorophyll_data(max_extra_lookback=5):
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    lookback_days = settings["chlorophyll"]["lookback_days"]
    base_target = (datetime.now(timezone.utc) - timedelta(days=lookback_days)).strftime("%Y-%m-%d")

    if _chlorophyll_cache["date"] == base_target and _chlorophyll_cache["file"] and os.path.exists(_chlorophyll_cache["file"]):
        print(f"Cache hit for chlorophyll [{base_target}], skipping download")
        return _chlorophyll_cache["file"]

    for extra in range(max_extra_lookback + 1):
        target_date = datetime.now(timezone.utc) - timedelta(days=lookback_days + extra)
        date = target_date.strftime("%Y-%m-%d")
        print(f"Downloading chlorophyll for {date}")

        try:
            subprocess.run([
                "copernicusmarine", "subset",
                "--dataset-id", "cmems_obs-oc_glo_bgc-plankton_my_l3-multi-4km_P1D",
                "--variable", "CHL",
                "--minimum-longitude", str(settings["chlorophyll"]["bbox"]["min_longitude"]),
                "--maximum-longitude", str(settings["chlorophyll"]["bbox"]["max_longitude"]),
                "--minimum-latitude", str(settings["chlorophyll"]["bbox"]["min_latitude"]),
                "--maximum-latitude", str(settings["chlorophyll"]["bbox"]["max_latitude"]),
                "--start-datetime", f"{date}T00:00:00",
                "--end-datetime", f"{date}T23:59:59",
                "--output-directory", OUTPUT_DIR
            ], check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as exc:
            stderr = exc.stderr or str(exc)
            if "out of dataset bounds" in stderr or "exceed the dataset coordinates" in stderr:
                print(f"{date} out of bounds, stepping back a day")
                continue
            print(f"Chlorophyll download failed: {stderr}")
            return None

        files = glob.glob(os.path.join(OUTPUT_DIR, "*.nc"))
        if files:
            result = max(files, key=os.path.getctime)
            _chlorophyll_cache["date"] = base_target
            _chlorophyll_cache["file"] = result
            return result

    print("No chlorophyll NetCDF downloaded after retries.")
    return None