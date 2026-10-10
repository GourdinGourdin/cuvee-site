/**
 * Optimisation des images de public/media/ : pour chaque .jpg (photos et affiches de vidéos),
 * génère dans public/media/opt/ des variantes AVIF et WebP en 480/800/1200/1600/2200 px de large
 * (sans agrandir au-delà de la source) et un JPEG de repli (mozjpeg, 1600 px max).
 * Écrit le manifeste src/data/medias.ts (dimensions d'origine + largeurs disponibles).
 * Idempotent : un fichier plus récent que sa source n'est pas régénéré (--force pour tout refaire).
 *
 * Usage : npm run medias
 */
import { readdir, stat, mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const dossier = join(racine, 'public', 'media');
const sortie = join(dossier, 'opt');
const manifeste = join(racine, 'src', 'data', 'medias.ts');

const LARGEURS = [480, 800, 1200, 1600, 2200];
const REPLI = 1600;
const AVIF = { quality: 50, effort: 6 };
const WEBP = { quality: 72, effort: 6 };
const JPEG = { quality: 78, mozjpeg: true };
const force = process.argv.includes('--force');

const aJour = async (fichier, sourceMs) => {
  if (force) return false;
  try {
    return (await stat(fichier)).mtimeMs >= sourceMs;
  } catch {
    return false;
  }
};

await mkdir(sortie, { recursive: true });
const sources = (await readdir(dossier)).filter((f) => f.toLowerCase().endsWith('.jpg')).sort();
const donnees = {};
let faits = 0;
let sautes = 0;

for (const fichier of sources) {
  const nom = fichier.replace(/\.jpg$/i, '');
  const chemin = join(dossier, fichier);
  const { mtimeMs } = await stat(chemin);
  const meta = await sharp(chemin).metadata();
  const largeur = meta.width;
  const hauteur = meta.height;
  const largeurs = LARGEURS.filter((w) => w <= largeur);
  if (!largeurs.length || largeurs[largeurs.length - 1] < largeur) {
    if (largeur < LARGEURS[LARGEURS.length - 1] && !largeurs.includes(largeur)) largeurs.push(largeur);
  }

  const taches = [];
  for (const w of largeurs) {
    taches.push([`${nom}-${w}.avif`, w, (s) => s.avif(AVIF)]);
    taches.push([`${nom}-${w}.webp`, w, (s) => s.webp(WEBP)]);
  }
  const wRepli = Math.min(REPLI, largeur);
  taches.push([`${nom}-repli.jpg`, wRepli, (s) => s.jpeg(JPEG)]);

  for (const [f, w, format] of taches) {
    const cible = join(sortie, f);
    if (await aJour(cible, mtimeMs)) {
      sautes++;
      continue;
    }
    await format(sharp(chemin).rotate().resize({ width: w, withoutEnlargement: true })).toFile(cible);
    faits++;
  }
  donnees[nom] = { largeur, hauteur, variantes: largeurs, repli: wRepli };
}

const lignes = Object.entries(donnees).map(
  ([n, d]) => `  '${n}': { largeur: ${d.largeur}, hauteur: ${d.hauteur}, variantes: [${d.variantes.join(', ')}], repli: ${d.repli} },`,
);
await writeFile(
  manifeste,
  `/**
 * Manifeste des images optimisées. GÉNÉRÉ par scripts/optimiser-medias.mjs (npm run medias) : ne pas modifier à la main.
 * Clé = nom du fichier sans extension. Fichiers : /media/opt/<clé>-<largeur>.avif|webp et /media/opt/<clé>-repli.jpg.
 */
export interface MediaOptimise {
  /** Dimensions de l'image d'origine. */
  largeur: number;
  hauteur: number;
  /** Largeurs disponibles en AVIF et WebP. */
  variantes: number[];
  /** Largeur du JPEG de repli. */
  repli: number;
}

export const medias: Record<string, MediaOptimise> = {
${lignes.join('\n')}
};
`,
);
console.log(`${sources.length} images · ${faits} fichiers générés · ${sautes} à jour`);
