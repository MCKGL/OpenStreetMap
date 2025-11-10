<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import type { OutilModel } from "@/models/Outil.model";
import {isFilled} from "@/utils/formatText.ts";

const props = defineProps<{
  outil: OutilModel;
}>();

const pdfContent = ref<HTMLElement | null>(null);
const resumeContent = ref<HTMLElement | null>(null);

const hasInfoSup = computed(() => {
  const o = props.outil;
  return (
    isFilled(o.competencesPrerequises) ||
    isFilled(o.materiel) ||
    isFilled(o.atouts) ||
    isFilled(o.pointsVigilance) ||
    isFilled(o.commentaires)
  );
});

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

      <div class="img-detail-billet-container">
        <img v-if="props.outil.imageUrl" class="img-detail-billet" :src="props.outil.imageUrl" alt="image entête de l'outil">
      </div>

      <section class="resume-section" ref="resumeContent" v-if="props.outil.resume" v-html="props.outil.resume" />

      <section>
        <div class="features">Caractéristiques de l'outil</div>
        <p v-if="props.outil.thematiques"><span class="feature-name">Thématiques</span> : {{ props.outil.thematiques.join(", ") }}</p>
        <p v-if="props.outil.typeUtilisateur"><span class="feature-name">Types d'utilisateurs</span> : {{ props.outil.typeUtilisateur.join(", ") }}</p>
        <p v-if="props.outil.profilLinguistique"><span class="feature-name">Profils linguistiques</span> : {{ props.outil.profilLinguistique.join(", ") }}</p>
        <p v-if="props.outil.competencesTravaillees"><span class="feature-name">Compétences travaillées</span> : {{ props.outil.competencesTravaillees.join(", ") }}</p>
        <p ref="resumeContent" v-if="props.outil.competencesTravailleesPrecisions" v-html="props.outil.competencesTravailleesPrecisions" />
        <p v-if="props.outil.niveauVise"><span class="feature-name">Niveaux visés</span> : {{ props.outil.niveauVise.join(", ") }}</p>
        <p v-if="props.outil.typeSupport"><span class="feature-name">Types de support</span> : {{ props.outil.typeSupport.join(", ") }}</p>
        <p v-if="props.outil.accessibiliteOutil"><span class="feature-name">Accessibilité</span> : {{ props.outil.accessibiliteOutil.join(", ") }}</p>

        <div v-if="hasInfoSup" class="features">Information supplémentaire</div>
        <p v-if="isFilled(props.outil.competencesPrerequises)"><span class="feature-name">Compétences prérequises</span> : <span ref="resumeContent" v-html="props.outil.competencesPrerequises" /></p>
        <p v-if="isFilled(props.outil.materiel)"><span class="feature-name">Matériel utilisé</span> : <span ref="resumeContent" v-html="props.outil.materiel" /></p>
        <p v-if="isFilled(props.outil.atouts)"><span class="feature-name">Atouts</span> : <span ref="resumeContent" v-html="props.outil.atouts" /></p>
        <p v-if="isFilled(props.outil.pointsVigilance)"><span class="feature-name">Points de vigilance</span> : <span ref="resumeContent" v-html="props.outil.pointsVigilance" /></p>
        <p v-if="isFilled(props.outil.commentaires)"><span class="feature-name">Commentaire général</span> : <span ref="resumeContent" v-html="props.outil.commentaires" /></p>
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

.img-detail-billet-container {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 100%;
  padding: 10px;
}

.img-detail-billet {
  max-width: 250px;
  max-height: 200px;
  object-fit: contain;
}

.resume-section {
  margin-top: 10px;
  margin-bottom: 10px;
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
  margin-bottom: 10px;
  margin-top: 30px;
}

.feature-name {
  text-decoration: underline;
}
</style>
