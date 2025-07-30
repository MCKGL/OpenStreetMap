<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from "vue";
import 'vue-multiselect/dist/vue-multiselect.min.css'
import Multiselect from 'vue-multiselect'
import {
  ACTIVITE_FORMATION,
  CRITERES_SCOLARISATION,
  COMPETENCES_LINGUISTIQUES_VISEES,
  HORAIRES,
  JOURS_SEMAINE
} from '@/models/Formation.model.ts'
import * as VilleDepartementService from '@/services/VilleDepartement.service.ts'
import * as ProgrammeService from '@/services/Programme.service.ts'
import router from "@/router";
import type {LocationQueryRaw} from "vue-router";
import {capitalize} from "@/utils/formatText.ts";
import {PUBLICS_SPECIFIQUES} from "@/models/PublicSpecifique.model.ts";
import {OBJECTIF_VISE} from "@/models/ObjectifVise.model.ts";

const isFilterOpen = ref(false);
const isMobile = ref(window.innerWidth <= 810);

const emit = defineEmits<{
  (e: 'toggle-filter', open: boolean): void;
}>()

const isAdvancedOpen = ref(false);
const isKeywordOpen = ref(false);

const selectedActivites = ref<string[]>([]);
const selectedLieux = ref<{ label: string; value: string }[]>([]);
const selectedCriteresScrolarisation = ref<string | null>(null);
const selectedCompetencesLinguistiquesVisees = ref<string | null>(null);
const selectedProgrammes = ref<string | null>(null);
const selectedPublics = ref<string[]>([]);
const selectedObjectifs = ref<string[]>([]);
const selectedJoursHoraires = ref<(string | {label: string; value: string})[]>([]);

const activitesFormation = Object.values(ACTIVITE_FORMATION);
const villeCodePostal = ref<{group: string, items: {label: string, value: string}[]}[]>([]);
const criteresScolarisation = Object.values(CRITERES_SCOLARISATION);
const competencesLinguistiquesVisees = Object.values(COMPETENCES_LINGUISTIQUES_VISEES);
const publicsSpecifiques = Object.values(PUBLICS_SPECIFIQUES);
const objectifVise = Object.values(OBJECTIF_VISE);
const programmes = ref<string[]>([]);
const gardeEnfantsChecked = ref(false);
const coursEteChecked = ref(false);
const formaDispoChecked = ref(false);

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

function toggleFilter() {
  isFilterOpen.value = !isFilterOpen.value
  emit('toggle-filter', isFilterOpen.value)
}

function updateIsMobile() {
  isMobile.value = window.innerWidth <= 810;
  if (!isMobile.value) isFilterOpen.value = true;
}

function applyFilters() {
  const keywordInput = document.getElementById('keyword') as HTMLInputElement | null;
  const keyword = keywordInput?.value.trim() ?? '';

  const filtersPayload: Record<string, unknown> = {};

  if (selectedActivites.value.length) filtersPayload.activites = selectedActivites.value.join(',');
  if (selectedLieux.value.length) {
    filtersPayload.lieux = selectedLieux.value.map(l => l.value).join(',');
  }
  if (selectedCriteresScrolarisation.value) filtersPayload.scolarisation = selectedCriteresScrolarisation.value;
  if (selectedCompetencesLinguistiquesVisees.value) filtersPayload.competence = selectedCompetencesLinguistiquesVisees.value;
  if (selectedProgrammes.value) filtersPayload.programmes = selectedProgrammes.value;
  if (selectedPublics.value.length) filtersPayload.publics = selectedPublics.value.join(',');
  if (selectedObjectifs.value.length) filtersPayload.objectifs = selectedObjectifs.value.join(',');
  if (selectedJoursHoraires.value.length) {
    const joursHorairesValues = selectedJoursHoraires.value.map(item =>
      typeof item === 'string' ? item : item.value
    );
    filtersPayload.joursHoraires = joursHorairesValues.join(',');
  }
  if (gardeEnfantsChecked.value) filtersPayload.gardeEnfants = true;
  if (coursEteChecked.value) filtersPayload.coursEte = true;
  if (formaDispoChecked.value) filtersPayload.formationDispo = true;
  if (keyword.length > 0) filtersPayload.keyword = keyword;

  isAdvancedOpen.value = false;
  isKeywordOpen.value = false;
  toggleFilter();

  router.replace({
    query: filtersPayload as LocationQueryRaw
  });

}

