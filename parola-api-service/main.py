import uuid
import hashlib
import secrets
from datetime import date as date_type, datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import models
import schemas
import hsi_calculator

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
    if not query_str:
        return None
    lower = query_str.strip().lower()

    try:
        pelagics = db.query(models.PelagicSpecies).all()
        for sp in pelagics:
            n_match = lower in sp.species_name.lower() or sp.species_name.lower() in lower
            f_match = sp.family and (lower in sp.family.lower() or sp.family.lower() in lower)
            l_match = sp.local_name and (lower in sp.local_name.lower() or sp.local_name.lower() in lower)
            if n_match or f_match or l_match:
                return {
                    "id": sp.id,
                    "species_name": sp.species_name,
                    "family": sp.family,
                    "local_name": sp.local_name,
                    "category": "pelagic",
                    "temp_min": sp.temp_min,
                    "temp_opt_low": sp.temp_opt_low,
                    "temp_opt_high": sp.temp_opt_high,
                    "temp_max": sp.temp_max,
                    "depth_min": sp.depth_min,
                    "depth_max": sp.depth_max,
                }

        demersals = db.query(models.DemersalSpecies).all()
        for sp in demersals:
            n_match = lower in sp.species_name.lower() or sp.species_name.lower() in lower
            f_match = sp.family and (lower in sp.family.lower() or sp.family.lower() in lower)
            l_match = sp.local_name and (lower in sp.local_name.lower() or sp.local_name.lower() in lower)
            if n_match or f_match or l_match:
                return {
                    "id": sp.id,
                    "species_name": sp.species_name,
                    "family": sp.family,
                    "local_name": sp.local_name,
                    "category": "demersal",
                    "temp_min": sp.temp_min,
                    "temp_opt_low": sp.temp_opt_low,
                    "temp_opt_high": sp.temp_opt_high,
                    "temp_max": sp.temp_max,
                    "depth_min": sp.depth_min,
                    "depth_max": sp.depth_max,
                }
    except Exception as e:
        pass

    for sp in DEFAULT_SPECIES_SEED:
        n_match = lower in sp["species_name"].lower() or sp["species_name"].lower() in lower
        f_match = lower in sp["family"].lower() or sp["family"].lower() in lower
        l_match = lower in sp["local_name"].lower() or sp["local_name"].lower() in lower
        if n_match or f_match or l_match:
            return sp

    return None

