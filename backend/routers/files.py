from __future__ import annotations

import uuid

from fastapi import APIRouter, File, HTTPException, UploadFile

from services import parser, rag

router = APIRouter(prefix="/api/files", tags=["files"])

_MAX_SIZE = 20 * 1024 * 1024


@router.post("/upload")
async def upload(file: UploadFile = File(...)):
    data = await file.read()
    if len(data) > _MAX_SIZE:
        raise HTTPException(status_code=413, detail="file too large (max 20 MB)")

    file_id = str(uuid.uuid4())

    try:
        text = parser.extract_text(file.filename or "file.txt", data)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"cannot parse file: {e}") from e

    if text.strip():
        await rag.ingest(file_id, text, metadata={"filename": file.filename})

    return {
        "id": file_id,
        "name": file.filename,
        "size": len(data),
        "type": file.content_type,
        "chunks_indexed": bool(text.strip()),
    }