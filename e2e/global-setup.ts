import { chromium } from '@playwright/test'
import * as fs from 'fs'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default async function globalSetup() {
  // Ensure auth.json exists as an empty file so the config doesn't crash before auth.setup runs
  const authPath = join(__dirname, 'auth.json')
  if (!fs.existsSync(authPath)) {
    fs.writeFileSync(authPath, JSON.stringify({ cookies: [], origins: [] }))
  }
  // Optionally verify the dev server is reachable
  const browser = await chromium.launch()
  const page = await browser.newPage()
  try {
    await page.goto(process.env.TEST_BASE_URL ?? 'http://localhost:5173', { timeout: 10000 })
  } catch {
    console.warn('[E2E] Dev server not reachable – tests may fail')
  } finally {
    await browser.close()
  }
}