function parseArrayParam(param: string | null): string[] {
  if (!param) return [];
  return param.split(',').map(s => decodeURIComponent(s.trim())).filter(Boolean);
}

function parseJoursHorairesParam(param: string | null): (string | {label: string, value: string})[] {
  if (!param) return [];
  return param.split(',').map(val => {
    const v = decodeURIComponent(val.trim());
    return {label: v, value: v};
  }).filter(Boolean);
}

onMounted(async () => {
  window.addEventListener('resize', updateIsMobile);
  updateIsMobile();

  const departements = await VilleDepartementService.getDepartements();
  const villes = await VilleDepartementService.getVilles();

  villeCodePostal.value = [
    {
      group: 'Départements',
      items: departements.map(d => ({
        label: `${d.departement} (${d.codePostal})`,
        value: `${d.departement} (${d.codePostal})`
      }))
    },
    {
      group: 'Villes',
      items: villes.map(v => ({
        label: `${v.ville} (${v.codePostal})`,
        value: `${v.ville} (${v.codePostal})`
      }))
    }
  ];

  const progData = await ProgrammeService.getProgrammes();
  programmes.value = progData.map(p => p.nom);

  const params = new URLSearchParams(window.location.search);

  selectedActivites.value = parseArrayParam(params.get('activites'));

  const lieuxParam = parseArrayParam(params.get('lieux'));
  selectedLieux.value = lieuxParam.map(val => ({label: val, value: val}));

  selectedCriteresScrolarisation.value = params.get('scolarisation');

  selectedCompetencesLinguistiquesVisees.value = params.get('competence');

  selectedProgrammes.value = params.get('programmes');

  selectedPublics.value = parseArrayParam(params.get('publics'));

  selectedObjectifs.value = parseArrayParam(params.get('objectifs'));

  selectedJoursHoraires.value = parseJoursHorairesParam(params.get('joursHoraires'));

  gardeEnfantsChecked.value = (params.get('gardeEnfants') === 'true');
  coursEteChecked.value = (params.get('coursEte') === 'true');
  formaDispoChecked.value = (params.get('formationDispo') === 'true');

  const keyword = params.get('keyword');
  if (keyword) {
    const inputKeyword = document.getElementById('keyword') as HTMLInputElement | null;
    if (inputKeyword) inputKeyword.value = keyword;
    isKeywordOpen.value = true;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateIsMobile);
});

</script>

