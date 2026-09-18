// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/multi-word-component-names': 'off',
  },
  ignores: ['.output/**', '.nuxt/**', 'dist/**', 'playwright-report/**', 'test-results/**'],
}, {
  // Every e2e spec must go through `./helpers`, which auto-stubs the weather
  // network calls via a `beforeEach` fixture. Importing `@playwright/test`
  // directly bypasses that stub silently — lint would pass, but the test
  // would hit the live API. `helpers.ts` itself is exempt: it is the one
  // file that legitimately imports the real module.
  files: ['tests/e2e/**'],
  ignores: ['tests/e2e/helpers.ts'],
  rules: {
    'no-restricted-imports': ['error', {
      paths: [{
        name: '@playwright/test',
        message: 'Import test/expect from \'./helpers\' instead, so the weather network stub applies.',
      }],
    }],
  },
})
