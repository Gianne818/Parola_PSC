import uuid
import hashlib
import os
import secrets
from datetime import date as date_type, datetime
from calendar_dates import manila_today
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import APIKeyHeader
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from database import get_db
import models
import schemas
import hsi_calculator
from species_catalog import resolve_species
from prediction_ingestion import IngestionError, ingest_predictions, get_ingestion_run
from geographic_access import geographic_read_profile, geographic_predicate, require_geographic_coverage

DEFAULT_SPECIES_SEED = [
    {
        "id": 1,
        "species_name": "Tamban / Tunsoy",
        "family": "Clupeidae",
        "local_name": "Sardines & Herrings",
        "category": "pelagic",
        "temp_min": 24.0,
        "temp_opt_low": 27.0,
        "temp_opt_high": 29.5,
        "temp_max": 32.0,
        "depth_min": 0.0,
        "depth_max": 50.0
    },
    {
        "id": 2,
        "species_name": "Galunggong / Talakitok",
        "family": "Carangidae",
        "local_name": "Jacks & Scads",
        "category": "pelagic",
        "temp_min": 22.0,
        "temp_opt_low": 26.0,
        "temp_opt_high": 29.0,
        "temp_max": 31.0,
        "depth_min": 10.0,
        "depth_max": 100.0
    },
    {
        "id": 3,
        "species_name": "Alumahan / Tulingan / Bariles",
        "family": "Scombridae",
        "local_name": "Mackerels & Tunas",
        "category": "pelagic",
        "temp_min": 21.0,
        "temp_opt_low": 25.0,
        "temp_opt_high": 28.5,
        "temp_max": 31.5,
        "depth_min": 0.0,
        "depth_max": 200.0
    },
    {
        "id": 4,
        "species_name": "Dilis",
        "family": "Engraulidae",
        "local_name": "Anchovies",
        "category": "pelagic",
        "temp_min": 23.0,
        "temp_opt_low": 26.5,
        "temp_opt_high": 29.0,
        "temp_max": 31.0,
        "depth_min": 0.0,
        "depth_max": 30.0
    },
    {
        "id": 5,
        "species_name": "Kipalkipal / Bahi",
        "family": "Belonidae",
        "local_name": "Needlefishes",
        "category": "pelagic",
        "temp_min": 25.0,
        "temp_opt_low": 27.5,
        "temp_opt_high": 30.0,
        "temp_max": 32.5,
        "depth_min": 0.0,
        "depth_max": 20.0
    },
    {
        "id": 101,
        "species_name": "Lapu-lapu",
        "family": "Serranidae",
        "local_name": "Groupers",
        "category": "demersal",
        "temp_min": 22.0,
        "temp_opt_low": 25.5,
        "temp_opt_high": 28.5,
        "temp_max": 31.0,
        "depth_min": 10.0,
        "depth_max": 150.0
    },
    {
        "id": 102,
        "species_name": "Maya-maya",
        "family": "Lutjanidae",
        "local_name": "Snappers",
        "category": "demersal",
        "temp_min": 20.0,
        "temp_opt_low": 24.0,
        "temp_opt_high": 28.0,
        "temp_max": 30.5,
        "depth_min": 15.0,
        "depth_max": 180.0
    },
    {
        "id": 103,
        "species_name": "Bisugo",
        "family": "Nemipteridae",
        "local_name": "Threadfin Breams",
        "category": "demersal",
        "temp_min": 21.5,
        "temp_opt_low": 25.0,
        "temp_opt_high": 28.0,
        "temp_max": 31.0,
        "depth_min": 20.0,
        "depth_max": 100.0
    },
    {
        "id": 104,
        "species_name": "Samaral",
        "family": "Siganidae",
        "local_name": "Rabbitfishes",
        "category": "demersal",
        "temp_min": 24.0,
        "temp_opt_low": 27.0,
        "temp_opt_high": 30.0,
        "temp_max": 32.0,
        "depth_min": 1.0,
        "depth_max": 30.0
    },
    {
        "id": 105,
        "species_name": "Katambak / Dugso",
        "family": "Lethrinidae",
        "local_name": "Emperors",
        "category": "demersal",
        "temp_min": 22.0,
        "temp_opt_low": 25.0,
        "temp_opt_high": 28.5,
        "temp_max": 31.0,
        "depth_min": 10.0,
        "depth_max": 120.0
    }
]

