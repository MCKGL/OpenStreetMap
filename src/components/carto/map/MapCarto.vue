<script setup lang="ts">
import 'leaflet/dist/leaflet.css';
import L, {type MarkerOptions} from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type {AdresseModel} from "@/models/Adresse.model.ts";
import type {FormationModel} from "@/models/Formation.model.ts";
import {onMounted, onBeforeUnmount, ref, watch} from 'vue';
import {useRouter} from "vue-router";
import type { Router } from 'vue-router';

// Import des modèles pour éviter les erreurs de type
declare module 'leaflet' {
  interface MarkerOptions {
    customData?: {
      type: 'structure' | 'permanence';
      slug: string;
      structureSlug?: string;
    };
  }
}

type QueryParams = Record<string, string | undefined>;
const mapRef = ref<HTMLElement | null>(null);
let map: L.Map;
let markers: L.MarkerClusterGroup;
const router = useRouter();

const props = defineProps<{
  adresses?: AdresseModel[],
  filters?: string[];
}>();

/**
 * Initialise la carte Leaflet avec les tuiles OpenStreetMap.
 */
function initMap() {
  map = L.map(mapRef.value!, {minZoom: 5});

  map.createPane('highlightPane');
  map.getPane('highlightPane')!.style.zIndex = '650';

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  markers = L.markerClusterGroup({
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    iconCreateFunction: cluster => {
      const count = cluster.getChildCount();
      return L.divIcon({
        html: `<div class="cluster-icon">${count}</div>`,
        className: 'custom-cluster',
        iconSize: L.point(40, 40)
      });
    }
  });
  map.addLayer(markers);

  map.setView([48.684, 2.502], 9);
}

/**
 * Ajoute les marqueurs sur la carte en fonction des adresses fournies.
 */
