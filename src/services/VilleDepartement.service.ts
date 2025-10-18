import type { DepartementModel } from '@/models/Departement.model.ts';
import type { VilleModel } from '@/models/Ville.model.ts';
import { apiFetch } from './apiClient.ts';

interface ApiResponse {
  Départements: Record<string, DepartementModel>;
  Ville: Record<string, VilleModel>;
}

export async function getDepartements(): Promise<DepartementModel[]> {
  const data = await apiFetch<ApiResponse>('/villes-departements.json', { useCache: true });
  return Object.values(data.Départements);
}

export async function getVilles(): Promise<VilleModel[]> {
  const data = await apiFetch<ApiResponse>('/villes-departements.json', { useCache: true });
  return Object.values(data.Ville);
}
