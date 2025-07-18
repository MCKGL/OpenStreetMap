import type {FiltreModel} from '@/models/Filtre.model'
import type {PermanenceModel} from "@/models/Permanence.model.ts";
import type {StructureModel} from "@/models/Structure.model.ts";
import type {AdresseModel} from "@/models/Adresse.model.ts";
import {
  FormationModel,
  type ObjectifViseModel,
  type programmeModel,
  type publicsSpecifiqueModel
} from "@/models/Formation.model.ts";

export const FILTER_KEYS = [
  'activites', 'lieux', 'scolarisation', 'competence',
  'programmes', 'publics', 'objectifs', 'joursHoraires',
  'gardeEnfants', 'coursEte', 'formationDispo', 'keyword',
] as const;

type ArrayKeys = 'activites' | 'lieux' | 'publics' | 'objectifs' | 'joursHoraires';
type StringKeys = 'scolarisation' | 'competence' | 'programmes' | 'keyword';
type BooleanKeys = 'gardeEnfants' | 'coursEte' | 'formationDispo';

export function hasAdvancedFilters(filters: FiltreModel): boolean {
  return (
    (filters.scolarisation && filters.scolarisation.length > 0) ||
    (filters.competence && filters.competence.length > 0) ||
    (filters.programmes && filters.programmes.length > 0) ||
    (filters.publics && filters.publics.length > 0) ||
    (filters.objectifs && filters.objectifs.length > 0) ||
    (filters.joursHoraires && filters.joursHoraires.length > 0) ||
    filters.gardeEnfants === true ||
    filters.coursEte === true ||
    filters.formationDispo === true
  );
}

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

function normalizeCompetence(c: string): string {
  return c.toLowerCase().replace(/\s*\(.*?\)/g, '').trim();
}

function parseLieuFilter(lieu: string): { ville: string; codePostaux: string[]; departement: string | null } {
  // Le regex permet de capturer le nom de la ville et le code postal ou département entre parenthèses
  const match = lieu.match(/^(.+?)\s*\(([^)]+)\)$/);

  if (match) {
    const ville = match[1].trim();
    const code = match[2].trim();

    // Si code = 2 chiffres → c’est un département
    if (/^\d{2}$/.test(code)) {
      return { ville, codePostaux: [], departement: code };
    }

    // Sinon, ce sont des codes postaux précis (ex: 95000,95800)
    const codePostaux = code
      .split(',')
      .map(cp => cp.replace(/[^\d]/g, '').trim())
      .filter(Boolean);

    return { ville, codePostaux, departement: null };
  }

  // Si jamais le lieu est mal formé, on ignore
  return { ville: '', codePostaux: [], departement: null };
}

/**
 * Cette fonction permet de découper une chaîne de caractères en respectant les parenthèses.
 * Utilisée pour gérer les lieux avec des parenthèses (ex: "Ableiges (95450), Paris (75000)").
 * @param input
 */
function splitRespectingParentheses(input: string): string[] {
  const result: string[] = [];
  let current = '';
  let depth = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
    } else {
      if (char === '(') depth++;
      if (char === ')') depth--;
      current += char;
    }
  }

  if (current) result.push(current.trim());

  return result;
}

/**
 * Cette fonction permet de parser une chaîne de filtres au format "key:value".
 * @param filters
 */
