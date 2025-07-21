export type ProgrammeCode = 'PH' | 'REFUG' | 'PLVP';

export const programmeMap: Record<string, ProgrammeCode> = {
  'Paris Hospitalités': 'PH',
  'REFUG (Ville de Paris)': 'REFUG',
  'Parcours Linguistiques à Visée Professionnelle – PLVP (Ville de Paris)': 'PLVP'
};
