import { createRouter, createWebHistory } from 'vue-router';
import DetailMap from "@/components/widgets/map/DetailMap.vue";
const PageCarto = () => import('@/views/PageCarto.vue');

const routes = [
  { path: '/trouver-une-formation', name: 'SearchFormation', component: PageCarto },
  { path: '/les-coordinations-linguistiques-franciliennes', name: 'SearchCoordination', component: PageCarto },
  { path: '/structure/coordination/:slug', name: 'DetailMapPermanence', component: DetailMap },
  { path: '/structure/apprentissage-du-francais/:slug', name: 'DetailMapStructure', component: DetailMap },
  { path: '/structure/apprentissage-du-francais/:slugStructure/formation/francais-a-visee-sociale-et-communicative/:slug', name: 'DetailMapFormation', component: DetailMap },
  { path: '/:pathMatch(.*)*', redirect: '/trouver-une-formation' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
