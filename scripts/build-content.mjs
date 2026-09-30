import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import Shiki from '@shikijs/markdown-it';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(ROOT, 'content', 'posts');
const OUT_DIR = path.join(ROOT, 'src', 'content', 'generated');
const BODIES_DIR = path.join(OUT_DIR, 'bodies');

/** Turn "Some Title!" into "some-title". */
const slugify = (value) =>
  value
    .toString()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

async function createRenderer() {
  const md = MarkdownIt({ html: true, linkify: true, typographer: true, breaks: false });

  md.use(
    await Shiki({
      themes: { light: 'github-light', dark: 'github-dark-default' },
      defaultColor: false,
      fallbackLanguage: 'text',
    }),
  );

  md.use(anchor, {
    level: [2, 3, 4],
    slugify,
    permalink: anchor.permalink.linkInsideHeader({
      symbol: '#',
      placement: 'after',
      class: 'heading-anchor',
      ariaHidden: true,
    }),
  });

  // External links open in a new tab and never leak referrer-based trust.
  const defaultLinkOpen =
    md.renderer.rules.link_open ?? ((tokens, i, options, _env, self) => self.renderToken(tokens, i, options));
  md.renderer.rules.link_open = (tokens, i, options, env, self) => {
    const href = tokens[i].attrGet('href') ?? '';
    if (/^https?:\/\//.test(href)) {
      tokens[i].attrSet('target', '_blank');
      tokens[i].attrSet('rel', 'noopener noreferrer');
    }
    return defaultLinkOpen(tokens, i, options, env, self);
  };

  // Wrap every fenced block so the UI can render a language badge + copy button.
  const defaultFence = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, i, options, env, self) => {
    const lang = (tokens[i].info || 'text').trim().split(/\s+/)[0] || 'text';
    const rendered = defaultFence(tokens, i, options, env, self);
    return `<div class="code-block" data-lang="${md.utils.escapeHtml(lang)}">${rendered}</div>`;
  };

  return md;
}

function collectHeadings(markdown) {
  const headings = [];
  let inFence = false;
  for (const line of markdown.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^(#{2,4})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;
    const text = match[2].replace(/`/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
    headings.push({ depth: match[1].length, text, id: slugify(text) });
  }
  return headings;
}

function plainText(markdown) {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s{0,3}>\s?/gm, '')
    .replace(/[*_~]/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (/\.mdx?$/.test(entry.name)) files.push(full);
  }
  return files;
}

function assertValid(data, file) {
  const missing = ['title', 'date'].filter((key) => !data[key]);
  if (missing.length) {
    throw new Error(`[content] ${path.relative(ROOT, file)} is missing frontmatter: ${missing.join(', ')}`);
  }
  if (Number.isNaN(new Date(data.date).getTime())) {
    throw new Error(`[content] ${path.relative(ROOT, file)} has an invalid date: ${data.date}`);
  }
}

export async function buildContent({ silent = false, includeDrafts } = {}) {
  const withDrafts = includeDrafts ?? process.env.NODE_ENV !== 'production';
  const md = await createRenderer();
  const files = (await walk(POSTS_DIR)).sort();

  const posts = [];
  const bodies = new Map();
  const seen = new Set();

  for (const file of files) {
    const raw = await fs.readFile(file, 'utf8');
    const { data, content } = matter(raw);
    assertValid(data, file);

    const isDraft = data.draft === true;
    if (isDraft && !withDrafts) continue;

    const slug = slugify(data.slug ?? path.basename(file).replace(/\.mdx?$/, ''));
    if (seen.has(slug)) throw new Error(`[content] duplicate slug "${slug}" (${path.relative(ROOT, file)})`);
    seen.add(slug);

    const text = plainText(content);
    const words = text ? text.split(' ').length : 0;

    posts.push({
      slug,
      title: String(data.title),
      description: String(data.description ?? text.slice(0, 157).trim() + (text.length > 157 ? '…' : '')),
      date: new Date(data.date).toISOString(),
      updated: data.updated ? new Date(data.updated).toISOString() : null,
      tags: (Array.isArray(data.tags) ? data.tags : []).map((t) => String(t).trim()).filter(Boolean),
      draft: isDraft,
      cover: data.cover ? String(data.cover) : null,
      canonical: data.canonical ? String(data.canonical) : null,
      readingTime: Math.max(1, Math.round(words / 220)),
      words,
      headings: collectHeadings(content),
      source: path.relative(ROOT, file).split(path.sep).join('/'),
    });

    bodies.set(slug, md.render(content));
  }

  posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title));

  await fs.rm(OUT_DIR, { recursive: true, force: true });
  await fs.mkdir(BODIES_DIR, { recursive: true });

  const banner = '// AUTO-GENERATED by scripts/build-content.mjs — do not edit.\n';

  for (const [slug, html] of bodies) {
    await fs.writeFile(
      path.join(BODIES_DIR, `${slug}.ts`),
      `${banner}const html = ${JSON.stringify(html)};\nexport default html;\n`,
      'utf8',
    );
  }

  const loaders = [...bodies.keys()]
    .map((slug) => `  ${JSON.stringify(slug)}: () => import('./bodies/${slug}'),`)
    .join('\n');

  await fs.writeFile(
    path.join(OUT_DIR, 'index.ts'),
    `${banner}import type { Post } from '../types';\n\n` +
      `export const posts: Post[] = ${JSON.stringify(posts, null, 2)};\n\n` +
      `export const bodies: Record<string, () => Promise<{ default: string }>> = {\n${loaders}\n};\n`,
    'utf8',
  );

  if (!silent) {
    console.log(`[content] ${posts.length} post${posts.length === 1 ? '' : 's'} generated`);
  }
  return posts;
}

if (import.meta.url === url.pathToFileURL(process.argv[1] ?? '').href) {
  buildContent().catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  });
}