function addMarkers() {
  if (!props.adresses) return;
  markers.clearLayers();

  for (const adresse of props.adresses) {
    const {latitude, longitude} = adresse;
    if (!latitude || !longitude) continue;

    // Structures
    for (const s of adresse.structures || []) {
      // Les formations de cette structure à cette adresse
      const atThisAddress = (s.formations || []).filter(f =>
        f.adresses.some(ad => ad.latitude === latitude && ad.longitude === longitude)
      );
      // Choix de l'icône : bleu par défaut, jaune si au moins une place dispo, gris sinon
      let iconUrl = '/icones/marker_blue.png';
      if (atThisAddress.length) {
        iconUrl = atThisAddress.some(f => f.placeDisponible)
          ? '/icones/marker_yellow.png'
          : '/icones/marker_gray.png';
      }

      // Construction du contenu du popup
      let popup = `<div>
    <strong>${s.nom} STRUCTURE</strong><br>
    ${s.activitesFormation.map(act => `<div>• ${act}</div>`).join('')}
  `;

      if (atThisAddress.length === 0) {
        popup += `<div style="margin-top:8px; font-style:italic;">
      Aucune formation renseignée à cette adresse
    </div>`;
      } else {
        popup += `<div style="margin-top:8px;"><strong>Formations de cette structure à cette adresse :</strong></div>
      <ul style="padding-left:16px; margin:4px 0;">
        ${atThisAddress.map(f =>
          `<li>
             <button class="formation-link formation-list" data-slug="${f.slug}">
               ${f.nom}
             </button>
           </li>`
        ).join('')}
      </ul>`;
      }
      popup += `</div>`;

      // Création du marqueur
      const m = L.marker([latitude, longitude], {
        icon: L.icon({iconUrl, iconSize: [41, 41], iconAnchor: [22, 0]}),
        customData: { type: 'structure', slug: s.slug,  structureSlug: s.slug}
      })
        .bindPopup(popup)
        .on('click', () => {
          const query = { ...router.currentRoute.value.query } as QueryParams;
          query.type = 'structure';
          query.slug = s.slug;
          query.latitude = latitude.toString();
          query.longitude = longitude.toString();
          delete query.structureSlug;
          router.replace({ query });
        })
        .on('popupopen', () => {
          // Rattache les handlers sur les boutons .formation-link
          const container = m.getPopup()!.getElement()!;
          container.querySelectorAll<HTMLButtonElement>('.formation-link').forEach(btn => {
            btn.addEventListener('click', () => {
              const slug = btn.dataset.slug!;
              router.replace({
                query: {
                  ...router.currentRoute.value.query,
                  type: 'formation',
                  slug,
                  structureSlug: s.slug,
                  latitude: latitude.toString(),
                  longitude: longitude.toString()
                }
              });
              m.closePopup();
            });
          });
        });
      markers.addLayer(m);
    }

    // Permanences
    for (const p of adresse.permanences || []) {
      // Construction du contenu du popup
      const popup = `<div>
    <strong>${p.nom} PERMANENCE</strong><br>
    <ul style="padding-left:16px; margin:4px 0;">
      ${p.activitesCoordination.map(act => `<li>${act}</li>`).join('')}
    </ul>
  </div>`;

      const m = L.marker([latitude, longitude], {
        icon: L.icon({
          iconUrl: '/icones/marker_black.png',
          iconSize: [41, 41],
          iconAnchor: [22, 0]
        }),
        customData: { type: 'permanence', slug: p.slug }
      }).bindPopup(popup)
        .on('click', () => {
          const query = { ...router.currentRoute.value.query } as QueryParams;
          query.type = 'permanence';
          query.slug = p.slug;
          query.latitude = latitude.toString();
          query.longitude = longitude.toString();
          delete query.structureSlug;
          router.replace({ query });
        });
      markers.addLayer(m);
    }


    // Formations orphelines (formations hors sa structure)
    const orphanMap = new Map<number, FormationModel[]>();
    for (const f of adresse.formations || []) {
      const sameAsStruct = f.structure?.adresses.some(a => a.latitude === latitude && a.longitude === longitude);
      const sameAsPerm = f.permanence?.adresses.some(a => a.latitude === latitude && a.longitude === longitude);
      if (!sameAsStruct && !sameAsPerm) {
        const key = f.structure?.id ?? f.id;
        if (!orphanMap.has(key)) orphanMap.set(key, []);
        orphanMap.get(key)!.push(f);
      }
    }

    // Création des marqueurs pour les formations orphelines
    for (const formations of orphanMap.values()) {
      // Récupération de la structure associée
      const struct = formations[0].structure!;
      const latitude = adresse.latitude, longitude = adresse.longitude;

      // Construction du contenu du popup
      const activitesHTML = struct.activitesFormation
        .map(act => `<li>${act}</li>`).join('');

      const formationsHTML = `
  <ul>
    ${formations.map(f => `
      <li>
        <button
          class="orphan-link formation-list"
          data-slug="${f.slug}">
          ${f.nom}
        </button>
      </li>
    `).join('')}
  </ul>
`;

      const popup = `
    <div>
      <strong>${struct.nom} FORMATION ORPH</strong>
      <ul style="padding-left:16px;margin:4px 0;">
        ${activitesHTML}
      </ul>
      <div style="margin-top:8px;font-weight:bold;">
        Formations de cette structure à cette adresse :
      </div>
      ${formationsHTML}
    </div>
  `;

      // Choix de l'icône : jaune si au moins une place dispo, gris sinon
      const iconUrl = formations.some(f => f.placeDisponible)
        ? '/icones/marker_yellow.png'
        : '/icones/marker_gray.png';

      // Création du marqueur
      const m = L.marker([latitude, longitude], {
        icon: L.icon({iconUrl, iconSize: [41, 41], iconAnchor: [22, 0]})
      }).bindPopup(popup);

      // S'il n'y a qu'une formation, on navigue au clic du marqueur
      if (formations.length === 1) {
        m.on('click', () => {
          const f = formations[0];
          const query = { ...router.currentRoute.value.query } as QueryParams;
          query.type = 'formation';
          query.slug = f.slug;
          query.latitude = latitude.toString();
          query.longitude = longitude.toString();
          delete query.structureSlug;
          router.replace({ query });
        });
      }

      // A l'ouverture du popup, rattache le click sur les boutons .orphan-link
      m.on('popupopen', () => {
        const container = m.getPopup()!.getElement()!;
        container.querySelectorAll<HTMLButtonElement>('.orphan-link').forEach(btn => {
          btn.addEventListener('click', () => {
            const slug = btn.dataset.slug!;
            const query = { ...router.currentRoute.value.query } as QueryParams;
            query.type = 'formation';
            query.slug = slug
            query.latitude = latitude.toString();
            query.longitude = longitude.toString();
            delete query.structureSlug;
            router.replace({ query });
            m.closePopup();
          });
        });
      });
      markers.addLayer(m);
    }
  }

  // recentrage automatique
  const layers = markers.getLayers() as L.Marker[];
  if (layers.length) {
    const fg = L.featureGroup(layers);
    map.fitBounds(fg.getBounds(), {padding: [50, 50]});
  }
}

