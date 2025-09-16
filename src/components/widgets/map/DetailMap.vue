<script setup lang="ts">
import {type AdresseModel, getAdresseByLatLong} from "@/models/Adresse.model.ts";
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {onMounted, ref} from "vue";
import type {FormationModel} from "@/models/Formation.model.ts";
import {useRoute} from "vue-router";
import {
  getAdressesByPermanenceSlug,
  getAdressesByStructureSlug, getLieuxByPermanenceSlug
} from "@/services/StructurePermanence.service.ts";
import {type MapRoute, ROUTE_TYPE} from "@/types/RouteType.ts";
import LoadingAnimation from "@/components/ui/LoadingAnimation.vue";

const loading = ref(true);
let map: L.Map
let markers: L.LayerGroup
const mapDetailRef = ref<HTMLElement | null>(null);
const markerRefs: Record<string, L.Marker> = {};
const route = useRoute();
const mapRoute = route.name as MapRoute;
const adresses = ref<AdresseModel[]>([]);

/**
 * Fonction initialisant la carte Leaflet simplement, sans cluster.
 */
function initMap() {
  map = L.map(mapDetailRef.value!, {minZoom: 5});

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map)

  markers = L.layerGroup()
  map.addLayer(markers)

  map.setView([48.684, 2.502], 9)
}

function fitVisibleMarkers(map: L.Map, markers: L.LayerGroup) {
  const layers = markers.getLayers() as L.Marker[];
  if (!layers.length) return;

  const bounds = L.latLngBounds(layers.map(m => m.getLatLng()));
  map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
}

