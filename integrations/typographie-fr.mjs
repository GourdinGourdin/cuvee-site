/**
 * Typographie française appliquée au HTML généré (npm run build) :
 * espace fine insécable avant ? ! ; et dans les guillemets, espace insécable
 * avant : et entre un nombre et son unité. Scripts, styles et attributs ne sont pas touchés.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FINE = ' ';
const INSECABLE = ' ';

export function corrigerTexte(texte) {
  return texte
    .replace(/ ([?!;])/g, `${FINE}$1`)
    .replace(/ :(?=\s|$)/g, `${INSECABLE}:`)
    .replace(/« /g, `«${FINE}`)
    .replace(/ »/g, `${FINE}»`)
    .replace(/(\d) (?=(?:€|%|h\b|bt\b|jours\b|références\b|bouteilles\b|semaines\b))/g, `$1${INSECABLE}`)
    .replace(/(\d) h (\d)/g, `$1${INSECABLE}h${INSECABLE}$2`);
}

export function corrigerHtml(html) {
  const reserves = [];
  const protege = html.replace(/<(script|style|pre|code)\b[\s\S]*?<\/\1>/gi, (bloc) => {
    reserves.push(bloc);
    return `\u0000${reserves.length - 1}\u0000`;
  });
  const corrige = protege.replace(/>([^<]+)</g, (_, texte) => `>${corrigerTexte(texte)}<`);
  return corrige.replace(/\u0000(\d+)\u0000/g, (_, i) => reserves[Number(i)]);
}

async function* fichiersHtml(dossier) {
  for (const entree of await readdir(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) yield* fichiersHtml(chemin);
    else if (entree.name.endsWith('.html')) yield chemin;
  }
}

export default function typographieFr() {
  return {
    name: 'typographie-fr',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        let total = 0;
        for await (const fichier of fichiersHtml(fileURLToPath(dir))) {
          const html = await readFile(fichier, 'utf8');
          const corrige = corrigerHtml(html);
          if (corrige !== html) {
            await writeFile(fichier, corrige);
            total++;
          }
        }
        logger.info(`Espaces insécables appliquées à ${total} page(s).`);
      },
    },
  };
}
