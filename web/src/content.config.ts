import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * The Education blog.
 *
 * Posts are plain markdown in src/content/blog/ — the filename is the URL slug,
 * so writing a guide is adding a file and nothing else. `tag` is optional and
 * free text rather than an enum: the taxonomy isn't settled yet, and locking it
 * down now would mean a schema change every time Lisa wants a new one.
 */
const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tag: z.string().optional(),
    /** Hide from the hub without deleting the file. */
    draft: z.boolean().optional(),
  }),
});

export const collections = { blog };