function addMarkers() {
  markers.clearLayers();

  for (const adresse of adresses.value) {
    const {latitude, longitude} = adresse;
    if (!latitude || !longitude) continue;

    // Dans le cas d'une page voir formation, on affiche uniquement le marqueur rouge de l'adresse
    if (mapRoute === ROUTE_TYPE.DETAIL_MAP_FORMATION) {
      const m = L.marker([latitude, longitude], {
        icon: L.divIcon({
          html: `<img src="/icons/marker_red.png" alt="marker structure" />`,
          className: 'marker-structure',
          iconAnchor: [22, 44]
        }),
      }).addTo(map);

      markers.addLayer(m);
      map.setView([latitude, longitude], 15);
      continue;
    }

    // Structures
    for (const s of adresse.structures || []) {
      let iconUrl = '/icons/marker_blue.png';
      let markerClass = 'marker-structure';

      if (mapRoute === ROUTE_TYPE.DETAIL_MAP_STRUCTURE_LEARNING) {
        const hasFormationSameAddress = (s.formations || []).some(f =>
          f.adresses?.some(a =>
            a.latitude === adresse.latitude && a.longitude === adresse.longitude
          )
        );

        if (hasFormationSameAddress) {
          iconUrl = '/icons/marker_blue_rotated.png';
          markerClass = 'marker-structure marker-structure-rotated';
        }
      }

      const logoHtml = s.logo
        ? `<div class="popup-img"><img src="${s.logo}" alt="${s.nom}" /></div>`
        : '';

      const adressText = `<p class="popup-activity-list">
    ${(adresse.numero || '')}${adresse.numero && adresse.voie ? ', ' : ''}${adresse.voie || ''}<br>
    ${adresse.codePostal || ''}${adresse.codePostal && adresse.ville ? ' - ' : ''}${adresse.ville || ''}
  </p>`;

      const popup = `<div class="popup-container">
    <div class="popup-description">
      ${logoHtml}
      <div class="popup-text-container">
        <p><strong class="popup-title">${s.nom}</strong></p>
        ${adressText}
      </div>
    </div>
  </div>`;

      const m = L.marker([latitude, longitude], {
        icon: L.divIcon({
          html: `<img src="${iconUrl}" alt="marker structure" />`,
          className: markerClass,
          iconAnchor: [22, 0]
        }),
      })
        .bindPopup(popup)
        .on('popupopen', () => bindFormationButtons(m));

      markers.addLayer(m);
      const key = `structure-${s.slug}-${latitude}-${longitude}`;
      markerRefs[key] = m;
    }

    // Points Formations
    const groupFormations = new Map<string, FormationModel[]>();

    // On n'affiche pas les formations si on est sur la page acteur ressource
    if (mapRoute !== ROUTE_TYPE.DETAIL_MAP_STRUCTURE_ACTOR) {
      for (const f of adresse.formations || []) {
        const key = `${adresse.latitude}-${adresse.longitude}`;
        if (!groupFormations.has(key)) groupFormations.set(key, []);
        groupFormations.get(key)!.push(f);
      }
    }

    for (const formationsAtAddress of groupFormations.values()) {
      const hasStructureSameAddress = mapRoute !== ROUTE_TYPE.DETAIL_MAP_FORMATION &&
        formationsAtAddress.some(f =>
          f.structure?.adresses?.some(a =>
            a.latitude === adresse.latitude && a.longitude === adresse.longitude
          )
        );

      const struct = formationsAtAddress[0].structure!;

      // Choix de l'icône de base selon place disponible
      let iconBase = formationsAtAddress.some(f => f.placeDisponible) ? 'marker_yellow' : 'marker_gray';
      if (hasStructureSameAddress) iconBase += '_rotated';
      const iconUrl = `/icons/${iconBase}.png`;

      const markerClass = hasStructureSameAddress
        ? 'marker-formation marker-formation-rotated'
        : 'marker-formation';

      const formationsHTML = `
        <ul class="popup-formation-list">
          ${formationsAtAddress.map(f => `
            <li>
              <a href="${f.url}" target="_blank" class="orphan-link formation-list ${!f.placeDisponible ? 'noDispo' : ''}" data-slug="${f.slug}">
                ${f.nom}
              </a>
            </li>
          `).join('')}
        </ul>
      `;

      const logoHtml = struct.logo
        ? `<div class="popup-img"><img src="${struct.logo}" alt="${struct.nom}" /></div>`
        : '';

      const adressText = `<p class="popup-activity-list">
      ${(adresse.numero || '')}${adresse.numero && adresse.voie ? ', ' : ''}${adresse.voie || ''}<br>
      ${adresse.codePostal || ''}${adresse.codePostal && adresse.ville ? ' - ' : ''}${adresse.ville || ''}
    </p>`;

      const popup = `<div class="popup-container">
        <div class="popup-description">
          ${logoHtml}
          <div class="popup-text-container">
            <p><strong class="popup-title">${struct.nom}</strong></p>
              ${adressText}
          </div>
        </div>
        <div>Formations de cette structure à cette adresse :</div>
        ${formationsHTML}
      </div>`;


      const m = L.marker([adresse.latitude, adresse.longitude], {
        icon: L.divIcon({
          html: `<img src="${iconUrl}" alt="marker formation" />`,
          className: markerClass,
          iconAnchor: [22, 0]
        }),
      }).bindPopup(popup);

      m.on('popupopen', () => {
        const container = m.getPopup()!.getElement()!;
        container.querySelectorAll<HTMLButtonElement>('.orphan-link').forEach(btn => {
          btn.addEventListener('click', () => m.closePopup());
        });
      });

      markers.addLayer(m);

      for (const f of formationsAtAddress) {
        const key = `formation-${f.slug}-${adresse.latitude}-${adresse.longitude}`;
        markerRefs[key] = m;
      }
    }

    // Permanences
    for (const p of adresse.permanences || []) {
      const logoHtml = p.logo
        ? `<div class="popup-img"><img src="${p.logo}" alt="${p.nom}" /></div>`
        : '';

      const adressText = `<p class="popup-activity-list">
      ${(adresse.numero || '')}${adresse.numero && adresse.voie ? ', ' : ''}${adresse.voie || ''}<br>
      ${adresse.codePostal || ''}${adresse.codePostal && adresse.ville ? ' - ' : ''}${adresse.ville || ''}
    </p>`;

      const popup = `<div class="popup-container">
    <div class="popup-description">
      ${logoHtml}
      <div class="popup-text-container">
        <p><strong class="popup-title">${p.nom}</strong></p>
        ${adressText}
      </div>
    </div>
  </div>`;

      const adresseTyped = adresse as AdresseModel & { typeMarker?: 'red' | 'black' };
      let iconBase = adresseTyped.typeMarker === 'red' ? 'marker_red' : 'marker_black';

      // Vérifie si un autre lieu partage les mêmes coordonnées
      const hasConflict = adresses.value.some(a => {
        const aTyped = a as AdresseModel & { typeMarker?: 'red' | 'black' };
        return aTyped.typeMarker !== adresseTyped.typeMarker &&
          aTyped.latitude === adresseTyped.latitude &&
          aTyped.longitude === adresseTyped.longitude;
      });

      let markerClass = 'marker-permanence';
      if (hasConflict) {
        markerClass += adresseTyped.typeMarker === 'red'
          ? ' marker-permanence-red-rotated'
          : ' marker-permanence-black-rotated';
        iconBase += '_rotated';
      }

      const m = L.marker([adresse.latitude, adresse.longitude], {
        icon: L.divIcon({
          html: `<img src="/icons/${iconBase}.png" alt="marker permanence" />`,
          className: markerClass,
          iconAnchor: [22, 0]
        }),
      }).bindPopup(popup);

      markers.addLayer(m);
      const key = `permanence-${p.slug}-${adresse.latitude}-${adresse.longitude}`;
      markerRefs[key] = m;
    }

  }
  fitVisibleMarkers(map, markers);
}

