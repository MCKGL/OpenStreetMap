<!-- src/components/carto/SwitchListeMap.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import MapCoor from '@/components/carto/map/MapCoor.vue';
import CoordonneesListe from '@/components/carto/liste/CoordonneesListe.vue';
import { getCoordonnees } from '@/services/Coordonnee.service';
import { CoordonneeModel } from '@/models/Coordonnee.model';

type TabKey = 'liste' | 'carte';
const currentTab = ref<TabKey>('liste');
const coors = ref<CoordonneeModel[]>([]);
const idFocus = ref<number>();

/**
 * onMounted va permettre de charger les coordonnées au moment du montage du composant.
 * Il va appeler la fonction getCoordonnees qui va récupérer les coordonnées depuis le service.
 */
onMounted(async () => {
  try {
    coors.value = await getCoordonnees();
  } catch (err: any) {
    console.error('Erreur lors du chargement des coordonnées :', err);
  }
});

/**
 * switchTab va permettre de changer d'onglet. Si on clique sur l'onglet liste, on va réinitialiser
 * idFocus à undefined.
 * @param tab
 */
function switchTab(tab: TabKey) {
  currentTab.value = tab;
  if (tab === 'liste') {
    idFocus.value = undefined;
  }
}

/**
 * onSelectCoordinates va permettre de changer d'onglet et de mettre à jour l'idFocus.
 * Il est appelé lorsque l'utilisateur clique sur un bouton "Voir sur carte" dans la liste et va
 * récupérer l'id de la coordonnée sélectionnée.
 * @param payload
 */
function onSelectCoordinates(payload: { id: number }) {
  idFocus.value = payload.id;
  currentTab.value = 'carte';
}
</script>

<template>
  <div class="tabs">
    <button
      :class="{ active: currentTab === 'liste' }"
      @click="switchTab('liste')"
    >
      Liste
    </button>
    <button
      :class="{ active: currentTab === 'carte' }"
      @click="switchTab('carte')"
    >
      Carte
    </button>
  </div>

  <div class="tab-content">
    <CoordonneesListe
      v-if="currentTab === 'liste'"
      :coors="coors"
      @select-coordinates="onSelectCoordinates"
    />
    <MapCoor
      v-else
      :coors="coors"
      :idFocus="idFocus"
      @reset-focus="idFocus = undefined"
    />
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: 0.5rem;
}
.tabs button {
  padding: 0.5rem 1rem;
  border: none;
  background: #eee;
  cursor: pointer;
}
.tabs button.active {
  background: #ccc;
  font-weight: bold;
}
.tab-content {
  margin-top: 1rem;
}
</style>
