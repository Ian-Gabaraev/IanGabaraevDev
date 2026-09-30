import { createContext, useContext, useEffect, useState } from 'react';
import { loadPostBody } from './posts';

export interface Preload {
  slug: string;
  html: string;
}

export const PreloadContext = createContext<Preload | null>(null);

/**
 * Recovers the article body from the prerendered markup instead of shipping a
 * second copy in a JSON script tag. React never re-diffs the children of a
 * `dangerouslySetInnerHTML` node, so reusing the server DOM is hydration-safe.
 */
export function readPreload(): Preload | null {
  if (typeof document === 'undefined') return null;
  const match = /^\/blog\/([^/]+)\/?$/.exec(window.location.pathname);
  if (!match) return null;
  const body = document.querySelector('#root .prose');
  if (!body) return null;
  return { slug: decodeURIComponent(match[1]), html: body.innerHTML };
}

/**
 * Returns a post's HTML body. Uses the preloaded body on first render so
 * hydration matches the static markup, and lazily imports the chunk on
 * client-side navigation.
 */
export function usePostBody(slug: string): string | null {
  const preloaded = useContext(PreloadContext);
  const [state, setState] = useState<Preload | null>(preloaded?.slug === slug ? preloaded : null);

  useEffect(() => {
    if (state?.slug === slug) return;
    let cancelled = false;
    loadPostBody(slug)
      .then((html) => {
        if (!cancelled) setState({ slug, html });
      })
      .catch(() => {
        if (!cancelled) setState({ slug, html: '<p>This article failed to load. Please refresh the page.</p>' });
      });
    return () => {
      cancelled = true;
    };
  }, [slug, state?.slug]);

  return state?.slug === slug ? state.html : null;
}