function bindFormationButtons(marker: L.Marker) {
  const container = marker.getPopup()?.getElement();
  if (!container) return;

  container.querySelectorAll<HTMLButtonElement>('.formation-link, .orphan-link').forEach(btn => {
    btn.onclick = null;
  });
}

/**
 * Ajoute la légende au coin inférieur droit de la carte. La légende garde en mémoire son état (ouverte ou fermée)
 * temps qu'on ne ferme pas l'onglet du navigateur (sessionStorage).
 */
function addLegend(route: MapRoute) {
  const legend = (L.control as unknown as (options: L.ControlOptions) => L.Control)({
    position: 'bottomright'
  });

  legend.onAdd = () => {
    const storedState = sessionStorage.getItem('legendState');
    const isOpenInitially = storedState !== 'closed';

    const c = L.DomUtil.create('div', `legend-container ${isOpenInitially ? 'open' : ''}`);

    let legendContent = `
      <button class="legend-toggle" aria-label="${isOpenInitially ? 'Fermer' : 'Ouvrir'} la légende">
        ${isOpenInitially
      ? `<img class="btn-legend" src="/icons/expand_down.svg" alt="Fermer la légende">`
      : `Légende <img class="btn-legend" src="/icons/expand_up.svg" alt="Ouvrir la légende">`}
      </button>
      <div class="legend-content">
        <h4>Légende</h4>
    `;

    if (route === ROUTE_TYPE.DETAIL_MAP_STRUCTURE_LEARNING) {
      legendContent += `
        <div><img class="ico-legend" src="/icons/marker_blue.png" alt="marqueur bleu structures"> Lieu de la structure</div>
        <div><img class="ico-legend" src="/icons/marker_yellow.png" alt="marqueur jaune formations place dispo"> Lieu de formations avec place disponible</div>
        <div><img class="ico-legend" src="/icons/marker_gray.png" alt="marqueur gris formations sans place"> Lieu de formations sans place disponible</div>
      `;
    }
    if (route === ROUTE_TYPE.DETAIL_MAP_COORDINATION) {
      legendContent += `
        <div><img class="ico-legend" src="/icons/marker_red.png" alt="marqueur rouge permanences adresse générale"> Coordination (adresse générale)</div>
        <div><img class="ico-legend" src="/icons/marker_black.png" alt="marqueur noir permanences"> Permanence(s) d'accueil, d'évaluation et d'orientation linguistique</div>
      `;
    }

    if (route === ROUTE_TYPE.DETAIL_MAP_STRUCTURE_ACTOR) {
      legendContent += `
        <div><img class="ico-legend" src="/icons/marker_blue.png" alt="marqueur bleu structures"> Lieu de la structure</div>
      `;
    }

    legendContent += `</div>`;
    c.innerHTML = legendContent;

    const btn = c.querySelector<HTMLButtonElement>('.legend-toggle')!;
    btn.onclick = () => {
      const isOpen = c.classList.toggle('open');
      sessionStorage.setItem('legendState', isOpen ? 'open' : 'closed');

      btn.innerHTML = isOpen
        ? `<img class="btn-legend" src="/icons/expand_down.svg" alt="Fermer la légende">`
        : `Légende <img class="btn-legend" src="/icons/expand_up.svg" alt="Ouvrir la légende">`;
      btn.setAttribute('aria-label', isOpen ? 'Fermer la légende' : 'Ouvrir la légende');
    };
    return c;
  };
  legend.addTo(map);
}

