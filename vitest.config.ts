import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '~': fileURLToPath(new URL('./', import.meta.url))
    }
  },
  test: {
    environment: 'happy-dom',
    include: ['src/__tests__/unit/**/*.test.ts'],
    maxWorkers: 2,
    minWorkers: 1,
    clearMocks: true
  }
})
