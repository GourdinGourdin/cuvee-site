/**
 * Boutons des exemples illustratifs : ils n’envoient rien,
 * ils affichent un tampon et expliquent ce qui se passerait.
 */
document.querySelectorAll<HTMLElement>('[data-demo]').forEach((carte) => {
  const statut = carte.querySelector<HTMLElement>('[data-demo-statut]');

  carte.querySelectorAll<HTMLButtonElement>('[data-demo-action]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      if (bouton.dataset.demoAction === 'valider') carte.classList.add('est-valide');
      if (statut) statut.textContent = bouton.dataset.demoMessage ?? '';
    });
  });
});
