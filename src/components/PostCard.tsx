import { Link } from 'react-router';
import type { Post } from '../lib/posts';
import { slugifyTag } from '../lib/posts';
import { formatDateShort, isoDate } from '../lib/format';

export function TagPill({ tag, interactive = true }: { tag: string; interactive?: boolean }) {
  const className =
    'inline-flex items-center rounded-full border border-[var(--border)] px-2.5 py-0.5 font-mono text-[11px] text-[var(--fg-muted)] transition-colors';

  if (!interactive) return <span className={className}>{tag}</span>;

  return (
    <Link
      to={`/tags/${slugifyTag(tag)}`}
      className={`${className} hover:border-[var(--accent)] hover:text-[var(--accent)]`}
    >
      {tag}
    </Link>
  );
}

export function PostCard({ post, index = 0 }: { post: Post; index?: number }) {
  return (
    <article
      className="group relative border-b border-[var(--border)] py-7 first:pt-0 last:border-b-0"
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <time dateTime={isoDate(post.date)} className="label-mono">
          {formatDateShort(post.date)}
        </time>
        <span aria-hidden className="text-[var(--border-strong)]">
          /
        </span>
        <span className="label-mono">{post.readingTime} min</span>
        {post.draft && (
          <span className="rounded-sm bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-[var(--accent)] uppercase">
            draft
          </span>
        )}
      </div>

      <h3 className="mt-2.5 text-xl font-semibold tracking-tight">
        <Link
          to={`/blog/${post.slug}`}
          className="transition-colors before:absolute before:inset-0 before:content-[''] group-hover:text-[var(--accent)]"
        >
          {post.title}
        </Link>
      </h3>

      <p className="mt-2 max-w-2xl text-[0.9375rem] leading-relaxed text-[var(--fg-muted)]">{post.description}</p>

      {post.tags.length > 0 && (
        <div className="relative z-10 mt-3.5 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <TagPill key={tag} tag={tag} />
          ))}
        </div>
      )}
    </article>
  );
}
