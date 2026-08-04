import os
import boto3
import pandas as pd
import lightgbm as lgb
from datetime import datetime

# Initialize S3 client
s3 = boto3.client('s3')
BUCKET_NAME = os.environ.get('MODEL_BUCKET_NAME', 'parola-data-bucket')
MODEL_KEY = 'models/parola_pelagic_model_v2.txt'
MODEL_LOCAL_PATH = f'/tmp/parola_pelagic_model_v2.txt'

# Load model globally to reuse across lambda invocations (Cold start optimization)
model = None

def download_model_if_needed():
    global model
    if model is None:
        print(f"Downloading model {MODEL_KEY} from s3://{BUCKET_NAME}...")
        s3.download_file(BUCKET_NAME, MODEL_KEY, MODEL_LOCAL_PATH)
        print("Loading LightGBM model...")
        model = lgb.Booster(model_file=MODEL_LOCAL_PATH)

def download_and_process_copernicus_data():
    """
    Downloads today's NetCDF data from Copernicus and computes the necessary gradients and features.
    In a real implementation, this would use `copernicusmarine` or `xarray` to pull the latest 
    `phy_data_v2.nc` and `bgc_data.nc`, interpolate onto a grid, and compute spatial derivatives.
    """
    print("Connecting to CMEMS to fetch today's NetCDF datasets...")
    # Example snippet for what this would look like:
    # import copernicusmarine as cme
    # import xarray as xr
    # cme.subset(dataset_id="cmems_mod_glo_phy_anfc_0.083deg_P1D-m", ...)
    # ds_phy = xr.open_dataset('phy_data_v2.nc')
    # ds_bgc = xr.open_dataset('bgc_data.nc')
    # ... computation of sst_frontal_gradient etc. ...
    
    # For now, we simulate the output as a pandas DataFrame matching `copernicus_live_today.csv`
    import numpy as np
    print("Mocking Copernicus data download and feature engineering for demonstration...")
    num_samples = 5000
    data = {
        'grid_lat': np.random.uniform(5, 20, num_samples),
        'grid_lon': np.random.uniform(115, 128, num_samples),
        'thetao': np.random.uniform(26, 30, num_samples),
        'zos': np.random.uniform(0.5, 1.5, num_samples),
        'uo': np.random.uniform(-0.5, 0.5, num_samples),
        'vo': np.random.uniform(-0.5, 0.5, num_samples),
        'chl': np.random.uniform(0.1, 5.0, num_samples),
        'sst_frontal_gradient': np.random.uniform(0, 0.5, num_samples),
        'chl_frontal_gradient': np.random.uniform(0, 0.2, num_samples),
        'sst_anomaly': np.random.uniform(-1, 1, num_samples)
    }
    return pd.DataFrame(data)

def handler(event, context):
    try:
        print("Initializing Parola Daily Inference Lambda...")
        download_model_if_needed()
        
        # 1. Load Today's Ocean Data & Compute Features
        df_today = download_and_process_copernicus_data()
        
        # 2. Compute Derived Features
        df_today['month'] = datetime.now().month
        df_today['chl_sst_ratio'] = df_today['chl'] / df_today['thetao']

        # 3. Isolate the Feature Matrix
        feature_cols = [
            'thetao', 'zos', 'uo', 'vo', 'chl', 'sst_frontal_gradient',
            'chl_frontal_gradient', 'sst_anomaly', 'month', 'chl_sst_ratio'
        ]
        df_today = df_today.dropna(subset=feature_cols)
        X_today = df_today[feature_cols]

        # 4. Generate Predictions
        print("Scanning ocean grid for high-probability zones...")
        df_today['catch_probability'] = model.predict(X_today)

        # 5. Extract ALL Probable Hotspots (threshold > 0.50 as per spec)
        probable_zones = df_today[df_today['catch_probability'] > 0.50].copy()

        # 6. Rank the Hotspots (Global AI Ranking)
        probable_zones = probable_zones.sort_values(by='catch_probability', ascending=False)
        probable_zones['global_rank'] = range(1, len(probable_zones) + 1)
        print(f"Isolated and ranked {len(probable_zones)} probable pelagic fishing zones.")

        # Save the actionable master list to S3 for the SMS Dispatcher
        output_cols = ['global_rank', 'grid_lat', 'grid_lon', 'catch_probability', 'thetao', 'chl']
        output_filename = f"/tmp/parola_daily_advisories.csv"
        probable_zones[output_cols].to_csv(output_filename, index=False)
        
        output_s3_key = 'advisories/parola_daily_advisories.csv'
        print(f"Uploading advisories to s3://{BUCKET_NAME}/{output_s3_key}...")
        s3.upload_file(output_filename, BUCKET_NAME, output_s3_key)
        
        return {
            'statusCode': 200,
            'body': f"Successfully generated {len(probable_zones)} advisories and saved to s3://{BUCKET_NAME}/{output_s3_key}"
        }

    except Exception as e:
        print(f"Error during Parola inference pipeline: {e}")
        raise e
