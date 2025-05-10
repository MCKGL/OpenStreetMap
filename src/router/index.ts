import { createRouter, createWebHistory } from 'vue-router';
const Home = () => import('@/components/HomeApp.vue');
const Carto = () => import('@/components/carto/SwitchListeMap.vue');
const Detail = () => import('@/components/detail/CoordonneeDetail.vue');

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/carto', name: 'Carto', component: Carto },
  { path: '/coor_detail_:id', component: Detail },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
