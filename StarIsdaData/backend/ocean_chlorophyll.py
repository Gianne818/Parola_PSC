import math
import xarray as xr


def get_ocean_chlorophyll(file_path):

    ds = xr.open_dataset(file_path)

    observation_time = str(ds.time.values[-1])

    surface = ds.CHL.isel(time=-1)

    records = []

    total = 0
    valid = 0
    nan_count = 0

    for lat in ds.latitude.values:
        for lon in ds.longitude.values:

            total += 1

            chl = surface.sel(
                latitude=lat,
                longitude=lon,
                method="nearest"
            ).values.item()

            if math.isnan(chl):
                nan_count += 1
                continue

            valid += 1

            records.append({
                "latitude": float(lat),
                "longitude": float(lon),
                "chlorophyll": round(float(chl), 4),
                "observation_time": observation_time
            })

    ds.close()

    print("========== CHL STATS ==========")
    print("Total cells :", total)
    print("Valid cells :", valid)
    print("NaN cells   :", nan_count)
    print("===============================")

    return records