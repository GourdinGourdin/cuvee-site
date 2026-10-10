# Cuvée : site du programme pilote

Site vitrine statique (Astro et Tailwind CSS v4). Il sert à recruter des lieux pilotes et à tester le message.
Cinq onglets (Accueil, Comment ça marche, Pilote, Équipe, Questions), plus les pages Mentions légales, Confidentialité et 404.

## Lancer en local

Il faut Node.js 22.12 ou plus récent.

```bash
npm install
npm run dev          # http://localhost:4321
npm run build        # génère dist/ et liste les [À COMPLÉTER] restants
npm run preview      # sert dist/ en local
npm run captures     # captures mobile et desktop dans captures/ (site lancé au préalable)
npm run images       # régénère public/og-image.png et public/apple-touch-icon.png
npm run medias       # génère les variantes AVIF/WebP de public/media/*.jpg (public/media/opt/, manifeste src/data/medias.ts)
npm run verifier     # suite de tests Playwright (site lancé sur :4321)
```

## Avant la mise en ligne

1. **Remplir les `[À COMPLÉTER : …]`.** Ils sont surlignés en jaune sur la page, et `npm run build` affiche leur nombre par page.
2. **Brancher le formulaire.**
   - Créer un formulaire sur [Formspree](https://formspree.io).
   - Copier son adresse dans `PUBLIC_FORM_ENDPOINT` : dans `.env` en local (voir `.env.example`) et dans les variables d'environnement de l'hébergeur.
   - Sans cette variable, l'envoi est simulé en local seulement ; en production, le visiteur voit un message d'erreur avec l'email de contact.
3. **Renseigner `emailContact`** dans `src/data/site.ts`.
4. **Ouvrir l'indexation** : passer `indexable` à `true` dans `src/data/site.ts`. Tant qu'il vaut `false`, la page porte une balise `noindex` et `robots.txt` interdit l'exploration.

## Tester le message

- `/?v=b` affiche le second titre du hero (« Et si vos commandes aux domaines étaient prêtes dès le lundi matin ? ») au lieu du titre principal.
- Chaque inscription transmet :
  - la variante vue (`variante_titre`) ;
  - `utm_source`, `utm_medium` et `utm_campaign` s'ils sont présents dans l'URL.

Exemple de lien à diffuser :

```
https://votre-site/?v=b&utm_source=instagram&utm_campaign=pilote
```

## Déployer

Les deux hébergeurs détectent Astro automatiquement. L'URL publique (balises Open Graph et sitemap) est aussi détectée ; sinon, définir `SITE_URL`.

- **Vercel** :
  - importer le dépôt sur vercel.com ;
  - ajouter `PUBLIC_FORM_ENDPOINT` dans Settings > Environment Variables ;
  - déployer. En ligne de commande : `npx vercel` puis `npx vercel --prod`.
- **Netlify** :
  - importer le dépôt sur netlify.com (build : `npm run build`, dossier publié : `dist`) ;
  - ajouter `PUBLIC_FORM_ENDPOINT` dans Site configuration > Environment variables.

## Où modifier quoi

| Quoi | Où |
| --- | --- |
| Charte graphique (typographie, couleurs, espacements, composants) | `docs/charte.md` ; implémentation : `src/styles/global.css` (kit médias plein cadre : `maison.css` ; transitions : `animations.css`) |
| Photos (AVIF/WebP responsive) et vidéos | `src/components/Photo.astro`, `src/components/maison/Video.astro` ; après ajout d’un `.jpg` dans `public/media/`, lancer `npm run medias` |
| Titre, description, contact, indexation, onglets du menu, lien d’inscription | `src/data/site.ts` |
| En-tête (onglets, menu plein écran), pied de page, emblème | `src/components/maison/EnTete.astro`, `PiedDePage.astro`, `Embleme.astro` ; logotype : `src/components/Logo.astro` (charte : `docs/logo.md`) |
| Bouton fixe mobile | `src/components/CtaMobile.astro` (absent de `/pilote`) |
| En-tête de page plein cadre, appel au pilote, « Pourquoi nous » | `src/components/PageEntete.astro`, `PageCta.astro`, `PagePourquoi.astro` |
| Sections de l’accueil, vidéos | `src/components/maison/` (crédits : `docs/credits-medias.md`) |
| Questions de la FAQ | `src/data/faq.ts` |
| Conditions du pilote | `src/components/Pilote.astro` |
| Champs du formulaire et envoi | `src/components/Formulaire.astro` |
| Quelles sections sur quelle page | `src/pages/` : `index.astro` (accueil), `comment-ca-marche.astro`, `pilote.astro` (formulaire, ancre `#inscription`), `equipe.astro`, `questions.astro` |
| Titre et description SEO d’une page | les props de `<Base>` dans la page concernée ; le sitemap est généré automatiquement |
| Une section | `src/components/<Section>.astro` |

Au build, la typographie française (espaces insécables avant `? ! : ;`) est appliquée par `integrations/typographie-fr.mjs`.

## Règles d'honnêteté

- Aucun faux témoignage, logo, chiffre de résultat ni note.
- Les exemples (vins, domaines, quantités) sont inventés et signalés comme tels.
- Pas de nom de domaine réel.
- Les bénéfices sont formulés comme des objectifs.

## Animations

Tout est dans `src/scripts/animations.ts` (JS léger, sans dépendance), `src/styles/animations.css` (transitions de page, rideau, parallaxe) et la fin de `src/styles/global.css` (révélations de base, barre de lecture). Sans JavaScript ou avec « réduire les animations », le contenu reste visible et immobile : le CSS n'applique les états cachés que sous `html.anim`.

Un seul langage de mouvement : fondu + montée de 14 px en 400 ms (`--duree-3`, `--ease-sortie`), cascade de 70 ms par cran. Un élément déjà passé au-dessus de l'écran (défilement rapide, ancre), qui reçoit le focus ou qui est imprimé est révélé aussitôt ; l'apparition démarre un peu avant l'entrée dans l'écran.

| Attribut | Effet |
| --- | --- |
| `data-reveal` | apparition par défaut : fondu + montée de 14 px |
| `data-reveal="gauche"`, `"droite"` | la même, avec une entrée latérale de 16 px |
| `data-reveal="echelle"`, `"flou"` | alias presque identiques au défaut (échelle 0,985 / sans flou) ; à éviter dans le nouveau code |
| `data-reveal="rideau"` | **réservé aux grands médias** : un volet s'ouvre (800 ms) et l'image se dézoome de 8 %. À poser sur le **conteneur** de l'image (`.media-cadre`), pas sur l'`<img>`. Sens : `data-reveal-sens="bas"` (défaut), `"haut"`, `"gauche"`, `"droite"` |
| `data-reveal="ecriture"`, `"filet"`, `"filet-v"` | signature qui s'écrit, filet doré qui se trace (définis dans `maison/Ouverture.astro`) |
| `data-reveal-delai="1"` à `"6"` | cascade (70 ms par cran) ; au-delà de 6, pas de délai supplémentaire |
| `data-reveal-lignes` | titre révélé mot par mot (600 ms, cascade plafonnée à 280 ms, espaces insécables préservés) ; à réserver aux `h1`/`h2` |
| `data-compteur="1250"` | compte jusqu'à la valeur en 1 s (`data-compteur-decimales="1"` en option) ; l'élément ne contient que le nombre |
| `data-parallaxe="0.1"` | parallaxe douce sur une `<img>`/`<video>` d'un `.media-cadre` (coefficient, négatif = sens inverse) ; amplitude ±36 px au plus, désactivée sous 768 px et en mouvement réduit ; le média est agrandi de 72 px par le CSS pour ne jamais découvrir le cadre |

Charpente commune à toutes les pages :

- **En-tête** (`src/components/maison/EnTete.astro`, avec son propre script) : transparent sur l'image d'en-tête, fond crème après 60 px de défilement, masqué en descendant et réaffiché en remontant (jamais si le menu est ouvert ou si le focus clavier est dedans). Au-dessus de 1024 px, les onglets sont répartis autour de l'emblème (`aria-current="page"` sur l'onglet actif) et un filet doré glisse d'un onglet à l'autre. Le menu plein écran est un `<dialog>` natif : chiffres romains, panneau d'image qui change selon l'onglet survolé ou focalisé (grand écran), ouverture et fermeture animées, focus piégé, Échap, focus rendu au bouton, défilement bloqué.
- **Pied de page** (`PiedDePage.astro`) : emblème, navigation, contact, liens légaux, crédit des médias, mention santé.
- **Bouton mobile** (`src/components/CtaMobile.astro`) : apparaît après le premier écran, se cache sur le pied de page, sur toute section `[data-page-cta]` et sur `/pilote`.
- **Barre de lecture** dorée (`.progression[data-progression]`, posée dans `Base.astro`, 2 px, invisible tout en haut de page, masquée en mouvement réduit).
- **Transitions de page** : `@view-transition` (CSS natif, déclaré dans `global.css`, pas de `<ClientRouter />`). L'ancienne page s'efface en 200 ms sur un fond crème (jamais de fond sombre visible), la nouvelle monte de 8 px en fondu (320 ms) ; l'en-tête reste en place, fondu croisé de 160 ms (`view-transition-name: entete`). Le média d'en-tête d'une page se déploie depuis la carte de l'accueil via `view-transition-name: media-comment-ca-marche | media-pilote | media-equipe` (posé sur la carte de `Pistes.astro` et, par la prop `vt`, sur `PageEntete`) ; ce morphing (420 ms, l'ancienne image reste opaque sous la nouvelle) n'est gardé que dans le sens accueil vers page, et seulement si la carte est à l'écran (écouteur `pageswap` dans `animations.ts`).

Classes de micro-interaction : `.btn` (remplissage animé), `.lien` (souligné qui se dessine), `.papier` (se soulève au survol). Si `<ClientRouter />` est ajouté un jour, le script se réinitialise sur `astro:page-load`.
