import { test as setup } from '@playwright/test'

const AUTH_FILE = 'e2e/auth.json'

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name=username], [placeholder*="用户名"], [placeholder*="账号"]', process.env.E2E_USER ?? 'admin')
  await page.fill('[name=password], [placeholder*="密码"]', process.env.E2E_PASS ?? 'admin123')
  await page.click('[type=submit], button:has-text("登录")')
  await page.waitForURL(/\/(home|dashboard)/, { timeout: 15000 })
  await page.context().storageState({ path: AUTH_FILE })
})
