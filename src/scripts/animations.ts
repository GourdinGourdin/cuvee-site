/**
 * Animations Cuvée : révélations au défilement, compteurs, parallaxe, barre de lecture, transitions de page.
 *
 * Un seul langage de mouvement : fondu + montée de 14 px, 400 ms, --ease-sortie, cascade de 70 ms.
 *
 * API (attributs HTML, à poser dans les composants) :
 *   data-reveal                 apparition par défaut (fondu + montée)
 *   data-reveal="gauche|droite" la même, avec une entrée latérale de 16 px
 *   data-reveal="echelle"       alias presque identique au défaut (échelle 0,985)
 *   data-reveal="flou"          alias du défaut (le flou a été retiré : coûteux et peu lisible)
 *   data-reveal="rideau"        RÉSERVÉ AUX GRANDS MÉDIAS : un volet s'ouvre, l'image se dézoome. À poser sur
 *                               le CONTENEUR (.media-cadre), pas sur l'<img>. Sens : data-reveal-sens="bas"
 *                               (défaut) | "haut" | "gauche" | "droite".
 *   data-reveal="ecriture|filet|filet-v"  effets décoratifs (signature qui s'écrit, filet qui se trace),
 *                               définis dans maison/Ouverture.astro
 *   data-reveal-delai="1..6"    cascade (70 ms par cran), à combiner avec data-reveal
 *   data-reveal-lignes          titre révélé mot par mot (espaces insécables préservés ; le texte reste
 *                               lisible tel quel par les lecteurs d'écran). Réserver aux h1/h2.
 *   data-compteur="1250"        le chiffre compte de 0 à sa valeur. L'élément ne contient que le
 *                               nombre (le texte initial sert de repli sans JS).
 *     data-compteur-decimales="1"   nombre de décimales (défaut 0)
 *   data-parallaxe="0.1"        parallaxe douce (coefficient, défaut 0.1, négatif = sens inverse), limitée à
 *                               ±36 px, désactivée sous 768 px. À poser sur une <img>/<video> absolue dans un
 *                               .media-cadre (le CSS l'agrandit alors de 72 px). Utilise la propriété CSS
 *                               `translate` : ne pas la combiner avec un translate propre.
 *
 * Sans JS ou avec prefers-reduced-motion: reduce, tout reste visible et immobile : le CSS
 * masque les éléments uniquement si <html> porte la classe `anim` (posée par un script inline
 * de Base.astro, jamais en mouvement réduit, retirée au bout de 3 s si ce script n'a pas démarré).
 * Filets de sécurité ici : élément passé au-dessus de l'écran (défilement rapide, ancre) révélé aussitôt ;
 * élément qui reçoit le focus révélé aussitôt ; impression : tout est révélé.
 *
 * Charpente :
 *   .progression[data-progression]  barre de lecture dorée (--p de 0 à 1) ; absente en mouvement réduit
 *   pageswap                        transitions de page : le morphing d'image `media-*` (carte de l'accueil
 *                                   vers l'en-tête de la page) n'est gardé que de l'accueil vers une page,
 *                                   et seulement si la carte est à l'écran ; dans les autres cas le média
 *                                   de départ suit simplement la transition de la page (le CSS fait entrer
 *                                   en fondu, avec la page, un média d'arrivée sans vis-à-vis).
 * L'en-tête (fond au défilement, masquage, onglets, menu plein écran) a son propre script, dans
 * src/components/maison/EnTete.astro.
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
  const duree = 1000;
  const pas = (t: number) => {
    const p = Math.min((t - debut) / duree, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = fmt.format(cible * e);
    if (p < 1) requestAnimationFrame(pas);
  };
  requestAnimationFrame(pas);
}

const PARALLAXE_MAX = 36; // px, amplitude maximale (le CSS agrandit le média de 2 × cette valeur)
const PARALLAXE_MIN_LARGEUR = '(min-width: 768px)';

function parallaxe(elements: HTMLElement[]) {
  if (!elements.length) return;
  const html = document.documentElement;
  const grand = window.matchMedia(PARALLAXE_MIN_LARGEUR);
  let attente = false;
  const maj = () => {
    attente = false;
    const actif = grand.matches;
    html.classList.toggle('parallaxe', actif);
    const h = window.innerHeight;
    for (const el of elements) {
      if (!actif) {
        el.style.removeProperty('translate');
        continue;
      }
      const k = parseFloat(el.dataset.parallaxe ?? '') || 0.1;
      // le cadre qui découpe le média (l'<img> peut être dans un <picture>, qui n'a pas de boîte propre)
      const cadre = el.closest<HTMLElement>('.media-cadre') ?? el.parentElement ?? el;
      const r = cadre.getBoundingClientRect();
      if (r.bottom < -200 || r.top > h + 200) continue;
      // p va de +1 (cadre qui entre par le bas) à -1 (cadre qui sort par le haut) : le mouvement utilise
      // toute la course, sans plafond brutal ; l'amplitude vaut k × 300 px, bornée à ±36 px
      const p = (r.top + r.height / 2 - h / 2) / ((h + r.height) / 2);
      const amplitude = Math.max(-PARALLAXE_MAX, Math.min(PARALLAXE_MAX, k * 300));
      const decalage = Math.max(-1, Math.min(1, p)) * amplitude;
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
    const SELECTEUR = '[data-reveal], [data-reveal-lignes], [data-compteur]';
    const reveler = (el: HTMLElement) => {
      if (el.classList.contains('est-visible')) return;
      el.classList.add('est-visible');
      if (el.hasAttribute('data-compteur')) compter(el);
      obs.unobserve(el);
    };
    // Marge basse positive : l'apparition démarre juste AVANT l'entrée dans l'écran, donc rien ne
    // surgit « en retard » quand on défile vite. Un élément déjà passé au-dessus de l'écran
    // (défilement rapide, lien d'ancre) est révélé aussitôt, sans animation visible.
    const obs = new IntersectionObserver(
      (entrees) => {
        for (const e of entrees) {
          const el = e.target as HTMLElement;
          if (e.isIntersecting || e.boundingClientRect.top < 0) reveler(el);
        }
      },
      { threshold: 0, rootMargin: '0px 0px 8% 0px' },
    );
    cibles.forEach((el) => obs.observe(el));
    // Navigation au clavier : un élément qui reçoit le focus ne doit pas rester invisible (ni son rideau
    // d'image, ni sa carte) en attendant que l'observateur le voie.
    document.addEventListener('focusin', (e) => {
      for (let n = e.target instanceof HTMLElement ? e.target : null; n; n = n.parentElement) {
        if (n.matches(SELECTEUR)) reveler(n);
      }
    });
    // Impression, retour dans l'historique (cache de page) : tout est visible.
    window.addEventListener('beforeprint', () => cibles.forEach(reveler));
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) cibles.forEach((el) => el.getBoundingClientRect().top < window.innerHeight && reveler(el));
    });
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
/* Barre de lecture dorée */

