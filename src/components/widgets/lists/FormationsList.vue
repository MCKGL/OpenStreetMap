<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {type FormationModel} from "@/models/Formation.model.ts";
import {useParsedFilters} from "@/composables/filter/useParsedFilters.ts";
import {formationsFiltered, hasAdvancedFilters} from "@/utils/filters.ts";
import {formatDate} from "@/utils/formatText.ts";
import {useOpenDescription} from "@/composables/list/useOpenDescription.ts";
import LogoProgramme from "@/components/widgets/LogosProgrammes/LogoProgramme.vue";
import type {ProgrammeModel} from "@/models/Programme.model.ts";
import {type ProgrammeCode, programmeMap} from "@/types/ProgrammeType.ts";
import {exportFormationsPDF} from "@/composables/pdf/exportFormationsPDF.ts";

const router = useRouter();
const route = useRoute();
const filters = useParsedFilters();
const hasQuerySlug = route.query.type === 'formation' && typeof route.query.slug === 'string';
const isListOpen = ref(hasQuerySlug);
const { toggleDescription, isDescriptionOpen, openDescription } = useOpenDescription();

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

function onClickFormation(formation: FormationModel) {
  toggleDescription(formation.slug);
  navigateTo(formation);
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

function getValidProgrammeCode(programmes: ProgrammeModel[]): ProgrammeCode | null {
  if (!programmes?.length) return null;

  for (const p of programmes) {
    const code = programmeMap[p.nom];
    if (code) return code;
  }

  return null;
}

onMounted(() => {
  const slug = route.query.slug;
  if (route.query.type === 'formation' && typeof slug === 'string') {
    isListOpen.value = true;
    nextTick(() => {
      nextTick(() => {
        const element = document.getElementById(`formation-${slug}`);
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
    if (query.type === 'formation' && typeof query.slug === 'string') {
      isListOpen.value = true;
      nextTick(() => {
        const element = document.getElementById(`formation-${query.slug}`);
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

function onExportPDF() {
  exportFormationsPDF(filteredFormations.value, filters.value);
}

</script>

<template>
  <div class="list-header" v-if="filteredFormations.length > 0">
    <h2>
      Formations ({{ filteredFormations.length }} dont {{ numberOfPlacesAvailable(filteredFormations) }} avec places disponibles)
    </h2>
    <button @click="onExportPDF">Exporter en PDF</button>
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
      <div class="section-title"
           @click="onClickFormation(formation)">
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
            <LogoProgramme
              v-if="(code => code !== null)(getValidProgrammeCode(formation.programmes))"
              :programme="getValidProgrammeCode(formation.programmes)!"
            />
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
  color: var(--color-text-subtext);
  font-size: var(--subtext-font-size);
}

.forma-descr-section {
  margin-bottom: 10px;
  font-size: var(--text-font-size);
}

strong {
  text-decoration: underline;
}
</style>
