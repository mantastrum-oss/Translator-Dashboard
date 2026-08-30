from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import require_analytics_api_key, require_dashboard_auth
from app.config import get_settings
from app.routes.events import router as events_router
from app.routes.health import router as health_router
from app.routes.metrics import router as metrics_router
from app.routes.dashboard import router as dashboard_router
from app.routes.blocks import router as blocks_router
from app.routes.bot import router as bot_router

settings = get_settings()

app = FastAPI(title="Translator Analytics API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=list({
        *[origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()],
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    }),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router)
app.include_router(events_router, dependencies=[Depends(require_analytics_api_key)])
app.include_router(metrics_router, dependencies=[Depends(require_dashboard_auth)])
app.include_router(dashboard_router, dependencies=[Depends(require_dashboard_auth)])
app.include_router(blocks_router, dependencies=[Depends(require_dashboard_auth)])
app.include_router(bot_router)
