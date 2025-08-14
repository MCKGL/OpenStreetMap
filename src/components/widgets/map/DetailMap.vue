<script setup lang="ts">
import type {AdresseModel} from "@/models/Adresse.model.ts";
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {onMounted, ref} from "vue";
import type {FormationModel} from "@/models/Formation.model.ts";
import {useRoute} from "vue-router";
import {
  getAdressesByPermanenceSlug,
  getAdressesByStructureSlug
} from "@/services/StructurePermanence.service.ts";

let map: L.Map
let markers: L.LayerGroup
const mapDetailRef = ref<HTMLElement | null>(null);
const markerRefs: Record<string, L.Marker> = {};
const route = useRoute();
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

function addMarkers() {
  markers.clearLayers();

  for (const adresse of adresses.value) {
    const {latitude, longitude} = adresse;
    if (!latitude || !longitude) continue;

    // Structures
    for (const s of adresse.structures || []) {
      const hasFormationSameAddress =
        (adresse.formations && adresse.formations.length > 0) ||
        (adresse.structures || []).some(struct =>
          (struct.formations || []).some(f =>
            f.adresses?.some(a => a.latitude === adresse.latitude && a.longitude === adresse.longitude)
          )
        );

      const iconUrl = hasFormationSameAddress ? '/icons/marker_blue_rotated.png' : '/icons/marker_blue.png';

      const markerClass = hasFormationSameAddress
        ? 'marker-structure marker-structure-rotated'
        : 'marker-structure';

      const logoHtml = s.logo
        ? `<div class="popup-img"><img src="${s.logo}" alt="${s.nom}" /></div>`
        : '';

      const popup = `<div class="popup-container">
        <div class="popup-description">
          ${logoHtml}
          <div class="popup-text-container">
            <p><strong class="popup-title">${s.nom}</strong></p>
            <ul class="popup-activity-list">
              ${s.activitesFormation.map(act => `<li class="popup-activity-list-item">${act}</li>`).join('')}
            </ul>
          </div>
        </div>
        <div class="popup-btn">
          <a class="readon" href="${s.url}" target="_blank">Voir la structure</a>
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

    // Formations orphelines
    const orphanFormations = new Map<string, FormationModel[]>();
    for (const f of adresse.formations || []) {
      const key = `${adresse.latitude}-${adresse.longitude}`;
      if (!orphanFormations.has(key)) orphanFormations.set(key, []);
      orphanFormations.get(key)!.push(f);
    }

    for (const formations of orphanFormations.values()) {
      const hasStructureSameAddress =
        (adresse.structures || []).some(struct =>
          (struct.formations || []).some(f =>
            f.adresses?.some(a => a.latitude === adresse.latitude && a.longitude === adresse.longitude)
          )
        ) ||
        (adresse.formations || []).some(f => f !== formations[0] && f.adresses?.some(a =>
          a.latitude === adresse.latitude && a.longitude === adresse.longitude
        ));

      const struct = formations[0].structure!;

      // Choix de l'icône de base selon place disponible
      let iconBase = formations.some(f => f.placeDisponible) ? 'marker_yellow' : 'marker_gray';
      if (hasStructureSameAddress) iconBase += '_rotated';
      const iconUrl = `/icons/${iconBase}.png`;

      const markerClass = hasStructureSameAddress
        ? 'marker-formation marker-formation-rotated'
        : 'marker-formation';

      const formationsHTML = `
        <ul class="popup-formation-list">
          ${formations.map(f => `
            <li>
              <button class="orphan-link formation-list ${!f.placeDisponible ? 'noDispo' : ''}" data-slug="${f.slug}">
                ${f.nom}
              </button>
            </li>
          `).join('')}
        </ul>
      `;

      const logoHtml = struct.logo
        ? `<div class="popup-img"><img src="${struct.logo}" alt="${struct.nom}" /></div>`
        : '';

      const popup = `<div class="popup-container">
        <div class="popup-description">
          ${logoHtml}
          <div class="popup-text-container">
            <p><strong class="popup-title">${struct.nom}</strong></p>
            <ul class="popup-activity-list">
              ${struct.activitesFormation.map(act => `<li class="popup-activity-list-item">${act}</li>`).join('')}
            </ul>
          </div>
        </div>
        <div>Formations de cette structure à cette adresse :</div>
        ${formationsHTML}
        <div class="popup-btn">
          <a class="readon" href="${struct.url}" target="_blank">Voir la structure</a>
        </div>
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

      for (const f of formations) {
        const key = `formation-${f.slug}-${adresse.latitude}-${adresse.longitude}`;
        markerRefs[key] = m;
      }
    }

    // Permanences
    for (const p of adresse.permanences || []) {
      const logoHtml = p.logo
        ? `<div class="popup-img"><img src="${p.logo}" alt="${p.nom}" /></div>`
        : '';

      const popup = `<div class="popup-container">
        <div class="popup-description">
          ${logoHtml}
          <div class="popup-text-container">
            <p><strong class="popup-title">${p.nom}</strong></p>
            <ul class="popup-activity-list">
              ${p.activitesCoordination.map(act => `<li class="popup-activity-list-item">${act}</li>`).join('')}
            </ul>
          </div>
        </div>
        <div class="popup-btn">
          <a class="readon" href="${p.urlCoordination}" target="_blank">Voir la permanence</a>
        </div>
      </div>`;

      const m = L.marker([latitude, longitude], {
        icon: L.icon({ iconUrl: '/icons/marker_black.png', iconSize: [41, 41], iconAnchor: [22, 0] }),
      }).bindPopup(popup);

      markers.addLayer(m);
      const key = `permanence-${p.slug}-${latitude}-${longitude}`;
      markerRefs[key] = m;
    }
  }
}

function bindFormationButtons(marker: L.Marker) {
  const container = marker.getPopup()?.getElement();
  if (!container) return;

  container.querySelectorAll<HTMLButtonElement>('.formation-link, .orphan-link').forEach(btn => {
    btn.onclick = null;
  });
}

onMounted(async () => {
  const slug = route.params.slug as string;

  if (route.name === 'DetailMapStructure') {
    adresses.value = await getAdressesByStructureSlug(slug);
  } else if (route.name === 'DetailMapPermanence') {
    adresses.value = await getAdressesByPermanenceSlug(slug);
  }

  initMap();
  addMarkers();
});
</script>

<template>
  <div ref="mapDetailRef" id="mapDetail"></div>
</template>

<style>
.marker-structure img, .marker-formation img {
  width: 41px;
  height: 41px;
  position: absolute;
}

.marker-structure-rotated img {
  width: 32px;
  height: 32px;
  left: 1.3em;
  top: 7px;
}

.marker-formation-rotated img {
  width: 32px;
  height: 32px;
  left: -1.3em;
  top: 7px;
}
</style>