app = FastAPI(
    title="Parola Pelagic Advisory API",
    description="Backend REST API for Parola localized fishing advisories & PostGIS spatial queries.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS public.pelagic_species (
                id BIGINT PRIMARY KEY,
                species_name VARCHAR(100) NOT NULL,
                family VARCHAR(100),
                local_name VARCHAR(100),
                temp_min FLOAT,
                temp_opt_low FLOAT,
                temp_opt_high FLOAT,
                temp_max FLOAT,
                depth_min FLOAT,
                depth_max FLOAT
            );
        """))
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS public.demersal_species (
                id BIGINT PRIMARY KEY,
                species_name VARCHAR(100) NOT NULL,
                family VARCHAR(100),
                local_name VARCHAR(100),
                temp_min FLOAT,
                temp_opt_low FLOAT,
                temp_opt_high FLOAT,
                temp_max FLOAT,
                depth_min FLOAT,
                depth_max FLOAT
            );
        """))
        db.commit()

        p_count = db.query(models.PelagicSpecies).count()
        if p_count == 0:
            for item in DEFAULT_SPECIES_SEED:
                if item["category"] == "pelagic":
                    sp = models.PelagicSpecies(
                        id=item["id"],
                        species_name=item["species_name"],
                        family=item["family"],
                        local_name=item["local_name"],
                        temp_min=item["temp_min"],
                        temp_opt_low=item["temp_opt_low"],
                        temp_opt_high=item["temp_opt_high"],
                        temp_max=item["temp_max"],
                        depth_min=item["depth_min"],
                        depth_max=item["depth_max"]
                    )
                    db.add(sp)
            db.commit()

        d_count = db.query(models.DemersalSpecies).count()
        if d_count == 0:
            for item in DEFAULT_SPECIES_SEED:
                if item["category"] == "demersal":
                    sp = models.DemersalSpecies(
                        id=item["id"],
                        species_name=item["species_name"],
                        family=item["family"],
                        local_name=item["local_name"],
                        temp_min=item["temp_min"],
                        temp_opt_low=item["temp_opt_low"],
                        temp_opt_high=item["temp_opt_high"],
                        temp_max=item["temp_max"],
                        depth_min=item["depth_min"],
                        depth_max=item["depth_max"]
                    )
                    db.add(sp)
            db.commit()
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
    lat: Optional[float] = Query(None, ge=-90, le=90, description="Latitude of user/vessel"),
    lon: Optional[float] = Query(None, ge=-180, le=180, description="Longitude of user/vessel"),
    user_id: Optional[uuid.UUID] = Query(None, description="Registered User UUID in Supabase"),
    prediction_date: Optional[date_type] = Query(default_factory=date_type.today),
    min_probability: float = Query(0.50, ge=0.0, le=1.0),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
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

    sql_query = text("""
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
        ORDER BY g.centroid_geom <-> ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)
        LIMIT :limit
    """)

    rows = db.execute(sql_query, {
        "lat": query_lat,
        "lon": query_lon,
        "p_date": prediction_date,
        "p_prob": min_probability,
        "limit": limit
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
    tags=["Advisories"]
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
    tags=["Feedback"]
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
    cleaned_phone = payload.phone_number.strip()
    existing = db.query(models.User).filter(models.User.phone_number == cleaned_phone).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this phone number already exists. Please sign in instead."
        )

    point_wkt = f"SRID=4326;POINT({payload.longitude} {payload.latitude})"
    pwd_hash = hash_password(payload.password) if payload.password else None

    new_user = models.User(
        phone_number=cleaned_phone,
        full_name=payload.full_name,
        home_port_name=payload.home_port_name,
        home_port_geom=point_wkt,
        preferred_advisory_time=payload.preferred_advisory_time or "05:00:00",
        password_hash=pwd_hash
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    coords = db.execute(
        text("SELECT ST_Y(home_port_geom) as lat, ST_X(home_port_geom) as lon FROM public.users WHERE id = :uid"),
        {"uid": str(new_user.id)}
    ).fetchone()

    return schemas.UserResponse(
        id=new_user.id,
        phone_number=new_user.phone_number,
        full_name=new_user.full_name,
        home_port_name=new_user.home_port_name,
        latitude=coords.lat if coords else 0.0,
        longitude=coords.lon if coords else 0.0,
        is_active=new_user.is_active
    )


@app.put("/api/users/profile", response_model=schemas.UserResponse, tags=["Users"])
def update_user_profile(payload: schemas.UserCreate, db: Session = Depends(get_db)):
    cleaned_phone = payload.phone_number.strip()
    existing = db.query(models.User).filter(models.User.phone_number == cleaned_phone).first()

    if not existing:
        raise HTTPException(status_code=404, detail="User profile not found.")

    point_wkt = f"SRID=4326;POINT({payload.longitude} {payload.latitude})"
    existing.full_name = payload.full_name
    existing.home_port_name = payload.home_port_name
    existing.home_port_geom = point_wkt
    if payload.preferred_advisory_time:
        existing.preferred_advisory_time = payload.preferred_advisory_time
    if payload.password:
        existing.password_hash = hash_password(payload.password)

    db.commit()
    db.refresh(existing)

    coords = db.execute(
        text("SELECT ST_Y(home_port_geom) as lat, ST_X(home_port_geom) as lon FROM public.users WHERE id = :uid"),
        {"uid": str(existing.id)}
    ).fetchone()

    return schemas.UserResponse(
        id=existing.id,
        phone_number=existing.phone_number,
        full_name=existing.full_name,
        home_port_name=existing.home_port_name,
        latitude=coords.lat if coords else 0.0,
        longitude=coords.lon if coords else 0.0,
        is_active=existing.is_active
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
        is_active=user_obj.is_active
    )


@app.get("/api/users/by-phone", response_model=schemas.UserResponse, tags=["Users"])
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
        is_active=user_obj.is_active
    )


@app.post("/api/predictions/ingest", status_code=status.HTTP_201_CREATED, tags=["Advisories"])
def ingest_daily_predictions(payload: schemas.BatchPredictionIngestRequest, db: Session = Depends(get_db)):
    inserted_count = 0
    for item in payload.predictions:
        centroid_wkt = f"SRID=4326;POINT({item.lon} {item.lat})"
        d = 0.005
        poly_wkt = f"SRID=4326;POLYGON(({item.lon - d} {item.lat - d}, {item.lon + d} {item.lat - d}, {item.lon + d} {item.lat + d}, {item.lon - d} {item.lat + d}, {item.lon - d} {item.lat - d}))"

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
                species_name=sp.species_name,
                family=sp.family,
                local_name=sp.local_name,
                category="pelagic",
                temp_min=sp.temp_min,
                temp_opt_low=sp.temp_opt_low,
                temp_opt_high=sp.temp_opt_high,
                temp_max=sp.temp_max,
                depth_min=sp.depth_min,
                depth_max=sp.depth_max,
            ))
        demersals = db.query(models.DemersalSpecies).all()
        for sp in demersals:
            results.append(schemas.SpeciesProfileResponse(
                id=sp.id,
                species_name=sp.species_name,
                family=sp.family,
                local_name=sp.local_name,
                category="demersal",
                temp_min=sp.temp_min,
                temp_opt_low=sp.temp_opt_low,
                temp_opt_high=sp.temp_opt_high,
                temp_max=sp.temp_max,
                depth_min=sp.depth_min,
                depth_max=sp.depth_max,
            ))
    except Exception as e:
        pass

    if not results:
        for sp in DEFAULT_SPECIES_SEED:
            results.append(schemas.SpeciesProfileResponse(**sp))

    return results


