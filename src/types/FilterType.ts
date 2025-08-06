export type ArrayKeys = 'activites' | 'lieux' | 'publics' | 'objectifs' | 'joursHoraires' | 'scolarisation' | 'competence' | 'programmes';
export type StringKeys = 'keyword';
export type BooleanKeys = 'gardeEnfants' | 'coursEte' | 'formationDispo' | 'permanencesSeules' | 'structuresSeules' | 'formationsSeules';

export const FILTER_KEYS = [
  'activites', 'lieux', 'scolarisation', 'competence',
  'programmes', 'publics', 'objectifs', 'joursHoraires',
  'permanencesSeules', 'structuresSeules', 'formationsSeules',
  'gardeEnfants', 'coursEte', 'formationDispo', 'keyword',
] as const;

export interface FilterModel {
  activites?: string[];
  lieux?: string[];
  scolarisation?: string[];
  competence?: string[];
  programmes?: string[];
  publics?: string[];
  objectifs?: string[];
  joursHoraires?: string[];
  permanencesSeules?: boolean;
  structuresSeules?: boolean;
  formationsSeules?: boolean;
  gardeEnfants?: boolean;
  coursEte?: boolean;
  formationDispo?: boolean;
  keyword?: string;
}
