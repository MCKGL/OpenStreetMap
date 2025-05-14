<script setup lang="ts">
import { ref, watch, onMounted, defineEmits } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const emit = defineEmits<{
  (e: 'update:filters', filters: string[]): void;
}>();
const onlyWithPlaces = ref(false);
const childcare = ref(false);
const route = useRoute();
const router = useRouter();

onMounted(() => {
  onlyWithPlaces.value = route.query.placeDisponible === 'true';
  childcare.value = route.query.gardeEnfants === 'true';
});

watch(
  [onlyWithPlaces, childcare],
  ([newOnlyWithPlaces, newChildcare]) => {
    router.push({
      query: {
        ...route.query,
        placeDisponible: newOnlyWithPlaces ? 'true' : undefined,
        gardeEnfants: newChildcare ? 'true' : undefined,
      },
    });

    const emittedFilters: string[] = [];
    if (newOnlyWithPlaces) emittedFilters.push('placeDisponible');
    if (newChildcare) emittedFilters.push('gardeEnfant');

    emit('update:filters', emittedFilters);
  }
);

</script>

<template>
  <div class="filtre-container">
    <label><input type="checkbox" v-model="onlyWithPlaces" /> N'afficher que les formations avec de la place disponible</label>
    <label><input type="checkbox" v-model="childcare" /> Garde d'enfants</label>
  </div>
</template>