/**
 * Focalise la carte sur le marqueur cible si les paramètres de la route sont présents.
 * @param map La carte Leaflet
 * @param markers Le groupe de marqueurs
 * @param router Le routeur Vue
 */
function focusOnTargetMarker(map: L.Map, markers: L.MarkerClusterGroup, router: Router) {
  const { latitude, longitude, type, slug, structureSlug } = router.currentRoute.value.query;

  if (!(latitude && longitude && type && slug)) return;

  const lat = parseFloat(latitude as string);
  const lng = parseFloat(longitude as string);
  const latLngStr = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const layers = markers.getLayers() as L.Marker[];

  const candidates = layers.filter(m => {
    const pos = m.getLatLng();
    return `${pos.lat.toFixed(5)},${pos.lng.toFixed(5)}` === latLngStr;
  });

  let target: L.Marker | undefined;

  for (const m of candidates) {
    const customData = (m.options as MarkerOptions).customData;

    if (type === 'structure') {
      if (customData?.type === 'structure' && customData?.slug === slug) {
        target = m;
        break;
      }
    } else if (type === 'permanence') {
      if (customData?.type === 'permanence' && customData?.slug === slug) {
        target = m;
        break;
      }
    } else if (type === 'formation') {
      if (structureSlug) {
        if (customData?.type === 'structure' && customData?.structureSlug === structureSlug) {
          target = m;
          break;
        }
      } else {
        // formations orphelines : pas besoin de customData, chercher dans popup
        const popup = m.getPopup()?.getContent() as string;
        if (popup && popup.includes(slug as string)) {
          target = m;
          break;
        }
      }
    }
  }

  if (target) {
    const latlng = target.getLatLng();
    // Centrer la carte sur le marqueur
    map.setView(latlng, map.getZoom(), { animate: true });
    // Eclater le cluster si nécessaire
    markers.zoomToShowLayer(target, () => {
      map.setView(latlng, 20, { animate: true });
      target?.openPopup();
    });
  }
}

/**
 * Ajoute la légende au coin inférieur droit de la carte.
 */
function addLegend() {
  const legend = (L.control as unknown as (options: L.ControlOptions) => L.Control)({
    position: 'bottomright'
  });

  legend.onAdd = () => {
    const c = L.DomUtil.create('div', 'legend-container');
    c.innerHTML = `
      <button class="legend-toggle" aria-label="Afficher la légende">Légende</button>
      <div class="legend-content">
        <h4>Légende</h4>
        <div><img class="ico-legend" src="/icones/marker_blue.png" alt="marqueur rouge structures"> Structures</div>
        <div><img class="ico-legend" src="/icones/marker_black.png" alt="marqueur noir permanences"> Permanences</div>
        <div><img class="ico-legend" src="/icones/marker_yellow.png" alt="marqueur bleu formations"> Formations avec place disponible</div>
        <div><img class="ico-legend" src="/icones/marker_gray.png" alt="marqueur bleu formations"> Formations sans place disponible</div>
      </div>
    `;
    const btn = c.querySelector<HTMLButtonElement>('.legend-toggle')!;
    btn.onclick = () => {
      const isOpen = c.classList.toggle('open');
      btn.textContent = isOpen ? '✕' : 'Légende';
    };
    return c;
  };
  legend.addTo(map);
}

