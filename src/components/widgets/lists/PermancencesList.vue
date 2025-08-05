<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import { PermanenceModel } from '@/models/Permanence.model.ts';
import {useParsedFilters} from "@/composables/useParsedFilters.ts";
import {permanencesFiltered} from "@/utils/filters.ts";
import {truncateHtmlSimple} from "@/utils/formatText.ts";
import {useOpenDescription} from "@/composables/useOpenDescription.ts";

const router = useRouter();
const route = useRoute();
const filters = useParsedFilters();
const hasQuerySlug = route.query.type === 'permanence' && typeof route.query.slug === 'string';
const isListOpen = ref(hasQuerySlug);
const { toggleDescription, isDescriptionOpen, openDescription } = useOpenDescription();

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
  isListOpen.value = !isListOpen.value;
}

function onClickPermanence(permanence: PermanenceModel) {
  toggleDescription(permanence.slug);
  navigateTo(permanence);
}

function isHighlighted(permanence: PermanenceModel): boolean {
  return (
    route.query.type === 'permanence' &&
    route.query.slug === permanence.slug
  );
}

function numberOfAdresses(permanences: PermanenceModel[]): number {
  return permanences.reduce((acc, permanence) => {
    return acc + (permanence.adresses ? permanence.adresses.length : 0);
  }, 0);
}

onMounted(() => {
  const slug = route.query.slug;
  if (route.query.type === 'permanence' && typeof slug === 'string') {
    isListOpen.value = true;
    nextTick(() => {
      nextTick(() => {
        const el = document.getElementById(`permanence-${slug}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        openDescription(slug);
      });
    });
  }
});

watch(
  () => route.query,
  (query) => {
    if (query.type === 'permanence' && typeof query.slug === 'string') {
      isListOpen.value = true;
      nextTick(() => {
        const el = document.getElementById(`permanence-${query.slug}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });

        openDescription(query.slug as string);
      });
    }
  },
  { immediate: true }
);

</script>

<template>
  <div class="list-header" v-if="filteredPermanences.length > 0">
    <h2>Permanences ({{ numberOfAdresses(filteredPermanences) }})</h2>
    <button
      class="toggle-btn"
      @click="toggleList"
      :aria-label="isListOpen ? 'Fermer la liste' : 'Ouvrir la liste'"
    >
      <img
        v-if="isListOpen"
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
  <ul v-show="isListOpen" class="ul-list">
    <li
      class="li-list"
      v-for="permanence in filteredPermanences"
      :key="permanence.id"
      :id="`permanence-${permanence.slug}`"
      :class="{ highlighted: isHighlighted(permanence) }"
    >
      <div class="section-title" @click="onClickPermanence(permanence)">
        <h3>
          <a href="javascript:void(0)">
            <div>
              <span class="accordion-icon">{{ isDescriptionOpen(permanence.slug) ? '−' : '+' }}</span>
            </div>
            <div>
              {{ permanence.nom }} – {{ permanence.adresses.length }} Permanence{{ permanence.adresses.length > 1 ? 's' : '' }}
            </div>
          </a>
        </h3>
      </div>

      <div v-if="isDescriptionOpen(permanence.slug)">

        <div class="list-elem-description">
          <div class="list-description-s-p-font" v-html="truncateHtmlSimple(permanence.description)"></div>
        </div>

        <div class="more-btn">
          <a
            class="readon"
            :href="permanence.urlCoordination"
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
