/**
 * Vérifie les interactions du site sur le serveur de dev (npm run dev, puis npm run verifier).
 * (Le succès simulé du formulaire n'existe qu'en dev : import.meta.env.DEV.)
 *
 * Couvre : intro bouteille (première visite, clic, « Passer », Échap, 2e visite, ?intro=1, mouvement réduit,
 * sans JavaScript, anneau de focus), navigation par les onglets de l'en-tête (aria-current, un seul h1,
 * ordre des titres), menu plein écran (dialog : ouverture, fermeture, Échap, focus), calculateur (/),
 * démos (/comment-ca-marche), formulaire (/pilote : erreurs et succès simulé), variante B, bouton fixe mobile,
 * absence d'erreur console sur les 8 pages, absence de défilement horizontal à 390 px,
 * contenu visible en mouvement réduit et sans JavaScript.
 *
 * Hors tests d'intro, l'intro est écartée en posant sessionStorage['cuvee-intro-vue'] avant le chargement.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const B = process.argv[2] ?? 'http://localhost:4321';
const out = 'captures';
await mkdir(out, { recursive: true });
const b = await chromium.launch();
const res = [];
const check = (nom, ok, detail = '') => res.push(`${ok ? 'OK  ' : 'ÉCHEC'} ${nom}${detail ? ' — ' + detail : ''}`);

const PAGES = ['/', '/comment-ca-marche', '/pilote', '/equipe', '/questions', '/mentions-legales', '/confidentialite', '/page-inexistante'];
const BUREAU = { viewport: { width: 1440, height: 900 } };
const MOBILE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };

/** Contexte sans intro (session déjà « vue »), sauf demande contraire. */
async function contexte(options = {}, { intro = false } = {}) {
  const c = await b.newContext({ locale: 'fr-FR', ...options });
  if (!intro) await c.addInitScript(() => { try { sessionStorage.setItem('cuvee-intro-vue', '1'); } catch {} });
  return c;
}
function surveiller(p, erreurs) {
  p.on('pageerror', (e) => erreurs.push(e.message));
  // la ressource 404 de la page « introuvable » elle-même n'est pas une erreur du site
  p.on('console', (m) => m.type() === 'error' && !/\/page-inexistante$/.test(m.location().url) && erreurs.push(`${m.text()} (${p.url()})`));
}
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
/** Descend lentement (les révélations se déclenchent), puis remonte pour réveiller celles qui étaient encore sous un rideau. */
async function defiler(p) {
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 250) {
    await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    await attendre(100);
  }
  await attendre(1500);
  for (let y = h; y > 0; y -= 250) {
    await p.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
    await attendre(60);
  }
  await attendre(1500);
}
const intro = {
  visible: (p) => p.evaluate(() => { const e = document.querySelector('[data-intro]'); return !!e && getComputedStyle(e).display !== 'none'; }),
  present: (p) => p.locator('[data-intro]').count(),
};

