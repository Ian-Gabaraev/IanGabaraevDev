import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { site } from '../lib/site';
import { cx } from '../lib/format';
import { ThemeToggle } from './ThemeToggle';
import { CloseIcon, MenuIcon } from './icons';

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <header
      className={cx(
        'sticky top-0 z-50 border-b transition-colors duration-300',
        scrolled
          ? 'border-[var(--border)] bg-[color-mix(in_oklch,var(--bg)_82%,transparent)] backdrop-blur-xl'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link
          to="/"
          className="font-mono text-sm font-medium tracking-tight text-[var(--fg)] transition-opacity hover:opacity-70"
        >
          iangabaraev<span className="text-[var(--accent)]">.dev</span>
        </Link>

        <div className="flex items-center gap-1">
          <nav aria-label="Primary" className="hidden sm:flex sm:items-center sm:gap-1">
            {site.nav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) =>
                  cx(
                    'rounded-md px-3 py-1.5 text-sm transition-colors',
                    isActive
                      ? 'text-[var(--fg)]'
                      : 'text-[var(--fg-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <ThemeToggle />

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="grid size-9 place-items-center rounded-md text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)] sm:hidden"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-[var(--border)] bg-[var(--bg)] px-5 py-3 sm:hidden"
        >
          {site.nav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                cx(
                  'block rounded-md px-3 py-2.5 text-sm transition-colors',
                  isActive ? 'text-[var(--accent)]' : 'text-[var(--fg-muted)] hover:text-[var(--fg)]',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
