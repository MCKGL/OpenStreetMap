import { createRouter, createWebHistory } from 'vue-router';
import DetailMap from "@/components/widgets/map/DetailMap.vue";
import {ROUTE_TYPE} from "@/types/RouteType.ts";
const PageCarto = () => import('@/views/PageCarto.vue');

const routes = [
  { path: '/trouver-une-formation', name: ROUTE_TYPE.SEARCH_FORMATION, component: PageCarto },
  { path: '/les-coordinations-linguistiques-franciliennes', name: ROUTE_TYPE.SEARCH_COORDINATION, component: PageCarto },
  { path: '/structure/coordination/:slug', name: ROUTE_TYPE.DETAIL_MAP_COORDINATION, component: DetailMap },
  { path: '/structure/apprentissage-du-francais/:slug', name: ROUTE_TYPE.DETAIL_MAP_STRUCTURE_LEARNING, component: DetailMap },
  { path: '/structure/acteur-ressources/:slug', name: ROUTE_TYPE.DETAIL_MAP_STRUCTURE_ACTOR, component: DetailMap },
  { path: '/structure/apprentissage-du-francais/:slugStructure/formation/francais-a-visee-sociale-et-communicative/:slug', name: ROUTE_TYPE.DETAIL_MAP_FORMATION, component: DetailMap },
  { path: '/:pathMatch(.*)*', redirect: '/trouver-une-formation' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
