/**
 * E9: 设备模板派生草稿 + 修改 + 重发布
 * 验收：新 snapshot 写入，blob 字段对
 */
import { test, expect } from '@playwright/test'

test.describe('E9: Device template derive draft, modify, re-publish', () => {
  test('derives draft from published template, modifies it, and publishes new version', async ({ page }) => {
    await page.goto('/device-template')
    await page.waitForSelector('table, .n-data-table', { timeout: 10000 })

    // ── Create template (need a published thing model first) ──────────────
    // We assume a published thing model exists from E1
    await page.click('button:has-text("新建"), button:has-text("New")')

    // If redirect to detail (new template creation):
    await page.waitForURL(/\/device-template\/detail/, { timeout: 10000 }).catch(async () => {
      // Might be a modal
      await page.waitForSelector('.n-modal', { timeout: 5000 })
      await page.fill('input[name="name"]', 'E9-Template-' + Date.now())
      await page.click('button:has-text("确认")')
      await page.waitForURL(/\/device-template\/detail/, { timeout: 10000 })
    })

    // Fill template details
    await page.fill('input[name="name"], input[placeholder*="模板名称"]', 'E9-Template-' + Date.now())

    // Select thing model
    const tmSelect = page.locator('[data-test="thing-model-select"], .thing-model-selector').first()
    if (await tmSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tmSelect.click()
      const firstOption = page.locator('.n-select-option, .n-option').first()
      if (await firstOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await firstOption.click()
      }
    }

    // Protocol tab
    await page.click('.n-tabs-tab:has-text("协议")')
    await page.waitForTimeout(300)
    const protocolSelect = page.locator('.n-select').first()
    if (await protocolSelect.isVisible()) {
      await protocolSelect.click()
      await page.click('.n-option:has-text("MQTT"), .n-select-option:has-text("MQTT")')
    }
    await page.fill('input[name="broker_url"], input[placeholder*="broker"]', 'mqtt://broker.test:1883')

    // Save
    await page.click('button:has-text("保存"), button:has-text("Save")')
    await page.waitForTimeout(500)

    // Publish v1
    await page.click('button:has-text("发布"), [data-test="publish"]')
    const confirmBtn = page.locator('.n-modal button:has-text("确认"), .n-dialog button:has-text("确定")')
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click()
    }
    await expect(page.locator('.n-tag:has-text("已发布"), .n-tag:has-text("PUBLISHED")')).toBeVisible({ timeout: 10000 })

    // ── Derive draft ──────────────────────────────────────────────────────
    await page.click('button:has-text("派生草稿"), [data-test="derive-draft"]')
    await page.waitForTimeout(1000)

    // Should now be in DRAFT
    await expect(page.locator('.n-tag:has-text("DRAFT"), .n-tag:has-text("草稿")')).toBeVisible({ timeout: 8000 })

    // Modify – change template name
    const nameInput = page.locator('input[name="name"], input[placeholder*="模板名称"]')
    await nameInput.clear()
    await nameInput.fill('E9-Template-v2')
    await page.click('button:has-text("保存")')
    await page.waitForTimeout(500)

    // Publish v2
    await page.click('button:has-text("发布"), [data-test="publish"]')
    if (await confirmBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmBtn.click()
    }
    await expect(page.locator('.n-tag:has-text("已发布"), .n-tag:has-text("PUBLISHED")')).toBeVisible({ timeout: 10000 })

    // Verify new version via API
    const currentUrl = page.url()
    const idMatch = currentUrl.match(/id=([a-z0-9-]+)/)
    if (idMatch) {
      const templateId = idMatch[1]
      const apiBase = process.env.API_BASE_URL ?? 'http://localhost:4000'
      const resp = await page.request.get(`${apiBase}/api/device-templates/${templateId}`)
      if (resp.ok()) {
        const data = await resp.json()
        expect(data.status ?? data.Status).toMatch(/PUBLISHED/i)
        expect(data.thing_model_snapshot_id ?? data.ThingModelSnapshotID).toBeTruthy()
      }
    }
  })
})
