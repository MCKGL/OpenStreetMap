<script setup lang="ts">
import {useRoute} from 'vue-router';
import DownloadIcon from "@/components/icons/DownloadIcon.vue";
import {useExportPDF} from "@/composables/pdf/useExportPDF.ts";
import {ROUTE_TYPE} from "@/types/RouteType.ts";

const route = useRoute();
const { generate } = useExportPDF();
const slug = route.params.slug as string | undefined;

const isOutilPDF = route.name === ROUTE_TYPE.PDF_OUTIL_GENERATOR;
const isGlossairePDF = route.name === ROUTE_TYPE.PDF_GLOSSAIRE_GENERATOR;
const isFichePDF = route.name === ROUTE_TYPE.PDF_FICHE_GENERATOR;

const buttonText = isOutilPDF
  ? "l'outil"
  : isGlossairePDF
    ? "le glossaire"
    : isFichePDF
      ? "la fiche"
      : "le document";

async function handleClick() {
  try {
    if (isOutilPDF && slug) {
      await generate("outil", slug);
    } else if (isGlossairePDF) {
      await generate("glossaire");
    } else if (isFichePDF && slug) {
      await generate("fiche", slug);
    }
  } catch {
    alert("Erreur lors de la génération du PDF");
  }
}
</script>

<template>
    <a class="btn-telecharger-fiche readon" @click="handleClick">
      <div class="btn-text"><p>Télécharger {{buttonText}}</p>
        <p>en format pdf</p></div>
      <div class="btn-icon">
        <DownloadIcon class="downloadIcon"/>
      </div>
    </a>
</template>

<style scoped>
.btn-telecharger-fiche {
  background-color: var(--vt-c-white);
  color: var(--color-text-label);
  border: 1px solid var(--color-text-label);
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.3s ease-in-out;
  width: fit-content;
  height: fit-content;
}

.btn-telecharger-fiche .btn-text p {
  margin: 0;
  font-size: 0.9rem;
  transition: color 0.3s ease-in-out;
}

.btn-telecharger-fiche .downloadIcon {
  fill: var(--color-text-label);
  stroke: var(--color-text-label);
  transition: fill 0.3s ease-in-out, stroke 0.3s ease-in-out;
}

/* Hover effect */
.btn-telecharger-fiche:hover {
  background-color: var(--color-text-label);
  color: var(--vt-c-white);
  border-color: var(--vt-c-white);
}

.btn-telecharger-fiche:hover .btn-text p {
  color: var(--vt-c-white);
}

.btn-telecharger-fiche:hover .downloadIcon {
  fill: var(--vt-c-white);
  stroke: var(--vt-c-white);
}
</style>
