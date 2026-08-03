-- ============================================================================
-- PAROLA DATABASE SCHEMA (Supabase PostgreSQL + PostGIS)
-- ============================================================================

-- 1. Enable PostGIS Extension for Geospatial Superpowers
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. User Profiles & Subscribed Ports (With User-Selected Preferred Advisory Time)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    full_name VARCHAR(100),
    home_port_name VARCHAR(100) NOT NULL DEFAULT 'Brgy Pasil, Cebu',
    home_port_geom GEOMETRY(Point, 4326) NOT NULL, -- WGS84 Lat/Lon point
    preferred_advisory_time TIME NOT NULL DEFAULT '05:00:00', -- User input from Frontend
    coop_id UUID,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial GIST Index on User Port Location
CREATE INDEX IF NOT EXISTS idx_users_home_port_geom ON public.users USING GIST (home_port_geom);
CREATE INDEX IF NOT EXISTS idx_users_advisory_schedule ON public.users (is_active, preferred_advisory_time);

-- 3. Daily Scored Environmental Grid Predictions (AI Output)
CREATE TABLE IF NOT EXISTS public.daily_grid_predictions (
    id BIGSERIAL PRIMARY KEY,
    prediction_date DATE NOT NULL,
    model_type VARCHAR(20) NOT NULL DEFAULT 'pelagic' CHECK (model_type IN ('pelagic', 'demersal')),
    grid_cell_geom GEOMETRY(Polygon, 4326) NOT NULL,
    centroid_geom GEOMETRY(Point, 4326) NOT NULL,
    catch_probability DOUBLE PRECISION NOT NULL,
    dbscan_cluster_id INT DEFAULT -1, -- -1 = noise, >= 0 = cluster
    sst DOUBLE PRECISION,
    chl_a DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spatial & Filter Indexes
CREATE INDEX IF NOT EXISTS idx_grid_date_prob ON public.daily_grid_predictions (prediction_date, catch_probability DESC);
CREATE INDEX IF NOT EXISTS idx_grid_centroid_geom ON public.daily_grid_predictions USING GIST (centroid_geom);
CREATE INDEX IF NOT EXISTS idx_grid_cell_geom ON public.daily_grid_predictions USING GIST (grid_cell_geom);

-- 4. Dispatched Daily Advisories
CREATE TABLE IF NOT EXISTS public.daily_advisories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    advisory_date DATE NOT NULL,
    target_grid_id BIGINT REFERENCES public.daily_grid_predictions(id),
    distance_km DOUBLE PRECISION NOT NULL,
    compass_bearing VARCHAR(10) NOT NULL, -- e.g. 'WNW', 'NE'
    raw_gps_lat DOUBLE PRECISION NOT NULL,
    raw_gps_lon DOUBLE PRECISION NOT NULL,
    maps_short_link VARCHAR(255),
    safety_status VARCHAR(30) DEFAULT 'NORMAL' CHECK (safety_status IN ('NORMAL', 'SUPPRESSED_WEATHER_HAZARD')),
    sms_text TEXT NOT NULL,
    sms_message_id VARCHAR(100),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advisories_user_date ON public.daily_advisories (user_id, advisory_date);

-- 5. Catch Report Feedback (SMS Reply Loop)
CREATE TABLE IF NOT EXISTS public.catch_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advisory_id UUID REFERENCES public.daily_advisories(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    feedback_value INT NOT NULL CHECK (feedback_value IN (1, 2, 3)), -- 1: High, 2: Medium, 3: Low
    raw_sms_body VARCHAR(50),
    received_at TIMESTAMPTZ DEFAULT NOW(),
    integrated_in_retraining BOOLEAN DEFAULT FALSE
);

-- 6. Weather Safety Overrides Log
CREATE TABLE IF NOT EXISTS public.weather_safety_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_timestamp TIMESTAMPTZ DEFAULT NOW(),
    region_name VARCHAR(100) NOT NULL,
    max_wind_speed_knots DOUBLE PRECISION,
    max_wave_height_m DOUBLE PRECISION,
    pagasa_signal_level INT DEFAULT 0,
    is_hazardous BOOLEAN DEFAULT FALSE,
    override_reason TEXT
);

