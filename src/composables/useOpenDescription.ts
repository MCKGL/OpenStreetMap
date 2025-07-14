import { ref } from 'vue';

const openSlug = ref<string | null>(null);

/**
 * Ce composable permet de gérer l'état d'ouverture des descriptions (unes seule descriptions
 * peut être ouverte à la fois).
 */
export function useOpenDescription() {
  function toggleDescription(slug: string) {
    openSlug.value = openSlug.value === slug ? null : slug;
  }

  function isDescriptionOpen(slug: string) {
    return openSlug.value === slug;
  }

  return { toggleDescription, isDescriptionOpen };
}

