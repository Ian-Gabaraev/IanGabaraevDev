import { useMemo, useState } from 'react';
import { posts, searchPosts } from '../lib/posts';
import { PostCard } from '../components/PostCard';
import { SearchIcon } from '../components/icons';

export default function Blog() {
  const [query, setQuery] = useState('');
  const results = useMemo(() => searchPosts(query), [query]);

  const years = useMemo(() => {
    const grouped = new Map<string, typeof results>();
    for (const post of results) {
      const year = post.date.slice(0, 4);
      grouped.set(year, [...(grouped.get(year) ?? []), post]);
    }
    return [...grouped.entries()];
  }, [results]);

  return (
    <div className="animate-rise pt-12 sm:pt-16">
      <header className="border-b border-[var(--border)] pb-6">
        <p className="label-mono">
          <span className="text-[var(--accent)]">~/</span> blog
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Writing</h1>
        <p className="mt-3 max-w-xl text-[0.9375rem] leading-relaxed text-[var(--fg-muted)]">
          {posts.length} article{posts.length === 1 ? '' : 's'} on engineering practice — architecture, performance,
          tooling and the things that break at 3am.
        </p>

        <div className="relative mt-6 max-w-sm">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--fg-faint)]" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter by title, topic or tag…"
            aria-label="Filter articles"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg-subtle)] py-2 pr-3 pl-9 text-sm text-[var(--fg)] placeholder:text-[var(--fg-faint)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
      </header>

      {results.length === 0 ? (
        <p className="py-16 text-sm text-[var(--fg-muted)]">
          Nothing matches <span className="font-mono text-[var(--fg)]">“{query}”</span>.
        </p>
      ) : (
        years.map(([year, group]) => (
          <section key={year} className="mt-12">
            <h2 className="label-mono mb-5">{year}</h2>
            <div>
              {group.map((post, index) => (
                <PostCard key={post.slug} post={post} index={index} />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
