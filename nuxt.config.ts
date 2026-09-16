import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-09-15',
  future: { compatibilityVersion: 4 },

  modules: ['@nuxt/eslint'],

  devtools: { enabled: true },

  css: ['~/assets/css/tokens.css', '~/assets/css/base.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  typescript: {
    strict: true,
    typeCheck: false,
  },

  // Static site: every route is prerendered to HTML so content is present
  // without JS and crawlable. See docs/PROJECT.md §8.
  nitro: {
    prerender: {
      crawlLinks: true,
      routes: ['/', '/experience', '/projects', '/skills', '/sitemap.xml', '/404'],
      failOnError: true,
    },
  },

  routeRules: {
    // Old site paths kept alive. Keep in sync with public/_redirects
    // (Cloudflare Pages serves that file; routeRules cover dev + preview).
    '/contact': { redirect: { to: '/#contact', statusCode: 301 } },
    '/Andrew Long Resume.pdf': { redirect: { to: '/resume.pdf', statusCode: 301 } },
  },

  runtimeConfig: {
    public: {
      // Set NUXT_PUBLIC_GTM_ID to enable analytics. Empty = nothing loads.
      gtmId: '',
      siteUrl: 'https://idrewlong.com',
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      link: [{ rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    },
  },

  features: {
    // No global CSS inlining bloat; keep the first-view payload small.
    inlineStyles: true,
  },
})
