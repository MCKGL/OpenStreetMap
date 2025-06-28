<script setup lang="ts">
import MapCarto from "@/components/carto/map/MapCarto.vue";
import {computed, nextTick, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {StructureModel} from "@/models/Structure.model.ts";
import {PermanenceModel} from "@/models/Permanence.model.ts";
import type {FormationModel} from "@/models/Formation.model.ts";
import type {AdresseModel} from "@/models/Adresse.model.ts";
import {
  getAdresses,
  getFormations,
  getPermanences,
  getStructures
} from "@/services/StructurePermanence.service.ts";
import StructuresListe from "@/components/carto/liste/StructuresListe.vue";
import PermancencesListe from "@/components/carto/liste/PermancencesListe.vue";
import FormationsListe from "@/components/carto/liste/FormationsListe.vue";
import ContainerFiltre from "@/components/filtre/ContainerFiltre.vue";

const structures = ref<StructureModel[]>([]);
const permanences = ref<PermanenceModel[]>([]);
const formations = ref<FormationModel[]>([]);
const adresses = ref<AdresseModel[]>([]);
const loading = ref(true);
const isOpen = ref(true);
const mobileView = ref<'list' | 'map'>('list');
const isMobile = ref(window.innerWidth <= 810);
const mapRef = ref();
const isFilterOpen = ref(false)
const listContentRef = ref<HTMLElement|null>(null);

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

onMounted(async () => {
  try {
    structures.value = await getStructures();
    permanences.value = await getPermanences();
    adresses.value = await getAdresses();
    formations.value = await getFormations();
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
      <ContainerFiltre @toggle-filter="onToggleFilter"/>
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
            <PermancencesListe :permanences="permanences"/>
            <FormationsListe :formations="formations"/>
            <StructuresListe :structures="structures"/>
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
            :adresses="adresses"
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
  z-index: 8;
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
