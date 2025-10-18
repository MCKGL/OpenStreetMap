import type { ProgrammeModel } from '@/models/Programme.model.ts';
import { apiFetch } from './apiClient.ts';

interface ProgrammeResponse {
  [key: string]: string;
}

/**
 * Renvoie la liste des programmes sous forme de `ProgrammeModel[]`
 */
export async function getProgrammes(): Promise<ProgrammeModel[]> {
  const data = await apiFetch<ProgrammeResponse>('/programmes.json', { useCache: true });
  return Object.entries(data).map(([_, value]) => ({ nom: value }));
}
