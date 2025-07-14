<script setup lang="ts">
import 'leaflet/dist/leaflet.css';
import L, {type MarkerOptions} from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import type {AdresseModel} from "@/models/Adresse.model.ts";
import type {FormationModel} from "@/models/Formation.model.ts";
import {onMounted, ref, watch, computed, onBeforeUnmount, nextTick} from 'vue';
import {useRoute, useRouter} from "vue-router";
import type {Router} from 'vue-router';
import {useParsedFilters} from "@/composables/useParsedFilters.ts";
import {adressesFiltered, hasAdvancedFilters} from "@/utils/filters.ts";

// Import des modèles pour éviter les erreurs de type
declare module 'leaflet' {
  interface MarkerOptions {
    customData?: {
      type: 'structure' | 'permanence' | 'formation';
      slug: string;
      structureSlug?: string;
    };
  }
}

type QueryParams = Record<string, string | undefined>;
const mapRef = ref<HTMLElement | null>(null);
const markerRefs: Record<string, L.Marker> = {};
let map: L.Map;
let markers: L.MarkerClusterGroup;
const router = useRouter();
const route = useRoute();
let uniqueCloneMarker: L.Marker | null = null;
let highlightLayer: L.LayerGroup | null = null;
let infoMulti: L.Control | null = null;
const filters = useParsedFilters();

const props = defineProps<{
  adresses: AdresseModel[],
}>();

const filteredAdresses = computed(() =>
  adressesFiltered(props.adresses, filters.value)
);

/**
 * Initialise la carte Leaflet avec les tuiles OpenStreetMap.
 */
