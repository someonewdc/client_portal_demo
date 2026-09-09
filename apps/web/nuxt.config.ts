import { defineNuxtConfig } from 'nuxt/config';

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
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
});
