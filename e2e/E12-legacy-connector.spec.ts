/**
 * E12: old-page API contract through the strangler connector.
 *
 * The runner speaks the legacy /api/v1 contract while the connector routes
 * device, template, thing-model, and group calls to Encore.
 */
import { test, expect } from '@playwright/test'

const apiBase = process.env.LEGACY_CONNECTOR_BASE_URL ?? 'http://127.0.0.1:18080'
const token = process.env.E2E_TOKEN ?? 'ui:default:tenant_admin:*'

function headers() {
  return { 'x-token': token, 'Content-Type': 'application/json' }
}

test('legacy device metadata flow is served by the connector', async ({ request }) => {
  const suffix = Date.now().toString()
  let templateId = ''
  let alternateTemplateId = ''
  let deviceId = ''
  let groupId = ''

  try {
    const templateResponse = await request.post(`${apiBase}/api/v1/device/template`, {
      headers: headers(),
      data: {
        name: `E12-template-${suffix}`,
        description: 'legacy contract',
        label: 'e2e,legacy',
        web_chart_config: { type: 'line' }
      }
    })
    expect(templateResponse.ok()).toBeTruthy()
    const templatePayload = await templateResponse.json()
    expect(templatePayload.code).toBe(200)
    templateId = templatePayload.data.id

    const alternateTemplateResponse = await request.post(`${apiBase}/api/v1/device/template`, {
      headers: headers(),
      data: { name: `E12-template-alt-${suffix}`, description: 'legacy config switch' }
    })
    expect(alternateTemplateResponse.ok()).toBeTruthy()
    alternateTemplateId = (await alternateTemplateResponse.json()).data.id

    const templateListResponse = await request.get(`${apiBase}/api/v1/device/template`, {
      headers: headers(),
      params: { page: 1, page_size: 20, name: `E12-template-${suffix}` }
    })
    expect(templateListResponse.ok()).toBeTruthy()
    expect((await templateListResponse.json()).data.list.some((item: any) => item.id === templateId)).toBeTruthy()

    const modelCreateResponse = await request.post(`${apiBase}/api/v1/device/model/telemetry`, {
      headers: headers(),
      data: {
        params: {
          device_template_id: templateId,
          data_identifier: `e12_value_${suffix}`,
          data_name: 'E12 value',
          data_type: 'Number',
          unit: '°C',
          read_write_flag: 'RW'
        }
      }
    })
    expect(modelCreateResponse.ok()).toBeTruthy()
    expect((await modelCreateResponse.json()).data.data_identifier).toBe(`e12_value_${suffix}`)

    const modelListResponse = await request.get(`${apiBase}/api/v1/device/model/telemetry`, {
      headers: headers(),
      params: { device_template_id: templateId, page: 1, page_size: 20 }
    })
    expect(modelListResponse.ok()).toBeTruthy()
    const modelList = await modelListResponse.json()
    expect(modelList.data.list.some((item: any) => item.data_identifier === `e12_value_${suffix}`)).toBeTruthy()

    const deviceResponse = await request.post(`${apiBase}/api/v1/device`, {
      headers: headers(),
      data: { name: `E12-device-name-${suffix}`, device_number: `E12-device-${suffix}`, device_config_id: templateId }
    })
    expect(deviceResponse.ok()).toBeTruthy()
    const devicePayload = await deviceResponse.json()
    deviceId = devicePayload.data.id
    expect(devicePayload.data.name).toBe(`E12-device-name-${suffix}`)
    expect(devicePayload.data.device_config_id).toBe(templateId)

    const deviceSearchResponse = await request.get(`${apiBase}/api/v1/device`, {
      headers: headers(),
      params: { search: `E12-device-${suffix}`, page: 1, page_size: 20 }
    })
    expect(deviceSearchResponse.ok()).toBeTruthy()
    const deviceList = await deviceSearchResponse.json()
    expect(deviceList.data.list.some((item: any) => item.id === deviceId)).toBeTruthy()

    const selectorDeviceResponse = await request.get(`${apiBase}/api/v1/device/selector`, {
      headers: headers(),
      params: { search: `E12-device-${suffix}` }
    })
    expect(selectorDeviceResponse.ok()).toBeTruthy()
    expect((await selectorDeviceResponse.json()).data.some((item: any) => item.id === deviceId)).toBeTruthy()

    const updateConfigResponse = await request.put(`${apiBase}/api/v1/device/update/config`, {
      headers: headers(),
      data: { device_id: deviceId, device_config_id: alternateTemplateId }
    })
    expect(updateConfigResponse.ok()).toBeTruthy()
    expect((await updateConfigResponse.json()).data.device_config_id).toBe(alternateTemplateId)

    const switchedDeviceResponse = await request.get(`${apiBase}/api/v1/device/detail/${deviceId}`, { headers: headers() })
    expect(switchedDeviceResponse.ok()).toBeTruthy()
    expect((await switchedDeviceResponse.json()).data.device_config_id).toBe(alternateTemplateId)

    const activateResponse = await request.put(`${apiBase}/api/v1/device/active`, {
      headers: headers(),
      data: { device_number: `E12-device-${suffix}` }
    })
    expect(activateResponse.ok()).toBeTruthy()
    expect((await activateResponse.json()).data.activate_flag).toBe('active')

    const restoreConfigResponse = await request.put(`${apiBase}/api/v1/device/update/config`, {
      headers: headers(),
      data: { device_id: deviceId, device_config_id: templateId }
    })
    expect(restoreConfigResponse.ok()).toBeTruthy()
    expect((await restoreConfigResponse.json()).data.device_config_id).toBe(templateId)

    const checkResponse = await request.get(`${apiBase}/api/v1/device/check/E12-device-${suffix}`, {
      headers: headers()
    })
    expect(checkResponse.ok()).toBeTruthy()
    expect((await checkResponse.json()).data.is_available).toBeFalsy()

    const updateResponse = await request.put(`${apiBase}/api/v1/device`, {
      headers: headers(),
      data: { id: deviceId, name: `E12-device-renamed-${suffix}` }
    })
    expect(updateResponse.ok()).toBeTruthy()
    expect((await updateResponse.json()).data.name).toBe(`E12-device-renamed-${suffix}`)

    const selectorResponse = await request.get(`${apiBase}/api/v1/device/template/selector`, {
      headers: headers(),
      params: { name: `E12-template-${suffix}` }
    })
    expect(selectorResponse.ok()).toBeTruthy()
    expect((await selectorResponse.json()).data.some((item: any) => item.id === templateId)).toBeTruthy()

    const chartSelectResponse = await request.get(`${apiBase}/api/v1/device/template/chart/select`, {
      headers: headers()
    })
    expect(chartSelectResponse.ok()).toBeTruthy()
    expect((await chartSelectResponse.json()).data.some((item: any) => item.device_id === deviceId)).toBeTruthy()

    const chartTemplateResponse = await request.get(`${apiBase}/api/v1/device/template/chart`, {
      headers: headers(),
      params: { device_id: deviceId }
    })
    expect(chartTemplateResponse.ok()).toBeTruthy()
    expect((await chartTemplateResponse.json()).data.id).toBe(templateId)

    const groupResponse = await request.post(`${apiBase}/api/v1/device/group`, {
      headers: headers(),
      data: { name: `E12-group-${suffix}`, description: 'legacy group' }
    })
    expect(groupResponse.ok()).toBeTruthy()
    groupId = (await groupResponse.json()).data.id

    const rootGroupListResponse = await request.get(`${apiBase}/api/v1/device/group`, {
      headers: headers(),
      params: { parent_id: 0, page: 1, page_size: 20, name: `E12-group-${suffix}` }
    })
    expect(rootGroupListResponse.ok()).toBeTruthy()
    expect((await rootGroupListResponse.json()).data.list.some((item: any) => item.id === groupId)).toBeTruthy()

    const relationResponse = await request.post(`${apiBase}/api/v1/device/group/relation`, {
      headers: headers(),
      data: { group_id: groupId, device_id: deviceId }
    })
    expect(relationResponse.ok()).toBeTruthy()

    const groupedResponse = await request.get(`${apiBase}/api/v1/device/group/relation/list`, {
      headers: headers(),
      params: { group_id: groupId, page: 1, page_size: 20 }
    })
    expect(groupedResponse.ok()).toBeTruthy()
    const grouped = await groupedResponse.json()
    expect(grouped.data.list.some((item: any) => item.id === deviceId && item.name === `E12-device-renamed-${suffix}`)).toBeTruthy()

    const treeResponse = await request.get(`${apiBase}/api/v1/device/group/tree`, { headers: headers() })
    expect(treeResponse.ok()).toBeTruthy()
    const tree = await treeResponse.json()
    expect(tree.data.some((item: any) => item.id === groupId)).toBeTruthy()
  } finally {
    if (groupId) {
      if (deviceId) {
        await request.delete(`${apiBase}/api/v1/device/group/relation`, {
          headers: headers(),
          data: { group_id: groupId, device_id: deviceId }
        })
      }
      await request.delete(`${apiBase}/api/v1/device/group/${groupId}`, { headers: headers() })
    }
    if (deviceId) await request.delete(`${apiBase}/api/v1/device/${deviceId}`, { headers: headers() })
    if (templateId) await request.delete(`${apiBase}/api/v1/device/template/${templateId}`, { headers: headers() })
    if (alternateTemplateId) await request.delete(`${apiBase}/api/v1/device/template/${alternateTemplateId}`, { headers: headers() })
  }
})
