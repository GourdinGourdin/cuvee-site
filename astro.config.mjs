// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import typographieFr from './integrations/typographie-fr.mjs';
import aCompleter from './integrations/a-completer.mjs';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');

// URL publique du site : SITE_URL si défini, sinon détectée automatiquement
// sur Netlify (URL) ou Vercel (VERCEL_PROJECT_PRODUCTION_URL).
const site =
  env.SITE_URL ||
  env.URL ||
  (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:4321');

// https://astro.build/config
export default defineConfig({
  site,
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap(), typographieFr(), aCompleter()],
  devToolbar: { enabled: false },
});
