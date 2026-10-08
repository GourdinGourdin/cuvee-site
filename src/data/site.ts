/**
 * Réglages centraux du site.
 * Une valeur vide affiche un placeholder visible « [À COMPLÉTER : …] ».
 */
export const site = {
  nom: 'Cuvée',
  titre: 'Cuvée · Assistant de cave pour bars à vin et caves à manger',
  description:
    'Assistant de cave en construction pour bars à vin et caves à manger : suivi du stock, bouteilles qui dorment, commandes prêtes à valider. Programme pilote ouvert.',
  // TODO : adresse de contact affichée dans le footer et proposée si le formulaire échoue.
  emailContact: '',
  // TODO : passer à true une fois tous les [À COMPLÉTER] remplis. En attendant, les moteurs
  // de recherche sont priés de ne pas indexer le site (balise noindex et robots.txt).
  indexable: false,
};

export const navigation = [
  { libelle: 'Le problème', href: '/#probleme' },
  { libelle: 'Le calcul', href: '/#calcul' },
  { libelle: 'Comment ça marche', href: '/#fonctionnement' },
  { libelle: 'Exemples', href: '/#exemples' },
  { libelle: 'Le pilote', href: '/#pilote' },
  { libelle: 'Questions', href: '/#faq' },
];
