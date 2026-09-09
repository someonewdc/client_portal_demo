import tailwindcss from '@tailwindcss/vite';
import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  app: {
    head: {
      htmlAttrs: {
        lang: 'ru',
      },
    },
  },
  build: {
    transpile: ['@client-portal/api-client'],
  },
  compatibilityDate: '2025-07-15',
  css: ['~/assets/css/main.css'],
  devServer: {
    port: 3000,
  },
  devtools: {
    enabled: false,
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: 'http://localhost:3001/api/v1',
    },
  },
  telemetry: false,
  vite: {
    plugins: [tailwindcss()],
  },
});
