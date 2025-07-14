<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import type {FormationModel} from "@/models/Formation.model.ts";
import {useParsedFilters} from "@/composables/useParsedFilters.ts";
import {formationsFiltered, hasAdvancedFilters} from "@/utils/filters.ts";
import {formatDate} from "@/utils/formatText.ts";
import {useOpenDescription} from "@/composables/useOpenDescription.ts";

const router = useRouter();
const route = useRoute();
const isListOpen = ref(true);
const filters = useParsedFilters();
const { toggleDescription, isDescriptionOpen } = useOpenDescription();

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

  router.push({query});
}

function toggleList() {
  isListOpen.value = !isListOpen.value;
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

onMounted(() => {
  const slug = route.query.slug;
  if (route.query.type === 'formation' && typeof slug === 'string') {
    nextTick(() => {
      const el = document.getElementById(`formation-${slug}`);
      if (el) el.scrollIntoView({behavior: 'smooth', block: 'center'});
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
          el.scrollIntoView({behavior: 'smooth', block: 'center'});
        }
      });
    }
  },
  {immediate: true}
);

</script>

<template>
  <div class="list-header" v-if="formationsFiltered.length > 0">
    <h2>{{ filteredFormations.length }} Formations
      <br/>
      (dont {{ numberOfPlacesAvailable(filteredFormations) }} avec places disponibles)
    </h2>
    <button class="toggle-btn" @click="toggleList"
            :aria-label="isListOpen ? 'Fermer la liste' : 'Ouvrir la liste'">
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
      v-for="formation in filteredFormations"
      :key="formation.id"
      :id="`formation-${formation.slug}`"
      :class="{ highlighted: isHighlighted(formation) }"
    >
      <div class="section-title" @click.stop="toggleDescription(formation.slug)"
           @click="navigateTo(formation)">
        <h3>
          <a href="javascript:void(0)">
            <div>
              <span class="accordion-icon">{{
                  isDescriptionOpen(formation.slug) ? '−' : '+'
                }}</span>
            </div>
            <div>
              {{ formation.nom }} –
              {{ formation.placeDisponible ? "Places disponibles" : "Pas de places disponibles" }}
              <br/>
              <em>{{
                  formation.structure ? formation.structure.nom : formation.permanence?.nom
                }}</em>
            </div>
          </a>
        </h3>
      </div>

      <div v-if="isDescriptionOpen(formation.slug)">

        <div class="list-elem-description">
          <div class="forma-descr-section" v-if="formation.objectifsVises.length > 0">
            <strong class="descr-section-name">Objectifs visés : </strong>
            <ul>
              <li v-for="(objectif, idx) in formation.objectifsVises" :key="idx">
                {{ objectif.objectifVise }}
              </li>
            </ul>
          </div>

          <div class="forma-descr-section" v-if="formation.competencesLinguistiquesVisees.length > 0">
            <strong class="descr-section-name">Niveau de langue et de compétences visé par la formation : </strong>
            <ul>
              <li>
                CECRL : <span>{{ formation.competencesLinguistiquesVisees.join(', ') }}</span>
              </li>
            </ul>
          </div>

          <div class="forma-descr-section" v-if="formation.criteresScolarisation.length > 0 || formation.publicsSpecifiques.length > 0">
            <strong class="descr-section-name">Public attendu : </strong>
            <ul v-if="formation.criteresScolarisation.length > 0">
              <li v-for="(critere, idx) in formation.criteresScolarisation	" :key="idx">
                {{ critere }}
              </li>
            </ul>
            <ul v-if="formation.publicsSpecifiques.length > 0">
              <li v-for="(publicSpe, idx) in formation.publicsSpecifiques" :key="idx">
                {{ publicSpe.publicSpecifique }}
              </li>
            </ul>
          </div>

          <div class="forma-descr-section" v-if="formation.dateFin || formation.dateDebut">
            <strong class="descr-section-name">Étendue de la formation : </strong>
            <br>
            {{formatDate(formation.dateDebut)}} - {{formatDate(formation.dateFin)}}
          </div>

        </div>

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

.forma-descr-section {
  margin-bottom: 10px;
  font-family: 'Open Sans', sans-serif;
  font-size: 14px;
}

strong {
  text-decoration: underline;
}
</style>
