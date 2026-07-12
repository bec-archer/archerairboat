// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
import keystatic from '@keystatic/astro';

// Keystatic's admin UI (/keystatic) is a dev-time tool in local mode.
// Production builds are fully static for Cloudflare, so we exclude the
// integration there (SKIP_KEYSTATIC=1 is set by the build script).
const withKeystatic = !process.env.SKIP_KEYSTATIC;

export default defineConfig({
  site: 'https://archerairboattours.com',
  integrations: [react(), markdoc(), ...(withKeystatic ? [keystatic()] : [])],
});
