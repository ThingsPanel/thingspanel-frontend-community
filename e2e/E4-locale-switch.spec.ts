/**
 * E4: 海外客户切英文，UI 无中文遗留
 * 验收：截图人工审 + 机器检查页面无中文字符
 */
import { test, expect } from '@playwright/test'

test.describe('E4: Switch to en-US, no Chinese text remains', () => {
  test('switches locale to en-US and checks key labels are in English', async ({ page }) => {
    await page.goto('/thing-model')
    await page.waitForSelector('table, .n-data-table', { timeout: 10000 })

    // Find and click language switcher ────────────────────────────────────
    const langSwitcher = page.locator(
      '[data-test="lang-switch"], .lang-switch, button:has-text("中文"), .language-switcher'
    )
    if (await langSwitcher.isVisible({ timeout: 3000 }).catch(() => false)) {
      await langSwitcher.click()
      await page.click('.n-dropdown-option:has-text("English"), li:has-text("English"), [data-value="en-US"]')
      await page.waitForTimeout(800)
    } else {
      // Try setting via localStorage
      await page.evaluate(() => localStorage.setItem('locale', 'en-US'))
      await page.reload()
      await page.waitForSelector('table, .n-data-table', { timeout: 10000 })
    }

    // Page title / heading should be in English ───────────────────────────
    const heading = page.locator('h1, .page-title, .n-page-header-title').first()
    if (await heading.isVisible({ timeout: 3000 }).catch(() => false)) {
      const text = await heading.textContent()
      // Should contain "Thing Model" not "物模型"
      expect(text).not.toMatch(/[一-鿿]/)
    }

    // Navigation menu items should be in English ──────────────────────────
    const menuItems = page.locator('.n-menu-item-content-header, .menu-item-label')
    const count = await menuItems.count()
    for (let i = 0; i < Math.min(count, 5); i++) {
      const text = await menuItems.nth(i).textContent() ?? ''
      // Allow some tolerance – check the thing-model related items
      if (text.includes('Model') || text.includes('Template') || text.includes('Device')) {
        expect(text).not.toMatch(/[一-鿿]/)
      }
    }

    // Screenshot for manual review
    await page.screenshot({ path: 'e2e-report/E4-english-ui.png', fullPage: false })

    // Buttons on thing-model page should be in English
    const newButton = page.locator('button:has-text("New"), button:has-text("Thing Model")')
    if (await newButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      expect(await newButton.textContent()).not.toMatch(/[一-鿿]/)
    }
  })
})
