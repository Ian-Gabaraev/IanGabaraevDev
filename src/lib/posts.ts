import { posts as allPosts, bodies } from '../content/generated';
import type { Post } from '../content/types';

export type { Post, Heading } from '../content/types';

/** Every post, newest first. Drafts are excluded from production builds. */
export const posts: Post[] = allPosts;

export function getPost(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

/** Loads a post's pre-rendered HTML body. Each body is its own lazy chunk. */
export async function loadPostBody(slug: string): Promise<string> {
  const loader = bodies[slug];
  if (!loader) throw new Error(`Unknown post: ${slug}`);
  return (await loader()).default;
}

export function slugifyTag(tag: string): string {
  return tag
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface TagSummary {
  tag: string;
  slug: string;
  count: number;
}

/** All tags, ordered by frequency then alphabetically. */
export function getTags(): TagSummary[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, slug: slugifyTag(tag), count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export function getPostsByTag(tagSlug: string): Post[] {
  return posts.filter((post) => post.tags.some((tag) => slugifyTag(tag) === tagSlug));
}

export function findTag(tagSlug: string): TagSummary | undefined {
  return getTags().find((tag) => tag.slug === tagSlug);
}

/** Chronological neighbours for prev/next navigation. */
export function getAdjacent(slug: string): { previous: Post | null; next: Post | null } {
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return { previous: null, next: null };
  return {
    previous: posts[index + 1] ?? null,
    next: posts[index - 1] ?? null,
  };
}

/** Posts sharing the most tags with the given post. */
export function getRelated(slug: string, limit = 3): Post[] {
  const current = getPost(slug);
  if (!current) return [];
  return posts
    .filter((post) => post.slug !== slug)
    .map((post) => ({
      post,
      score: post.tags.filter((tag) => current.tags.includes(tag)).length,
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date))
    .slice(0, limit)
    .map((entry) => entry.post);
}

/** Case-insensitive match across title, description and tags. */
export function searchPosts(query: string, source: Post[] = posts): Post[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return source;
  return source.filter((post) => {
    const haystack = `${post.title} ${post.description} ${post.tags.join(' ')}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}
