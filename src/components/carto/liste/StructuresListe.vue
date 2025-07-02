<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from 'vue';
import { StructureModel } from '@/models/Structure.model.ts';
import {useRoute, useRouter} from 'vue-router';
import {structuresFiltered} from "@/utils/filters.ts";
import {useParsedFilters} from "@/composables/useParsedFilters.ts";

const router = useRouter();
const route = useRoute();
const isOpen = ref(true);
const filters = useParsedFilters();
const openDescriptions = ref<Record<string, boolean>>({});

const props = defineProps<{
  structures: StructureModel[];
}>();

const filteredStructures = computed(() =>
  structuresFiltered(props.structures, filters.value)
);

function navigateTo(structure: StructureModel) {
  const adresses = structure.adresses || [];

  const query: Record<string, string | undefined> = {
    ...route.query,
    type: 'structure',
    slug: structure.slug,
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

function isHighlighted(structure: StructureModel): boolean {
  return (
    route.query.type === 'structure' &&
    route.query.slug === structure.slug
  );
}

function toggleDescription(slug: string) {
  openDescriptions.value[slug] = !openDescriptions.value[slug];
}

function isDescriptionOpen(slug: string): boolean {
  return openDescriptions.value[slug] || false;
}

onMounted(() => {
  const slug = route.query.slug;
  if (route.query.type === 'structure' && typeof slug === 'string') {
    nextTick(() => {
      const el = document.getElementById(`structure-${slug}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
});

watch(
  () => route.query,
  (query) => {
    if (query.type === 'structure' && typeof query.slug === 'string') {
      nextTick(() => {
        const el = document.getElementById(`structure-${query.slug}`);
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
    <h2>{{filteredStructures.length}} Structures</h2>
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
      v-for="structure in filteredStructures"
      :key="structure.id"
      :id="`structure-${structure.slug}`"
      :class="{ highlighted: isHighlighted(structure) }"
    >

      <div class="section-title" @click.stop="toggleDescription(structure.slug)" @click="navigateTo(structure)">
        <h3>
          <a href="javascript:void(0)">
            <div>
              <span class="accordion-icon">{{ isDescriptionOpen(structure.slug) ? '−' : '+' }}</span>
            </div>
            <div>
              {{ structure.nom }}
            </div>
          </a>
        </h3>
      </div>

      <div v-if="isDescriptionOpen(structure.slug)">
        <p>Description de la structure {{ structure.nom }}…</p>
        <div class="more-btn">
          <a
            class="readon"
            :href="structure.urlCoordination"
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

</style>
