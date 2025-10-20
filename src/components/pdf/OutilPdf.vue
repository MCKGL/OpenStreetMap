<script setup lang="ts">
import {onMounted, ref} from "vue";
import type { OutilModel } from "@/models/Outil.model";

const props = defineProps<{
  outil: OutilModel;
}>();

const pdfContent = ref<HTMLElement | null>(null);
const resumeContent = ref<HTMLElement | null>(null);

onMounted(() => {
  if (resumeContent.value) {
    const images = resumeContent.value.querySelectorAll('img');
    images.forEach(img => {
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      img.style.display = 'block';
      img.style.margin = '10px auto';
    });
  }
});
</script>

<template>
  <div class="outil-pdf-wrapper">
    <div ref="pdfContent" class="pdf-container">
      <header class="pdf-header">
        <div class="pdf-date">
          Exporté depuis Réseau Alpha – {{ new Date().toLocaleDateString("fr-FR") }}
        </div>
        <h1>{{ props.outil.titre }}</h1>
        <p class="structures-names">{{ props.outil.nomsStructures?.join(", ") }}</p>
      </header>

      <section ref="resumeContent" v-if="props.outil.resume" v-html="props.outil.resume" />

      <section v-if="props.outil.thematiques?.length">
        <div class="features"> Caractéristiques de l'outil</div>
        <p><span class="feature-name">Thématiques</span> : {{ props.outil.thematiques.join(", ") }}</p>
        <p><span class="feature-name">Types d'utilisateurs</span> : {{ props.outil.typeUtilisateur.join(", ") }}</p>
        <p><span class="feature-name">Profils linguistiques</span> : {{ props.outil.profilLinguistique.join(", ") }}</p>
        <p><span class="feature-name">Compétences travaillées</span> : {{ props.outil.competencesTravaillees.join(", ") }}</p>
        <p><span class="feature-name">Niveaux visés</span> : {{ props.outil.niveauVise.join(", ") }}</p>
        <p><span class="feature-name">Types de support</span> : {{ props.outil.typeSupport.join(", ") }}</p>
        <p><span class="feature-name">Accessibilité</span> : {{ props.outil.accessibiliteOutil.join(", ") }}</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pdf-container {
  font-family: "Open Sans", sans-serif;
  padding: 20px;
  max-width: 800px;
}

.structures-names {
  color: var(--color-hightlight);
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

.features {
  background: var(--color-hightlight) none repeat scroll 0 0;
  border: 2px solid var(--color-hightlight);
  color: var(--color-text-on-hightlight);
  display: inline-block;
  padding: 8px 15px;
  text-align: center;
  transition: all 0.3s ease-in-out 0s;
  border-radius: 5px;
  margin-bottom: 20px;
  margin-top: 10px;
}

.feature-name {
  text-decoration: underline;
}
</style>
