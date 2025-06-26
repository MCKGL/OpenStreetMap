<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import { PermanenceModel } from '@/models/Permanence.model.ts';
import {useParsedFilters} from "@/composables/useParsedFilters.ts";
import {permanencesFiltered} from "@/utils/filters.ts";

const router = useRouter();
const route = useRoute();
const isOpen = ref(true);
const filters = useParsedFilters();

const props = defineProps<{
  permanences: PermanenceModel[];
}>();

const filteredPermanences = computed(() =>
  permanencesFiltered(props.permanences, filters.value)
);

function navigateTo(permanence: PermanenceModel) {
  const adresses = permanence.adresses || [];

  const query: Record<string, string | undefined> = {
    ...route.query,
    type: 'permanence',
    slug: permanence.slug,
  };

  delete query.latitude;
  delete query.longitude;
  delete query.structureSlug;

  if (adresses.length === 1) {
    const [a] = adresses;

    if (a.latitude && a.longitude) {
      query.latitude = a.latitude.toString();
      query.longitude = a.longitude.toString();
    }
  }
  router.push({ query });
}

function toggleList() {
  isOpen.value = !isOpen.value;
}

function isHighlighted(permanence: PermanenceModel): boolean {
  return (
    route.query.type === 'permanence' &&
    route.query.slug === permanence.slug
  );
}

onMounted(() => {
  const slug = route.query.slug;
  if (route.query.type === 'permanence' && typeof slug === 'string') {
    nextTick(() => {
      const el = document.getElementById(`permanence-${slug}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
});

watch(
  () => route.query,
  (query) => {
    if (query.type === 'permanence' && typeof query.slug === 'string') {
      nextTick(() => {
        const el = document.getElementById(`permanence-${query.slug}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  },
  { immediate: true }
);

</script>

<template>
  <div class="list-header">
    <h2>Liste des Permanences {{filteredPermanences.length}}</h2>
    <button
      class="toggle-btn"
      @click="toggleList"
      :aria-label="isOpen ? 'Fermer la liste' : 'Ouvrir la liste'"
    >
      {{ isOpen ? '«' : '»' }}
    </button>
  </div>
  <ul v-show="isOpen">
    <li
      v-for="permanence in filteredPermanences"
      :key="permanence.id"
      @click="navigateTo(permanence)"
      :id="`permanence-${permanence.slug}`"
      :class="{ highlighted: isHighlighted(permanence) }"
    >
      {{ permanence.nom }} – Nombre d'adresses : {{ permanence.adresses.length }}
    </li>
  </ul>
</template>

<style scoped>
.list-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
}

.toggle-btn:focus {
  outline: 2px solid #007acc;
}

li {
  list-style: inside;
  padding: 5px;
  cursor: pointer;
}

li:hover {
  background-color: #f0f0f0;
}

.highlighted {
  background-color: #e0f7fa;
  font-weight: bold;
}
</style>
