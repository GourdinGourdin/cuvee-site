# Logo Cuvée : charte

## Composition
- **Emblème** (`src/components/maison/Embleme.astro`) : une bouteille de type bordelaise (épaules marquées, col fin), capsule dorée, étiquette ajourée portant un « C » dessiné en arc et un filet, sous une voûte de cave en double arc fin, posée sur une ligne de sol.
- **Logotype** (`src/components/Logo.astro`) : emblème + « CUVÉE » en Outfit 800, capitales, interlettrage 0,32 em. Deux variantes : `pile` (défaut, emblème au-dessus du mot : en-tête, menu, pied de page) et `ligne` (emblème à gauche). Props : `taille` (largeur de l'emblème en px, le mot suit), `clair` (fond sombre, crème), `heritee` (suit `currentColor`, utilisée par l'en-tête qui change de couleur au défilement). `EnTete.astro` et `PiedDePage.astro` l'utilisent : ne pas redessiner le logotype ailleurs.
- **Grille de l'emblème** : 40 × 64 (rapport 1 : 1,6), axe central x = 20. Voûte : arc de rayon 17 (trait 1,2) et arc intérieur de rayon 13,5 (trait 0,6, opacité 55 %). Bouteille : largeur 12, hauteur 44, épaules entre y = 25 et y = 35,5. Capsule : y = 13,4 à 21,6. Étiquette : 10,2 × 11,5.
- Gabarit unique des images : `scripts/modeles/embleme.html` (copie du même dessin). Si le dessin change, modifier `Embleme.astro`, `embleme.html` et `public/favicon.svg`, puis lancer `npm run images`.

## Couleurs
| Usage | Couleur |
| --- | --- |
| Emblème et mot sur fond clair (crème, papier) | bordeaux `#6e1f2f` |
| Emblème et mot sur fond sombre (chai, bordeaux, image voilée) | crème `#f5e9e4` |
| Capsule (toujours) | doré `#a88a4a` |
| Dans l'en-tête transparent / après défilement | `currentColor` : crème, puis encre |

Pas d'autre couleur, pas d'ombre, pas de dégradé dans le logo. Jamais de logo doré en entier ni de capsule d'une autre couleur.

## Tailles minimales
- Emblème seul : 20 px de large (32 px de haut). En dessous, utiliser le favicon (bouteille seule, sans voûte).
- Logotype `ligne` : emblème de 26 px minimum. `pile` : 38 px minimum.
- En-tête : emblème de 26 à 28 px. Pied de page : 40 à 44 px. Couverture / images : 200 px et plus.
- Zone de protection : au moins la largeur de la capsule (≈ 5 unités de grille, soit 1/8 de la largeur) tout autour.

## Usages
- **Fond clair** : `<Logo />` (bordeaux). **Fond sombre** : `<Logo clair />`. **En-tête** : `<Logo heritee taille={26} />`. **Pied de page** : `<Logo clair taille={44} />`.
- **Favicon** (`public/favicon.svg`) : bouteille seule bordeaux sur carré arrondi crème, lisible à 16 px. **apple-touch-icon** et **image Open Graph** : générés par `npm run images` (fond bordeaux pour l'icône, fond chai pour l'image sociale, double filet doré).
- À éviter : déformer, pivoter, recolorer, ajouter un contour, poser le logo sur une photo sans voile, utiliser une autre typographie pour « CUVÉE ».
