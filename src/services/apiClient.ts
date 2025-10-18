import { CONFIG } from '@/config.ts';

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const cache: Record<string, { data: unknown; timestamp: number }> = {};

/**
 * Fonction générique pour effectuer des requêtes API avec gestion du cache
 * @param path Chemin relatif ou URL complète de l'API
 * @param options Options supplémentaires (useCache)
 * @returns Données typées renvoyées par l'API
 */
export async function apiFetch<T>(
  path: string,
  { useCache = false }: { useCache?: boolean } = {}
): Promise<T> {
  const url = path.startsWith('http')
    ? path
    : `${CONFIG.JSON_PATH_PREFIX}${path}`;

  if (useCache && cache[url] && Date.now() - cache[url].timestamp < CACHE_DURATION) {
    return cache[url].data as T;
  }

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error('Une erreur est survenue lors du chargement des données.');
  }

  const data = (await res.json()) as T;

  if (useCache) {
    cache[url] = { data, timestamp: Date.now() };
  }

  return data;
}
