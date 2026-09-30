import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import { build } from 'vite';

process.env.NODE_ENV = 'production';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SERVER_DIST = path.join(ROOT, '.ssr');

const site = JSON.parse(await fs.readFile(path.join(ROOT, 'site.config.json'), 'utf8'));
const ORIGIN = site.url.replace(/\/$/, '');

const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

async function writeFile(relativePath, contents) {
  const target = path.join(DIST, relativePath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, contents, 'utf8');
}

async function buildBundles() {
  console.log('▸ building client bundle');
  await build({ logLevel: 'warn' });

  console.log('▸ building server bundle');
  await build({
    logLevel: 'warn',
    build: {
      ssr: path.join(ROOT, 'src/entry-server.tsx'),
      outDir: SERVER_DIST,
      emptyOutDir: true,
      copyPublicDir: false,
    },
  });
}

function renderPage(template, { head, html }) {
  return template
    .replace('<!--app-head-->', head)
    .replace('<!--app-html-->', html)
    .replace('<!--app-preload-->', '');
}

function sitemap(routes, posts) {
  const lastmodFor = (route) => {
    if (route === '/blog' || route === '/') {
      return posts[0] ? (posts[0].updated ?? posts[0].date) : new Date().toISOString();
    }
    const post = posts.find((item) => `/blog/${item.slug}` === route);
    return post ? (post.updated ?? post.date) : null;
  };

  const priorityFor = (route) => {
    if (route === '/') return '1.0';
    if (route === '/blog') return '0.9';
    if (route.startsWith('/blog/')) return '0.8';
    return '0.5';
  };

  const entries = routes
    .map((route) => {
      const lastmod = lastmodFor(route);
      return [
        '  <url>',
        `    <loc>${escapeXml(ORIGIN + (route === '/' ? '/' : route))}</loc>`,
        lastmod ? `    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : '',
        `    <changefreq>${route.startsWith('/blog/') ? 'monthly' : 'weekly'}</changefreq>`,
        `    <priority>${priorityFor(route)}</priority>`,
        '  </url>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

function rss(posts, bodies) {
  const items = posts
    .map((post) => {
      const link = `${ORIGIN}/blog/${post.slug}`;
      const body = bodies.get(post.slug) ?? '';
      return [
        '    <item>',
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(link)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(link)}</guid>`,
        `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
        `      <description>${escapeXml(post.description)}</description>`,
        ...post.tags.map((tag) => `      <category>${escapeXml(tag)}</category>`),
        `      <content:encoded><![CDATA[${body.replace(/]]>/g, ']]&gt;')}]]></content:encoded>`,
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">',
    '  <channel>',
    `    <title>${escapeXml(site.title)}</title>`,
    `    <link>${escapeXml(ORIGIN)}</link>`,
    `    <description>${escapeXml(site.description)}</description>`,
    `    <language>${escapeXml(site.locale.replace('_', '-').toLowerCase())}</language>`,
    `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(`${ORIGIN}/rss.xml`)}" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

async function main() {
  const started = Date.now();
  await buildBundles();

  const { render, routes, posts } = await import(url.pathToFileURL(path.join(SERVER_DIST, 'entry-server.js')).href);
  const template = await fs.readFile(path.join(DIST, 'index.html'), 'utf8');

  const allRoutes = routes();
  const bodies = new Map();

  console.log(`▸ prerendering ${allRoutes.length} routes`);
  for (const route of allRoutes) {
    const result = await render(route);
    if (result.preload) bodies.set(result.preload.slug, result.preload.html);
    // Flat `.html` files (not `dir/index.html`) so Cloudflare Pages serves
    // `/blog/slug` directly instead of 308-redirecting to `/blog/slug/`.
    const target = route === '/' ? 'index.html' : `${route.slice(1)}.html`;
    await writeFile(target, renderPage(template, result));
  }

  // Cloudflare Pages serves this for any unmatched path.
  const notFound = await render('/this-path-does-not-exist');
  await writeFile('404.html', renderPage(template, notFound));

  await writeFile('sitemap.xml', sitemap(allRoutes, posts));
  await writeFile('rss.xml', rss(posts, bodies));
  await writeFile(
    'robots.txt',
    `User-agent: *\nAllow: /\n\nSitemap: ${ORIGIN}/sitemap.xml\n`,
  );

  await fs.rm(SERVER_DIST, { recursive: true, force: true });

  console.log(
    `✓ ${allRoutes.length + 1} pages, ${posts.length} posts, sitemap + RSS in ${((Date.now() - started) / 1000).toFixed(1)}s`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
