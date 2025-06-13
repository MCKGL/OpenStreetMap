<script setup lang="ts">
import {ref, onMounted, watch, computed} from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import {StructureModel} from '@/models/Structure.model.ts';
import {PermanenceModel} from '@/models/Permanence.model.ts';
import type {FormationModel} from "@/models/Formation.model.ts";
import {useRouter} from "vue-router";

const props = defineProps<{
  structures?: StructureModel[];
  permanences?: PermanenceModel[];
  objFocus?: { type: 'structure' | 'permanence' | 'formation'; slug: string };
  filters?: string[];
}>();

const emit = defineEmits<{
  (e: 'reset-focus'): void;
  (e: 'focus-from-map', payload: { type: 'structure' | 'permanence' | 'formation'; slug: string }): void;
}>();

type FormationWithOrphans = {
  formation: FormationModel;
  structure: StructureModel;
  orphanAddrs: { latitude: number; longitude: number; ville: string; codePostal: string }[];
};

const formationToGroupKey: Record<string, string> = {};
const formationsWithOrphans = computed<FormationWithOrphans[]>(() => {
  return props.structures?.flatMap(structure =>
    (structure.formations || [])
      .map(frm => ({
        structure,
        formation: frm,
        orphanAddrs: frm.adresses.filter(fa =>
          !structure.adresses.some(sa =>
            sa.latitude === fa.latitude && sa.longitude === fa.longitude
          )
        )
      }))
      .filter(x => x.orphanAddrs.length > 0)
  ) || [];
});

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map;
let markers: L.MarkerClusterGroup;
const markerRefs: Record<string, L.Marker> = {};
let ileDeFranceBounds: L.LatLngBounds;
const router = useRouter();
let highlightLayer: L.LayerGroup | null = null;
let infoMulti: L.Control | null = null;
let skipHighlight = false;
let lastClickedMarker: L.Marker | null = null;

defineExpose({
  resizeMap: () => {
    map?.invalidateSize();
  }
});

function initMap() {
  map = L.map(mapContainer.value!, {minZoom: 5});

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

  ileDeFranceBounds = L.latLngBounds([48.0, 1.6], [49.1, 3.6]);

  if (props.objFocus) {
    const {type, slug} = props.objFocus;
    if (type === 'structure') {
      const s = props.structures?.find(s => s.slug === slug);
      if (s) {
        const bounds = L.latLngBounds(s.adresses.map(a => [a.latitude, a.longitude] as [number, number]));
        map.fitBounds(bounds, {padding: [50, 50]});
        return;
      }
    } else if (type === 'permanence') {
      const p = props.permanences?.find(p => p.slug === slug);
      if (p) {
        const bounds = L.latLngBounds(p.adresses.map(a => [a.latitude, a.longitude] as [number, number]));
        map.fitBounds(bounds, {padding: [50, 50]});
        return;
      }
    }
  }

  if (props.structures?.length === 1 && props.structures[0].adresses.length) {
    const bounds = L.latLngBounds(
      props.structures[0].adresses.map(a => [a.latitude, a.longitude] as [number, number])
    );
    map.fitBounds(bounds, {padding: [50, 50]});
    return;
  }

  map.setView([48.684, 2.502], 9);
}