function initMap() {
  map = L.map(mapRef.value!, {minZoom: 5});

  map.createPane('highlightPane');
  map.getPane('highlightPane')!.style.zIndex = '650';
  map.getPane('highlightPane')!.style.pointerEvents = 'auto';

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

  for (const adresse of filteredAdresses.value) {
    const {latitude, longitude} = adresse;
    if (!latitude || !longitude) continue;

    const hasAdvFilters = hasAdvancedFilters(filters.value);

    // si on n'a pas de filtres avancés, on affiche les structures et formations 'orphelines' (c'est-à-dire pas à la même adresse que leurs structures)
    if (!hasAdvFilters) {
      // Structures
      for (const s of adresse.structures || []) {
        // Les formations de cette structure à cette adresse
        const atThisAddress = (s.formations || []).filter(f =>
          f.adresses.some(ad => ad.latitude === latitude && ad.longitude === longitude)
        );
        // Choix de l'icône : bleu par défaut, jaune si au moins une place dispo, gris sinon
        let iconUrl = '/icons/marker_blue.png';
        if (atThisAddress.length) {
          iconUrl = atThisAddress.some(f => f.placeDisponible)
            ? '/icons/marker_yellow.png'
            : '/icons/marker_gray.png';
        }

        // Construction du contenu du popup
        const logoHtml = s.logo
          ? `<div class="popup-img"><img src="${s.logo}" alt="${s.nom}" /></div>`
          : '';

        let popup = `<div class="popup-container">
    <div class="popup-description">
      ${logoHtml}
      <div class="popup-text-container">
          <p><strong class="popup-title">${s.nom}</strong></p>
          <ul class="popup-activity-list">
              ${s.activitesFormation.map(act => `<li class="popup-activity-list-item">${act}</li>`).join('')}
          </ul>
      </div>
    </div>`;

        if (atThisAddress.length === 0) {
          popup += `<div class="popup-formation-list-none">
                        Aucune formation renseignée à cette adresse
                    </div>`;
        } else {
          popup += `<div><strong>Formations de cette structure à cette adresse :</strong></div>
                    <ul class="popup-formation-list">
                        ${atThisAddress.map(f =>
            `<li>
                         <button class="formation-link formation-list" data-slug="${f.slug}">
                           ${f.nom}
                         </button>
                       </li>`
          ).join('')}
                    </ul>`;
        }

        popup += `<div class="popup-btn">
                    <a
                      class="readon"
                      href="${s.url}"
                      target="_blank"
                    >
                      Voir la structure
                    </a>
                </div>
            </div>`;

        // Création du marqueur
        const m = L.marker([latitude, longitude], {
          icon: L.icon({iconUrl, iconSize: [41, 41], iconAnchor: [22, 0]}),
          customData: {type: 'structure', slug: s.slug, structureSlug: s.slug}
        })
          .bindPopup(popup)
          .on('click', () => {
            const query = {...router.currentRoute.value.query} as QueryParams;
            query.type = 'structure';
            query.slug = s.slug;
            query.latitude = latitude.toString();
            query.longitude = longitude.toString();
            delete query.structureSlug;
            router.replace({query});
          })
          .on('popupopen', () => bindFormationButtons(m, s.slug));
        markers.addLayer(m);
        const key = `structure-${s.slug}-${latitude}-${longitude}`;
        for (const f of atThisAddress) {
          const fkey = `formation-${f.slug}-${latitude}-${longitude}`;
          markerRefs[fkey] = m;
        }
        markerRefs[key] = m;
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
        const formationsHTML = `
  <ul class="popup-formation-list">
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

        const logoHtml = struct.logo
          ? `<div class="popup-img"><img src="${struct.logo}" alt="${struct.nom}" /></div>`
          : '';

        const popup = `
    <div class="popup-container">
    <div class="popup-description">
      ${logoHtml}
      <div class="popup-text-container">
          <p><strong class="popup-title">${struct.nom}</strong></p>
          <ul class="popup-activity-list">
              ${struct.activitesFormation.map(act => `<li class="popup-activity-list-item">${act}</li>`).join('')}
          </ul>
      </div>
    </div>
      <div>
        Formations de cette structure à cette adresse :
      </div>
      ${formationsHTML}
    </div>

    <div class="popup-btn">
      <a
        class="readon"
        href="${struct.url}"
        target="_blank"
      >
        Voir la structure
      </a>
    </div>
  `;

        // Choix de l'icône : jaune si au moins une place dispo, gris sinon
        const iconUrl = formations.some(f => f.placeDisponible)
          ? '/icons/marker_yellow.png'
          : '/icons/marker_gray.png';

        // Création du marqueur
        const m = L.marker([latitude, longitude], {
          icon: L.icon({iconUrl, iconSize: [41, 41], iconAnchor: [22, 0]})
        }).bindPopup(popup);

        // S'il n'y a qu'une formation, on navigue au clic du marqueur
        if (formations.length === 1) {
          m.on('click', () => {
            const f = formations[0];
            const query = {...router.currentRoute.value.query} as QueryParams;
            query.type = 'formation';
            query.slug = f.slug;
            query.latitude = latitude.toString();
            query.longitude = longitude.toString();
            delete query.structureSlug;
            router.replace({query});
          });
        }

        // A l'ouverture du popup, rattache le click sur les boutons .orphan-link
        m.on('popupopen', () => {
          const container = m.getPopup()!.getElement()!;
          container.querySelectorAll<HTMLButtonElement>('.orphan-link').forEach(btn => {
            btn.addEventListener('click', () => {
              const slug = btn.dataset.slug!;
              const query = {...router.currentRoute.value.query} as QueryParams;
              query.type = 'formation';
              query.slug = slug
              query.latitude = latitude.toString();
              query.longitude = longitude.toString();
              delete query.structureSlug;
              router.replace({query});
              m.closePopup();
            });
          });
        });
        markers.addLayer(m);
        for (const f of formations) {
          const key = `formation-${f.slug}-${latitude}-${longitude}`;
          markerRefs[key] = m;
        }
      }
    }

    // Si on a des filtres avancés, on n'affiche que les formations, mais pas les structures
    if (hasAdvFilters) {
      // Map pour grouper les formations à la même adresse ET ayant la même structure
      const grouped = new Map<string, FormationModel[]>();

      for (const f of adresse.formations || []) {
        if (!f.structure) continue;
        const key = `${f.structure.id}-${latitude}-${longitude}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(f);
      }

      // Création des marqueurs par groupe (même structure, même adresse)
      for (const [key, formations] of grouped.entries()) {
        const struct = formations[0].structure!;

        // Construction du contenu du popup
        const formationsHTML = `
  <ul class="popup-formation-list">
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

        const logoHtml = struct.logo
          ? `<div class="popup-img"><img src="${struct.logo}" alt="${struct.nom}" /></div>`
          : '';

        const popup = `
    <div class="popup-container">
    <div class="popup-description">
      ${logoHtml}
      <div class="popup-text-container">
          <p><strong class="popup-title">${struct.nom}</strong></p>
          <ul class="popup-activity-list">
              ${struct.activitesFormation.map(act => `<li class="popup-activity-list-item">${act}</li>`).join('')}
          </ul>
      </div>
    </div>
      <div>
        Formations de cette structure à cette adresse :
      </div>
      ${formationsHTML}
    </div>
    <div class="popup-btn">
      <a
        class="readon"
        href="${struct.url}"
        target="_blank"
      >
        Voir la structure
      </a>
    </div>
  `;

        const hasPlaces = formations.some(f => f.placeDisponible);
        const iconUrl = hasPlaces
          ? '/icons/marker_yellow.png'
          : '/icons/marker_gray.png';

        // Création du marqueur
        const m = L.marker([latitude, longitude], {
          icon: L.icon({iconUrl, iconSize: [41, 41], iconAnchor: [22, 0]})
        }).bindPopup(popup);

        // Si une seule formation : clic = navigation
        if (formations.length === 1) {
          const f = formations[0];
          m.on('click', () => {
            const query = {...router.currentRoute.value.query} as QueryParams;
            query.type = 'formation';
            query.slug = f.slug;
            query.latitude = latitude.toString();
            query.longitude = longitude.toString();
            delete query.structureSlug;
            router.replace({query});
          });
        }

        // Sinon : clics dans popup
        m.on('popupopen', () => {
          const container = m.getPopup()!.getElement()!;
          container.querySelectorAll<HTMLButtonElement>('.formation-link').forEach(btn => {
            btn.addEventListener('click', () => {
              const slug = btn.dataset.slug!;
              const query = {...router.currentRoute.value.query} as QueryParams;
              query.type = 'formation';
              query.slug = slug;
              query.latitude = latitude.toString();
              query.longitude = longitude.toString();
              delete query.structureSlug;
              router.replace({query});
              m.closePopup();
            });
          });
        });

        markers.addLayer(m);

        for (const f of formations) {
          const key = `formation-${f.slug}-${latitude}-${longitude}`;
          markerRefs[key] = m;
        }
      }
    }

    // Permanences
    for (const p of adresse.permanences || []) {
      // Construction du contenu du popup
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
      <a
        class="readon"
        href="${p.urlCoordination}"
        target="_blank"
      >
        Voir la permanence
      </a>
    </div>
  </div>`;

      const m = L.marker([latitude, longitude], {
        icon: L.icon({
          iconUrl: '/icons/marker_black.png',
          iconSize: [41, 41],
          iconAnchor: [22, 0]
        }),
        customData: {type: 'permanence', slug: p.slug}
      }).bindPopup(popup)
        .on('click', () => {
          const query = {...router.currentRoute.value.query} as QueryParams;
          query.type = 'permanence';
          query.slug = p.slug;
          query.latitude = latitude.toString();
          query.longitude = longitude.toString();
          delete query.structureSlug;
          router.replace({query});
        });
      markers.addLayer(m);
      const key = `permanence-${p.slug}-${latitude}-${longitude}`;
      markerRefs[key] = m;
    }

  }

  const {latitude, longitude} = route.query;
  const hasLatLngInUrl = latitude !== undefined && longitude !== undefined;
  // recentrage automatique
  const layers = markers.getLayers() as L.Marker[];
  if (layers.length && hasLatLngInUrl) {
    const fg = L.featureGroup(layers);
    map.fitBounds(fg.getBounds(), {padding: [50, 50]});
  }
}

/**
 * Externaliser la logique de clic sur les boutons de formation dans le popup d'un marqueur.
 * Permet de 'forcer' le clic sur les boutons de formation dans le popup d'un marqueur structure
 * sans quoi le listener de clic ne serait pas attaché à chaque fois...
 * @param marker Le marqueur Leaflet
 * @param slugStructure Le slug de la structure associée (optionnel)
 */
function bindFormationButtons(marker: L.Marker, slugStructure?: string) {
  const container = marker.getPopup()?.getElement();
  if (!container) return;
  container
    .querySelectorAll<HTMLButtonElement>('.formation-link')
    .forEach(btn => {
      btn.addEventListener('click', () => {
        const slug = btn.dataset.slug!;
        router.replace({
          query: {
            ...router.currentRoute.value.query,
            type: 'formation',
            slug,
            structureSlug: slugStructure,
            latitude: marker.getLatLng().lat.toString(),
            longitude: marker.getLatLng().lng.toString()
          }
        });
        marker.closePopup();
      });
    });
}

/**
 * Met en évidence un marqueur cible en fonction des paramètres de la route.
 * Si un marqueur correspondant est trouvé, il est cloné pour éviter les problèmes de cluster et
 * de zoom.
 */
function focusOnTargetMarker(map: L.Map, markers: L.MarkerClusterGroup, router: Router) {
  const {latitude, longitude, type, slug, structureSlug} = router.currentRoute.value.query;
  if (!(latitude && longitude && type && slug)) return;

  clearTargetClone()

  if (uniqueCloneMarker) {
    map.removeLayer(uniqueCloneMarker);
    uniqueCloneMarker = null;
  }

  const lat = parseFloat(latitude as string);
  const lng = parseFloat(longitude as string);
  const latLngStr = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  const layers = markers.getLayers() as L.Marker[];

  let target: L.Marker | undefined;

  const candidates = layers.filter(m => {
    const pos = m.getLatLng();
    return `${pos.lat.toFixed(5)},${pos.lng.toFixed(5)}` === latLngStr;
  });

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
        const popup = m.getPopup()?.getContent() as string;
        if (popup && popup.includes(slug as string)) {
          target = m;
          break;
        }
      }
    }
  }

  if (!target) return;

  const latlng = target.getLatLng();

  // Créer un clone temporaire pour contourner les clusters et permettre un zoom plus large
  const origIcon = target.getIcon() as L.Icon;
  const origUrl = origIcon.options.iconUrl as string;
  const cloneUrl = origUrl.replace(/(marker_[a-z]+)\.png$/, '$1_clone.png');

  const cloneIcon = L.icon({
    ...origIcon.options,
    iconUrl: cloneUrl
  });

  uniqueCloneMarker = L.marker(latlng, {
    icon: cloneIcon,
    pane: 'highlightPane'
  }).addTo(map);

  const popupContent = target.getPopup()?.getContent();
  if (popupContent) {
    uniqueCloneMarker.bindPopup(popupContent).openPopup();
  }

  bindFormationButtons(uniqueCloneMarker, structureSlug as string);

  map.setView(latlng, 15, {animate: true});
}

