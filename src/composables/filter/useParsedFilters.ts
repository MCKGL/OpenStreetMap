import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {parseFilters} from '@/utils/filters.ts'
import {FILTER_KEYS, type FilterModel} from "@/types/FilterType.ts";

type FilterKey = typeof FILTER_KEYS[number];
export function useParsedFilters() {
  const route = useRoute()
  const parsedFilters = ref<FilterModel>({})

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
