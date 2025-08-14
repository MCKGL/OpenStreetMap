<script setup lang="ts">
import GeneralMap from "@/components/widgets/map/GeneralMap.vue";
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
import StructuresList from "@/components/widgets/lists/StructuresList.vue";
import PermancencesList from "@/components/widgets/lists/PermancencesList.vue";
import FormationsList from "@/components/widgets/lists/FormationsList.vue";
import ContainerFilters from "@/components/widgets/filters/ContainerFilters.vue";
import {useRoute} from "vue-router";
import LoadingAnimation from "@/components/ui/LoadingAnimation.vue";

const structures = ref<StructureModel[]>([]);
const permanences = ref<PermanenceModel[]>([]);
const formations = ref<FormationModel[]>([]);
const adresses = ref<AdresseModel[]>([]);
const loading = ref(true);
const isOpen = ref(true);
const mobileView = ref<'list' | 'map'>('list');
const isMobile = ref(window.innerWidth <= 810);
const mapRef = ref();
const listContentRef = ref<HTMLElement|null>(null);
const route = useRoute();

const mobileClass = computed(() => {
  if (!isMobile.value) return '';
  return mobileView.value === 'list' ? 'mode-list' : 'mode-map';
});

const onResize = () => {
  isMobile.value = window.innerWidth <= 810;
  if (!isMobile.value) isOpen.value = true;
};

function togglePanel() {
  if (!isMobile.value) {
    isOpen.value = !isOpen.value;
    nextTick(() => {
      setTimeout(() => {
        mapRef.value?.handleResize?.();
      }, 350);
    });
  }
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

  window.addEventListener('resize', onResize);
  onResize();

  onBeforeUnmount(() => window.removeEventListener('resize', onResize));
});

watch(mobileView, (newView) => {
  if (newView === 'map' && isMobile.value) {
    nextTick(() => {
      mapRef.value?.resizeMap?.();
    });
  }
});

watch(
  () => route.query,
  (query) => {
    if (
      isMobile.value &&
      query.type === 'formation' &&
      query.slug &&
      query.latitude &&
      query.longitude
    ) {
      mobileView.value = 'list';
    }
  },
  { immediate: true }
);

</script>

<template>
  <LoadingAnimation class="loading" v-if="loading" />

  <div v-else class="all-carto-container">
    <div class="container-filtre">
      <ContainerFilters />
    </div>

    <div class="container-reminder">
      L’annuaire de Réseau Alpha est collaboratif, les formations sont renseignées par les structures elles-mêmes
      <div class="view-switch" v-show="isMobile">
        <button
          :class="{ active: mobileView==='list' }"
          @click="mobileView = 'list'"
        >Liste</button>
        <button
          :class="{ active: mobileView==='map' }"
          @click="mobileView = 'map'"
        >Carte</button>
      </div>
    </div>

    <div class="carto-wrapper" :class="mobileClass">
      <div class="panels">
        <div class="panel list-panel" :class="{ closed: !isOpen }"
             v-if="!isMobile || mobileView==='list'">
          <button v-if="!isMobile" class="toggle-btn" @click="togglePanel">
            {{ isOpen ? '«' : '»' }}
          </button>
          <div class="list-content" ref="listContentRef">
            <PermancencesList :permanences="permanences"/>
            <FormationsList :formations="formations"/>
            <StructuresList :structures="structures"/>
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

        <div class="panel map-panel" v-if="!isMobile || mobileView==='map'">
          <GeneralMap
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

.container-reminder{
  display: flex;
  justify-content: center;
  font-size: var(--text-font-size);
  padding: 10px;
}

.carto-wrapper {
  flex: 1 1 auto;
  display: flex;
  flex-direction: row;
  overflow: hidden;
}

.view-switch {
  display: none;
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
  background: var(--color-blue-alpha);
  color: var(--color-text-on-hightlight);
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
  background: var(--color-background);;
  transition: width 0.3s;
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);
  overflow: hidden;
  height: 100%;
}

.scroll-top-btn {
  position: absolute;
  border: none;
  cursor: pointer;
  background: var(--color-hightlight) none repeat scroll 0 0;
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
  z-index: 8;
}

.carto-wrapper.mode-map .view-switch {
  left: auto;
  right: 10px;
  transform: none;
}

.loading {
  width: 100vw;
  height: 100vh;
}

@media (max-width: 810px) {
  .container-filtre {
    margin: 10px;
  }

  .container-reminder {
    position: relative;
  }

  .view-switch {
    position: absolute;
    right: 10px;
    bottom: -45px;
    z-index: 20;
    display: flex;
    gap: 5px;
    background-color: #fafafa;
    padding: 5px 10px;
    border-radius: 34px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .panels {
    flex-direction: column;
    position: relative;
  }

  .list-content {
    margin-top: 40px;
  }

  .list-panel,
  .map-panel {
    width: 100%;
    height: 100%;
  }
}
</style>
