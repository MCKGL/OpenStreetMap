import { createRouter, createWebHistory } from 'vue-router';
const Carto = () => import('@/components/carto/PageCarto.vue');
const Detail = () => import('@/components/detail/StructureDetail.vue');

const routes = [
  { path: '/', name: 'Carto', component: Carto },
  { path: '/:slug', component: Detail },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