@app.get(
    "/api/predictions/species",
    response_model=List[schemas.SpeciesGridPredictionItem],
    tags=["Species Predictions"]
)
def get_species_predictions(
    species: str = Query(..., description="Species name, family, or local name (e.g. Tamban, Sardines, Lapu-lapu)"),
    prediction_date: Optional[date_type] = Query(None, description="Prediction date (defaults to latest available date)"),
    min_probability: float = Query(0.10, ge=0.0, le=1.0, description="Minimum P_species threshold"),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    profile = find_species_profile(db, species)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Species profile for '{species}' not found."
        )

    target_date = prediction_date
    if not target_date:
        latest_row = db.execute(text("SELECT MAX(prediction_date) FROM public.daily_grid_predictions")).fetchone()
        if latest_row and latest_row[0]:
            target_date = latest_row[0]
        else:
            target_date = date_type.today()

    sql_query = text("""
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
        WHERE prediction_date = :p_date
    """)

    rows = db.execute(sql_query, {"p_date": target_date}).fetchall()

    results = []
    sp_name = profile.get("species_name") if isinstance(profile, dict) else getattr(profile, "species_name", species)

    for row in rows:
        base_prob = row.base_catch_probability
        s_species = hsi_calculator.calculate_species_suitability(
            sst=row.sst,
            depth=None,
            species_profile=profile
        )
        p_species = round(base_prob * s_species, 4)

        if p_species >= min_probability:
            results.append(schemas.SpeciesGridPredictionItem(
                grid_id=row.grid_id,
                prediction_date=row.prediction_date,
                model_type=row.model_type,
                lat=row.target_lat,
                lon=row.target_lon,
                target_lat=row.target_lat,
                target_lon=row.target_lon,
                base_catch_probability=base_prob,
                species_suitability=s_species,
                species_catch_probability=p_species,
                species_name=sp_name,
                sst=row.sst,
                chl_a=row.chl_a,
                dbscan_cluster_id=row.dbscan_cluster_id
            ))

    results.sort(key=lambda x: x.species_catch_probability, reverse=True)
    return results[:limit]

