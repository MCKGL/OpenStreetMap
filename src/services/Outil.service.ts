// src/services/Outil.service.ts
import type { OutilModel } from '@/models/Outil.model.ts';
import { CONFIG } from '@/config.ts';

const BASE_URL = `${CONFIG.JSON_PATH_PREFIX}/outil.json`;

/**
 * Récupère un outil par son slug
 */
export async function getOutilBySlug(slug: string): Promise<OutilModel> {
  const url = `${BASE_URL}?slug=${encodeURIComponent(slug)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  return await res.json() as OutilModel;
}

