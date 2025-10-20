import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import {CONFIG} from "./src/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/cartographie.json': {
        target: `${CONFIG.JSON_PATH_PREFIX}`,
        changeOrigin: true,
        secure: false,
      },
      '/programmes.json': {
        target: `${CONFIG.JSON_PATH_PREFIX}`,
        changeOrigin: true,
        secure: false,
      },
      '/villes-departements.json': {
        target: `${CONFIG.JSON_PATH_PREFIX}`,
        changeOrigin: true,
        secure: false,
      },
      '/outil.json': {
        target: `${CONFIG.JSON_PATH_PREFIX}`,
        changeOrigin: true,
        secure: false,
      },
      '/glossaire.json': {
        target: `${CONFIG.JSON_PATH_PREFIX}`,
        changeOrigin: true,
        secure: false,
      },
    }
  }
})
