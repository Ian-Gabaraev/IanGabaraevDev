export interface Heading {
  depth: number;
  text: string;
  id: string;
}

export interface Post {
  slug: string;
  title: string;
  description: string;
  /** ISO 8601 */
  date: string;
  /** ISO 8601, when the post was last revised */
  updated: string | null;
  tags: string[];
  draft: boolean;
  cover: string | null;
  canonical: string | null;
  /** Estimated minutes to read */
  readingTime: number;
  words: number;
  headings: Heading[];
  /** Path to the source markdown, relative to the repo root */
  source: string;
}
