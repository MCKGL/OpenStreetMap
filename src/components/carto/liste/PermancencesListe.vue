<script setup lang="ts">
import {nextTick, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import { PermanenceModel } from '@/models/Permanence.model.ts';

const props = defineProps<{
  permanences: PermanenceModel[];
  objFocus?: { type: string; slug: string };
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

watch(() => props.objFocus, async () => {
  await nextTick();
  if (props.objFocus?.type === 'permanence') {
    const el = document.getElementById(`permanence-${props.objFocus.slug}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      console.warn(`Permanence "${props.objFocus.slug}" non visible dans la liste (peut-être filtrée).`);
    }
  }
});
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
      :id="`permanence-${permanence.slug}`"
      :class="{ highlighted: props.objFocus?.type === 'permanence' && props.objFocus?.slug === permanence.slug }"
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

.highlighted {
  background-color: #e0f7fa;
  font-weight: bold;
}
</style>
