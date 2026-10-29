import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createDeviceRuntimeNativeClient, DeviceRuntimeNativeError } from './device-runtime-native-transport'

const ID = '11111111-1111-4111-8111-111111111111'

function makeClient(fetcher: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>) {
  const seen: Array<{ path: string; init?: RequestInit }> = []
  const client = createDeviceRuntimeNativeClient({
    fetch: async (input, init) => {
      seen.push({ path: String(input), init })
      return fetcher(input, init)
    },
    getToken: () => 'native-token',
    getLanguage: () => 'zh-CN'
  })
  return { client, seen }
}

test('exportReadings posts a raw telemetry export and returns the download id', async () => {
  const operation = { id: ID, state: 'succeeded', result: { downloadId: ID, checksum: 'a'.repeat(64) } }
  const { client, seen } = makeClient(
    async () => new Response(JSON.stringify({ data: operation, meta: { requestId: 'r' } }), { status: 202 })
  )
  const job = await client.exportReadings(
    ID,
    { identifiers: ['temp'], from: '2026-10-29T00:00:00.000Z', to: '2026-10-29T06:00:00.000Z', format: 'csv' },
    'idem-key-12345'
  )
  assert.deepEqual(job, { operationId: ID, state: 'succeeded', downloadId: ID, checksum: 'a'.repeat(64) })
  assert.equal(new URL(seen[0].path, 'http://local.test').pathname, `/api/v2/devices/${ID}/reading-exports`)
  assert.deepEqual(JSON.parse(String(seen[0].init?.body)), {
    kind: 'telemetry',
    identifiers: ['temp'],
    from: '2026-10-29T00:00:00.000Z',
    to: '2026-10-29T06:00:00.000Z',
    format: 'csv',
    aggregation: 'raw',
    window: null
  })
  assert.equal(new Headers(seen[0].init?.headers).get('Idempotency-Key'), 'idem-key-12345')
  await assert.rejects(
    () => client.exportReadings(ID, { identifiers: ['t'], from: 'a', to: 'b', format: 'csv' }, 'short'),
    /Idempotency-Key/
  )
})

test('downloadArtifact sends the token, reads the file name and surfaces problems', async () => {
  const ok = makeClient(
    async () =>
      new Response('identifier,observedAt,value\n', {
        headers: { 'Content-Disposition': 'attachment; filename="readings-20261029T000000Z.csv"' }
      })
  )
  const file = await ok.client.downloadArtifact(ID)
  assert.equal(file.fileName, 'readings-20261029T000000Z.csv')
  assert.equal(await file.blob.text(), 'identifier,observedAt,value\n')
  assert.equal(new Headers(ok.seen[0].init?.headers).get('Authorization'), 'Bearer native-token')
  assert.equal(new URL(ok.seen[0].path, 'http://local.test').pathname, `/api/v2/metadata-downloads/${ID}`)

  const gone = makeClient(
    async () =>
      new Response(
        JSON.stringify({
          type: 'about:blank',
          title: 'x',
          status: 410,
          detail: 'expired',
          instance: '/',
          code: 'GONE',
          requestId: 'r'
        }),
        {
          status: 410,
          headers: { 'Content-Type': 'application/json' }
        }
      )
  )
  await assert.rejects(
    () => gone.client.downloadArtifact(ID),
    (e: unknown) => e instanceof DeviceRuntimeNativeError && e.status === 410
  )
})

test('getReadingExport reads the job state, progress and failure detail', async () => {
  const operation = {
    id: ID,
    state: 'failed',
    progress: { total: 36, completed: 4, failed: 0 },
    failure: { code: 'EXPORT_TOO_LARGE', detail: '导出过大' }
  }
  const { client, seen } = makeClient(
    async () => new Response(JSON.stringify({ data: operation, meta: { requestId: 'r' } }), { status: 200 })
  )
  const job = await client.getReadingExport(ID)
  assert.equal(new URL(seen[0].path, 'http://local.test').pathname, `/api/v2/reading-exports/${ID}`)
  assert.equal(seen[0].init?.method, 'GET')
  assert.deepEqual(job, {
    operationId: ID,
    state: 'failed',
    downloadId: null,
    checksum: null,
    failure: '导出过大',
    progress: { total: 36, completed: 4, failed: 0 }
  })
})

test('runtime errors read as plain Chinese for 503 and generic 500, and keep specific details', async () => {
  const { runtimeErrorMessage } = await import('./device-runtime-native-transport')
  assert.match(runtimeErrorMessage(503, { detail: 'internal server error' } as never), /设备运行时暂时不可用/)
  assert.match(runtimeErrorMessage(500, { detail: 'internal server error' } as never), /服务暂时出错/)
  assert.equal(runtimeErrorMessage(422, { detail: 'identifier is required' } as never), 'identifier is required')
  assert.equal(runtimeErrorMessage(404, undefined), 'Device runtime request failed (404)')
})
