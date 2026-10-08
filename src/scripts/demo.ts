/**
 * Exemples illustratifs : les boutons n’envoient rien, ils affichent un tampon
 * et expliquent ce qui se passerait. Sur mobile, un sélecteur d’onglets
 * (mardi / mercredi / jeudi) n’affiche qu’une fiche à la fois.
 */
document.querySelectorAll<HTMLElement>('[data-demo]').forEach((carte) => {
  const statut = carte.querySelector<HTMLElement>('[data-demo-statut]');

  carte.querySelectorAll<HTMLButtonElement>('[data-demo-action]').forEach((bouton) => {
    bouton.addEventListener('click', () => {
      if (bouton.dataset.demoAction === 'valider') carte.classList.add('est-valide');
      if (statut) {
        statut.textContent = bouton.dataset.demoMessage ?? '';
        statut.animate?.([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], {
          duration: 300,
          easing: 'ease-out',
        });
      }
    });
  });
});

const liste = document.querySelector<HTMLElement>('[data-onglets]');
const grille = document.querySelector<HTMLElement>('[data-grille-exemples]');
if (liste && grille && !liste.dataset.pret) {
  liste.dataset.pret = '1';
  const onglets = Array.from(liste.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const cartes = Array.from(grille.querySelectorAll<HTMLElement>(':scope > article'));
  const mobile = matchMedia('(max-width: 63.99rem)');

  const choisir = (i: number, focus = false) => {
    onglets.forEach((o, k) => {
      o.setAttribute('aria-selected', String(k === i));
      o.tabIndex = k === i ? 0 : -1;
    });
    cartes.forEach((c, k) => (c.dataset.actif = String(k === i)));
    if (focus) onglets[i].focus();
  };

  // Les rôles d’onglet/panneau ne s’appliquent que lorsque le sélecteur est visible (mobile).
  const synchroniser = () => {
    const actif = mobile.matches;
    liste.hidden = !actif;
    if (actif) grille.setAttribute('data-onglets-actifs', '');
    else grille.removeAttribute('data-onglets-actifs');
    cartes.forEach((c, k) => {
      if (actif) {
        c.setAttribute('role', 'tabpanel');
        c.setAttribute('aria-labelledby', onglets[k].id);
      } else {
        c.removeAttribute('role');
        c.setAttribute('aria-labelledby', c.querySelector('h3')?.id ?? '');
      }
    });
  };

  onglets.forEach((o, i) => {
    o.addEventListener('click', () => choisir(i));
    o.addEventListener('keydown', (e) => {
      const n = onglets.length;
      let cible = -1;
      if (e.key === 'ArrowRight') cible = (i + 1) % n;
      else if (e.key === 'ArrowLeft') cible = (i - 1 + n) % n;
      else if (e.key === 'Home') cible = 0;
      else if (e.key === 'End') cible = n - 1;
      if (cible >= 0) {
        e.preventDefault();
        choisir(cible, true);
      }
    });
  });

  choisir(0);
  synchroniser();
  mobile.addEventListener('change', synchroniser);
}
