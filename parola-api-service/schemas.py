import uuid
from datetime import date
from typing import List, Optional
from pydantic import BaseModel, Field

class FishingHotspotItem(BaseModel):
    grid_id: int
    catch_probability: float
    dbscan_cluster_id: int
    target_lat: float
    target_lon: float
    distance_km: float
    bearing_degrees: float
    compass_bearing: str = Field(..., description="16-wind compass direction (e.g. NE, WNW)")
    sst: Optional[float] = None
    chl_a: Optional[float] = None

    class Config:
        from_attributes = True

class NearbyAdvisoriesResponse(BaseModel):
    query_lat: float
    query_lon: float
    prediction_date: date
    min_probability: float
    total_found: int
    hotspots: List[FishingHotspotItem]

class CreateAdvisoryRequest(BaseModel):
    user_id: uuid.UUID
    advisory_date: date
    target_grid_id: int
    distance_km: float
    compass_bearing: str
    raw_gps_lat: float
    raw_gps_lon: float
    sms_text: str
    maps_short_link: Optional[str] = None
    sms_message_id: Optional[str] = None

class CreateFeedbackRequest(BaseModel):
    user_id: uuid.UUID
    advisory_id: Optional[uuid.UUID] = None
    feedback_value: int = Field(..., ge=1, le=3, description="1: High, 2: Medium, 3: Low")
    raw_sms_body: Optional[str] = None
