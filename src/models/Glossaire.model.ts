export interface GlossaireEntry {
  id: number;
  nom: string;
  definition: string;
  types: string[];
}

export interface GlossaireModel {
  entreesLinguistique: GlossaireEntry[];
  entreesAccompagnement: GlossaireEntry[];
}