<template>
  <section id="filter-container">
    <section class="filter-button-mobile-container">
      <div class="section-title" @click="toggleFilter">
        <h3>
          <a href="javascript:void(0)">
            <span class="accordion-icon">{{ isFilterOpen ? '−' : '+' }}</span>
            {{ isFilterOpen ? 'Fermer le filtre' : 'Filtrer les formations' }}
          </a>
        </h3>
      </div>
    </section>

    <section v-if="!isMobile || isFilterOpen">
      <section class="first-section">
        <div id="first-section-activites" class="global-input">
          <label for="activites-select" class="label">Je recherche une formation de :</label>
          <Multiselect
            id="activites-select"
            v-model="selectedActivites"
            :options="activitesFormation"
            :multiple="true"
            :taggable="true"
            placeholder=""
            :select-label="''"
            :deselect-label="''"
          />
        </div>
        <div id="first-section-place" class="global-input">
          <label for="lieux-select" class="label">Ville ou code postal :</label>
          <Multiselect
            id="lieux-select"
            v-model="selectedLieux"
            :options="villeCodePostal"
            :group-label="'group'"
            :group-values="'items'"
            label="label"
            track-by="value"
            :multiple="true"
            :taggable="true"
            placeholder=""
            :select-label="''"
            :deselect-label="''"
          />
        </div>
        <div id="first-section-button">
          <button class="readon" @click="applyFilters">Trouver</button>
        </div>

      </section>

      <hr />

      <section class="advanced-section">
        <div class="section-title filter-advanced-title">
          <h3 @click="isAdvancedOpen = !isAdvancedOpen">
            <a href="javascript:void(0)">
              <span class="accordion-icon">{{ isAdvancedOpen ? '−' : '+' }}</span>
              Recherche Avancée
            </a>
          </h3>
          <div class="instructions-links">
            <img class="icon-instruction" src="/icons/question.svg" alt="Instructions de la recherche" />
            <a href="https://www.reseau-alpha.org/pdf/recherche_reseau-alpha_francais.pdf" target="_blank">
              Français <span>|</span>
            </a>
            <a href="https://www.reseau-alpha.org/pdf/recherche_reseau-alpha_anglais.pdf" target="_blank">
              English <span>|</span>
            </a>
            <a href="https://www.reseau-alpha.org/pdf/recherche_reseau-alpha_arabe.pdf" target="_blank">
              العَرَبيّة <span>|</span>
            </a>
            <a href="https://www.reseau-alpha.org/pdf/recherche_reseau-alpha_chinois.pdf" target="_blank">
              中文 <span>|</span>
            </a>
            <a href="https://www.reseau-alpha.org/pdf/recherche_reseau-alpha_espagnol.pdf" target="_blank">
              Español <span>|</span>
            </a>
            <a href="https://www.reseau-alpha.org/pdf/recherche_reseau-alpha_roumain.pdf" target="_blank">
              Român <span>|</span>
            </a>
            <a href="https://www.reseau-alpha.org/pdf/recherche_reseau-alpha_russe.pdf" target="_blank">
              Русский
            </a>
          </div>
        </div>
        <section v-show="isAdvancedOpen" class="advanced-section">
          <p>Ces critères ne s’appliquent qu’aux formations publiées. Certaines structures
            d’apprentissage n’ont pas publié de formations. Pour consulter la liste complète des
            structures, utilisez la recherche simple.</p>

          <div class="advanced-section-part">
            <div id="advanced-section-criteres" class="global-input">
              <label for="criteres-scolarisation-select" class="label">Niveau de scolarisation :</label>
              <Multiselect
                id="criteres-scolarisation-select"
                v-model="selectedCriteresScrolarisation"
                :options="criteresScolarisation"
                placeholder=""
                :taggable="true"
                :select-label="''"
                :deselect-label="''"
              />
            </div>

            <div id="advanced-section-competences-linguistiques" class="global-input">
              <label for="competences-linguistiques-select" class="label">Niveau de langue visé :</label>
              <Multiselect
                id="competences-linguistiques-select"
                v-model="selectedCompetencesLinguistiquesVisees"
                :options="competencesLinguistiquesVisees"
                placeholder=""
                :taggable="true"
                :select-label="''"
                :deselect-label="''"
              />
            </div>
          </div>

          <div class="advanced-section-part">
            <div id="advanced-section-publics" class="global-input">
              <label for="publics-select" class="label">Type de public / publics spécifiques :</label>
              <Multiselect
                id="publics-select"
                v-model="selectedPublics"
                :options="publicsSpecifiques"
                :multiple="true"
                :taggable="true"
                placeholder=""
                :select-label="''"
                :deselect-label="''"
              />
            </div>

            <div id="advanced-section-objectifs" class="global-input">
              <label for="objectifs-select" class="label">Objectifs visés :</label>
              <Multiselect
                id="objectifs-select"
                v-model="selectedObjectifs"
                :options="objectifVise"
                :multiple="true"
                :taggable="true"
                placeholder=""
                :select-label="''"
                :deselect-label="''"
              />
            </div>
          </div>

          <div class="advanced-section-part">
            <div id="advanced-section-programmes" class="global-input">
              <label for="programmes-select" class="label">Dispositif / Programme spécifique :</label>
              <Multiselect
                id="programmes-select"
                v-model="selectedProgrammes"
                :options="programmes"
                placeholder=""
                :taggable="true"
                :select-label="''"
                :deselect-label="''"
              />
            </div>
            <div id="advanced-section-checkbox">
              <label for="checkbox" class="label">
                <input type="checkbox" id="checkbox-children" v-model="gardeEnfantsChecked" />
                Garde d'enfants
              </label>

              <label for="checkbox" class="label">
                <input type="checkbox" id="checkbox-summer" v-model="coursEteChecked" />
                Cours d'été
              </label>

              <label for="checkbox" class="label">
                <input type="checkbox" id="checkbox-only-forma-available" v-model="formaDispoChecked" />
                Afficher uniquement les formations avec places disponibles
              </label>
            </div>
          </div>

          <div class="advanced-section-part">
            <div id="advanced-section-jours-horaires" class="global-input">
              <label for="jours-horaires-select" class="label">Jours et horaires de la formation :</label>
              <Multiselect
                id="jours-horaires-select"
                v-model="selectedJoursHoraires"
                :options="groupedJoursHoraires"
                :group-label="'group'"
                :group-values="'items'"
                :label="'label'"
                :track-by="'value'"
                :multiple="true"
                :taggable="true"
                placeholder=""
                :select-label="''"
                :deselect-label="''"
              />
            </div>
          </div>
        </section>
      </section>

      <section class="keyword-section">
        <div class="section-title" @click="isKeywordOpen = !isKeywordOpen">
          <h3>
            <a href="javascript:void(0)">
              <span class="accordion-icon">{{ isKeywordOpen ? '−' : '+' }}</span>
              Recherche par mot-clé
            </a>
          </h3>
        </div>
        <div id="keyword-section-input" v-show="isKeywordOpen">
          <label for="keyword" class="label">Taper un mot-clé : </label>
          <input
            id="keyword"
            type="text"
            class="input"
          />
        </div>
      </section>
    </section>
    </section>
