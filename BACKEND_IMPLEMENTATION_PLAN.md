# Parola Backend Completion - Comprehensive Implementation Plan

This document contains a self-contained, complete technical plan for implementing the remaining backend components of the **Parola** platform. It is designed to be passed to any AI agent or developer for execution.

---

## Executive Overview
Parola is an AI-driven localized fishing advisory & spatial analytics platform. This document outlines the step-by-step implementation plan for completing the remaining backend services across:
1. **`parola-api-service`** (Python / FastAPI + PostGIS)
2. **`app/api/sms/`** (Next.js App Router SMS routes)
3. **`backend/aws-inference/`** (AWS Lambda / Machine Learning Inference Pipeline)

---

## Architecture Overview & Stack
- **Database**: PostgreSQL with `PostGIS` extension (Supabase hosted).
- **Python Backend**: FastAPI, SQLAlchemy 2.0, GeoAlchemy2, Psycopg 3, Pydantic v2.
- **SMS Gateway Integration**: iPROG SMS API (`iprogSmsService.ts`).
- **ML Pipeline**: LightGBM, Pandas, Copernicus Marine Service (`copernicusmarine`), AWS SAM / Lambda.

---

## Phase 1: FastAPI User Spatial Registration & Daily Grid Ingestion API

### Objective
Expose REST API endpoints in `parola-api-service` for:
1. Registering/updating user profiles with spatial home port coordinates (`home_port_geom` as PostGIS `POINT(lon, lat)`).
2. Ingesting daily grid prediction batches into `daily_grid_predictions`.

### Key Files
- `parola-api-service/schemas.py`
- `parola-api-service/main.py`
- `parola-api-service/models.py`

### Implementation Steps

#### 1. Update `parola-api-service/schemas.py`
Add Pydantic schemas for user registration and prediction batch ingestion:
```python
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, time
import uuid

class UserCreate(BaseModel):
    phone_number: str = Field(..., example="09171234567")
    full_name: str = Field(..., example="Juan Dela Cruz")
    home_port_name: Optional[str] = Field("Brgy Pasil, Cebu", example="Brgy Pasil, Cebu")
    latitude: float = Field(..., ge=-90, le=90, example=10.2929)
    longitude: float = Field(..., ge=-180, le=180, example=123.8961)
    preferred_advisory_time: Optional[time] = Field(default="05:00:00")
    coop_id: Optional[uuid.UUID] = None

class UserResponse(BaseModel):
    id: uuid.UUID
    phone_number: str
    full_name: Optional[str]
    home_port_name: Optional[str]
    latitude: float
    longitude: float
    is_active: bool

    class Config:
        from_attributes = True

class DailyGridPredictionItem(BaseModel):
    prediction_date: date
    model_type: Optional[str] = "pelagic"
    lat: float
    lon: float
    catch_probability: float
    dbscan_cluster_id: Optional[int] = -1
    sst: Optional[float] = None
    chl_a: Optional[float] = None

class BatchPredictionIngestRequest(BaseModel):
    predictions: List[DailyGridPredictionItem]
```

#### 2. Update `parola-api-service/main.py`
Add the `/api/users` and `/api/predictions/ingest` endpoints:
```python
@app.post("/api/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED, tags=["Users"])
def register_or_update_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    cleaned_phone = payload.phone_number.strip()
    existing = db.query(models.User).filter(models.User.phone_number == cleaned_phone).first()
    point_wkt = f"SRID=4326;POINT({payload.longitude} {payload.latitude})"
    
    if existing:
        existing.full_name = payload.full_name
        existing.home_port_name = payload.home_port_name
        existing.home_port_geom = point_wkt
        if payload.preferred_advisory_time:
            existing.preferred_advisory_time = payload.preferred_advisory_time
        db.commit()
        db.refresh(existing)
        user_obj = existing
    else:
        new_user = models.User(
            phone_number=cleaned_phone,
            full_name=payload.full_name,
            home_port_name=payload.home_port_name,
            home_port_geom=point_wkt,
            preferred_advisory_time=payload.preferred_advisory_time or "05:00:00"
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        user_obj = new_user

    coords = db.execute(
        text("SELECT ST_Y(home_port_geom) as lat, ST_X(home_port_geom) as lon FROM public.users WHERE id = :uid"),
        {"uid": str(user_obj.id)}
    ).fetchone()

    return schemas.UserResponse(
        id=user_obj.id,
        phone_number=user_obj.phone_number,
        full_name=user_obj.full_name,
        home_port_name=user_obj.home_port_name,
        latitude=coords.lat,
        longitude=coords.lon,
        is_active=user_obj.is_active
    )

@app.post("/api/predictions/ingest", status_code=status.HTTP_201_CREATED, tags=["Advisories"])
def ingest_daily_predictions(payload: schemas.BatchPredictionIngestRequest, db: Session = Depends(get_db)):
    inserted_count = 0
    for item in payload.predictions:
        centroid_wkt = f"SRID=4326;POINT({item.lon} {item.lat})"
        d = 0.005
        poly_wkt = f"SRID=4326;POLYGON(({item.lon-d} {item.lat-d}, {item.lon+d} {item.lat-d}, {item.lon+d} {item.lat+d}, {item.lon-d} {item.lat+d}, {item.lon-d} {item.lat-d}))"

        pred = models.DailyGridPrediction(
            prediction_date=item.prediction_date,
            model_type=item.model_type,
            grid_cell_geom=poly_wkt,
            centroid_geom=centroid_wkt,
            catch_probability=item.catch_probability,
            dbscan_cluster_id=item.dbscan_cluster_id,
            sst=item.sst,
            chl_a=item.chl_a
        )
        db.add(pred)
        inserted_count += 1
    db.commit()
    return {"status": "success", "inserted_records": inserted_count}
```

