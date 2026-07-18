import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string().optional(),
    date: z.coerce.date(),
    tag: z.string().optional(),
    draft: z.boolean().optional().default(false),
  }),
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    link: z.string().optional(), // absolute URL or site-relative path (e.g. /sp42-...html)
    draft: z.boolean().optional().default(false),
  }),
});

export const collections = { blog, news };
