import type {FormationModel} from "@/models/Formation.model.ts";
import type {AdresseModel} from "@/models/Adresse.model.ts";
import type {ContactModel} from "@/models/Contact.model.ts";

export class StructureModel {
  id!: number;
  slug!: string;
  nom!: string;
  logo!: string;
  estCoordination!: string;
  urlCoordination!: string;
  acronyme!: string;
  description!: string;
  activitesFormation!: string[];
  activitesCoordination!: string[];
  formations!: FormationModel[];
  adresses!: AdresseModel[];
  url!: string;
  contact!: ContactModel;
}
