import { useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { resolveMeta } from './lib/seo';
import Home from './pages/Home';
import Blog from './pages/Blog';
import PostPage from './pages/Post';
import About from './pages/About';
import NotFound from './pages/NotFound';
import { TagPage, TagsIndex } from './pages/Tags';

function setMeta(selector: string, attr: 'content' | 'href', value: string) {
  document.head.querySelector(selector)?.setAttribute(attr, value);
}

/**
 * Keeps <head> accurate during client-side navigation. The first paint is
 * already correct because the prerenderer bakes these tags into the HTML.
 */
function useRouteEffects() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const meta = resolveMeta(pathname);
    document.title = meta.fullTitle;
    setMeta('meta[name="description"]', 'content', meta.description);
    setMeta('link[rel="canonical"]', 'href', meta.canonical);
    setMeta('meta[property="og:title"]', 'content', meta.fullTitle);
    setMeta('meta[property="og:description"]', 'content', meta.description);
    setMeta('meta[property="og:url"]', 'content', meta.canonical);
    setMeta('meta[property="og:type"]', 'content', meta.type);
    setMeta('meta[property="og:image"]', 'content', meta.image);
    setMeta('meta[name="twitter:title"]', 'content', meta.fullTitle);
    setMeta('meta[name="twitter:description"]', 'content', meta.description);
    setMeta('meta[name="twitter:image"]', 'content', meta.image);
  }, [pathname]);

  useEffect(() => {
    if (hash) {
      document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);
}

export default function App() {
  useRouteEffects();

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-100 focus:rounded-md focus:bg-[var(--fg)] focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--bg)]"
      >
        Skip to content
      </a>

      <Header />

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-5 pb-16 sm:px-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<PostPage />} />
          <Route path="/tags" element={<TagsIndex />} />
          <Route path="/tags/:tag" element={<TagPage />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
