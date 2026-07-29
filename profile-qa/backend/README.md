---
title: Profile QA
emoji: 💬
colorFrom: purple
colorTo: pink
sdk: docker
app_port: 7860
pinned: false
---

# profile-qa-backend

Open-source RAG backend that answers grounded questions about Salsabil
Maulana Akbar's profile, sourced from the [al-folio](https://github.com/sabilmakbar/sabilmakbar.github.io)
site content (bio, CV, publications). No paid APIs — open models only.

## Pipeline

1. **`ingest.py`** — read the site sources, clean, chunk → `data/chunks.json`.
2. **`build_index.py`** — embed chunks (`all-MiniLM-L6-v2`) → `data/index.npz`.
3. **backend (piece 3)** — retrieve top-k chunks + generate with a small open
   instruct model; served as an HTTP API (deploy target: a personal Hugging
   Face Space).

## Usage

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e .                     # piece 2 deps

python ingest.py --site /path/to/sabilmakbar.github.io
python build_index.py                # build the vector index
python retrieve.py "where did Sabil study?"   # hybrid retrieval smoke-test

pip install -e '.[serve]'            # piece 3 deps (FastAPI + llama-cpp-python)
uvicorn app:app --port 8765          # serve the QA API (downloads the GGUF once)
```
