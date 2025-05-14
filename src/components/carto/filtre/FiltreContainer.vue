<script setup lang="ts">
import { ref, onMounted, defineEmits } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const emit   = defineEmits<{
  (e: 'update:filters', filters: string[]): void;
}>();
const route  = useRoute();
const router = useRouter();
const onlyWithPlaces = ref(false);
const childcare      = ref(false);

onMounted(() => {
  onlyWithPlaces.value = route.query.placeDisponible === 'true';
  childcare.value      = route.query.gardeEnfants   === 'true';
});

function onFilterChange() {
  const emitted: string[] = [];
  if (onlyWithPlaces.value) emitted.push('placeDisponible');
  if (childcare.value)      emitted.push('gardeEnfant');
  emit('update:filters', emitted);

  const q: Record<string,string> = {};
  if (onlyWithPlaces.value) q.placeDisponible = 'true';
  if (childcare.value)      q.gardeEnfants   = 'true';

  router.replace({ query: q });
}
</script>

<template>
  <div class="filtre-container">
    <label>
      <input
        type="checkbox"
        v-model="onlyWithPlaces"
        @change="onFilterChange"
      />
      N’afficher que les formations avec place dispo
    </label>
    <label>
      <input
        type="checkbox"
        v-model="childcare"
        @change="onFilterChange"
      />
      Garde d’enfants
    </label>
  </div>
</template>
