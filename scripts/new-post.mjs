#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const POSTS_DIR = path.resolve(__dirname, '..', 'content', 'posts');

const title = process.argv.slice(2).join(' ').trim();
if (!title) {
  console.error('Usage: npm run new-post -- "Title Of The Article"');
  process.exit(1);
}

const slug = title
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const file = path.join(POSTS_DIR, `${slug}.md`);

try {
  await fs.access(file);
  console.error(`✗ ${path.relative(process.cwd(), file)} already exists`);
  process.exit(1);
} catch {
  /* the file does not exist, which is what we want */
}

const template = `---
title: ${JSON.stringify(title)}
description: 'One or two sentences. This is the search result and the social card.'
date: ${new Date().toISOString().slice(0, 10)}
tags: []
draft: true
---

Opening paragraph — state the problem before the solution.

## First section

Body text.

\`\`\`ts
const example = 'syntax highlighting works out of the box';
\`\`\`
`;

await fs.mkdir(POSTS_DIR, { recursive: true });
await fs.writeFile(file, template, 'utf8');

console.log(`✓ created content/posts/${slug}.md`);
console.log(`  preview at http://localhost:5173/blog/${slug}`);
console.log('  remove `draft: true` when it is ready to publish');