</template>

<style>
.multiselect__tag, .multiselect__option--highlight {
  background-color: var(--color-blue-alpha);
}

.section-title h3 {
  margin: 0;
  flex: 2;
}

.filter-advanced-title {
  display: flex;
}

.instructions-links a {
  text-decoration: none;
  color: var(--color-blue-alpha);
  font-size: var(--text-font-size);
}

.instructions-links a:hover {
  text-decoration: underline;
}

.icon-instruction{
  width: 30px;
}

#filter-container {
  padding: 0.5em;
}

.first-section, .advanced-section-part {
  display: flex;
  flex-direction: row;
  text-align: center;
}

.global-input {
  margin: 0.5em;
  gap: 0.5em;
  display: flex;
  flex-direction: column;
}

#first-section-activites {
  flex: 2;
}

#first-section-place {
  flex: 3;
}

#first-section-button {
  flex: 1;
  margin: 0.5em;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

#advanced-section-criteres {
  flex : 2;
}

#advanced-section-competences-linguistiques {
  flex: 1;
}

#advanced-section-publics {
  flex: 1;
}

#advanced-section-objectifs {
  flex: 1;
}

#advanced-section-programmes {
  flex: 1;
}

#advanced-section-checkbox {
  flex: 1;
  margin: 0.5em;
  display: flex;
  align-items: center;
  gap: 10px;
}

#advanced-section-jours-horaires {
  flex: 1;
}

#keyword-section-input {
  width: 50%;
  margin: 0.5em;
  display: flex;
  gap: 1em;
}

#keyword-section-input .input {
  width: 100%;
  padding: 0.5em;
  border: 1px solid var(--color-background-highlight);
  border-radius: 4px;
  flex: 2;
}

hr {
  margin: 0.5em;
  width: auto;
  border-top: 1px solid var(--color-background-highlight);
  color: var(--color-background-soft);
}

#filter-container {
  background: var(--color-background-soft);
}

.section-title {
  margin: 0.5em;
}

p {
  margin: 0.5em;
  color: var(--color-text-note);
  font-size: var(--subtext-font-size);
}

label {
  font-size: var(--text-font-size);
  color: var(--color-text-label);
  font-weight: 400;
}

.filter-button-mobile-container {
  width: auto;
  padding: 0.5em;
  display: none;
}

@media (max-width: 810px) {
  .first-section, .advanced-section-part {
    flex-direction: column;
  }
  #keyword-section-input {
    width: auto;
  }
  .filter-button-mobile-container {
    display: block;
  }

  .section-title {
    flex-direction: column-reverse;
  }
}

</style>
