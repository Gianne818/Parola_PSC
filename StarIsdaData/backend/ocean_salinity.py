import xarray as xr
import numpy as np

def get_ocean_salinity(file_path):

    ds = xr.open_dataset(file_path)

    observation_time = str(ds.time.values[-1])

    surface = ds.so.isel(time=-1, depth=0)

    lats = ds.latitude.values
    lons = ds.longitude.values

    values = surface.values

    records = []

    for i, lat in enumerate(lats):
        for j, lon in enumerate(lons):

            salinity = values[i, j]

            if np.isnan(salinity):
                continue

            records.append({
                "latitude": float(lat),
                "longitude": float(lon),
                "salinity": round(float(salinity), 3),
                "observation_time": observation_time
            })

    total = values.size
    valid = len(records)
    nan_count = total - valid

    print("========== SALINITY STATS ==========")
    print("Total cells :", total)
    print("Valid cells :", valid)
    print("NaN cells   :", nan_count)
    print("====================================")

    ds.close()

    return records