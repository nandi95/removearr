// @ts-check
import { fileURLToPath } from 'node:url';
import tailwind from 'eslint-plugin-tailwindcss';
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
    {
        rules: {
            // https://eslint.org/docs/rules/
            'no-console': 'warn',
            'no-debugger': 'warn',
            '@stylistic/space-before-function-paren': [
                'error', {
                    anonymous: 'never',
                    named: 'never',
                    asyncArrow: 'always'
                }
            ],
            '@stylistic/no-trailing-spaces': 'warn',
            '@stylistic/object-curly-spacing': ['warn', 'always'],
            '@stylistic/max-len': ['warn', { code: 120, ignorePattern: 'class="' }],
            '@stylistic/brace-style': ['warn', '1tbs', { allowSingleLine: true }],
            '@stylistic/arrow-parens': ['error', 'as-needed'],
            eqeqeq: 'error',

            // https://eslint.vuejs.org/rules/
            'vue/html-indent': ['warn', 4],
            'vue/component-name-in-template-casing': ['warn', 'PascalCase'],
            'vue/match-component-file-name': ['error', { extensions: ['jsx', 'vue'] }],
            'vue/new-line-between-multi-line-property': 'warn',
            'vue/max-attributes-per-line': ['warn', { singleline: { max: 3 }, multiline: { max: 1 } }],
            'vue/first-attribute-linebreak': ['warn', { singleline: 'ignore', multiline: 'beside' }],
            'vue/multi-word-component-names': 'off',
            'vue/no-boolean-default': ['error', 'default-false'],
            'vue/no-duplicate-attr-inheritance': 'error',
            'vue/no-empty-component-block': 'warn',
            'vue/no-multiple-objects-in-class': 'error',
            'vue/no-potential-component-option-typo': ['error', { presets: ['vue', 'vue-router'] }],
            'vue/no-reserved-component-names': [
                'error', {
                    disallowVueBuiltInComponents: true,
                    disallowVue3BuiltInComponents: true
                }
            ],
            'vue/no-template-target-blank': 'error',
            'vue/no-unsupported-features': ['error', { version: '^3.5.0' }],
            'vue/no-useless-mustaches': 'warn',
            'vue/no-useless-v-bind': 'error',
            'vue/padding-line-between-blocks': 'warn',
            'vue/require-name-property': 'error',
            'vue/v-for-delimiter-style': 'error',
            'vue/v-on-event-hyphenation': 'error',
            'vue/eqeqeq': 'error',
            'vue/no-extra-parens': 'warn',
            'vue/html-closing-bracket-newline': ['error', { singleline: 'never', multiline: 'never' }],
            'vue/script-setup-uses-vars': 'off'
        }
    },
    tailwind.configs.recommended,
    {
        settings: {
            tailwindcss: {
                // Tailwind v4 has no JS config; the plugin loads the design system from the CSS entry
                cssConfigPath: fileURLToPath(new URL('./app/assets/css/main.css', import.meta.url))
            }
        },
        rules: {
            'tailwindcss/no-custom-classname': 'off'
        }
    }
)
    .override('nuxt/typescript/rules', {
        languageOptions: {
            parserOptions: {
                // Nuxt 4's tsconfig.json is references-only, so let TS resolve the right project per file
                projectService: true
            }
        },
        rules: {
            // https://typescript-eslint.io/rules/
            '@typescript-eslint/no-unused-expressions': 'error',
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-useless-constructor': 'warn',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            // inferred return types on composables/handlers; keeps Nuxt code idiomatic
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/prefer-nullish-coalescing': 'warn',
            '@typescript-eslint/prefer-optional-chain': 'warn',
            '@typescript-eslint/ban-ts-comment': ['error', {
                minimumDescriptionLength: 3,
                'ts-check': false,
                'ts-expect-error': 'allow-with-description',
                'ts-ignore': true,
                'ts-nocheck': true
            }],
            '@typescript-eslint/promise-function-async': 'error',
            '@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],
            '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports', fixStyle: 'separate-type-imports' }],
            '@typescript-eslint/naming-convention': ['error',
                { selector: 'default', format: ['camelCase'] },
                { selector: 'variable', modifiers: ['const'], format: ['camelCase', 'PascalCase', 'UPPER_CASE'] },
                // tautulli/radarr payloads are snake_case, http headers are Kebab-Case
                { selector: ['objectLiteralProperty', 'typeProperty'], format: ['camelCase', 'PascalCase', 'snake_case'] },
                { selector: 'objectLiteralProperty', format: null, filter: { regex: '[^a-zA-Z0-9_]', match: true } },
                { selector: 'typeLike', format: ['PascalCase'] },
                { selector: 'import', format: ['camelCase', 'PascalCase'] },
                { selector: 'parameter', format: null, filter: { regex: '^_.*', match: true } }
            ],
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/lines-between-class-members': 'off'
        }
    });
