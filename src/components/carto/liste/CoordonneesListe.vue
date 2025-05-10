<script setup lang="ts">
import { ref, watch } from 'vue';
import { CoordonneeModel } from '@/models/Coordonnee.model';

// Les properties sont définies pour recevoir les coordonnées
const props = defineProps<{
  coors: CoordonneeModel[];
}>();

// le emit vont permettre de remonter l'événement 'select-coordinates' à la vue parente
const emit = defineEmits<{
  (e: 'select-coordinates', payload: { id: number }): void;
}>();

// loading est un état qui va permettre d'afficher un message de chargement
const loading = ref(true);


// on watch va surveiller les coordonnées et mettre à jour l'état de loading
watch(
  () => props.coors,
  (newVal) => {
    if (newVal.length > 0) {
      loading.value = false;
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="csv-list">
    <h2>Liste des adresses</h2>

    <div v-if="loading" class="loading">Chargement des données…</div>
    <div v-else>
      <table>
        <thead>
        <tr>
          <th>ID</th>
          <th>Latitude</th>
          <th>Longitude</th>
          <th>Carte</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="coor in props.coors" :key="coor.id">
          <td>{{ coor.id }}</td>
          <td>{{ coor.lat }}</td>
          <td>{{ coor.lng }}</td>
          <td>
            <button @click="emit('select-coordinates', { id: coor.id })">
              Voir sur carte
            </button>
          </td>
        </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.csv-list {
  padding: 16px;
  font-family: Arial, sans-serif;
}

.loading {
  font-style: italic;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

thead {
  background-color: #f4f4f4;
}

tr:nth-child(even) {
  background-color: #fafafa;
}
</style>
