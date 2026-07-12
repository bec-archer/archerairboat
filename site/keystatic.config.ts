import { config, fields, collection, singleton } from '@keystatic/core';

// Local mode: content lives in this repo, edited via /keystatic in dev.
// (Elise-friendly hosted editing is a later decision — see dev docs.)
export default config({
  storage: { kind: 'local' },

  singletons: {
    site: singleton({
      label: 'Site Settings',
      path: 'content/site',
      format: { data: 'yaml' },
      schema: {
        title: fields.text({ label: 'Site title', defaultValue: 'Archer Airboat Tours' }),
        tagline: fields.text({
          label: 'Tagline',
          multiline: true,
          description: 'Hero tagline. Keep it coastal: Matlacha, mangroves, dolphins. Not gators.',
        }),
        phone: fields.text({ label: 'Phone', defaultValue: '(239) 633-6645' }),
        launchLocation: fields.text({
          label: 'Launch location',
          defaultValue: 'Matlacha, FL — near D&D Bait & Tackle, 3922 Pine Island Rd NW',
        }),
        youtubeUrl: fields.url({
          label: 'Promo video (YouTube)',
          description: 'Placeholder: Bobby\'s 2012 overview clip. Swap for the new drone/GoPro hero cut.',
        }),
      },
    }),
  },

  collections: {
    // Schema only — DO NOT invent entries. Real tour names, durations, and
    // prices come from Elise (see project guardrails).
    tours: collection({
      label: 'Tours',
      slugField: 'name',
      path: 'content/tours/*',
      format: { contentField: 'description' },
      schema: {
        name: fields.slug({ name: { label: 'Tour name' } }),
        durationMinutes: fields.integer({ label: 'Duration (minutes)', validation: { min: 1 } }),
        priceNote: fields.text({
          label: 'Price note',
          description: 'e.g. "$X per boat, up to N guests" — exactly as Elise gives it',
        }),
        maxGuests: fields.integer({ label: 'Max guests', validation: { min: 1 } }),
        active: fields.checkbox({ label: 'Currently offered', defaultValue: true }),
        description: fields.markdoc({ label: 'Description' }),
      },
    }),

    testimonials: collection({
      label: 'Testimonials',
      slugField: 'author',
      path: 'content/testimonials/*',
      format: { contentField: 'quote' },
      schema: {
        author: fields.slug({ name: { label: 'Author' } }),
        source: fields.text({ label: 'Source (e.g. TripAdvisor)' }),
        quote: fields.markdoc({ label: 'Quote' }),
      },
    }),
  },
});