export function parseFilters(filters: string[]): FiltreModel {
  const result: FiltreModel = {};

  filters.forEach(filterStr => {
    const [keyRaw, valueRaw] = filterStr.split(':');
    if (!valueRaw) return;

    const key = keyRaw.trim();

    if ((['gardeEnfants', 'coursEte', "formationDispo"] as BooleanKeys[]).includes(key as BooleanKeys)) {
      result[key as BooleanKeys] = valueRaw.trim() === 'true';

    } else if ((['activites', 'lieux', 'publics', 'objectifs', 'joursHoraires'] as ArrayKeys[]).includes(key as ArrayKeys)) {
      let values: string[];

      if (key === 'lieux') {
        values = splitRespectingParentheses(valueRaw);
      } else {
        values = valueRaw.split(',').map(v => v.trim());
      }

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

function matchActivites(activites: string[] | string, filter: FiltreModel): boolean {
  if (!filter.activites?.length) return true;

  const listeActivites = typeof activites === 'string' ? [activites] : activites ?? [];

  return listeActivites.some(activite =>
    filter.activites!.some(f =>
      activite.toLowerCase().includes(f.toLowerCase())
    )
  );
}

function matchLieux(adresses: AdresseModel[] = [], filter: FiltreModel): boolean {
  if (!filter.lieux || filter.lieux.length === 0) return true;

  const lieuxFiltres = filter.lieux.map(parseLieuFilter);

  return adresses.some(adresse =>
    lieuxFiltres.some(({ ville, codePostaux, departement }) => {
      if (!adresse?.codePostal || !adresse.ville) return false;

      // Cas département (ex: 95)
      if (departement) {
        return adresse.codePostal.startsWith(departement);
      }

      // Cas ville + codePostal complet
      const matchesVille = adresse.ville.toLowerCase() === ville.toLowerCase();
      const matchesCodePostal = codePostaux.includes(adresse.codePostal);

      return matchesVille && matchesCodePostal;
    })
  );
}

function matchKeyword(obj: { nom: string; description?: string }, filter: FiltreModel): boolean {
  if (!filter.keyword?.trim()) return true;

  const keyword = filter.keyword.toLowerCase().trim();
  return obj.nom.toLowerCase().includes(keyword) || obj.description?.toLowerCase().includes(keyword) === true;
}

function matchScolarisation(criteres: string[] = [], filter: FiltreModel): boolean {
  return (filter.scolarisation?.length ?? 0) === 0 ||
    criteres.some(c => filter.scolarisation!.includes(c));
}

function matchPublics(publicsSpecifiques: publicsSpecifiqueModel[] | undefined, filter: FiltreModel): boolean {
  if (!filter.publics?.length) return true;
  if (!Array.isArray(publicsSpecifiques)) return false;

  return publicsSpecifiques.some(p => filter.publics!.includes(p.publicSpecifique));
}

function matchObjectifs(objectifsVises: ObjectifViseModel[] = [], filter: FiltreModel): boolean {
  if (!filter.objectifs?.length) return true;
  if (!Array.isArray(objectifsVises)) return false;

  return objectifsVises.some(o => filter.objectifs!.includes(o.objectifVise));
}

function matchProgrammes(programmes: programmeModel[] = [], filter: FiltreModel): boolean {
  return (filter.programmes?.length ?? 0) === 0 ||
    programmes.some(p => filter.programmes!.includes(p.nom));
}

function matchGardeEnfants(garde: boolean, filter: FiltreModel): boolean {
  return !filter.gardeEnfants || garde;
}

function matchCoursEte(coursEte: boolean, filter: FiltreModel): boolean {
  return !filter.coursEte || coursEte;
}

function matchFormationDispo(formationDispo: boolean, filter: FiltreModel): boolean {
  return !filter.formationDispo || formationDispo;
}

function matchJoursHoraires(horaires: string[] = [], filter: FiltreModel): boolean {
  if (!filter.joursHoraires?.length) return true;

  const formationHoraires = horaires.map(h => h.toLowerCase().trim());

  return filter.joursHoraires.every(filtre => {
    const filtreStr = filtre.toLowerCase().trim();

    if (!filtreStr.includes(':')) {
      const momentFiltre = filtreStr;
      return formationHoraires.some(h => h.endsWith(`:${momentFiltre}`));
    }

    const [jourFiltre, momentFiltre] = filtreStr.split(':');

    if (momentFiltre === 'toute la journee') {
      return formationHoraires.some(h => h.startsWith(`${jourFiltre}:`));
    }

    return formationHoraires.some(h => h === `${jourFiltre}:${momentFiltre}`);
  });
}

function matchCompetence(competences: string[] = [], filter: FiltreModel): boolean {
  if (!filter.competence?.trim()) return true;

  const normalizedFilter = normalizeCompetence(filter.competence);
  const normalizedFormation = competences.map(normalizeCompetence);

  return normalizedFormation.includes(normalizedFilter);
}

export function permanencesFiltered(permanences: PermanenceModel[], filter: FiltreModel): PermanenceModel[] {
  if (filter.formationDispo) return [];

  return permanences.filter(p =>
    matchLieux(p.adresses, filter)
  );
}

export function structuresFiltered(structures: StructureModel[], filter: FiltreModel): StructureModel[] {
  const hasAdvancedFilter =
    !!filter.competence ||
    !!filter.coursEte ||
    !!filter.gardeEnfants ||
    !!filter.formationDispo ||
    !!filter.joursHoraires?.length ||
    !!filter.objectifs?.length ||
    !!filter.programmes ||
    !!filter.publics?.length ||
    !!filter.scolarisation;

  if (hasAdvancedFilter) return [];

  return structures.filter(s =>
    matchActivites(s.activitesFormation, filter) &&
    matchLieux(s.adresses, filter) &&
    matchKeyword(s, filter)
  );
}

export function formationsFiltered(formations: FormationModel[], filter: FiltreModel): FormationModel[] {
  return formations.filter(f =>
    matchActivites(f.activite, filter) &&
    matchLieux(f.adresses, filter) &&
    matchKeyword(f, filter) &&
    matchScolarisation(f.criteresScolarisation, filter) &&
    matchPublics(f.publicsSpecifiques, filter) &&
    matchObjectifs(f.objectifsVises, filter) &&
    matchProgrammes(f.programmes, filter) &&
    matchGardeEnfants(f.gardeEnfants, filter) &&
    matchCoursEte(f.coursEte, filter) &&
    matchFormationDispo(f.placeDisponible, filter) &&
    matchCompetence(f.competencesLinguistiquesVisees, filter) &&
    matchJoursHoraires(f.joursHoraires, filter)
  );
}

export function adressesFiltered(adresses: AdresseModel[], filter: FiltreModel): AdresseModel[] {
  return adresses
    .filter(adresse => matchLieux([adresse], filter))
    .map(adresse => ({
      ...adresse,
      formations: formationsFiltered(adresse.formations ?? [], filter),
      structures: structuresFiltered(adresse.structures ?? [], filter),
      permanences: permanencesFiltered(adresse.permanences ?? [], filter)
    }))
    .filter(adresse =>
      adresse.formations.length > 0 ||
      adresse.structures.length > 0 ||
      adresse.permanences.length > 0
    );
}
