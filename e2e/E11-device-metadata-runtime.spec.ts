/**
 * E11: native metadata groups and the template -> device runtime binding.
 *
 * This is an API-level browser E2E: the browser runner supplies the same
 * tenant token and base URL as the UI, while assertions cover the business
 * contract that cannot be proven by a screenshot.
 */
import { test, expect } from '@playwright/test'

const apiBase = process.env.API_BASE_URL ?? 'http://localhost:4000'
const token = process.env.E2E_TOKEN ?? '11111111-4fe9-b409-67c3-111111111111:d616bcbb-0000-0000-0000-000000000000:TENANT_ADMIN:*'

function headers() {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

test.describe('E11: device metadata groups and runtime binding', () => {
  test('creates a group tree and projects a published template device binding', async ({ request }) => {
    const suffix = Date.now().toString()
    let rootId = ''
    let childId = ''
    let deviceId = ''
    let templateId = ''
    let thingModelId = ''

    try {
      const rootResponse = await request.post(`${apiBase}/api/device-groups`, {
        headers: headers(),
        data: { name: `E11-root-${suffix}` }
      })
      expect(rootResponse.ok()).toBeTruthy()
      rootId = (await rootResponse.json()).id

      const childResponse = await request.post(`${apiBase}/api/device-groups`, {
        headers: headers(),
        data: { name: `E11-child-${suffix}`, parent_id: rootId }
      })
      expect(childResponse.ok()).toBeTruthy()
      childId = (await childResponse.json()).id

      const treeResponse = await request.get(`${apiBase}/api/device-group-tree`, { headers: headers() })
      expect(treeResponse.ok()).toBeTruthy()
      const tree = await treeResponse.json()
      const root = tree.items.find((item: any) => item.id === rootId)
      expect(root?.children?.some((item: any) => item.id === childId)).toBeTruthy()

      const modelResponse = await request.post(`${apiBase}/api/thing-models`, {
        headers: headers(),
        data: { name: `E11-model-${suffix}`, status: 'DRAFT' }
      })
      expect(modelResponse.ok()).toBeTruthy()
      thingModelId = (await modelResponse.json()).id

      const itemResponse = await request.post(`${apiBase}/api/thing-models/${thingModelId}/items`, {
        headers: headers(),
        data: {
          type: 'PROPERTY',
          identifier: `e11_value_${suffix}`,
          name_i18n: { default: 'E11 value' },
          value_type: { kind: 'FLOAT' },
          access: { read: true, write: true }
        }
      })
      expect(itemResponse.ok()).toBeTruthy()

      const publishModelResponse = await request.post(`${apiBase}/api/thing-models/${thingModelId}/publish`, {
        headers: headers(),
        data: { changelog: 'E11 runtime binding' }
      })
      expect(publishModelResponse.ok()).toBeTruthy()
      const snapshotId = (await publishModelResponse.json()).id

      const templateResponse = await request.post(`${apiBase}/api/device-templates`, {
        headers: headers(),
        data: {
          name: `E11-template-${suffix}`,
          thing_model_id: thingModelId,
          thing_model_snapshot_id: snapshotId,
          protocol_type: 'MQTT',
          protocol_config: { broker_url: 'mqtt://localhost:1883' },
          status: 'DRAFT'
        }
      })
      expect(templateResponse.ok()).toBeTruthy()
      templateId = (await templateResponse.json()).id

      const publishTemplateResponse = await request.post(`${apiBase}/api/device-templates/${templateId}/publish`, {
        headers: headers()
      })
      expect(publishTemplateResponse.ok()).toBeTruthy()

      const deviceResponse = await request.post(`${apiBase}/api/devices`, {
        headers: headers(),
        data: { device_template_id: templateId, sn: `E11-device-${suffix}` }
      })
      expect(deviceResponse.ok()).toBeTruthy()
      deviceId = (await deviceResponse.json()).id

      const bindingResponse = await request.get(`${apiBase}/api/devices/${deviceId}/runtime-projection`, {
        headers: headers()
      })
      expect(bindingResponse.ok()).toBeTruthy()
      const binding = await bindingResponse.json()
      expect(binding.device_template_id).toBe(templateId)
      expect(binding.device_id).toBe(deviceId)
      expect(binding.legacy_device_config_id).toBe(templateId)
      expect(binding.legacy_device_id).toBe(deviceId)
      expect(['PENDING', 'READY']).toContain(binding.status)
    } finally {
      if (deviceId) await request.delete(`${apiBase}/api/devices/${deviceId}`, { headers: headers() })
      if (templateId) await request.delete(`${apiBase}/api/device-templates/${templateId}`, { headers: headers() })
      if (thingModelId) await request.delete(`${apiBase}/api/thing-models/${thingModelId}`, { headers: headers() })
      if (childId) await request.delete(`${apiBase}/api/device-groups/${childId}`, { headers: headers() })
      if (rootId) await request.delete(`${apiBase}/api/device-groups/${rootId}`, { headers: headers() })
    }
  })
})
