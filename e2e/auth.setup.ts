import { test as setup } from '@playwright/test'

const AUTH_FILE = 'auth.json'

setup('authenticate', async ({ page }) => {
  await page.goto('/login')
  await page.waitForSelector('input', { timeout: 10000 })
  // Login form uses placeholder: "请输入邮箱/手机号" and "请输入密码"
  await page.fill(
    '[placeholder*="邮箱"], [placeholder*="手机号"], [placeholder*="用户名"], [placeholder*="账号"], [placeholder*="email"]',
    process.env.E2E_USER ?? 'admin@thingspanel.cn'
  )
  await page.fill('[placeholder*="密码"], [placeholder*="password"]', process.env.E2E_PASS ?? 'admin123456')
  await page.click('[type=submit], button:has-text("登录"), button:has-text("Login")')
  await page.waitForURL(/\/(home|dashboard)/, { timeout: 20000 })
  await page.context().storageState({ path: AUTH_FILE })
})
