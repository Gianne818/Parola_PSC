import uuid
from datetime import date, time
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


class UserCreate(BaseModel):
    phone_number: str = Field(..., example="09171234567")
    full_name: str = Field(..., example="Juan Dela Cruz")
    home_port_name: Optional[str] = Field("Brgy Pasil, Cebu", example="Brgy Pasil, Cebu")
    latitude: float = Field(..., ge=-90, le=90, example=10.2929)
    longitude: float = Field(..., ge=-180, le=180, example=123.8961)
    preferred_advisory_time: Optional[time] = Field(default="05:00:00")
    coop_id: Optional[uuid.UUID] = None
    password: Optional[str] = Field(None, example="secret123")


class UserLogin(BaseModel):
    phone_number: str = Field(..., example="09171234567")
    password: str = Field(..., example="secret123")


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


class SpeciesProfileResponse(BaseModel):
    id: int
    species_name: str
    family: Optional[str] = None
    local_name: Optional[str] = None
    category: str = Field(..., description="Species category: 'pelagic' or 'demersal'")
    temp_min: Optional[float] = None
    temp_opt_low: Optional[float] = None
    temp_opt_high: Optional[float] = None
    temp_max: Optional[float] = None
    depth_min: Optional[float] = None
    depth_max: Optional[float] = None

    class Config:
        from_attributes = True


class SpeciesGridPredictionItem(BaseModel):
    grid_id: int
    prediction_date: date
    model_type: Optional[str] = "pelagic"
    lat: float
    lon: float
    target_lat: float
    target_lon: float
    base_catch_probability: float
    species_suitability: float
    species_catch_probability: float
    species_name: Optional[str] = None
    sst: Optional[float] = None
    chl_a: Optional[float] = None
    dbscan_cluster_id: Optional[int] = -1

    class Config:
        from_attributes = True

