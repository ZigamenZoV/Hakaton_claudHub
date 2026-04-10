from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel

from services import export as export_svc

router = APIRouter(prefix="/api/export", tags=["export"])


class ExportRequest(BaseModel):
    content: str
    title: str = "GPTHub Report"


@router.post("/pptx")
async def to_pptx(body: ExportRequest):
    try:
        data = await export_svc.to_pptx(body.content, body.title)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": f'attachment; filename="{body.title}.pptx"'},
    )


@router.post("/pdf")
async def to_pdf(body: ExportRequest):
    try:
        data = await export_svc.to_pdf(body.content, body.title)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{body.title}.pdf"'},
    )