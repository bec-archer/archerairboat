import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const tours = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './content/tours' }),
  schema: z.object({
    name: z.string(),
    durationMinutes: z.number().int().positive(),
    priceNote: z.string().optional(),
    maxGuests: z.number().int().positive(),
    active: z.boolean().default(true),
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.mdoc', base: './content/testimonials' }),
  schema: z.object({
    author: z.string(),
    source: z.string().optional(),
  }),
});

export const collections = { tours, testimonials };