/**
 * Supprime la couche de surbrillance et donc les clones des marqueurs.
 */
function clearHighlight() {
  if (highlightLayer) {
    highlightLayer.remove();
    highlightLayer = null;
  }
  if (infoMulti) {
    infoMulti.remove();
    infoMulti = null;
  }
}

/**
 * Supprime le marqueur cloné unique utilisé pour mettre en évidence un marqueur cible.
 */
function clearTargetClone() {
  if (uniqueCloneMarker) {
    map.removeLayer(uniqueCloneMarker);
    uniqueCloneMarker = null;
  }
}

/**
 * Met en évidence les points multiples sur la carte en fonction des paramètres de la route.
 * Si plusieurs adresses correspondent au type et au slug (et qu'il n'y a pas de lat et lng dans l'url),
 * les marqueurs sont clonés et affichés.
 */
function highlightMultiPoints({map, markers, markerRefs, adresses, route}: {
  map: L.Map,
  markers: L.MarkerClusterGroup,
  markerRefs: Record<string, L.Marker>,
  adresses: AdresseModel[],
  route: ReturnType<typeof useRoute>
}) {

  const {type, slug, latitude, longitude} = route.query;

  if (!type || !slug || latitude || longitude) {
    clearHighlight();
    return;
  }

  // Filtrage des adresses correspondantes
  const targetAdresses = adresses.filter(a => {
    const entities = type === 'structure'
      ? a.structures
      : type === 'permanence'
        ? a.permanences
        : a.formations;

    return entities?.some(e => e.slug === slug);
  });

  if (!targetAdresses.length) return;

  clearHighlight();
  highlightLayer = L.layerGroup().addTo(map);
  const clones: L.Marker[] = [];

  for (const a of targetAdresses) {
    const key = `${type}-${slug}-${a.latitude}-${a.longitude}`;
    const original = markerRefs[key];
    if (!original) continue;

    const origIcon = original.getIcon() as L.Icon;
    const origUrl = origIcon.options.iconUrl as string;
    const cloneUrl = origUrl.replace(/(marker_[a-z]+)\.png$/, '$1_clone.png');

    const cloneIcon = L.icon({
      ...origIcon.options,
      iconUrl: cloneUrl
    });

    const clone = L.marker(original.getLatLng(), {
      icon: cloneIcon,
      pane: 'highlightPane'
    })
      .on('click', () => {
        clearHighlight();
        markers.zoomToShowLayer(original, () => {
          map.setView(original.getLatLng(), Math.max(map.getZoom(), 16), {animate: true});
          original.openPopup();
        });
      });

    highlightLayer.addLayer(clone);
    clones.push(clone);
  }

  if (clones.length > 0) {
    clones[0].openPopup();
  }

  const bounds = L.latLngBounds(
    targetAdresses.map(a => [a.latitude, a.longitude] as [number, number])
  );
  map.fitBounds(bounds, {padding: [50, 50]});

  const count = targetAdresses.length;
  const newInfo = (L.control as unknown as (opts: L.ControlOptions) => L.Control)({
    position: 'bottomleft'
  });
  newInfo.onAdd = (): HTMLElement => {
    const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    div.style.padding = '6px 10px';
    div.style.background = 'rgba(255,255,255,0.9)';
    div.style.fontSize = '13px';
    div.innerHTML = `⚠️ Il existe ${count} adresse${count > 1 ? 's' : ''} pour cette ${type}`;
    return div;
  };
  infoMulti = newInfo;
  newInfo.addTo(map);
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
        <div><img class="ico-legend" src="/icons/marker_blue.png" alt="marqueur rouge structures"> Structures</div>
        <div><img class="ico-legend" src="/icons/marker_black.png" alt="marqueur noir permanences"> Permanences</div>
        <div><img class="ico-legend" src="/icons/marker_yellow.png" alt="marqueur bleu formations"> Formations avec place disponible</div>
        <div><img class="ico-legend" src="/icons/marker_gray.png" alt="marqueur bleu formations"> Formations sans place disponible</div>
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
      map.fitBounds(ileDeFranceBounds, {animate: true});

      // Reset des paramètres d'URL slug, type, latitude, longitude
      const query = {...router.currentRoute.value.query};
      delete query.slug;
      delete query.type;
      delete query.structureSlug;
      delete query.latitude;
      delete query.longitude;

      router.replace({query});
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
  highlightMultiPoints({
    map,
    markers,
    markerRefs,
    adresses: props.adresses ?? [],
    route
  });
});

