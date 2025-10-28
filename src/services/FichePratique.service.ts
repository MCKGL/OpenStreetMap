import type {FichePratiqueModel} from "@/models/FichePratique.model.ts";
import {apiFetch} from "@/services/apiClient.ts";

export async function getFichePratiqueBySlug(slug: string): Promise<FichePratiqueModel> {
  return apiFetch<FichePratiqueModel>(`/fiche-pratique.json?slug=${encodeURIComponent(slug)}`);
}
