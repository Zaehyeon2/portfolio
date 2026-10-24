import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { hasTechGroup } from './lib/tech';
import { TYPES } from './lib/project-type';

const ym = z.string().regex(/^\d{4}\.(0[1-9]|1[0-2])$/, 'YYYY.MM');

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    name: z.string().min(1),
    team: z.string().min(1),
    start: ym,
    end: ym.nullable(),
    type: z.enum(TYPES),
    contribution: z.number().min(0).max(1),
    summary: z.string().min(1),
    stack: z.array(z.string().min(1).refine(hasTechGroup, { message: 'src/lib/tech.ts 묶음에 없는 기술 태그' })),
    links: z.array(z.object({ label: z.string(), url: z.url() })).default([]),
  }),
});

export const collections = { projects };
