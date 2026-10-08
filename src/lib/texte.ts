const echapper = (texte: string) =>
  texte.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Échappe le texte puis surligne chaque « [À COMPLÉTER : …] »
 * pour qu’aucun placeholder ne passe inaperçu à la relecture.
 */
export function avecPlaceholders(texte: string): string {
  return echapper(texte).replace(/\[À COMPLÉTER[^\]]*\]/g, (m) => `<mark class="a-completer">${m}</mark>`);
}
