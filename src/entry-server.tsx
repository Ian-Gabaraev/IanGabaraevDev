import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router';
import App from './App';
import { PreloadContext, type Preload } from './lib/preload';
import { loadPostBody, posts, getTags } from './lib/posts';
import { resolveMeta, renderHeadTags } from './lib/seo';

export interface RenderResult {
  html: string;
  head: string;
  preload: Preload | null;
}

/** Renders one route to static HTML for the build-time prerenderer. */
export async function render(pathname: string): Promise<RenderResult> {
  let preload: Preload | null = null;

  if (pathname.startsWith('/blog/')) {
    const slug = pathname.slice('/blog/'.length);
    if (posts.some((post) => post.slug === slug)) {
      preload = { slug, html: await loadPostBody(slug) };
    }
  }

  const html = renderToString(
    <StrictMode>
      <PreloadContext.Provider value={preload}>
        <StaticRouter location={pathname}>
          <App />
        </StaticRouter>
      </PreloadContext.Provider>
    </StrictMode>,
  );

  return { html, head: renderHeadTags(resolveMeta(pathname)), preload };
}

/** Every path the prerenderer should emit as static HTML. */
export function routes(): string[] {
  return [
    '/',
    '/blog',
    '/tags',
    '/about',
    ...posts.map((post) => `/blog/${post.slug}`),
    ...getTags().map((tag) => `/tags/${tag.slug}`),
  ];
}

export { posts, getTags };
