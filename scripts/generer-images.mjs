/**
 * Génère public/og-image.png (1200×630) et public/apple-touch-icon.png (180×180)
 * à partir des modèles de scripts/modeles/ (l'emblème vient de embleme.html, gabarit unique).
 * Usage : npm run images
 */
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const ici = (chemin) => new URL(chemin, import.meta.url);
const racine = fileURLToPath(ici('../')).replace(/\/$/, '');
const embleme = await readFile(ici('./modeles/embleme.html'), 'utf8');

// Le modèle assemblé est écrit dans un fichier temporaire (cache de node_modules) pour que
// les polices locales (file://) soient chargées : une page about:blank ne peut pas les lire.
const cache = ici('../node_modules/.cache/cuvee-images/');
await mkdir(cache, { recursive: true });

async function modele(nom) {
  const html = await readFile(ici(`./modeles/${nom}`), 'utf8');
  const fichier = new URL(nom, cache);
  await writeFile(fichier, html.replaceAll('{{EMBLEME}}', embleme.trim()).replaceAll('{{RACINE}}', `file://${racine}`));
  return fichier.href;
}

const navigateur = await chromium.launch();

const og = await navigateur.newPage({ viewport: { width: 1200, height: 630 } });
await og.goto(await modele('og.html'));
await og.evaluate(() => document.fonts.ready);
await og.screenshot({ path: fileURLToPath(ici('../public/og-image.png')) });

const icone = await navigateur.newPage({ viewport: { width: 180, height: 180 } });
await icone.goto(await modele('icone.html'));
await icone.evaluate(() => document.fonts.ready);
await icone.screenshot({ path: fileURLToPath(ici('../public/apple-touch-icon.png')) });

await navigateur.close();
console.log('public/og-image.png et public/apple-touch-icon.png générés.');