/**
 * Ajoute un bouton pour recentrer la carte sur l'Île-de-France et reset les paramètres d'URL
 * typ, slug, latitude, longitude.
 */
function addRecenterButton() {
  const ileDeFranceBounds: L.LatLngBounds = L.latLngBounds([48.0, 1.6], [49.1, 3.6]);

  const ctrl = (L.control as unknown as (options: L.ControlOptions) => L.Control)({
    position: 'topright'
  });

  ctrl.onAdd = () => {
    const btn = L.DomUtil.create('button', 'recenter-btn');
    btn.title = 'Recentrer sur Île-de-France';
    btn.innerHTML = '📍';

    L.DomEvent.disableClickPropagation(btn);

    btn.onclick = () => {
      map.closePopup();
      map.fitBounds(ileDeFranceBounds, { animate: true });

      // Reset des paramètres d'URL slug, type, latitude, longitude
      const query = { ...router.currentRoute.value.query };
      delete query.slug;
      delete query.type;
      delete query.structureSlug;
      delete query.latitude;
      delete query.longitude;

      router.replace({ query });
    };
    return btn;
  };
  ctrl.addTo(map);
}

function handleResize() {
  map?.invalidateSize();
}

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
});

onMounted(() => {
  window.addEventListener('resize', handleResize);
  initMap();
  addMarkers();
  addLegend();
  addRecenterButton();
  focusOnTargetMarker(map, markers, router);
});

watch(
  () => [props.adresses, props.filters],
  () => {
    markers.clearLayers();
    addMarkers();
  },
  {deep: true}
);

watch(
  () => router.currentRoute.value.query,
  () => {
    focusOnTargetMarker(map, markers, router);
  }
);
</script>

<template>
  <div ref="mapRef" id="map"></div>
</template>

<style>

#map {
  height: 100%;
}

.legend-toggle {
  display: none;
}

.formation-list {
  border: none;
  background: none;
  text-align: inherit;
  color: #0F7ECB;
  cursor:pointer;
}

.formation-list:hover {
  text-decoration: underline;
}

.leaflet-container {
  width: 100%;
  height: 100%;
}

/* Style custom pour les clusters #0F7ECB */
.custom-cluster {
  background: rgba(15, 126, 203, 0.6);
  border-radius: 50%;
  color: white;
  text-align: center;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.cluster-icon {
  line-height: 36px;
}

.legend-container {
  position: relative;
  transition: all 0.3s ease;
}

.legend-container h4 {
  margin-top: 0;
}

.legend-content {
  display: block;
  background: white;
  padding: 10px;
  border-radius: 5px;
  line-height: 1.4;
  font-size: 14px;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
}

.ico-legend {
  width: 30px;
  height: 30px;
}

@media (max-width: 810px) {
  #map {
    height: 100%;
  }

  .legend-container .legend-content {
    display: none;
  }

  .legend-container.open .legend-content {
    display: block;
  }

  .legend-toggle {
    display: block;
    background: white;
    border: none;
    border-radius: 5px 5px 0 0;
    padding: 5px 10px;
    cursor: pointer;
    position: absolute;
    bottom: 100%;
    right: 0;
    transform: translateY(50%);
  }

  .leaflet-control-container .leaflet-top .recenter-btn {
    margin-top: 50px;
  }
}
</style>
