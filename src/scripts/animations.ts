/**
 * Animations Cuvée : révélations au scroll, compteurs, parallaxe.
 *
 * API (attributs HTML, à poser dans les composants) :
 *   data-reveal                 fondu + légère montée
 *   data-reveal="gauche"        entre depuis la gauche
 *   data-reveal="droite"        entre depuis la droite
 *   data-reveal="echelle"       fondu + léger zoom
 *   data-reveal-delai="1..6"    cascade (90 ms par cran), à combiner avec data-reveal
 *   data-reveal-lignes          titre révélé mot par mot (les espaces insécables restent
 *                               soudés ; le texte reste lisible tel quel par les lecteurs d'écran)
 *   data-compteur="1250"        le chiffre compte de 0 à sa valeur. L'élément ne contient que le
 *                               nombre (le texte initial sert de repli sans JS).
 *     data-compteur-decimales="1"   nombre de décimales (défaut 0)
 *   data-parallaxe="0.1"        parallaxe douce (coefficient, défaut 0.1, négatif = sens inverse).
 *                               Utilise la propriété CSS `translate` : ne pas la poser sur un
 *                               élément qui a aussi un data-reveal-* avec translate (OK avec data-reveal).
 *
 * Sans JS ou avec prefers-reduced-motion: reduce, tout reste visible et immobile : le CSS
 * masque les éléments uniquement si <html> porte la classe `anim` (posée par un script inline
 * de Base.astro, jamais en mouvement réduit).
 *
 * Charpente (toujours active, hors animation) — initEntete() :
 *   [data-entete]               en-tête : attribut data-compact="true" après 24 px de défilement
 *   [data-nav-desktop]          onglets : le trait doré [data-indicateur] glisse vers l’onglet actif,
 *                               suit le survol/focus clavier et revient à l’onglet actif ; sans JS,
 *                               un souligné CSS marque l’onglet actif
 *   [data-menu]                 menu mobile plein écran (<details>) : focus piégé dans [data-menu-focus],
 *                               Échap pour fermer (focus rendu au bouton), défilement de la page bloqué
 *   [data-progression]          barre de lecture dorée (--p de 0 à 1) ; absente en mouvement réduit
 *
 * Navigation : les transitions entre pages utilisent le CSS natif `@view-transition`
 * (pas de <ClientRouter />) ; chaque page se recharge, ce script s'exécute donc à chaque page.
 * Si un jour <ClientRouter /> est ajouté, appeler init() sur `astro:page-load`
 * (déjà branché ci-dessous : l'écouteur est inoffensif sans ClientRouter).
 */

const reduit = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function decouperEnMots(el: HTMLElement) {
  if (el.dataset.lignesPret) return;
  el.dataset.lignesPret = '1';
  let i = 0;
  const parcourir = (noeud: Node) => {
    for (const enfant of Array.from(noeud.childNodes)) {
      if (enfant.nodeType === Node.TEXT_NODE) {
        const morceaux = (enfant.textContent ?? '').split(/([ \t\n]+)/);
        const frag = document.createDocumentFragment();
        for (const m of morceaux) {
          if (!m) continue;
          if (/^[ \t\n]+$/.test(m)) {
            frag.append(' ');
          } else {
            const masque = document.createElement('span');
            masque.className = 'mot';
            const interieur = document.createElement('span');
            interieur.className = 'mot-i';
            interieur.style.setProperty('--i', String(i++));
            interieur.textContent = m; // les U+00A0 / U+202F ne sont pas coupés
            masque.append(interieur);
            frag.append(masque);
          }
        }
        enfant.replaceWith(frag);
      } else if (enfant.nodeType === Node.ELEMENT_NODE) {
        parcourir(enfant);
      }
    }
  };
  parcourir(el);
}

function compter(el: HTMLElement) {
  const cible = parseFloat((el.dataset.compteur ?? '').replace(',', '.'));
  if (Number.isNaN(cible)) return;
  const dec = parseInt(el.dataset.compteurDecimales ?? '0', 10) || 0;
  const fmt = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const debut = performance.now();
  const duree = 1400;
  const pas = (t: number) => {
    const p = Math.min((t - debut) / duree, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt.format(cible * e);
    if (p < 1) requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}

function parallaxe(elements: HTMLElement[]) {
  if (!elements.length) return;
  let attente = false;
  const maj = () => {
    attente = false;
    const h = window.innerHeight;
    for (const el of elements) {
      const r = el.parentElement?.getBoundingClientRect() ?? el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > h + 200) continue;
      const k = parseFloat(el.dataset.parallaxe || '0.1') || 0.1;
      const decalage = (r.top + r.height / 2 - h / 2) * k;
      el.style.translate = `0 ${decalage.toFixed(1)}px`;
    }
  };
  const demander = () => {
    if (!attente) {
      attente = true;
      requestAnimationFrame(maj);
    }
  };
  window.addEventListener('scroll', demander, { passive: true });
  window.addEventListener('resize', demander);
  maj();
}

export function init() {
  const html = document.documentElement;
  if (reduit() || !('IntersectionObserver' in window)) {
    html.classList.remove('anim');
    return;
  }
  try {
    document.querySelectorAll<HTMLElement>('[data-reveal-lignes]').forEach(decouperEnMots);

    const cibles = document.querySelectorAll<HTMLElement>('[data-reveal], [data-reveal-lignes], [data-compteur]');
    const obs = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          if (!e.isIntersecting) continue;
          const el = e.target as HTMLElement;
          el.classList.add('est-visible');
          if (el.hasAttribute('data-compteur')) compter(el);
          obs.unobserve(el);
        }
      },
      { threshold: 0, rootMargin: '0px 0px -10% 0px' },
    );
    cibles.forEach((el) => obs.observe(el));
    parallaxe(Array.from(document.querySelectorAll<HTMLElement>('[data-parallaxe]')));
    html.classList.add('anim-pret');
  } catch {
    html.classList.remove('anim'); // en cas de souci, tout redevient visible
  }
}