-- 7. Cooperative Bulk Fuel Orders
CREATE TABLE IF NOT EXISTS public.coop_fuel_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coop_id UUID NOT NULL,
    user_id UUID REFERENCES public.users(id),
    requested_liters NUMERIC(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'POOLED', 'COMPLETED', 'CANCELLED')),
    pooled_price_per_liter NUMERIC(10, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- HELPER POSTGIS SPATIAL STORED PROCEDURE
-- Find nearest high-probability fishing hotspot for a user's home port
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_nearest_fishing_hotspot(
    p_user_lat DOUBLE PRECISION,
    p_user_lon DOUBLE PRECISION,
    p_prediction_date DATE DEFAULT CURRENT_DATE,
    p_min_probability DOUBLE PRECISION DEFAULT 0.50
)
RETURNS TABLE (
    grid_id BIGINT,
    catch_probability DOUBLE PRECISION,
    dbscan_cluster_id INT,
    target_lat DOUBLE PRECISION,
    target_lon DOUBLE PRECISION,
    distance_km DOUBLE PRECISION,
    bearing_degrees DOUBLE PRECISION,
    compass_bearing TEXT,
    sst DOUBLE PRECISION,
    chl_a DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_geom GEOMETRY;
BEGIN
    -- Create user point geometry in WGS84 (SRID 4326)
    v_user_geom := ST_SetSRID(ST_MakePoint(p_user_lon, p_user_lat), 4326);

    RETURN QUERY
    SELECT 
        g.id AS grid_id,
        g.catch_probability,
        g.dbscan_cluster_id,
        ST_Y(g.centroid_geom) AS target_lat,
        ST_X(g.centroid_geom) AS target_lon,
        -- Distance in kilometers using PostGIS geography calculation
        ROUND((ST_Distance(v_user_geom::geography, g.centroid_geom::geography) / 1000.0)::numeric, 2)::DOUBLE PRECISION AS distance_km,
        -- Compass bearing in degrees (0..360)
        ROUND((degrees(ST_Azimuth(v_user_geom, g.centroid_geom))::numeric + 360) % 360, 1)::DOUBLE PRECISION AS bearing_degrees,
        -- Convert azimuth degrees to 16-wind compass direction
        CASE 
            WHEN degrees(ST_Azimuth(v_user_geom, g.centroid_geom)) >= 348.75 OR degrees(ST_Azimuth(v_user_geom, g.centroid_geom)) < 11.25 THEN 'N'
            WHEN degrees(ST_Azimuth(v_user_geom, g.centroid_geom)) BETWEEN 11.25 AND 33.75 THEN 'NNE'
            WHEN degrees(ST_Azimuth(v_user_geom, g.centroid_geom)) BETWEEN 33.75 AND 56.25 THEN 'NE'
            WHEN degrees(ST_Azimuth(v_user_geom, g.centroid_geom)) BETWEEN 56.25 AND 78.75 THEN 'ENE'
            WHEN degrees(ST_Azimuth(v_user_geom, g.centroid_geom)) BETWEEN 78.75 AND 101.25 THEN 'E'
            WHEN degrees(ST_Azimuth(v_user_geom, g.centroid_geom)) BETWEEN 101.25 AND 123.75 THEN 'ESE'
            WHEN degrees(ST_Azimuth(v_user_geom, g.centroid_geom)) BETWEEN 123.75 AND 146.25 THEN 'SE'
            WHEN degrees(ST_Azimuth(v_user_geom, g.centroid_geom)) BETWEEN 146.25 AND 168.75 THEN 'SSE'
            WHEN degrees(ST_Azimuth(v_user_geom, g.centroid_geom)) BETWEEN 168.75 AND 191.25 THEN 'S'
            WHEN degrees(ST_Azimuth(v_user_geom, g.centroid_geom)) BETWEEN 191.25 AND 213.75 THEN 'SSW'
            WHEN degrees(ST_Azimuth(v_user_geom, g.centroid_geom)) BETWEEN 213.75 AND 236.25 THEN 'SW'
            WHEN degrees(ST_Azimuth(v_user_geom, g.centroid_geom)) BETWEEN 236.25 AND 258.75 THEN 'WSW'
            WHEN degrees(ST_Azimuth(v_user_geom, g.centroid_geom)) BETWEEN 258.75 AND 281.25 THEN 'W'
            WHEN degrees(ST_Azimuth(v_user_geom, g.centroid_geom)) BETWEEN 281.25 AND 303.75 THEN 'WNW'
            WHEN degrees(ST_Azimuth(v_user_geom, g.centroid_geom)) BETWEEN 303.75 AND 326.25 THEN 'NW'
            ELSE 'NNW'
        END AS compass_bearing,
        g.sst,
        g.chl_a
    FROM public.daily_grid_predictions g
    WHERE g.prediction_date = p_prediction_date
      AND g.catch_probability >= p_min_probability
    ORDER BY g.centroid_geom <-> v_user_geom -- Nearest Neighbor spatial index operator
    LIMIT 1;
END;
$$;
