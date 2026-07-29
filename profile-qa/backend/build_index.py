"""
Piece 2 — embeddings + vector index.

Embeds the chunks from data/chunks.json with a small open sentence-embedding
model and saves the vectors. Also doubles as a retrieval smoke-test:

  build the index:   python build_index.py
  test a query:      python build_index.py --query "where did Sabil study?"

Output: data/index.npz  (embeddings + chunk ids/text/source + model name)
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from sentence_transformers import SentenceTransformer

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"  # 384-dim, ~80MB, CPU-fine
CHUNKS = Path("data/chunks.json")
INDEX = Path("data/index.npz")


def build() -> None:
    chunks = json.loads(CHUNKS.read_text(encoding="utf-8"))
    model = SentenceTransformer(MODEL_NAME)
    texts = [c["text"] for c in chunks]                       # shown to the LLM
    embed_texts = [c.get("embed_text", c["text"]) for c in chunks]  # vectorized
    emb = model.encode(embed_texts, normalize_embeddings=True, show_progress_bar=False)
    np.savez(
        INDEX,
        embeddings=emb.astype("float32"),
        ids=np.array([c["id"] for c in chunks]),
        texts=np.array(texts, dtype=object),
        sources=np.array([c["source"] for c in chunks], dtype=object),
        model=MODEL_NAME,
    )
    print(f"embedded {len(texts)} chunks ({emb.shape[1]}-dim) with {MODEL_NAME}")
    print(f"saved -> {INDEX}")


def search(query: str, k: int = 4) -> None:
    data = np.load(INDEX, allow_pickle=True)
    model = SentenceTransformer(str(data["model"]))
    q = model.encode([query], normalize_embeddings=True)[0].astype("float32")
    scores = data["embeddings"] @ q                       # cosine (vectors normed)
    top = np.argsort(-scores)[:k]
    print(f"query: {query!r}\n")
    for rank, i in enumerate(top, 1):
        print(f"#{rank}  score={scores[i]:.3f}  ({data['sources'][i]})")
        print(f"     {str(data['texts'][i])[:140]}\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--query", help="run a retrieval smoke-test instead of building")
    ap.add_argument("-k", type=int, default=4)
    args = ap.parse_args()
    if args.query:
        search(args.query, args.k)
    else:
        build()


if __name__ == "__main__":
    main()
