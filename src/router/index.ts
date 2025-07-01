import { createRouter, createWebHistory } from 'vue-router';
const Carto = () => import('@/components/carto/PageCarto.vue');

const routes = [
  { path: '/', name: 'Carto', component: Carto },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
