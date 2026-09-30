import type { Post } from '../src/content/types';

export declare function buildContent(options?: {
  silent?: boolean;
  includeDrafts?: boolean;
}): Promise<Post[]>;
