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
const isGroup = ref(false);

const emit = defineEmits<{
  (e: 'reset-focus'): void;
  (e: 'focus-from-map', payload: { type: 'structure' | 'permanence' | 'formation'; slug: string }): void;
}>();

type FormationWithStructure = {
  formation: FormationModel;
  structure: StructureModel;
};
const formationsNotOnStructure = computed<FormationWithStructure[]>(() => {
  const raw = props.structures?.flatMap(structure =>
    (structure.formations || []).map(frm => ({ formation: frm, structure }))
  ) || [];

  return raw.filter(({ formation, structure }) => {
    if (props.filters?.includes('placeDisponible') && !formation.placeDisponible) return false;
    if (props.filters?.includes('gardeEnfant') && !formation.gardeEnfants) return false;

    const hasCommonAddress = formation.adresses.some(fAddr =>
      structure.adresses.some(sAddr =>
        sAddr.latitude === fAddr.latitude && sAddr.longitude === fAddr.longitude
      )
    );

    return !hasCommonAddress;
  });
});

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map;
let markers: L.MarkerClusterGroup;
const markerRefs: Record<string, L.Marker> = {};
let ileDeFranceBounds: L.LatLngBounds;
const router = useRouter();

defineExpose({
  resizeMap: () => {
    map?.invalidateSize();
  }
});

