import type {AdresseModel} from "@/models/Adresse.model.ts";

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
}

export interface ObjectifViseModel {
  objectifVise: string;
  objectifViseDescription: string;
}

export interface publicsSpecifiqueModel {
  publicSpecifique	: string;
  publicSpecifiqueDescription: string;
  publicSpecifiquePrioritaire	: string;
}

export interface programmeModel {
  id: number;
  nom: string;
}
