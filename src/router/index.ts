import { createRouter, createWebHistory } from 'vue-router';
import DetailMap from "@/components/widgets/map/DetailMap.vue";
import { ROUTE_TYPE } from "@/types/RouteType.ts";

const PageCarto = () => import('@/views/PageCarto.vue');
const PdfOutilGenerator = () => import('@/views/PdfOutilGenerator.vue');
const PageErreur = () => import('@/views/PageErreur.vue');

const routes = [
  { path: '/', name: 'NotFound', component: PageErreur, meta: { delayedError: true } },
  { path: '/trouver-une-formation', name: ROUTE_TYPE.SEARCH_FORMATION, component: PageCarto },
  { path: '/les-coordinations-linguistiques-franciliennes', name: ROUTE_TYPE.SEARCH_COORDINATION, component: PageCarto },
  { path: '/structure/coordination/:slug', name: ROUTE_TYPE.DETAIL_MAP_COORDINATION, component: DetailMap },
  { path: '/structure/apprentissage-du-francais/:slug', name: ROUTE_TYPE.DETAIL_MAP_STRUCTURE_LEARNING, component: DetailMap },
  { path: '/structure/acteur-ressources/:points?', name: ROUTE_TYPE.DETAIL_MAP_STRUCTURE_ACTOR, component: DetailMap },
  { path: '/structure/apprentissage-du-francais/formation/:lat/:long', name: ROUTE_TYPE.DETAIL_MAP_FORMATION, component: DetailMap },
  { path: '/outil_pdf/:slug', name: ROUTE_TYPE.PDF_OUTIL_GENERATOR, component: PdfOutilGenerator },

  // n’affiche la page erreur que si tout le reste a échoué après un tick
  { path: '/:pathMatch(.*)*', name: 'NotFound', component: PageErreur, meta: { delayedError: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  if (to.meta.delayedError) {
    setTimeout(() => next(), 3000);
  } else {
    next();
  }
});

export default router;
