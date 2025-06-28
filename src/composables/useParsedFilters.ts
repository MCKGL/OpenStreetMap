import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {FILTER_KEYS, parseFilters} from '@/utils/filters'
import type { FiltreModel } from '@/models/Filtre.model'

type FilterKey = typeof FILTER_KEYS[number];
export function useParsedFilters() {
  const route = useRoute()
  const parsedFilters = ref<FiltreModel>({})

  function update() {
    const raw = Object.entries(route.query)
      .filter(([key]) => FILTER_KEYS.includes(key as FilterKey))
      .map(([key, val]) =>
        Array.isArray(val) ? `${key}:${val.join(',')}` : `${key}:${val}`
      )
    parsedFilters.value = parseFilters(raw)
  }

  update()
  watch(() => route.query, update, { deep: true })

  return parsedFilters
}
