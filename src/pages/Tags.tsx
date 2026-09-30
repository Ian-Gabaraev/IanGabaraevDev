import { Link, useParams } from 'react-router';
import { findTag, getTags, getPostsByTag } from '../lib/posts';
import { PostCard } from '../components/PostCard';
import NotFound from './NotFound';

export function TagsIndex() {
  const tags = getTags();

  return (
    <div className="animate-rise pt-12 sm:pt-16">
      <header className="border-b border-[var(--border)] pb-6">
        <p className="label-mono">
          <span className="text-[var(--accent)]">~/</span> tags
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Topics</h1>
        <p className="mt-3 text-[0.9375rem] text-[var(--fg-muted)]">
          {tags.length} topic{tags.length === 1 ? '' : 's'} across the archive.
        </p>
      </header>

      <ul className="mt-8 grid gap-2 sm:grid-cols-2">
        {tags.map((tag) => (
          <li key={tag.slug}>
            <Link
              to={`/tags/${tag.slug}`}
              className="surface group flex items-center justify-between rounded-lg px-4 py-3 transition-colors hover:border-[var(--border-strong)]"
            >
              <span className="font-mono text-sm transition-colors group-hover:text-[var(--accent)]">{tag.tag}</span>
              <span className="font-mono text-xs text-[var(--fg-faint)]">{tag.count}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TagPage() {
  const { tag: tagSlug = '' } = useParams();
  const tag = findTag(tagSlug);

  if (!tag) return <NotFound />;

  const tagged = getPostsByTag(tagSlug);

  return (
    <div className="animate-rise pt-12 sm:pt-16">
      <header className="border-b border-[var(--border)] pb-6">
        <p className="label-mono">
          <Link to="/tags" className="transition-colors hover:text-[var(--accent)]">
            ~/tags
          </Link>
        </p>
        <h1 className="mt-4 font-mono text-3xl font-semibold tracking-tight sm:text-4xl">
          <span className="text-[var(--accent)]">#</span>
          {tag.tag}
        </h1>
        <p className="mt-3 text-[0.9375rem] text-[var(--fg-muted)]">
          {tag.count} article{tag.count === 1 ? '' : 's'}.
        </p>
      </header>

      <div className="mt-6">
        {tagged.map((post, index) => (
          <PostCard key={post.slug} post={post} index={index} />
        ))}
      </div>
    </div>
  );
}
