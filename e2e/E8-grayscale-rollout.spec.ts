/**
 * E8 – Snapshot consistency / "grayscale rollout":
 * After deriving a new draft and publishing v2, verify:
 *  1. v1 snapshot is immutable (old max=125 unchanged)
 *  2. v2 snapshot captures the new max=80
 *  3. A device template bound to v1 snapshot is unaffected by v2 publish
 *  4. bind-thing-model API updates template to new snapshot correctly
 *
 * Uses the API directly (no live devices needed).
 */

import { test, expect, request } from '@playwright/test'

const API = process.env.API_BASE_URL ?? 'http://localhost:4000'
const TOKEN = process.env.E2E_TOKEN ?? '11111111-4fe9-b409-67c3-111111111111:d616bcbb-0000-0000-0000-000000000000:TENANT_ADMIN:*'

async function api(method: string, path: string, body?: unknown) {
  const ctx = await request.newContext({
    baseURL: API,
    extraHTTPHeaders: { Authorization: `Bearer ${TOKEN}` },
  })
  return method === 'GET'
    ? ctx.get(path)
    : method === 'POST'
      ? ctx.post(path, { data: body })
      : method === 'PUT'
        ? ctx.put(path, { data: body })
        : ctx.delete(path)
}

test.describe('E8 – Snapshot consistency across versions', () => {
  let thingModelId: string
  let v1SnapshotId: string
  let v2SnapshotId: string
  let v2ThingModelId: string
  let templateId: string

  test.beforeAll(async () => {
    // 1. Create thing model with a temperature FLOAT property (max=125)
    const tmRes = await api('POST', '/api/thing-models', {
      name: `E8-TM-${Date.now()}`,
      description_i18n: { default: 'E8 snapshot consistency test' },
    })
    expect(tmRes.ok()).toBeTruthy()
    const tm = await tmRes.json()
    thingModelId = tm.id

    // 2. Add temperature property (max=125)
    const itemRes = await api('POST', `/api/thing-models/${thingModelId}/items`, {
      type: 'PROPERTY',
      identifier: 'temperature',
      name_i18n: { default: 'Temperature' },
      value_type: { kind: 'FLOAT', constraint: { min: -40, max: 125 } },
      access: { read: true },
    })
    expect(itemRes.ok()).toBeTruthy()

    // 3. Publish v1 → captures snapshot S1
    const pubRes = await api('POST', `/api/thing-models/${thingModelId}/publish`, {
      changelog: 'v1 baseline',
    })
    expect(pubRes.ok()).toBeTruthy()
    const pub = await pubRes.json()
    v1SnapshotId = pub.id

    // 4. Create device template bound to v1 snapshot
    const dtRes = await api('POST', '/api/device-templates', {
      name: `E8-Template-${Date.now()}`,
      thing_model_id: thingModelId,
      thing_model_snapshot_id: v1SnapshotId,
      protocol_type: 'MQTT',
      protocol_config: { broker_url: 'mqtt://localhost:1883' },
    })
    expect(dtRes.ok()).toBeTruthy()
    const dt = await dtRes.json()
    templateId = dt.id

    // Publish the template (requires protocol_type)
    const dtPubRes = await api('POST', `/api/device-templates/${templateId}/publish`, {})
    expect(dtPubRes.ok()).toBeTruthy()
  })

  test('Step 1 – v1 snapshot is immutable: temperature max=125 preserved', async () => {
    const versRes = await api('GET', `/api/thing-models/${thingModelId}/versions`)
    expect(versRes.ok()).toBeTruthy()
    const versions = await versRes.json()
    const items = versions.items ?? versions
    expect(items.length).toBeGreaterThanOrEqual(1)

    const v1 = items.find((v: any) => v.id === v1SnapshotId)
    expect(v1).toBeTruthy()

    // v1 snapshot content should have temperature with max=125
    const content = v1.content ?? v1
    const tempItem = (content.items as Array<any>)?.find(
      (it: any) => it.identifier === 'temperature'
    )
    expect(tempItem).toBeTruthy()
    expect(tempItem?.value_type?.constraint?.max).toBe(125)
  })

  test('Step 2 – derive v2 with narrowed temperature range (max=80)', async () => {
    // Derive a new draft
    const deriveRes = await api('POST', `/api/thing-models/${thingModelId}/derive-draft`, {})
    expect(deriveRes.ok()).toBeTruthy()
    const draft = await deriveRes.json()
    v2ThingModelId = draft.id

    // Find temperature item in draft
    const itemsRes = await api('GET', `/api/thing-models/${v2ThingModelId}/items`)
    expect(itemsRes.ok()).toBeTruthy()
    const itemsData = await itemsRes.json()
    const items = itemsData.items ?? itemsData
    const tempItem = (items as Array<{ id: string; identifier: string }>).find(
      it => it.identifier === 'temperature'
    )
    expect(tempItem).toBeTruthy()

    // Update temperature max to 80 via PUT
    const updateRes = await api('PUT', `/api/thing-models/${v2ThingModelId}/items/${tempItem!.id}`, {
      type: 'PROPERTY',
      identifier: 'temperature',
      name_i18n: { default: 'Temperature' },
      value_type: { kind: 'FLOAT', constraint: { min: -40, max: 80 } },
      access: { read: true },
    })
    expect(updateRes.ok()).toBeTruthy()

    // Publish v2
    const pubRes = await api('POST', `/api/thing-models/${v2ThingModelId}/publish`, {
      changelog: 'v2 narrowed range',
    })
    expect(pubRes.ok()).toBeTruthy()
    const pub = await pubRes.json()
    v2SnapshotId = pub.id
    expect(v2SnapshotId).toBeTruthy()
  })

  test('Step 3 – v2 snapshot has temperature max=80, v1 snapshot still has max=125', async () => {
    // v2 snapshot should have max=80
    const v2versRes = await api('GET', `/api/thing-models/${v2ThingModelId}/versions`)
    expect(v2versRes.ok()).toBeTruthy()
    const v2versions = await v2versRes.json()
    const v2items = v2versions.items ?? v2versions
    const v2snap = v2items.find((v: any) => v.id === v2SnapshotId)
    expect(v2snap).toBeTruthy()
    const v2TempItem = (v2snap.content?.items as Array<any>)?.find(
      (it: any) => it.identifier === 'temperature'
    )
    expect(v2TempItem?.value_type?.constraint?.max).toBe(80)

    // v1 snapshot of the ORIGINAL thing model should still have max=125
    const v1versRes = await api('GET', `/api/thing-models/${thingModelId}/versions`)
    expect(v1versRes.ok()).toBeTruthy()
    const v1versions = await v1versRes.json()
    const v1items = v1versions.items ?? v1versions
    const v1snap = v1items.find((v: any) => v.id === v1SnapshotId)
    expect(v1snap).toBeTruthy()
    const v1TempItem = (v1snap.content?.items as Array<any>)?.find(
      (it: any) => it.identifier === 'temperature'
    )
    expect(v1TempItem?.value_type?.constraint?.max).toBe(125)
  })

  test('Step 4 – device template bound to v1 snapshot still references v1 after v2 publish; upgrade via derive-draft', async () => {
    // Template should still be bound to v1 snapshot (not auto-migrated)
    const dtRes = await api('GET', `/api/device-templates/${templateId}`)
    expect(dtRes.ok()).toBeTruthy()
    const dt = await dtRes.json()
    expect(dt.thing_model_snapshot_id).toBe(v1SnapshotId)

    // To upgrade the device template to v2: derive a draft, update it, publish
    const deriveRes = await api('POST', `/api/device-templates/${templateId}/derive-draft`, {})
    expect(deriveRes.ok()).toBeTruthy()
    const draftDt = await deriveRes.json()
    const draftDtId: string = draftDt.id

    // Update the draft to reference the v2 thing model + snapshot via PUT
    const putRes = await api('PUT', `/api/device-templates/${draftDtId}`, {
      ...draftDt,
      thing_model_id: v2ThingModelId,
      thing_model_snapshot_id: v2SnapshotId,
    })
    expect(putRes.ok()).toBeTruthy()

    // Publish the upgraded draft
    const pubRes = await api('POST', `/api/device-templates/${draftDtId}/publish`, {})
    expect(pubRes.ok()).toBeTruthy()
    const published = await pubRes.json()
    expect(published.thing_model_snapshot_id).toBe(v2SnapshotId)
    expect(published.status).toBe('PUBLISHED')

    // Clean up draft
    await api('DELETE', `/api/device-templates/${draftDtId}`)
  })

  test.afterAll(async () => {
    if (templateId) await api('DELETE', `/api/device-templates/${templateId}`)
    if (v2ThingModelId) await api('DELETE', `/api/thing-models/${v2ThingModelId}`)
    if (thingModelId) await api('DELETE', `/api/thing-models/${thingModelId}`)
  })
})
