from typing import Optional, Dict, Any, Union

def calculate_temperature_suitability(
    sst: Optional[float],
    t_min: Optional[float],
    t_opt_low: Optional[float],
    t_opt_high: Optional[float],
    t_max: Optional[float]
) -> float:
    """
    Calculates temperature suitability index (S_temp) for a given SST and species temperature thresholds.
    
    Rules:
    - If sst is None or thresholds are missing, return 1.0 (neutral fallback).
    - If sst < t_min or sst > t_max, return 0.05.
    - If t_opt_low <= sst <= t_opt_high, return 1.0.
    - If t_min <= sst < t_opt_low, return 0.05 + 0.95 * ((sst - t_min) / (t_opt_low - t_min)).
    - If t_opt_high < sst <= t_max, return 0.05 + 0.95 * ((t_max - sst) / (t_max - t_opt_high)).
    """
    if sst is None or t_min is None or t_opt_low is None or t_opt_high is None or t_max is None:
        return 1.0

    if sst < t_min or sst > t_max:
        return 0.05

    if t_opt_low <= sst <= t_opt_high:
        return 1.0

    if t_min <= sst < t_opt_low:
        denom = t_opt_low - t_min
        if denom == 0:
            return 1.0
        return 0.05 + 0.95 * ((sst - t_min) / denom)

    if t_opt_high < sst <= t_max:
        denom = t_max - t_opt_high
        if denom == 0:
            return 1.0
        return 0.05 + 0.95 * ((t_max - sst) / denom)

    return 1.0


def calculate_species_suitability(
    sst: Optional[float],
    depth: Optional[float],
    species_profile: Union[Dict[str, Any], Any]
) -> float:
    """
    Calculates total species suitability index (S_species = S_temp * S_depth).
    Extracts species parameters from dict or object representation.
    """
    def get_val(key: str) -> Optional[float]:
        if isinstance(species_profile, dict):
            val = species_profile.get(key)
        else:
            val = getattr(species_profile, key, None)
        return float(val) if val is not None else None

    t_min = get_val("temp_min")
    t_opt_low = get_val("temp_opt_low")
    t_opt_high = get_val("temp_opt_high")
    t_max = get_val("temp_max")

    s_temp = calculate_temperature_suitability(sst, t_min, t_opt_low, t_opt_high, t_max)

    d_min = get_val("depth_min")
    d_max = get_val("depth_max")

    s_depth = 1.0
    if depth is not None and d_min is not None and d_max is not None:
        if d_min <= depth <= d_max:
            s_depth = 1.0
        elif depth < d_min:
            denom = d_min if d_min > 0 else 1.0
            s_depth = max(0.05, 1.0 - 0.95 * ((d_min - depth) / denom))
        else:
            denom = d_max if d_max > 0 else 1.0
            s_depth = max(0.05, 1.0 - 0.95 * ((depth - d_max) / denom))

    return round(s_temp * s_depth, 4)
