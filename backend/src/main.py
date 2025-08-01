from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .settings.config import settings

# Routers
from .routes.chat import router as chat_router
from .routes.misc import router as misc_router
from .routes.games import router as games_router
from .routes.events import router as events_router
from .routes.players import router as players_router

from .core.startup import lifespan


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register all routers
app.include_router(chat_router)
app.include_router(misc_router)
app.include_router(games_router)
app.include_router(events_router)
app.include_router(players_router)