function initMap() {
  map = L.map(mapContainer.value!, {minZoom: 5});
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

function addMarkers() {

  if (props.structures) {
    for (const s of props.structures) {
      const formations = s.formations || [];
      const hasSharedAddress = formations.some(f =>
        f.adresses.some(fa =>
          s.adresses.some(sa =>
            sa.latitude === fa.latitude && sa.longitude === fa.longitude
          )
        )
      );
      let iconUrl = '/icones/marker_blue.png';
      if (hasSharedAddress) {
        const hasAvailableAtSharedAddress = formations.some(f =>
          f.placeDisponible &&
          f.adresses.some(fa =>
            s.adresses.some(sa =>
              sa.latitude === fa.latitude && sa.longitude === fa.longitude
            )
          )
        );
        iconUrl = hasAvailableAtSharedAddress
          ? '/icones/marker_yellow.png'
          : '/icones/marker_gray.png';
      }

      for (const a of s.adresses) {
        const key = `structure-${s.slug}-${a.latitude}-${a.longitude}`;
        const formationsAtThisAddress = (s.formations || []).filter(f =>
          f.adresses.some(fa => fa.latitude === a.latitude && fa.longitude === a.longitude)
        );
        const container = document.createElement('div');
        const nomStructure = document.createElement('strong');
        nomStructure.textContent = s.nom;
        container.appendChild(nomStructure);
        if (formationsAtThisAddress.length) {
          const label = document.createElement('div');
          label.textContent = 'Formations de cette structure à cette adresse :';
          label.style.marginTop = '8px';
          container.appendChild(label);
          const list = document.createElement('ul');
          list.style.paddingLeft = '16px';
          for (const f of formationsAtThisAddress) {
            const li = document.createElement('li');
            const link = document.createElement('button');
            link.type = 'button';
            link.textContent = f.nom;
            link.style.background = 'none';
            link.style.border = 'none';
            link.style.color = '#007BFF';
            link.style.cursor = 'pointer';
            link.style.padding = '0';
            link.onclick = () => {
              emit('focus-from-map', {
                type: 'formation',
                slug: f.slug
              });
            };
            li.appendChild(link);
            list.appendChild(li);
          }
          container.appendChild(list);
        }
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = 'Voir la structure';
        btn.style.marginTop = '10px';
        btn.style.display = 'block';
        btn.onclick = () => {
          router.push(`/${s.slug}`);
        };
        container.appendChild(btn);
        const m = L.marker([a.latitude, a.longitude], {
          icon: L.icon({
            iconUrl,
            iconSize: [41, 41], iconAnchor: [22, 0], className: 'marker-structure'
          })
        }).bindPopup(container);
        m.on('click', () => {
          emit('focus-from-map', {
            type: 'structure',
            slug: s.slug
          });
        });
        markers.addLayer(m);
        markerRefs[key] = m;
      }
    }
  }

  if (props.permanences) {
    for (const p of props.permanences) {
      for (const a of p.adresses) {
        const key = `permanence-${p.slug}-${a.latitude}-${a.longitude}`;
        const m = L.marker([a.latitude, a.longitude], {
          icon: L.icon({
            iconUrl: '/icones/marker_black.png',
            iconSize: [41, 41], iconAnchor: [22, 0], className: 'marker-permanence'
          })
        }).bindPopup(`<strong>${p.nom}</strong><br>${a.ville} (${a.codePostal})`);
        m.on('click', () => {
          emit('focus-from-map', {
            type: 'permanence',
            slug: p.slug
          });
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

  for (const item of formationsNotOnStructure.value) {
    for (const addr of item.formation.adresses) {
      const key = `${item.structure.slug}-${addr.latitude}-${addr.longitude}`;
      if (!groupedFormations.has(key)) {
        groupedFormations.set(key, {
          structure: item.structure,
          adresse: addr,
          formations: []
        });
      }
      groupedFormations.get(key)!.formations.push(item.formation);
    }
  }

  for (const [key, { structure, adresse, formations }] of groupedFormations.entries()) {
    const hasPlace = formations.some(f => f.placeDisponible);

    const container = document.createElement('div');

    const nomStructure = document.createElement('strong');
    nomStructure.textContent = structure.nom;
    container.appendChild(nomStructure);

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
      btn.textContent = f.nom;
      btn.style.background = 'none';
      btn.style.border = 'none';
      btn.style.color = '#007BFF';
      btn.style.cursor = 'pointer';
      btn.style.padding = '0';
      btn.onclick = () => {
        emit('focus-from-map', { type: 'formation', slug: f.slug });
      };
      li.appendChild(btn);
      list.appendChild(li);
    }

    container.appendChild(list);

    const btnVoir = document.createElement('button');
    btnVoir.type = 'button';
    btnVoir.textContent = 'Voir structure';
    btnVoir.style.marginTop = '10px';
    btnVoir.onclick = () => {
      router.push(`/${structure.slug}`);
    };
    container.appendChild(btnVoir);

    const m = L.marker([adresse.latitude, adresse.longitude], {
      icon: L.icon({
        iconUrl: hasPlace ? '/icones/marker_yellow.png' : '/icones/marker_gray.png',
        iconSize: [41, 41],
        iconAnchor: [22, 0],
        className: 'marker-formation'
      })
    }).bindPopup(container);
    m.on('click', () => {
      isGroup.value = true;
      emit('focus-from-map', {
        type: 'structure',
        slug: structure.slug
      });
    });
    markers.addLayer(m);
    markerRefs[`formation-group-${key}`] = m;
  }
}

function openSelectedPopup() {
  if (!props.objFocus) return;
  if (isGroup.value) {
    isGroup.value = false;
    const key = Object.keys(markerRefs)
        .find(k => k.startsWith(`${props.objFocus?.type}-${props.objFocus?.slug}-`));
    if (key) markerRefs[key].openPopup();
    return;
  }

  const { type, slug } = props.objFocus;
  let markerType = type;
  let markerSlug = slug;

  if (type === 'formation') {
    const assoc = props.structures
      ?.flatMap(s => s.formations.map(f => ({ structure: s, formation: f })))
      .find(x => x.formation.slug === slug);

    if (assoc) {
      const { formation, structure } = assoc;
      const shared = formation.adresses.some(fa =>
        structure.adresses.some(sa =>
          sa.latitude === fa.latitude && sa.longitude === fa.longitude
        )
      );
      if (shared) {
        markerType = 'structure';
        markerSlug = structure.slug;
      }
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
  height: 90vh;
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

@media (max-width: 768px) {
  #map {
    height: 80vh;
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
}

</style>
