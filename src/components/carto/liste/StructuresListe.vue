<script setup lang="ts">
import { ref } from 'vue';
import { StructureModel } from '@/models/Structure.model.ts';
import { useRouter } from 'vue-router';

const props = defineProps<{
  structures: StructureModel[];
}>();
const router = useRouter();

const isOpen = ref(true);

function toggleList() {
  isOpen.value = !isOpen.value;
}

function navigateTo(structure: StructureModel) {
  router.push({
    query: {
      type: 'structure',
      slug: structure.slug
    }
  });
}
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
</style>
