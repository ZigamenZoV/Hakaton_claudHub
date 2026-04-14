"""VLM service — image analysis via moondream2 (CPU-friendly, ~1.9B params).

Called by router at http://vlm:8003/analyze.
moondream is the default because llava-phi-3 barely fits without GPU; switch via env.
"""
from __future__ import annotations

import io
import logging
import os
from contextlib import asynccontextmanager

import torch
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from PIL import Image
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("vlm")

MODEL_ID = os.getenv("VLM_MODEL", "vikhyatk/moondream2")
MODEL_REVISION = os.getenv("VLM_REVISION", "2024-08-26")
CACHE_DIR = os.getenv("HF_HOME", "/models")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
DTYPE = torch.float16 if DEVICE == "cuda" else torch.float32

_model = None
_tokenizer = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _model, _tokenizer
    os.makedirs(CACHE_DIR, exist_ok=True)
    log.info("Loading VLM model=%s device=%s dtype=%s", MODEL_ID, DEVICE, DTYPE)
    _tokenizer = AutoTokenizer.from_pretrained(
        MODEL_ID, revision=MODEL_REVISION, cache_dir=CACHE_DIR
    )
    _model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        revision=MODEL_REVISION,
        trust_remote_code=True,
        torch_dtype=DTYPE,
        cache_dir=CACHE_DIR,
    ).to(DEVICE)
    _model.eval()
    log.info("VLM ready")
    yield


app = FastAPI(title="GPTHub VLM", lifespan=lifespan)


class AnalyzeOut(BaseModel):
    answer: str
    model: str


@app.get("/health")
async def health():
    return {"status": "ok" if _model is not None else "loading", "model": MODEL_ID}


@app.post("/analyze", response_model=AnalyzeOut)
async def analyze(
    file: UploadFile = File(...),
    prompt: str = Form(default="Describe this image in detail."),
):
    if _model is None:
        raise HTTPException(status_code=503, detail="model not loaded yet")

    try:
        img = Image.open(io.BytesIO(await file.read())).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"bad image: {exc}") from exc

    with torch.inference_mode():
        enc = _model.encode_image(img)
        answer = _model.answer_question(enc, prompt, _tokenizer)

    return AnalyzeOut(answer=answer.strip(), model=MODEL_ID)
