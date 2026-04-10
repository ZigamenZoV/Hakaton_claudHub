from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services import mws_client

router = APIRouter(prefix="/api/images", tags=["images"])


class ImageRequest(BaseModel):
    prompt: str


@router.post("/generate")
async def generate(body: ImageRequest):
    try:
        url = await mws_client.generate_image(body.prompt)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e)) from e
    return {"url": url}