// ============================================================== Intro bouteille
{
  const c = await contexte({ ...BUREAU }, { intro: true });
  const p = await c.newPage();
  const errs = []; surveiller(p, errs);
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('[data-intro][data-actif]', { timeout: 5000 }).catch(() => {});
  check('Intro : visible dès la première visite', (await intro.visible(p)) && (await p.evaluate(() => document.documentElement.classList.contains('intro-active'))));
  check('Intro : le focus est sur la bouteille', await p.evaluate(() => document.activeElement?.hasAttribute('data-bouteille')));
  check('Intro : reste de la page inerte', await p.evaluate(() => document.querySelector('main')?.hasAttribute('inert') && document.querySelector('header')?.hasAttribute('inert')));
  const anneau = () => p.evaluate(() => {
    const s = getComputedStyle(document.querySelector('.i-consigne'));
    return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
  });
  await p.mouse.move(700, 450); await attendre(300);
  check('Intro : pas d’anneau de focus à l’arrivée à la souris', !(await anneau()));
  await p.keyboard.press('Tab');
  check('Intro : Tab atteint « Passer l’intro »', await p.evaluate(() => document.activeElement?.hasAttribute('data-passer')));
  await p.keyboard.press('Shift+Tab');
  await attendre(200);
  check('Intro : anneau de focus visible au clavier', await anneau());
  await p.screenshot({ path: `${out}/intro-1-attente.png` });
  const t0 = Date.now();
  await p.click('[data-bouteille]');
  await attendre(1700);
  await p.screenshot({ path: `${out}/intro-2-vin.png` });
  await p.waitForFunction(() => document.documentElement.classList.contains('intro-vue'), null, { timeout: 5000 }).catch(() => {});
  const tFin = Date.now() - t0;
  await p.waitForSelector('[data-intro]', { state: 'detached', timeout: 5000 }).catch(() => {});
  const tRetire = Date.now() - t0;
  check('Intro : clic → html.intro-vue puis overlay retiré en moins de 5 s', (await p.evaluate(() => document.documentElement.classList.contains('intro-vue'))) && (await intro.present(p)) === 0 && tRetire < 5000, `${tFin} ms / ${tRetire} ms`);
  check('Intro : classe intro-active retirée et page rendue interactive', await p.evaluate(() => !document.documentElement.classList.contains('intro-active') && !document.querySelector('main[inert], header[inert], footer[inert]') && window.scrollY === 0));
  await attendre(1500);
  check('Intro : le titre de l’accueil est révélé après l’intro', await p.evaluate(() => { const o = document.querySelector('[data-ouverture]'); return !!o?.hasAttribute('data-pret') && getComputedStyle(document.querySelector('#hero-titre')).display !== 'none'; }));
  await p.screenshot({ path: `${out}/intro-3-accueil.png` });
  // 2e visite dans la même session : pas d'intro
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' });
  check('Intro : 2e visite sans intro', !(await intro.visible(p)) && (await p.evaluate(() => document.documentElement.classList.contains('intro-vue') && !document.documentElement.classList.contains('intro-active'))));
  // ?intro=1 force l'intro
  await p.goto(B + '/?intro=1', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('[data-intro][data-actif]', { timeout: 5000 }).catch(() => {});
  check('Intro : /?intro=1 la rejoue', await intro.visible(p));
  check('Intro : aucune erreur console', errs.length === 0, errs.join(' | '));
  await c.close();
}
{
  const c = await contexte({ ...BUREAU }, { intro: true });
  const p = await c.newPage();
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('[data-intro][data-actif]', { timeout: 5000 }).catch(() => {});
  const t0 = Date.now();
  await p.click('[data-passer]');
  await p.waitForFunction(() => document.documentElement.classList.contains('intro-vue'), null, { timeout: 3000 }).catch(() => {});
  await p.waitForSelector('[data-intro]', { state: 'detached', timeout: 3000 }).catch(() => {});
  check('Intro : « Passer l’intro » rend la page en moins de 2 s', (await intro.present(p)) === 0 && (await p.evaluate(() => document.documentElement.classList.contains('intro-vue'))) && Date.now() - t0 < 2000, `${Date.now() - t0} ms`);
  await c.close();
}
{
  const c = await contexte({ ...BUREAU }, { intro: true });
  const p = await c.newPage();
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('[data-intro][data-actif]', { timeout: 5000 }).catch(() => {});
  await p.keyboard.press('Escape');
  await p.waitForSelector('[data-intro]', { state: 'detached', timeout: 3000 }).catch(() => {});
  check('Intro : Échap la passe', (await intro.present(p)) === 0 && (await p.evaluate(() => document.documentElement.classList.contains('intro-vue'))));
  await c.close();
}
{
  // Entrée au clavier sur la bouteille
  const c = await contexte({ ...BUREAU }, { intro: true });
  const p = await c.newPage();
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('[data-intro][data-actif]', { timeout: 5000 }).catch(() => {});
  await p.keyboard.press('Enter');
  await p.waitForFunction(() => document.documentElement.classList.contains('intro-vue'), null, { timeout: 6000 }).catch(() => {});
  check('Intro : Entrée sur la bouteille la débouche', await p.evaluate(() => document.documentElement.classList.contains('intro-vue')));
  await c.close();
}
{
  // Mouvement réduit : pas d'intro, tout visible
  const c = await contexte({ ...BUREAU, reducedMotion: 'reduce' }, { intro: true });
  const p = await c.newPage();
  const errs = []; surveiller(p, errs);
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  check('Mouvement réduit : pas d’intro', !(await intro.visible(p)) && (await p.evaluate(() => document.documentElement.classList.contains('intro-vue'))));
  check('Mouvement réduit : pas de classe d’animation', await p.evaluate(() => !document.documentElement.classList.contains('anim')));
  check('Mouvement réduit : titre et boutons visibles', await p.evaluate(() => ['#hero-titre', '[data-hero-cta]'].every((s) => { const e = document.querySelector(s); const st = getComputedStyle(e); return st.opacity === '1' && st.visibility === 'visible'; })));
  check('Mouvement réduit : aucun contenu masqué sur l’accueil', await p.evaluate(() => [...document.querySelectorAll('[data-reveal],[data-compteur]')].every((e) => getComputedStyle(e).opacity !== '0' && getComputedStyle(e).clipPath === 'none')));
  check('Mouvement réduit : aucune erreur console', errs.length === 0, errs.join(' | '));
  await c.close();
}
{
  // Sans JavaScript
  const c = await contexte({ ...BUREAU, javaScriptEnabled: false }, { intro: true });
  const p = await c.newPage();
  let masque = [];
  for (const chemin of PAGES) {
    await p.goto(B + chemin, { waitUntil: 'load' });
    const m = await p.evaluate(() => {
      const mauvais = [];
      if (document.querySelector('[data-intro]') && getComputedStyle(document.querySelector('[data-intro]')).display !== 'none') mauvais.push('intro');
      document.querySelectorAll('main [data-reveal],main [data-compteur],main h1,main h2').forEach((e) => {
        const s = getComputedStyle(e);
        if (s.opacity === '0' || s.visibility === 'hidden' || (s.clipPath !== 'none' && s.clipPath.includes('100%'))) mauvais.push(`${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`);
      });
      return mauvais;
    });
    if (m.length) masque.push(`${chemin}: ${[...new Set(m)].slice(0, 4).join(',')}`);
  }
  check('Sans JavaScript : aucun contenu masqué ni intro sur les 8 pages', masque.length === 0, masque.join(' | '));
  await c.close();
}

// ============================================================== Bureau (1440 px, sans intro)
{
  const c = await contexte({ ...BUREAU });
  const p = await c.newPage();
  const errs = []; surveiller(p, errs);
  const nav = 'nav[data-nav-desktop]';

  // Navigation par les onglets
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  for (const [libelle, chemin] of [['Comment ça marche', '/comment-ca-marche'], ['Le pilote', '/pilote'], ['Équipe', '/equipe'], ['Questions', '/questions'], ['Accueil', '/']]) {
    await p.click(`${nav} a.onglet:text-is("${libelle}")`);
    await p.waitForURL((u) => u.pathname.replace(/\/$/, '') === (chemin === '/' ? '' : chemin), { timeout: 5000 }).catch(() => {});
    await p.waitForLoadState('networkidle');
    const actif = await p.evaluate((n) => [...document.querySelectorAll(`${n} a[aria-current="page"]`)].map((a) => a.textContent.trim()), nav);
    check(`Onglet « ${libelle} » actif sur ${chemin}`, actif.length === 1 && actif[0] === libelle, actif.join(','));
    check(`Un seul h1 sur ${chemin}`, (await p.locator('h1').count()) === 1);
  }
  check('Logo de l’en-tête → accueil', (await p.getAttribute(`${nav} a.entete-logo`, 'href')) === '/');

  // Toutes les pages : h1 unique, ordre des titres, erreurs console, onglet actif cohérent
  for (const chemin of PAGES) {
    await p.goto(B + chemin, { waitUntil: 'networkidle' });
    const r = await p.evaluate(() => {
      const t = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => Number(h.tagName[1]));
      let saut = '';
      t.forEach((n, i) => { if (i === 0 ? n !== 1 : n > t[i - 1] + 1) saut = saut || `h${t[i - 1] ?? 0}→h${n}`; });
      const sansNom = [...document.querySelectorAll('a,button')].filter((e) => !e.closest('[inert],[hidden]') && !(e.textContent.trim() || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.querySelector('img[alt]:not([alt=""])'))).map((e) => e.outerHTML.slice(0, 60));
      return { h1: t.filter((n) => n === 1).length, saut, sansNom, titre: document.title };
    });
    check(`Titres ${chemin} : un h1, pas de saut de niveau`, r.h1 === 1 && !r.saut, r.saut || `${r.h1} h1`);
    check(`Liens et boutons nommés ${chemin}`, r.sansNom.length === 0, r.sansNom.join(' | '));
    check(`Titre de page ${chemin}`, /Cuvée/.test(r.titre), r.titre);
  }
  await p.goto(B + '/page-inexistante', { waitUntil: 'networkidle' });
  check('404 : aucun onglet marqué actif', (await p.locator(`${nav} a[aria-current="page"]`).count()) === 0);

  // Indicateur d'onglet glissant + en-tête plein au défilement
  await p.goto(B + '/questions', { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  const posIndic = async () => p.evaluate(() => { const i = document.querySelector('[data-indicateur]').getBoundingClientRect(); return { x: i.x, w: i.width }; });
  const lienQ = await p.evaluate(() => { const r = document.querySelector('nav[data-nav-desktop] a[aria-current="page"]').getBoundingClientRect(); return { x: r.x, w: r.width }; });
  const ind0 = await posIndic();
  check('Indicateur aligné sur l’onglet actif', Math.abs(ind0.x - lienQ.x) < 2 && Math.abs(ind0.w - (lienQ.w - 3)) < 2, JSON.stringify([ind0, lienQ]));
  await p.hover(`${nav} a.onglet:text-is("Équipe")`);
  await p.waitForTimeout(700);
  const ind1 = await posIndic();
  const lienE = await p.evaluate(() => [...document.querySelectorAll('nav[data-nav-desktop] a.onglet')].find((a) => a.textContent.trim() === 'Équipe').getBoundingClientRect().x);
  check('Indicateur suit le survol', Math.abs(ind1.x - lienE) < 2, `${ind1.x} vs ${lienE}`);
  await p.mouse.move(700, 600);
  await p.waitForTimeout(700);
  check('Indicateur revient à l’onglet actif', Math.abs((await posIndic()).x - lienQ.x) < 2);
  check('En-tête transparent en haut de page', (await p.getAttribute('[data-entete]', 'data-plein')) === 'false');
  await p.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' })); await p.waitForTimeout(500);
  check('En-tête sur fond crème après défilement', (await p.getAttribute('[data-entete]', 'data-plein')) === 'true');
  check('Barre de lecture avancée', parseFloat(await p.evaluate(() => getComputedStyle(document.querySelector('[data-progression]')).getPropertyValue('--p'))) > 0);
  await p.evaluate(() => window.scrollTo({ top: 1400, behavior: 'instant' })); await p.waitForTimeout(100);
  await p.evaluate(() => window.scrollBy({ top: 200, behavior: 'instant' })); await p.waitForTimeout(500);
  check('En-tête masqué en descendant', (await p.getAttribute('[data-entete]', 'data-cache')) === 'true');
  await p.evaluate(() => window.scrollBy({ top: -200, behavior: 'instant' })); await p.waitForTimeout(500);
  check('En-tête réapparaît en remontant', (await p.getAttribute('[data-entete]', 'data-cache')) === 'false');
  check('Bouton d’en-tête → /pilote#inscription', (await p.getAttribute('header a.entete-cta-xl', 'href')) === '/pilote#inscription');
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  check('Aucun lien #inscription orphelin sur l’accueil', (await p.locator('a[href="#inscription"]').count()) === 0);
  check('Bouton fixe mobile invisible sur grand écran', !(await p.isVisible('[data-cta-mobile]')));
  await p.keyboard.press('Tab');
  check('Premier Tab = lien d’évitement', (await p.evaluate(() => document.activeElement?.textContent?.trim())) === 'Aller au contenu');
  // Clavier de bout en bout sur l'accueil : un tour de Tab traverse l'en-tête, le contenu et le pied de page,
  // chaque cible est visible, rien ne piège le focus (on revient sur le lien d'évitement).
  const tour = [];
  let revenu = false;
  for (let i = 0; i < 120 && !revenu; i++) {
    await p.keyboard.press('Tab');
    await attendre(40);
    const cible = await p.evaluate(() => {
      const e = document.activeElement;
      if (!e || e === document.body) return null;
      const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
      const opaque = (n) => { for (; n && n !== document.documentElement; n = n.parentElement) if (parseFloat(getComputedStyle(n).opacity) < 0.5) return false; return true; };
      return { nom: `${e.tagName}${e.getAttribute('href') ?? e.id ?? ''}@${Math.round(r.top + scrollY)}`, visible: r.width > 0 && r.height > 0 && s.visibility === 'visible' && opaque(e), bas: r.bottom };
    });
    if (!cible) revenu = i > 0;
    else {
      if (!cible.visible) { await attendre(1700); cible.visible = await p.evaluate(() => { for (let n = document.activeElement; n && n !== document.documentElement; n = n.parentElement) if (parseFloat(getComputedStyle(n).opacity) < 0.5) return false; return true; }); }
      tour.push(cible);
    }
  }
  check('Clavier / : un tour de Tab (≥ 25 cibles) revient au début, toutes visibles', revenu && tour.length >= 25 && tour.every((t) => t.visible), `${tour.length} cibles${tour.filter((t) => !t.visible).map((t) => ' invisible:' + t.nom).join('')}`);

  // Menu plein écran sur grand écran : volet d'image selon l'onglet visé
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  await p.click('[data-menu-ouvrir]');
  await p.waitForSelector('dialog[data-menu][data-etat="ouvert"]', { timeout: 3000 }).catch(() => {});
  await p.waitForTimeout(1300);
  check('Menu (bureau) : ouvert avec panneau d’image', (await p.evaluate(() => document.querySelector('[data-menu]').open)) && (await p.isVisible('[data-menu-visuel]')));
  await p.hover('[data-menu] a[href="/equipe"]');
  await p.waitForTimeout(300);
  check('Menu (bureau) : l’image suit l’onglet survolé', await p.evaluate(() => document.querySelector('[data-menu-visuel] img.est-actif')?.dataset.src?.includes('comptoir-soir')));
  await p.screenshot({ path: `${out}/desktop-menu.png` });
  await p.keyboard.press('Escape'); await p.waitForTimeout(900);
  check('Menu (bureau) : Échap ferme', !(await p.evaluate(() => document.querySelector('[data-menu]').open)));

  // Calculateur
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  await p.fill('#calc-stock', '25.000 €');
  await p.fill('#calc-heures', '4h30');
  await p.waitForTimeout(100);
  const t = (await p.textContent('[data-calc-tresorerie]')).replace(/\s/g, ' ');
  const h = (await p.textContent('[data-calc-heures-an]')).replace(/\s/g, ' ');
  check('Calcul 25.000 € × 15 %', t.trim() === '3 750 €', t);
  check('Calcul 4h30 × 48', h.trim() === '216 h', h);
  check('Badge « Valeurs d’exemple » masqué après saisie', await p.isHidden('[data-calc-exemple]'));
  await p.fill('#calc-stock', '');
  check('Champ vide → tiret', (await p.textContent('[data-calc-tresorerie]')).trim() === '—');
  await p.waitForTimeout(800);
  check('Résumé lecteur d’écran', ((await p.textContent('[data-calc-resume]')) || '').includes('Temps sur une année'), await p.textContent('[data-calc-resume]'));

  // Démo (page Comment ça marche)
  await p.goto(B + '/comment-ca-marche', { waitUntil: 'networkidle' });
  await p.click('#exemples article:nth-of-type(2) [data-demo-action="valider"]');
  check('Démo : tampon après validation', await p.evaluate(() => document.querySelectorAll('#exemples article')[1].classList.contains('est-valide')));
  check('Démo : message de statut lu', ((await p.textContent('#exemples article:nth-of-type(2) [data-demo-statut]')) || '').length > 0);

  // Formulaire : erreurs puis succès simulé (page Pilote)
  await p.goto(B + '/pilote', { waitUntil: 'networkidle' });
  await p.click('[data-envoyer]');
  const focus = await p.evaluate(() => document.activeElement?.id);
  check('Envoi vide → focus 1er champ', focus === 'f-nom', focus);
  check('Message d’erreur affiché', ((await p.textContent('#f-nom-erreur')) || '').length > 0);
  check('aria-invalid posé', (await p.getAttribute('#f-email', 'aria-invalid')) === 'true');
  await p.fill('#f-nom', 'Camille Martin');
  await p.fill('#f-lieu', 'Le Comptoir test');
  await p.selectOption('#f-type', 'bar-a-vin');
  await p.fill('#f-ville', 'Lyon');
  await p.selectOption('#f-references', '100 à 250');
  await p.selectOption('#f-caisse', 'autre');
  check('Caisse « autre » → champ « Lequel ? »', await p.isVisible('#f-caisse-autre'));
  await p.fill('#f-email', 'pas-un-email');
  await p.click('[data-envoyer]');
  check('Email invalide détecté', ((await p.textContent('#f-email-erreur')) || '').includes('valide'));
  check('Caisse autre requise', ((await p.textContent('#f-caisse-autre-erreur')) || '').length > 0);
  await p.fill('#f-caisse-autre', 'Caisse maison');
  await p.fill('#f-email', 'camille@example.com');
  await p.click('[data-envoyer]');
  await p.waitForSelector('[data-form-succes]:not([hidden])', { timeout: 3000 }).catch(() => {});
  check('Succès simulé en local', await p.isVisible('[data-form-succes]'), await p.textContent('[data-succes-titre]'));
  check('Succès : le focus passe au message', await p.evaluate(() => document.activeElement?.hasAttribute('data-succes-titre')));
  await p.locator('#inscription').screenshot({ path: `${out}/form-succes.png` });
  // Clavier de bout en bout sur le formulaire : chaque champ obligatoire est atteignable avec Tab
  await p.goto(B + '/pilote', { waitUntil: 'networkidle' });
  await p.focus('#f-nom');
  const ids = [];
  for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); ids.push(await p.evaluate(() => document.activeElement?.id || document.activeElement?.tagName)); }
  check('Clavier /pilote : Tab parcourt tous les champs jusqu’au bouton', ['f-lieu', 'f-type', 'f-ville', 'f-references', 'f-caisse', 'f-email', 'f-tel', 'f-temps'].every((i) => ids.includes(i)) && ids.includes('BUTTON'), ids.join(','));

  check('Pas d’erreur console (bureau)', errs.length === 0, errs.join(' | '));
  await c.close();
}

