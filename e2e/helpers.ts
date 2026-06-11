import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

/** Open thing-model list, create a draft model, and land on the detail page. */
export async function createThingModel(page: Page, name: string) {
  await page.goto('/thing-model')
  await page.waitForLoadState('domcontentloaded')

  await page.locator('button').filter({ hasText: /新建物模型|Create/i }).first().click()
  await waitForModalReady(page)

  const modal = page.locator('.n-modal').last()
  await modal.locator('input').first().fill(name)
  await modal.locator('button').filter({ hasText: /确认|确定|Confirm/i }).first().click()

  await page.waitForURL(/\/thing-model\/detail/, { timeout: 20000 })
  await expect(page.locator('.n-tag:has-text("草稿"), .n-tag:has-text("DRAFT")')).toBeVisible({ timeout: 8000 })
}

/** Wait until the topmost Naive UI modal or drawer is visible and settled. */
export async function waitForModalReady(page: Page) {
  const overlay = page.locator('.n-modal, .n-drawer').last()
  await expect(overlay).toBeVisible({ timeout: 10000 })
  await page.waitForTimeout(400)
}
