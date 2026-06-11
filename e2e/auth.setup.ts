import { test as setup, expect } from '@playwright/test'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const AUTH_FILE = join(__dirname, 'auth.json')

setup('authenticate', async ({ page }) => {
  await page.goto('/login')

  // If already logged in (redirected away from /login), just save state
  await page.waitForTimeout(2000)
  if (!page.url().includes('/login')) {
    await page.context().storageState({ path: AUTH_FILE })
    return
  }

  await page.waitForSelector('input', { timeout: 15000 })
  await page.fill(
    '[placeholder*="邮箱"], [placeholder*="手机号"], [placeholder*="用户名"], [placeholder*="账号"], [placeholder*="email"]',
    process.env.E2E_USER ?? 'tenant@tenant.cn'
  )
  await page.fill('[placeholder*="密码"], [placeholder*="password"]', process.env.E2E_PASS ?? '123456')
  await page.click('[type=submit], button:has-text("登录"), button:has-text("Login")')
  await page.waitForURL(/\/(home|dashboard)/, { timeout: 20000 })
  await page.context().storageState({ path: AUTH_FILE })
})
