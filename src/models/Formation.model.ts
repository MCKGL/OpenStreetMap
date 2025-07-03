import type {AdresseModel} from "@/models/Adresse.model.ts";
import type {StructureModel} from "@/models/Structure.model.ts";
import type {PermanenceModel} from "@/models/Permanence.model.ts";

export const ACTIVITE_FORMATION = {
  ACTIVITE_LINGUISTIQUE_VISEE_AUTONOMIE_SOCIAL : 'Français à visée sociale et communicative',
  ACTIVITE_LINGUISTIQUE_VISEE_PRO : 'Français à visée professionnelle',
  ACTIVITE_LINGUISTIQUE_LUTTE_CONTRE_ILLETTRISME : 'Lutte contre l’illettrisme / Remise à niveau',
}
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

export const OBJECTIF_VISE = {
  OBJECTIF_VISE_ACCES_EMPLOI : 'Accéder à un emploi',
  OBJECTIF_VISE_FORMATION_PROFESSIONNELLE : 'Accéder à une formation ou à une certification professionnelle',
  OBJECTIF_VISE_PRATIQUES_ARTISTIQUES : 'Développer des pratiques artistiques',
  OBJECTIF_VISE_AUTONOMIE_SOCIAL : 'Devenir autonome au quotidien',
  OBJECTIF_VISE_ETUDES : 'Poursuivre des études',
  OBJECTIF_VISE_DIPLOME : 'Préparer un diplôme ou une certification de langue française',
  OBJECTIF_VISE_SAVOIRS_DE_BASE : 'S\'approprier ou renforcer les savoirs/compétences de base',
  OBJECTIF_VISE_CITOYENNETE : 'Se former aux questions civiques et de citoyenneté',
  OBJECTIF_VISE_PARENTALITE : 'Suivre la scolarité des enfants / parentalité',
  OBJECTIF_VISE_TRAVAILLER_ECRIT : 'Travailler l’écrit',
  OBJECTIF_VISE_TRAVAILLER_ORAL : 'Travailler l’oral',
  OBJECTIF_VISE_INFORMATIQUE : 'Utiliser l’informatique',
}

export const CRITERES_SCOLARISATION = {
  SCOLARISATION_JAMAIS_OU_PEU : 'Jamais ou peu scolarisé (-3ans)',
  SCOLARISATION_EN_LANGUE_ETRANGERE : 'Scolarisé (3ans et +) en langue étrangère',
  SCOLARISATION_EN_LANGUE_FRANCAISE : 'Scolarisé (3ans et +) en langue française en France ou à l\'étranger [illettrisme/remise à niveau] ',
  SCOLARISATION_NEST_PAS_CRITERE : 'Niveau de scolarisation indifférent'
}

export const COMPETENCES_LINGUISTIQUES_VISEES = {
  NIVEAU_CECR_A1_1 : 'A1.1 (CECRL)',
  NIVEAU_CECR_A1 : 'A1 (CECRL)',
  NIVEAU_CECR_A2 : 'A2 (CECRL)',
  NIVEAU_CECR_B1 : 'B1 (CECRL)',
  NIVEAU_CECR_B2 : 'B2 (CECRL)',
  NIVEAU_CECR_C1 : 'C1 (CECRL)',
  NIVEAU_CECR_C2 : 'C2 (CECRL)',
}

export const JOURS_SEMAINE = {
  JOUR_LUNDI : 'Lundi',
  JOUR_MARDI : 'mardi',
  JOUR_MERCREDI : 'mercredi',
  JOUR_JEUDI : 'jeudi',
  JOUR_VENDREDI : 'vendredi',
  JOUR_SAMEDI : 'samedi',
  JOUR_DIMANCHE : 'dimanche',
}

export const HORAIRES = {
  MATIN : 'matin',
  MIDI : 'midi',
  APRES_MIDI : 'après-midi',
  SOIREE : 'soirée',
}

export class FormationModel {
  id!: number;
  slug!: string;
  nom!: string;
  presentationPublique!: string;
  activite!: string;
  gardeEnfants!: boolean;
  objectifsVises!: ObjectifViseModel[];
  competencesLinguistiquesVisees!: string[];
  criteresScolarisation!: string[];
  publicsSpecifiques!: publicsSpecifiqueModel[];
  adresses!: AdresseModel[];
  joursHoraires!: string[];
  programmes!: programmeModel[];
  coursEte!: boolean;
  placeDisponible!: boolean;
  url!: string;
  structure?: StructureModel;
  permanence?: PermanenceModel;
}

export class ObjectifViseModel {
  objectifVise!: string;
  objectifViseDescription!: string;
}

export class publicsSpecifiqueModel {
  publicSpecifique!: string;
  publicSpecifiqueDescription!: string;
  publicSpecifiquePrioritaire!: string;
}

export class programmeModel {
  id!: number;
  nom!: string;
}
