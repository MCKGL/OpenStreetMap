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

const buttonText = isOutilPDF
  ? "l'outil"
  : "le glossaire";

async function handleClick() {
  try {
    if (isOutilPDF && slug) {
      await generate("outil", slug);
    } else if (isGlossairePDF) {
      await generate("glossaire");
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
  border-color: var(--color-text-label);
  display: flex;
  width: fit-content;
  height: fit-content;
  align-items: center;
  gap: 20px;
}

p {
  margin: 0;
}

.downloadIcon {
  fill: var(--color-text-label);
  stroke: var(--color-text-label);
}

.btn-telecharger-fiche:hover {
  background-color: var(--color-text-label);
  color: var(--vt-c-white);

  .downloadIcon {
    fill: var(--vt-c-white);
    stroke: var(--vt-c-white);
  }
}
</style>
