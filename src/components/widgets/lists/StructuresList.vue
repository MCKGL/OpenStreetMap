<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from 'vue';
import { StructureModel } from '@/models/Structure.model.ts';
import {useRoute, useRouter} from 'vue-router';
import {structuresFiltered} from "@/utils/filters.ts";
import {useParsedFilters} from "@/composables/filter/useParsedFilters.ts";
import {truncateHtmlSimple} from "@/utils/formatText.ts";
import {useOpenDescription} from "@/composables/list/useOpenDescription.ts";
import ExpandUp from "@/components/icons/ExpandUp.vue";
import ExpandDown from "@/components/icons/ExpandDown.vue";

const router = useRouter();
const route = useRoute();
const filters = useParsedFilters();
const hasQuerySlug = route.query.type === 'structure' && typeof route.query.slug === 'string';
const isListOpen = ref(hasQuerySlug);
const { toggleDescription, isDescriptionOpen, openDescription } = useOpenDescription();

const props = defineProps<{
  structures: StructureModel[];
}>();

const filteredStructures = computed(() =>
  structuresFiltered(props.structures, filters.value)
    .sort((a, b) => a.nom.localeCompare(b.nom))
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
  isListOpen.value = !isListOpen.value;
}

function onClickStructure(structure: StructureModel) {
  toggleDescription(structure.slug);
  navigateTo(structure);
}

function isHighlighted(structure: StructureModel): boolean {
  return (
    route.query.type === 'structure' &&
    route.query.slug === structure.slug
  );
}

onMounted(() => {
  const slug = route.query.slug;
  if (route.query.type === 'structure' && typeof slug === 'string') {
    isListOpen.value = true;
    nextTick(() => {
      nextTick(() => {
        const element = document.getElementById(`structure-${slug}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
          const container = document.querySelector('.list-content');
          if (container && element) {
            const containerTop = container.getBoundingClientRect().top;
            const elementTop = element.getBoundingClientRect().top;
            const offset = elementTop - containerTop;
            const correction = offset - container.clientHeight / 2 + element.clientHeight / 2;
            container.scrollTop += correction;
          }
        }, 500);

        openDescription(slug);
      });
    });
  }
});

watch(
  () => route.query,
  (query) => {
    if (query.type === 'structure' && typeof query.slug === 'string') {
      isListOpen.value = true;
      nextTick(() => {
        const element = document.getElementById(`structure-${query.slug}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        setTimeout(() => {
          const container = document.querySelector('.list-content');
          if (container && element) {
            const containerTop = container.getBoundingClientRect().top;
            const elementTop = element.getBoundingClientRect().top;
            const offset = elementTop - containerTop;
            const correction = offset - container.clientHeight / 2 + element.clientHeight / 2;
            container.scrollTop += correction;
          }
        }, 500);

        openDescription(query.slug as string);
      });
    }
  },
  { immediate: true }
);

</script>

<template>
  <div class="list-header" v-if="filteredStructures.length > 0">
    <h2>Structures ({{filteredStructures.length}})</h2>
    <button class="toggle-btn" @click="toggleList" :aria-label="isListOpen ? 'Fermer la liste' : 'Ouvrir la liste'">
      <component class="icon-expand" :is ="isListOpen ? ExpandUp : ExpandDown" />
    </button>
  </div>
  <ul v-show="isListOpen" class="ul-list">
    <li
      class="li-list"
      v-for="structure in filteredStructures"
      :key="structure.id"
      :id="`structure-${structure.slug}`"
      :class="{ highlighted: isHighlighted(structure) }"
    >

      <div class="section-title" @click="onClickStructure(structure)">
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

        <div class="list-elem-description">
          <div class="list-description-s-p-font" v-html="truncateHtmlSimple(structure.description)"></div>
        </div>

        <div class="more-btn">
          <a
            class="readon"
            :href="structure.url"
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
