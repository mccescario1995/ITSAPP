// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  
  compatibilityDate: "2026-02-11",
  devtools: { enabled: true },
  modules: ['@nuxt/ui','@pinia/nuxt'],

  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_LIVE_API || "http://localhost:5092",
      appUrl: process.env.NUXT_PUBLIC_APP_URL || "http://localhost:3000",
    },
    private: {},
  },

  css: ["assets/css/main.css"],

  ui: {
    colorMode: false
  },

  app: {
    baseURL: "/its/",
    head: {
      link: [{ rel: "icon", type: "img/png", href: "/its/favicon.ico" }],
      title: "ITS",
    },
  },

  imports: {
    dirs: ["layouts", "types", "composables"],
  },

  ssr:false,
  // nuxt.config.ts
  router: { // to use # in url
    options: {
      hashMode: true
    }
  },

  vite: {
    optimizeDeps: {
      include: [
        '@nuxt/ui > prosemirror-state',
        '@nuxt/ui > prosemirror-transform',
        '@nuxt/ui > prosemirror-model',
        '@nuxt/ui > prosemirror-view',                                                                                                                                                                                                                            
        '@nuxt/ui > prosemirror-gapcursor'
      ]
    }
  }
});
