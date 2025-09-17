import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { parseFilters } from '@/utils/filters.ts'
import { FILTER_KEYS, type FilterModel } from '@/types/FilterType.ts'

type FilterKey = typeof FILTER_KEYS[number];

export function useParsedFilters() {
  const route = useRoute()
  const router = useRouter()
  const parsedFilters = ref<FilterModel>({})

  function notifyParent() {
    const queryString = new URLSearchParams(route.query as any).toString();
    const parentOrigin = window.parent.location.origin;

    // Liste des sites parents autorisés
    const allowedOrigins = [
      'https://www.reseau-alpha.org/',
      'https://staging-www.reseau-alpha.org/',
    ];

    if (allowedOrigins.includes(parentOrigin)) {
      window.parent.postMessage(
        { type: 'search-update', params: queryString },
        parentOrigin
      );
    }
  }

  function updateFilters() {
    const raw = Object.entries(route.query)
      .filter(([key]) => FILTER_KEYS.includes(key as FilterKey))
      .map(([key, val]) =>
        Array.isArray(val) ? `${key}:${val.join(',')}` : `${key}:${val}`
      )
    parsedFilters.value = parseFilters(raw)
  }

  // Met à jour filters + notifie parent si changement utilisateur
  function update() {
    updateFilters()
    notifyParent()
  }

  // Initialisation
  // au démarrage, on initialise les filtres sans notifier le parent
  updateFilters()

  // Watch query pour updates utilisateur
  watch(
    () => route.query,
    () => update(),
    { deep: true }
  )

  // Recevoir params du parent (au refresh ou load)
  onMounted(() => {
    window.addEventListener("message", (event) => {
      if (event.data?.type === "set-search" && event.data.params) {
        const paramsObj = Object.fromEntries(new URLSearchParams(event.data.params))
        // Remplace la query côté enfant seulement, ne touche pas au parent
        router.replace({ path: route.path, query: paramsObj })
      }
    })
  })

  return parsedFilters
}
