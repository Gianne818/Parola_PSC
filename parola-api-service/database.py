import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logger = logging.getLogger(__name__)
logger.setLevel(logging.WARNING)

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL and "[YOUR-PASSWORD]" in DATABASE_URL:
    logger.warning("DATABASE_URL contains '[YOUR-PASSWORD]'. Please update parola-api-service/.env with your actual Supabase database password.")

if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# Auto-sanitize passwords if square brackets were accidentally included e.g. :[pass]@
if DATABASE_URL and ":[" in DATABASE_URL and "]@" in DATABASE_URL:
    start = DATABASE_URL.find(":[")
    end = DATABASE_URL.find("]@", start)
    if start != -1 and end != -1:
        pwd = DATABASE_URL[start+2:end]
        DATABASE_URL = DATABASE_URL[:start+1] + pwd + DATABASE_URL[end+1:]

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL environment variable is missing. "
        "Set it to your PostgreSQL/Supabase connection string "
        "(e.g. in parola-api-service/.env). Refusing to fall back "
        "to a default localhost database."
    )

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """FastAPI Dependency: yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
