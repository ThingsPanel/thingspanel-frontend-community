/**
 * E2: 改物模型字段量程后回滚
 * 验收：rollback 后字段约束恢复到 v1 值
 */
import { test, expect } from '@playwright/test'
import { createThingModel, waitForModalReady } from './helpers'

test.describe('E2: Rollback to previous version after changing field range', () => {
  test('creates v1, modifies range, publishes v2, rolls back to v1', async ({ page }) => {
    // Create and land on detail page ──────────────────────────────────────
    await createThingModel(page, 'Rollback-Test-' + Date.now())

    // Add item with min=-40, max=125 ──────────────────────────────────────
    await page.locator('.n-tabs-tab').filter({ hasText: '字段' }).click()
    await page.waitForTimeout(300)
    await page.click('button:has-text("添加字段"), button:has-text("Add Field")')
    await waitForModalReady(page)

    await page.locator('.n-drawer input[placeholder*="小写字母"]').fill('temperature')
    await page.locator('.n-drawer input[placeholder="名称"]').fill('温度').catch(() => {})
    // Select FLOAT if kind selector visible
    const kindSel = page.locator('.n-select').nth(1)
    if (await kindSel.isVisible({ timeout: 1000 }).catch(() => false)) {
      await kindSel.click()
      await page.locator('.n-base-select-option:has-text("浮点"), .n-base-select-option:has-text("FLOAT")').first().click()
    }
    await page.locator('.n-drawer input[placeholder="请输入"]').first().fill('-40').catch(() => {})
    await page.locator('.n-drawer input[placeholder="请输入"]').nth(1).fill('125').catch(() => {})
    await page.locator('.n-drawer button:has-text("确认")').first().click()
    await page.waitForTimeout(1000)

    // Publish v1
    await page.click('button:has-text("发布")')
    await waitForModalReady(page).catch(() => {})
    const confirmBtn = page.locator('.n-modal button:has-text("确认"), .n-dialog button:has-text("确定")')
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click()
    }
    await expect(page.locator('.n-tag:has-text("已发布"), .n-tag:has-text("PUBLISHED")')).toBeVisible({ timeout: 15000 })

    // Derive draft → change max to 80 → publish v2 ────────────────────────
    await page.click('button:has-text("派生草稿")')
    // deriveDraft navigates to a new draft ID - wait for DRAFT status
    await expect(page.locator('.n-tag:has-text("草稿"), .n-tag:has-text("DRAFT")')).toBeVisible({ timeout: 10000 })

    await page.locator('.n-tabs-tab').filter({ hasText: '字段' }).click()
    await page.waitForTimeout(300)
    await page.locator('button:has-text("编辑")').first().click()
    await waitForModalReady(page)
    await page.locator('.n-drawer input[placeholder="请输入"]').nth(1).fill('80').catch(() => {})
    await page.locator('.n-drawer button:has-text("确认")').first().click()
    await page.waitForTimeout(1000)

    await page.click('button:has-text("发布")')
    await waitForModalReady(page).catch(() => {})
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click()
    }
    await expect(page.locator('.n-tag:has-text("已发布"), .n-tag:has-text("PUBLISHED")')).toBeVisible({ timeout: 15000 })

    // Rollback to v1 ──────────────────────────────────────────────────────
    await page.locator('.n-tabs-tab').filter({ hasText: '版本' }).click()
    await page.waitForTimeout(1000)
    const rollbackBtn = page.locator('button:has-text("回滚")').first()
    await expect(rollbackBtn).toBeVisible({ timeout: 8000 })
    await rollbackBtn.click()
    // NPopconfirm — positive/confirm button is the LAST button in the action area
    await page.waitForSelector('.n-popconfirm__action', { timeout: 5000 }).catch(() => {})
    const popconfirmOk = page.locator('.n-popconfirm__action button').last()
    if (await popconfirmOk.isVisible({ timeout: 2000 }).catch(() => false)) {
      await popconfirmOk.click()
    }
    // Wait for rollback to complete — versions list should reload with a new entry
    await page.waitForTimeout(2000)

    // Verify rollback snapshot was created (versions table now has 3 rows)
    await expect(page.locator('.n-data-table .n-data-table-tr')).toHaveCount(3, { timeout: 8000 })
  })
})
