// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: false },
  modules: ["@nuxt/ui"],

  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_LIVE_API || "http://localhost:5092",
      appUrl: process.env.NUXT_PUBLIC_APP_URL || "http://localhost:3000",
    },
    private: {},
  },

  css: ["assets/css/main.css"],

  app: {
    baseURL: "/its/",
    head: {
      link: [{ rel: "icon", type: "img/png", href: "/favico.png" }],
      title: "ITS",
    },
  },

  imports: {
    dirs: ["layouts", "types", "composables"],
  },

  ssr:false,
});
