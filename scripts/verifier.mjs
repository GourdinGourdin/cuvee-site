/**
 * Vérifie les interactions du site sur le serveur de dev (npm run dev, puis npm run verifier) :
 * navigation entre onglets, calculateur (/), démos (/comment-ca-marche), formulaire (/pilote, succès simulé en local),
 * variante B, menu et bouton fixe mobiles.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const B = process.argv[2] ?? 'http://localhost:4321';
const out = 'captures';
await mkdir(out, { recursive: true });
const b = await chromium.launch();
const res = [];
const check = (nom, ok, detail = '') => res.push(`${ok ? 'OK  ' : 'ÉCHEC'} ${nom}${detail ? ' — ' + detail : ''}`);

// --- Desktop
{
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()));
  // Navigation entre onglets
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  for (const [libelle, chemin] of [['Comment ça marche', '/comment-ca-marche'], ['Le pilote', '/pilote'], ['Équipe', '/equipe'], ['Questions', '/questions'], ['Accueil', '/']]) {
    await p.click(`header nav[aria-label="Navigation principale"].hidden a:text-is("${libelle}")`);
    await p.waitForURL((u) => u.pathname.replace(/\/$/, '') === (chemin === '/' ? '' : chemin), { timeout: 5000 }).catch(() => {});
    await p.waitForLoadState('networkidle');
    const actif = await p.evaluate(() => [...document.querySelectorAll('header nav.hidden a[aria-current="page"]')].map((a) => a.textContent.trim()));
    check(`Onglet « ${libelle} » actif sur ${chemin}`, actif.length === 1 && actif[0] === libelle, actif.join(','));
    check(`Un seul h1 sur ${chemin}`, (await p.locator('h1').count()) === 1);
  }
  check('Bouton d’en-tête → /pilote#inscription', (await p.getAttribute('header a.btn-primaire', 'href')) === '/pilote#inscription');
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  check('Aucun lien #inscription orphelin sur l’accueil', (await p.locator('a[href="#inscription"]').count()) === 0);
  await p.keyboard.press('Tab');
  check('Premier Tab = lien d’évitement', (await p.evaluate(() => document.activeElement?.textContent?.trim())) === 'Aller au contenu');

  // Calculateur
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

  // Formulaire : envoi vide (page Pilote)
  await p.goto(B + '/pilote', { waitUntil: 'networkidle' });
  await p.click('[data-envoyer]');
  const focus = await p.evaluate(() => document.activeElement?.id);
  check('Envoi vide → focus 1er champ', focus === 'f-nom', focus);
  check('Message d’erreur affiché', ((await p.textContent('#f-nom-erreur')) || '').length > 0);
  check('aria-invalid posé', (await p.getAttribute('#f-email', 'aria-invalid')) === 'true');
  // Email invalide puis remplissage complet
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
  await p.locator('#inscription').screenshot({ path: `${out}/form-succes.png` });
  check('Pas d’erreur console (desktop)', errs.length === 0, errs.join(' | '));
  await c.close();
}

// --- Variante B
{
  const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto(B + '/?v=b', { waitUntil: 'networkidle' });
  const h1 = (await p.innerText('#hero-titre')).trim();
  check('Variante B affichée', h1.startsWith('Et si'), h1);
  await p.goto(B + '/pilote?v=b&utm_source=test', { waitUntil: 'networkidle' });
  check('Champ caché variante = b', (await p.inputValue('input[data-variante]')) === 'b');
  check('utm_source capté', (await p.inputValue('[data-utm="utm_source"]')) === 'test');
  await c.close();
}

// --- Mobile
{
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const p = await c.newPage();
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  check('Barre fixe masquée en haut', (await p.getAttribute('[data-cta-mobile]', 'data-visible')) === 'false');
  await p.evaluate(() => window.scrollTo({ top: 2600, behavior: 'instant' })); await p.waitForTimeout(500);
  check('Barre fixe visible après le hero', (await p.getAttribute('[data-cta-mobile]', 'data-visible')) === 'true');
  await p.screenshot({ path: `${out}/mobile-barre.png` });
  await p.evaluate(() => document.querySelector('[data-page-cta]').scrollIntoView({ behavior: 'instant' })); await p.waitForTimeout(500);
  check('Barre fixe masquée sur le bloc d’appel', (await p.getAttribute('[data-cta-mobile]', 'data-visible')) === 'false');
  await p.goto(B + '/comment-ca-marche', { waitUntil: 'networkidle' });
  await p.evaluate(() => window.scrollTo({ top: 1500, behavior: 'instant' })); await p.waitForTimeout(500);
  check('Barre fixe visible sur une page intérieure', (await p.getAttribute('[data-cta-mobile]', 'data-visible')) === 'true');
  await p.goto(B + '/pilote', { waitUntil: 'networkidle' });
  check('Barre fixe absente sur /pilote', (await p.locator('[data-cta-mobile]').count()) === 0);
  await p.goto(B + '/', { waitUntil: 'networkidle' });
  await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(300);
  await p.click('[data-menu] summary');
  check('Menu mobile ouvert', await p.isVisible('[data-menu] nav'));
  await p.screenshot({ path: `${out}/mobile-menu.png` });
  await p.click('[data-menu] a[href="/questions"]'); await p.waitForURL('**/questions**'); await p.waitForTimeout(300);
  check('Menu mobile : navigation vers /questions', new URL(p.url()).pathname.startsWith('/questions'));
  check('Menu mobile : onglet actif', (await p.locator('[data-menu] a[aria-current="page"]').textContent()).trim() === 'Questions');
  const deb = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check('Pas de débordement horizontal (390 px)', deb <= 0, String(deb));
  for (const chemin of ['/', '/comment-ca-marche', '/pilote', '/equipe', '/questions']) {
    await p.goto(B + chemin, { waitUntil: 'networkidle' });
    const d = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`Pas de débordement sur ${chemin} (mobile)`, d <= 0, String(d));
  }
  await c.close();
}
await b.close();
console.log(res.join('\n'));
if (res.some((r) => r.startsWith('ÉCHEC'))) process.exitCode = 1;
