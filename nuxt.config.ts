export default defineNuxtConfig({
  modules: [
    '@nuxt/ui'
  ],

  css: [
    '~/assets/css/main.css'
  ],

  devtools: {
    enabled: true
  },

  runtimeConfig: {
    public: {
      backendBase: 'http://localhost:8000',
      apiBase: 'http://localhost:8000/api'
    }
  }
})