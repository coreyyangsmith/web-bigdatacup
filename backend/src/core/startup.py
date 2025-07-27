"""Application startup tasks.

This module centralises one-off initialisation steps that should run when the
FastAPI service starts.  Import and call :pyfunc:`lifespan` from the main
application to register these tasks.
"""

from __future__ import annotations

from contextlib import asynccontextmanager
from fastapi import FastAPI

from ..utils.logger import logger
from ..db.seed import reset_and_seed_db
from ..ml.xg_model import get_model


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Async context manager for application lifespan events."""
    # ------------------------------------------------------------------
    # Startup tasks
    # ------------------------------------------------------------------
    
    # ------------------------------------------------------------------
    # 1. Database reset/seed
    # ------------------------------------------------------------------
    logger.info("[Startup] Resetting & seeding database …")
    reset_and_seed_db()
    logger.info("[Startup] Database ready.")

    # ------------------------------------------------------------------
    # 2. ML model training / loading
    # ------------------------------------------------------------------
    try:
        logger.info("[Startup] Initialising Expected Goals model …")
        get_model()
        logger.info("[Startup] Expected Goals model ready.")
    except Exception as exc:
        logger.exception("Failed to train/load Expected Goals model: %s", exc)
        # Service can still start; endpoints depending on the model will handle 
    
    yield
    
    # ------------------------------------------------------------------
    # Shutdown tasks (cleanup if needed)
    # ------------------------------------------------------------------
    logger.info("[Shutdown] Application shutting down.")