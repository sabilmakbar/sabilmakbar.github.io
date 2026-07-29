"""
Build the index bundle for the Cloudflare Worker.

Cloudflare Workers AI hosts BGE (@cf/baai/bge-base-en-v1.5) for embeddings, so we
must embed the chunks with the SAME model here (locally) that the Worker uses for
the query at runtime — otherwise query and chunk vectors live in different spaces.

Output: ../profile-qa-worker/src/index.json  — [{source, text, embedding[768]}]
(vectors L2-normalized, so cosine == dot product in the Worker).
"""

from __future__ import annotations

import json
from pathlib import Path

from sentence_transformers import SentenceTransformer

MODEL = "BAAI/bge-base-en-v1.5"          # same weights as CF's @cf/baai/bge-base-en-v1.5
CHUNKS = Path("data/chunks.json")
OUT = Path("../profile-qa-worker/src/index.json")


def main() -> None:
    chunks = json.loads(CHUNKS.read_text(encoding="utf-8"))
    model = SentenceTransformer(MODEL)
    # passages are embedded WITHOUT the bge query instruction (that goes on the
    # query side only, applied in the Worker).
    embed_texts = [c.get("embed_text", c["text"]) for c in chunks]
    emb = model.encode(embed_texts, normalize_embeddings=True)
    records = [{
        "source": c["source"],
        "text": c["text"],
        "embedding": [round(float(x), 6) for x in emb[i]],
    } for i, c in enumerate(chunks)]

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(records), encoding="utf-8")
    print(f"wrote {len(records)} chunks ({emb.shape[1]}-dim, model={MODEL}) -> {OUT}")


if __name__ == "__main__":
    main()
