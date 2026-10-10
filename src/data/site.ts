/**
 * Réglages centraux du site.
 * Une valeur vide affiche un placeholder visible « [À COMPLÉTER : …] ».
 */
export const site = {
  nom: 'Cuvée',
  titre: 'Cuvée · Assistant de cave pour bars à vin et caves à manger',
  description:
    'Assistant de cave en construction pour bars à vin et caves à manger : suivi du stock, bouteilles qui dorment, commandes prêtes à valider. Pilote ouvert.',
  // TODO : adresse de contact affichée dans le footer et proposée si le formulaire échoue.
  emailContact: '',
  // TODO : passer à true une fois tous les [À COMPLÉTER] remplis. En attendant, les moteurs
  // de recherche sont priés de ne pas indexer le site (balise noindex et robots.txt).
  indexable: false,
};

/** Onglets du site. `href` sert aussi à détecter la page active dans le Header. */
export const navigation = [
  { libelle: 'Accueil', href: '/' },
  { libelle: 'Comment ça marche', href: '/comment-ca-marche' },
  { libelle: 'Le pilote', href: '/pilote' },
  { libelle: 'Équipe', href: '/equipe' },
  { libelle: 'Questions', href: '/questions' },
];

/** Adresse de l’inscription, partagée par tous les boutons du site. */
export const lienInscription = '/pilote#inscription';

