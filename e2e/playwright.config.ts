import { defineConfig, devices } from '@playwright/test'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  testDir: __dirname,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: join(__dirname, '../e2e-report') }], ['json', { outputFile: join(__dirname, '../e2e-report.json') }]],
  use: {
    baseURL: process.env.TEST_BASE_URL ?? 'http://localhost:5173',
    storageState: join(__dirname, 'auth.json'),
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  globalSetup: join(__dirname, 'global-setup.ts'),
})
