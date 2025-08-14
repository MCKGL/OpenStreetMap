import { createRouter, createWebHistory } from 'vue-router';
import DetailMap from "@/components/widgets/map/DetailMap.vue";
const PageCarto = () => import('@/views/PageCarto.vue');

const routes = [
  { path: '/', name: 'PageCarto', component: PageCarto },
  { path: '/structure/coordination/:slug', name: 'DetailMapPermanence', component: DetailMap },
  { path: '/structure/apprentissage-du-francais/:slug', name: 'DetailMapStructure', component: DetailMap },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
