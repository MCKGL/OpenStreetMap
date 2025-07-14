import { ref } from 'vue';

const openSlug = ref<string | null>(null);

/**
 * Ce composable permet de gérer l'état d'ouverture des descriptions (une seule descriptions
 * peut être ouverte à la fois).
 * Les descriptions s'ouvrent au clic sur la liste ou sur un point de la carte.
 */
export function useOpenDescription() {
  function toggleDescription(slug: string) {
    openSlug.value = openSlug.value === slug ? null : slug;
  }

  function openDescription(slug: string) {
    openSlug.value = slug;
  }

  function isDescriptionOpen(slug: string) {
    return openSlug.value === slug;
  }

  return {
    toggleDescription,
    openDescription,
    isDescriptionOpen
  };
}

