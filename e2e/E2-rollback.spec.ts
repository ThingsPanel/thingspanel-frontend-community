/**
 * E2: 改物模型字段量程后回滚
 * 验收：rollback 后字段约束恢复到 v1 值
 */
import { test, expect } from '@playwright/test'

test.describe('E2: Rollback to previous version after changing field range', () => {
  test('creates v1, modifies range, publishes v2, rolls back to v1', async ({ page }) => {
    await page.goto('/thing-model')
    await page.waitForSelector('table, .n-data-table', { timeout: 10000 })

    // Create and publish v1 ──────────────────────────────────────────────
    await page.click('button:has-text("新建"), button:has-text("New")')
    await page.waitForSelector('.n-modal', { timeout: 5000 })
    await page.fill('input[name="name"], input[placeholder*="名称"]', 'Rollback-Test-Model')
    await page.click('button:has-text("确认"), button:has-text("保存")')

    await page.waitForURL(/\/thing-model\/detail/, { timeout: 10000 })

    // Add item with min=-40, max=125 ──────────────────────────────────────
    await page.click('.n-tabs-tab:has-text("字段")')
    await page.click('button:has-text("添加字段")')
    await page.waitForSelector('.n-drawer', { timeout: 5000 })
    await page.fill('input[name="identifier"], input[placeholder*="标识符"]', 'temperature')
    await page.fill('input[name="name"], input[placeholder*="名称"]', '温度')
    // Select FLOAT
    const kindSel = page.locator('.n-select').nth(1)
    await kindSel.click()
    await page.click('.n-option:has-text("FLOAT"), .n-select-option:has-text("浮点")')
    // min=-40, max=125
    await page.fill('input[name="min"], input[placeholder*="最小"]', '-40')
    await page.fill('input[name="max"], input[placeholder*="最大"]', '125')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(500)

    // Publish v1
    await page.click('button:has-text("发布")')
    const confirmBtn = page.locator('.n-modal button:has-text("确认"), .n-dialog button:has-text("确定")')
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click()
    }
    await expect(page.locator('.n-tag:has-text("已发布"), .n-tag:has-text("PUBLISHED")')).toBeVisible({ timeout: 10000 })

    // Derive draft → change max to 80 → publish v2 ────────────────────────
    await page.click('button:has-text("派生草稿")')
    await page.waitForTimeout(1000)

    await page.click('.n-tabs-tab:has-text("字段")')
    await page.click('button:has-text("编辑"), [data-test="edit-item"]')
    await page.waitForSelector('.n-drawer', { timeout: 5000 })
    await page.fill('input[name="max"], input[placeholder*="最大"]', '80')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(500)

    await page.click('button:has-text("发布")')
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click()
    }
    await expect(page.locator('.n-tag:has-text("已发布"), .n-tag:has-text("PUBLISHED")')).toBeVisible({ timeout: 10000 })

    // Rollback to v1 ──────────────────────────────────────────────────────
    await page.click('.n-tabs-tab:has-text("版本")')
    await page.waitForTimeout(500)
    const rollbackBtn = page.locator('button:has-text("回滚"), [data-test="rollback-v1"]').first()
    await expect(rollbackBtn).toBeVisible({ timeout: 5000 })
    await rollbackBtn.click()

    const rollbackConfirm = page.locator('.n-modal button:has-text("确认")')
    if (await rollbackConfirm.isVisible({ timeout: 2000 }).catch(() => false)) {
      await rollbackConfirm.click()
    }
    await page.waitForTimeout(1000)

    // Verify max is back to 125 ───────────────────────────────────────────
    await page.click('.n-tabs-tab:has-text("字段")')
    await page.click('button:has-text("编辑")')
    await page.waitForSelector('.n-drawer', { timeout: 5000 })
    const maxInput = page.locator('input[name="max"], input[placeholder*="最大"]')
    const maxValue = await maxInput.inputValue()
    expect(maxValue).toBe('125')
  })
})
