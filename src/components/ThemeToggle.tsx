import { MoonIcon, SunIcon } from './icons';

/**
 * The rendered icon is driven entirely by the `dark` class on <html>, which the
 * inline script in index.html sets before first paint. Keeping this component
 * stateless means the server and client markup always agree, so there is no
 * hydration mismatch and no icon flash for visitors who prefer light mode.
 */
export function ThemeToggle() {
  const toggle = () => {
    const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage can be unavailable in private mode */
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle colour theme"
      title="Toggle colour theme"
      className="grid size-9 place-items-center rounded-md text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--fg)]"
    >
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="block dark:hidden" />
    </button>
  );
}
