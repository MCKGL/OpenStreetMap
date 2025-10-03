import type {AdresseModel} from "@/models/Adresse.model.ts";
import type {ContactModel} from "@/models/Contact.model.ts";

export class LieuModel {
  contacts?: ContactModel[];
  adressesCoordination?: AdresseModel[];
}
