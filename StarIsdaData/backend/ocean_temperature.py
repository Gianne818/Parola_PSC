import math
import xarray as xr
import numpy as np


def get_ocean_temperature(file_path):

    ds = xr.open_dataset(file_path)

    observation_time = str(ds.time.values[-1])

    surface = ds.thetao.isel(time=-1, depth=0)

    lats = ds.latitude.values
    lons = ds.longitude.values
    values = surface.values

    records = []

    for i, lat in enumerate(lats):
        for j, lon in enumerate(lons):

            temp = values[i, j]

            if np.isnan(temp):
                continue

            records.append({
                "latitude": float(lat),
                "longitude": float(lon),
                "ocean_temperature": round(float(temp), 2),
                "observation_time": observation_time
            })

    total = values.size
    valid = len(records)
    nan_count = total - valid

    print("========== TEMPERATURE STATS ==========")
    print("Total cells :", total)
    print("Valid cells :", valid)
    print("NaN cells   :", nan_count)
    print("=======================================")

    ds.close()

    return records