init();
document.addEventListener('astro:page-load', () => {
  if (!document.documentElement.classList.contains('anim-pret')) init();
});

/* ------------------------------------------------------------------ */
/* Charpente : en-tête compact, indicateur d’onglet, menu mobile, progression de lecture */

function initEntete() {
  const entete = document.querySelector<HTMLElement>('[data-entete]');
  const barre = document.querySelector<HTMLElement>('[data-progression]');
  const menu = document.querySelector<HTMLDetailsElement>('[data-menu]');

  // compaction + progression, au scroll
  let attente = false;
  const maj = () => {
    attente = false;
    const y = window.scrollY;
    entete?.setAttribute('data-compact', String(y > 24));
    if (barre) {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      barre.style.setProperty('--p', total > 0 ? Math.min(y / total, 1).toFixed(4) : '0');
    }
  };
  window.addEventListener(
    'scroll',
    () => {
      if (!attente) {
        attente = true;
        requestAnimationFrame(maj);
      }
    },
    { passive: true },
  );
  window.addEventListener('resize', maj);
  maj();

  // indicateur d’onglet
  const nav = document.querySelector<HTMLElement>('[data-nav-desktop]');
  const indic = nav?.querySelector<HTMLElement>('[data-indicateur]');
  if (nav && indic) {
    const liens = Array.from(nav.querySelectorAll<HTMLAnchorElement>('a.onglet'));
    const courant = () => nav.querySelector<HTMLAnchorElement>('a[aria-current="page"]');
    const placer = (a: HTMLElement | null, animer: boolean) => {
      if (!a) {
        indic.style.opacity = '0';
        return;
      }
      if (!animer) indic.style.transition = 'none';
      indic.style.opacity = '1';
      indic.style.width = `${a.offsetWidth}px`;
      indic.style.transform = `translateX(${a.parentElement!.offsetLeft}px)`;
      if (!animer) {
        void indic.offsetWidth;
        indic.style.transition = '';
      }
    };
    nav.dataset.indic = 'oui';
    const retour = () => placer(courant(), true);
    liens.forEach((a) => {
      a.addEventListener('mouseenter', () => placer(a, true));
      a.addEventListener('focus', () => placer(a, true));
      a.addEventListener('blur', retour);
    });
    nav.addEventListener('mouseleave', retour);
    window.addEventListener('resize', () => placer(courant(), false));
    document.fonts?.ready.then(() => placer(courant(), false));
    placer(courant(), false);
  }

  // menu mobile plein écran
  if (menu) {
    const resume = menu.querySelector('summary') as HTMLElement;
    const fermer = (rendreFocus: boolean) => {
      menu.open = false;
      if (rendreFocus) resume.focus();
    };
    menu.addEventListener('toggle', () => {
      document.documentElement.classList.toggle('menu-ouvert', menu.open);
      if (menu.open) menu.querySelector<HTMLElement>('[data-menu-lien]')?.focus({ preventScroll: true });
    });
    menu.querySelectorAll('[data-menu-lien]').forEach((l) => l.addEventListener('click', () => fermer(false)));
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => e.matches && fermer(false));
    document.addEventListener('keydown', (e) => {
      if (!menu.open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        fermer(true);
        return;
      }
      if (e.key !== 'Tab') return;
      // focus piégé : logo, bouton Menu, liens du panneau, bouton du pilote
      const focusables = Array.from(document.querySelectorAll<HTMLElement>('[data-entete] [data-menu-focus]')).filter(
        (el) => el.offsetParent !== null || el === resume,
      );
      const premier = focusables[0];
      const dernier = focusables[focusables.length - 1];
      const actif = document.activeElement;
      if (e.shiftKey && actif === premier) {
        e.preventDefault();
        dernier.focus();
      } else if (!e.shiftKey && actif === dernier) {
        e.preventDefault();
        premier.focus();
      } else if (!focusables.includes(actif as HTMLElement)) {
        e.preventDefault();
        premier.focus();
      }
    });
  }
}

initEntete();
