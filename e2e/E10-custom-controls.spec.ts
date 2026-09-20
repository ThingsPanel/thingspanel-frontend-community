/**
 * E10: 自定义控制 Tab CRUD
 * 验收：在物模型详情页能创建/编辑/删除自定义控制，且 JSON 非法时不能保存
 * 注：后端 /v1/custom-command-controls 端点尚未实现时，CRUD 操作会失败但 UI 验证仍可测
 */
import { test, expect } from '@playwright/test'
import { createThingModel, waitForModalReady } from './helpers'

test.describe('E10: Custom Controls Tab CRUD', () => {
  test('custom controls tab renders and add button is present (DRAFT)', async ({ page }) => {
    await createThingModel(page, 'CustomCtrl-' + Date.now())

    // Switch to Custom Controls tab
    await page.locator('.n-tabs-tab').filter({ hasText: '自定义控制' }).click()
    await page.waitForTimeout(800)

    // Tab content should render
    await expect(page.locator('.n-data-table')).toBeVisible({ timeout: 5000 })

    // Add button should be enabled in DRAFT state
    const addBtn = page.locator('button:has-text("添加自定义控制"), button:has-text("Add Custom Control")')
    await expect(addBtn).toBeVisible({ timeout: 3000 })
    await expect(addBtn).not.toBeDisabled()
  })

  test('rejects invalid JSON in custom control content', async ({ page }) => {
    await createThingModel(page, 'CustomCtrl-JSON-' + Date.now())

    await page.locator('.n-tabs-tab').filter({ hasText: '自定义控制' }).click()
    await page.waitForTimeout(500)

    await page.click('button:has-text("添加自定义控制"), button:has-text("Add Custom Control")')
    await waitForModalReady(page)

    await page.fill('input[placeholder*="按钮名称"]', '测试非法JSON')
    const contentArea = page.locator('textarea').first()
    await contentArea.fill('{invalid json}')

    await page.locator('.n-modal button:has-text("确认")').click()
    await page.waitForTimeout(500)

    // Modal should NOT close (still visible) because validation failed
    const modal = page.locator('.n-modal').first()
    await expect(modal).toBeVisible({ timeout: 2000 })

    // Error indicator should appear
    const errorIndicator = page.locator(
      '.n-form-item-feedback--error, .n-message--error, .n-alert--error-type'
    )
    await expect(errorIndicator.first()).toBeVisible({ timeout: 3000 })
  })

  test('custom controls add button is disabled when thing model is published', async ({ page }) => {
    await createThingModel(page, 'CustomCtrl-Pub-' + Date.now())

    // Publish the thing model
    await page.click('button:has-text("发布")')
    await waitForModalReady(page).catch(() => {})
    const confirmPublish = page.locator('.n-modal button:has-text("确认"), .n-dialog button:has-text("确定")')
    if (await confirmPublish.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmPublish.click()
    }
    await expect(page.locator('.n-tag:has-text("已发布"), .n-tag:has-text("PUBLISHED")')).toBeVisible({ timeout: 15000 })

    // Switch to custom controls tab
    await page.locator('.n-tabs-tab').filter({ hasText: '自定义控制' }).click()
    await page.waitForTimeout(500)

    // Add button should be disabled
    const addBtn = page.locator('button:has-text("添加自定义控制"), button:has-text("Add Custom Control")')
    await expect(addBtn).toBeVisible({ timeout: 3000 })
    await expect(addBtn).toBeDisabled()
  })
})
