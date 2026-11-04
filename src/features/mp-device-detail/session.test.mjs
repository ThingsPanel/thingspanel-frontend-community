import test from 'node:test'
import assert from 'node:assert/strict'
import { readLaunch, createApi } from './session.js'
import { loadDeviceModel } from './model.js'

function storage() {
  const data = new Map()
  return {
    getItem: (key) => data.get(key),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key)
  }
}
test('board launch preserves scoped tokens across refresh and rejects incomplete replacement', () => {
  const local = storage()
  const launch = { kind: 'board', boardId: 'board-a', token: 'platform-test', visToken: 'vis-test' }
  const session = readLaunch(new URLSearchParams({ launch: JSON.stringify(launch) }).toString(), local)
  assert.equal(session.boardId, 'board-a')
  assert.equal(session.visToken, 'vis-test')
  assert.equal(readLaunch('', local).kind, 'board')
  assert.throws(() =>
    readLaunch(new URLSearchParams({ launch: JSON.stringify({ ...launch, visToken: '' }) }).toString(), local)
  )
  assert.throws(() => readLaunch('', local), /失效/)
})
test('launch is tab-scoped, supports refresh, expires and clears invalid replacement', () => {
  const local = storage(),
    raw = new URLSearchParams({ launch: JSON.stringify({ token: 'test-token', deviceId: 'device-a' }) }).toString()
  assert.equal(readLaunch(raw, local).deviceId, 'device-a')
  assert.equal(readLaunch('', local).token, 'test-token')
  assert.throws(() => readLaunch('launch=%7B', local))
  assert.throws(() => readLaunch('', local), /失效/)
  local.setItem(
    'thingspanel:mp-device-session:v1',
    JSON.stringify({ token: 'test', deviceId: 'a', createdAt: Date.now() - 7200001 })
  )
  assert.throws(() => readLaunch('', local), /失效/)
})
test('API confines credentials, handles auth failures and cancels after disposal', async () => {
  const calls = []
  const context = createApi(
    { token: 'test-token', lang: 'zh-CN' },
    {
      origin: 'https://example.test',
      fetchImpl: async (url, options) => {
        calls.push({ url, options })
        return new Response(JSON.stringify({ code: 200, data: { ok: true } }))
      }
    }
  )
  assert.deepEqual(await context.api('device', { name: '测试' }), { ok: true })
  assert.equal(calls[0].url.origin, 'https://example.test')
  assert.equal(calls[0].options.redirect, 'error')
  assert.equal(calls[0].options.referrerPolicy, 'no-referrer')
  assert.equal(calls[0].url.searchParams.has('token'), false)
  for (const path of [
    'https://other.test/api/v1/device',
    '//other.test/api/v1/device',
    '/api/v1/%2e%2e/%2e%2e/private'
  ])
    await assert.rejects(context.request(path), /无效/)
  context.dispose()
  await assert.rejects(context.api('device'), /关闭/)
  for (const status of [401, 403]) {
    const denied = createApi(
      { token: 'test' },
      { origin: 'https://example.test', fetchImpl: async () => new Response('{}', { status }) }
    )
    await assert.rejects(denied.api('device'), status === 401 ? /失效/ : /无权/)
  }
})
test('legacy empty chart falls back, native binding must match pinned snapshot', async () => {
  const legacy = await loadDeviceModel(
    { device_config: { device_template_id: 'legacy' } },
    { api: async (path) => (path.startsWith('device/template/') ? { app_chart_config: '[]' } : []) }
  )
  assert.equal(legacy.config, null)
  const binding = {
    native_thing_model_id: 'model',
    native_thing_model_snapshot_id: 'snapshot',
    native_thing_model_revision: 2,
    native_binding_revision: 1
  }
  const context = {
    request: async () => ({
      modelID: 'model',
      snapshotID: 'snapshot',
      publishedRevision: 2,
      model: {
        fields: [
          { identifier: 'read', kind: 'ATTRIBUTE', valueType: { kind: 'FLOAT' } },
          { identifier: 'write', kind: 'COMMAND', parameters: [] }
        ]
      },
      resources: {}
    })
  }
  const result = await loadDeviceModel({ device_config: binding }, context)
  assert.equal(result.fields[0].writable, false)
  assert.equal(result.fields[1].writable, true)
  await assert.rejects(
    loadDeviceModel({ device_config: { ...binding, native_binding_revision: 0 } }, context),
    /不完整/
  )
  await assert.rejects(
    loadDeviceModel({ device_config: { ...binding, native_thing_model_revision: 3 } }, context),
    /不一致/
  )
})
