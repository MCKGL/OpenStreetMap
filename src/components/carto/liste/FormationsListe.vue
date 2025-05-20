<script setup lang="ts">
import {ref, computed, watch, nextTick} from "vue";
import {useRoute, useRouter} from "vue-router";
import { StructureModel } from '@/models/Structure.model.ts';
import type { FormationModel } from "@/models/Formation.model.ts";

const props = defineProps<{
  structures: StructureModel[];
  filters?: string[];
  objFocus?: { type: string; slug: string };
}>();
const router = useRouter();
const route = useRoute();
const isOpen = ref(true);

type FormationWithStructure = {
  formation: FormationModel;
  structure: StructureModel;
};
const allFormations = computed<FormationWithStructure[]>(() =>
  props.structures.flatMap(structure =>
    (structure.formations || []).map(formation => ({
      formation,
      structure
    }))
  ).filter(item => {
    if (props.filters?.includes('placeDisponible') && !item.formation.placeDisponible) return false;
    if (props.filters?.includes('gardeEnfant') && !item.formation.gardeEnfants) return false;
    return true;
  })
);

function navigateTo(item: FormationWithStructure) {
  router.push({
    query: {
      ...route.query,
      type: 'formation',
      slug: item.formation.slug
    }
  });
}

function toggleList() {
  isOpen.value = !isOpen.value;
}

watch(
  () => props.objFocus,
  async (focus) => {
    if (focus?.type !== 'formation') return;

    const formationExists = allFormations.value.some(
      (item) => item.formation.slug === focus.slug
    );

    if (!formationExists) {
      console.warn(`Formation "${focus.slug}" introuvable dans la liste.`);
      return;
    }

    // Attendre le DOM à jour
    await nextTick();

    const el = document.getElementById(`formation-${focus.slug}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
  { immediate: true }
);

</script>

<template>
  <div class="list-header">
    <h2>Liste des Formations</h2>
    <button class="toggle-btn" @click="toggleList" :aria-label="isOpen ? 'Fermer la liste' : 'Ouvrir la liste'">
      {{ isOpen ? '«' : '»' }}
    </button>
  </div>
  <ul v-show="isOpen">
    <li
      v-for="item in allFormations"
      :key="item.formation.id"
      @click="navigateTo(item)"
      :id="`formation-${item.formation.slug}`"
      :class="{ highlighted: props.objFocus?.type === 'formation' && props.objFocus?.slug === item.formation.slug }"
    >
      {{ item.formation.nom }} - {{ item.formation.placeDisponible ? "Places disponibles" : "Pas de places disponibles" }} – <em>{{ item.structure.nom }}</em>
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

em {
  color: gray;
}

.highlighted {
  background-color: #e0f7fa;
  font-weight: bold;
}
</style>
