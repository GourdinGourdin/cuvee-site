/**
 * Intro « bouteille » de l'accueil. Voir src/components/intro/IntroBouteille.astro.
 *
 * Déroulé après le clic (≈ 3,5 s), tout en transform / opacity (Web Animations API) :
 *   0 s      la capsule se découpe (trait de coupe), la calotte s'envole
 *   0,35 s   le bouchon saute (rebond), onde de choc
 *   0,85 s   la bouteille s'incline, la bouche reste fixe à l'écran
 *   1,4 s    le filet de vin tombe
 *   1,55 s   le vin monte en vague et couvre l'écran
 *   2,7 s    le rideau se retire vers le haut sur l'accueil
 */

const racine = document.documentElement;
const intro = document.querySelector<HTMLElement>('[data-intro]');

if (intro) {
  if (racine.classList.contains('intro-active')) demarrer(intro);
  else intro.remove();
}

function demarrer(intro: HTMLElement) {
  intro.dataset.pret = '1';
  intro.dataset.actif = '';

  const q = <T extends Element>(sel: string) => intro.querySelector<T>(sel)!;
  const bouteille = q<HTMLButtonElement>('[data-bouteille]');
  const passer = q<HTMLButtonElement>('[data-passer]');
  const lift = q<HTMLElement>('[data-lift]');
  const pivot = q<HTMLElement>('[data-pivot]');
  const derive = q<HTMLElement>('[data-derive]');
  const invite = q<HTMLElement>('[data-invite]');
  const bouchon = q<SVGGElement>('[data-bouchon]');
  const calotte = q<SVGGElement>('[data-calotte]');
  const coupe = q<SVGPathElement>('[data-coupe]');
  const onde = q<SVGCircleElement>('[data-onde]');
  const bouche = q<SVGCircleElement>('[data-bouche]');
  const ombre = q<SVGElement>('[data-ombre]');
  const filet = q<HTMLElement>('[data-filet]');
  const nappe = q<HTMLElement>('[data-nappe]');
  const fond = q<HTMLElement>('[data-fond]');
  const scene = q<HTMLElement>('[data-scene]');

  // Le reste de la page est inerte pendant l'intro.
  const inertes: HTMLElement[] = [];
  for (const el of Array.from(document.body.children)) {
    if (el === intro || !(el instanceof HTMLElement)) continue;
    if (['SCRIPT', 'STYLE', 'LINK'].includes(el.tagName)) continue;
    if (!el.hasAttribute('inert')) {
      el.setAttribute('inert', '');
      inertes.push(el);
    }
  }

  let etat: 'attente' | 'ouverture' | 'fin' = 'attente';
  const animations: Animation[] = [];
  const minuteries: number[] = [];
  const apres = (ms: number, fn: () => void) => minuteries.push(window.setTimeout(fn, ms));

  const anime = (el: Element, keyframes: Keyframe[], options: KeyframeAnimationOptions) => {
    const a = el.animate(keyframes, { fill: 'both', ...options });
    animations.push(a);
    return a;
  };

  // Rend la main à la page : classes, événement, focus, défilement. Le rideau peut finir de partir ensuite.
  function rendreLaPage() {
    if (etat === 'fin') return;
    etat = 'fin';
    inertes.forEach((el) => el.removeAttribute('inert'));
    racine.classList.remove('intro-active');
    racine.classList.add('intro-vue');
    window.cuveeIntroVue = true;
    document.removeEventListener('keydown', auClavier);
    document.dispatchEvent(new Event('cuvee:intro-fin'));
    // focus en haut de page : la touche Tab atteint d'abord le lien d'évitement
    const corps = document.body;
    corps.setAttribute('tabindex', '-1');
    corps.focus({ preventScroll: true });
    corps.addEventListener('blur', () => corps.removeAttribute('tabindex'), { once: true });
    window.scrollTo(0, 0);
  }

  function retirer() {
    minuteries.forEach(clearTimeout);
    animations.forEach((a) => a.cancel());
    intro.remove();
  }

  // ---------- passer ----------
  function sauter() {
    if (etat === 'fin') return;
    minuteries.forEach(clearTimeout);
    animations.forEach((a) => a.pause());
    rendreLaPage();
    const sortie = intro.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-out', fill: 'forwards' });
    sortie.onfinish = retirer;
    sortie.oncancel = retirer;
  }

  function auClavier(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.preventDefault();
      sauter();
    }
  }
  document.addEventListener('keydown', auClavier);
  passer.addEventListener('click', sauter);

  // ---------- ouverture ----------
  function ouvrir() {
    if (etat !== 'attente') return;
    etat = 'ouverture';
    intro.classList.add('ouvre');

    const W = window.innerWidth;
    const H = window.innerHeight;

    // Mesures au repos (la classe « ouvre » a remis à plat le survol).
    const mouth0 = centre(bouche);
    const pr = pivot.getBoundingClientRect();
    const c0 = { x: pr.left + pr.width / 2, y: pr.top + pr.height / 2 };
    const longueur = pr.bottom - mouth0.y; // de la bouche au fond
    const echelle = Math.min(1.4, (0.8 * W) / longueur);
    const angle = 104;
    const rad = (angle * Math.PI) / 180;
    // position finale de la bouche : la bouteille inclinée est centrée à l'écran
    const cible = { x: W / 2 - 0.48 * longueur * echelle, y: H * 0.4 };
    const v = { x: mouth0.x - c0.x, y: mouth0.y - c0.y };
    const vFinal = {
      x: echelle * (v.x * Math.cos(rad) + v.y * Math.sin(rad)),
      y: echelle * (-v.x * Math.sin(rad) + v.y * Math.cos(rad)),
    };
    const tx = cible.x - c0.x - vFinal.x;
    const ty = cible.y - c0.y - vFinal.y;

    // la dérive finale tourne autour de la bouche (qui ne bouge plus)
    const dr = derive.getBoundingClientRect();
    derive.style.transformOrigin = `${mouth0.x - dr.left}px ${mouth0.y - dr.top}px`;

    // Le filet part de la bouche, tombe jusqu'en bas de l'écran.
    const hauteurFilet = Math.max(0, H - cible.y + 40);
    filet.style.left = `${cible.x}px`;
    filet.style.top = `${cible.y + 4}px`;
    filet.style.height = `${hauteurFilet}px`;
    filet.style.visibility = 'visible';

    anime(ombre, [{ opacity: 0.5 }, { opacity: 0 }], { delay: 800, duration: 500, easing: 'ease-out' });
    // 1. l'invitation s'efface
    anime(invite, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(8px)' }], { duration: 380, easing: 'ease-out' });

    // 2. la capsule se découpe, la calotte s'envole
    anime(
      coupe,
      [
        { opacity: 1, strokeDashoffset: 1 },
        { opacity: 1, strokeDashoffset: 0, offset: 0.7 },
        { opacity: 0.55, strokeDashoffset: 0 },
      ],
      { duration: 420, easing: 'cubic-bezier(.5,0,.2,1)' },
    );
    anime(
      calotte,
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: 'translate(10px,-46px) rotate(18deg)', opacity: 1, offset: 0.55 },
        { transform: 'translate(28px,-30px) rotate(60deg)', opacity: 0 },
      ],
      { delay: 300, duration: 620, easing: 'cubic-bezier(.2,.7,.3,1)' },
    );

    // 3. le bouchon saute et rebondit, puis s'efface
    anime(
      bouchon,
      [
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1, easing: 'cubic-bezier(.15,.8,.3,1)' },
        { transform: 'translate(9px,-128px) rotate(16deg)', opacity: 1, offset: 0.4, easing: 'cubic-bezier(.5,0,.9,.5)' },
        { transform: 'translate(24px,-70px) rotate(42deg)', opacity: 1, offset: 0.64, easing: 'cubic-bezier(.2,.6,.4,1)' },
        { transform: 'translate(30px,-96px) rotate(62deg)', opacity: 1, offset: 0.76, easing: 'cubic-bezier(.5,0,.9,.5)' },
        { transform: 'translate(40px,-6px) rotate(96deg)', opacity: 0 },
      ],
      { delay: 420, duration: 1050 },
    );
    anime(
      onde,
      [
        { opacity: 0.7, transform: 'scale(0.4)' },
        { opacity: 0, transform: 'scale(2.6)' },
      ],
      { delay: 420, duration: 700, easing: 'cubic-bezier(.2,.7,.3,1)' },
    );
    // petit sursaut de la bouteille quand le bouchon part
    anime(
      lift,
      [
        { transform: 'translateY(0)' },
        { transform: 'translateY(7px)', offset: 0.3 },
        { transform: 'translateY(-2px)', offset: 0.65 },
        { transform: 'translateY(0)' },
      ],
      { delay: 400, duration: 520, easing: 'ease-out' },
    );

    // 4. la bouteille s'incline vers la gauche, bouche fixe à l'écran
    const etatFinal = `translate(${tx}px, ${ty}px) rotate(-${angle}deg) scale(${echelle})`;
    anime(
      pivot,
      [
        { transform: 'translate(0px, 0px) rotate(0deg) scale(1)', easing: 'cubic-bezier(.55,.02,.25,1)' },
        { transform: etatFinal },
      ],
      { delay: 800, duration: 800 },
    );
    anime(
      derive,
      [
        { transform: 'rotate(0deg)', easing: 'cubic-bezier(.3,.6,.4,1)' },
        { transform: 'rotate(-9deg)' },
      ],
      { delay: 1500, duration: 1400 },
    );

    // 5. le filet de vin tombe
    anime(filet, [{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], {
      delay: 1450,
      duration: 420,
      easing: 'cubic-bezier(.45,0,.9,.6)',
    });

    // 6. le vin monte en vague et couvre l'écran
    const montee = anime(nappe, [{ transform: 'translate3d(0,100%,0)' }, { transform: 'translate3d(0,0,0)' }], {
      delay: 1600,
      duration: 850,
      easing: 'cubic-bezier(.55,.05,.25,1)',
    });
    // 7. le rideau se retire vers le haut
    const retrait = anime(nappe, [{ transform: 'translate3d(0,0,0)' }, { transform: 'translate3d(0,-100%,0)' }], {
      delay: 2650,
      duration: 800,
      easing: 'cubic-bezier(.65,0,.2,1)',
      fill: 'forwards',
    });
    void montee;

    // l'écran est entièrement couvert : on retire la scène du dessous
    apres(2500, () => {
      scene.style.visibility = 'hidden';
      fond.style.visibility = 'hidden';
      filet.style.visibility = 'hidden';
    });
    // le bouton disparaît avec le rideau
    anime(passer, [{ opacity: 1 }, { opacity: 0 }], { delay: 2650, duration: 380, easing: 'ease-out' });
    // la page reprend la main quand le rideau est à moitié parti : les titres entrent sous le vin qui se retire
    apres(2650 + 380, rendreLaPage);
    retrait.onfinish = retirer;
  }

  function centre(el: Element) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }

  bouteille.addEventListener('click', ouvrir);

  // Le focus est sur la bouteille (Entrée ou Espace la débouchent).
  bouteille.focus({ preventScroll: true });
}

declare global {
  interface Window {
    cuveeIntroVue?: boolean;
  }
}

export {};
