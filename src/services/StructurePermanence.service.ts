import type {StructureModel} from '@/models/Structure.model.ts';
import type {PermanenceModel} from '@/models/Permanence.model.ts';
import type {AdresseModel} from "@/models/Adresse.model.ts";
import type {FormationModel} from "@/models/Formation.model.ts";

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

function cloneAdresse(a: AdresseModel): AdresseModel {
  return {
    ...a,
    structures: [],
    permanences: [],
    formations: [],
  };
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
      data.structures = data.structures?.filter(s => s.slug !== 'test-reseau-alpha') ?? [];
      data.permanences = data.permanences?.filter(p => p.slug !== 'test-reseau-alpha') ?? [];

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

/**
 * Renvoie la liste de toutes les formations (rattachées à une structure ou à une permanence)
 */
export async function getFormations(): Promise<FormationModel[]> {
  const { structures, permanences } = await fetchAll();

  const formations: FormationModel[] = [];

  for (const s of structures) {
    for (const f of s.formations || []) {
      formations.push({ ...f, structure: s });
    }
  }

  for (const p of permanences) {
    for (const f of p.formations || []) {
      formations.push({ ...f, permanence: p });
    }
  }

  return formations;
}

/**
 * Regroupe toutes les adresses en un seul tableau enrichi (structure, permanence, formation)
 */
export async function getAdresses(): Promise<AdresseModel[]> {
  const { structures, permanences } = await fetchAll();

  const map = new Map<string, AdresseModel>();

  function addAdresse(a: AdresseModel, type: 'structure' | 'permanence' | 'formation', ref: StructureModel | PermanenceModel | FormationModel) {
    const key = `${a.latitude}-${a.longitude}-${type}`;
    if (!map.has(key)) {
      map.set(key, cloneAdresse(a));
    }
    const adresse = map.get(key)!;

    if (type === 'structure') adresse.structures!.push(ref as StructureModel);
    if (type === 'permanence') adresse.permanences!.push(ref as PermanenceModel);
    if (type === 'formation') adresse.formations!.push(ref as FormationModel);
  }

  for (const s of structures) {
    for (const a of s.adresses || []) {
      addAdresse(a, 'structure', s);
    }
    for (const f of s.formations || []) {
      for (const a of f.adresses || []) {
        addAdresse(a, 'formation', { ...f, structure: s });
      }
    }
  }

  for (const p of permanences) {
    for (const a of p.adresses || []) {
      addAdresse(a, 'permanence', p);
    }
    for (const f of p.formations || []) {
      for (const a of f.adresses || []) {
        addAdresse(a, 'formation', { ...f, permanence: p });
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Renvoie les adresses pour une structure donnée (slug)
 */
export async function getAdressesByStructureSlug(slug: string): Promise<AdresseModel[]> {
  const structure = await getStructureBySlug(slug);
  const map = new Map<string, AdresseModel>();

  function addAdresse(a: AdresseModel, type: 'structure' | 'formation', ref: StructureModel | FormationModel) {
    const key = `${a.latitude}-${a.longitude}-${type}`;
    if (!map.has(key)) map.set(key, cloneAdresse(a));
    const adresse = map.get(key)!;

    if (type === 'structure') adresse.structures!.push(ref as StructureModel);
    if (type === 'formation') adresse.formations!.push(ref as FormationModel);
  }

  // Adresses de la structure
  for (const a of structure.adresses || []) {
    addAdresse(a, 'structure', structure);
  }

  // Adresses des formations rattachées à la structure
  for (const f of structure.formations || []) {
    for (const a of f.adresses || []) {
      addAdresse(a, 'formation', { ...f, structure });
    }
  }

  return Array.from(map.values());
}

/**
 * Renvoie les adresses pour une permanence donnée (slug)
 */
export async function getAdressesByPermanenceSlug(slug: string): Promise<AdresseModel[]> {
  const permanence = await getPermanenceBySlug(slug);
  const map = new Map<string, AdresseModel>();

  function addAdresse(a: AdresseModel, type: 'permanence' | 'formation', ref: PermanenceModel | FormationModel) {
    const key = `${a.latitude}-${a.longitude}-${type}`;
    if (!map.has(key)) map.set(key, cloneAdresse(a));
    const adresse = map.get(key)!;

    if (type === 'permanence') adresse.permanences!.push(ref as PermanenceModel);
    if (type === 'formation') adresse.formations!.push(ref as FormationModel);
  }

  // Adresses de la permanence
  for (const a of permanence.adresses || []) {
    addAdresse(a, 'permanence', permanence);
  }

  // Adresses des formations rattachées à la permanence
  for (const f of permanence.formations || []) {
    for (const a of f.adresses || []) {
      addAdresse(a, 'formation', { ...f, permanence });
    }
  }

  return Array.from(map.values());
}

/**
 * Renvoie les adresses pour une formation donnée (slug)
 */
export async function getAdressesByFormationSlug(slug: string): Promise<AdresseModel[]> {
  const formations = await getFormations();
  const formation = formations.find(f => f.slug === slug);
  if (!formation) throw new Error(`Formation avec slug ${slug} introuvable`);

  const map = new Map<string, AdresseModel>();

  function addAdresse(a: AdresseModel, ref: FormationModel) {
    const key = `${a.latitude}-${a.longitude}-formation`;
    if (!map.has(key)) map.set(key, cloneAdresse(a));
    const adresse = map.get(key)!;
    adresse.formations!.push(ref);
  }

  for (const a of formation.adresses || []) {
    addAdresse(a, formation);
  }

  return Array.from(map.values());
}

/**
 * Renvoie la liste des lieux de permanences (lieux = adresses de coordinations)
 */
export async function getLieux(): Promise<AdresseModel[]> {
  const { permanences } = await fetchAll();

  const map = new Map<string, AdresseModel>();

  function addLieu(a: AdresseModel, ref: PermanenceModel) {
    const key = `${a.latitude}-${a.longitude}-permanence`;
    if (!map.has(key)) {
      map.set(key, {
        ...a,
        structures: [],
        permanences: [],
        formations: []
      });
    }
    const adresse = map.get(key)!;
    adresse.permanences!.push(ref);
  }

  for (const p of permanences) {
    for (const lieu of p.lieux ? [p.lieux] : []) {
      // on récupère toutes les adresses du lieu
      for (const adresse of lieu.adressesCoordination || []) {
        addLieu(adresse, p);
      }
    }
  }

  return Array.from(map.values());
}

/**
 * Renvoie les lieux pour une permanence donnée (slug)
 */
export async function getLieuxByPermanenceSlug(slug: string): Promise<AdresseModel[]> {
  const permanence = await getPermanenceBySlug(slug);
  const map = new Map<string, AdresseModel>();

  function addLieu(a: AdresseModel, ref: PermanenceModel) {
    const key = `${a.latitude}-${a.longitude}-permanence`;
    if (!map.has(key)) map.set(key, cloneAdresse(a));
    const adresse = map.get(key)!;
    adresse.permanences!.push(ref);
  }

  for (const lieu of permanence.lieux ? [permanence.lieux] : []) {
    // récupération des adressesCoordination dans le lieu
    for (const adresse of lieu.adressesCoordination || []) {
      addLieu(adresse, permanence);
    }
  }

  return Array.from(map.values());
}
