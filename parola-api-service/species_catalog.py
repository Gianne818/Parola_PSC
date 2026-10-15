"""Exact catalog resolution shared by legacy API paths; never synthetic bounds."""
import re
import unicodedata


def normalize(value):
    return re.sub(r'\s+', ' ', unicodedata.normalize('NFKC', value).strip().lower())


def resolve_species(rows, query):
    key = normalize(query)
    if not key:
        return None
    matches = []
    for row in rows:
        aliases = [f"{row['category']}:{row['id']}"]
        for field in ('species_name', 'family', 'local_name', 'common_name', 'representative_species'):
            if isinstance(row.get(field), str):
                aliases.extend([row[field], *re.split(r'[/(),;]', row[field])])
        if key in [normalize(alias) for alias in aliases]:
            matches.append(row)
    return matches[0] if len(matches) == 1 else None
