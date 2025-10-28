<script setup lang="ts">
import type {FichePratiqueModel} from "@/models/FichePratique.model.ts";
import {onMounted, ref} from "vue";
import {formatFullDate} from "@/utils/formatText.ts";

const props = defineProps<{
  fichePratique: FichePratiqueModel;
}>();

const pdfContent = ref<HTMLElement | null>(null);
const content = ref<HTMLElement | null>(null);

function wrapTextNodes(el: HTMLElement) {
  el.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
      const span = document.createElement('span');
      span.textContent = node.textContent;
      span.style.fontSize = '12px';
      span.style.lineHeight = '1.4';
      span.style.margin = '0 0 10px 0';
      node.replaceWith(span);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      wrapTextNodes(node as HTMLElement); // récursion
    }
  });
}

onMounted(() => {
  if (content.value) {
    // Images
    content.value.querySelectorAll('img').forEach(img => {
      (img as HTMLImageElement).style.maxWidth = '100%';
      (img as HTMLImageElement).style.height = 'auto';
      (img as HTMLImageElement).style.display = 'block';
      (img as HTMLImageElement).style.margin = '10px auto';
    });

    // Tout le texte
    wrapTextNodes(content.value);
  }
});
</script>

<template>
  <div class="fiche-pdf-wrapper">
    <div ref="pdfContent" class="pdf-container">
      <header class="pdf-header">
        <div class="pdf-date">
          Exporté depuis Réseau Alpha – {{ new Date().toLocaleDateString("fr-FR") }}
        </div>
        <h1>{{ props.fichePratique.titre }}</h1>
        <p class="publication-date">{{ formatFullDate(props.fichePratique.datePublication) }}</p>
      </header>

      <section class="resume-section" ref="content" v-if="props.fichePratique.contenu"
               v-html="props.fichePratique.contenu"/>
    </div>
  </div>
</template>

<style scoped>
.pdf-container {
  font-family: "Open Sans", sans-serif;
  padding: 20px;
  max-width: 800px;
}

.publication-date {
  color: var(--color-text-note);
  font-size: var(--subtext-font-size);
  text-align: center;
}

.pdf-header h1 {
  text-align: center;
  font-size: var(--pdf-title-font-size);
}

.pdf-date {
  text-align: center;
  font-size: var(--subtext-font-size);
  color: var(--color-text-subtext);
}

.resume-section {
  margin-top: 10px;
  margin-bottom: 10px;
}
</style>
