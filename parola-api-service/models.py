import uuid
from datetime import datetime
from sqlalchemy import Column, BigInteger, Integer, Float, String, Date, Boolean, Time, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry
from database import Base

class DailyGridPrediction(Base):
    __tablename__ = "daily_grid_predictions"
    __table_args__ = {"schema": "public"}

    id = Column(BigInteger, primary_key=True, index=True)
    prediction_date = Column(Date, nullable=False, index=True)
    model_type = Column(String(20), default="pelagic")
    grid_cell_geom = Column(Geometry("POLYGON", srid=4326), nullable=False)
    centroid_geom = Column(Geometry("POINT", srid=4326, spatial_index=True), nullable=False)
    catch_probability = Column(Float, nullable=False, index=True)
    dbscan_cluster_id = Column(Integer, default=-1)
    sst = Column(Float, nullable=True)     # Sea Surface Temperature (°C)
    chl_a = Column(Float, nullable=True)   # Chlorophyll-a
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    __tablename__ = "users"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number = Column(String(20), unique=True, nullable=False)
    full_name = Column(String(100))
    home_port_name = Column(String(100), default="Brgy Pasil, Cebu")
    home_port_geom = Column(Geometry("POINT", srid=4326, spatial_index=True), nullable=False)
    preferred_advisory_time = Column(Time, nullable=False)
    coop_id = Column(UUID(as_uuid=True), nullable=True)
    password_hash = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)

class DailyAdvisory(Base):
    __tablename__ = "daily_advisories"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="CASCADE"))
    advisory_date = Column(Date, nullable=False)
    target_grid_id = Column(BigInteger, ForeignKey("public.daily_grid_predictions.id"))
    distance_km = Column(Float, nullable=False)
    compass_bearing = Column(String(10), nullable=False)
    raw_gps_lat = Column(Float, nullable=False)
    raw_gps_lon = Column(Float, nullable=False)
    maps_short_link = Column(String(255))
    safety_status = Column(String(30), default="NORMAL")
    sms_text = Column(Text, nullable=False)
    sms_message_id = Column(String(100))
    sent_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

class CatchFeedback(Base):
    __tablename__ = "catch_feedbacks"
    __table_args__ = {"schema": "public"}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    advisory_id = Column(UUID(as_uuid=True), ForeignKey("public.daily_advisories.id", ondelete="SET NULL"))
    user_id = Column(UUID(as_uuid=True), ForeignKey("public.users.id", ondelete="CASCADE"))
    feedback_value = Column(Integer, nullable=False) # 1: High, 2: Medium, 3: Low
    raw_sms_body = Column(String(50))
    received_at = Column(DateTime, default=datetime.utcnow)
    integrated_in_retraining = Column(Boolean, default=False)

class PelagicSpecies(Base):
    __tablename__ = "pelagic_species"
    __table_args__ = {"schema": "public"}

    id = Column(BigInteger, primary_key=True, index=True)
    species_name = Column(String(100), nullable=False)
    family = Column(String(100))
    local_name = Column(String(100))
    temp_min = Column(Float)
    temp_opt_low = Column(Float)
    temp_opt_high = Column(Float)
    temp_max = Column(Float)
    depth_min = Column(Float)
    depth_max = Column(Float)

class DemersalSpecies(Base):
    __tablename__ = "demersal_species"
    __table_args__ = {"schema": "public"}

    id = Column(BigInteger, primary_key=True, index=True)
    species_name = Column(String(100), nullable=False)
    family = Column(String(100))
    local_name = Column(String(100))
    temp_min = Column(Float)
    temp_opt_low = Column(Float)
    temp_opt_high = Column(Float)
    temp_max = Column(Float)
    depth_min = Column(Float)
    depth_max = Column(Float)