function uniqueCoords<T extends { latitude: number; longitude: number }>(addrs: T[]): T[] {
  const seen = new Set<string>();
  return addrs.filter(a => {
    const key = `${a.latitude},${a.longitude}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function addMarkers() {

  if (props.structures) {
    for (const s of props.structures) {
      const adressesUniques = uniqueCoords(s.adresses);
      for (const a of adressesUniques) {
        const key = `structure-${s.slug}-${a.latitude}-${a.longitude}`;
        const formationsAtThisAddress = (s.formations || []).filter(f =>
          f.adresses.some(fa =>
            fa.latitude === a.latitude && fa.longitude === a.longitude
          )
        );

        let iconUrl = '/icones/marker_blue.png';
        if (formationsAtThisAddress.length) {
          const hasPlace = formationsAtThisAddress.some(f => f.placeDisponible);
          iconUrl = hasPlace
            ? '/icones/marker_yellow.png'
            : '/icones/marker_gray.png';
        }

        const container = document.createElement('div');
        const nomStructure = document.createElement('strong');
        nomStructure.textContent = s.nom;
        container.appendChild(nomStructure);

        const label = document.createElement('div');
        if (formationsAtThisAddress.length) {
          label.textContent = 'Formations à cette adresse :';
          label.style.marginTop = '8px';
          container.appendChild(label);

          const list = document.createElement('ul');
          list.style.paddingLeft = '16px';

          for (const f of formationsAtThisAddress) {
            const li = document.createElement('li');
            const link = document.createElement('button');
            link.type = 'button';
            link.textContent = `${f.nom}${f.placeDisponible ? ' (places disponibles)' : ' (pas de places)'}`;
            link.style.background = 'none';
            link.style.border = 'none';
            link.style.padding = '0';
            link.style.margin = '4px 0';
            if (f.placeDisponible) {
              link.style.color = '#007BFF';
              link.style.cursor = 'pointer';
              link.onclick = () => emit('focus-from-map', { type: 'formation', slug: f.slug });
            } else {
              link.style.color = 'gray';
              link.style.cursor = 'default';
              link.disabled = true;
            }
            li.appendChild(link);
            list.appendChild(li);
          }

          container.appendChild(list);
        } else {
          label.textContent = 'Pas de formation à cette adresse';
          label.style.marginTop = '8px';
          label.style.fontStyle = 'italic';
          container.appendChild(label);
        }

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'Voir la structure';
        btn.style.marginTop = '10px';
        btn.style.display = 'block';
        btn.onclick = () => router.push(`/${s.slug}`);
        container.appendChild(btn);

        const m = L.marker([a.latitude, a.longitude], {
          icon: L.icon({
            iconUrl,
            iconSize: [41, 41],
            iconAnchor: [22, 0],
            className: 'marker-structure'
          })
        }).bindPopup(container);
        m.on('click', () => {
          skipHighlight = true;
          lastClickedMarker = m;
          emit('focus-from-map', { type: 'structure', slug: s.slug });
        });
        markers.addLayer(m);
        markerRefs[key] = m;
      }
    }
  }

  if (props.permanences) {
    for (const p of props.permanences) {
      const adressesUniques = uniqueCoords(p.adresses);
      for (const a of adressesUniques) {
        const key = `permanence-${p.slug}-${a.latitude}-${a.longitude}`;
        const m = L.marker([a.latitude, a.longitude], {
          icon: L.icon({
            iconUrl: '/icones/marker_black.png',
            iconSize: [41, 41], iconAnchor: [22, 0], className: 'marker-permanence'
          })
        }).bindPopup(`<strong>${p.nom}</strong><br>${a.ville} (${a.codePostal})`);
        m.on('click', () => {
          skipHighlight = true;
          lastClickedMarker = m;
          emit('focus-from-map', { type: 'permanence', slug: p.slug });
        });
        markers.addLayer(m);
        markerRefs[key] = m;
      }
    }
  }

  const groupedFormations = new Map<string, {
    structure: StructureModel,
    adresse: { latitude: number, longitude: number, ville: string, codePostal: string },
    formations: FormationModel[]
  }>();

  for (const { structure, formation, orphanAddrs } of formationsWithOrphans.value) {
    for (const addr of orphanAddrs) {
      const key = `${structure.slug}-${addr.latitude}-${addr.longitude}`;
      if (!groupedFormations.has(key)) {
        groupedFormations.set(key, {
          structure,
          adresse: addr,
          formations: []
        });
      }
      groupedFormations.get(key)!.formations.push(formation);
    }
  }

  for (const [key, { structure, adresse, formations }] of groupedFormations.entries()) {
    const hasPlace = formations.some(f => f.placeDisponible);
    const iconUrl = hasPlace ? '/icones/marker_yellow.png' : '/icones/marker_gray.png';

    const container = document.createElement('div');
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    const nomStructure = document.createElement('strong');
    nomStructure.textContent = structure.nom;
    header.appendChild(nomStructure);
    const focusIcon = document.createElement('img');
    focusIcon.src = '/icones/focus-icon.svg';
    focusIcon.style.width = '16px';
    focusIcon.style.marginLeft = '8px';
    focusIcon.onclick = () => emit('focus-from-map', { type: 'structure', slug: structure.slug });
    header.appendChild(focusIcon);
    container.appendChild(header);

    const label = document.createElement('div');
    label.textContent = 'Formations à cette adresse :';
    label.style.marginTop = '8px';
    container.appendChild(label);

    const list = document.createElement('ul');
    list.style.paddingLeft = '16px';
    for (const f of formations) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = `${f.nom}${f.placeDisponible ? ' (places disponibles)' : ' (pas de places)'}`;
      btn.style.background = 'none';
      btn.style.border = 'none';
      btn.style.padding = '0';
      btn.style.margin = '4px 0';
      if (f.placeDisponible) {
        btn.style.color = '#007BFF';
        btn.style.cursor = 'pointer';
        btn.onclick = () => emit('focus-from-map', { type: 'formation', slug: f.slug });
      } else {
        btn.style.color = 'gray';
        btn.disabled = true;
      }
      li.appendChild(btn);
      list.appendChild(li);
    }
    container.appendChild(list);

    const marker = L.marker([adresse.latitude, adresse.longitude], {
      icon: L.icon({ iconUrl, iconSize: [41,41], iconAnchor: [22,0], className: 'marker-formation' })
    }).bindPopup(container);

    marker.on('click', () => {
      skipHighlight = true;
      lastClickedMarker = marker;
      emit('focus-from-map', { type: 'formation', slug: structure.slug });
    });

    markers.addLayer(marker);
    markerRefs[`formation-group-${key}`] = marker;
  }
}

function clearHighlight() {
  if (highlightLayer) {
    map.removeLayer(highlightLayer);
    highlightLayer = null;
  }
  if (infoMulti) {
    map.removeControl(infoMulti);
    infoMulti = null;
  }
}

function highlightMulti(
  type: 'structure' | 'permanence',
  slug: string,
  adresses: { latitude: number; longitude: number }[]
) {
  clearHighlight();

  highlightLayer = L.layerGroup().addTo(map);
  const clones: L.Marker[] = [];

  for (const a of adresses) {
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

    const popupContent = original.getPopup()?.getContent() as HTMLElement | string;

    const clone = L.marker(original.getLatLng(), {
      icon: cloneIcon,
      pane: 'highlightPane'
    })
      .bindPopup(popupContent)
      .on('click', () => {
        clearHighlight();
        markers.zoomToShowLayer(original, () => {
          map.setView(original.getLatLng(), Math.max(map.getZoom(), 16), { animate: true });
          original.openPopup();
        });
      });

    highlightLayer.addLayer(clone);
    clones.push(clone);
  }

  if (clones.length > 0) {
    clones[0].openPopup();
  }

  const bounds = L.latLngBounds(adresses.map(a =>
    [a.latitude, a.longitude] as [number, number]
  ));
  map.fitBounds(bounds, { padding: [50, 50] });

  const count = adresses.length;
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

function highlightFormation(frm: FormationModel, struct: StructureModel) {
  clearHighlight();

  const adrs = frm.adresses;
  highlightLayer = L.layerGroup().addTo(map);
  const clones: L.Marker[] = [];

  for (const a of adrs) {
    const structKey = `structure-${struct.slug}-${a.latitude}-${a.longitude}`;
    let original = markerRefs[structKey];

    if (!original) {
      const groupPrefix = `formation-group-${struct.slug}-${a.latitude}-${a.longitude}`;
      const grpKey = Object.keys(markerRefs)
        .find(k => k.startsWith(groupPrefix));
      if (grpKey) original = markerRefs[grpKey];
    }
    if (!original) continue;

    const origIcon = original.getIcon() as L.Icon;
    const cloneUrl = (origIcon.options.iconUrl as string)
      .replace(/(marker_[a-z]+)\.png$/, '$1_clone.png');
    const cloneIcon = L.icon({ ...origIcon.options, iconUrl: cloneUrl });

    const popupContent = original.getPopup()?.getContent() as HTMLElement | string;
    const clone = L.marker(original.getLatLng(), {
      icon: cloneIcon,
      pane: 'highlightPane'
    })
      .bindPopup(popupContent)
      .on('click', () => {
        clearHighlight();
        markers.zoomToShowLayer(original!, () => {
          map.setView(original!.getLatLng(), Math.max(map.getZoom(), 16), { animate: true });
          original!.openPopup();
        });
      });

    highlightLayer!.addLayer(clone);
    clones.push(clone);
  }

  if (clones.length) clones[0].openPopup();

  const bounds = L.latLngBounds(adrs.map(a =>
    [a.latitude, a.longitude] as [number, number]
  ));
  map.fitBounds(bounds, { padding: [50, 50] });

  const count = adrs.length;
  const newInfo = (L.control as unknown as (opts: L.ControlOptions) => L.Control)({
    position: 'bottomleft'
  });
  newInfo.onAdd = () => {
    const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
    div.style.padding = '6px 10px';
    div.style.background = 'rgba(255,255,255,0.9)';
    div.style.fontSize = '13px';
    div.innerHTML = `⚠️ Il existe ${count} adresse${count>1?'s':''} pour cette formation`;
    return div;
  };
  infoMulti = newInfo;
  newInfo.addTo(map);
}

function openSelectedPopup() {
  clearHighlight();
  if (!props.objFocus) return;

  const { type, slug } = props.objFocus;
  const markerType = type;
  const markerSlug = slug;

  if (skipHighlight && lastClickedMarker) {
    const m = lastClickedMarker;
    skipHighlight = false;
    lastClickedMarker = null;
    markers.zoomToShowLayer(m, () => {
      setTimeout(() => {
        map.setView(m.getLatLng(), Math.max(map.getZoom(), 16), { animate: true });
        m.openPopup();
      }, 100);
    });
    return;
  }

  if (type === 'formation') {
    const assoc = props.structures
      ?.flatMap(s => s.formations.map(f => ({ structure: s, formation: f })))
      .find(x => x.formation.slug === slug);

    if (assoc) {
      const { formation, structure } = assoc;

      if (formation.adresses.length > 1) {
        highlightFormation(formation, structure);
        return;
      }

      const a = formation.adresses[0];
      const keyStruct = `structure-${structure.slug}-${a.latitude}-${a.longitude}`;
      const m0 = markerRefs[keyStruct]
        || markerRefs[
          Object.keys(markerRefs)
            .find(k => k.startsWith(`formation-group-${structure.slug}-${a.latitude}-${a.longitude}`))!
          ];
      if (m0) {
        markers.zoomToShowLayer(m0, () => {
          setTimeout(() => {
            map.setView(m0.getLatLng(), Math.max(map.getZoom(), 16), { animate: true });
            m0.openPopup();
          }, 100);
        });
      }
      return;
    }
  }

  if (type === 'formation' && formationToGroupKey[slug]) {
    const key = formationToGroupKey[slug];
    const m = markerRefs[key];
    if (!m) return;
    markers.zoomToShowLayer(m, () => {
      setTimeout(() => {
        map.setView(m.getLatLng(), Math.max(map.getZoom(), 16), { animate: true });
        m.openPopup();
      }, 100);
    });
    return;
  }

  if (type === 'structure') {
    const s = props.structures?.find(s => s.slug === slug);
    if (s) {
      if (s.adresses.length > 1) {
        highlightMulti('structure', slug, s.adresses);
        return;
      }
      const key0 = `structure-${s.slug}-${s.adresses[0].latitude}-${s.adresses[0].longitude}`;
      const m0 = markerRefs[key0];
      if (m0) {
        markers.zoomToShowLayer(m0, () => {
          setTimeout(() => {
            map.setView(m0.getLatLng(), Math.max(map.getZoom(), 16), { animate: true });
            m0.openPopup();
          }, 100);
        });
      }
      return;
    }
  }

  if (type === 'permanence') {
    const p = props.permanences?.find(p => p.slug === slug);
    if (p) {
      if (p.adresses.length > 1) {
        highlightMulti('permanence', slug, p.adresses);
        return;
      }
      const a = p.adresses[0];
      const m0 = markerRefs[`permanence-${slug}-${a.latitude}-${a.longitude}`];
      if (m0) {
        markers.zoomToShowLayer(m0, () => {
          setTimeout(() => {
            map.setView(m0.getLatLng(), Math.max(map.getZoom(), 16), { animate: true });
            m0.openPopup();
          }, 100);
        });
      }
      return;
    }
  }

  const key = Object.keys(markerRefs)
    .find(k => k.startsWith(`${markerType}-${markerSlug}-`));
  if (!key) return;

  const m = markerRefs[key];
  markers.zoomToShowLayer(m, () => {
    setTimeout(() => {
      map.setView(m.getLatLng(), Math.max(map.getZoom(), 16), { animate: true });
      m.openPopup();
    }, 100);
  });
}

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
    btn.onclick = () => c.classList.toggle('open');
    return c;
  };
  legend.addTo(map);
}

function addRecenterButton() {
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
      emit('reset-focus');
    };
    return btn;
  };
  ctrl.addTo(map);
}

onMounted(() => {
  initMap();
  addMarkers();
  openSelectedPopup();
  addLegend();
  addRecenterButton();
});

watch(() => props.objFocus, () => {
  openSelectedPopup();
});

watch(
  () => [props.structures, props.permanences, props.filters],
  () => {
    markers.clearLayers();
    addMarkers();
  },
  {deep: true}
);

</script>

<template>
  <div ref="mapContainer" id="map"></div>
</template>

<style>

#map {
  height: 100%;
}

.legend-toggle {
  display: none;
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

.leaflet-marker-icon.marker-ok {
  filter: hue-rotate(200deg) saturate(2) brightness(1.5)
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
    height: 100vh;
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
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
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
