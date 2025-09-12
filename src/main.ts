import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import './assets/main.css';

const app = createApp(App);
app.use(router);
app.mount('#app');

// Fonction à appeler pour écouter les messages du parent
export function useParentMessages() {
  // on précise le type de router
  const r: typeof router = router;

  window.addEventListener("message", (event) => {
    if (event.data?.type === "set-search" && event.data.params) {
      const currentPath = r.currentRoute.value.path;

      r.push({
        path: currentPath,
        query: Object.fromEntries(new URLSearchParams(event.data.params)),
      });
    }
  });
}

// Appel immédiat pour prendre en compte les query params du parent
useParentMessages();
