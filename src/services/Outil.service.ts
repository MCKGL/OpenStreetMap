import type { OutilModel } from '@/models/Outil.model.ts';
import { apiFetch } from './apiClient.ts';

/**
 * Récupère un outil par son slug
 */
export async function getOutilBySlug(slug: string): Promise<OutilModel> {
  return apiFetch<OutilModel>(`/outil.json?slug=${encodeURIComponent(slug)}`);
}
