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

/**
 * Renvoie une adresse anonyme pour une latitude/longitude donnée.
 * Cette méthode va servir à la page de détail d'une formation qui se contente de poser un marker
 * (pas de popup pas d'infos bulles)
 */
export function getAdresseByLatLong(lat: number, long: number): AdresseModel {
  return {
    gardeEnfants: false,
    codePostal: "",
    latitude: lat,
    longitude: long,
    ville: "",
    numero: "",
    voie: "",
    correspondancesCodePostal: [],
    correspondancesVille: [],
  };
}
