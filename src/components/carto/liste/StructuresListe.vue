<script setup lang="ts">
import {nextTick, ref, watch} from 'vue';
import { StructureModel } from '@/models/Structure.model.ts';
import {useRoute, useRouter} from 'vue-router';

const props = defineProps<{
  structures: StructureModel[];
  objFocus?: { type: string; slug: string };
}>();
const router = useRouter();
const route = useRoute();
const isOpen = ref(true);

function toggleList() {
  isOpen.value = !isOpen.value;
}

function navigateTo(structure: StructureModel) {
  router.push({
    query: {
      ...route.query,
      type: 'structure',
      slug: structure.slug
    }
  });
}

watch(
  () => props.objFocus,
  async (focus) => {
    if (focus?.type !== 'structure') return;

    const found = props.structures.some(s => s.slug === focus.slug);
    if (!found) {
      console.warn(`Structure "${focus.slug}" introuvable dans la liste.`);
      return;
    }

    await nextTick();
    const el = document.getElementById(`structure-${focus.slug}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      :class="{ highlighted: props.objFocus?.type === 'structure' && props.objFocus?.slug === structure.slug }"
    >
      {{ structure.nom }}
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
