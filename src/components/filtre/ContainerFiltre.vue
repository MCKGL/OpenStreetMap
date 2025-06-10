<script setup lang="ts">
import {ref} from "vue";
import 'vue-multiselect/dist/vue-multiselect.min.css'
import Multiselect from 'vue-multiselect'
import {
  ACTIVITE_FORMATION,
  PUBLICS_SPECIFIQUES,
  OBJECTIF_VISE,
  CRITERES_SCOLARISATION,
  COMPETENCES_LINGUISTIQUES_VISEES
} from '@/models/Formation.model.ts'
import {JOURS_SEMAINE, HORAIRES} from '@/models/HorairesPeriode.model.ts'

const selectedActivites = ref<string[]>([]);
const selectedLieux = ref<string[]>([]);
const selectedCriteresScrolarisation = ref<string | null>(null);
const selectedCompetencesLinguistiquesVisees = ref<string | null>(null);
const selectedProgrammes = ref<string | null>(null);
const selectedPublics = ref<string[]>([]);
const selectedObjectifs = ref<string[]>([]);
const selectedJoursHoraires = ref<string[]>([]);

const activitesFormation = Object.values(ACTIVITE_FORMATION);
const villeCodePostal = ['option 1', 'option 2', 'option 3'];
const criteresScolarisation = Object.values(CRITERES_SCOLARISATION);
const competencesLinguistiquesVisees = Object.values(COMPETENCES_LINGUISTIQUES_VISEES);
const publicsSpecifiques = Object.values(PUBLICS_SPECIFIQUES);
const objectifVise = Object.values(OBJECTIF_VISE);
const programmes = ['option 1', 'option 2', 'option 3'];

const horairesGeneraux = Object.values(HORAIRES);
const joursSemaine = Object.values(JOURS_SEMAINE);
const groupedJoursHoraires = [
  {
    group: 'Périodes générales',
    items: horairesGeneraux.map(h => ({
      label: capitalize(h),
      value: capitalize(h)
    }))
  },
  ...joursSemaine.map(jour => {
    const jourCap = capitalize(jour);
    return {
      group: jourCap,
      items: [
        {label: `${jourCap} toute la journée`, value: `${jourCap} toute la journée`},
        ...horairesGeneraux.map(h => ({
          label: `${jourCap} ${capitalize(h)}`,
          value: `${jourCap} ${capitalize(h)}`
        }))
      ]
    };
  })
];

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

</script>

<template>
  <Multiselect
    v-model="selectedActivites"
    :options="activitesFormation"
    :multiple="true"
    :taggable="true"
    placeholder="Je recherche une formation de"
    :select-label="''"
    :deselect-label="''"
  />

  <Multiselect
    v-model="selectedLieux"
    :options="villeCodePostal"
    :multiple="true"
    :taggable="true"
    placeholder="Ville ou code postal"
    :select-label="''"
    :deselect-label="''"
  />

  <Multiselect
    v-model="selectedCriteresScrolarisation"
    :options="criteresScolarisation"
    placeholder="Niveau de scolarisation"
    :taggable="true"
    :select-label="''"
    :deselect-label="''"
  />

  <Multiselect
    v-model="selectedCompetencesLinguistiquesVisees"
    :options="competencesLinguistiquesVisees"
    placeholder="Niveau de langue visé"
    :taggable="true"
    :select-label="''"
    :deselect-label="''"
  />

  <Multiselect
    v-model="selectedPublics"
    :options="publicsSpecifiques"
    :multiple="true"
    :taggable="true"
    placeholder="Type de public / publics spécifiques"
    :select-label="''"
    :deselect-label="''"
  />

  <Multiselect
    v-model="selectedObjectifs"
    :options="objectifVise"
    :multiple="true"
    :taggable="true"
    placeholder="Objectifs visés"
    :select-label="''"
    :deselect-label="''"
  />

  <Multiselect
    v-model="selectedProgrammes"
    :options="programmes"
    placeholder="Dispositif / Programme spécifique"
    :taggable="true"
    :select-label="''"
    :deselect-label="''"
  />

  <Multiselect
    v-model="selectedJoursHoraires"
    :options="groupedJoursHoraires"
    :group-label="'group'"
    :group-values="'items'"
    :label="'label'"
    :track-by="'value'"
    :multiple="true"
    :taggable="true"
    placeholder="Jours et horaires de la formation"
    :select-label="''"
    :deselect-label="''"
  />

</template>

<style>
.multiselect__tag, .multiselect__option--highlight {
  background-color: #0F7ECB;
}
</style>
