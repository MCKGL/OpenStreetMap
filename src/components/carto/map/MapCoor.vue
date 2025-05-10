<script setup lang="ts">
import { ref, onMounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { CoordonneeModel } from '@/models/Coordonnee.model.ts';

// Les props sont définies pour recevoir les coordonnées
const props = defineProps<{
  coors: CoordonneeModel[];
  idFocus?: number;
}>();

// le emit va permettre de remonter l'événement 'reset-focus' à la vue parente
const emit = defineEmits<{
  (e: 'reset-focus'): void;
}>();

const mapContainer = ref<HTMLElement | null>(null);
console.log(props.idFocus);
let map: L.Map;
let markers: L.MarkerClusterGroup;
const markerRefs: Record<number, L.Marker> = {};
let ileDeFranceBounds: L.LatLngBounds;


/**
 * initMap va initialiser la carte. Si on a un idFocus, on va centrer la carte sur ce point (c'est
 * à dire si l'utilisateur a choisi une coordonnée dans la liste).
 * Par défaut la carte s'ouvre sur l'Île-de-France.
 * Si on a qu'une coordonnée, on centre la carte dessus.
 */
function initMap() {
  const centerZoom = (() => {
    if (props.idFocus != null) {
      const coord = props.coors.find(c => c.id === props.idFocus);
      if (coord) {
        return { center: [coord.lat, coord.lng] as [number, number], zoom: 22 };
      }
    }
    if (props.coors.length === 1) {
      return { center: [props.coors[0].lat, props.coors[0].lng] as [number, number], zoom: 22 };
    }
    return { center: [48.684, 2.502] as [number, number], zoom: 9 };
  })();

  console.log(centerZoom);

  map = L.map(mapContainer.value!, { minZoom: 5 }).setView(centerZoom.center, centerZoom.zoom);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  // Ajout de la couche de clusters, si on a plus d'un point sur une zone, on les regroupe
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

  // Définition des bornes de la carte pour l'Île-de-France
  ileDeFranceBounds = L.latLngBounds([48.0, 1.6], [49.1, 3.6]);
}

/**
 * La fonction addMarkers va ajouter les marqueurs sur la carte à partir de la liste de coordonnées
 */
function addMarkers() {
  markers.clearLayers();
  // markerRefs est une map mémoire entre les IDS de coordonnées et leurs marqueurs Leaflet correspondants
  markerRefs
  for (const coord of props.coors) {
    const iconClass = coord.ok ? 'marker-ok' : '';
    const marker = L.marker([coord.lat, coord.lng], {
      icon: L.icon({
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        className: iconClass
      })
    });
    marker.bindPopup(`ID ${coord.id}${coord.ok ? ' – OK' : ''}`);
    markers.addLayer(marker);
    markerRefs[coord.id] = marker;
  }
}

/**
 * openSelectedPopup va ouvrir le popup du marqueur sélectionné (s'il existe)
 * @param id
 */
function openSelectedPopup(id?: number) {
  if (id != null && markerRefs[id]) {
    const m = markerRefs[id];
    markers.zoomToShowLayer(m, () => {
      // le setTimeout est nécessaire pour que le popup s'ouvre correctement en cas de cluster
      setTimeout(() => {
        if (map && map.hasLayer(m)) {
          m.openPopup();
          map.setView(m.getLatLng(), Math.max(map.getZoom(), 16), { animate: true });
        }
      }, 100);
    });
  }
}


/**
 * addLegend va ajouter la légende à la carte
 */
function addLegend() {
  const legend = L.control({ position: 'bottomright' });
  legend.onAdd = () => {
    const c = L.DomUtil.create('div', 'legend-container');
    c.innerHTML = `
      <button class="legend-toggle" aria-label="Afficher la légende">Légende</button>
      <div class="legend-content">
        <h4>Légende</h4>
        <div><span class="legend-icon default"></span> Coordonnée</div>
        <div><span class="legend-icon ok"></span> Coordonnée en jaune</div>
      </div>
    `;
    const btn = c.querySelector<HTMLButtonElement>('.legend-toggle')!;
    btn.onclick = () => c.classList.toggle('open');
    return c;
  };
  legend.addTo(map);
}

/**
 * addRecenterButton va ajouter le bouton de recentrage sur l'Île-de-France
 */
function addRecenterButton() {
  const ctrl = L.control({ position: 'topright' });
  ctrl.onAdd = () => {
    const btn = L.DomUtil.create('button', 'recenter-btn');
    btn.title = 'Recentrer sur Île-de-France';
    btn.innerHTML = '📍';
    L.DomEvent.disableClickPropagation(btn);
    btn.onclick = () => {
      map.closePopup(); // ferme le popup actif
      map.fitBounds(ileDeFranceBounds, { animate: true });
      emit('reset-focus'); // dit au parent de remettre idFocus à undefined
    };
    return btn;
  };
  ctrl.addTo(map);
}

/**
 * Cycle de vie
 * onMounted : initialise la carte, ajoute les marqueurs, ouvre le popup sélectionné et
 * ajoute la légende et le bouton de recentrage
 */
onMounted(() => {
  initMap();
  addMarkers();
  openSelectedPopup(props.idFocus);
  addLegend();
  addRecenterButton();
});
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

.leaflet-popup {
  bottom: 35px !important;
  left: -48px !important;
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

.legend-icon {
  display: inline-block;
  width: 16px;
  height: 25px;
  background-image: url('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.3/images/marker-icon.png');
  background-size: contain;
  margin-right: 6px;
  vertical-align: middle;
}

.legend-icon.ok {
  filter: hue-rotate(200deg) saturate(2) brightness(1.5)
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
