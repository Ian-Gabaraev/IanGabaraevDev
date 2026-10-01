# iangabaraev.dev

Personal engineering blog. Markdown in, static HTML out, served from Cloudflare's edge.

- **React 19 + TypeScript + Tailwind v4**, bundled by Vite.
- **Fully prerendered** — every route is written to disk as real HTML at build time, then hydrated. Crawlers get complete markup with no JavaScript execution required.
- **Markdown → HTML at build time**, with Shiki syntax highlighting (dual light/dark themes), heading anchors and a generated table of contents.
- **SEO built in** — per-route `<title>`, description, canonical, Open Graph, Twitter cards, JSON-LD (`BlogPosting`, `BreadcrumbList`, `WebSite`, `Person`), plus a generated `sitemap.xml`, `rss.xml` and `robots.txt`.

---

## Writing a post

```bash
npm run new-post -- "How Connection Pools Actually Fail"
```

That scaffolds `content/posts/how-connection-pools-actually-fail.md`. Write, then:

```bash
git add . && git commit -m "post: connection pools" && git push
```

Cloudflare builds and deploys automatically. The post appears at
`/blog/how-connection-pools-actually-fail`, and the sitemap, RSS feed, tag pages
and "related posts" links all update on their own.

### Frontmatter

```yaml
---
title: 'How Connection Pools Actually Fail' # required
description: 'Shown in search results and social cards.' # optional, auto-derived
date: 2026-04-02 # required
updated: 2026-04-09 # optional
tags: ['PostgreSQL', 'Reliability'] # optional
slug: custom-url-segment # optional, defaults to the filename
cover: /og/pools.png # optional, overrides the social image
canonical: https://elsewhere.com/post # optional, if published elsewhere first
draft: true # optional, hidden from production builds
---
```

`draft: true` posts are visible in `npm run dev` and excluded from the production
build, so they never reach the sitemap, the feed or Google.

### What markdown gives you

Fenced code blocks are highlighted by Shiki at build time — no highlighting
library ships to the browser — and get a language badge and a copy button.
`##`/`###` headings become anchor links and populate the table of contents.
External links automatically get `target="_blank"` and `rel="noopener noreferrer"`.
Tables, blockquotes, footnote-style lists and inline HTML all work.

---

## Local development

```bash
npm install
npm run dev        # http://localhost:5173, hot-reloads on markdown changes
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server; regenerates content when markdown changes |
| `npm run build` | Full production build + prerender into `dist/` |
| `npm run preview` | Serve `dist/` through the real Workers runtime |
| `npm run typecheck` | TypeScript, no emit |
| `npm run new-post -- "Title"` | Scaffold a new article |
| `npm run deploy` | Build and deploy straight to Cloudflare |

Use `npm run preview` rather than a plain static server — it uses Wrangler, so
routing, headers and the 404 page behave exactly as they will in production.

---

## Deploying to Cloudflare

The site runs as a **Worker with static assets** (`wrangler.jsonc`), which is
Cloudflare's current replacement for Pages. The Worker is named `iangabaraevdev`
and `iangabaraev.dev` is attached to it as a custom domain.

### Push-to-deploy (Workers Builds)

**Dashboard → Workers & Pages → `iangabaraevdev` → Settings → Build → Connect**,
and pick this repository. Build settings:

- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Root directory: `/`

Node 22 is picked up from `.node-version`. After that, every push to `main`
deploys to production.

`dist/` is gitignored, so it has to be built in CI. As a safety net,
`wrangler.jsonc` declares a `build.command`, which means `wrangler deploy`
builds the site itself even if the CI build command is left blank.

### Deploying from your machine

```bash
npx wrangler login
npm run deploy
```

### After a deploy

- Submit `https://iangabaraev.dev/sitemap.xml` in Google Search Console.
- Confirm `https://iangabaraev.dev/robots.txt` and `/rss.xml` resolve.

---

## How it works

```
content/posts/*.md
        │
        │  scripts/build-content.mjs   (gray-matter + markdown-it + Shiki)
        ▼
src/content/generated/            ← typed ESM, one lazy chunk per article
        │
        │  vite build  ×2          (browser bundle + SSR bundle)
        ▼
scripts/prerender.mjs             ← renderToString for every route
        │
        ▼
dist/  index.html, blog/*.html, tags/*.html, 404.html,
       sitemap.xml, rss.xml, robots.txt, assets/*
```

A few decisions worth knowing about if you change things:

**Routes are flat `.html` files, not `dir/index.html`.** A directory index makes
Cloudflare 308-redirect `/blog` to `/blog/`. Flat files plus
`html_handling: "auto-trailing-slash"` keep URLs trailing-slash-free and matching
the canonical tags, and redirect `/blog.html` to `/blog`.

**Don't set `Content-Type` in `public/_headers`.** Workers static assets derive
it from the file extension and *append* whatever `_headers` adds, so setting it
manually produces a duplicated, malformed header.

**Article bodies are recovered from the DOM on hydration**, not shipped twice in
a JSON blob. React never re-diffs the children of a `dangerouslySetInnerHTML`
node, so reusing the server-rendered markup is safe and roughly halves the size
of an article page.

**The theme toggle is stateless.** An inline script in `index.html` sets the
`dark` class before first paint, and the icon is chosen by CSS. Nothing about
the toggle can cause a hydration mismatch or a flash of the wrong theme.

**`src/lib/seo.ts` is the single source of truth for metadata.** The
prerenderer uses it to bake tags into static HTML; the client uses it to update
`<head>` during navigation. Add a route there and in `src/App.tsx`, and it
automatically lands in the sitemap.

---

## Configuration

Site-wide settings — title, tagline, URL, author, navigation, social links —
live in [`site.config.json`](./site.config.json). Nothing else is hardcoded.

The colour system is defined once in `src/styles.css` as CSS custom properties
under `:root` and `.dark`. Change `--accent` there and the whole site follows.

<!-- build trigger check -->
