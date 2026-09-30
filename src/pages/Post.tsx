import { Link, useParams } from 'react-router';
import { getAdjacent, getPost, getRelated } from '../lib/posts';
import { usePostBody } from '../lib/preload';
import { formatDate, isoDate } from '../lib/format';
import { Prose } from '../components/Prose';
import { ReadingProgress, TableOfContents } from '../components/TableOfContents';
import { TagPill } from '../components/PostCard';
import { ArrowLeftIcon } from '../components/icons';
import NotFound from './NotFound';

const REPO = 'https://github.com/Ian-Gabaraev/IanGabaraevDev';

export default function PostPage() {
  const { slug = '' } = useParams();
  const post = getPost(slug);
  const html = usePostBody(post ? slug : '');

  if (!post) return <NotFound />;

  const { previous, next } = getAdjacent(slug);
  const related = getRelated(slug);

  return (
    <>
      <ReadingProgress />

      <div className="animate-rise pt-10 sm:pt-14">
        <Link
          to="/blog"
          className="group inline-flex items-center gap-1.5 font-mono text-xs text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
        >
          <ArrowLeftIcon width={13} height={13} className="transition-transform group-hover:-translate-x-0.5" />
          writing
        </Link>

        <header className="mt-6 border-b border-[var(--border)] pb-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <time dateTime={isoDate(post.date)} className="label-mono">
              {formatDate(post.date)}
            </time>
            <span aria-hidden className="text-[var(--border-strong)]">
              /
            </span>
            <span className="label-mono">{post.readingTime} min read</span>
            {post.draft && (
              <span className="rounded-sm bg-[var(--accent-soft)] px-1.5 py-0.5 font-mono text-[10px] tracking-widest text-[var(--accent)] uppercase">
                draft
              </span>
            )}
          </div>

          <h1 className="mt-4 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{post.title}</h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[var(--fg-muted)]">{post.description}</p>

          {post.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <TagPill key={tag} tag={tag} />
              ))}
            </div>
          )}
        </header>
      </div>

      <div className="gap-12 lg:grid lg:grid-cols-[minmax(0,1fr)_14rem]">
        <article className="min-w-0 max-w-[44rem] pt-10">
          {html === null ? (
            <div aria-busy="true" className="space-y-4">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="h-4 animate-pulse rounded bg-[var(--bg-subtle)]"
                  style={{ width: `${[100, 94, 97, 68, 100, 88][index]}%` }}
                />
              ))}
            </div>
          ) : (
            <Prose html={html} />
          )}

          {post.updated && (
            <p className="mt-12 border-t border-[var(--border)] pt-4 font-mono text-xs text-[var(--fg-faint)]">
              Last updated {formatDate(post.updated)}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-[var(--fg-muted)]">
            <a
              href={`${REPO}/blob/main/${post.source}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--accent)]"
            >
              view source →
            </a>
            <a
              href={`${REPO}/edit/main/${post.source}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-[var(--accent)]"
            >
              suggest an edit →
            </a>
          </div>

          {(previous || next) && (
            <nav aria-label="Adjacent posts" className="mt-12 grid gap-3 border-t border-[var(--border)] pt-8 sm:grid-cols-2">
              {next ? (
                <Link
                  to={`/blog/${next.slug}`}
                  className="surface group rounded-lg p-4 transition-colors hover:border-[var(--border-strong)]"
                >
                  <span className="label-mono">← Newer</span>
                  <span className="mt-2 block text-sm font-medium transition-colors group-hover:text-[var(--accent)]">
                    {next.title}
                  </span>
                </Link>
              ) : (
                <span />
              )}
              {previous && (
                <Link
                  to={`/blog/${previous.slug}`}
                  className="surface group rounded-lg p-4 text-right transition-colors hover:border-[var(--border-strong)] sm:col-start-2"
                >
                  <span className="label-mono">Older →</span>
                  <span className="mt-2 block text-sm font-medium transition-colors group-hover:text-[var(--accent)]">
                    {previous.title}
                  </span>
                </Link>
              )}
            </nav>
          )}

          {related.length > 0 && (
            <section className="mt-12">
              <h2 className="label-mono mb-3">Related</h2>
              <ul className="space-y-2">
                {related.map((item) => (
                  <li key={item.slug}>
                    <Link
                      to={`/blog/${item.slug}`}
                      className="text-sm text-[var(--fg-muted)] transition-colors hover:text-[var(--accent)]"
                    >
                      {item.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>

        <aside className="hidden pt-10 lg:block">
          <TableOfContents headings={post.headings} />
        </aside>
      </div>
    </>
  );
}
