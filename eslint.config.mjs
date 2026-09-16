// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/multi-word-component-names': 'off',
  },
  ignores: ['.output/**', '.nuxt/**', 'dist/**', 'playwright-report/**', 'test-results/**'],
})
