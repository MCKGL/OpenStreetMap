<script setup lang="ts">
import {useRoute} from 'vue-router';
import {useExportOutilPDF} from "@/composables/pdf/exportOutilPDF.ts";
import DownloadIcon from "@/components/icons/DownloadIcon.vue";

const route = useRoute();
const slug = route.params.slug as string;

const {generatePdf} = useExportOutilPDF();

function handleClick() {
  generatePdf(slug);
}
</script>

<template>
    <a class="btn-telecharger-fiche readon" @click="handleClick">
      <div class="btn-text"><p>Télécharger la fiche</p>
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
