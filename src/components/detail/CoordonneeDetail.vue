<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, onMounted } from 'vue';
import { getCoordonnee } from '@/services/Coordonnee.service.ts';
import MapCoor from "@/components/carto/map/MapCoor.vue";

const route = useRoute();
const coor = ref();

onMounted(async () => {
  const id = Number(route.params.id);
  coor.value = await getCoordonnee(id);
});
</script>

<template>
  <MapCoor v-if="coor" :coors="[coor]" />
</template>





