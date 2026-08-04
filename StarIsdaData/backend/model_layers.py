import math
import xarray as xr
import numpy as np


def _iter_surface_grid(ds, variable_name, depth_index=0, time_index=-1):
    data_array = ds[variable_name].isel(time=time_index, depth=depth_index)
    lats = ds.latitude.values
    lons = ds.longitude.values
    values = data_array.values

    for i, lat in enumerate(lats):
        for j, lon in enumerate(lons):
            value = values[i, j]
            if np.isnan(value):
                continue
            yield float(lat), float(lon), float(value)


def get_sea_surface_temperature(file_path):
    ds = xr.open_dataset(file_path)
    observation_time = str(ds.time.values[-1])
    records = []

    for lat, lon, value in _iter_surface_grid(ds, "thetao"):
        records.append(
            {
                "latitude": lat,
                "longitude": lon,
                "sea_surface_temperature": round(value, 2),
                "observation_time": observation_time,
            }
        )

    ds.close()
    return records


def get_sea_surface_height(file_path):
    ds = xr.open_dataset(file_path)
    observation_time = str(ds.time.values[-1])
    records = []

    for lat, lon, value in _iter_surface_grid(ds, "zos"):
        records.append(
            {
                "latitude": lat,
                "longitude": lon,
                "sea_surface_height": round(value, 4),
                "observation_time": observation_time,
            }
        )

    ds.close()
    return records


def get_bottom_temperature(file_path):
    ds = xr.open_dataset(file_path)
    observation_time = str(ds.time.values[-1])
    records = []

    for lat, lon, value in _iter_surface_grid(ds, "thetao", depth_index=-1):
        records.append(
            {
                "latitude": lat,
                "longitude": lon,
                "bottom_temperature": round(value, 2),
                "observation_time": observation_time,
            }
        )

    ds.close()
    return records


def get_bottom_currents(file_path):
    ds = xr.open_dataset(file_path)
    observation_time = str(ds.time.values[-1])
    records = []

    surface_u = ds.uo.isel(time=-1, depth=-1)
    surface_v = ds.vo.isel(time=-1, depth=-1)
    lats = ds.latitude.values
    lons = ds.longitude.values

    u_values = surface_u.values
    v_values = surface_v.values

    for i, lat in enumerate(lats):
        for j, lon in enumerate(lons):
            uo = u_values[i, j]
            vo = v_values[i, j]
            if np.isnan(uo) or np.isnan(vo):
                continue
            speed = math.sqrt(uo ** 2 + vo ** 2)
            direction = math.degrees(math.atan2(vo, uo))
            records.append(
                {
                    "latitude": float(lat),
                    "longitude": float(lon),
                    "bottom_uo": round(float(uo), 4),
                    "bottom_vo": round(float(vo), 4),
                    "bottom_current_speed": round(speed, 4),
                    "bottom_current_direction": round(direction, 2),
                    "observation_time": observation_time,
                }
            )

    ds.close()
    return records