# Cuvée : site du programme pilote

Site vitrine statique (Astro et Tailwind CSS v4). Il sert à recruter des lieux pilotes et à tester le message.
Une seule page, plus les pages Mentions légales, Confidentialité et 404.

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
| Titre, description, contact, indexation, menu | `src/data/site.ts` |
| Questions de la FAQ | `src/data/faq.ts` |
| Conditions du pilote | `src/components/Pilote.astro` |
| Champs du formulaire et envoi | `src/components/Formulaire.astro` |
| Une section de la page | `src/components/<Section>.astro`, assemblées dans `src/pages/index.astro` |

Au build, la typographie française (espaces insécables avant `? ! : ;`) est appliquée par `integrations/typographie-fr.mjs`.

## Règles d'honnêteté

- Aucun faux témoignage, logo, chiffre de résultat ni note.
- Les exemples (vins, domaines, quantités) sont inventés et signalés comme tels.
- Pas de nom de domaine réel.
- Les bénéfices sont formulés comme des objectifs.
