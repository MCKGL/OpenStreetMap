<script setup lang="ts">
import MapCarto from "@/components/carto/map/MapCarto.vue";
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {StructureModel} from "@/models/Structure.model.ts";
import {PermanenceModel} from "@/models/Permanence.model.ts";
import {getPermanences, getStructures} from "@/services/Structure.service.ts";
import StructuresListe from "@/components/carto/liste/StructuresListe.vue";
import PermancencesListe from "@/components/carto/liste/PermancencesListe.vue";
import {type LocationQueryValue, useRoute, useRouter} from "vue-router";
import FormationsListe from "@/components/carto/liste/FormationsListe.vue";
import ContainerFiltre from "@/components/filtre/ContainerFiltre.vue";

interface Focus {
  type: 'structure' | 'permanence' | 'formation';
  slug: string;
}

const structures = ref<StructureModel[]>([]);
const permanences = ref<PermanenceModel[]>([]);
const loading = ref(true);
const isOpen = ref(true);
const mobileView = ref<'list' | 'map'>('list');
const isMobile = ref(window.innerWidth <= 810);
const mapRef = ref();
const route = useRoute();
const router = useRouter();
const isFilterOpen = ref(false)
const listContentRef = ref<HTMLElement|null>(null);
const filters = ref<string[]>([]);

const objFocus = computed<Focus | undefined>(() => {
  const rawType = route.query.type as string | undefined;
  const rawSlug = route.query.slug as string | undefined;

  if (rawType === 'structure' || rawType === 'permanence' || rawType === 'formation') {
    if (typeof rawSlug === 'string') {
      return {type: rawType, slug: rawSlug};
    }
  }
  return undefined;
});

const mobileClass = computed(() => {
  if (!isMobile.value) return '';
  return mobileView.value === 'list' ? 'mode-list' : 'mode-map';
});

function togglePanel() {
  if (!isMobile.value) {
    isOpen.value = !isOpen.value;
    setTimeout(() => mapRef.value?.resizeMap?.(), 310);
  }
}

function onToggleFilter(open: boolean) {
  isFilterOpen.value = open
}

function scrollToTop() {
  if (listContentRef.value) {
    listContentRef.value.scrollTop = 0;
  }
}

function resetFocus() {
  const newQuery = {...route.query};
  delete newQuery.slug;
  delete newQuery.type;
  router.replace({query: newQuery});
}

function onFocusFromMap({type, slug}: { type: string; slug: string }) {
  const wasClosed = !isOpen.value;
  isOpen.value = true;

  if (wasClosed) {
    setTimeout(() => {
      router.push({
        query: {
          ...route.query,
          type,
          slug
        }
      });
    }, 320);
  } else {
    router.push({
      query: {
        ...route.query,
        type,
        slug
      }
    });
  }
}

function onApplyFilters(payload: Record<string, unknown>) {
  const cleanQuery = { ...route.query };

  const keysToRemove = ['activites', 'lieux', 'scolarisation', 'competence', 'programmes', 'publics', 'objectifs', 'joursHoraires', 'gardeEnfant', 'coursEte', 'keyword'];
  for (const key of keysToRemove) {
    delete cleanQuery[key];
  }

  const newFilters = Object.entries(payload)
    .filter(([_, val]) => Array.isArray(val) ? val.length : val)
    .reduce((acc, [key, val]) => {
      acc[key] = Array.isArray(val) ? val.join(',') : String(val);
      return acc;
    }, {} as Record<string, string>);

  filters.value = Object.entries(newFilters).map(([k, v]) => `${k}:${v}`);

  router.replace({
    query: {
      ...cleanQuery,
      ...newFilters
    }
  });
}

type QueryParam = LocationQueryValue | LocationQueryValue[];
function parseQueryParam(param: QueryParam): string[] | undefined {
  if (param === undefined || param === null) return undefined;

  if (typeof param === 'string') {
    return param.split(',');
  }

  if (Array.isArray(param)) {
    return param.flatMap(item => parseQueryParam(item) ?? []);
  }

  return undefined;
}

onMounted(async () => {
  const payload: Record<string, unknown> = {};

  payload.activites = parseQueryParam(route.query.activites);
  payload.lieux = parseQueryParam(route.query.lieux);
  payload.programmes = parseQueryParam(route.query.programmes);
  payload.publics = parseQueryParam(route.query.publics);
  payload.objectifs = parseQueryParam(route.query.objectifs);
  payload.joursHoraires = parseQueryParam(route.query.joursHoraires);
  payload.scolarisation = typeof route.query.scolarisation === 'string' ? route.query.scolarisation : undefined;
  payload.competence = typeof route.query.competence === 'string' ? route.query.competence : undefined;
  payload.gardeEnfant = route.query.gardeEnfant === 'true' || (Array.isArray(route.query.gardeEnfant) && route.query.gardeEnfant.includes('true'));
  payload.coursEte = route.query.coursEte === 'true' || (Array.isArray(route.query.coursEte) && route.query.coursEte.includes('true'));
  payload.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : undefined;

  onApplyFilters(payload);

  try {
    structures.value = await getStructures();
    permanences.value = await getPermanences();
  } finally {
    loading.value = false;
  }

  const onResize = () => {
    isMobile.value = window.innerWidth <= 810;
    if (!isMobile.value) isOpen.value = true;
  };
  window.addEventListener('resize', onResize);
  onResize();

  onBeforeUnmount(() => window.removeEventListener('resize', onResize));
});

