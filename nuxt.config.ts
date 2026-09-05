export default defineNuxtConfig({
    modules: ['@nuxt/ui', '@nuxt/eslint'],
    // single-user dashboard behind the LAN: no SEO, and relative timestamps hydrate badly
    ssr: false,
    css: ['~/assets/css/main.css'],
    colorMode: { preference: 'dark', fallback: 'dark' },
    compatibilityDate: '2026-09-01',
    nitro: {
        preset: 'node-server',
        experimental: { tasks: true, database: true },
        // node:sqlite via db0, zero native deps; file lands in {cwd}/.data/removearr.sqlite
        database: { default: { connector: 'node-sqlite', options: { name: 'removearr' } } }
    },
    eslint: {
        config: {
            typescript: true,
            stylistic: {
                indent: 4,
                semi: true,
                commaDangle: 'never',
                quotes: 'single',
                quoteProps: 'as-needed',
                arrowParens: true
            }
        }
    }
});