watch(
  () => [props.adresses],
  () => {
    markers.clearLayers();
    addMarkers();
    nextTick(() => {
      map.invalidateSize();
    });
  },
  {deep: true}
);

watch(
  () => router.currentRoute.value.query,
  () => {
    markers.clearLayers();
    addMarkers();
    nextTick(() => {
      map.invalidateSize();
    });
    focusOnTargetMarker(map, markers, router);
    highlightMultiPoints({
      map,
      markers,
      markerRefs,
      adresses: props.adresses ?? [],
      route
    });
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
  cursor: pointer;
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
  display: none;
  background: white;
  padding: 10px;
  border-radius: 5px;
  line-height: 1.4;
  font-size: 14px;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.2);
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

.ico-legend {
  width: 30px;
  height: 30px;
}

.popup-activity-list {
  padding: 10px;
}

.popup-activity-list-item {
  list-style-type: circle;
}

.popup-title {
  font-size: 13px;
  margin-top: 20px;
  font-weight: 600;
}

.popup-container {
  display: flex;
  flex-direction: column;
}

.popup-img img {
  object-fit: contain;
  width: 60px;
  height: 60px;
}

.popup-text-container p {
  text-align: center;
}

.popup-description {
  display: flex;
}

.popup-btn {
  justify-content: center;
  display: flex;
}

.popup-formation-list {
  padding: 0 0 0 10px;
}

.popup-formation-list-none {
  margin: 10px;
  font-style: italic;
}

.leaflet-popup-content .popup-btn a {
  color: #fff;
}

@media (max-width: 810px) {
  #map {
    height: 100%;
  }

  .leaflet-control-container .leaflet-top .recenter-btn {
    margin-top: 50px;
  }
}
</style>
