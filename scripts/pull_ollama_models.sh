#!/usr/bin/env bash
# Pull the baseline Ollama model set used by the project.
#
# Run AFTER `docker compose up -d ollama` finishes booting.
# Models:
#   llama3:8b         — main text model
#   mistral:7b        — fast model for simple prompts
#   llava:7b          — vision (text + image)
#   nomic-embed-text  — shared embedding model (RAG + Mem0, agreed with ML-2)
set -euo pipefail

MODELS=(
  "llama3:8b"
  "mistral:7b"
  "llava:7b"
  "nomic-embed-text"
)

echo "==> Waiting for ollama container to become ready..."
for i in {1..30}; do
  if docker exec ollama ollama list >/dev/null 2>&1; then
    break
  fi
  sleep 2
done

for m in "${MODELS[@]}"; do
  echo "==> Pulling $m"
  docker exec ollama ollama pull "$m"
done

echo
echo "==> Installed models:"
docker exec ollama ollama list

echo
echo "==> Smoke-test llama3:8b"
docker exec ollama ollama run llama3:8b "Reply with the single word: OK"
