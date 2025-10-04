import type { ProgrammeModel } from '@/models/Programme.model.ts';
import {CONFIG} from "@/config.ts";

const JSON_PATH = import.meta.env.DEV
  ? '/api/programmes.json'
  : `${CONFIG.JSON_PATH_PREFIX}/programmes.json`;

let _cache: Record<string, string> | null = null;
let _cacheTimestamp = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

/**
 * Charge et met en cache les programmes
 */
function fetchAll(): Promise<Record<string, string>> {
  const now = Date.now();
  if (_cache && now - _cacheTimestamp < CACHE_DURATION) {
    return Promise.resolve(_cache);
  }
  return fetch(JSON_PATH)
    .then(res => {
      if (!res.ok) throw new Error(`Erreur ${res.status} lors de la récupération du JSON`);
      return res.json() as Promise<Record<string, string>>;
    })
    .then(data => {
      _cache = data;
      _cacheTimestamp = Date.now();
      return data;
    });
}

/**
 * Renvoie la liste des programmes sous forme de `ProgrammeModel[]`
 */
export function getProgrammes(): Promise<ProgrammeModel[]> {
  return fetchAll().then(data =>
    Object.entries(data).map(([key, value]) => {
      return { nom: value };
    })
  );
}
