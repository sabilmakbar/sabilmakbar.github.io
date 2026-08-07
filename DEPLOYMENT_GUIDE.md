# Deployment Guide

Step-by-step for running, building, updating, and deploying this repo. For the
architecture and data model, see [CLAUDE.md](./CLAUDE.md).

The repo has two deployable parts:

- the **site** (Astro), deployed to GitHub Pages by GitHub Actions, and
- the **QA worker** (Cloudflare Worker), deployed manually with wrangler.

---

## 1. Requirements

- **Node.js 22.12 or newer**, with npm. Node 22 is required because the index
  generator uses Node's built-in TypeScript type stripping
  (`--experimental-strip-types`). How you install Node is up to you: `nvm`, a
  system package, or a conda env. (On the author's machine, Node lives in a
  conda env activated with `conda activate node`. That command is machine-specific
  and not part of the repo. Any Node 22+ on your PATH works.)
- **Git**, with push access to the GitHub repo.
- For deploying the worker: a free **Cloudflare account** and the **wrangler** CLI
  (installed locally as a worker devDependency, run via `npx`).
- Optional for local dev: a **GitHub personal access token** to raise the GitHub
  API rate limit on the Repositories page (read-only, no scopes needed).

Check your Node version:

```bash
node --version   # must be >= 22.12
```

---

## 2. First-time setup

```bash
# clone
git clone https://github.com/sabilmakbar/sabilmakbar.github.io.git
cd sabilmakbar.github.io

# install site dependencies
npm install

# install worker dependencies (only needed to run/deploy the QA worker)
cd profile-qa/worker && npm install && cd ../..
```

Authenticate wrangler once (opens a browser), only if you will deploy the worker:

```bash
cd profile-qa/worker && npx wrangler login && cd ../..
```

Alternatively, set a Cloudflare API token in your shell instead of logging in:

```bash
export CLOUDFLARE_API_TOKEN=your_token_here
```

---

## 3. Run locally

```bash
npm run dev            # site at http://localhost:4321
```

The Repositories page fetches live data from GitHub at build time. Without a
token you may hit GitHub's anonymous rate limit and see an empty personal-projects
grid locally. To avoid that, set a token before running:

```bash
export GITHUB_TOKEN=your_github_token
npm run dev
```

---

## 4. Build

```bash
npm run build          # builds the static site into dist/
npm run preview        # serves the built dist/ locally to check it
```

---

## 4b. Tests

```bash
npm test      # builds the site, then runs the checks
```

No test framework is installed; this uses Node's built-in runner. Three files:

- `tests/content.test.ts` needs no build, so `npm run test:data` runs it alone.
- `tests/worker.test.ts` exercises the QA worker outside the Workers runtime, with
  stand-ins for the AI and D1 bindings. It also needs no build.
- `tests/build.test.ts` checks the built output in `dist/`.

The suite checks the things that are costly to get wrong:

- **Privacy:** no phone numbers or absolute money figures in `src/data`, in the QA
  index, or in any built page.
- **QA index freshness:** regenerating from `src/data` must reproduce the committed
  `index.json`. This fails if you edited content but forgot `npm run build:index`.
- **Data sanity:** experience is reverse-chronological, exactly one current role,
  career start stays Nov 2020 (the chatbot derives years of experience from it),
  publications have titles/authors/https links, awards are complete.
- **Interests stay separate from skills:** Explainable AI and Causal Inference must
  not appear in the tech-stack list, since they are interests rather than experience.
- **Links:** every internal link in the built site resolves, and every nav item has
  a page.
- **Chat widget:** absent on the landing page, present on content pages, and using
  the same `transition:persist` name everywhere so conversations survive navigation.
- **Worker behaviour:** the origin allowlist (including per-deployment overrides),
  rate limiting and its `Retry-After`, that callers are keyed by a hash rather than
  a raw IP, that a database outage fails open, that conversation history is replayed
  but bounded, that today's date reaches the prompt, and that bad input is rejected
  rather than crashing.
