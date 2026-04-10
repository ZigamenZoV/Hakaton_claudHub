from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from services import memory as mem_svc

router = APIRouter(prefix="/api/memory", tags=["memory"])

DEFAULT_USER = "default"


class MemoryCreate(BaseModel):
    content: str
    category: str = "fact"
    user_id: str = DEFAULT_USER


@router.get("")
def get_memory(
    query: str | None = Query(None),
    user_id: str = Query(DEFAULT_USER),
):
    if query:
        return mem_svc.search(query, user_id=user_id)
    return mem_svc.get_all(user_id=user_id)


@router.post("", status_code=201)
def add_memory(body: MemoryCreate):
    mem_svc.add(body.content, user_id=body.user_id)
    return {"status": "ok"}


@router.delete("/{memory_id}", status_code=204)
def delete_memory(memory_id: str):
    try:
        mem_svc.delete(memory_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e)) from e