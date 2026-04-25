import { createConfigForNuxt } from '@nuxt/eslint-config'

export default createConfigForNuxt()
  .append({
    ignores: ['reference_blog/**', 'skills/**', '.npm-cache/**']
  })
  .append({
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/html-self-closing': 'off',
      'vue/no-v-html': 'off'
    }
  })
