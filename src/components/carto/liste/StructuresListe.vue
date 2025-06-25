<script setup lang="ts">
import {nextTick, onMounted, ref, watch} from 'vue';
import { StructureModel } from '@/models/Structure.model.ts';
import {useRoute, useRouter} from 'vue-router';

const router = useRouter();
const route = useRoute();
const isOpen = ref(true);

const props = defineProps<{
  structures: StructureModel[];
}>();

function navigateTo(structure: StructureModel) {
  const adresses = structure.adresses || [];

  const query: Record<string, string | undefined> = {
    ...route.query,
    type: 'structure',
    slug: structure.slug,
  };

  delete query.latitude;
  delete query.longitude;
  delete query.structureSlug;

  if (adresses.length === 1) {
    const [a] = adresses;

    if (a.latitude && a.longitude) {
      query.latitude = a.latitude.toString();
      query.longitude = a.longitude.toString();
    }
  }
  router.push({ query });
}

function toggleList() {
  isOpen.value = !isOpen.value;
}

function isHighlighted(structure: StructureModel): boolean {
  return (
    route.query.type === 'structure' &&
    route.query.slug === structure.slug
  );
}

onMounted(() => {
  const slug = route.query.slug;
  if (route.query.type === 'structure' && typeof slug === 'string') {
    nextTick(() => {
      const el = document.getElementById(`structure-${slug}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
});

watch(
  () => route.query,
  (query) => {
    if (query.type === 'structure' && typeof query.slug === 'string') {
      nextTick(() => {
        const el = document.getElementById(`structure-${query.slug}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      });
    }
  },
  { immediate: true }
);

</script>

<template>
  <div class="list-header">
    <h2>Liste des Structures</h2>
    <button class="toggle-btn" @click="toggleList" :aria-label="isOpen ? 'Fermer la liste' : 'Ouvrir la liste'">
      {{ isOpen ? '«' : '»' }}
    </button>
  </div>
  <ul v-show="isOpen" class="structures-list">
    <li
      v-for="structure in props.structures"
      :key="structure.id"
      @click="navigateTo(structure)"
      :id="`structure-${structure.slug}`"
      :class="{ highlighted: isHighlighted(structure) }"
    >
      {{ structure.nom }} – Nombre d'adresses : {{ structure.adresses.length }}
    </li>
  </ul>
</template>

<style scoped>
.list-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.toggle-btn {
  background: transparent;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0;
}

.toggle-btn:focus {
  outline: 2px solid #007acc;
}

.structures-list {
  list-style: inside;
}

.structures-list li {
  padding: 5px;
  cursor: pointer;
}

.structures-list li:hover {
  background-color: #f0f0f0;
}

.highlighted {
  background-color: #e0f7fa;
  font-weight: bold;
}
</style>
