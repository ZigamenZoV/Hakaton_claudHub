"""Stable Diffusion 1.5 image generation service.

Called by router at http://sd_api:8002/generate.
CPU-only by default (slow but works on jury's laptop). Uses small/distilled SD 1.5.
Returns PNG bytes directly so the router can forward to UI without base64 round-trip.
"""
from __future__ import annotations

import io
import logging
import os
from contextlib import asynccontextmanager

import torch
from diffusers import StableDiffusionPipeline
from fastapi import FastAPI, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("sd_api")

MODEL_ID = os.getenv("SD_MODEL", "runwayml/stable-diffusion-v1-5")
CACHE_DIR = os.getenv("HF_HOME", "/models")
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
DTYPE = torch.float16 if DEVICE == "cuda" else torch.float32

_pipe: StableDiffusionPipeline | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _pipe
    os.makedirs(CACHE_DIR, exist_ok=True)
    log.info("Loading SD pipeline=%s device=%s", MODEL_ID, DEVICE)
    pipe = StableDiffusionPipeline.from_pretrained(
        MODEL_ID,
        torch_dtype=DTYPE,
        cache_dir=CACHE_DIR,
        safety_checker=None,
        requires_safety_checker=False,
    )
    pipe = pipe.to(DEVICE)
    if DEVICE == "cpu":
        pipe.enable_attention_slicing()
    _pipe = pipe
    log.info("SD ready")
    yield


app = FastAPI(title="GPTHub SD", lifespan=lifespan)


class GenerateIn(BaseModel):
    prompt: str
    negative_prompt: str | None = None
    steps: int = Field(default=20, ge=1, le=50)
    guidance: float = Field(default=7.5, ge=0.0, le=20.0)
    width: int = Field(default=512, ge=256, le=768)
    height: int = Field(default=512, ge=256, le=768)
    seed: int | None = None


@app.get("/health")
async def health():
    return {"status": "ok" if _pipe is not None else "loading", "model": MODEL_ID, "device": DEVICE}


@app.post("/generate")
async def generate(req: GenerateIn):
    if _pipe is None:
        raise HTTPException(status_code=503, detail="pipeline not loaded yet")

    generator = None
    if req.seed is not None:
        generator = torch.Generator(device=DEVICE).manual_seed(req.seed)

    log.info("generate prompt=%r steps=%d %dx%d", req.prompt, req.steps, req.width, req.height)
    with torch.inference_mode():
        result = _pipe(
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            num_inference_steps=req.steps,
            guidance_scale=req.guidance,
            width=req.width,
            height=req.height,
            generator=generator,
        )
    img = result.images[0]
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")
