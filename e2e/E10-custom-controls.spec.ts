/**
 * E10: 自定义控制 Tab CRUD
 * 验收：在物模型详情页能创建/编辑/删除自定义控制，且 JSON 非法时不能保存
 */
import { test, expect } from '@playwright/test'

test.describe('E10: Custom Controls Tab CRUD', () => {
  const modelName = `CustomCtrl-Test-${Date.now()}`

  async function createThingModel(page: any) {
    await page.goto('/thing-model')
    await page.waitForSelector('table, .n-data-table', { timeout: 10000 })
    await page.click('button:has-text("新建"), button:has-text("New")')
    await page.waitForSelector('.n-modal, .n-dialog', { timeout: 5000 })
    await page.fill('input[placeholder*="名称"], input[name="name"]', modelName)
    await page.click('button:has-text("确认"), button:has-text("保存"), button:has-text("OK")')
    await page.waitForURL(/\/thing-model\/detail/, { timeout: 10000 })
  }

  test('can create, edit, and delete a custom control', async ({ page }) => {
    await createThingModel(page)

    // ── Switch to Custom Controls tab ─────────────────────────────────────
    await page.click('.n-tabs-tab:has-text("自定义控制"), .n-tabs-tab:has-text("Custom Controls")')
    await page.waitForTimeout(500)

    // ── Create a custom control ───────────────────────────────────────────
    await page.click('button:has-text("添加自定义控制"), button:has-text("Add Custom Control")')
    await page.waitForSelector('.n-modal, .n-card', { timeout: 5000 })

    await page.fill('input[placeholder*="按钮名称"], input[placeholder*="Button Name"]', '开灯')
    // Fill JSON content
    const contentArea = page.locator('textarea').first()
    await contentArea.fill('{"action":"on","brightness":100}')

    await page.click('button:has-text("确认"), button:has-text("Confirm")')
    await page.waitForTimeout(1000)

    // Verify the control appears in the table
    await expect(page.locator('td:has-text("开灯")')).toBeVisible({ timeout: 5000 })

    // ── Edit the custom control ───────────────────────────────────────────
    await page.click('button:has-text("编辑"), button:has-text("Edit")')
    await page.waitForSelector('.n-modal, .n-card', { timeout: 5000 })

    await page.fill('input[placeholder*="按钮名称"], input[placeholder*="Button Name"]', '开灯(已更新)')
    await page.click('button:has-text("确认"), button:has-text("Confirm")')
    await page.waitForTimeout(800)

    await expect(page.locator('td:has-text("开灯(已更新)")')).toBeVisible({ timeout: 5000 })

    // ── Delete the custom control ─────────────────────────────────────────
    await page.click('button:has-text("删除"), button:has-text("Delete")')
    // Confirm deletion popconfirm
    const confirmBtn = page.locator('.n-popconfirm button:has-text("确定"), .n-popconfirm button:has-text("Yes")')
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click()
    }
    await page.waitForTimeout(800)

    await expect(page.locator('td:has-text("开灯(已更新)")')).not.toBeVisible({ timeout: 5000 })
  })

  test('rejects invalid JSON in custom control content', async ({ page }) => {
    await createThingModel(page)

    await page.click('.n-tabs-tab:has-text("自定义控制"), .n-tabs-tab:has-text("Custom Controls")')
    await page.waitForTimeout(500)

    await page.click('button:has-text("添加自定义控制"), button:has-text("Add Custom Control")')
    await page.waitForSelector('.n-modal, .n-card', { timeout: 5000 })

    await page.fill('input[placeholder*="按钮名称"], input[placeholder*="Button Name"]', '测试非法JSON')
    const contentArea = page.locator('textarea').first()
    await contentArea.fill('{invalid json}')

    await page.click('button:has-text("确认"), button:has-text("Confirm")')
    await page.waitForTimeout(500)

    // Should show an error and NOT close the modal
    const modal = page.locator('.n-modal, .n-card').first()
    await expect(modal).toBeVisible({ timeout: 2000 })

    // Error message or validation status should appear
    const errorIndicator = page.locator(
      '.n-form-item-feedback--error, .n-message--error, .n-alert--error-type'
    )
    await expect(errorIndicator.first()).toBeVisible({ timeout: 3000 })
  })

  test('custom controls tab is readonly when thing model is published', async ({ page }) => {
    await createThingModel(page)

    // Publish the thing model
    await page.click('button:has-text("发布"), button:has-text("Publish")')
    const confirmPublish = page.locator('.n-modal button:has-text("确认"), .n-dialog button:has-text("确定")')
    if (await confirmPublish.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmPublish.click()
    }
    await expect(page.locator('.n-tag:has-text("已发布"), .n-tag:has-text("PUBLISHED")')).toBeVisible({ timeout: 10000 })

    // Switch to custom controls tab
    await page.click('.n-tabs-tab:has-text("自定义控制"), .n-tabs-tab:has-text("Custom Controls")')
    await page.waitForTimeout(500)

    // Add button should be disabled
    const addBtn = page.locator('button:has-text("添加自定义控制"), button:has-text("Add Custom Control")')
    await expect(addBtn).toBeDisabled({ timeout: 3000 })
  })
})
