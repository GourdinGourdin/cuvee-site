export type Theme = 'Démarrage' | 'Données' | 'Prix' | 'Pilote';

export const themes: Theme[] = ['Démarrage', 'Données', 'Prix', 'Pilote'];

export interface Question {
  theme: Theme;
  question: string;
  reponse: string[];
}

export const faq: Question[] = [
  {
    theme: 'Démarrage',
    question: 'Ça marche avec ma caisse ?',
    reponse: [
      "Ce sont Lightspeed, Zelty et L’Addition que nous visons en premier. La compatibilité de votre caisse est vérifiée lors du premier échange ; si elle n’est pas encore connectée, un export hebdomadaire de vos ventes (fichier CSV) suffit pour démarrer.",
      "Vous utilisez autre chose ? Indiquez-le dans le formulaire : c’est ce qui nous aide à choisir les caisses à brancher ensuite. Et si nous ne pouvons pas encore vous être utiles, nous vous le dirons avant de commencer.",
    ],
  },
  {
    theme: 'Démarrage',
    question: 'Je tiens ma cave sur Excel, ou dans un carnet. Est-ce un problème ?',
    reponse: [
      "Non, c’est une situation que nous avons en tête depuis le départ. Pendant le pilote, on monte avec vous l’inventaire de départ à partir de votre fichier ou de votre carnet. Vous le relisez : personne ne connaît votre cave mieux que vous.",
    ],
  },
  {
    theme: 'Démarrage',
    question: 'Combien de temps pour démarrer, et que dois-je faire ?',
    reponse: [
      "Comptez environ deux semaines, dont une à deux heures de votre temps pour relire l’inventaire de départ. Notre objectif : que vous n’ayez rien à ressaisir à la main.",
      "De votre côté : nous laisser connecter votre caisse, nous envoyer quelques factures fournisseurs récentes et relire l’inventaire de départ.",
    ],
  },
  {
    theme: 'Prix',
    question: 'Combien ça coûte ?',
    reponse: [
      "Pendant le pilote : gratuit, c’est offert pendant les trois mois. Le tarif d’après n’est pas encore fixé : nous voulons le définir avec les premiers lieux, pas à leur place.",
      "Notre principe : un abonnement mensuel sans engagement, annoncé avant la fin du pilote. Les lieux pilotes conservent −50 % pendant leurs 12 premiers mois. Rien ne vous est facturé sans votre accord explicite.",
    ],
  },
  {
    theme: 'Données',
    question: "Qui voit mes chiffres de vente et mes prix d’achat ?",
    reponse: [
      "L’équipe Cuvée, uniquement pour faire fonctionner l’outil pour votre lieu. Notre principe : vos données ne sont jamais vendues, et vous pouvez les récupérer ou les faire supprimer quand vous voulez.",
      "Vos données restent les vôtres. Elles sont hébergées dans l’Union européenne, jamais revendues et jamais utilisées pour entraîner des modèles d’IA. Le prestataire d’IA que nous utilisons est nommé dans la politique de confidentialité avant le début du pilote.",
    ],
  },
  {
    theme: 'Données',
    question: 'Mes fournisseurs peuvent-ils recevoir un message sans mon accord ?',
    reponse: [
      "Non. Une commande ou une relance ne part qu’après votre validation, et vous pouvez tout réécrire avant l’envoi. Chaque envoi est noté dans le journal.",
      "Les commandes partent de votre propre adresse e-mail, après votre validation : Cuvée prépare le message, c’est vous qui l’envoyez. Rien ne part au nom de Cuvée.",
    ],
  },
  {
    theme: 'Démarrage',
    question: 'Et si Cuvée se trompe ?',
    reponse: [
      "Ça arrivera. Cuvée s’appuie sur l’intelligence artificielle pour lire les factures, analyser les ventes et rédiger ses propositions : il peut mal lire une ligne ou mal estimer une quantité.",
      "C’est pour ça que rien d’engageant ne part sans vous, et que les lignes douteuses vous sont soumises, comme dans l’exemple de facture plus haut.",
    ],
  },
  {
    theme: 'Pilote',
    question: "Et si j’arrête en cours de pilote ?",
    reponse: [
      'Vous pouvez arrêter à tout moment, sans frais. En fin de pilote, vous recevez un export de votre inventaire (tableur), et vos données sont supprimées sous 30 jours sur simple demande.',
    ],
  },
  {
    theme: 'Pilote',
    question: 'Je suis caviste, sans service au verre. Je peux m’inscrire ?',
    reponse: [
      'Oui. Le suivi du stock, les bouteilles qui dorment et les commandes vous concernent tout autant. Le pilote démarre en priorité avec des caves à manger et des bars à vin, mais nous lisons toutes les inscriptions.',
    ],
  },
];