def find_species_profile(db: Session, query_str: str) -> Optional[dict]:
    try:
        rows = []
        for model, category in ((models.PelagicSpecies, 'pelagic'), (models.DemersalSpecies, 'demersal')):
            for row in db.query(model).limit(201).all():
                rows.append({'id': row.id, 'category': category, 'species_name': row.common_name, 'common_name': row.common_name,
                             'family': row.family, 'local_name': None, 'representative_species': row.representative_species, 'name_source': 'common_name'})
        if len(rows) > 200:
            raise ValueError('Catalog exceeds reviewed bound')
        return resolve_species(rows, query_str)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=503, detail={'code': 'species_catalog_unavailable', 'message': 'Species catalog unavailable.'})


app = FastAPI(
    title="Parola Pelagic Advisory API",
    description="Backend REST API for Parola localized fishing advisories & PostGIS spatial queries.",
    version="2.0.0"
)

def get_allowed_origins() -> List[str]:
    """Explicit CORS origins from CORS_ALLOWED_ORIGINS (comma-separated).

    Never use ["*"] together with allow_credentials=True: browsers reject
    wildcard + credentials, and it exposes credentialed endpoints to any site.
    """
    raw = os.environ.get("CORS_ALLOWED_ORIGINS", "")
    origins = [o.strip() for o in raw.split(",") if o.strip()]
    if origins:
        return origins
    # Secure local-dev default: the Next.js frontend only.
    return ["http://localhost:3000"]


API_KEY_HEADER = APIKeyHeader(name="X-API-Key", auto_error=False)


def require_api_key(api_key: Optional[str] = Depends(API_KEY_HEADER)) -> str:
    """Shared-secret auth for trusted callers (Next.js proxies, ingest jobs).

    Fails closed with 503 when PAROLA_API_KEY is not configured so a missing
    secret can't silently leave protected endpoints open.
    """
    expected = os.environ.get("PAROLA_API_KEY", "")
    if not expected:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="API key authentication is not configured.",
        )
    if not api_key or not secrets.compare_digest(api_key, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key.",
        )
    return api_key


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return f"{salt}${key.hex()}"

def verify_password(password: str, stored_hash: str) -> bool:
    if not stored_hash or "$" not in stored_hash:
        return False
    salt, key_hex = stored_hash.split("$", 1)
    new_key = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), 100000)
    return secrets.compare_digest(new_key.hex(), key_hex)

@app.on_event("startup")
def startup_db_migration():
    try:
        db = next(get_db())
        db.execute(text("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash TEXT;"))
        db.commit()
        # Species catalogs use the deployed schema; no startup seed or alternate
        # catalog schema is created. Missing catalogs remain explicitly unavailable.
    except Exception as e:
        pass


@app.exception_handler(OperationalError)
def db_operational_error_handler(request: Request, exc: OperationalError):
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": "Database connection failed",
            "detail": "Please update 'DATABASE_URL' in parola-api-service/.env with your actual Supabase PostgreSQL password.",
            "hint": "Replace '[YOUR-PASSWORD]' in parola-api-service/.env with your database password."
        }
    )

@app.get("/api/health", tags=["System"])
def health_check():
    return {"status": "ok", "service": "parola-api", "timestamp": datetime.utcnow().isoformat()}