function initProgression() {
  const barre = document.querySelector<HTMLElement>('.progression[data-progression]');
  if (!barre) return;
  let attente = false;
  const maj = () => {
    attente = false;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    barre.style.setProperty('--p', total > 0 ? Math.min(Math.max(window.scrollY / total, 0), 1).toFixed(4) : '0');
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

initProgression();

/* ------------------------------------------------------------------ */
/* Morphing d'image entre l'accueil et une page : on ne garde que le sens accueil -> page */

const chemin = (u: string | URL) => new URL(u, location.href).pathname.replace(/\/+$/, '') || '/';

/** Noms de transition `media-*` présents dans la page (images portant un view-transition-name). */
function mediasNommes(): { el: HTMLElement; nom: string }[] {
  const res: { el: HTMLElement; nom: string }[] = [];
  document.querySelectorAll<HTMLElement>('img, video').forEach((el) => {
    const nom = getComputedStyle(el).viewTransitionName;
    if (nom && nom.startsWith('media-')) res.push({ el, nom });
  });
  return res;
}

/** Page de départ : on garde le morphing de la carte visible ; tout autre média suit la page. */
window.addEventListener('pageswap', (e) => {
  const evt = e as Event & { activation?: { entry?: { url?: string } }; viewTransition?: unknown };
  if (!evt.viewTransition || !evt.activation?.entry?.url) return;
  const depart = chemin(location.href);
  const arrivee = chemin(evt.activation.entry.url);
  for (const { el, nom } of mediasNommes()) {
    const bonneCarte = depart === '/' && nom === `media-${arrivee.slice(1)}`;
    const r = el.getBoundingClientRect();
    const dansEcran = r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
    if (bonneCarte && dansEcran) {
      el.parentElement?.setAttribute('data-vt-morph', '');
      el.parentElement?.setAttribute('data-vt-depart', '');
    } else {
      el.style.viewTransitionName = 'none';
    }
  }
});
