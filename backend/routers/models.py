from __future__ import annotations

from fastapi import APIRouter, HTTPException

from services import mws_client

router = APIRouter(prefix="/api/models", tags=["models"])


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
            "capabilities": ["text"],
        }
        for m in models
    ]