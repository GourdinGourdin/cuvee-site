/**
 * Génère public/og-image.png (1200×630) et public/apple-touch-icon.png (180×180).
 * Usage : npm run images
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const ici = (chemin) => new URL(chemin, import.meta.url);
const navigateur = await chromium.launch();

const og = await navigateur.newPage({ viewport: { width: 1200, height: 630 } });
await og.goto(ici('./modeles/og.html').href);
await og.evaluate(() => document.fonts.ready);
await og.screenshot({ path: fileURLToPath(ici('../public/og-image.png')) });

const icone = await navigateur.newPage({ viewport: { width: 180, height: 180 } });
await icone.setContent(`<body style="margin:0;background:#6e1f2f;display:grid;place-items:center;width:180px;height:180px">
  <svg width="150" height="150" viewBox="0 0 32 32"><path d="M7.5 5.5H24.5A3 3 0 0 0 26.5 7.5V24.5A3 3 0 0 0 24.5 26.5H7.5A3 3 0 0 0 5.5 24.5V7.5A3 3 0 0 0 7.5 5.5Z" fill="none" stroke="#a88a4a" stroke-width=".7"/>
  <text x="16" y="22" text-anchor="middle" font-family="Georgia, serif" font-size="17" font-style="italic" fill="#f5efe3">C</text></svg></body>`);
await icone.screenshot({ path: fileURLToPath(ici('../public/apple-touch-icon.png')) });

await navigateur.close();
console.log('public/og-image.png et public/apple-touch-icon.png générés.');