@app.get(
    "/api/advisories/nearest",
    response_model=schemas.NearbyAdvisoriesResponse,
    tags=["Advisories"]
)
def get_nearest_advisories(
    request: Request,
    lat: Optional[float] = Query(None, ge=-90, le=90, description="Latitude of user/vessel"),
    lon: Optional[float] = Query(None, ge=-180, le=180, description="Longitude of user/vessel"),
    user_id: Optional[uuid.UUID] = Query(None, description="Registered User UUID in Supabase"),
    prediction_date: Optional[date_type] = Query(default_factory=manila_today),
    min_probability: float = Query(0.50, ge=0.0, le=1.0),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    geographic_profile = geographic_read_profile(request)
    if geographic_profile and user_id is not None and str(user_id) != geographic_profile:
        raise HTTPException(403, detail={'code': 'geographic_owner_mismatch'})
    if user_id is not None:
        coords = db.execute(
            text("SELECT ST_Y(home_port_geom) AS lat, ST_X(home_port_geom) AS lon FROM public.users WHERE id = :uid"),
            {"uid": str(user_id)}
        ).fetchone()
        if not coords:
            raise HTTPException(status_code=404, detail=f"User with id={user_id} not found")
        query_lat, query_lon = coords.lat, coords.lon
    elif lat is not None and lon is not None:
        query_lat, query_lon = lat, lon
    else:
        raise HTTPException(status_code=400, detail="Must specify either (lat, lon) OR user_id.")

    require_geographic_coverage(db, geographic_profile, prediction_date, min_probability)
    geographic_filter = geographic_predicate('g.centroid_geom') if geographic_profile else ''
    sql_query = text(f"""
        SELECT 
            g.id AS grid_id,
            g.catch_probability,
            g.dbscan_cluster_id,
            ST_Y(g.centroid_geom) AS target_lat,
            ST_X(g.centroid_geom) AS target_lon,
            ROUND((ST_Distance(
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, 
                g.centroid_geom::geography
            ) / 1000.0)::numeric, 2)::DOUBLE PRECISION AS distance_km,
            ROUND((degrees(ST_Azimuth(
                ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), 
                g.centroid_geom
            ))::numeric + 360) % 360, 1)::DOUBLE PRECISION AS bearing_degrees,
            CASE 
                WHEN degrees(ST_Azimuth(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), g.centroid_geom)) >= 348.75 OR degrees(ST_Azimuth(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), g.centroid_geom)) < 11.25 THEN 'N'
                WHEN degrees(ST_Azimuth(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), g.centroid_geom)) BETWEEN 11.25 AND 33.75 THEN 'NNE'
                WHEN degrees(ST_Azimuth(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), g.centroid_geom)) BETWEEN 33.75 AND 56.25 THEN 'NE'
                WHEN degrees(ST_Azimuth(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), g.centroid_geom)) BETWEEN 56.25 AND 78.75 THEN 'ENE'
                WHEN degrees(ST_Azimuth(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), g.centroid_geom)) BETWEEN 78.75 AND 101.25 THEN 'E'
                WHEN degrees(ST_Azimuth(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), g.centroid_geom)) BETWEEN 101.25 AND 123.75 THEN 'ESE'
                WHEN degrees(ST_Azimuth(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), g.centroid_geom)) BETWEEN 123.75 AND 146.25 THEN 'SE'
                WHEN degrees(ST_Azimuth(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), g.centroid_geom)) BETWEEN 146.25 AND 168.75 THEN 'SSE'
                WHEN degrees(ST_Azimuth(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), g.centroid_geom)) BETWEEN 168.75 AND 191.25 THEN 'S'
                WHEN degrees(ST_Azimuth(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), g.centroid_geom)) BETWEEN 191.25 AND 213.75 THEN 'SSW'
                WHEN degrees(ST_Azimuth(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), g.centroid_geom)) BETWEEN 213.75 AND 236.25 THEN 'SW'
                WHEN degrees(ST_Azimuth(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), g.centroid_geom)) BETWEEN 236.25 AND 258.75 THEN 'WSW'
                WHEN degrees(ST_Azimuth(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), g.centroid_geom)) BETWEEN 258.75 AND 281.25 THEN 'W'
                WHEN degrees(ST_Azimuth(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), g.centroid_geom)) BETWEEN 281.25 AND 303.75 THEN 'WNW'
                WHEN degrees(ST_Azimuth(ST_SetSRID(ST_MakePoint(:lon, :lat), 4326), g.centroid_geom)) BETWEEN 303.75 AND 326.25 THEN 'NW'
                ELSE 'NNW'
            END AS compass_bearing,
            g.sst,
            g.chl_a
        FROM public.daily_grid_predictions g
        WHERE g.prediction_date = :p_date
          AND g.catch_probability >= :p_prob
          {geographic_filter}
        ORDER BY g.centroid_geom <-> ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)
        LIMIT :limit
    """)

    rows = db.execute(sql_query, {
        "lat": query_lat,
        "lon": query_lon,
        "p_date": prediction_date,
        "p_prob": min_probability,
        "limit": limit,
        "geo_profile_id": geographic_profile
    }).fetchall()

    hotspots = [
        schemas.FishingHotspotItem(
            grid_id=row.grid_id,
            catch_probability=row.catch_probability,
            dbscan_cluster_id=row.dbscan_cluster_id,
            target_lat=row.target_lat,
            target_lon=row.target_lon,
            distance_km=float(row.distance_km),
            bearing_degrees=float(row.bearing_degrees),
            compass_bearing=row.compass_bearing,
            sst=row.sst,
            chl_a=row.chl_a
        )
        for row in rows
    ]

    return schemas.NearbyAdvisoriesResponse(
        query_lat=query_lat,
        query_lon=query_lon,
        prediction_date=prediction_date,
        min_probability=min_probability,
        total_found=len(hotspots),
        hotspots=hotspots
    )

@app.post(
    "/api/advisories/log",
    status_code=status.HTTP_201_CREATED,
    tags=["Advisories"],
    dependencies=[Depends(require_api_key)],
)
def log_sent_advisory(payload: schemas.CreateAdvisoryRequest, db: Session = Depends(get_db)):
    advisory = models.DailyAdvisory(
        user_id=payload.user_id,
        advisory_date=payload.advisory_date,
        target_grid_id=payload.target_grid_id,
        distance_km=payload.distance_km,
        compass_bearing=payload.compass_bearing,
        raw_gps_lat=payload.raw_gps_lat,
        raw_gps_lon=payload.raw_gps_lon,
        maps_short_link=payload.maps_short_link,
        sms_text=payload.sms_text,
        sms_message_id=payload.sms_message_id,
        sent_at=datetime.utcnow()
    )
    db.add(advisory)
    db.commit()
    db.refresh(advisory)
    return {"status": "success", "advisory_id": str(advisory.id)}

@app.post(
    "/api/feedback/submit",
    status_code=status.HTTP_201_CREATED,
    tags=["Feedback"],
    dependencies=[Depends(require_api_key)],
)
def submit_feedback(payload: schemas.CreateFeedbackRequest, db: Session = Depends(get_db)):
    feedback = models.CatchFeedback(
        user_id=payload.user_id,
        advisory_id=payload.advisory_id,
        feedback_value=payload.feedback_value,
        raw_sms_body=payload.raw_sms_body,
        received_at=datetime.utcnow()
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return {"status": "success", "feedback_id": str(feedback.id)}


@app.post("/api/users", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED, tags=["Users"])
def register_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    # REG-02: there is one enrollment writer, which validates the real Supabase
    # session and persists explicit consent. This legacy route cannot bypass it.
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Use the verified registration flow at /api/users/register.",
    )


@app.put("/api/users/profile", response_model=schemas.UserResponse, tags=["Users"], dependencies=[Depends(require_api_key)])
def update_user_profile(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Use owner-authenticated profile updates at /api/users/profile.",
    )


@app.post("/api/users/login", response_model=schemas.UserResponse, tags=["Users"])
def login_user(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    cleaned_phone = payload.phone_number.strip()
    user_obj = db.query(models.User).filter(models.User.phone_number == cleaned_phone).first()

    if not user_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found for this phone number. Please register first."
        )

    if not user_obj.password_hash or not verify_password(payload.password, user_obj.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again."
        )

    coords = db.execute(
        text("SELECT ST_Y(home_port_geom) as lat, ST_X(home_port_geom) as lon FROM public.users WHERE id = :uid"),
        {"uid": str(user_obj.id)}
    ).fetchone()

    return schemas.UserResponse(
        id=user_obj.id,
        phone_number=user_obj.phone_number,
        full_name=user_obj.full_name,
        home_port_name=user_obj.home_port_name,
        latitude=coords.lat if coords else 0.0,
        longitude=coords.lon if coords else 0.0,
        is_active=user_obj.is_active,
        advisory_days=user_obj.advisory_days,
        preferred_advisory_time=user_obj.preferred_advisory_time,
        preferred_language=user_obj.preferred_language,
        habitat_preference=user_obj.habitat_preference,
    )


@app.get("/api/users/by-phone", response_model=schemas.UserResponse, tags=["Users"], dependencies=[Depends(require_api_key)])
def get_user_by_phone(phone_number: str = Query(...), db: Session = Depends(get_db)):
    cleaned_phone = phone_number.strip()
    user_obj = db.query(models.User).filter(models.User.phone_number == cleaned_phone).first()
    if not user_obj:
        raise HTTPException(status_code=404, detail="User not found with this phone number.")

    coords = db.execute(
        text("SELECT ST_Y(home_port_geom) as lat, ST_X(home_port_geom) as lon FROM public.users WHERE id = :uid"),
        {"uid": str(user_obj.id)}
    ).fetchone()

    return schemas.UserResponse(
        id=user_obj.id,
        phone_number=user_obj.phone_number,
        full_name=user_obj.full_name,
        home_port_name=user_obj.home_port_name,
        latitude=coords.lat if coords else 0.0,
        longitude=coords.lon if coords else 0.0,
        is_active=user_obj.is_active,
        advisory_days=user_obj.advisory_days,
        preferred_advisory_time=user_obj.preferred_advisory_time,
        preferred_language=user_obj.preferred_language,
        habitat_preference=user_obj.habitat_preference,
    )


@app.post("/api/predictions/ingest", status_code=status.HTTP_201_CREATED, tags=["Advisories"], dependencies=[Depends(require_api_key)])
def ingest_daily_predictions(payload: schemas.BatchPredictionIngestRequest, response: Response, db: Session = Depends(get_db)):
    try:
        result = ingest_predictions(db, payload.predictions, payload.run_id)
    except IngestionError as error:
        raise HTTPException(status_code=error.status_code, detail=error.as_detail()) from None
    response.status_code = 200 if result['replayed'] else 201
    return result


@app.get('/api/predictions/runs/{run_id}', tags=['Advisories'], dependencies=[Depends(require_api_key)])
def prediction_ingestion_status(run_id: uuid.UUID, response: Response, db: Session = Depends(get_db)):
    response.headers['Cache-Control'] = 'no-store'
    try:
        return get_ingestion_run(db, run_id)
    except IngestionError as error:
        raise HTTPException(status_code=error.status_code, detail=error.as_detail()) from None


@app.get(
    "/api/species",
    response_model=List[schemas.SpeciesProfileResponse],
    tags=["Species"]
)
def get_all_species(db: Session = Depends(get_db)):
    results = []
    try:
        pelagics = db.query(models.PelagicSpecies).all()
        for sp in pelagics:
            results.append(schemas.SpeciesProfileResponse(
                id=sp.id,
                species_name=sp.common_name,
                common_name=sp.common_name,
                representative_species=sp.representative_species,
                family=sp.family,
                local_name=None,
                category="pelagic",
                temp_min=sp.sst_min_c,
                temp_max=sp.sst_max_c,
                depth_min=sp.depth_min_m,
                depth_max=sp.depth_max_m,
            ))
        demersals = db.query(models.DemersalSpecies).all()
        for sp in demersals:
            results.append(schemas.SpeciesProfileResponse(
                id=sp.id,
                species_name=sp.common_name,
                common_name=sp.common_name,
                representative_species=sp.representative_species,
                family=sp.family,
                local_name=None,
                category="demersal",
                temp_min=sp.temp_min_c,
                temp_max=sp.temp_max_c,
                depth_min=sp.depth_min_m,
                depth_max=sp.depth_max_m,
            ))
    except Exception:
        raise HTTPException(status_code=503, detail={'code': 'species_catalog_unavailable', 'message': 'Species catalog unavailable.'})

    return results


@app.get(
    "/api/predictions/species",
    response_model=List[schemas.SpeciesGridPredictionItem],
    tags=["Species Predictions"]
)
def get_species_predictions(
    request: Request,
    species: str = Query(..., min_length=1, max_length=100, description="Exact catalog ID or alias, e.g. pelagic:1 or Tamban"),
    prediction_date: Optional[date_type] = Query(None, description="Prediction date (defaults to latest available date)"),
    min_probability: float = Query(0.10, ge=0.0, le=1.0, description="Minimum unchanged habitat-model score; not species presence"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    geographic_profile = geographic_read_profile(request)
    profile = find_species_profile(db, species)
    if not profile:
        raise HTTPException(
            status_code=422,
            detail={"code": "species_unsupported", "message": "Species is unsupported or ambiguous. Use a catalog identifier."}
        )

    target_date = prediction_date
    if not target_date:
        latest_row = db.execute(text("""SELECT MAX(prediction_date) FROM public.daily_grid_predictions
            WHERE prediction_date <= :today AND model_type = :habitat"""),
            {'today': manila_today(), 'habitat': profile['category']}).fetchone()
        if latest_row and latest_row[0]:
            target_date = latest_row[0]
        else:
            target_date = manila_today()

    require_geographic_coverage(db, geographic_profile, target_date, min_probability, profile['category'])
    geographic_filter = geographic_predicate('centroid_geom') if geographic_profile else ''
    sql_query = text(f"""
        SELECT 
            id AS grid_id,
            prediction_date,
            model_type,
            ST_Y(centroid_geom) AS target_lat,
            ST_X(centroid_geom) AS target_lon,
            catch_probability AS base_catch_probability,
            dbscan_cluster_id,
            sst,
            chl_a
        FROM public.daily_grid_predictions
        WHERE prediction_date = :p_date AND model_type = :habitat
          AND catch_probability >= :minimum
          {geographic_filter}
        ORDER BY catch_probability DESC, id
        LIMIT :limit
    """)

    rows = db.execute(sql_query, {"p_date": target_date, "habitat": profile["category"], "minimum": min_probability, "limit": limit,
                                 "geo_profile_id": geographic_profile}).fetchall()

    results = []
    sp_name = profile.get("species_name") if isinstance(profile, dict) else getattr(profile, "species_name", species)

    for row in rows:
        base_prob = row.base_catch_probability
        # Missing validated depth/HSI inputs must not manufacture a species score.
        if base_prob >= min_probability:
            results.append(schemas.SpeciesGridPredictionItem(
                grid_id=row.grid_id,
                prediction_date=row.prediction_date,
                model_type=row.model_type,
                lat=row.target_lat,
                lon=row.target_lon,
                target_lat=row.target_lat,
                target_lon=row.target_lon,
                base_catch_probability=base_prob,
                species_suitability=None,
                species_catch_probability=None,
                species_name=sp_name,
                sst=row.sst,
                chl_a=row.chl_a,
                dbscan_cluster_id=row.dbscan_cluster_id
            ))

    results.sort(key=lambda x: x.base_catch_probability, reverse=True)
    return results[:limit]

