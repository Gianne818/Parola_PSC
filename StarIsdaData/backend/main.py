from fastapi import FastAPI
import time

from weather import get_weather

from ocean_temperature import get_ocean_temperature
from ocean_currents import get_ocean_currents
from ocean_salinity import get_ocean_salinity
from ocean_chlorophyll import get_ocean_chlorophyll
from model_layers import (
    get_sea_surface_temperature,
    get_sea_surface_height,
    get_bottom_temperature,
    get_bottom_currents,
)

from download import (
    download_latest_ocean_data,
    download_latest_current_data,
    download_latest_salinity_data,
    download_latest_chlorophyll_data,
    download_latest_sea_surface_height_data,
    download_latest_bottom_temperature_data,
    download_latest_bottom_currents_data,
)

from database import (
    save_records,
    get_records,
    get_latest_record
)

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "StarISDA Backend Running"
    }


# -------------------------
# WEATHER
# -------------------------

@app.get("/weather")
def weather():
    return get_weather()[0]

# -------------------------
# OCEAN TEMPERATURE
# -------------------------

@app.get("/temperature")
def temperature():
    return get_records("ocean_temperature")


@app.get("/update-ocean")
def update_ocean():
    file = download_latest_ocean_data()
    records = get_ocean_temperature(file)
    save_records("ocean_temperature", records)
    return {"status": "success", "file": file, "saved": len(records)}


# -------------------------
# OCEAN CURRENTS
# -------------------------

@app.get("/current")
def current():
    return get_records("ocean_currents")


@app.get("/update-current")
def update_current():
    file = download_latest_current_data()
    records = get_ocean_currents(file)
    save_records("ocean_currents", records)
    return {"status": "success", "file": file, "saved": len(records)}


# -------------------------
# SALINITY
# -------------------------

@app.get("/salinity")
def salinity():
    return get_records("ocean_salinity")


@app.get("/update-salinity")
def update_salinity():
    file = download_latest_salinity_data()
    records = get_ocean_salinity(file)
    save_records("ocean_salinity", records)
    return {"status": "success", "file": file, "saved": len(records)}


# -------------------------
# CHLOROPHYLL
# -------------------------

@app.get("/chlorophyll")
def chlorophyll():
    return get_records("ocean_chlorophyll")


@app.get("/update-chlorophyll")
def update_chlorophyll():
    file = download_latest_chlorophyll_data()
    records = get_ocean_chlorophyll(file)
    save_records("ocean_chlorophyll", records)
    return {"status": "success", "file": file, "saved": len(records)}


# -------------------------
# ENVIRONMENT (combined update)
# -------------------------

@app.get("/update-environment")
def update_environment():
    total_start = time.time()
    results, errors = {}, {}
    steps = [
        ("TEMPERATURE", download_latest_ocean_data, get_ocean_temperature, "ocean_temperature"),
        ("CURRENTS", download_latest_current_data, get_ocean_currents, "ocean_currents"),
        ("SALINITY", download_latest_salinity_data, get_ocean_salinity, "ocean_salinity"),
        ("CHLOROPHYLL", download_latest_chlorophyll_data, get_ocean_chlorophyll, "ocean_chlorophyll"),
    ]

    for name, download_fn, process_fn, table in steps:
        print(f"\n========== {name} ==========")
        try:
            start = time.time()
            file = download_fn()
            print(f"Download: {time.time() - start:.2f} seconds")

            start = time.time()
            records = process_fn(file) if file is not None else []
            print(f"Processing: {time.time() - start:.2f} seconds")

            start = time.time()
            save_records(table, records)
            print(f"Supabase: {time.time() - start:.2f} seconds")

            results[name.lower()] = len(records)
        except Exception as e:
            print(f"FAILED: {e}")
            errors[name.lower()] = str(e)

    print("\n========== WEATHER ==========")
    try:
        start = time.time()
        weather_records = get_weather()
        print(f"Processing: {time.time() - start:.2f} seconds")

        start = time.time()
        save_records("weather_data", weather_records)
        print(f"Supabase: {time.time() - start:.2f} seconds")

        results["weather"] = len(weather_records)
    except Exception as e:
        print(f"FAILED: {e}")
        errors["weather"] = str(e)

    total_time = time.time() - total_start
    print("\n================================")
    print(f"TOTAL UPDATE TIME: {total_time:.2f} seconds")
    if errors:
        print(f"ERRORS: {errors}")
    print("================================\n")

    return {
        "status": "partial_success" if errors else "success",
        **results,
        "errors": errors,
        "total_time_seconds": round(total_time, 2)
    }


@app.get("/pelagic")
def pelagic():
    return {
        "sea_surface_temperature": get_records("pelagic_sea_surface_temperature"),
        "sea_surface_height": get_records("pelagic_sea_surface_height"),
        "ocean_currents": get_records("pelagic_ocean_currents"),
        "chlorophyll_a": get_records("pelagic_chlorophyll_a"),
    }


@app.get("/reef-demersal")
def reef_demersal():
    return {
        "bottom_temperature": get_records("reef_bottom_temperature"),
        "bottom_currents": get_records("reef_bottom_currents"),
    }


@app.get("/update-pelagic")
def update_pelagic():
    results, errors = {}, {}

    steps = [
        ("sea_surface_temperature", download_latest_ocean_data, get_sea_surface_temperature, "pelagic_sea_surface_temperature"),
        ("sea_surface_height", download_latest_sea_surface_height_data, get_sea_surface_height, "pelagic_sea_surface_height"),
        ("ocean_currents", download_latest_current_data, get_ocean_currents, "pelagic_ocean_currents"),
        ("chlorophyll_a", download_latest_chlorophyll_data, get_ocean_chlorophyll, "pelagic_chlorophyll_a"),
    ]

    for name, download_fn, process_fn, table in steps:
        try:
            file = download_fn()
            records = process_fn(file) if file is not None else []
            save_records(table, records)
            results[name] = len(records)
        except Exception as e:
            errors[name] = str(e)

    return {
        "status": "partial_success" if errors else "success",
        **results,
        "errors": errors,
    }


@app.get("/update-reef-demersal")
def update_reef_demersal():
    results, errors = {}, {}

    steps = [
        ("bottom_temperature", download_latest_bottom_temperature_data, get_bottom_temperature, "reef_bottom_temperature"),
        ("bottom_currents", download_latest_bottom_currents_data, get_bottom_currents, "reef_bottom_currents"),
    ]

    for name, download_fn, process_fn, table in steps:
        try:
            file = download_fn()
            records = process_fn(file) if file is not None else []
            save_records(table, records)
            results[name] = len(records)
        except Exception as e:
            errors[name] = str(e)

    return {
        "status": "partial_success" if errors else "success",
        **results,
        "errors": errors,
    }


@app.get("/environment")
def environment():
    return {
        "weather": get_latest_record("weather_data"),
        "temperature": get_records("ocean_temperature"),
        "currents": get_records("ocean_currents"),
        "salinity": get_records("ocean_salinity"),
        "chlorophyll": get_records("ocean_chlorophyll")
    }