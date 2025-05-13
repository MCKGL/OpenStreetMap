<script setup lang="ts">
import { ref, watch, onMounted, defineEmits } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const emit = defineEmits<{
  (e: 'update:filters', filters: string[]): void;
}>();

const onlyWithPlaces = ref(false);

const route = useRoute();
const router = useRouter();

onMounted(() => {
  onlyWithPlaces.value = route.query.placeDisponible === 'true';
});

watch(
  [onlyWithPlaces],
  () => {
    router.push({
      query: {
        ...route.query,
        placeDisponible: onlyWithPlaces.value ? 'true' : undefined,
      },
    });

    const emittedFilters: string[] = [];
    if (onlyWithPlaces.value) emittedFilters.push('formationDisponible');

    emit('update:filters', emittedFilters);
  },
  { immediate: true }
);

</script>

<template>
  <div class="filtre-container">
    <label><input type="checkbox" v-model="onlyWithPlaces" /> N'afficher que les formations avec de la place disponible</label>
  </div>
</template>
