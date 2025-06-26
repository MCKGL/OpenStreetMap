import type { DepartementModel } from '@/models/Departement.model.ts';
import type { VilleModel } from '@/models/Ville.model.ts';

const JSON_PATH = import.meta.env.DEV
  ? '/api/villes-departements.json'
  : 'https://staging-www.reseau-alpha.org/villes-departements.json';

// Cache partagé pour le JSON des villes et départements
let _rawCache: { Départements: Record<string, DepartementModel>, Ville: Record<string, VilleModel> } | null = null;
let _cacheTimestamp = 0;

// Durée de vie du cache : 10 minutes
const CACHE_DURATION = 10 * 60 * 1000;

interface ApiResponse {
  Départements: Record<string, DepartementModel>;
  Ville: Record<string, VilleModel>;
}

/**
 * Charge et met en cache le JSON des villes et départements
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
 * Renvoie la liste des départements
 */
export function getDepartements(): Promise<DepartementModel[]> {
  return fetchAll().then(data => Object.values(data.Départements));
}

/**
 * Renvoie la liste des villes
 */
export function getVilles(): Promise<VilleModel[]> {
  return fetchAll().then(data => Object.values(data.Ville));
}
