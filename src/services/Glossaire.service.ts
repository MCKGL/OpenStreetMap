import type { GlossaireModel } from "@/models/Glossaire.model";
import { apiFetch } from "./apiClient";

/**
 * Récupère l'ensemble du glossaire (linguistique + accompagnement)
 */
export async function getGlossaire(): Promise<GlossaireModel> {
  return apiFetch<GlossaireModel>("/glossaire.json");
}
