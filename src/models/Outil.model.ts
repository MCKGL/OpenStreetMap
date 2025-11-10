export interface OutilModel {
  id: number;
  slug: string;
  titre: string;
  resume: string;
  nomsStructures: string[];
  thematiques: string[];
  typeUtilisateur: string[];
  profilLinguistique: string[];
  competencesTravaillees: string[];
  competencesTravailleesPrecisions: string;
  niveauVise: string[];
  typeSupport: string[];
  accessibiliteOutil: string[];
  competencesPrerequises: string;
  materiel: string;
  atouts: string;
  pointsVigilance: string;
  commentaires: string;
  imageUrl: string;
}
