/**
 * Captures pleine page du site, en mobile et en desktop.
 * Usage : lancer le site (npm run dev ou npm run preview), puis
 *   npm run captures            → http://localhost:4321
 *   npm run captures -- <url>   → autre adresse
 * Les images sont écrites dans captures/.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://localhost:4321';
const pages = [
  { nom: 'accueil', chemin: '/' },
  { nom: 'accueil-variante-b', chemin: '/?v=b', seulement: 'mobile' },
  { nom: 'mentions-legales', chemin: '/mentions-legales/', seulement: 'mobile' },
];
const formats = [
  { nom: 'mobile', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  { nom: 'desktop', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
];

await mkdir('captures', { recursive: true });
const navigateur = await chromium.launch();

for (const format of formats) {
  const { nom: nomFormat, ...options } = format;
  const contexte = await navigateur.newContext({ ...options, locale: 'fr-FR', reducedMotion: 'reduce' });
  const page = await contexte.newPage();
  const erreurs = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('console', (m) => m.type() === 'error' && erreurs.push(m.text()));

  for (const p of pages) {
    if (p.seulement && p.seulement !== nomFormat) continue;
    await page.goto(base + p.chemin, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    // Débordement horizontal : aucun élément ne doit dépasser la largeur de l'écran.
    const debordement = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const fichier = `captures/${p.nom}-${nomFormat}.png`;
    await page.screenshot({ path: fichier, fullPage: true });
    console.log(`${fichier}${debordement > 0 ? `  ⚠ débordement horizontal de ${debordement}px` : ''}`);
  }
  if (erreurs.length) console.log(`Erreurs console (${nomFormat}) :\n  ${erreurs.join('\n  ')}`);
  await contexte.close();
}

await navigateur.close();
