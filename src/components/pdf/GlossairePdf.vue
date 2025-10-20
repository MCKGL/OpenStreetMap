<script setup lang="ts">
import type { GlossaireModel } from "@/models/Glossaire.model";
import { onMounted, ref } from "vue";

const props = defineProps<{
  glossaire: GlossaireModel;
}>();

const pdfContent = ref<HTMLElement | null>(null);
const resumeContent = ref<HTMLElement | null>(null);

onMounted(() => {
  if (resumeContent.value) {
    const paragraphes = resumeContent.value.querySelectorAll('p');

    paragraphes.forEach(p => {
      p.style.fontSize = '11px';
      p.style.fontStyle = 'normal';
      p.style.margin = '0';
      p.style.lineHeight = '1.4';

      const brs = p.querySelectorAll('br');
      brs.forEach(br => br.remove());
    });
  }
});
</script>

<template>
  <div ref="pdfContent" class="pdf-container">
    <header class="pdf-header">
      <h1>Glossaire Réseau Alpha</h1>
      <p class="pdf-date">Exporté le {{ new Date().toLocaleDateString("fr-FR") }}</p>
    </header>

    <section ref="resumeContent">
      <h2>Entrées linguistiques</h2>
      <div
        v-for="entry in props.glossaire.entreesLinguistique"
        :key="entry.id"
        class="entry"
      >
        <h3>{{ entry.nom }}</h3>
        <p v-html="entry.definition"></p>
      </div>
    </section>

    <section ref="resumeContent">
      <h2>Entrées accompagnement</h2>
      <div
        v-for="entry in props.glossaire.entreesAccompagnement"
        :key="entry.id"
        class="entry"
      >
        <h3>{{ entry.nom }}</h3>
        <p v-html="entry.definition"></p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pdf-container {
  font-family: "Open Sans", sans-serif;
  padding: 20px;
  max-width: 100%;
}

h2 {
  background: var(--color-hightlight) none repeat scroll 0 0;
  border: 2px solid var(--color-hightlight);
  color: var(--color-text-on-hightlight);
  font-size: var(--pdf-title-font-size);
  display: inline-block;
  padding: 8px 15px;
  text-align: center;
  transition: all 0.3s ease-in-out 0s;
  border-radius: 5px;
  margin-bottom: 20px;
  margin-top: 10px;
}

h3 {
  font-size: var(--text-font-size);
}
</style>