/**
 * Ajoute un bouton pour recentrer la carte sur les marqueurs visibles
 */
function addRecenterButton() {
  const ctrl = (L.control as unknown as (options: L.ControlOptions) => L.Control)({
    position: 'topright'
  });

  ctrl.onAdd = () => {
    const btn = L.DomUtil.create('button', 'recenter-btn-detail-map');
    btn.title = 'Recentrer sur la sélection';
    btn.innerHTML = '📍';

    L.DomEvent.disableClickPropagation(btn);

    btn.onclick = async () => {
      map.closePopup();
      fitVisibleMarkers(map, markers);
    };
    return btn;
  };
  ctrl.addTo(map);
}

onMounted(async () => {
  const slug = route.params.slug as string;

  try {
    if (mapRoute === ROUTE_TYPE.DETAIL_MAP_STRUCTURE_LEARNING || mapRoute === ROUTE_TYPE.DETAIL_MAP_STRUCTURE_ACTOR) {
      adresses.value = await getAdressesByStructureSlug(slug);
    } else if (mapRoute === ROUTE_TYPE.DETAIL_MAP_COORDINATION) {
      const [permanenceAdresses, permanenceLieux] = await Promise.all([
        getAdressesByPermanenceSlug(slug),
        getLieuxByPermanenceSlug(slug)
      ]);

      adresses.value = [
        ...permanenceAdresses.map(a => ({ ...a, typeMarker: 'black' })),
        ...permanenceLieux.map(a => ({ ...a, typeMarker: 'red' }))
      ];
    } else if (mapRoute === ROUTE_TYPE.DETAIL_MAP_FORMATION) {
      const adresse = getAdresseByLatLong(parseFloat(route.params.lat as string), parseFloat(route.params.long as string));
      adresses.value = [adresse];
    }
  } finally {
    loading.value = false;
  }

  initMap();
  if (mapRoute !== ROUTE_TYPE.DETAIL_MAP_FORMATION) {
    addLegend(mapRoute);
  }
  addRecenterButton();
  addMarkers();
});
</script>

<template>
  <LoadingAnimation class="loading" v-if="loading" />
  <div ref="mapDetailRef" id="mapDetail"></div>
</template>

<style>
.marker-structure img, .marker-formation img, .marker-permanence img {
  width: 41px;
  height: 41px;
  position: absolute;
}

.marker-structure-rotated img, .marker-permanence-black-rotated img {
  width: 32px;
  height: 32px;
  left: 1.8em;
  top: 7px;
}

.marker-formation-rotated img, .marker-permanence-red-rotated img {
  width: 32px;
  height: 32px;
  left: -0.8em;
  top: 7px;
}

.loading {
  position: absolute;
  width: 100vw;
  height: 100vh;
  z-index: 999;
}

.popup-description {
  gap: 20px;
}
</style>
