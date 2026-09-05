export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  // single-user dashboard behind the LAN: no SEO, and relative timestamps hydrate badly
  ssr: false,
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  colorMode: { preference: 'dark', fallback: 'dark' },
  nitro: {
    preset: 'node-server',
    experimental: { tasks: true, database: true },
    // node:sqlite via db0, zero native deps; file lands in {cwd}/.data/removearr.sqlite
    database: { default: { connector: 'node-sqlite', options: { name: 'removearr' } } },
  },
})
