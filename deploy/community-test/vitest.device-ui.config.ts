import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'
// Run only inside the composed staged source, whose device pages have the reviewed patches.
export default defineConfig({
  plugins: [vue()],
  resolve: { alias: { '@': fileURLToPath(new URL('../../src', import.meta.url)) } },
  test: {
    environment: 'happy-dom',
    include: [
      'deploy/community-test/automation-preview.test.ts',
      'src/__tests__/unit/automation-command-identifier.test.ts',
      'deploy/community-test/device-ui-pages.test.ts',
      'deploy/community-test/template-detail-route.test.ts',
      'deploy/community-test/template-metadata-entries.test.ts',
      'deploy/community-test/template-metadata-http.test.ts',
      'src/__tests__/unit/device-config-metadata.test.ts',
      'src/__tests__/unit/device-command-json-payload.test.ts'
    ],
    maxWorkers: 1,
    minWorkers: 1
  }
})
