import type { FiltreModel } from '@/models/Filtre.model'

export const FILTER_KEYS = [
  'activites', 'lieux', 'scolarisation', 'competence',
  'programmes', 'publics', 'objectifs', 'joursHoraires',
  'gardeEnfant', 'coursEte', 'keyword',
] as const;

function normalizeFilterJourHoraire(str: string): string {
  const s = str.toLowerCase().trim();
  const processed = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const jours = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  for (const jour of jours) {
    if (processed.startsWith(jour + ' ')) {
      return `${jour}:${processed.slice(jour.length + 1)}`;
    }
  }
  return processed;
}

export function parseLieuFilter(lieu: string): { ville: string; codePostal: string | null } {
  const match = lieu.match(/\((\d{2,5})\)$/);
  const codePostal = match ? match[1] : null;
  const ville = lieu.replace(/\s*\(\d{2,5}\)$/, '').trim();
  return { ville, codePostal };
}

type ArrayKeys = 'activites' | 'lieux' | 'publics' | 'objectifs' | 'joursHoraires';
type StringKeys = 'scolarisation' | 'competence' | 'programmes' | 'keyword';
type BooleanKeys = 'gardeEnfant' | 'coursEte';
export function parseFilters(filters: string[]): FiltreModel {
  const result: FiltreModel = {};

  filters.forEach(filterStr => {
    const [keyRaw, valueRaw] = filterStr.split(':');
    if (!valueRaw) return;

    const key = keyRaw.trim();

    if ((['gardeEnfant', 'coursEte'] as BooleanKeys[]).includes(key as BooleanKeys)) {
      result[key as BooleanKeys] = valueRaw.trim() === 'true';
    } else if ((['activites', 'lieux', 'publics', 'objectifs', 'joursHoraires'] as ArrayKeys[]).includes(key as ArrayKeys)) {
      const values = valueRaw.split(',').map(v => v.trim());
      if (key === 'joursHoraires') {
        result[key as ArrayKeys] = values.map(normalizeFilterJourHoraire);
      } else {
        result[key as ArrayKeys] = values;
      }
    } else if ((['scolarisation', 'competence', 'programmes', 'keyword'] as StringKeys[]).includes(key as StringKeys)) {
      result[key as StringKeys] = valueRaw.trim();
    }
  });

  return result;
}

