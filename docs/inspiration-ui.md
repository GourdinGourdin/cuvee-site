# Inspiration UI et animation pour Cuvée

Recherche du 8 octobre 2026. Aucun fichier du site n'a été modifié. Les points marqués (vérifié) viennent de sources web consultées ; les autres viennent de notre connaissance des projets et sont à revérifier avant intégration (poids et licences évoluent).

Contraintes : ton sobre (pas de pub pour l'alcool), `prefers-reduced-motion` respecté, performance (site statique Astro 7, Tailwind v4), palette conservée (papier crème, bordeaux, encre, vert bouteille, doré en filets).

## 1. Bibliothèques de composants

| Nom | URL | Licence | Poids | React ? | Compat. Astro | Ce qu'on peut en prendre |
|---|---|---|---|---|---|---|
| Aceternity UI | ui.aceternity.com | MIT (composants gratuits), pro payant | dépend de framer-motion | Oui (React + Motion) | Seulement via îlot React (lourd) | Inspiration visuelle uniquement (cartes empilées, texte révélé) ; à réécrire en CSS/JS vanilla. |
| Magic UI | magicui.design | MIT | idem | Oui (React/shadcn) | Îlot React | Idées : marquee, number ticker, blur-fade ; à recoder en vanilla. |
| Motion Primitives | motion-primitives.com | MIT | idem | Oui | Îlot React | Patterns de texte (text effect, in-view) à transposer. |
| Animata | animata.design | MIT | Tailwind + parfois Motion | Oui (React) | Copier le CSS Tailwind seulement | Plusieurs effets sont du pur CSS Tailwind, donc copiables tels quels. |
| Inspira UI | inspira-ui.com | MIT | Vue/Nuxt | Non React, mais Vue | Non natif | Inspiration seulement. |
| HyperUI | hyperui.dev | MIT | 0 JS, Tailwind pur | Non | Oui, copier-coller | Blocs de structure (listes, tableaux de prix, FAQ) à restyler en bordeaux/crème. |
| Preline | preline.co | MIT | JS vanilla modulaire | Non | Oui | Accordéons / dialogues accessibles, mais style générique : à surcharger. |
| daisyUI | daisyui.com | MIT | Plugin Tailwind, 0 JS | Non | Oui | Trop « look framework » ; thème personnalisable mais peu éditorial. Déconseillé. |
| Flowbite | flowbite.com | MIT | JS vanilla | Non | Oui | Idem Preline, utile en dépannage, pas pour l'identité. |
| shadcn/ui blocks | ui.shadcn.com | MIT | Radix + React | Oui | Îlot React | Pas pertinent : on n'a pas de besoin applicatif. |

Verdict : aucune bibliothèque de composants n'apporte plus que ce qu'on écrit en 20 lignes de CSS/JS. Utiliser Aceternity / Magic UI / Animata comme catalogue d'idées, recoder en vanilla. Seuls HyperUI (0 JS) et, au besoin, Preline sont utilisables sans React.

## 2. Bibliothèques d'animation légères

### Motion (motion.dev) — vanilla
- Licence MIT. Fonction `animate()` mini : 2,3 kb (WAAPI, accélérée GPU) ; version hybride : 17 kb ; `scroll()` et `inView()` pour le scroll et l'apparition (vérifié : https://motion.dev/docs/quick-start).
- Sans React, `import { animate, scroll, inView } from "motion"`. Compatible Astro (script dans un composant, bundlé par Vite, tree-shaking).
- Pour Cuvée : `inView` + `animate` pour les révélations et compteurs, `scroll` pour la parallaxe douce, le tout pour moins de 5 kb.

### GSAP + ScrollTrigger + SplitText
- Licence : tous les plugins sont désormais gratuits, y compris pour usage commercial, depuis le rachat par Webflow, y compris SplitText et Flip (vérifié via résultats de recherche ; confirmer sur https://gsap.com/pricing et la page de licence avant de livrer). Une licence « standard » reste à lire (interdit de concurrencer un outil de création visuelle, sans effet pour nous).
- Poids : noyau ~25-30 kb gzip, ScrollTrigger ~12 kb, SplitText ~7 kb. Sans React. Compatible Astro (npm install gsap).
- Pour Cuvée : la solution la plus complète (cartes épinglées qui s'empilent, texte ligne à ligne propre, timelines), au prix de ~45 kb. À réserver si les besoins dépassent Motion.

### Lenis (smooth scroll) — lenis.darkroom.engineering
- MIT, ~3 kb, vanilla. Compatible Astro. Mais il détourne le défilement natif (accessibilité, ancres, `scroll-padding`, ancres de notre en-tête collant). Pour un site sobre : à éviter, ou à désactiver en reduced-motion. Recommandation : ne pas l'utiliser.

### View Transitions d'Astro
- Intégré à Astro (`<ClientRouter />`), MIT, quelques kb. Utile seulement en multi-pages ; Cuvée est une page d'atterrissage, gain faible. La View Transition API native (même document) peut animer un changement d'état (FAQ, onglets) sans dépendance.

### CSS scroll-driven animations (`animation-timeline: view()` / `scroll()`)
- 0 kb, 0 JS, sur le fil de rendu du compositeur. Support : Chrome/Edge depuis 115, Safari 26 (sept. 2025) ; Firefox toujours derrière un drapeau en 2026 (vérifié : https://www.drweb.de/css-scroll-animationen-ohne-javascript/, https://www.buildmvpfast.com/blog/css-scroll-driven-animations-replace-js-2026). Donc amélioration progressive obligatoire : `@supports (animation-timeline: view())` et état final lisible par défaut.
- Pour Cuvée : parallaxe douce, barre de progression de lecture, révélations au scroll, sans aucun JS pour ~85 % des navigateurs ; Firefox voit la page statique, ce qui est acceptable.

### Splitting.js / SplitType
- Splitting.js (MIT, ~2 kb) et SplitType (MIT, ~5 kb) découpent un texte en mots/lignes/caractères et exposent des variables CSS (`--word-index`). Vanilla, compatible Astro. Si GSAP n'est pas retenu, c'est la façon légère de faire un « texte ligne à ligne ». Attention a11y : conserver un `aria-label` sur le titre complet et `aria-hidden` sur les fragments. Alternative sans lib : découper les mots à la main dans le composant Astro au build (aucun JS client, idéal pour un titre fixe).

## 3. Sources d'inspiration éditoriale

- Godly (godly.website), Awwwards (awwwards.com), Siteinspire (siteinspire.com), Minimal Gallery (minimal.gallery), Land-book (land-book.com), Httpster. Filtrer « editorial », « serif », « minimal ».
- Magazines : The Gentlewoman, Kinfolk, Apartamento, Monocle ; presse éditoriale numérique : The Pudding (mise en page de récit), Pentagram (pentagram.com). Pour la typographie dans l'esprit Fraunces : fonderies Collletttivo, Pangram Pangram, Klim.
- Univers vin : sites de domaines et de revues (Noble Rot, Decanter, Vinous), cavistes et caves à manger (Racines, Le Verre Volé), néo-domaines minimalistes. À regarder pour le ton visuel : étiquettes, fiches, papier, peu de photos de verres.
- Éviter : esthétique « luxe nocturne » (or sur noir, bouteilles en gros plan) : à contre-courant de notre ton sobre et de la contrainte alcool.
- Codrops (tympanus.net/codrops) et CSS-Tricks pour les démonstrations d'effets avec code.

## 4. Patterns concrets et comment les réaliser

1. Texte qui se révèle ligne à ligne : titre H1/H2 découpé en lignes (ou mots) avec masque `overflow: hidden` et translation de 100 % vers 0, décalage 60-80 ms. Mise en œuvre : découpe au build dans Astro + CSS, ou Motion `inView`. Reduced motion : texte affiché directement.
2. Parallaxe douce : image ou filet doré décalé de 20-40 px au scroll via `animation-timeline: view()` ; amplitude faible, pas de zoom. Éviter sur mobile si coûteux.
3. Marquee : bande lente de mentions (« cave à manger · bar à vin · bistrot ») en CSS `@keyframes` + `translateX`, pause au survol et au focus, arrêt en reduced-motion. Rester discret : une seule bande, en mono.
4. Cartes qui s'empilent au scroll : `position: sticky` avec `top` croissant (pur CSS) ; ajouter un léger scale par `animation-timeline: view()` en amélioration. Idéal pour « Comment ça marche » en 3 étapes. Sans sticky ni JS en reduced-motion (cartes simplement à la suite).
5. Compteurs : chiffres du calculateur (économies, rotations) qui montent à l'entrée dans la vue (Motion `animate(0, n)` ou CSS `@property` + `counter()`), valeur finale dans le HTML pour les lecteurs d'écran, durée < 1,2 s.
6. Soulignés animés : `background-size` de 0 à 100 % sur un dégradé de 1 px (bordeaux ou doré) au survol/focus, 0 JS, 0 kb. Remplace les soulignements par défaut des liens.
7. Curseur personnalisé : déconseillé (sobriété, a11y, tactile). Si voulu, uniquement `cursor` CSS adapté ou léger effet sur les boutons.
8. Fondu de section au scroll (`blur-fade` de Magic UI) : opacité + translation de 12 px, une seule fois, à garder subtil.
9. Filets dorés qui se tracent (SVG `stroke-dashoffset` ou `scaleX` 0 à 1) pour séparer les sections : très éditorial et peu coûteux.

## 5. Règles transverses

- Tout contenu doit être visible sans JS et sans animation : l'état par défaut est l'état final ; les animations s'ajoutent via une classe `js` ou `@supports`.
- `@media (prefers-reduced-motion: reduce)` : désactiver translations, marquee, parallaxe, compteurs (valeur finale). Notre global.css neutralise déjà durée des animations et transitions, mais pas le JS : tester `matchMedia` avant toute animation scriptée.
- N'animer que `transform` et `opacity`. Durées 400-700 ms, courbe `cubic-bezier(0.22, 1, 0.36, 1)`. Une seule animation d'entrée par bloc, jouée une fois.
- Budget : moins de 10 kb de JS animation supplémentaire, aucun framework.

## 6. Recommandation tranchée

### Stack à retenir (3 éléments)
1. CSS pur (transitions, `@keyframes`, `sticky`, scroll-driven animations en amélioration progressive sous `@supports`) : couvre ~80 % des besoins pour 0 kb.
2. Motion vanilla (`animate`, `inView`, `scroll`, version mini ~2-5 kb) : pour les compteurs, les révélations déclenchées à l'entrée dans la vue et le repli sur Firefox.
3. Découpe de texte faite au build dans Astro (ou Splitting.js, ~2 kb, si le texte est dynamique) : pour le texte ligne à ligne sans GSAP.

Écartés : GSAP (gratuit désormais, mais ~45 kb pour des besoins que Motion couvre), Lenis (détourne le scroll natif), toute librairie React (Aceternity, Magic UI, shadcn), daisyUI (look générique).

### Les 5 patterns les plus pertinents
1. Titres qui se révèlent ligne à ligne (Hero et titres de section).
2. Cartes « Comment ça marche » qui s'empilent au scroll (sticky CSS).
3. Soulignés animés sur les liens et CTA (bordeaux, doré au focus).
4. Compteurs sobres dans le calculateur et les chiffres clés.
5. Filets dorés qui se tracent + parallaxe très douce (filets et image) entre les sections ; le marquee reste en option, une seule bande.
