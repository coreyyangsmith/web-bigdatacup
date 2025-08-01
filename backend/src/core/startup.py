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


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to run startup & shutdown hooks.

    FastAPI will call this once when the application starts and once when it
    shuts down.  Any code executed *before* the ``yield`` runs on startup; any
    code executed *after* the ``yield`` runs on shutdown.
    """

    # ------------------------------------------------------------------
    # Startup – reset & seed database
    # ------------------------------------------------------------------
    logger.info("[Startup] Resetting & seeding database …")
    reset_and_seed_db()
    logger.info("[Startup] Database ready.")

    # Let the application run
    yield

    # ------------------------------------------------------------------
    # Shutdown – perform cleanup if necessary
    # ------------------------------------------------------------------
    logger.info("[Shutdown] Application shutting down.")