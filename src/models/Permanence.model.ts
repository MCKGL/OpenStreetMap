import type {FormationModel} from "@/models/Formation.model.ts";
import type {AdresseModel} from "@/models/Adresse.model.ts";

export class PermanenceModel {
  id!: number;
  slug!: string;
  nom!: string;
  logo!: string;
  estCoordination!: boolean;
  urlCoordination!: string;
  acronyme!: string;
  description!: string;
  activitesFormation!: string[];
  activitesCoordination!: string[];
  formations!: FormationModel[];
  adresses!: AdresseModel[];
  url!: string;
}
