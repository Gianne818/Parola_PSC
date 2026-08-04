import math
import xarray as xr
import numpy as np


def get_ocean_currents(file_path):

    ds = xr.open_dataset(file_path)

    observation_time = str(ds.time.values[-1])

    surface_u = ds.uo.isel(time=-1, depth=0)
    surface_v = ds.vo.isel(time=-1, depth=0)

    lats = ds.latitude.values
    lons = ds.longitude.values

    u_values = surface_u.values
    v_values = surface_v.values

    records = []

    for i, lat in enumerate(lats):
        for j, lon in enumerate(lons):

            uo = u_values[i, j]
            vo = v_values[i, j]

            if np.isnan(uo) or np.isnan(vo):
                continue

            speed = math.sqrt(uo ** 2 + vo ** 2)
            direction = math.degrees(math.atan2(vo, uo))

            records.append({
                "latitude": float(lat),
                "longitude": float(lon),
                "uo": round(float(uo), 4),
                "vo": round(float(vo), 4),
                "current_speed": round(speed, 4),
                "current_direction": round(direction, 2),
                "observation_time": observation_time
            })

    total = u_values.size
    valid = len(records)
    nan_count = total - valid

    print("========== CURRENT STATS ==========")
    print("Total cells :", total)
    print("Valid cells :", valid)
    print("NaN cells   :", nan_count)
    print("===================================")

    ds.close()

    return records