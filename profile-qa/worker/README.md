# profile-qa-worker

Cloudflare Worker that answers grounded questions about Salsabil Maulana Akbar's
profile, using **Cloudflare Workers AI** (open models, free tier — no paid APIs):

- **Embeddings:** `@cf/baai/bge-base-en-v1.5` (query side)
- **Generation:** `@cf/meta/llama-3.1-8b-instruct`
- **Retrieval:** hybrid dense (BGE cosine) + BM25 over `src/index.json`

`src/index.json` is prebuilt by `../profile-qa-backend/build_worker_index.py`
(chunks embedded with the *same* BGE model). Rebuild it whenever the site
content changes.

## Endpoints

- `POST /chat`  `{ "question": "..." }` → `{ "answer": "...", "sources": [...] }`
- `GET  /health`

CORS is locked to `https://sabilmakbar.github.io` (+ localhost for dev).

## Deploy (needs a personal Cloudflare account)

```bash
npm install
npx wrangler login          # opens browser; log in to YOUR Cloudflare account
npx wrangler deploy         # deploys; prints the https URL

# local dev against real Workers AI (needs login):
npx wrangler dev --remote
```

After deploy you get a URL like `https://profile-qa.<your-subdomain>.workers.dev`.
Put that into the site's `_config.yml` → `profile_qa.endpoint`.

> Workers AI free allocation is ~10k Neurons/day — plenty for a personal site.
