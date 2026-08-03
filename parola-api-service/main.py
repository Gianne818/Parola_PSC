import uuid
from datetime import date as date_type, datetime
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
import models
import schemas

app = FastAPI(
    title="Parola Pelagic Advisory API",
    description="Backend REST API for Parola localized fishing advisories & PostGIS spatial queries.",
    version="2.0.0"
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
