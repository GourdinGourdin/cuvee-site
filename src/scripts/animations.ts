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
 *   data-reveal="rideau"       le média (ou son conteneur) se dévoile par un volet qui s'ouvre, l'image
 *                               à l'intérieur se dézoome doucement. À poser sur le CONTENEUR de l'image
 *                               (.media-cadre), pas sur l'<img>. Sens du volet : data-reveal-sens="bas"
 *                               (défaut) | "haut" | "gauche" | "droite".
 *   data-reveal="flou"          apparition depuis un léger flou (fondu + netteté), pour un titre ou un bloc
 *
 * Sans JS ou avec prefers-reduced-motion: reduce, tout reste visible et immobile : le CSS
 * masque les éléments uniquement si <html> porte la classe `anim` (posée par un script inline
 * de Base.astro, jamais en mouvement réduit).
 *
 * Intro de l'accueil : tant que <html> porte `intro-active` (et pas `intro-vue`), les révélations
 * attendent l'événement `cuvee:intro-fin` (filet de sécurité : 12 s) avant de s'observer.
 *
 * Charpente :
 *   [data-progression]          barre de lecture dorée (--p de 0 à 1) ; absente en mouvement réduit
 *   pageswap                    transitions de page : le morphing d'image `media-*` (carte de l'accueil
 *                               vers l'en-tête de la page) n'est gardé que de l'accueil vers une page,
 *                               et seulement si la carte est à l'écran ; dans les autres cas le média
 *                               suit simplement la transition de la page.
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
    const observer = () => cibles.forEach((el) => obs.observe(el));
    if (html.classList.contains('intro-active') && !html.classList.contains('intro-vue')) {
      let lance = false;
      const lancer = () => {
        if (lance) return;
        lance = true;
        observer();
      };
      document.addEventListener('cuvee:intro-fin', lancer, { once: true });
      window.setTimeout(lancer, 12000);
    } else {
      observer();
    }
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
  const barre = document.querySelector<HTMLElement>('[data-progression]');
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

window.addEventListener('pageswap', (e) => {
  const evt = e as Event & { activation?: { entry?: { url?: string } }; viewTransition?: unknown };
  if (!evt.viewTransition || !evt.activation?.entry?.url) return;
  const depart = chemin(location.href);
  const arrivee = chemin(evt.activation.entry.url);
  document.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const nom = getComputedStyle(el).viewTransitionName;
    if (!nom || !nom.startsWith('media-')) return;
    const bonneCarte = depart === '/' && nom === `media-${arrivee.slice(1)}`;
    const r = el.getBoundingClientRect();
    const dansEcran = r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
    if (!bonneCarte || !dansEcran) el.style.viewTransitionName = 'none';
  });
});
