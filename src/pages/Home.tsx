import { Link } from 'react-router';
import { posts, getTags } from '../lib/posts';
import { site } from '../lib/site';
import { PostCard } from '../components/PostCard';
import { ArrowRightIcon } from '../components/icons';

export default function Home() {
  const latest = posts.slice(0, 5);
  const tags = getTags().slice(0, 8);

  return (
    <>
      <section className="relative">
        <div aria-hidden className="grid-backdrop pointer-events-none absolute inset-x-0 -top-16 h-96 opacity-60" />

        <div className="relative animate-rise pt-16 pb-4 sm:pt-24">
          <p className="label-mono">
            <span className="text-[var(--accent)]">~/</span> software engineer
          </p>

          <h1 className="mt-5 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
            {site.author.name}
            <span aria-hidden className="caret ml-1.5" />
          </h1>

          <p className="mt-5 max-w-xl text-base leading-relaxed text-[var(--fg-muted)] sm:text-lg">{site.tagline}</p>

          <p className="mt-4 max-w-2xl text-[0.9375rem] leading-relaxed text-[var(--fg-muted)]">
            I build and break backend systems for a living. This is where I write down what I learn — architecture
            decisions, performance work, and the details that only show up in production.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/blog"
              className="group inline-flex items-center gap-2 rounded-md bg-[var(--fg)] px-4 py-2.5 text-sm font-medium text-[var(--bg)] transition-opacity hover:opacity-85"
            >
              Read the writing
              <ArrowRightIcon className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--fg-muted)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--fg)]"
            >
              About me
            </Link>
          </div>
        </div>
      </section>

      {tags.length > 0 && (
        <section className="mt-16 border-t border-[var(--border)] pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="label-mono mr-1">Topics</span>
            {tags.map((tag) => (
              <Link
                key={tag.slug}
                to={`/tags/${tag.slug}`}
                className="font-mono text-xs text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
              >
                {tag.tag}
                <span className="ml-1 text-[var(--fg-faint)]">{tag.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-14">
        <div className="flex items-baseline justify-between gap-4 border-b border-[var(--border)] pb-4">
          <h2 className="text-sm font-semibold tracking-tight">Latest</h2>
          <Link
            to="/blog"
            className="font-mono text-xs text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
          >
            all posts →
          </Link>
        </div>

        {latest.length === 0 ? (
          <p className="py-12 text-sm text-[var(--fg-muted)]">
            No posts yet. Drop a markdown file in <code className="font-mono">content/posts/</code> to get started.
          </p>
        ) : (
          <div className="mt-2">
            {latest.map((post, index) => (
              <PostCard key={post.slug} post={post} index={index} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
