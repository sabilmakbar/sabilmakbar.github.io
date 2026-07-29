"""
Piece 3 — generation backend.

FastAPI service: question -> hybrid retrieval -> grounded prompt -> answer from
a small open instruct model (Qwen2.5-1.5B-Instruct, GGUF via llama-cpp-python).
No paid APIs. Designed to run on a free HF Space CPU tier.

Run locally:
  pip install -e '.[serve]'
  uvicorn app:app --reload --port 8765
  curl -s localhost:8765/chat -H 'content-type: application/json' \
       -d '{"question":"What papers has he published?"}' | jq
"""

from __future__ import annotations

import os
import time
from collections import defaultdict, deque
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from retrieve import Retriever

# ---- config (overridable via env on the Space) -------------------------
MODEL_REPO = os.getenv("MODEL_REPO", "Qwen/Qwen2.5-1.5B-Instruct-GGUF")
MODEL_FILE = os.getenv("MODEL_FILE", "qwen2.5-1.5b-instruct-q4_k_m.gguf")
N_CTX = int(os.getenv("N_CTX", "4096"))
TOP_K = int(os.getenv("TOP_K", "5"))
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "400"))
# comma-separated allowed origins; the site + local dev by default
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "https://sabilmakbar.github.io,http://localhost:4000,http://127.0.0.1:4000",
).split(",")

SYSTEM_PROMPT = (
    "You are a helpful assistant that answers questions about Salsabil Maulana "
    "Akbar (who goes by 'Sabil') for visitors to his personal website. Answer "
    "ONLY using the profile context provided in the user message. If the answer "
    "is not in the context, say you don't have that information rather than "
    "guessing. Be concise, factual, and speak about him in the third person."
)

_state: dict = {}  # holds the loaded retriever + llm

# ---- simple in-memory per-IP rate limit (single-container Space) -------
RATE_MAX = int(os.getenv("RATE_MAX", "20"))        # requests ...
RATE_WINDOW = int(os.getenv("RATE_WINDOW", "60"))  # ... per this many seconds
_hits: dict[str, deque] = defaultdict(deque)


def _client_ip(request: Request) -> str:
    # HF proxies requests, so the real client is in X-Forwarded-For (leftmost)
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def rate_limit(request: Request) -> None:
    now = time.monotonic()
    dq = _hits[_client_ip(request)]
    while dq and now - dq[0] > RATE_WINDOW:
        dq.popleft()
    if len(dq) >= RATE_MAX:
        raise HTTPException(status_code=429,
                            detail="Too many requests — please slow down.")
    dq.append(now)


def build_prompt_context(hits: list[dict]) -> str:
    return "\n\n".join(f"[{h['source']}]\n{h['text']}" for h in hits)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from llama_cpp import Llama
    _state["retriever"] = Retriever()
    _state["llm"] = Llama.from_pretrained(
        repo_id=MODEL_REPO,
        filename=MODEL_FILE,
        n_ctx=N_CTX,
        verbose=False,
    )
    yield
    _state.clear()


app = FastAPI(title="profile-qa-backend", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=500)


class ChatResponse(BaseModel):
    answer: str
    sources: list[str]


@app.get("/health")
def health():
    return {"status": "ok", "model": MODEL_REPO, "ready": "llm" in _state}


@app.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest, _: None = Depends(rate_limit)):
    hits = _state["retriever"].search(req.question, k=TOP_K)
    context = build_prompt_context(hits)
    out = _state["llm"].create_chat_completion(
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user",
             "content": f"Profile context:\n{context}\n\nQuestion: {req.question}"},
        ],
        temperature=0.2,
        max_tokens=MAX_TOKENS,
    )
    answer = out["choices"][0]["message"]["content"].strip()
    return ChatResponse(answer=answer, sources=[h["source"] for h in hits])
