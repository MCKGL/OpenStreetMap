import type { StructureModel } from '@/models/Structure.model.ts';
import type { PermanenceModel } from '@/models/Permanence.model.ts';
import type { AdresseModel } from "@/models/Adresse.model.ts";
import type { FormationModel } from "@/models/Formation.model.ts";
import { apiFetch } from './apiClient.ts';

interface ApiResponse {
  structures: StructureModel[];
  permanences: PermanenceModel[];
}

type EntityRef = StructureModel | PermanenceModel | FormationModel;

function cloneAdresse(a: AdresseModel): AdresseModel {
  return { ...a, structures: [], permanences: [], formations: [] };
}

/**
 * Charge le JSON complet (structures + permanences)
 */
async function fetchAll(): Promise<ApiResponse> {
  const data = await apiFetch<ApiResponse>('/cartographie.json', { useCache: true });
  data.structures = data.structures?.filter(s => s.slug !== 'test-reseau-alpha') ?? [];
  data.permanences = data.permanences?.filter(p => p.slug !== 'test-reseau-alpha') ?? [];
  return data;
}

/**
 * Renvoie la liste des structures
 */
export async function getStructures(): Promise<StructureModel[]> {
  return (await fetchAll()).structures;
}

/**
 * Renvoie une seule structure par ID
 */
export async function getStructureById(id: number): Promise<StructureModel> {
  const list = await getStructures();
  const s = list.find(s => s.id === id);
  if (!s) throw new Error(`Structure introuvable`);
  return s;
}

/**
 * Renvoie une seule structure par Slug
 */
export async function getStructureBySlug(slug: string): Promise<StructureModel> {
  const data = await apiFetch<{ structure: StructureModel }>(
    `/structure.json?slug=${encodeURIComponent(slug)}`
  );
  if (!data.structure) throw new Error(`Structure introuvable`);
  return data.structure;
}

/**
 * Renvoie la liste des permanences
 */
export async function getPermanences(): Promise<PermanenceModel[]> {
  return (await fetchAll()).permanences;
}

/**
 * Renvoie une seule permanence par ID
 */
export async function getPermanenceById(id: number): Promise<PermanenceModel> {
  const list = await getPermanences();
  const p = list.find(p => p.id === id);
  if (!p) throw new Error(`Permanence introuvable`);
  return p;
}

/**
 * Renvoie une seule permanence par slug
 */
export async function getPermanenceBySlug(slug: string): Promise<PermanenceModel> {
  const data = await apiFetch<{ permanence: PermanenceModel }>(
    `/structure.json?slug=${encodeURIComponent(slug)}`
  );
  if (!data.permanence) throw new Error(`Permanence introuvable`);
  return data.permanence;
}

/**
 * Renvoie toutes les formations
 */
export async function getFormations(): Promise<FormationModel[]> {
  const { structures, permanences } = await fetchAll();
  const formations: FormationModel[] = [];

  for (const s of structures) {
    for (const f of s.formations || []) formations.push({ ...f, structure: s });
  }
  for (const p of permanences) {
    for (const f of p.formations || []) formations.push({ ...f, permanence: p });
  }

  return formations;
}

/**
 * Renvoie toutes les adresses (structure, permanence, formation)
 * ⚠ Inclut les adresses des formations rattachées aux structures et permanences
 */
export async function getAdresses(): Promise<AdresseModel[]> {
  const { structures, permanences } = await fetchAll();
  const map = new Map<string, AdresseModel>();

  function addAdresse(
    a: AdresseModel,
    type: 'structure' | 'permanence' | 'formation',
    ref: StructureModel | PermanenceModel | FormationModel
  ) {
    const key = `${a.latitude}-${a.longitude}-${type}`;
    if (!map.has(key)) map.set(key, cloneAdresse(a));
    const adresse = map.get(key)!;

    if (type === 'structure') adresse.structures!.push(ref as StructureModel);
    if (type === 'permanence') adresse.permanences!.push(ref as PermanenceModel);
    if (type === 'formation') adresse.formations!.push(ref as FormationModel);
  }

  for (const s of structures) {
    for (const a of s.adresses || []) addAdresse(a, 'structure', s);
    for (const f of s.formations || [])
      for (const a of f.adresses || []) addAdresse(a, 'formation', { ...f, structure: s });
  }

  for (const p of permanences) {
    for (const a of p.adresses || []) addAdresse(a, 'permanence', p);
    for (const f of p.formations || [])
      for (const a of f.adresses || []) addAdresse(a, 'formation', { ...f, permanence: p });
  }

  return Array.from(map.values());
}

export async function getAdressesByStructureSlug(slug: string): Promise<AdresseModel[]> {
  const structure = await getStructureBySlug(slug);
  const map = new Map<string, AdresseModel>();

  function addAdresse(a: AdresseModel, key: string, type: string, ref: EntityRef) {
    if (!map.has(key)) map.set(key, cloneAdresse(a));
    const adresse = map.get(key)!;
    if (type === 'structure') adresse.structures!.push(ref as StructureModel);
    if (type === 'formation') adresse.formations!.push(ref as FormationModel);
  }

  for (const a of structure.adresses || [])
    addAdresse(a, `${a.latitude}-${a.longitude}-structure`, 'structure', structure);

  for (const f of structure.formations || []) {
    for (const a of f.adresses || [])
      addAdresse(a, `${a.latitude}-${a.longitude}-formation`, 'formation', { ...f, structure });
  }

  return Array.from(map.values());
}

export async function getAdressesByPermanenceSlug(slug: string): Promise<AdresseModel[]> {
  const permanence = await getPermanenceBySlug(slug);
  const map = new Map<string, AdresseModel>();

  function addAdresse(a: AdresseModel, key: string, type: string, ref: EntityRef) {
    if (!map.has(key)) map.set(key, cloneAdresse(a));
    const adresse = map.get(key)!;
    if (type === 'permanence') adresse.permanences!.push(ref as PermanenceModel);
    if (type === 'formation') adresse.formations!.push(ref as FormationModel);
  }

  for (const a of permanence.adresses || [])
    addAdresse(a, `${a.latitude}-${a.longitude}-permanence`, 'permanence', permanence);

  for (const f of permanence.formations || []) {
    for (const a of f.adresses || [])
      addAdresse(a, `${a.latitude}-${a.longitude}-formation`, 'formation', { ...f, permanence });
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
  for (const a of formation.adresses || []) {
    const key = `${a.latitude}-${a.longitude}-formation`;
    if (!map.has(key)) map.set(key, cloneAdresse(a));
    map.get(key)!.formations!.push(formation);
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
    if (!map.has(key)) map.set(key, cloneAdresse(a));
    map.get(key)!.permanences!.push(ref);
  }

  for (const p of permanences) {
    for (const lieu of p.lieux ? [p.lieux] : []) {
      for (const adresse of lieu.adressesCoordination || []) addLieu(adresse, p);
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
    map.get(key)!.permanences!.push(ref);
  }

  for (const lieu of permanence.lieux ? [permanence.lieux] : []) {
    for (const adresse of lieu.adressesCoordination || []) addLieu(adresse, permanence);
  }

  return Array.from(map.values());
}
