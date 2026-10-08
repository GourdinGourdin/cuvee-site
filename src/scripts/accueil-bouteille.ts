/**
 * Bouteille de l’accueil : au clic (ou automatiquement après un court instant), la capsule se
 * découpe, le bouchon se retire, un papier roulé sort et se déroule en proposition de commande.
 * États portés par [data-etat] sur la scène : (absent) = état final statique (sans JS, mouvement
 * réduit) · « ferme » = bon masqué · « joue » = animation en cours · « fini » = état final.
 * Cliquer pendant l’animation la saute : on ne retient jamais le lecteur.
 */
const DUREE = 8200; // ms, doit couvrir la fin du tampon (voir Hero.astro / BonDeCommande.astro)

function init() {
  const scene = document.querySelector<HTMLElement>('[data-scene]');
  const bouton = scene?.querySelector<HTMLButtonElement>('[data-ouvrir]');
  const bouteille = scene?.querySelector<HTMLElement>('[data-bouteille]');
  if (!scene || !bouton || !bouteille) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const libelle = bouton.querySelector<HTMLElement>('[data-ouvrir-texte]')!;
  const total = scene.querySelector<HTMLElement>('[data-total-nb]');
  const fin = total ? Number(total.textContent) : 0;
  let minuteur = 0;
  let auto = 0;
  let raf = 0;

  const compter = () => {
    if (!total) return;
    const debut = performance.now() + 5600;
    total.textContent = '0';
    const pas = (t: number) => {
      const k = Math.min(Math.max((t - debut) / 700, 0), 1);
      total.textContent = String(Math.round(fin * k));
      if (k < 1) raf = requestAnimationFrame(pas);
    };
    raf = requestAnimationFrame(pas);
  };

  const terminer = () => {
    clearTimeout(minuteur);
    cancelAnimationFrame(raf);
    if (total) total.textContent = String(fin);
    scene.dataset.etat = 'fini';
    bouton.setAttribute('aria-expanded', 'true');
    bouton.removeAttribute('aria-busy');
    libelle.textContent = 'Rejouer l’ouverture';
  };

  const jouer = () => {
    clearTimeout(auto);
    clearTimeout(minuteur);
    cancelAnimationFrame(raf);
    scene.dataset.etat = 'ferme';
    void scene.offsetWidth; // relance les animations CSS
    scene.dataset.etat = 'joue';
    bouton.setAttribute('aria-expanded', 'true');
    bouton.setAttribute('aria-busy', 'true');
    libelle.textContent = 'Passer l’animation';
    compter();
    minuteur = window.setTimeout(terminer, DUREE);
  };

  const cliquer = () => {
    if (scene.dataset.etat === 'joue') terminer();
    else jouer();
  };

  bouton.hidden = false;
  scene.dataset.etat = 'ferme';
  bouton.setAttribute('aria-expanded', 'false');
  bouteille.addEventListener('click', (e) => {
    if (!bouton.contains(e.target as Node)) cliquer();
  });
  bouton.addEventListener('click', cliquer);
  // Le bon n’est jamais retenu : l’ouverture démarre seule dès que la bouteille est à l’écran
  // (sur mobile, elle est sous le texte d’introduction).
  const lancer = () => {
    auto = window.setTimeout(() => {
      if (scene.dataset.etat === 'ferme') jouer();
    }, 900);
  };
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      (entrees) => {
        if (entrees.some((e) => e.isIntersecting)) {
          obs.disconnect();
          lancer();
        }
      },
      { threshold: 0.6 },
    );
    obs.observe(bouteille);
  } else {
    lancer();
  }
}

init();
