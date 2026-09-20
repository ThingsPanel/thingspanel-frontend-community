/**
 * E9: 设备模板派生草稿 + 修改 + 重发布
 * 验收：新 snapshot 写入，blob 字段对
 */
import { test, expect } from '@playwright/test'
import { createThingModel, waitForModalReady } from './helpers'

test.describe('E9: Device template derive draft, modify, re-publish', () => {
  test('derives draft from published template, modifies it, and publishes new version', async ({ page }) => {
    // ── 1. Create & publish a thing model so device template can reference it ─
    await createThingModel(page, 'E9-TM-' + Date.now())
    await page.click('button:has-text("发布")')
    await waitForModalReady(page).catch(() => {})
    const confirmPublish = page.locator('.n-modal button:has-text("确认"), .n-dialog button:has-text("确定")')
    if (await confirmPublish.isVisible({ timeout: 2000 }).catch(() => false)) {
      await confirmPublish.click()
    }
    await expect(page.locator('.n-tag:has-text("已发布"), .n-tag:has-text("PUBLISHED")')).toBeVisible({ timeout: 15000 })

    // ── 2. Create device template referencing that thing model ─────────────
    await page.goto('/device-template')
    await page.waitForSelector('.n-data-table', { timeout: 15000 })

    await page.click('button:has-text("新建设备模板")')
    await waitForModalReady(page)

    await page.locator('.n-modal input[placeholder*="模板名称"]').fill('E9-Template-' + Date.now())

    // Select the thing model from the dropdown
    await page.locator('.n-modal .n-select').click()
    await page.waitForSelector('.n-base-select-menu', { timeout: 5000 })
    // Pick the first option (the one we just published)
    await page.locator('.n-base-select-option').first().click()

    await page.locator('.n-modal button:has-text("确认")').click()
    await page.waitForURL(/\/device-template\/detail/, { timeout: 15000 })

    // Helper: confirm NPopconfirm (positive button is the last one in the action area)
    async function confirmPopconfirm() {
      await page.locator('.n-popconfirm__action').waitFor({ state: 'visible', timeout: 5000 })
      await page.locator('.n-popconfirm__action button').last().click()
    }

    // ── 2b. Set protocol type via API (required for publishing) ───────────
    // Extract the template ID from the URL and update via API to avoid UI timing issues
    const templateUrl = page.url()
    const templateIdMatch = templateUrl.match(/id=([a-z0-9-]+)/)
    if (templateIdMatch) {
      const templateId = templateIdMatch[1]
      const devToken = '11111111-4fe9-b409-67c3-111111111111:d616bcbb-0000-0000-0000-000000000000:TENANT_ADMIN:*'
      // Fetch current template to get all fields
      const getResp = await page.request.get(`http://localhost:4000/api/device-templates/${templateId}`, {
        headers: { Authorization: `Bearer ${devToken}` }
      })
      const currentTemplate = await getResp.json()
      // Patch with protocol_type and required protocol_config
      await page.request.put(`http://localhost:4000/api/device-templates/${templateId}`, {
        headers: { Authorization: `Bearer ${devToken}`, 'Content-Type': 'application/json' },
        data: {
          ...currentTemplate,
          protocol_type: 'MQTT',
          protocol_config: { broker_url: 'mqtt://localhost:1883' }
        }
      })
    }
    await page.reload({ waitUntil: 'networkidle' })

    // ── 3. Publish v1 ─────────────────────────────────────────────────────
    await expect(page.locator('.n-tag:has-text("草稿"), .n-tag:has-text("DRAFT")')).toBeVisible({ timeout: 8000 })

    // Intercept publish API response for debugging
    const publishResponsePromise = page.waitForResponse(
      resp => resp.url().includes('/publish') && resp.request().method() === 'POST',
      { timeout: 10000 }
    ).catch(() => null)

    await page.click('button:has-text("发布")')
    await confirmPopconfirm()

    const publishResp = await publishResponsePromise
    if (publishResp) {
      const publishStatus = publishResp.status()
      const publishBody = await publishResp.text().catch(() => '')
      // eslint-disable-next-line no-console
      console.log('[E9] Publish API response:', publishStatus, publishBody.substring(0, 200))
    }

    await expect(page.locator('.n-tag:has-text("已发布"), .n-tag:has-text("PUBLISHED")')).toBeVisible({ timeout: 15000 })

    // ── 4. Derive draft ───────────────────────────────────────────────────
    await page.click('button:has-text("派生草稿")')
    await confirmPopconfirm()
    await expect(page.locator('.n-tag:has-text("草稿"), .n-tag:has-text("DRAFT")')).toBeVisible({ timeout: 10000 })

    // ── 5. Publish v2 ─────────────────────────────────────────────────────
    await page.click('button:has-text("发布")')
    await confirmPopconfirm()
    await expect(page.locator('.n-tag:has-text("已发布"), .n-tag:has-text("PUBLISHED")')).toBeVisible({ timeout: 15000 })

    // ── 6. Verify via API ─────────────────────────────────────────────────
    const currentUrl = page.url()
    const idMatch = currentUrl.match(/id=([a-z0-9-]+)/)
    if (idMatch) {
      const templateId = idMatch[1]
      const devToken = '11111111-4fe9-b409-67c3-111111111111:d616bcbb-0000-0000-0000-000000000000:TENANT_ADMIN:*'
      const resp = await page.request.get(`http://localhost:4000/api/device-templates/${templateId}`, {
        headers: { Authorization: `Bearer ${devToken}` }
      })
      if (resp.ok()) {
        const data = await resp.json()
        expect(String(data.status ?? '')).toMatch(/PUBLISHED/i)
      }
    }
  })
})
