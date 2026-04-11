from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.research import fetch_url

router = APIRouter(prefix="/api/web", tags=["web"])


class FetchRequest(BaseModel):
    url: str


@router.post("/fetch")
async def web_fetch(body: FetchRequest):
    if not body.url.startswith("http"):
        raise HTTPException(status_code=400, detail="invalid url")
    content = await fetch_url(body.url)
    if not content:
        raise HTTPException(status_code=502, detail="failed to fetch url")
    return {"url": body.url, "content": content, "length": len(content)}