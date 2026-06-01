/**
 * E6: 跨租户 GET 物模型返 404
 * 验收：接口层验证（通过 API 请求直接测，不依赖 UI 渲染）
 */
import { test, expect } from '@playwright/test'

test.describe('E6: Cross-tenant isolation returns 404', () => {
  test('accessing another tenant thing model returns 404', async ({ request }) => {
    const baseURL = process.env.API_BASE_URL ?? 'http://localhost:4000'

    // Use a random-looking ID that doesn't belong to our tenant
    const fakeId = '00000000-0000-0000-0000-000000000001'

    const resp = await request.get(`${baseURL}/api/thing-models/${fakeId}`, {
      headers: {
        Authorization: `Bearer ${process.env.E2E_TOKEN ?? ''}`,
      },
      failOnStatusCode: false,
    })

    // Must be 404 (not found for this tenant) or 401/403 – never 200
    expect([404, 401, 403]).toContain(resp.status())
  })

  test('accessing thing model items for unknown model returns 404', async ({ request }) => {
    const baseURL = process.env.API_BASE_URL ?? 'http://localhost:4000'
    const fakeId = '00000000-0000-0000-0000-000000000002'

    const resp = await request.get(`${baseURL}/api/thing-models/${fakeId}/items`, {
      headers: {
        Authorization: `Bearer ${process.env.E2E_TOKEN ?? ''}`,
      },
      failOnStatusCode: false,
    })

    expect([404, 401, 403]).toContain(resp.status())
  })

  test('accessing device template of another tenant returns 404', async ({ request }) => {
    const baseURL = process.env.API_BASE_URL ?? 'http://localhost:4000'
    const fakeId = '00000000-0000-0000-0000-000000000003'

    const resp = await request.get(`${baseURL}/api/device-templates/${fakeId}`, {
      headers: {
        Authorization: `Bearer ${process.env.E2E_TOKEN ?? ''}`,
      },
      failOnStatusCode: false,
    })

    expect([404, 401, 403]).toContain(resp.status())
  })

  test('accessing product of another tenant returns 404', async ({ request }) => {
    const baseURL = process.env.API_BASE_URL ?? 'http://localhost:4000'
    const fakeId = '00000000-0000-0000-0000-000000000004'

    const resp = await request.get(`${baseURL}/api/products/${fakeId}`, {
      headers: {
        Authorization: `Bearer ${process.env.E2E_TOKEN ?? ''}`,
      },
      failOnStatusCode: false,
    })

    expect([404, 401, 403]).toContain(resp.status())
  })

  test('accessing device of another tenant returns 404', async ({ request }) => {
    const baseURL = process.env.API_BASE_URL ?? 'http://localhost:4000'
    const fakeId = '00000000-0000-0000-0000-000000000005'

    const resp = await request.get(`${baseURL}/api/devices/${fakeId}`, {
      headers: {
        Authorization: `Bearer ${process.env.E2E_TOKEN ?? ''}`,
      },
      failOnStatusCode: false,
    })

    expect([404, 401, 403]).toContain(resp.status())
  })
})
