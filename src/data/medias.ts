/**
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
  'assiette-ardoise': { largeur: 2200, hauteur: 3300, variantes: [480, 800, 1200, 1600, 2200], repli: 1600 },
  'carnet-poster': { largeur: 1600, hauteur: 900, variantes: [480, 800, 1200, 1600], repli: 1600 },
  'casier-main-poster': { largeur: 1600, hauteur: 2844, variantes: [480, 800, 1200, 1600], repli: 1600 },
  'casiers': { largeur: 2200, hauteur: 3911, variantes: [480, 800, 1200, 1600, 2200], repli: 1600 },
  'cave-futs': { largeur: 2200, hauteur: 3298, variantes: [480, 800, 1200, 1600, 2200], repli: 1600 },
  'cave-lumiere-poster': { largeur: 1600, hauteur: 675, variantes: [480, 800, 1200, 1600], repli: 1600 },
  'cave-voutee': { largeur: 2200, hauteur: 1467, variantes: [480, 800, 1200, 1600, 2200], repli: 1600 },
  'comptoir-soir': { largeur: 2200, hauteur: 3300, variantes: [480, 800, 1200, 1600, 2200], repli: 1600 },
  'comptoir-verres-poster': { largeur: 1600, hauteur: 3034, variantes: [480, 800, 1200, 1600], repli: 1600 },
  'livraison-poster': { largeur: 1600, hauteur: 2844, variantes: [480, 800, 1200, 1600], repli: 1600 },
  'mise-en-place-poster': { largeur: 1600, hauteur: 844, variantes: [480, 800, 1200, 1600], repli: 1600 },
  'mur-bouteilles': { largeur: 2200, hauteur: 2933, variantes: [480, 800, 1200, 1600, 2200], repli: 1600 },
  'reserve-cartons-poster': { largeur: 1600, hauteur: 844, variantes: [480, 800, 1200, 1600], repli: 1600 },
  'vitrine-cave': { largeur: 2200, hauteur: 1470, variantes: [480, 800, 1200, 1600, 2200], repli: 1600 },
};