---

## Phase 2: CLI CSV Ingestion Utility Script

### Objective
Create a standalone Python CLI script `ingest_predictions.py` inside `parola-api-service/` to parse `parola_daily_advisories.csv` output from S3 or local storage and populate PostGIS `daily_grid_predictions`.

### Key File
- `parola-api-service/ingest_predictions.py`

### Implementation Details
```python
import sys
import os
import pandas as pd
from datetime import date
from sqlalchemy import text
from database import SessionLocal

def ingest_csv(csv_path: str, prediction_date: str = None):
    if not os.path.exists(csv_path):
        print(f"Error: File {csv_path} not found.")
        sys.exit(1)

    p_date = prediction_date or date.today().isoformat()
    df = pd.read_csv(csv_path)
    
    db = SessionLocal()
    try:
        count = 0
        for _, row in df.iterrows():
            lat = row['grid_lat']
            lon = row['grid_lon']
            prob = row['catch_probability']
            sst = row.get('thetao', None)
            chl = row.get('chl', None)

            query = text("""
                INSERT INTO public.daily_grid_predictions (
                    prediction_date, model_type, grid_cell_geom, centroid_geom, catch_probability, dbscan_cluster_id, sst, chl_a, created_at
                ) VALUES (
                    :p_date, 'pelagic',
                    ST_SetSRID(ST_MakeEnvelope(:lon - 0.005, :lat - 0.005, :lon + 0.005, :lat + 0.005), 4326),
                    ST_SetSRID(ST_MakePoint(:lon, :lat), 4326),
                    :prob, -1, :sst, :chl, NOW()
                )
            """)
            db.execute(query, {
                "p_date": p_date,
                "lat": lat,
                "lon": lon,
                "prob": prob,
                "sst": sst,
                "chl": chl
            })
            count += 1
        db.commit()
        print(f"Successfully ingested {count} records for date {p_date}.")
    except Exception as e:
        db.rollback()
        print(f"Error during ingestion: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "parola_daily_advisories.csv"
    ingest_csv(path)
```

---

## Phase 3: Next.js Inbound SMS Webhook Handler

### Objective
Create a Next.js API route to process incoming SMS feedback webhooks from the iPROG SMS gateway.

### Key File
- `app/api/sms/webhook/route.ts`

### Implementation Details
```typescript
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone_number, message, message_id } = body;

    if (!phone_number || !message) {
      return NextResponse.json({ error: 'phone_number and message required' }, { status: 400 });
    }

    // Parse rating: 1 = High, 2 = Medium, 3 = Low catch
    const trimmed = message.trim();
    let feedbackValue = 2; // Default Medium
    if (trimmed.includes('1')) feedbackValue = 1;
    else if (trimmed.includes('3')) feedbackValue = 3;

    // Forward feedback to FastAPI service
    const apiUrl = process.env.PAROLA_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/feedback/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: null,
        advisory_id: null,
        feedback_value: feedbackValue,
        raw_sms_body: message,
      }),
    });

    return NextResponse.json({ status: 'received', forwarded: response.ok });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

---

## Phase 4: Copernicus Marine Telemetry & Lambda Integration

### Objective
Integrate the `copernicusmarine` Python client in `backend/aws-inference/lambda_function.py` for live oceanographic data fetching with simulation fallback.

### Key File
- `backend/aws-inference/lambda_function.py`

### Implementation Details
Add Copernicus credentials handling using environment variables `COPERNICUS_USERNAME` and `COPERNICUS_PASSWORD`.

```python
import copernicusmarine as cme

def download_and_process_copernicus_data():
    username = os.environ.get("COPERNICUS_USERNAME")
    password = os.environ.get("COPERNICUS_PASSWORD")
    
    if username and password:
        print("Fetching live oceanographic data from Copernicus Marine Service...")
        cme.login(username=username, password=password)
        # Fetch physical & biogeochemical NetCDF subset
        # cme.subset(dataset_id="cmems_mod_glo_phy_anfc_0.083deg_P1D-m", ...)
    else:
        print("Copernicus credentials unconfigured. Falling back to adaptive ocean simulation...")
        # Fallback simulation logic for demo resilience
```

---

## Verification Checklist

- [ ] **Phase 1**: Run `uvicorn main:app --reload` inside `parola-api-service/` and test `POST /api/users` and `POST /api/predictions/ingest`.
- [ ] **Phase 2**: Run `python ingest_predictions.py` with a sample `parola_daily_advisories.csv` file.
- [ ] **Phase 3**: Send a POST request to `/api/sms/webhook` with `{ "phone_number": "09171234567", "message": "1" }`.
- [ ] **Phase 4**: Verify `lambda_function.py` executes cleanly both with and without `COPERNICUS_USERNAME`.