watch(objFocus, (focus) => {
  if (!focus) return;

  const found =
    (focus.type === 'permanence' && permanences.value.some(p => p.slug === focus.slug)) ||
    (focus.type === 'structure' && structures.value.some(s => s.slug === focus.slug)) ||
    (focus.type === 'formation' && structures.value.some(s =>
      s.formations.some(f => f.slug === focus.slug)
    ));

  if (!found) {
    resetFocus();
  }
});

watch(mobileView, (view) => {
  if (view === 'map') {
    nextTick(() => {
      mapRef.value?.resizeMap?.();
    });
  }
});

</script>

<template>
  <div v-if="loading" class="loading">Chargement…</div>
  <div v-else class="all-carto-container">
    <div class="container-filtre">
      <ContainerFiltre @toggle-filter="onToggleFilter" @apply-filters="onApplyFilters" />
    </div>
    <div class="carto-wrapper" :class="mobileClass">
      <div class="view-switch" v-show="isMobile && !isFilterOpen">
        <button
          :class="{ active: mobileView==='list' }"
          @click="mobileView = 'list'"
        >Liste</button>
        <button
          :class="{ active: mobileView==='map' }"
          @click="mobileView = 'map'"
        >Carte</button>
      </div>

      <div class="panels">
        <div class="panel list-panel" :class="{ closed: !isOpen }"
             v-show="!isMobile || mobileView==='list'">
          <button v-if="!isMobile" class="toggle-btn" @click="togglePanel">
            {{ isOpen ? '«' : '»' }}
          </button>
          <div class="list-content" ref="listContentRef">
            <PermancencesListe :permanences="permanences" :objFocus="objFocus"/>
            <FormationsListe :structures="structures" :filters="filters" :objFocus="objFocus"/>
            <StructuresListe :structures="structures" :objFocus="objFocus"/>
          </div>
          <button
            v-if="!isMobile || mobileView==='list'"
            class="scroll-top-btn"
            @click="scrollToTop"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
                 xmlns="http://www.w3.org/2000/svg">
              <path d="M18 15L12 9L6 15" stroke="#FFFFFF" stroke-width="2"/>
            </svg>
          </button>
        </div>

        <div class="panel map-panel" v-show="!isMobile || mobileView==='map'">
          <MapCarto
            ref="mapRef"
            :structures="structures"
            :permanences="permanences"
            :objFocus="objFocus"
            :filters="filters"
            @reset-focus="resetFocus"
            @focus-from-map="onFocusFromMap"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.all-carto-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  margin: 0;
}

.container-filtre {
  flex: 0 0 auto;
  z-index: 10;
}

.carto-wrapper {
  flex: 1 1 auto;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.view-switch {
  display: none;
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  border-radius: 34px;
  background-color: #fafafa;
  padding: 5px;
}

.view-switch button {
  padding: 6px 12px;
  border: none;
  background: #fafafa;
  cursor: pointer;
  font-weight: bold;
  border-radius: 34px;
}

.view-switch button.active {
  background: #0F7ECB;
  color: white;
}

.panels {
  flex:1;
  display: flex;
  height: 100%;
}

.panel {
  position: relative;
  overflow: hidden;
}

.list-panel {
  display: flex;
  flex-direction: column;
  width: 33.33%;
  background: white;
  transition: width 0.3s;
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);
  overflow: hidden;
  height: 100%;
}

.scroll-top-btn {
  position: absolute;
  border: none;
  cursor: pointer;
  background: #f14b51 none repeat scroll 0 0;
  bottom: 20px;
  font-size: 30px;
  height: 50px;
  line-height: 52px;
  right: 20px;
  width: 45px;
}

.list-panel.closed {
  width: 40px;

}

.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.map-panel {
  flex:1;
  height: 100%;
  z-index: 1;
}

.toggle-btn {
  position: absolute;
  top: 10px;
  right:10px;
  width: 30px;
  height:30px;
  background: #fafafa;
  border:none;
  border-radius:50%;
  z-index: 10;
}

.carto-wrapper.mode-map .view-switch {
  left: auto;
  right: 10px;
  transform: none;
}

@media (max-width: 810px) {
  .view-switch {
    display: block;
  }

  .panels {
    flex-direction: column;
    position: relative;
  }

  .list-content {
    margin-top: 20px;
  }

  .list-panel,
  .map-panel {
    width: 100%;
    height: 100%;
  }
}
</style>
