/**
 * E1: 小白 90 秒建温湿度传感器
 * 验收：录屏计时 ≤ 90s，完整流程 thing model → item → 发布
 */
import { test, expect } from '@playwright/test'
import { createThingModel, waitForModalReady } from './helpers'

test.describe('E1: Create temperature-humidity thing model end-to-end', () => {
  test('creates thing model, adds temperature field, publishes within 90s', async ({ page }) => {
    const start = Date.now()

    // ── 1. Create new thing model and land on detail page ─────────────────
    await createThingModel(page, '温湿度通用测试-' + Date.now())
    await expect(page.locator('.n-tag:has-text("草稿"), .n-tag:has-text("DRAFT")')).toBeVisible({ timeout: 8000 })

    // ── 2. Switch to 字段 tab ─────────────────────────────────────────────
    await page.locator('.n-tabs-tab').filter({ hasText: '字段' }).click()
    await page.waitForTimeout(500)

    // ── 3. Add temperature PROPERTY field ────────────────────────────────
    await page.click('button:has-text("添加字段"), button:has-text("Add Field")')
    await waitForModalReady(page)

    // Identifier placeholder is the hint text, not "标识符" label
    await page.locator('.n-drawer input[placeholder*="小写字母"]').fill('temperature')
    await page.locator('.n-drawer input[placeholder="名称"]').fill('温度').catch(() => {})

    // Value kind = FLOAT if visible
    const kindSelect = page.locator('.n-select').filter({ hasText: /整数|INT|浮点|FLOAT/ }).first()
    if (await kindSelect.isVisible({ timeout: 1000 }).catch(() => false)) {
      await kindSelect.click()
      await page.locator('.n-base-select-option:has-text("浮点"), .n-base-select-option:has-text("FLOAT")').first().click()
    }

    await page.locator('.n-drawer button:has-text("确认"), .n-drawer button:has-text("Save")').first().click()
    await page.waitForTimeout(1500)

    // ── 4. Verify field appears ──────────────────────────────────────────
    await expect(page.locator('text=temperature')).toBeVisible({ timeout: 8000 })

    // ── 5. Publish ────────────────────────────────────────────────────────
    await page.click('button:has-text("发布"), button:has-text("Publish")')
    await waitForModalReady(page).catch(() => {})
    // Click confirm in publish dialog if it appeared
    const confirmBtn = page.locator('.n-modal button:has-text("确认"), .n-modal button:has-text("确定")')
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click()
    }
    await expect(page.locator('.n-tag:has-text("已发布"), .n-tag:has-text("PUBLISHED")')).toBeVisible({ timeout: 15000 })

    const elapsed = (Date.now() - start) / 1000
    console.log(`E1 elapsed: ${elapsed.toFixed(1)}s`)
    expect(elapsed).toBeLessThan(90)
  })
})
