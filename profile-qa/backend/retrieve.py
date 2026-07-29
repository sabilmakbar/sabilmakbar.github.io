"""
Hybrid retrieval — dense (sentence embeddings) + BM25 (lexical keyword) scoring.

Dense retrieval matches on topic/meaning; BM25 matches literal words. Combining
them fixes the failure mode where meta queries ("list his papers") miss because
no chunk is *semantically* about "publishing" — BM25 catches the keyword.

  python retrieve.py "what papers has he published?"
  python retrieve.py "where did he study?" -k 3 --alpha 0.5
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

import numpy as np
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer

INDEX = Path("data/index.npz")
_TOKEN = re.compile(r"[a-z0-9]+")


def tokenize(s: str) -> list[str]:
    return _TOKEN.findall(s.lower())


def _norm(x: np.ndarray) -> np.ndarray:
    """Min-max to [0,1]; flat array -> zeros (no signal)."""
    lo, hi = float(x.min()), float(x.max())
    return (x - lo) / (hi - lo) if hi > lo else np.zeros_like(x)


class Retriever:
    def __init__(self, index_path: Path = INDEX, alpha: float = 0.5):
        d = np.load(index_path, allow_pickle=True)
        self.emb = d["embeddings"].astype("float32")
        self.texts = [str(t) for t in d["texts"]]
        self.sources = [str(s) for s in d["sources"]]
        self.model = SentenceTransformer(str(d["model"]))
        self.bm25 = BM25Okapi([tokenize(t) for t in self.texts])
        self.alpha = alpha  # weight on dense; (1-alpha) on BM25

    def search(self, query: str, k: int = 4) -> list[dict]:
        q = self.model.encode([query], normalize_embeddings=True)[0].astype("float32")
        dense = self.emb @ q                                   # cosine, vectors normed
        lexical = np.asarray(self.bm25.get_scores(tokenize(query)))
        combined = self.alpha * _norm(dense) + (1 - self.alpha) * _norm(lexical)
        order = np.argsort(-combined)[:k]
        return [{
            "source": self.sources[i],
            "text": self.texts[i],
            "score": float(combined[i]),
            "dense": float(dense[i]),
            "bm25": float(lexical[i]),
        } for i in order]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("query")
    ap.add_argument("-k", type=int, default=4)
    ap.add_argument("--alpha", type=float, default=0.5)
    args = ap.parse_args()
    r = Retriever(alpha=args.alpha)
    print(f"query: {args.query!r}  (alpha={args.alpha})\n")
    for rank, hit in enumerate(r.search(args.query, args.k), 1):
        print(f"#{rank}  score={hit['score']:.3f} "
              f"(dense={hit['dense']:.3f} bm25={hit['bm25']:.2f})  ({hit['source']})")
        print(f"     {hit['text'][:140].replace(chr(10), ' / ')}\n")


if __name__ == "__main__":
    main()
