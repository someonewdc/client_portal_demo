import tailwindcss from '@tailwindcss/vite';
import { defineNuxtConfig } from 'nuxt/config';

const capabilityPageHeaders = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
};

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
  routeRules: {
    '/': { headers: capabilityPageHeaders },
    '/start': { headers: capabilityPageHeaders },
    '/c/**': { headers: capabilityPageHeaders },
    '/r/**': { headers: capabilityPageHeaders },
  },
  runtimeConfig: {
    apiBaseUrl: '',
    demoConductorSecret: '',
    public: {
      apiBaseUrl: 'http://localhost:3001/api/v1',
    },
  },
  telemetry: false,
  vite: {
    plugins: [tailwindcss()],
  },
});
