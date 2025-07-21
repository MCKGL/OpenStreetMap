export type ArrayKeys = 'activites' | 'lieux' | 'publics' | 'objectifs' | 'joursHoraires';
export type StringKeys = 'scolarisation' | 'competence' | 'programmes' | 'keyword';
export type BooleanKeys = 'gardeEnfants' | 'coursEte' | 'formationDispo';

export const FILTER_KEYS = [
  'activites', 'lieux', 'scolarisation', 'competence',
  'programmes', 'publics', 'objectifs', 'joursHoraires',
  'gardeEnfants', 'coursEte', 'formationDispo', 'keyword',
] as const;

export interface FilterModel {
  activites?: string[];
  lieux?: string[];
  scolarisation?: string;
  competence?: string;
  programmes?: string;
  publics?: string[];
  objectifs?: string[];
  joursHoraires?: string[];
  gardeEnfants?: boolean;
  coursEte?: boolean;
  formationDispo?: boolean;
  keyword?: string;
}
