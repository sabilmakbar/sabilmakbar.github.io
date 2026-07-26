# sabilmakbar.github.io

Personal site of Salsabil Maulana Akbar, built with [Astro](https://astro.build)
+ Tailwind CSS. Deployed to GitHub Pages via GitHub Actions (`.github/workflows/deploy.yml`).

## Develop

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
```

## Structure

- `src/pages/` — routes (about, publications, repositories, cv, teaching)
- `src/data/` — content as data (profile, cv, publications, repos)
- `src/components/` — layout, cards, chat widget
- `public/` — static assets

The **Repositories** page auto-fetches GitHub data at build time (the weekly
scheduled workflow keeps it fresh). The floating chat widget is powered by a
separate open-source RAG engine on Cloudflare Workers AI.

> The previous al-folio (Jekyll) version is preserved on the `al-folio-backup` branch.
