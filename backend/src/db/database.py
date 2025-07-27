from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from ..settings.config import settings

# SQLAlchemy engine & session setup
engine = create_engine(
    str(settings.database_url),
    connect_args={
        "check_same_thread": False if str(settings.database_url).startswith("sqlite") else False
    },
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 