import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Blog / technical write-ups. Markdown files live in src/content/blog/.
const blog = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    repo: z.string().optional(), // "owner/name" of the repo this post is about
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
