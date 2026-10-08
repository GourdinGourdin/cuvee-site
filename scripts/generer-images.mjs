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
await icone.setContent(`<body style="margin:0;background:#f5efe3;display:grid;place-items:center;width:180px;height:180px">
  <svg width="70" height="140" viewBox="0 0 24 48"><path d="M10.2 5H13.8V14C13.8 18.2 18.6 19.6 18.6 26.5V43.2Q18.6 45.4 16.4 45.4H7.6Q5.4 45.4 5.4 43.2V26.5C5.4 19.6 10.2 18.2 10.2 14Z" fill="#6e1f2f"/><rect x="9.4" y="1.6" width="5.2" height="7" rx="1" fill="#a88a4a"/><rect x="8.6" y="7.6" width="6.8" height="1.3" fill="#a88a4a"/><rect x="7.4" y="28" width="9.2" height="11.6" rx=".6" fill="#f5efe3" stroke="#a88a4a" stroke-width=".5"/><text x="12" y="37" text-anchor="middle" font-family="Georgia, serif" font-size="10.5" font-style="italic" font-weight="600" fill="#6e1f2f">C</text></svg></body>`);
await icone.screenshot({ path: fileURLToPath(ici('../public/apple-touch-icon.png')) });

await navigateur.close();
console.log('public/og-image.png et public/apple-touch-icon.png générés.');
