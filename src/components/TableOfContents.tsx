import { useEffect, useState } from 'react';
import type { Heading } from '../lib/posts';
import { cx } from '../lib/format';

/** Sticky in-article navigation with scroll spy. */
export function TableOfContents({ headings }: { headings: Heading[] }) {
  const items = headings.filter((heading) => heading.depth <= 3);
  const [active, setActive] = useState<string>(items[0]?.id ?? '');

  useEffect(() => {
    if (!items.length) return;

    const elements = items.map((item) => document.getElementById(item.id)).filter((el): el is HTMLElement => !!el);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-80px 0px -70% 0px', threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((item) => item.id).join('|')]);

  if (items.length < 2) return null;

  return (
    <nav aria-label="Table of contents" className="sticky top-24">
      <p className="label-mono mb-3">On this page</p>
      <ul className="space-y-0.5 border-l border-[var(--border)]">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              aria-current={active === item.id ? 'true' : undefined}
              className={cx(
                '-ml-px block border-l py-1 text-[13px] leading-snug transition-colors',
                item.depth === 3 ? 'pl-6' : 'pl-3.5',
                active === item.id
                  ? 'border-[var(--accent)] text-[var(--fg)]'
                  : 'border-transparent text-[var(--fg-muted)] hover:text-[var(--fg)]',
              )}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Thin progress bar pinned under the header. */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-60 h-px bg-transparent">
      <div
        className="h-px origin-left bg-[var(--accent)] transition-transform duration-150 ease-out"
        style={{ transform: `scaleX(${progress})` }}
      />
    </div>
  );
}
