<script setup lang="ts">
import MapCarto from "@/components/carto/map/MapCarto.vue";
import {computed, onMounted, ref, watch} from "vue";
import {StructureModel} from "@/models/Structure.model.ts";
import {PermanenceModel} from "@/models/Permanence.model.ts";
import {getPermanences, getStructures} from "@/services/Structure.service.ts";
import StructuresListe from "@/components/carto/liste/StructuresListe.vue";
import PermancencesListe from "@/components/carto/liste/PermancencesListe.vue";
import {useRoute, useRouter} from "vue-router";
import FormationsListe from "@/components/carto/liste/FormationsListe.vue";
import FiltreContainer from "@/components/carto/filtre/FiltreContainer.vue";

interface Focus {
  type: 'structure' | 'permanence' | 'formation';
  slug: string;
}

const structures = ref<StructureModel[]>([]);
const permanences = ref<PermanenceModel[]>([]);
const loading = ref(true);
const isOpen = ref(true);
const mapRef = ref();
const route = useRoute();
const router = useRouter();
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

const togglePanel = async () => {
  isOpen.value = !isOpen.value;
  await new Promise(resolve => setTimeout(resolve, 310));
  mapRef.value?.resizeMap();
};

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

onMounted(async () => {
  try {
    structures.value = await getStructures();
    permanences.value = await getPermanences();
  } catch (err: unknown) {
    console.error('Erreur lors du chargement des données :', err);
  } finally {
    loading.value = false;
  }
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

</script>

<template>
  <div v-if="loading" class="loading">
    Chargement des données…
  </div>

  <div v-else>
    <FiltreContainer @update:filters="filters = $event"/>
    <div class="carto-view">
      <div class="list-panel" :class="{ closed: !isOpen }">
        <button class="toggle-btn" @click="togglePanel">
          {{ isOpen ? '«' : '»' }}
        </button>
        <div v-if="isOpen" class="list-content">
          <PermancencesListe :permanences="permanences" :objFocus="objFocus"/>
          <FormationsListe :structures="structures" :filters="filters" :objFocus="objFocus"/>
          <StructuresListe :structures="structures" :objFocus="objFocus"/>
        </div>
      </div>

      <div class="carto-data" :class="{ expanded: !isOpen }">
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
</template>

<style scoped>
.carto-view {
  display: flex;
  height: 90vh;
  overflow: hidden;
}

.list-panel {
  width: 33.33%;
  background: white;
  transition: width 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
}

.list-panel.closed {
  width: 40px;
}

.toggle-btn {
  position: absolute;
  top: 1%;
  right: 0;
  width: 25px;
  height: 40px;
  background: #ccc;
  border: none;
  border-radius: 100%;
  cursor: pointer;
  font-weight: bold;
  z-index: 10;
}

.list-content {
  padding: 10px;
  height: 100%;
  overflow-y: auto;
}

.carto-data {
  flex: 1;
  transition: width 0.3s ease;
  height: 100%;
  min-width: 0;
}

.carto-data.expanded {
  width: calc(100% - 40px);
}

</style>
