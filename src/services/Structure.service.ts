import type {StructureModel} from '@/models/Structure.model.ts';
import type {PermanenceModel} from '@/models/Permanence.model.ts';

const JSON_PATH = import.meta.env.DEV
  ? '/api/cartographie.json'
  : 'https://www.reseau-alpha.org/cartographie.json';

// Cache partagé pour tout le JSON
let _rawCache: { structures: StructureModel[]; permanences: PermanenceModel[] } | null = null;
let _cacheTimestamp = 0;

// Durée de vie du cache : 10 minutes
const CACHE_DURATION = 10 * 60 * 1000;

interface ApiResponse {
  structures: StructureModel[];
  permanences: PermanenceModel[];
}

/**
 * Charge et met en cache le JSON complet (structures+permanences)
 */
function fetchAll(): Promise<ApiResponse> {
  const now = Date.now();
  if (_rawCache && now - _cacheTimestamp < CACHE_DURATION) {
    return Promise.resolve(_rawCache);
  }
  return fetch(JSON_PATH)
    .then(res => {
      if (!res.ok) throw new Error(`Erreur ${res.status} lors de la récupération du JSON`);
      return res.json() as Promise<ApiResponse>;
    })
    .then(data => {
      _rawCache = data;
      _cacheTimestamp = Date.now();
      return data;
    });
}

/**
 * Renvoie la liste des structures
 */
export function getStructures(): Promise<StructureModel[]> {
  return fetchAll().then(data => data.structures);
}

/**
 * Renvoie une seule structure par ID
 */
export function getStructureById(id: number): Promise<StructureModel> {
  return getStructures().then(list => {
    const s = list.find(s => s.id === id);
    if (!s) throw new Error(`Structure avec l'ID ${id} introuvable`);
    return s;
  });
}

/**
 * Renvoie une seule structure par Slug
 */
export function getStructureBySlug(slug: string): Promise<StructureModel> {
  return getStructures().then(list => {
    const s = list.find(s => s.slug === slug);
    if (!s) throw new Error(`Structure avec slug ${slug} introuvable`);
    return s;
  });
}

/**
 * Renvoie la liste des permanences
 */
export function getPermanences(): Promise<PermanenceModel[]> {
  return fetchAll().then(data => data.permanences);
}

/**
 * Renvoie une seule permanence par ID
 */
export function getPermanenceById(id: number): Promise<PermanenceModel> {
  return getPermanences().then(list => {
    const p = list.find(p => p.id === id);
    if (!p) throw new Error(`Permanence avec l'ID ${id} introuvable`);
    return p;
  });
}

/**
 * Renvoie une seule permanence par slug
 */
export function getPermanenceBySlug(slug: string): Promise<PermanenceModel> {
  return getPermanences().then(list => {
    const p = list.find(p => p.slug === slug);
    if (!p) throw new Error(`Permanence avec slug ${slug} introuvable`);
    return p;
  });
}
