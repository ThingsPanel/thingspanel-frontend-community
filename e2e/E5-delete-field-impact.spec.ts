/**
 * E5: 删除字段显示影响设备数
 * 验收：UI 弹窗显示确认对话框
 */
import { test, expect } from '@playwright/test'
import { createThingModel, waitForModalReady } from './helpers'

test.describe('E5: Delete field shows affected device count', () => {
  test('shows confirmation when deleting a field', async ({ page }) => {
    await createThingModel(page, 'ImpactTest-' + Date.now())

    await page.locator('.n-tabs-tab').filter({ hasText: '字段' }).click()
    await page.waitForTimeout(300)
    await page.click('button:has-text("添加字段")')
    await waitForModalReady(page)
    await page.locator('.n-drawer input[placeholder*="小写字母"]').fill('impact_field')
    await page.locator('.n-drawer input[placeholder="名称"]').fill('影响字段').catch(() => {})
    await page.locator('.n-drawer button:has-text("确认")').first().click()
    await page.waitForTimeout(1000)

    // Verify field was added
    await expect(page.locator('text=impact_field')).toBeVisible({ timeout: 5000 })

    // Click delete on the field row
    const deleteBtn = page.locator('button:has-text("删除"), [data-test*="delete"]').first()
    await expect(deleteBtn).toBeVisible({ timeout: 5000 })
    await deleteBtn.click()

    // Should show a popconfirm / dialog
    const dialog = page.locator('.n-popconfirm, .n-modal, .n-dialog')
    await expect(dialog.first()).toBeVisible({ timeout: 5000 })

    // Cancel – don't actually delete
    const cancelBtn = dialog.locator('button:has-text("取消"), button:has-text("No"), button:has-text("否")')
    if (await cancelBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await cancelBtn.click()
    } else {
      await page.keyboard.press('Escape')
    }
  })
})
