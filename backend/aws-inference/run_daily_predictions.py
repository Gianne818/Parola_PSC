import os
import tempfile
from datetime import datetime
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from zoneinfo import ZoneInfo

# ==============================================================================
# DAILY PREDICTION TOGGLE
# Set ENABLE_DAILY_PREDICTIONS = False here (or set the environment variable
# PAROLA_ENABLE_DAILY_PREDICTIONS=false on AWS Lambda) to pause daily runs
# without deleting the schedule or stack.
# Pass {"force": true} in a Lambda test event or run_pipeline(force=True) to
# execute a one-off manual run even while daily predictions are disabled.
# ==============================================================================
ENABLE_DAILY_PREDICTIONS = True

# Lowest catch_probability stored in Supabase so users can adjust the map slider
# down to 25% (default displayed threshold in the UI remains >= 50%).
MINIMUM_CATCH_PROBABILITY = 0.25

# Directory where static model/reference assets live (defaults to script directory)
ASSET_DIR = os.environ.get("PAROLA_ASSET_DIR", os.path.dirname(os.path.abspath(__file__)))
# Scratch directory for temporary NetCDF files (/tmp for AWS Lambda compatibility)
WORK_DIR = os.environ.get("PAROLA_WORK_DIR", tempfile.gettempdir())

# Ensure writable home/cache directory for Copernicus Marine on read-only Lambda rootfs
if os.environ.get("AWS_EXECUTION_ENV") or not os.access(os.path.expanduser("~"), os.W_OK):
    os.environ["HOME"] = WORK_DIR
os.environ.setdefault("COPERNICUSMARINE_CACHE_DIRECTORY", os.path.join(WORK_DIR, "copernicus-cache"))

# Bridge legacy Lambda env var names to Copernicus Marine SDK env vars if needed
if not os.environ.get("COPERNICUSMARINE_SERVICE_USERNAME") and os.environ.get("COPERNICUS_USERNAME"):
    os.environ["COPERNICUSMARINE_SERVICE_USERNAME"] = os.environ["COPERNICUS_USERNAME"]
if not os.environ.get("COPERNICUSMARINE_SERVICE_PASSWORD") and os.environ.get("COPERNICUS_PASSWORD"):
    os.environ["COPERNICUSMARINE_SERVICE_PASSWORD"] = os.environ["COPERNICUS_PASSWORD"]

import copernicusmarine
import xarray as xr
import numpy as np
import pandas as pd
import geopandas as gpd
import lightgbm as lgb
from scipy.spatial import cKDTree
from sklearn.cluster import DBSCAN
from sklearn.neighbors import BallTree
try:
    import psycopg
except ImportError:
    psycopg = None
try:
    import psycopg2
except ImportError:
    psycopg2 = None


def is_daily_prediction_enabled(force=False, event_enabled=None):
    """Return True if daily predictions should run, or False when paused/disabled."""
    if force:
        return True
    if event_enabled is not None:
        if isinstance(event_enabled, bool):
            return event_enabled
        return str(event_enabled).strip().lower() not in ("0", "false", "no", "off", "disabled")
    env_val = os.environ.get("PAROLA_ENABLE_DAILY_PREDICTIONS")
    if env_val is not None and env_val.strip() != "":
        return env_val.strip().lower() not in ("0", "false", "no", "off", "disabled")
    return bool(ENABLE_DAILY_PREDICTIONS)


def clean_database_url(db_url):
    """Remove Prisma-only pgbouncer query parameter rejected by libpq/psycopg."""
    if not db_url:
        return db_url
    parts = urlsplit(db_url)
    if not parts.query:
        return db_url
    filtered = [(k, v) for k, v in parse_qsl(parts.query, keep_blank_values=True) if k != "pgbouncer"]
    return urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(filtered), parts.fragment))


