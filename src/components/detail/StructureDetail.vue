<script setup lang="ts">
import { useRoute } from 'vue-router';
import { ref, onMounted } from 'vue';
import { getStructureBySlug } from '@/services/StructurePermanence.service.ts';
import MapCarto from "@/components/carto/map/MapCarto.vue";

const route = useRoute();
const structure = ref();

onMounted(async () => {
  const slugParam = route.params.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam;
  if (slug) {
    structure.value = await getStructureBySlug(slug);
  }
});
</script>

<template>
  <MapCarto v-if="structure" :structures="[structure]" />
</template>
