# CLAUDE.md

How this repo is built and updated. Read this before changing content, the QA
engine, or the deploy flow.

This is a monorepo: an Astro personal site plus a small profile QA chatbot that
runs on free, open-source infrastructure.

## Layout

- `src/` — the Astro site (pages, layouts, components, styles).
- `src/data/*.ts` — **the single source of truth for all content** (see below).
- `src/content/blog/` — blog posts as Markdown (schema in `src/content.config.ts`).
- `src/lib/qa.ts` — shared QA client (endpoint, transcript store, fetch, varied
  error messages) used by both the floating `ChatWidget` and the landing page.

## Routing

- `/` — landing page with an ask box that answers inline.
- `/about` — the profile (bio, core experience, tech stack, selected publications).
- `/blog` — posts; shows a "coming soon" state when nothing is published.
- `/publications`, `/repositories`, `/cv`, `/activities`.

The site uses Astro view transitions (`<ClientRouter />`), and the chat widget is
marked `transition:persist` so an open chat and its history survive navigation.
The transcript is mirrored to `sessionStorage` and shared between the landing
page and the widget.
- `profile-qa/worker/` — the QA chatbot, a Cloudflare Worker (Workers AI).
- `profile-qa/worker/src/index.json` — the chatbot's search index. **Generated, do not edit by hand.**
- `profile-qa/scripts/build-index.ts` — generates that index from `src/data`.
- `profile-qa/backend/` — legacy Python prototype, retired. Kept for reference only; not used.
- `.github/workflows/deploy.yml` — builds the site and deploys it.

## Branches

- `master` — source of truth. Pushing here triggers a build + deploy.
- `gh-pages` — the built output GitHub Pages actually serves. Written by CI, never edit directly.
- `al-folio-legacy` — the old Jekyll (al-folio) site, preserved.

## Data model (single source of truth)

All content lives in `src/data/`:

- `profile.ts` — name, tagline, location, blurb, social/scholar links, nav.
- `about.ts` — About-page bio: summary, core experience, tech stack grouped by
  where it was used, "currently exploring" interests, and rotating taglines.
- `cv.ts` — education, experience, projects, interests.
- `publications.ts` — papers (link to the published venue, e.g. ACL Anthology).

The Repositories page fetches the repo list live from GitHub at build time; there
is no committed repo data. Featured cross-org repos are hand-picked in the
`FEATURED` constant in `src/pages/repositories.astro`.

Both consumers read these same files:

1. the **site** (Astro imports them directly), and
2. the **QA index** (`build-index.ts` serializes them into `index.json`).

So content is edited in exactly one place, and the chatbot inherits it. Never
edit `index.json` directly; regenerate it.

## Setup, build, and deploy

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for the full step-by-step
(requirements, local dev, building, updating content, and deploying both the
site and the worker).

Rule of thumb: after any `src/data` edit that touches CV, profile, or
publications, run `npm run build:index` and redeploy the worker so the chatbot
stays in sync with the site.

## Privacy and curation rules

- **Never** put phone numbers, home address, or absolute financial figures into
  `src/data` or the QA index. Percentage or relative metrics are fine if desired.
- The raw CV LaTeX/PDF is **not** in this repo. It lives in a private archive.
  Its hidden fields (for example a phone number gated behind a LaTeX flag) must
  never be pulled into the pipeline.
- Embeddings do **not** redact. The raw chunk text is stored in `index.json` and
  returned to users as answer context. Redaction works only by keeping private
  data out of `src/data` in the first place, which is why the index is generated
  from the structured data and nothing else.
- The worker's CORS is locked to the site origin plus localhost.

## Typography

Site chrome is sans (Inter, with Inter Tight for headings); long-form article
prose is set in a serif (Source Serif 4) for reading comfort, with JetBrains Mono
for code. Fonts are defined once as tokens in `src/styles/global.css` and loaded
in `src/layouts/Base.astro`.

## QA engine notes

- Cloudflare Workers AI, free tier. No paid APIs.
  - Embeddings: `@cf/baai/bge-m3`.
  - Generation: `@cf/meta/llama-3.1-8b-instruct-fp8`.
- Hybrid retrieval: dense cosine similarity plus BM25. Chunk vectors are embedded
  once per isolate and cached.
- The widget sends the last few turns as `history`. They are replayed as chat
  messages so follow-up questions resolve, and blended into the retrieval query
  so short follow-ups still match the right chunks.
- `/chat` rejects any request whose `Origin` is not allowed, before doing any AI
  work, so other sites and scripts cannot spend the free quota. The list comes
  from `ALLOWED_ORIGINS` in `wrangler.toml` (comma-separated), falling back to
  defaults in the code. Note this stops casual abuse, not a forged-header client.
- The worker injects today's date into the prompt so time-relative answers (such
  as years of experience) stay correct without editing data. The
  `cv:experience:overview` chunk carries the career start date for that math.
- Each question and answer is logged to a Cloudflare D1 database
  (`profile-qa-logs`, binding `DB`) for review, with no IPs or visitor
  identifiers. Logging is best-effort via `ctx.waitUntil`, so it never delays or
  breaks an answer. Schema is in `profile-qa/worker/schema.sql`; see
  DEPLOYMENT_GUIDE.md for how to query it.
