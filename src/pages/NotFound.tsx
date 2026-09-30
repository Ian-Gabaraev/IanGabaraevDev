import { Link } from 'react-router';

export default function NotFound() {
  return (
    <div className="animate-rise flex min-h-[55vh] flex-col justify-center py-20">
      <p className="label-mono">Error</p>
      <h1 className="mt-4 font-mono text-5xl font-semibold tracking-tight sm:text-6xl">
        404<span aria-hidden className="caret ml-2" />
      </h1>
      <p className="mt-5 max-w-md text-[0.9375rem] leading-relaxed text-[var(--fg-muted)]">
        That path doesn't resolve. The page may have been renamed, or the link that brought you here was wrong.
      </p>
      <div className="mt-8 flex flex-wrap gap-4 font-mono text-xs">
        <Link to="/" className="text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]">
          cd ~ →
        </Link>
        <Link to="/blog" className="text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]">
          ls ~/blog →
        </Link>
      </div>
    </div>
  );
}
