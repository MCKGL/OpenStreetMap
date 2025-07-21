import type {AdresseModel} from "@/models/Adresse.model.ts";
import type {StructureModel} from "@/models/Structure.model.ts";
import type {PermanenceModel} from "@/models/Permanence.model.ts";
import type {ProgrammeModel} from "@/models/Programme.model.ts";
import type {ObjectifViseModel} from "@/models/ObjectifVise.model.ts";
import type {publicSpecifiqueModel} from "@/models/PublicSpecifique.model.ts";

export const ACTIVITE_FORMATION = {
  ACTIVITE_LINGUISTIQUE_VISEE_AUTONOMIE_SOCIAL : 'Français à visée sociale et communicative',
  ACTIVITE_LINGUISTIQUE_VISEE_PRO : 'Français à visée professionnelle',
  ACTIVITE_LINGUISTIQUE_LUTTE_CONTRE_ILLETTRISME : 'Lutte contre l’illettrisme / Remise à niveau',
}

export const CRITERES_SCOLARISATION = {
  SCOLARISATION_JAMAIS_OU_PEU : 'Jamais ou peu scolarisé (-3ans)',
  SCOLARISATION_EN_LANGUE_ETRANGERE : 'Scolarisé (3ans et +) en langue étrangère',
  SCOLARISATION_EN_LANGUE_FRANCAISE : 'Scolarisé (3ans et +) en langue française en France ou à l\'étranger [illettrisme/remise à niveau] ',
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
  publicsSpecifiques!: publicSpecifiqueModel[];
  adresses!: AdresseModel[];
  joursHoraires!: string[];
  dateDebut!: string;
  dateFin!: string;
  programmes!: ProgrammeModel[];
  coursEte!: boolean;
  placeDisponible!: boolean;
  url!: string;
  structure?: StructureModel;
  permanence?: PermanenceModel;
}
