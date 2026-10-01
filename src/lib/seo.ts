import { site, absoluteUrl } from './site';
import { findTag, getPost, posts } from './posts';

export interface PageMeta {
  title: string;
  /** Used verbatim in <title>; falls back to `${title} — ${site.title}`. */
  fullTitle: string;
  description: string;
  canonical: string;
  path: string;
  type: 'website' | 'article';
  image: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  noindex?: boolean;
  jsonLd: Record<string, unknown>[];
}

const DEFAULT_IMAGE = '/og/default.png';

function normalize(pathname: string): string {
  if (!pathname.startsWith('/')) pathname = `/${pathname}`;
  return pathname.length > 1 ? pathname.replace(/\/+$/, '') : '/';
}

function personSchema() {
  return {
    '@type': 'Person',
    '@id': `${site.url}/#person`,
    name: site.author.name,
    url: site.url,
    jobTitle: site.author.role,
    description:
      'Lead fullstack software engineer, scuba diver, photographer and former journalist, travelling full time since 2020.',
    knowsAbout: [
      'Software engineering',
      'Systems design',
      'Software architecture',
      'Distributed systems',
      'Concurrency',
      'Cloud architecture',
      'Serverless',
      'Infrastructure as code',
      'CI/CD',
      'Python',
      'TypeScript',
      'Elixir',
      'Real-time communication',
      'WebRTC',
      'VoIP',
      'Photography',
      'Scuba diving',
    ],
    // Every profile that represents the same person, so search engines can
    // consolidate them into a single entity.
    sameAs: [site.author.altSite, ...site.social.filter((s) => s.href.startsWith('http')).map((s) => s.href)].filter(
      (href, index, all) => all.indexOf(href) === index,
    ),
  };
}

function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${site.url}/#website`,
    url: site.url,
    name: site.title,
    description: site.description,
    inLanguage: site.locale.replace('_', '-'),
    publisher: personSchema(),
  };
}

function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

function base(path: string, overrides: Partial<PageMeta> & { title: string; description: string }): PageMeta {
  return {
    path,
    canonical: absoluteUrl(path),
    type: 'website',
    image: absoluteUrl(DEFAULT_IMAGE),
    jsonLd: [websiteSchema()],
    fullTitle: overrides.title === site.title ? `${site.title} — ${site.tagline}` : `${overrides.title} — ${site.title}`,
    ...overrides,
  };
}

/**
 * Single source of truth for per-route metadata. Consumed by the prerenderer
 * (to bake tags into static HTML) and by the client (to update on navigation).
 */
export function resolveMeta(pathname: string): PageMeta {
  const path = normalize(pathname);

  if (path === '/') {
    return base(path, {
      title: site.title,
      description: site.description,
      jsonLd: [
        websiteSchema(),
        {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          url: site.url,
          mainEntity: personSchema(),
        },
      ],
    });
  }

  if (path === '/blog') {
    return base(path, {
      title: 'Writing',
      description: `All articles by ${site.author.name} on fullstack engineering, systems design and developer tooling.`,
      jsonLd: [
        websiteSchema(),
        breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Writing', path: '/blog' },
        ]),
        {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Writing',
          url: absoluteUrl('/blog'),
          hasPart: posts.map((post) => ({
            '@type': 'BlogPosting',
            headline: post.title,
            url: absoluteUrl(`/blog/${post.slug}`),
            datePublished: post.date,
          })),
        },
      ],
    });
  }

  if (path === '/tags') {
    return base(path, {
      title: 'Tags',
      description: 'Browse articles by topic.',
      jsonLd: [
        websiteSchema(),
        breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Tags', path: '/tags' },
        ]),
      ],
    });
  }

  if (path === '/about') {
    return base(path, {
      title: 'About',
      description: `About ${site.author.name} — ${site.author.role}, scuba diver, photographer, former journalist, and six years a full-time traveller.`,
      jsonLd: [
        websiteSchema(),
        { '@context': 'https://schema.org', '@type': 'AboutPage', url: absoluteUrl('/about'), mainEntity: personSchema() },
      ],
    });
  }

  if (path.startsWith('/tags/')) {
    const tagSlug = path.slice('/tags/'.length);
    const tag = findTag(tagSlug);
    if (!tag) return notFoundMeta(path);
    return base(path, {
      title: `${tag.tag}`,
      fullTitle: `${tag.tag} — ${site.title}`,
      description: `${tag.count} article${tag.count === 1 ? '' : 's'} tagged “${tag.tag}”.`,
      jsonLd: [
        websiteSchema(),
        breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Tags', path: '/tags' },
          { name: tag.tag, path },
        ]),
      ],
    });
  }

  if (path.startsWith('/blog/')) {
    const post = getPost(path.slice('/blog/'.length));
    if (!post) return notFoundMeta(path);
    return {
      path,
      title: post.title,
      fullTitle: `${post.title} — ${site.title}`,
      description: post.description,
      canonical: post.canonical ?? absoluteUrl(path),
      type: 'article',
      image: absoluteUrl(post.cover ?? DEFAULT_IMAGE),
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      tags: post.tags,
      noindex: post.draft,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.description,
          url: absoluteUrl(path),
          mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(path) },
          datePublished: post.date,
          dateModified: post.updated ?? post.date,
          keywords: post.tags.join(', '),
          wordCount: post.words,
          inLanguage: site.locale.replace('_', '-'),
          image: absoluteUrl(post.cover ?? DEFAULT_IMAGE),
          author: personSchema(),
          publisher: personSchema(),
          isPartOf: { '@id': `${site.url}/#website` },
        },
        breadcrumbSchema([
          { name: 'Home', path: '/' },
          { name: 'Writing', path: '/blog' },
          { name: post.title, path },
        ]),
      ],
    };
  }

  return notFoundMeta(path);
}

function notFoundMeta(path: string): PageMeta {
  return base(path, {
    title: '404',
    description: 'This page could not be found.',
    noindex: true,
    jsonLd: [],
  });
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Serialises page metadata into the <head> markup used by the prerenderer. */
export function renderHeadTags(meta: PageMeta): string {
  const tags: string[] = [
    `<title>${escapeHtml(meta.fullTitle)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}" />`,
    meta.noindex
      ? '<meta name="robots" content="noindex, nofollow" />'
      : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />',
    `<meta property="og:site_name" content="${escapeHtml(site.title)}" />`,
    `<meta property="og:locale" content="${escapeHtml(site.locale)}" />`,
    `<meta property="og:type" content="${meta.type}" />`,
    `<meta property="og:title" content="${escapeHtml(meta.fullTitle)}" />`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}" />`,
    `<meta property="og:image" content="${escapeHtml(meta.image)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${escapeHtml(meta.fullTitle)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />`,
    `<meta name="author" content="${escapeHtml(site.author.name)}" />`,
  ];

  if (meta.type === 'article') {
    if (meta.publishedTime) tags.push(`<meta property="article:published_time" content="${meta.publishedTime}" />`);
    if (meta.modifiedTime) tags.push(`<meta property="article:modified_time" content="${meta.modifiedTime}" />`);
    tags.push(`<meta property="article:author" content="${escapeHtml(site.author.name)}" />`);
    for (const tag of meta.tags ?? []) tags.push(`<meta property="article:tag" content="${escapeHtml(tag)}" />`);
  }

  for (const schema of meta.jsonLd) {
    tags.push(
      `<script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`,
    );
  }

  return tags.join('\n    ');
}