// ============================================================== Variante B
{
  const c = await contexte({ ...BUREAU });
  const p = await c.newPage();
  await p.goto(B + '/?v=b', { waitUntil: 'networkidle' });
  const norm = (s) => s.replace(/\s+/g, ' ').trim();
  const titreB = norm(await p.evaluate(() => [...document.querySelectorAll('#hero-titre .titre-b')].map((e) => e.textContent).join('')));
  check('Variante B : texte du titre B', titreB.startsWith('Et si vos commandes'), titreB);
  check('Variante B : titre A masqué, B affiché', await p.evaluate(() => getComputedStyle(document.querySelector('.titre-a')).display === 'none' && getComputedStyle(document.querySelector('.titre-b')).display !== 'none'));
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  check('Variante A par défaut', await p.evaluate(() => getComputedStyle(document.querySelector('.titre-b')).display === 'none' && document.documentElement.dataset.variante === 'a'));
  await p.goto(B + '/pilote?v=b&utm_source=test', { waitUntil: 'networkidle' });
  check('Champ caché variante = b', (await p.inputValue('input[data-variante]')) === 'b');
  check('utm_source capté', (await p.inputValue('[data-utm="utm_source"]')) === 'test');
  await c.close();
}

// ============================================================== Mobile (390 px)
{
  const c = await contexte({ ...MOBILE });
  const p = await c.newPage();
  const errs = []; surveiller(p, errs);
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  check('Barre fixe masquée et inerte en haut', (await p.getAttribute('[data-cta-mobile]', 'data-visible')) === 'false' && (await p.evaluate(() => document.querySelector('[data-cta-mobile]').hasAttribute('inert'))));
  await p.evaluate(() => window.scrollTo({ top: 2600, behavior: 'instant' })); await p.waitForTimeout(600);
  check('Barre fixe visible après le hero', (await p.getAttribute('[data-cta-mobile]', 'data-visible')) === 'true' && (await p.evaluate(() => !document.querySelector('[data-cta-mobile]').hasAttribute('inert'))));
  await p.screenshot({ path: `${out}/mobile-barre.png` });
  await p.evaluate(() => document.querySelector('[data-page-cta]').scrollIntoView({ behavior: 'instant' })); await p.waitForTimeout(600);
  check('Barre fixe masquée sur le bloc d’appel', (await p.getAttribute('[data-cta-mobile]', 'data-visible')) === 'false');
  await p.goto(B + '/comment-ca-marche', { waitUntil: 'networkidle' });
  await p.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' })); await p.waitForTimeout(600);
  check('Barre fixe visible sur une page intérieure', (await p.getAttribute('[data-cta-mobile]', 'data-visible')) === 'true');
  await p.goto(B + '/pilote', { waitUntil: 'networkidle' });
  check('Barre fixe absente sur /pilote', (await p.locator('[data-cta-mobile]').count()) === 0);

  // Menu plein écran
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  check('Menu mobile : bouton fermé par défaut (aria-expanded=false)', (await p.getAttribute('[data-menu-ouvrir]', 'aria-expanded')) === 'false');
  await p.click('[data-menu-ouvrir]');
  await p.waitForSelector('dialog[data-menu][data-etat="ouvert"]', { timeout: 3000 }).catch(() => {});
  await p.waitForTimeout(1300);
  check('Menu mobile ouvert (dialog modal)', (await p.evaluate(() => document.querySelector('[data-menu]').open)) && (await p.isVisible('[data-menu] nav')) && (await p.getAttribute('[data-menu-ouvrir]', 'aria-expanded')) === 'true');
  await p.screenshot({ path: `${out}/mobile-menu.png` });
  const boite = await p.evaluate(() => { const r = document.querySelector('[data-menu]').getBoundingClientRect(); return [r.width, r.height, window.innerWidth, window.innerHeight]; });
  check('Menu mobile plein écran', boite[0] === boite[2] && boite[1] === boite[3], boite.join('x'));
  check('Menu mobile : défilement de page bloqué', await p.evaluate(() => getComputedStyle(document.documentElement).overflow === 'hidden'));
  check('Menu mobile : focus dans le menu', await p.evaluate(() => !!document.activeElement?.closest('[data-menu]')));
  let piege = true;
  for (let i = 0; i < 14; i++) { await p.keyboard.press('Tab'); piege = piege && (await p.evaluate(() => !!document.activeElement?.closest('[data-menu]'))); }
  check('Menu mobile : focus piégé dans le menu', piege);
  await p.keyboard.press('Escape'); await p.waitForTimeout(900);
  check('Menu mobile : Échap ferme et rend le focus au bouton', !(await p.evaluate(() => document.querySelector('[data-menu]').open)) && (await p.evaluate(() => document.activeElement?.hasAttribute('data-menu-ouvrir'))) && (await p.getAttribute('[data-menu-ouvrir]', 'aria-expanded')) === 'false');
  check('Menu mobile : défilement rétabli après fermeture', await p.evaluate(() => getComputedStyle(document.documentElement).overflow !== 'hidden'));
  await p.click('[data-menu-ouvrir]'); await p.waitForTimeout(1300);
  await p.click('[data-menu-fermer]'); await p.waitForTimeout(900);
  check('Menu mobile : « Fermer » ferme', !(await p.evaluate(() => document.querySelector('[data-menu]').open)));
  await p.click('[data-menu-ouvrir]'); await p.waitForTimeout(1300);
  await p.click('[data-menu] a[href="/questions"]'); await p.waitForURL('**/questions**'); await p.waitForTimeout(500);
  check('Menu mobile : navigation vers /questions', new URL(p.url()).pathname.startsWith('/questions'));
  await p.click('[data-menu-ouvrir]'); await p.waitForTimeout(1300);
  check('Menu mobile : onglet actif', ((await p.locator('[data-menu] a[aria-current="page"]').textContent()) || '').includes('Questions'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(900);

  // Pas de débordement horizontal, révélations déclenchées
  const deb = [];
  const cache = [];
  for (const chemin of PAGES) {
    await p.goto(B + chemin, { waitUntil: 'networkidle' });
    await defiler(p);
    const d = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (d > 0) deb.push(`${chemin}: +${d}px`);
    // (les cartes du rail horizontal de l'accueil, hors écran à droite, se révèlent quand on fait glisser le rail)
    const nonRevele = await p.evaluate(() => [...document.querySelectorAll('main [data-reveal]:not(.est-visible)')].filter((e) => !e.closest('[hidden]') && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().left < window.innerWidth).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`));
    if (nonRevele.length) cache.push(`${chemin}: ${[...new Set(nonRevele)].slice(0, 4).join(',')}`);
  }
  check('Pas de débordement horizontal à 390 px sur les 8 pages', deb.length === 0, deb.join(' | '));
  check('Mobile : toutes les révélations se déclenchent au défilement', cache.length === 0, cache.join(' | '));
  check('Pas d’erreur console (mobile)', errs.length === 0, errs.join(' | '));
  await c.close();
}

await b.close();
console.log(res.join('\n'));
const echecs = res.filter((r) => r.startsWith('ÉCHEC')).length;
console.log(`\n${res.length - echecs}/${res.length} vérifications réussies.`);
if (echecs) process.exitCode = 1;
