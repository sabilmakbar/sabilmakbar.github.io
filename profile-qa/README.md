# profile-qa

Open-source RAG chatbot that answers grounded questions about Salsabil Maulana
Akbar's profile, embedded on [sabilmakbar.github.io](https://sabilmakbar.github.io)
(the 💬 widget). No paid APIs — open models on a free tier.

## Live architecture

```
Visitor browser ─► GitHub Pages (site + chat widget)
                        │ fetch()
                        ▼
             Cloudflare Worker  "profile-qa-cf"        ← the live engine
               • hybrid retrieval: bge-m3 (dense) + BM25
               • generation: Llama 3.1 8B
               • all on Cloudflare Workers AI (free tier)
```

## Layout

- **`worker/`** — **the live engine.** Cloudflare Worker (`src/index.js`) that
  does retrieval + generation on Workers AI. Deployed with `wrangler deploy`.
  Its `src/index.json` is the bundled profile chunks (text only; embeddings are
  computed on Cloudflare at runtime).
- **`backend/`** — Python tooling that produces the chunk bundle:
  `ingest.py` reads the al-folio site content → `data/chunks.json`, which is
  copied into `worker/src/index.json`.
  *(Note: `backend/app.py` + `Dockerfile` are an earlier self-hosted FastAPI
  approach, kept for reference — the live engine is the Worker, since HF Spaces'
  free tier no longer allows Docker backends.)*

## Refresh after the profile changes

```bash
cd backend
.venv/bin/python ingest.py --site /path/to/sabilmakbar.github.io
python -c "import json;c=json.load(open('data/chunks.json'));json.dump([{'source':x['source'],'text':x['text']} for x in c],open('../worker/src/index.json','w'),ensure_ascii=False)"
cd ../worker && npx wrangler deploy
```

## Deploy the worker (from `worker/`)

```bash
npm install
npx wrangler deploy        # needs a personal Cloudflare account (wrangler login)
```
