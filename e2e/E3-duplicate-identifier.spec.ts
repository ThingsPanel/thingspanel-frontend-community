/**
 * E3: 跨类型重名拒绝
 * 验收：创建 EVENT temperature 时，因已有 PROPERTY temperature 而报 409 / 错误提示
 */
import { test, expect } from '@playwright/test'

test.describe('E3: Cross-type duplicate identifier rejected', () => {
  test('shows error when creating EVENT with identifier already used by PROPERTY', async ({ page }) => {
    await page.goto('/thing-model')
    await page.waitForSelector('table, .n-data-table', { timeout: 10000 })

    // Create thing model
    await page.click('button:has-text("新建")')
    await page.waitForSelector('.n-modal', { timeout: 5000 })
    await page.fill('input[name="name"], input[placeholder*="名称"]', 'DupTest-' + Date.now())
    await page.click('button:has-text("确认"), button:has-text("保存")')
    await page.waitForURL(/\/thing-model\/detail/, { timeout: 10000 })

    // Add PROPERTY temperature ────────────────────────────────────────────
    await page.click('.n-tabs-tab:has-text("字段")')
    await page.click('button:has-text("添加字段")')
    await page.waitForSelector('.n-drawer', { timeout: 5000 })
    await page.fill('input[name="identifier"], input[placeholder*="标识符"]', 'temperature')
    await page.fill('input[name="name"], input[placeholder*="名称"]', '温度')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(800)

    // Try to add EVENT temperature ─────────────────────────────────────────
    await page.click('button:has-text("添加字段")')
    await page.waitForSelector('.n-drawer', { timeout: 5000 })

    // Change type to EVENT
    const typeSelect = page.locator('.n-select').first()
    await typeSelect.click()
    await page.click('.n-option:has-text("事件"), .n-select-option:has-text("EVENT")')

    await page.fill('input[name="identifier"], input[placeholder*="标识符"]', 'temperature')
    await page.fill('input[name="name"], input[placeholder*="名称"]', '温度告警')
    await page.click('button:has-text("保存")')

    // Should show error – either in drawer, toast, or alert
    const errorLocator = page.locator(
      '.n-alert, .n-form-item-feedback--error, .n-message--error, [class*="error"]'
    )
    await expect(errorLocator.first()).toBeVisible({ timeout: 8000 })

    // Also verify via API mock: field list should still have only 1 item
    const rows = page.locator('table tbody tr, .n-data-table-tr')
    const rowCount = await rows.count()
    expect(rowCount).toBeLessThanOrEqual(1)
  })
})
