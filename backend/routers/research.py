from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from services import research

router = APIRouter(prefix="/api/research", tags=["research"])


class ResearchRequest(BaseModel):
    query: str
    user_id: str = "default"


@router.post("/run")
async def run_research(body: ResearchRequest):
    return StreamingResponse(
        research.run(body.query, user_id=body.user_id),
        media_type="text/event-stream",
    )