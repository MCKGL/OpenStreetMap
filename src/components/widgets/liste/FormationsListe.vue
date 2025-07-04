<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import type { FormationModel } from "@/models/Formation.model.ts";
import {useParsedFilters} from "@/composables/useParsedFilters.ts";
import {formationsFiltered, hasAdvancedFilters} from "@/utils/filters.ts";

const router = useRouter();
const route = useRoute();
const isOpen = ref(true);
const filters = useParsedFilters();
const openDescriptions = ref<Record<string, boolean>>({});

const props = defineProps<{
  formations: FormationModel[];
}>();

const filteredFormations = computed(() => {
  const filtered = formationsFiltered(props.formations, filters.value);

  // Formations avec places disponibles en premier
  return [...filtered].sort((a, b) => {
    return (b.placeDisponible ? 1 : 0) - (a.placeDisponible ? 1 : 0);
  });
});


function navigateTo(formation: FormationModel) {
  const adresses = formation.adresses || [];
  const hasAdvFilters = hasAdvancedFilters(filters.value);

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

    if (!hasAdvFilters && formation.structure?.adresses?.some(sa =>
        sa.latitude === a.latitude && sa.longitude === a.longitude)) {
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

function numberOfPlacesAvailable(formations: FormationModel[]): number {
  return formations.reduce((acc, formation) => {
    return acc + (formation.placeDisponible ? 1 : 0);
  }, 0);
}

function toggleDescription(slug: string) {
  openDescriptions.value[slug] = !openDescriptions.value[slug];
}

function isDescriptionOpened(slug: string): boolean {
  return !!openDescriptions.value[slug];
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
    <h2>{{filteredFormations.length}} Formations
      <br />
      (dont {{ numberOfPlacesAvailable(filteredFormations) }} avec places disponibles)
    </h2>
    <button class="toggle-btn" @click="toggleList" :aria-label="isOpen ? 'Fermer la liste' : 'Ouvrir la liste'">
      <img
        v-if="isOpen"
        src="/icons/expand_up.svg"
        alt="Fermer la liste"
        width="20"
        height="20"
      />
      <img
        v-else
        src="/icons/expand_down.svg"
        alt="Ouvrir la liste"
        width="20"
        height="20"
      />
    </button>
  </div>
  <ul v-show="isOpen" class="ul-list">
    <li
      class="li-list"
      v-for="formation in filteredFormations"
      :key="formation.id"
      :id="`formation-${formation.slug}`"
      :class="{ highlighted: isHighlighted(formation) }"
    >
      <div class="section-title" @click.stop="toggleDescription(formation.slug)" @click="navigateTo(formation)">
        <h3>
          <a href="javascript:void(0)">
            <div>
              <span class="accordion-icon">{{ isDescriptionOpened(formation.slug) ? '−' : '+' }}</span>
            </div>
            <div>
              {{ formation.nom }} – {{ formation.placeDisponible ? "Places disponibles" : "Pas de places disponibles" }}
              <br />
              <em>{{ formation.structure? formation.structure.nom : formation.permanence?.nom }}</em>
            </div>
          </a>
        </h3>
      </div>

      <div v-if="isDescriptionOpened(formation.slug)">
        <p>Description de la formation {{ formation.nom }}…</p>
        <div class="more-btn">
          <a
            class="readon"
            :href="formation.url"
            target="_blank"
          >
            En savoir plus
          </a>
        </div>
      </div>
    </li>
  </ul>
</template>

<style scoped>
em {
  font-weight: 400;
  line-height: 1;
  color: #777;
  font-size: 9px;
}
</style>
