<script setup lang="ts">
import { ref } from "vue";
import {useRoute, useRouter} from "vue-router";
import { PermanenceModel } from '@/models/Permanence.model.ts';

const props = defineProps<{
  permanences: PermanenceModel[];
}>();
const router = useRouter();
const route = useRoute();
const isOpen = ref(true);

function navigateTo(permanence: PermanenceModel) {
  router.push({
    query: {
      ...route.query,
      type: 'permanence',
      slug: permanence.slug
    }
  });
}

function toggleList() {
  isOpen.value = !isOpen.value;
}
</script>

<template>
  <div class="list-header">
    <h2>Liste des Permanences</h2>
    <button
      class="toggle-btn"
      @click="toggleList"
      :aria-label="isOpen ? 'Fermer la liste' : 'Ouvrir la liste'"
    >
      {{ isOpen ? '«' : '»' }}
    </button>
  </div>
  <ul v-show="isOpen">
    <li
      v-for="permanence in props.permanences"
      :key="permanence.id"
      @click="navigateTo(permanence)"
    >
      {{ permanence.nom }}
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

li {
  list-style: inside;
  padding: 5px;
  cursor: pointer;
}

li:hover {
  background-color: #f0f0f0;
}
</style>
