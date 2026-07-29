# sabilmakbar.github.io

Personal website of Salsabil (Sabil) Maulana Akbar, a Data Scientist working on
Search, NLP, and information retrieval. Live at
[sabilmakbar.github.io](https://sabilmakbar.github.io).

It covers his background, publications, open-source work, resume, and teaching.

## Notable bits (feel free to take inspiration)

A couple of pieces here might be useful if you're building your own site:

- **Auto-updating repositories page.** It fetches GitHub data at build time, and a
  weekly scheduled workflow keeps it fresh, so featured repos and stars stay current
  with no manual edits. See `src/pages/repositories.astro` and `.github/workflows/`.
- **Profile chat assistant.** The floating widget answers questions about the profile
  using a small, fully open-source RAG engine (hybrid retrieval plus an open LLM)
  that runs free on Cloudflare Workers AI. The engine lives in `profile-qa/`.

## Stack

Astro + Tailwind CSS, deployed to GitHub Pages via GitHub Actions. Content lives as
data in `src/data/`, so updating the site is mostly editing data rather than markup.

Fork and adapt it for your own site.