def compute_current_vector(u, v):
    """Calculate current speed (m/s) and oceanographic heading (degrees toward which water flows from True North)."""
    u_f = float(u)
    v_f = float(v)
    speed = float(np.sqrt(u_f**2 + v_f**2))
    heading = float((np.degrees(np.arctan2(u_f, v_f)) + 360) % 360)
    return speed, heading



def get_target_date(dataset_id, requested_date):
    """Return requested_date if within dataset bounds, else the latest available date."""
    try:
        ds = copernicusmarine.open_dataset(
            dataset_id=dataset_id,
            variables=["thetao"],
            minimum_longitude=120.0, maximum_longitude=121.0,
            minimum_latitude=12.0, maximum_latitude=13.0
        )
        times = pd.to_datetime(ds.time.values)
        req_dt = pd.to_datetime(requested_date)
        if req_dt < times.min() or req_dt > times.max():
            latest = times.max().strftime("%Y-%m-%d")
            print(f"Note: Requested date {requested_date} is outside dataset range ({times.min().strftime('%Y-%m-%d')} to {latest}). Using latest available date: {latest}")
            return latest
        return requested_date
    except Exception as e:
        print(f"Note: Could not check date bounds ({e}). Using requested date: {requested_date}")
        return requested_date


def compute_monthly_climatology(current_month, target_lat, target_lon):
    """Compute monthly SST climatology from local file or Copernicus monthly reanalysis."""
    local_env = os.path.join(ASSET_DIR, "env_features_filled_v3.nc")
    if os.path.exists(local_env):
        historical_env = xr.open_dataset(local_env)
        monthly_clim = historical_env.thetao.sel(
            time=historical_env["time.month"] == current_month
        ).mean(dim="time")
        return monthly_clim.interp(latitude=target_lat, longitude=target_lon, method="nearest")

    clim_cache = os.path.join(WORK_DIR, f"clim_month_{current_month:02d}.nc")
    if os.path.exists(clim_cache):
        ds_clim = xr.open_dataset(clim_cache)
        return ds_clim["thetao"].interp(latitude=target_lat, longitude=target_lon, method="nearest")

    print(f"Fetching historical monthly SST climatology for month={current_month} from Copernicus Marine...")
    try:
        ds_hist = copernicusmarine.open_dataset(
            dataset_id="cmems_mod_glo_phy_my_0.083deg_P1M-m",
            variables=["thetao"],
            minimum_longitude=116.0,
            maximum_longitude=131.0,
            minimum_latitude=2.0,
            maximum_latitude=23.0,
            minimum_depth=0.0,
            maximum_depth=1.0,
        )
        if "depth" in ds_hist.dims:
            ds_hist = ds_hist.isel(depth=0, drop=True)
        ds_month = ds_hist.sel(time=ds_hist["time.month"] == current_month).isel(time=slice(-10, None))
        monthly_clim = ds_month["thetao"].mean(dim="time", skipna=True).compute()
        monthly_clim = monthly_clim.interpolate_na(dim="longitude", method="nearest", limit=2)
        monthly_clim = monthly_clim.interpolate_na(dim="latitude", method="nearest", limit=2)
        monthly_clim.to_netcdf(clim_cache)
        return monthly_clim.interp(latitude=target_lat, longitude=target_lon, method="nearest")
    except Exception as e:
        print(f"Warning: Could not fetch multi-year monthly climatology ({e}). Computing spatial mean climatology...")
        return None


def filter_offshore(df, lat_col, lon_col, min_shore_km, ph_land, ph_boundary):
    """Exclude any point on land or within min_shore_km of the Philippine coastline/ports."""
    pts = gpd.GeoDataFrame(
        df, geometry=gpd.points_from_xy(df[lon_col], df[lat_col]), crs="EPSG:4326"
    ).to_crs(epsg=3123)
    on_land = pts.geometry.within(ph_land)
    dist_km = pts.geometry.distance(ph_boundary) / 1000.0
    keep = (~on_land) & (dist_km >= min_shore_km)
    out = df[keep].copy()
    out["dist_to_shore_km"] = dist_km[keep].values
    return out


