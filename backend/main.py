from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import chat, export, files, images, memory, models, openai_compat, research, voice

app = FastAPI(title="GPTHub Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (openai_compat, chat, voice, files, memory, images, export, research, models):
    app.include_router(r.router)


@app.get("/health")
def health():
    return {"status": "ok"}