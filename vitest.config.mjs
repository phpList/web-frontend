import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: [
      'assets/vue/**/*.spec.js',
      'tests/Unit/assets/vue/**/*.spec.js',
      'tests/Unit/assets/editor/**/*.spec.js',
    ],
  },
})
