/**
 * E3: 跨类型重名拒绝
 * 验收：创建 EVENT temperature 时，因已有 PROPERTY temperature 而报 409 / 错误提示
 */
import { test, expect } from '@playwright/test'
import { createThingModel, waitForModalReady } from './helpers'

test.describe('E3: Cross-type duplicate identifier rejected', () => {
  test('shows error when creating EVENT with identifier already used by PROPERTY', async ({ page }) => {
    await createThingModel(page, 'DupTest-' + Date.now())

    // Add PROPERTY temperature ────────────────────────────────────────────
    await page.locator('.n-tabs-tab').filter({ hasText: '字段' }).click()
    await page.waitForTimeout(300)
    await page.click('button:has-text("添加字段")')
    await waitForModalReady(page)
    await page.locator('.n-drawer input[placeholder*="小写字母"]').fill('temperature')
    await page.locator('.n-drawer input[placeholder="名称"]').fill('温度').catch(() => {})
    await page.locator('.n-drawer button:has-text("确认")').first().click()
    await page.waitForTimeout(1000)

    // Try to add EVENT temperature ─────────────────────────────────────────
    await page.click('button:has-text("添加字段")')
    await waitForModalReady(page)

    // Change type to EVENT
    const typeSelect = page.locator('.n-select').first()
    if (await typeSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await typeSelect.click()
      await page.locator('.n-base-select-option:has-text("事件"), .n-base-select-option:has-text("EVENT")').first().click()
    }

    await page.locator('.n-drawer input[placeholder*="小写字母"]').fill('temperature')
    await page.locator('.n-drawer input[placeholder="名称"]').fill('温度二').catch(() => {})
    await page.locator('.n-drawer button:has-text("确认")').first().click()
    await page.waitForTimeout(1000)

    // Should show error – either in drawer/toast/alert
    const errorLocator = page.locator(
      '.n-alert, .n-form-item-feedback--error, .n-message--error, [class*="error"]'
    )
    await expect(errorLocator.first()).toBeVisible({ timeout: 8000 })
  })
})