- **House style and consistency:** no em dashes, no placeholder text, the current
  employer stays anonymised, no duplicate entries, teaching dates are well-formed
  and reverse-chronological, no future dates, every referenced image exists, and
  every social icon has an implementation.

## 5. Update content

All content lives in `src/data/`. Edit the relevant file, then regenerate the QA
index if you touched CV, profile, or publications.

| What changed | Edit | Then run |
| --- | --- | --- |
| Job / experience / education | `src/data/cv.ts` (and `profile.ts` if the current role changed) | `npm run build:index` |
| Publications | `src/data/publications.ts` | `npm run build:index` |
| Profile links / tagline / nav | `src/data/profile.ts` | `npm run build:index` |
| About bio, tech stack, interests | `src/data/about.ts` | `npm run build:index` |
| Teaching, talks, activities | `src/pages/activities.astro` | nothing |
| Blog post | add/edit Markdown in `src/content/blog/` | nothing |
| Featured repos | `FEATURED` in `src/pages/repositories.astro` | nothing |

Blog posts are Markdown with frontmatter (`title`, `date`, `summary`, `tags`,
optional `repo`, `draft`). Set `draft: true` to keep one unpublished; when no
posts are published, `/blog` shows a "coming soon" page automatically.

```bash
npm run build:index    # regenerates profile-qa/worker/src/index.json from src/data
```

After running `build:index`, redeploy the worker (step 6) so the chatbot serves
the updated index. Do not edit `index.json` by hand; it is generated.

**Privacy reminder:** never put phone numbers, home address, or absolute financial
figures into `src/data`. Anything in `src/data` can appear on the site and in
chatbot answers. See the privacy rules in [CLAUDE.md](./CLAUDE.md).

---

## 6. Deploy

### Site (automatic)

Push to `master`. GitHub Actions builds the site and publishes it to the
`gh-pages` branch, which GitHub Pages serves.

```bash
git add -A
git commit -m "update content"
git push origin master
```

You can also trigger a build manually from the Actions tab ("Run workflow"). A
weekly scheduled run refreshes the auto-fetched GitHub repo data even if you
push nothing.

### QA worker (automatic, once a token is configured)

Pushing a change under `profile-qa/worker/` (including the generated
`index.json`) triggers the **Deploy QA worker** workflow. It has three fail-safes:

1. **Refuses a stale index.** It runs the data checks first, so it will not ship a
   worker whose `index.json` disagrees with `src/data`.
2. **Health check after deploying.** It polls `/health` and requires the live chunk
   count to match the committed index, retrying for about a minute while
   Cloudflare propagates.
3. **Automatic rollback.** If the deploy succeeded but the health check failed, it
   rolls back to the version that was live before. It records that version id
   *before* deploying, and the rollback step only runs when the deploy itself
   succeeded, so a failure earlier in the run can never revert a good version.

If no `CLOUDFLARE_API_TOKEN` is configured the workflow skips with a notice
instead of failing, which keeps forks green.

One-time setup:

1. In Cloudflare, create an API token using the **Edit Cloudflare Workers**
   template, and add **D1: Edit** for the same account (the worker has a D1
   binding).
2. Add it to GitHub as a secret named `CLOUDFLARE_API_TOKEN`.

### QA worker (manual)

Still works, and is the fallback if the workflow is unavailable:

```bash
cd profile-qa/worker
npx wrangler deploy      # or: npm run deploy
```

To roll back by hand:

```bash
cd profile-qa/worker
npx wrangler deployments list          # find the version you want
npx wrangler rollback <version-id> -y -m "reason"
```

This uploads the worker and its `index.json`. The live endpoint is
`https://profile-qa-cf.maulana-1998.workers.dev`. Redeploy whenever `index.json`
or the worker code changes.

Verify the deploy:

