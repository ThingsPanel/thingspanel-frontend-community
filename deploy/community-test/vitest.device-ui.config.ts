import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
// Run only inside the composed staged source, whose device pages have the reviewed patches.
export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
  test: {
    environment: 'happy-dom',
    include: ['deploy/community-test/device-ui-pages.test.ts'],
    maxWorkers: 1,
    minWorkers: 1
  }
})
