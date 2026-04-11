from __future__ import annotations

import os

import httpx
from fastapi import APIRouter, File, HTTPException, UploadFile

router = APIRouter(prefix="/api/voice", tags=["voice"])

WHISPER_URL = os.getenv("WHISPER_URL", "http://whisper:8000/transcribe")
USE_MWS_ASR = os.getenv("USE_MWS_ASR", "true").lower() == "true"


@router.post("/transcribe")
async def transcribe(audio: UploadFile = File(...)):
    data = await audio.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty audio")

    # Try MWS ASR first (cloud, faster)
    if USE_MWS_ASR:
        from services.mws_client import transcribe_audio
        try:
            text = await transcribe_audio(
                data, audio.filename or "audio.webm", audio.content_type or "audio/webm"
            )
            return {"text": text, "source": "mws"}
        except Exception:
            pass  # fallback to local whisper

    # Fallback to local whisper service
    async with httpx.AsyncClient(timeout=60) as client:
        try:
            r = await client.post(
                WHISPER_URL,
                files={"file": (audio.filename or "audio.webm", data, audio.content_type)},
            )
            r.raise_for_status()
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"whisper error: {e}") from e

    return {"text": r.json().get("text", ""), "source": "local_whisper"}