```bash
curl -s -X POST https://profile-qa-cf.maulana-1998.workers.dev/chat \
  -H "Content-Type: application/json" \
  -d '{"question":"Where does Sabil currently work?"}'
```

---

## 6b. QA logs (Cloudflare D1)

The worker logs each question and answer to a D1 database (`profile-qa-logs`,
binding `DB`), with no IPs or visitor identifiers. This is best-effort and never
blocks a reply.

One-time setup (already done for this repo, listed for reproducibility):

```bash
cd profile-qa/worker
npx wrangler d1 create profile-qa-logs          # prints the database_id for wrangler.toml
npx wrangler d1 execute profile-qa-logs --remote --file=schema.sql
```

Query the log:

```bash
cd profile-qa/worker
npx wrangler d1 execute profile-qa-logs --remote \
  --command "SELECT ts, question, latency_ms FROM qa_log ORDER BY id DESC LIMIT 20;"
```

## 6c. Forking this site

The QA worker only answers calls from origins it recognises, and the site points
at one specific deployed worker. Two things to change when replicating:

1. **`profile-qa/worker/wrangler.toml`** — set `ALLOWED_ORIGINS` to your own site
   (comma-separated). The `http://localhost:4321` entries are relative to
   whoever runs the dev server, so they already work for anyone; only the
   production domain needs swapping.
2. **`src/lib/qa.ts`** — set `ENDPOINT` to your own worker URL, printed by
   `wrangler deploy`.

Also change `name` in `wrangler.toml` (worker name) and, if you use the QA log,
create your own D1 database and update `database_id`.

## 6d. Analytics (optional)

The site can emit a Cloudflare Web Analytics beacon. It is off unless a token is
present, so by default the site makes no third-party script requests at all.

To enable it:

1. In the Cloudflare dashboard, open **Web Analytics**, add a site for
   `sabilmakbar.github.io`, and copy the **site token**.
2. Add it as a GitHub Actions secret named `CF_ANALYTICS_TOKEN`.

The next deploy picks it up. Locally you can preview it with:

```bash
CF_ANALYTICS_TOKEN=yourtoken npm run build
```

Same convention as the relo-calculator project: unset means no beacon. The token
is public by design, since it ships in the page and only identifies the site.
Cloudflare Web Analytics sets no cookies and does not track visitors across sites.

## 7. Secrets and configuration

- **GitHub Actions:** `GITHUB_TOKEN` is provided automatically by Actions; no
  setup needed. It only raises the GitHub API rate limit during the build.
- **Local dev:** optionally set `GITHUB_TOKEN` in your shell (step 3).
- **Cloudflare:** wrangler auth via `npx wrangler login` or `CLOUDFLARE_API_TOKEN`
  (step 2). To automate worker deploys in CI later, add `CLOUDFLARE_API_TOKEN` as
  a GitHub Actions secret and add a wrangler deploy step to the workflow.

---

## 8. Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `wrangler: command not found` | wrangler is not global. Run it from `profile-qa/worker` after `npm install`, via `npx wrangler deploy` or `npm run deploy`. |
| `node: command not found` | Node is not on your PATH. Install or activate Node 22+ (on the author's machine: `conda activate node`). |
| `Tsconfig not found` on `npx astro build` | You ran a stray global Astro. Use `npm run build` so the project's local Astro is used. |
| Empty personal-projects grid locally | GitHub API rate limit. Set `GITHUB_TOKEN` before `npm run dev`. |
| Chatbot answers with stale info | You edited `src/data` but did not re-index or redeploy. Run `npm run build:index`, then `npx wrangler deploy` in `profile-qa/worker`. |
| Chat widget fails locally ("couldn't reach the assistant") | Your dev origin is not in `ALLOWED_ORIGINS`. The worker allows `http://localhost:4321` (Astro's default port); if you run the dev server on another port, add that origin in `profile-qa/worker/wrangler.toml` and redeploy. |
| `build:index` fails on a TypeScript error | Ensure Node is 22.12+; older Node lacks `--experimental-strip-types`. |
