"""Faster-Whisper HTTP service.

POST /transcribe  - multipart file upload ("file"), returns JSON with text and segments.
GET  /health      - liveness/readiness probe.
"""
import os
import tempfile
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from faster_whisper import WhisperModel

MODEL_NAME = os.getenv("WHISPER_MODEL", "small")
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

app = FastAPI(title="faster-whisper", version="1.0")

# Lazy-loaded singleton — avoids blocking startup and lets /health respond fast.
_model: Optional[WhisperModel] = None


def get_model() -> WhisperModel:
    global _model
    if _model is None:
        _model = WhisperModel(MODEL_NAME, device=DEVICE, compute_type=COMPUTE_TYPE)
    return _model


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "device": DEVICE,
        "compute_type": COMPUTE_TYPE,
        "loaded": _model is not None,
    }


@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
    vad_filter: bool = Form(True),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="empty filename")

    suffix = os.path.splitext(file.filename)[1] or ".wav"
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="empty file")

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(data)
        tmp_path = tmp.name

    try:
        model = get_model()
        segments, info = model.transcribe(
            tmp_path,
            language=language,
            vad_filter=vad_filter,
        )
        seg_list = [
            {"start": s.start, "end": s.end, "text": s.text}
            for s in segments
        ]
        text = "".join(s["text"] for s in seg_list).strip()
        return {
            "text": text,
            "language": info.language,
            "language_probability": info.language_probability,
            "duration": info.duration,
            "segments": seg_list,
        }
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass
