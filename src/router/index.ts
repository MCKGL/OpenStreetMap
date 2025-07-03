import { createRouter, createWebHistory } from 'vue-router';
const Carto = () => import('@/views/PageCarto.vue');

const routes = [
  { path: '/', name: 'Carto', component: Carto },

  // redirection
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
