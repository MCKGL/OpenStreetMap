import { createRouter, createWebHistory } from 'vue-router';
const Home = () => import('@/components/HomeApp.vue');
const Carto = () => import('@/components/carto/PageCarto.vue');
const Detail = () => import('@/components/detail/StructureDetail.vue');

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/carto', name: 'Carto', component: Carto },
  { path: '/:slug', component: Detail },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
