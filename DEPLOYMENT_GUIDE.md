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

## 5. Update content

All content lives in `src/data/`. Edit the relevant file, then regenerate the QA
index if you touched CV, profile, or publications.

| What changed | Edit | Then run |
| --- | --- | --- |
| Job / experience / education | `src/data/cv.ts` (and `profile.ts` if the current role changed) | `npm run build:index` |
| Publications | `src/data/publications.ts` | `npm run build:index` |
| Profile bio / links / tagline | `src/data/profile.ts` | `npm run build:index` |
| Featured repos | `FEATURED` in `src/pages/repositories.astro` | nothing |

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

### QA worker (manual)

```bash
cd profile-qa/worker
npx wrangler deploy      # or: npm run deploy
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
| `build:index` fails on a TypeScript error | Ensure Node is 22.12+; older Node lacks `--experimental-strip-types`. |
