from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import TranslationEvent
from app.schemas import IngestResult, TranslationEventIn

router = APIRouter(prefix="/v1/events", tags=["events"])


@router.post("/translation", response_model=IngestResult, status_code=status.HTTP_202_ACCEPTED)
def ingest_translation_event(payload: TranslationEventIn, db: Session = Depends(get_db)) -> IngestResult:
    event = TranslationEvent(
        created_at_utc=payload.created_at_utc,
        source=payload.source,
        guild_id=payload.guild_id,
        channel_id=payload.channel_id,
        user_id=payload.user_id,
        target_lang=payload.target_lang,
        char_count=payload.char_count,
        success=payload.success,
        error_code=payload.error_code,
    )
    db.add(event)
    db.commit()
    return IngestResult(status="accepted")
