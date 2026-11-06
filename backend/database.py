"""Conexión a PostgreSQL (Supabase) y sesión de SQLAlchemy."""
import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]

# Supabase queda lejos (cada viaje de ida y vuelta pesa), así que:
# - AUTOCOMMIT: una lectura es 1 solo viaje (sin BEGIN ni ROLLBACK aparte).
#   Las operaciones que deben ser atómicas se escriben como una sola sentencia SQL.
# - pool_recycle: renueva las conexiones antes de que el pooler las cierre por inactividad.
engine = create_engine(
    DATABASE_URL,
    isolation_level="AUTOCOMMIT",
    pool_size=5,
    max_overflow=5,
    pool_recycle=120,
)
SessionLocal = sessionmaker(bind=engine, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """Dependencia de FastAPI: abre una sesión por petición y la cierra al final."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
