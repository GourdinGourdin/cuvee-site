/**
 * Après chaque build, compte les placeholders « [À COMPLÉTER : …] » restants par page,
 * pour qu'aucun ne parte en ligne par inadvertance.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

async function* fichiersHtml(dossier) {
  for (const entree of await readdir(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) yield* fichiersHtml(chemin);
    else if (entree.name.endsWith('.html')) yield chemin;
  }
}

export default function aCompleter() {
  return {
    name: 'a-completer',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const racine = fileURLToPath(dir);
        let total = 0;
        for await (const fichier of fichiersHtml(racine)) {
          const n = ((await readFile(fichier, 'utf8')).match(/\[À COMPLÉTER/g) ?? []).length;
          if (n) logger.warn(`${relative(racine, fichier)} : ${n} [À COMPLÉTER]`);
          total += n;
        }
        if (total) logger.warn(`${total} placeholder(s) à remplacer avant la mise en ligne.`);
        else logger.info('Aucun placeholder restant.');
      },
    },
  };
}
