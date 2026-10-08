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
| Couleurs, typographie, composants de base | `src/styles/global.css` |
| Titre, description, contact, indexation, onglets du menu, lien d’inscription | `src/data/site.ts` |
| Navigation (onglet actif, menu mobile) et pied de page | `src/components/Header.astro`, `Footer.astro` |
| Bouton fixe mobile | `src/components/CtaMobile.astro` (absent de `/pilote`) |
| En-tête de page, appel au pilote, aperçu de l’accueil, « Pourquoi nous » | `src/components/PageEntete.astro`, `PageCta.astro`, `PageApercu.astro`, `PagePourquoi.astro` |
| Questions de la FAQ | `src/data/faq.ts` |
| Conditions du pilote | `src/components/Pilote.astro` |
| Champs du formulaire et envoi | `src/components/Formulaire.astro` |
| Quelles sections sur quelle page | `src/pages/` : `index.astro` (accueil), `comment-ca-marche.astro`, `pilote.astro` (formulaire, ancre `#inscription`), `equipe.astro`, `questions.astro` |
| Titre et description SEO d’une page | les props de `<Base>` dans la page concernée ; le sitemap est généré automatiquement |
| Une section | `src/components/<Section>.astro` |

Les liens `#ancre` d’un composant dont la cible est sur une autre page sont réécrits au chargement (table `ancres` dans `src/data/site.ts`).

Au build, la typographie française (espaces insécables avant `? ! : ;`) est appliquée par `integrations/typographie-fr.mjs`.

## Règles d'honnêteté

- Aucun faux témoignage, logo, chiffre de résultat ni note.
- Les exemples (vins, domaines, quantités) sont inventés et signalés comme tels.
- Pas de nom de domaine réel.
- Les bénéfices sont formulés comme des objectifs.

## Animations

Tout est dans `src/scripts/animations.ts` (JS léger, sans dépendance) et la fin de `src/styles/global.css`. Sans JavaScript ou avec « réduire les animations », le contenu reste visible et immobile.

| Attribut | Effet |
| --- | --- |
| `data-reveal` | fondu + légère montée au scroll |
| `data-reveal="gauche"`, `"droite"`, `"echelle"` | variantes d'entrée |
| `data-reveal-delai="1"` à `"6"` | cascade (90 ms par cran) |
| `data-reveal-lignes` | titre révélé mot par mot (espaces insécables préservés) |
| `data-compteur="1250"` | compte jusqu'à la valeur (`data-compteur-decimales="1"` en option) ; l'élément ne contient que le nombre |
| `data-parallaxe="0.1"` | parallaxe douce (coefficient, négatif = sens inverse) |

Classes de micro-interaction : `.btn` (remplissage animé), `.lien` (souligné qui se dessine), `.papier` (se soulève au survol). Les transitions entre pages utilisent `@view-transition` en CSS natif ; si `<ClientRouter />` est ajouté un jour, le script se réinitialise sur `astro:page-load`.
