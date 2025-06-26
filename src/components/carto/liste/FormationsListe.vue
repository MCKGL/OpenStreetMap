<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import type { FormationModel } from "@/models/Formation.model.ts";
import {useParsedFilters} from "@/composables/useParsedFilters.ts";
import {formationsFiltered} from "@/utils/filters.ts";

const router = useRouter();
const route = useRoute();
const isOpen = ref(true);
const filters = useParsedFilters();

const props = defineProps<{
  formations: FormationModel[];
}>();

const filteredStructures = computed(() =>
  formationsFiltered(props.formations, filters.value)
);

function navigateTo(formation: FormationModel) {
  const adresses = formation.adresses || [];

  const query: Record<string, string | undefined> = {
    ...route.query,
    type: 'formation',
    slug: formation.slug,
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

    if (
      formation.structure?.adresses?.some(sa =>
        sa.latitude === a.latitude && sa.longitude === a.longitude
      )
    ) {
      query.structureSlug = formation.structure.slug;
    }
  }

  router.push({ query });
}

function toggleList() {
  isOpen.value = !isOpen.value;
}

function isHighlighted(formation: FormationModel): boolean {
  return (
    route.query.type === 'formation' &&
    route.query.slug === formation.slug
  );
}

onMounted(() => {
  const slug = route.query.slug;
  if (route.query.type === 'formation' && typeof slug === 'string') {
    nextTick(() => {
      const el = document.getElementById(`formation-${slug}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
});

watch(
  () => route.query,
  (query) => {
    if (query.type === 'formation' && typeof query.slug === 'string') {
      nextTick(() => {
        const el = document.getElementById(`formation-${query.slug}`);
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
    <h2>Liste des Formations {{filteredStructures.length}}</h2>
    <button class="toggle-btn" @click="toggleList" :aria-label="isOpen ? 'Fermer la liste' : 'Ouvrir la liste'">
      {{ isOpen ? '«' : '»' }}
    </button>
  </div>
  <ul v-show="isOpen">
    <li
      v-for="formation in filteredStructures"
      :key="formation.id"
      @click="navigateTo(formation)"
      :id="`formation-${formation.slug}`"
      :class="{ highlighted: isHighlighted(formation) }"
    >
      {{ formation.nom }} - {{ formation.placeDisponible ? "Places disponibles" : "Pas de places disponibles" }}
      – Nombre d'adresses : {{ formation.adresses.length }}
      <em>{{ formation.structure? formation.structure.nom : formation.permanence?.nom }}</em>
      {{formation.competencesLinguistiquesVisees}}
      {{formation.joursHoraires}}
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

em {
  color: gray;
}

.highlighted {
  background-color: #e0f7fa;
  font-weight: bold;
}
</style>
