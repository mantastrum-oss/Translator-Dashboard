from fastapi import APIRouter, Depends

from app.auth import require_analytics_api_key, require_dashboard_auth
from app.bot_status import current_status, record_heartbeat
from app.schemas import BotHeartbeatRequest, BotStatusResponse, IngestResult

router = APIRouter(prefix="/api/bot", tags=["bot"])


@router.post("/heartbeat", response_model=IngestResult, status_code=202, dependencies=[Depends(require_analytics_api_key)])
def heartbeat(payload: BotHeartbeatRequest) -> IngestResult:
    record_heartbeat(payload)
    return IngestResult(status="accepted")


@router.get("/status", response_model=BotStatusResponse, dependencies=[Depends(require_dashboard_auth)])
def status() -> BotStatusResponse:
    return current_status()