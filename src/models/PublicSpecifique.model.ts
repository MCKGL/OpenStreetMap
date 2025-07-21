export const PUBLICS_SPECIFIQUES = {
  PUBLIC_TOUS : 'Tout public',
  PUBLIC_RSA : 'Bénéficiaires du RSA',
  PUBLIC_HABITANT_QUARTIER_POLITIQUE_VILLE : 'Habitant Quartier Politique de la Ville',
  PUBLIC_HABITANT_TERRITOIRE : 'Habitant un territoire précis',
  PUBLIC_JEUNES : 'Jeune (16-25 ans)',
  PUBLIC_PERSONNES_AGEES : 'Personnes âgées (+60 ans)',
  PUBLIC_PRESCRIPTEUR : 'Orienté par des prescripteurs',
  PUBLIC_FEMMES : 'Femmes',
  PUBLIC_PARENTS : 'Parents',
  PUBLIC_PARENTS_ELEVES : 'Parents d’élèves',
  PUBLIC_FAMILLE_MONOPARENTALE : 'Famille monoparentale',
  PUBLIC_SITUATION_HANDICAP : 'Publics en situation de handicap',
  PUBLIC_PRIMO_ARRIVANTS : 'Primo-arrivants signataires du CIR',
  PUBLIC_REFUGIES : 'Réfugiés / Bénéficiaires de la protection internationale',
  PUBLIC_DEMANDEURS_D_ASILE : 'Demandeurs d\'asile',
  PUBLIC_RESIDENTS_CADA : 'Résidents de centre d\'hébergement ou de CADA',
  PUBLIC_PROTECTION_TEMPORAIRE : 'Bénéficiaires de la protection temporaire (déplacés ukrainiens)',
  PUBLIC_MINORITES_GENRE : 'Minorités de genre',
}

export class publicSpecifiqueModel {
  publicSpecifique!: string;
  publicSpecifiqueDescription!: string;
  publicSpecifiquePrioritaire!: string;
}
