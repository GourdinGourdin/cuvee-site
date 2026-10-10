/**
 * Vérifie les interactions du site sur le serveur de dev (npm run dev, puis npm run verifier).
 * (Le succès simulé du formulaire n'existe qu'en dev : import.meta.env.DEV.)
 *
 * Couvre : accueil sans intro (l'intro bouteille a été supprimée), navigation par les onglets de l'en-tête (aria-current, un seul h1,
 * ordre des titres), menu plein écran (dialog : ouverture, fermeture, Échap, focus), calculateur (/),
 * démos (/comment-ca-marche), formulaire (/pilote : erreurs et succès simulé), variante B, bouton fixe mobile,
 * contenu visible en mouvement réduit et sans JavaScript, et les contrôles de la refonte (section « Refonte ») :
 * débordement horizontal à 360/768/1024/1440/1920 px, zéro erreur/warning console, un h1 par page,
 * au plus 2 .signature visibles (pied de page exclu), images /media/ en <picture> AVIF/WebP, paragraphes en Outfit,
 * view-transition-name des transitions de page.
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

async function contexte(options = {}) {
  return b.newContext({ locale: 'fr-FR', ...options });
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
// ============================================================== Accueil sans intro
{
  const c = await contexte({ ...BUREAU });
  const p = await c.newPage();
  const errs = []; surveiller(p, errs);
  const t0 = Date.now();
  await p.goto(B + '/', { waitUntil: 'domcontentloaded' });
  const h1ok = await p.locator('h1').first().waitFor({ state: 'visible', timeout: 2000 }).then(() => true).catch(() => false);
  check('Accueil : h1 visible en moins de 2 s', h1ok, `${Date.now() - t0} ms`);
  await p.waitForLoadState('networkidle');
  check('Accueil : aucun élément [data-intro], aucun html.intro-*', await p.evaluate(() => document.querySelectorAll('[data-intro]').length === 0 && ![...document.documentElement.classList].some((k) => k.startsWith('intro-'))));
  check('Accueil : ni overlay plein écran ni contenu inerte', await p.evaluate(() => !document.querySelector('main[inert], header[inert], footer[inert]') && ![...document.body.children].some((e) => { const s = getComputedStyle(e); return s.position === 'fixed' && e.getBoundingClientRect().width >= innerWidth - 2 && e.getBoundingClientRect().height >= innerHeight - 2 && s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0 && e.tagName !== 'DIALOG' && !e.hasAttribute('data-menu'); })));
  check('Accueil : aucune erreur console', errs.length === 0, errs.join(' | '));
  await c.close();
}
{
  // Mouvement réduit : tout visible
  const c = await contexte({ ...BUREAU, reducedMotion: 'reduce' });
  const p = await c.newPage();
  const errs = []; surveiller(p, errs);
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  check('Mouvement réduit : pas de classe d’animation', await p.evaluate(() => !document.documentElement.classList.contains('anim')));
  check('Mouvement réduit : titre et boutons visibles', await p.evaluate(() => ['#hero-titre', '[data-hero-cta]'].every((s) => { const e = document.querySelector(s); const st = getComputedStyle(e); return st.opacity === '1' && st.visibility === 'visible'; })));
  check('Mouvement réduit : aucun contenu masqué sur l’accueil', await p.evaluate(() => [...document.querySelectorAll('[data-reveal],[data-compteur]')].every((e) => getComputedStyle(e).opacity !== '0' && getComputedStyle(e).clipPath === 'none')));
  check('Mouvement réduit : aucune erreur console', errs.length === 0, errs.join(' | '));
  await c.close();
}
{
  // Sans JavaScript
  const c = await contexte({ ...BUREAU, javaScriptEnabled: false });
  const p = await c.newPage();
  let masque = [];
  for (const chemin of PAGES) {
    await p.goto(B + chemin, { waitUntil: 'load' });
    const m = await p.evaluate(() => {
      const mauvais = [];
      document.querySelectorAll('main [data-reveal],main [data-compteur],main h1,main h2').forEach((e) => {
        const s = getComputedStyle(e);
        if (s.opacity === '0' || s.visibility === 'hidden' || (s.clipPath !== 'none' && s.clipPath.includes('100%'))) mauvais.push(`${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`);
      });
      return mauvais;
    });
    if (m.length) masque.push(`${chemin}: ${[...new Set(m)].slice(0, 4).join(',')}`);
  }
  check('Sans JavaScript : aucun contenu masqué sur les 8 pages', masque.length === 0, masque.join(' | '));
  await c.close();
}

// ============================================================== Bureau (1440 px)
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

// ============================================================== Refonte : mise en page, médias, polices, transitions
{
  const LARGEURS = [360, 768, 1024, 1440, 1920];
  const debordements = [];
  for (const w of LARGEURS) {
    const c = await contexte({ viewport: { width: w, height: w < 700 ? 760 : 900 } });
    const p = await c.newPage();
    for (const chemin of PAGES) {
      await p.goto(B + chemin, { waitUntil: 'networkidle' });
      await defiler(p);
      const d = await p.evaluate(() => {
        const e = document.documentElement.scrollWidth - innerWidth;
        if (e <= 0) return { e, qui: '' };
        const qui = [...document.querySelectorAll('body *')].filter((n) => n.getBoundingClientRect().right > innerWidth + 0.5 && getComputedStyle(n).position !== 'fixed').slice(0, 3).map((n) => `${n.tagName.toLowerCase()}.${String(n.className).split(' ')[0]}`).join(',');
        return { e, qui };
      });
      if (d.e > 0) debordements.push(`${w}px ${chemin}: +${d.e}px (${d.qui})`);
    }
    await c.close();
  }
  check('Aucun débordement horizontal à 360/768/1024/1440/1920 px sur les 8 pages', debordements.length === 0, debordements.join(' | '));
}
{
  // Console (erreurs ET warnings) + h1 + signatures + images + polices, 1440 px
  const c = await contexte({ ...BUREAU });
  const p = await c.newPage();
  const bruit = [];
  p.on('pageerror', (e) => bruit.push(`pageerror ${e.message}`));
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !/\/page-inexistante$/.test(m.location().url)) bruit.push(`${m.type()} ${m.text()} (${p.url()})`); });
  const h1s = [], sigs = [], images = [], polices = [];
  for (const chemin of PAGES) {
    await p.goto(B + chemin, { waitUntil: 'networkidle' });
    await defiler(p);
    const r = await p.evaluate(() => {
      const visible = (e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0 && r.width > 0 && r.height > 0 && !e.closest('[hidden],[inert],dialog:not([open])'); };
      const signatures = [...document.querySelectorAll('.signature')].filter(visible);
      const hors = signatures.filter((e) => !e.closest('footer'));
      const imgs = [...document.querySelectorAll('img')].filter((i) => /\/media\//.test(i.getAttribute('src') || i.dataset.src || ''));
      const mauvaisesImages = imgs.filter((i) => {
        const pic = i.closest('picture');
        const types = pic ? [...pic.querySelectorAll('source')].map((s) => s.type) : [];
        return !(types.includes('image/avif') && types.includes('image/webp'));
      }).map((i) => i.getAttribute('src') || i.dataset.src);
      const outfit = (e) => /^\s*["']?Outfit/.test(getComputedStyle(e).fontFamily);
      // Josefin Sans reste légitime pour les petites capitales (surtitres, badges, étiquettes, boutons, liens en capitales)
      const etiquette = (e) => e.closest('.surtitre,.badge,.btn,.lien-cap,.etiquette-champ,.signature,.tampon,.cachet,[class*="surtitre"]');
      const mauvaisesPolices = [...document.querySelectorAll('main p, footer p, main li, main dd')].filter(visible).filter((e) => !etiquette(e) && !outfit(e)).map((e) => `${getComputedStyle(e).fontFamily.split(',')[0]}:${String(e.className).slice(0, 30) || e.textContent.slice(0, 20)}`);
      return { h1: document.querySelectorAll('h1').length, nSig: signatures.length, nSigHors: hors.length, textes: signatures.map((e) => `${e.closest('footer') ? 'footer:' : ''}${e.textContent.trim()}`), mauvaisesImages, nImg: imgs.length, mauvaisesPolices, fontsOk: document.fonts.check('16px Outfit') };
    });
    if (r.h1 !== 1) h1s.push(`${chemin}: ${r.h1}`);
    // Le pied de page est exclu du plafond : sa signature « assistant de cave » est une signature de marque présente partout (max 1),
    // la charte vise les signatures décoratives de contenu (en-tête de page + appel final). Total pied compris signalé dans le détail.
    if (r.nSigHors > 2 || r.nSig - r.nSigHors > 1) sigs.push(`${chemin}: ${r.nSigHors} hors pied + ${r.nSig - r.nSigHors} pied (${r.textes.join(' / ')})`);
    if (r.mauvaisesImages.length) images.push(`${chemin}: ${r.mauvaisesImages.slice(0, 3).join(',')}`);
    if (r.mauvaisesPolices.length) polices.push(`${chemin}: ${[...new Set(r.mauvaisesPolices)].slice(0, 3).join(',')}`);
  }
  check('Console : zéro erreur et zéro warning sur les 8 pages (1440 px)', bruit.length === 0, bruit.slice(0, 4).join(' | '));
  check('Un seul h1 par page (8 pages)', h1s.length === 0, h1s.join(' | '));
  check('Au plus 2 .signature visibles par page hors pied de page (et 1 dans le pied)', sigs.length === 0, sigs.join(' | '));
  check('Images /media/ servies par <picture> AVIF + WebP', images.length === 0, images.join(' | '));
  check('Polices : les paragraphes sont en Outfit', polices.length === 0, polices.join(' | '));
  await c.close();
}
{
  // Transitions de page : view-transition-name présents sur l'accueil et sur la page cible
  const c = await contexte({ ...BUREAU });
  const p = await c.newPage();
  const noms = () => p.evaluate(() => [...document.querySelectorAll('img,video,picture,figure,div,a')].map((e) => getComputedStyle(e).viewTransitionName).filter((n) => n && n !== 'none'));
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  const accueil = await noms();
  const manque = ['media-comment-ca-marche', 'media-pilote', 'media-equipe'].filter((n) => !accueil.includes(n));
  check('Transitions : les 3 view-transition-name sont sur l’accueil', manque.length === 0, `manque ${manque.join(',')} (présents : ${accueil.join(',')})`);
  for (const [nom, chemin] of [['media-comment-ca-marche', '/comment-ca-marche'], ['media-pilote', '/pilote'], ['media-equipe', '/equipe']]) {
    await p.goto(B + chemin, { waitUntil: 'networkidle' });
    check(`Transitions : ${nom} sur ${chemin}`, (await noms()).includes(nom), (await noms()).join(','));
  }
  await c.close();
}

await b.close();
console.log(res.join('\n'));
const echecs = res.filter((r) => r.startsWith('ÉCHEC')).length;
console.log(`\n${res.length - echecs}/${res.length} vérifications réussies.`);
if (echecs) process.exitCode = 1;
