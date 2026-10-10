# Charte graphique Cuvée

Source de vérité : `src/styles/global.css` (tokens, base, composants) et `src/styles/maison.css` (médias).
Le style « maison » est le style par défaut : rien à activer.

## 1. Typographie

Trois familles, rôles stricts.

| Famille | Token | Rôle |
| --- | --- | --- |
| Outfit | `--font-titre` (= `--font-texte`, `--font-sans`, `--font-serif`) | titres et texte courant (400) |
| Josefin Sans | `--font-label` (= `--font-mono`) | petites capitales espacées : surtitres, navigation, boutons, liens en capitales, étiquettes de formulaire, badges |
| Mr Dafoe | `--font-script`, classe `.signature` | signature manuscrite, 2 par page au plus |

Échelle (fluide, `clamp`) :

| Élément | Taille | Style |
| --- | --- | --- |
| `.titre-display` (h1 de l'accueil) | 40 → 80 px | capitales, 800, 0.02em, interligne 1.02 |
| `h1` | 36 → 68 px | capitales, 800, 0.02em, 1.02 |
| `h2` / `.titre-section` | 28 → 44 px | capitales, 700, 0.03em, 1.1 |
| `h3` | 20 → 24 px | casse normale, 600, 1.25 |
| `h4` | 18 px | casse normale, 600 |
| texte (`body`) | 17 px, 18 px dès 768 px | Outfit 400, interligne 1.65 |
| `.chapo` | 18 → 21 px | interligne 1.55, 65ch max |
| `.petit` | 14 px | jamais en dessous |
| petites capitales (`.surtitre`, `.btn`, `.lien-cap`) | 12–13 px | jamais sous 12 px |

Sur fond sombre (`.bg-chai`, `.bg-bordeaux`, `.bg-bordeaux-nuit`, `.sur-fond-sombre`, `.sur-image`), les titres h1 à h4 passent automatiquement en crème.

## 2. Couleurs et usages

Palette inchangée (tokens `--color-*`, classes Tailwind `bg-*`, `text-*`).

- Fonds de section : `creme` (défaut), `chai` (sections sombres pour le rythme), `bordeaux` réservé à l'appel final.
- `papier` : uniquement pour les objets (fiches, bon de commande, formulaire, cartes), pas pour un fond de section entier.
- Titres : `encre` sur clair, `creme` sur sombre. Jamais de titre de section en bordeaux.
- Bordeaux : actions (boutons, liens), surtitres, chiffres clés, numéros.
- Doré (`dore`) : décor seulement (filets, bordures, fond sombre). Texte doré sur clair : `dore-texte`. Sur sombre : `dore-clair`.
- Texte courant : `encre-douce` sur clair (7.6:1), crème à 85 % sur sombre (`--creme-85`). Ne jamais mettre `encre-douce` sur `chai` (1.7:1).
- Contrastes calculés : voir l'en-tête de `global.css`.

## 3. Espacements, grille, mouvement

- Tokens : `--space-1` … `--space-12` = 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160, 192 px. Côté Tailwind : multiples de 4 px (`p-2`, `p-4`, `p-6`, `p-8`, `p-12`, `p-16`, `p-24`, `p-32`), pas de valeurs arbitraires `[13px]`.
- `.conteneur` : contenu de 1200 px au plus, marges `--marge` (20 px, 32 px dès 640 px, 48 px dès 1024 px). `.conteneur-etroit` : 720 px pour les textes.
- `.section` : padding vertical 72 → 128 px. `.section-serree` : 48 → 80 px. Toute section de contenu utilise l'une des deux.
- Dans un bloc de titre : surtitre → titre 16 px (`mt-4`), titre → chapô 24 px (`mt-6`), bloc de titre → contenu 48 à 64 px (`mt-12` à `mt-16`).
- Ombres : `--ombre-1` (repos), `--ombre-2` (survol d'une carte cliquable). Rayon : `--rayon` (2 px) pour cartes, papiers, champs ; boutons à 0.
- Durées : `--duree-1` 160 ms, `--duree-2` 240 ms, `--duree-3` 400 ms ; courbe `--ease-sortie`. Pas plus d'une animation remarquable par écran.

## 4. Composants et classes

| Classe | Usage |
| --- | --- |
| `.btn` + `.btn-primaire` / `.btn-contour` / `.btn-creme` / `.btn-voile` | boutons, 48 px minimum, Josefin 600 13 px. `.btn-petit`/`.btn-mini` : 44 px (barres d'outils). États : survol (remplissage balayé), focus-visible (anneau 2 px décalé de 3 px), actif, `disabled`/`aria-disabled`. `.btn-contour` s'adapte seul au fond sombre ; `.btn-voile` pour image sous voile ; `.btn-creme` sur fond bordeaux |
| `.lien` | lien dans une phrase (souligné qui se dessine) ; `.lien-seul` pour un lien isolé (zone 44 px) |
| `.lien-cap` | lien en capitales (« DÉCOUVRIR ») |
| `.surtitre` | bordeaux sur clair, doré clair automatique sur sombre. Un seul par titre |
| `.signature` | voir règles ci-dessous |
| `.texte-courant`, `.chapo`, `.petit` | paragraphes (couleur et mesure incluses) ; à poser sur le `<p>` |
| `.papier`, `.papier-ombre`, `.fiche` | objets posés (fiche : filet doré, ombre 1, cliquable : survol ombre 2) |
| `.champ`, `.etiquette-champ`, `.aide-champ`, `.message-erreur`, `.case` | formulaires : étiquette au-dessus, champ 48 px, erreur via `aria-invalid="true"` + `.message-erreur` |
| `.filet-dore`, `.filet-double`, `.chiffre-cle`, `.cachet`, `.tampon` | décor et chiffres ; `.chiffre-cle` en bordeaux sur clair, crème sur sombre |
| `.media-cadre`, `.voile`, `.voile-plein`, `.voile-gauche`, `.sur-image`, `.zoom-lent`, `.rail`, `.chapitre-num` | kit médias (maison.css) |
| `<TitreSection libelle id titre chapo? signature? sombre? centre? />` | bloc de titre de section complet |
| `<ACompleter texte="…" />` | placeholder surligné jaune, à ne jamais retirer |

Le texte courant n'est pas coloré globalement (`p` reste en `encre`) pour ne pas casser les fonds sombres : ajoutez `.texte-courant` (ou `.chapo`) aux paragraphes de contenu.

## 5. Règles d'usage

Signature : au plus 2 par page (en-tête de page, éventuellement appel final). Jamais sous chaque titre de section.

Surtitre : un par titre, jamais deux étiquettes empilées. Court (3 mots), capitales gérées par la classe.

Voile : tout texte sur image reçoit `.voile` (ou `.voile-plein`, `.voile-gauche`) et le conteneur du texte `.sur-image`. Le voile garantit 4.5:1 pour du texte crème.

## 6. À faire / à ne pas faire

À faire
- Utiliser les tokens et les classes ci-dessus avant d'écrire du CSS local.
- Un seul `h1` par page, pas de saut de niveau (h2 → h3 → h4).
- `alt=""` pour les médias décoratifs, focus visible partout, cibles tactiles ≥ 44 px.
- Garder les états cachés d'animation sous `html.anim` (le contenu reste visible sans JavaScript).

À ne pas faire
- Pas de nouvelle teinte, pas de dégradé décoratif, pas d'ombre hors `--ombre-1`/`--ombre-2`.
- Pas de `p { color }` global, pas de `encre-douce` sur fond sombre.
- Pas de doré en texte sur fond clair (`dore-texte` seulement), pas de titre de section bordeaux.
- Pas de h3 en capitales, pas de Josefin en paragraphe, pas de signature décorative.
- Pas de texte sous 14 px (12 px pour les petites capitales).
