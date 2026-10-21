"""Trusted-proxy geographic checks. Imports never connect to a database/provider."""
import os
import secrets
from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import text


def geographic_read_profile(request):
    flag = os.environ.get('PAROLA_GEOGRAPHIC_ENFORCEMENT_ENABLED', 'false')
    mode = os.environ.get('PAROLA_AUTH_MODE', 'demo')
    if flag not in ('true', 'false') or mode not in ('demo', 'live'):
        raise HTTPException(503, detail={'code': 'geographic_config_unavailable'})
    if flag == 'false':
        if mode != 'demo':
            raise HTTPException(503, detail={'code': 'geographic_enforcement_inactive'})
        return None
    # This is a server-to-server identity assertion, never a public user_id/tier.
    expected = os.environ.get('PAROLA_API_KEY', '')
    provided = request.headers.get('x-api-key', '')
    if not expected:
        raise HTTPException(503, detail={'code': 'geographic_proxy_unavailable'})
    if not provided or not secrets.compare_digest(expected, provided):
        raise HTTPException(401, detail={'code': 'geographic_auth_required'})
    try:
        return str(UUID(request.headers.get('x-parola-profile-id', '')))
    except (ValueError, TypeError):
        raise HTTPException(401, detail={'code': 'geographic_owner_unavailable'}) from None


def geographic_predicate(column):
    if column not in ('centroid_geom', 'g.centroid_geom'):
        raise ValueError('Unsupported geographic query column')
    return f"""AND EXISTS (SELECT 1 FROM public.parola_geographic_eligibility(
        CAST(:geo_profile_id AS uuid), ST_Y({column}), ST_X({column}), statement_timestamp())
        AS decision WHERE decision.status = 'allowed')"""


def require_geographic_coverage(db, profile_id, prediction_date, minimum, habitat=None):
    """List responses cannot carry partial-coverage metadata: fail unavailable explicitly."""
    if profile_id is None:
        return
    try:
        count = db.execute(text("""
            SELECT COUNT(*) FROM public.daily_grid_predictions g
            CROSS JOIN LATERAL public.parola_geographic_eligibility(CAST(:owner AS uuid),
                ST_Y(g.centroid_geom),ST_X(g.centroid_geom),statement_timestamp()) AS decision
            WHERE g.prediction_date = :day AND g.catch_probability >= :minimum
              AND (CAST(:habitat AS text) IS NULL OR g.model_type = :habitat)
              AND decision.status = 'unavailable'
        """), {'owner': profile_id, 'day': prediction_date, 'minimum': minimum, 'habitat': habitat}).scalar_one()
        if not isinstance(count, int) or count > 0:
            raise ValueError('Geographic coverage unavailable')
    except Exception:
        raise HTTPException(503, detail={'code': 'geographic_data_unavailable'}) from None
