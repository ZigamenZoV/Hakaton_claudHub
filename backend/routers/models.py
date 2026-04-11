from __future__ import annotations

from fastapi import APIRouter, HTTPException

from services import mws_client

router = APIRouter(prefix="/api/models", tags=["models"])

# Known capabilities per model
_MODEL_CAPS = {
    "qwen2.5-72b-instruct": ["text", "code", "research"],
    "qwen2.5-vl": ["text", "vision"],
    "qwen-image-lightning": ["image_generation"],
    "bge-m3": ["embeddings"],
    "whisper-medium": ["asr"],
}


@router.get("")
async def list_models():
    try:
        models = await mws_client.list_models()
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    return [
        {
            "id": m["id"],
            "name": m.get("id", ""),
            "provider": "mws",
            "capabilities": _MODEL_CAPS.get(m["id"], ["text"]),
        }
        for m in models
    ]
