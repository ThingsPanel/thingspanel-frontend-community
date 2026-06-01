/**
 * E1: 小白 90 秒建温湿度传感器
 * 验收：录屏计时 ≤ 90s，完整流程 thing model → item → 发布
 */
import { test, expect } from '@playwright/test'

test.describe('E1: Create temperature-humidity thing model end-to-end', () => {
  test('creates thing model, adds temperature field, publishes within 90s', async ({ page }) => {
    const start = Date.now()

    // ── 1. Navigate to thing model list ──────────────────────────────────
    await page.goto('/thing-model')
    await page.waitForSelector('table, .n-data-table', { timeout: 10000 })

    // ── 2. Create new thing model ─────────────────────────────────────────
    await page.click('button:has-text("新建"), button:has-text("New")')
    await page.waitForSelector('.n-modal, .n-dialog', { timeout: 5000 })
    await page.fill('input[placeholder*="名称"], input[name="name"]', '温湿度通用测试')
    await page.click('button:has-text("确认"), button:has-text("保存"), button:has-text("OK")')

    // ── 3. Wait for redirect to detail page ───────────────────────────────
    await page.waitForURL(/\/thing-model\/detail/, { timeout: 10000 })
    await expect(page.locator('.n-tag:has-text("DRAFT"), .n-tag:has-text("草稿")')).toBeVisible({ timeout: 5000 })

    // ── 4. Switch to 字段 tab ─────────────────────────────────────────────
    await page.click('.n-tabs-tab:has-text("字段"), .n-tab-pane >> text=字段')

    // ── 5. Add temperature PROPERTY field ────────────────────────────────
    await page.click('button:has-text("添加字段"), button:has-text("Add Field")')
    await page.waitForSelector('.n-drawer, .n-modal', { timeout: 5000 })

    // Type = PROPERTY (should be default)
    const typeSelect = page.locator('select[name="type"], .n-select').first()
    if (await typeSelect.isVisible()) {
      await typeSelect.click()
      await page.click('.n-select-option:has-text("属性"), .n-option:has-text("属性")')
    }

    await page.fill('input[placeholder*="标识符"], input[name="identifier"]', 'temperature')
    await page.fill('input[placeholder*="名称"], input[name="name"]', '温度')

    // Value kind = FLOAT
    const kindSelect = page.locator('.n-select').nth(1)
    if (await kindSelect.isVisible()) {
      await kindSelect.click()
      await page.click('.n-select-option:has-text("浮点"), .n-option:has-text("FLOAT")')
    }

    await page.click('button:has-text("保存"), button:has-text("Save")')
    await page.waitForTimeout(1000)

    // ── 6. Verify field appears in list ───────────────────────────────────
    await expect(page.locator('td:has-text("temperature"), .identifier:has-text("temperature")')).toBeVisible({ timeout: 5000 })

    // ── 7. Publish the thing model ────────────────────────────────────────
    await page.click('button:has-text("发布"), button:has-text("Publish")')
    // Confirm dialog if any
    const confirmBtn = page.locator('.n-modal button:has-text("确认"), .n-dialog button:has-text("确定")')
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click()
    }
    await expect(page.locator('.n-tag:has-text("PUBLISHED"), .n-tag:has-text("已发布")')).toBeVisible({ timeout: 10000 })

    const elapsed = (Date.now() - start) / 1000
    console.log(`E1 elapsed: ${elapsed.toFixed(1)}s`)
    expect(elapsed).toBeLessThan(90)
  })
})
