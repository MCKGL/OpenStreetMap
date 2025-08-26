import type {StructureModel} from "@/models/Structure.model.ts";
import type {PermanenceModel} from "@/models/Permanence.model.ts";
import type {FormationModel} from "@/models/Formation.model.ts";

export class AdresseModel {
  gardeEnfants!: boolean;
  codePostal!: string;
  latitude!: number;
  longitude!: number;
  ville!: string;
  numero!: string;
  voie!: string;
  correspondancesCodePostal!: string[];
  correspondancesVille!: string[];
  structures?: StructureModel[];
  permanences?: PermanenceModel[];
  formations?: FormationModel[];
}