def spatial_nms(df, lat_col, lon_col, prob_col, radius_km=16.5):
    """Keep only the highest-probability local peak within radius_km."""
    df_sorted = df.sort_values(prob_col, ascending=False).reset_index(drop=True)
    coords = df_sorted[[lat_col, lon_col]].values
    radius_deg = radius_km / 111.0
    kept_indices = []
    kept_coords = []
    for i in range(len(df_sorted)):
        pt = coords[i]
        if not kept_coords:
            kept_indices.append(i)
            kept_coords.append(pt)
        else:
            dists = np.sqrt((np.array(kept_coords)[:, 0] - pt[0]) ** 2 + (np.array(kept_coords)[:, 1] - pt[1]) ** 2)
            if np.min(dists) >= radius_deg:
                kept_indices.append(i)
                kept_coords.append(pt)
    return df_sorted.iloc[kept_indices].copy()


def run_pipeline(requested_today=None, force=False, event_enabled=None):
    if requested_today is None:
        requested_today = datetime.now(ZoneInfo("Asia/Manila")).strftime("%Y-%m-%d")

    if not is_daily_prediction_enabled(force=force, event_enabled=event_enabled):
        print(
            f"Daily predictions are currently disabled "
            f"(ENABLE_DAILY_PREDICTIONS={ENABLE_DAILY_PREDICTIONS}, "
            f"PAROLA_ENABLE_DAILY_PREDICTIONS={os.environ.get('PAROLA_ENABLE_DAILY_PREDICTIONS')}). "
            f"Skipping run for {requested_today}."
        )
        return {
            "status": "skipped",
            "reason": "daily_predictions_disabled",
            "date": requested_today,
            "pelagic_count": 0,
            "demersal_count": 0,
        }

    target_date = get_target_date("cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m", requested_today)
    current_month = pd.to_datetime(target_date).month

    f_thetao = os.path.join(WORK_DIR, "live_thetao.nc")
    f_cur = os.path.join(WORK_DIR, "live_cur.nc")
    f_zos = os.path.join(WORK_DIR, "live_zos.nc")
    f_bgc = os.path.join(WORK_DIR, "live_bgc.nc")

    print(f"\n=== 1. Fetching Live Copernicus Marine Data for {target_date} (Month {current_month}) ===")
    copernicusmarine.subset(
        dataset_id="cmems_mod_glo_phy-thetao_anfc_0.083deg_P1D-m",
        variables=["thetao"],
        minimum_longitude=116.0, maximum_longitude=131.0,
        minimum_latitude=2.0, maximum_latitude=23.0,
        start_datetime=f"{target_date}T00:00:00", end_datetime=f"{target_date}T23:59:59",
        minimum_depth=0.0, maximum_depth=1.0,
        output_filename=f_thetao, overwrite=True
    )
    copernicusmarine.subset(
        dataset_id="cmems_mod_glo_phy-cur_anfc_0.083deg_P1D-m",
        variables=["uo", "vo"],
        minimum_longitude=116.0, maximum_longitude=131.0,
        minimum_latitude=2.0, maximum_latitude=23.0,
        start_datetime=f"{target_date}T00:00:00", end_datetime=f"{target_date}T23:59:59",
        minimum_depth=0.0, maximum_depth=1.0,
        output_filename=f_cur, overwrite=True
    )
    copernicusmarine.subset(
        dataset_id="cmems_mod_glo_phy_anfc_0.083deg_P1D-m",
        variables=["zos"],
        minimum_longitude=116.0, maximum_longitude=131.0,
        minimum_latitude=2.0, maximum_latitude=23.0,
        start_datetime=f"{target_date}T00:00:00", end_datetime=f"{target_date}T23:59:59",
        output_filename=f_zos, overwrite=True
    )
    copernicusmarine.subset(
        dataset_id="cmems_mod_glo_bgc-pft_anfc_0.25deg_P1D-m",
        variables=["chl"],
        minimum_longitude=116.0, maximum_longitude=131.0,
        minimum_latitude=2.0, maximum_latitude=23.0,
        start_datetime=f"{target_date}T00:00:00", end_datetime=f"{target_date}T23:59:59",
        minimum_depth=0.0, maximum_depth=1.0,
        output_filename=f_bgc, overwrite=True
    )

    print("\n=== 2. Merging, Regridding & Computing Derived Ocean Features ===")
    ds_thetao = xr.open_dataset(f_thetao).squeeze("depth", drop=True)
    ds_cur = xr.open_dataset(f_cur).squeeze("depth", drop=True)
    ds_zos = xr.open_dataset(f_zos)
    bgc = xr.open_dataset(f_bgc).squeeze("depth", drop=True)

    phy = xr.merge([ds_thetao, ds_cur, ds_zos])
    phy["is_ocean"] = phy["thetao"].notnull()
    phy["chl"] = bgc.chl.interp(latitude=phy.latitude, longitude=phy.longitude, method="linear")

    for var in ["thetao", "zos", "uo", "vo", "chl"]:
        phy[var] = phy[var].interpolate_na(dim="longitude", method="nearest", limit=6)
        phy[var] = phy[var].interpolate_na(dim="latitude", method="nearest", limit=6)

    sst_grad_lat, sst_grad_lon = np.gradient(phy.thetao.values, axis=(-2, -1))
    phy["sst_frontal_gradient"] = (("time", "latitude", "longitude"), np.sqrt(sst_grad_lat**2 + sst_grad_lon**2))

    chl_grad_lat, chl_grad_lon = np.gradient(phy.chl.values, axis=(-2, -1))
    phy["chl_frontal_gradient"] = (("time", "latitude", "longitude"), np.sqrt(chl_grad_lat**2 + chl_grad_lon**2))

    monthly_clim = compute_monthly_climatology(current_month, phy.latitude, phy.longitude)
    if monthly_clim is not None:
        phy["sst_anomaly"] = phy.thetao - monthly_clim
    else:
        phy["sst_anomaly"] = phy.thetao - phy.thetao.mean(dim=["latitude", "longitude"])

    df_today = phy.to_dataframe().reset_index()
    df_today = df_today[df_today["is_ocean"] == True].copy()
    df_today.rename(columns={"latitude": "grid_lat", "longitude": "grid_lon"}, inplace=True)
    df_today["detection_date"] = requested_today
    df_today["month"] = current_month

    # Fill narrow-strait satellite chlorophyll gaps using 2D nearest ocean neighbor
    for col in ["chl", "chl_frontal_gradient", "sst_frontal_gradient", "sst_anomaly"]:
        mask = df_today[col].isna()
        if mask.any():
            valid = df_today[~mask]
            tree = cKDTree(valid[["grid_lat", "grid_lon"]].values)
            _, idx = tree.query(df_today.loc[mask, ["grid_lat", "grid_lon"]].values, k=1)
            df_today.loc[mask, col] = valid[col].values[idx]

    print("\n=== 3. Running Pelagic & Demersal Models + Port Buffer + Spatial NMS ===")
    ph_gdf = gpd.read_file(os.path.join(ASSET_DIR, "gadm41_PHL_0.json")).to_crs(epsg=3123)
    ph_land = ph_gdf.geometry.union_all()
    ph_boundary = ph_land.boundary

    # --- A. Pelagic Inference ---
    model_pel = lgb.Booster(model_file=os.path.join(ASSET_DIR, "parola_pelagic_model_v2.txt"))
    df_today["chl_sst_ratio"] = df_today["chl"] / df_today["thetao"]
    pel_features = [
        "thetao", "zos", "uo", "vo", "chl",
        "sst_frontal_gradient", "chl_frontal_gradient",
        "sst_anomaly", "month", "chl_sst_ratio"
    ]
    df_today["catch_probability"] = np.minimum(model_pel.predict(df_today[pel_features]), 0.95)

    presence = pd.read_parquet(os.path.join(ASSET_DIR, "vbd_gridded_presence.parquet"))
    grouped_vbd = (
        presence.groupby(["grid_lat", "grid_lon"], as_index=False)
        .size()
        .rename(columns={"size": "detections"})
    )
    grouped_vbd[["grid_lat", "grid_lon"]] = grouped_vbd[["grid_lat", "grid_lon"]].astype(np.float32)
    labels = DBSCAN(eps=0.001, min_samples=15, metric="haversine", algorithm="ball_tree").fit_predict(
        np.radians(grouped_vbd[["grid_lat", "grid_lon"]].values),
        sample_weight=grouped_vbd["detections"].values,
    )
    grouped_vbd["cluster_id"] = labels
    clusters = grouped_vbd[grouped_vbd.cluster_id >= 0].groupby("cluster_id").agg(
        latitude=("grid_lat", "mean"), longitude=("grid_lon", "mean")
    ).reset_index()

    cand = df_today[df_today["catch_probability"] >= MINIMUM_CATCH_PROBABILITY].copy()
    ref = np.radians(clusters[["latitude", "longitude"]].to_numpy(dtype=float))
    pts = np.radians(cand[["grid_lat", "grid_lon"]].to_numpy(dtype=float))
    dist_rad, nearest_idx = BallTree(ref, metric="haversine").query(pts, k=1)
    cand["km_to_nearest_hotspot"] = dist_rad[:, 0] * 6371.0
    cand["dbscan_cluster_id"] = clusters.cluster_id.to_numpy()[nearest_idx[:, 0]]

    pel_grounded = cand[cand["km_to_nearest_hotspot"] <= 15.0].copy()
    pel_offshore = filter_offshore(pel_grounded, "grid_lat", "grid_lon", 3.0, ph_land, ph_boundary)
    pel_peaks = spatial_nms(pel_offshore, "grid_lat", "grid_lon", "catch_probability", radius_km=16.5)

    # --- B. Demersal Inference ---
    tree_live = cKDTree(df_today[["grid_lat", "grid_lon"]].values)
    dem_raw = pd.read_csv(os.path.join(ASSET_DIR, "demersal_lightgbm_ready.csv"))
    dem_raw["benthic_habitat"] = dem_raw["benthic_habitat"].astype("category")

    dem_model = lgb.Booster(model_file=os.path.join(ASSET_DIR, "parola_demersal_model.txt"))
    dem_features = [
        "bathymetry", "slope", "rugosity", "distance_to_reef",
        "bottom_temperature", "bottom_current_speed", "tidal_amplitude", "benthic_habitat"
    ]
    dem_raw["catch_probability"] = np.minimum(dem_model.predict(dem_raw[dem_features]), 0.95)

    dem_sites = dem_raw[
        (dem_raw["bathymetry"] <= -6.0) &
        (dem_raw["bathymetry"] >= -350.0) &
        (dem_raw["bathymetry"] != -934.0)
    ].copy()
    dem_sites["lat_r"] = dem_sites["decimalLatitude"].round(3)
    dem_sites["lon_r"] = dem_sites["decimalLongitude"].round(3)
    dem_unique = dem_sites.drop_duplicates(subset=["lat_r", "lon_r"]).copy().reset_index(drop=True)

    _, idx_live = tree_live.query(dem_unique[["decimalLatitude", "decimalLongitude"]].values, k=1)
    live_matched = df_today.iloc[idx_live].reset_index(drop=True)
    dem_unique["thetao_live"] = live_matched["thetao"].values
    dem_unique["chl_live"] = live_matched["chl"].values
    dem_unique["uo_live"] = live_matched["uo"].values
    dem_unique["vo_live"] = live_matched["vo"].values

    dem_candidates = dem_unique[dem_unique["catch_probability"] >= MINIMUM_CATCH_PROBABILITY].copy()
    dem_offshore = filter_offshore(dem_candidates, "decimalLatitude", "decimalLongitude", 1.2, ph_land, ph_boundary)
    dem_peaks = spatial_nms(dem_offshore, "decimalLatitude", "decimalLongitude", "catch_probability", radius_km=12.0)

    # --- 4. Sync to Supabase PostGIS ---
    db_url = clean_database_url(os.environ.get("DATABASE_URL"))
    if db_url:
        half = 0.083333 / 2.0
        rows_to_insert = []
        for _, r in pel_peaks.iterrows():
            lat, lon = float(r["grid_lat"]), float(r["grid_lon"])
            u = float(r["uo"])
            v = float(r["vo"])
            speed = float(np.sqrt(u**2 + v**2))
            heading = float((np.degrees(np.arctan2(u, v)) + 360) % 360)
            rows_to_insert.append((
                requested_today, "pelagic",
                lon - half, lat - half, lon + half, lat + half,
                lon, lat,
                float(r["catch_probability"]), int(r["dbscan_cluster_id"]),
                float(r["thetao"]), float(r["chl"]),
                u, v, speed, heading
            ))
        for idx_d, r in dem_peaks.iterrows():
            lat, lon = float(r["decimalLatitude"]), float(r["decimalLongitude"])
            u = float(r["uo_live"])
            v = float(r["vo_live"])
            speed = float(np.sqrt(u**2 + v**2))
            heading = float((np.degrees(np.arctan2(u, v)) + 360) % 360)
            rows_to_insert.append((
                requested_today, "demersal",
                lon - 0.02, lat - 0.02, lon + 0.02, lat + 0.02,
                lon, lat,
                float(r["catch_probability"]), int(idx_d + 1),
                float(r["thetao_live"]), float(r["chl_live"]),
                u, v, speed, heading
            ))
        insert_sql = """
            INSERT INTO public.daily_grid_predictions (
                prediction_date, model_type, grid_cell_geom, centroid_geom,
                catch_probability, dbscan_cluster_id, sst, chl_a,
                current_u, current_v, current_speed, current_heading
            ) VALUES (
                %s, %s,
                ST_MakeEnvelope(%s, %s, %s, %s, 4326),
                ST_SetSRID(ST_MakePoint(%s, %s), 4326),
                %s, %s, %s, %s,
                %s, %s, %s, %s
            )
        """
        if psycopg is not None:
            with psycopg.connect(db_url) as conn:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM public.daily_grid_predictions WHERE prediction_date = %s;", (requested_today,))
                    cur.executemany(insert_sql, rows_to_insert)
                conn.commit()
        elif psycopg2 is not None:
            from psycopg2.extras import execute_batch
            conn = psycopg2.connect(db_url)
            try:
                with conn:
                    with conn.cursor() as cur:
                        cur.execute("DELETE FROM public.daily_grid_predictions WHERE prediction_date = %s;", (requested_today,))
                        execute_batch(cur, insert_sql, rows_to_insert, page_size=500)
            finally:
                conn.close()
        else:
            raise RuntimeError("Neither psycopg nor psycopg2 is installed for DATABASE_URL sync.")
        print(f"Synced {len(rows_to_insert)} hotspots ({len(pel_peaks)} pelagic + {len(dem_peaks)} demersal) to Supabase for {requested_today}.")

    for f in [f_thetao, f_cur, f_zos, f_bgc, os.path.join(WORK_DIR, f"clim_month_{current_month:02d}.nc")]:
        if os.path.exists(f):
            os.remove(f)

    return {
        "status": "completed",
        "date": requested_today,
        "source_date": target_date,
        "pelagic_count": len(pel_peaks),
        "demersal_count": len(dem_peaks),
    }


def lambda_handler(event, context):
    """AWS Lambda entry point."""
    req_date = event.get("date") if isinstance(event, dict) else None
    force = bool(event.get("force", False)) if isinstance(event, dict) else False
    event_enabled = event.get("enabled") if isinstance(event, dict) else None
    return run_pipeline(requested_today=req_date, force=force, event_enabled=event_enabled)


if __name__ == "__main__":
    run_pipeline()

