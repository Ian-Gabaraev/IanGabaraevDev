import { Link } from 'react-router';
import { site } from '../lib/site';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="space-y-1.5">
          <p className="font-mono text-sm text-[var(--fg)]">
            <span className="text-[var(--accent)]">$</span> {site.author.name}
          </p>
          <p className="text-xs text-[var(--fg-faint)]">
            © {__BUILD_YEAR__} · Built with React, Tailwind and markdown. Deployed on Cloudflare.
          </p>
        </div>

        <nav aria-label="Elsewhere" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {site.social.map((item) =>
            item.href.startsWith('http') ? (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer me"
                className="text-xs text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
              >
                {item.label}
              </a>
            ) : (
              <a
                key={item.href}
                href={item.href}
                className="text-xs text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
              >
                {item.label}
              </a>
            ),
          )}
          <Link
            to="/sitemap.xml"
            reloadDocument
            className="text-xs text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
          >
            Sitemap
          </Link>
        </nav>
      </div>
    </footer>
  );
}
