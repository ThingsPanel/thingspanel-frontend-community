import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

type ModuleExports = Record<string, any>

function loadModule(path: URL, dependencies: Record<string, ModuleExports>) {
  const { outputText } = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
  })
  const module = { exports: {} as ModuleExports }
  new Function('require', 'module', 'exports', outputText)(
    (id: string) => {
      if (!(id in dependencies)) throw new Error(`Unexpected dependency ${id}`)
      return dependencies[id]
    },
    module,
    module.exports
  )
  return module.exports
}

const testDirectory = new URL('.', import.meta.url)
const httpModule = loadModule(new URL('./metadata-native-http.ts', testDirectory), {})
const deviceModule = loadModule(new URL('./device-native-transport.ts', testDirectory), {
  './metadata-native-http': httpModule
})
const localStg = { get: (key: string) => (key === 'token' ? 'mock-storage-token' : 'zh-CN') }
const infoModule = loadModule(new URL('./device-info-native.ts', testDirectory), {
  '@/utils/storage': { localStg },
  './metadata-native-http': httpModule,
  './device-native-transport': deviceModule
})

const { createDeviceInfoNativeClient, encodeInfoPayload, readDeviceInfoTokens } = infoModule
const { DeviceNativeError } = deviceModule

function responseBody(customFields: string, location = 'null', requestId = 'info-read-1') {
  return `{"data":{"id":"device-1","customFields":${customFields},"location":${location}},"meta":{"requestId":"${requestId}"}}`
}

function makeClient(fetcher: typeof globalThis.fetch) {
  const seen: Array<{ input: string; init?: RequestInit }> = []
  const client = createDeviceInfoNativeClient({
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      seen.push({ input: String(input), init })
      return fetcher(input, init)
    },
    getToken: () => 'device-info-test-token',
    getLanguage: () => 'zh-CN'
  })
  return { client, seen }
}

test('raw reader preserves large numeric tokens, escaped strings, and prototype-like own keys', () => {
  const escaped = 'quote " slash / braces {} brackets [] and backslash \\'
  const fields = `{"large":9007199254740993,"precise":1.000000000000000001,"escaped":${JSON.stringify(escaped)},"__proto__ownkey":false}`
  const location = '{"latitude":1.000000000000000001,"longitude":-9007199254740993,"address":"A/B {} []"}'
  const tokens = readDeviceInfoTokens(responseBody(fields, location))

  assert.equal(tokens.customFieldTokens.large, '9007199254740993')
  assert.equal(tokens.customFieldTokens.precise, '1.000000000000000001')
  assert.equal(tokens.customFieldTokens.escaped, JSON.stringify(escaped))
  assert.equal(tokens.customFieldTokens.__proto__ownkey, 'false')
  assert.equal(Object.getPrototypeOf(tokens.customFieldTokens), null)
  assert.equal(tokens.locationTokens?.latitude, '1.000000000000000001')
  assert.equal(tokens.locationTokens?.longitude, '-9007199254740993')
  assert.equal(tokens.locationTokens?.address, '"A/B {} []"')
})

test('payload encoder sends only supplied tokens, omits undefined, and encodes null location as clear', () => {
  const customFields = Object.assign(Object.create(null), {
    untouched: '9007199254740993',
    precise: '1.000000000000000001',
    escaped: JSON.stringify('quote " slash / braces {} brackets []')
  })
  const location = Object.assign(Object.create(null), {
    latitude: '1.000000000000000001',
    longitude: '-9007199254740993',
    address: JSON.stringify('Unit 4 / A{}[]')
  })

  assert.equal(
    encodeInfoPayload(customFields, undefined),
    '{"customFields":{"untouched":9007199254740993,"precise":1.000000000000000001,"escaped":"quote \\" slash / braces {} brackets []"}}'
  )
  assert.equal(
    encodeInfoPayload(undefined, location),
    '{"location":{"latitude":1.000000000000000001,"longitude":-9007199254740993,"address":"Unit 4 / A{}[]"}}'
  )
  assert.equal(encodeInfoPayload(customFields, null).endsWith(',"location":null}'), true)
  assert.throws(() => encodeInfoPayload(undefined, undefined), /没有需要保存的设备资料/)
})

test('factory GET and update use the native device path, auth, metadata, strong ETag, and byte-exact retries', async () => {
  const escaped = 'quote " slash / braces {} brackets []'
  const fields = `{"large":9007199254740993,"precise":1.000000000000000001,"disabledHistory":false,"escaped":${JSON.stringify(escaped)},"__proto__ownkey":true}`
  const raw = responseBody(fields, '{"latitude":1.000000000000000001,"longitude":0,"address":"Yard"}', 'accepted-info')
  const fetcher: typeof globalThis.fetch = async () =>
    new Response(raw, { status: 200, headers: { ETag: '"device-v7"' } })
  const { client, seen } = makeClient(fetcher)

  const initial = await client.get('device/1')
  assert.equal(initial.device.id, 'device-1')
  assert.equal(initial.etag, '"device-v7"')
  assert.equal(initial.customFieldTokens.large, '9007199254740993')
  assert.equal(initial.customFieldTokens.precise, '1.000000000000000001')
  assert.equal(initial.customFieldTokens.escaped, JSON.stringify(escaped))
  assert.equal(initial.customFieldTokens.__proto__ownkey, 'true')
  assert.equal(initial.locationTokens?.latitude, '1.000000000000000001')
  assert.equal(seen[0].input, '/api/v2/devices/device%2F1')
  assert.equal(seen[0].init?.method, 'GET')
  assert.equal(new Headers(seen[0].init?.headers).get('Authorization'), 'Bearer device-info-test-token')
  assert.equal(new Headers(seen[0].init?.headers).get('Accept-Language'), 'zh-CN')

  const body =
    '{"customFields":{"large":9007199254740993,"precise":1.000000000000000001,"disabledHistory":false},"location":null}'
  await client.update('device/1', body, initial.etag, 'info-save-key-0001')
  await client.update('device/1', body, initial.etag, 'info-save-key-0001')

  for (const call of seen.slice(1)) {
    assert.equal(call.input, '/api/v2/devices/device%2F1')
    assert.equal(call.init?.method, 'PATCH')
    assert.equal(call.init?.body, body)
    assert.equal(call.init?.redirect, 'manual')
    const headers = new Headers(call.init?.headers)
    assert.equal(headers.get('If-Match'), initial.etag)
    assert.equal(headers.get('Idempotency-Key'), 'info-save-key-0001')
    assert.equal(headers.get('Authorization'), 'Bearer device-info-test-token')
  }
})

test('factory preserves typed 400, 401, and 412 failures without retry', async () => {
  for (const status of [400, 401, 412]) {
    const code = status === 400 ? 'INVALID_ARGUMENT' : status === 401 ? 'UNAUTHENTICATED' : 'FAILED_PRECONDITION'
    const problem = {
      type: 'about:blank',
      title: 'Request failed',
      status,
      detail: 'request rejected',
      instance: '/api/v2/devices/device-1',
      code,
      requestId: `failure-${status}`
    }
    const { client, seen } = makeClient(
      async () =>
        new Response(JSON.stringify(problem), {
          status,
          headers: { 'Content-Type': 'application/problem+json' }
        })
    )
    await assert.rejects(client.get('device-1'), (error: Error) => {
      assert.ok(error instanceof DeviceNativeError)
      const typedError = error as Error & { status: number; code?: string }
      assert.equal(typedError.status, status)
      assert.equal(typedError.code, code)
      return true
    })
    assert.equal(seen.length, 1)
  }
})

test('parallel GET calls keep each response raw capture isolated', async () => {
  const deferred = <T>() => {
    // The callback parameter appears only in this generic type signature.
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    let settle!: (value: T) => void
    const promise = new Promise<T>(resolve => {
      settle = resolve
    })
    return { promise, settle }
  }
  const pending = new Map<string, ReturnType<typeof deferred<Response>>>()
  const fetcher: typeof globalThis.fetch = async input => {
    const call = deferred<Response>()
    pending.set(String(input), call)
    return call.promise
  }
  const { client } = makeClient(fetcher)
  const first = client.get('device-A')
  const second = client.get('device-B')

  const bodyA = responseBody('{"value":9007199254740993}', 'null', 'read-A')
  const bodyB = responseBody('{"value":1.000000000000000001}', 'null', 'read-B')
  await new Promise<void>(resolve => setImmediate(resolve))
  const resolveA = pending.get('/api/v2/devices/device-A')
  const resolveB = pending.get('/api/v2/devices/device-B')
  assert.ok(resolveA)
  assert.ok(resolveB)
  resolveB.settle(new Response(bodyB, { headers: { ETag: '"etag-B"' } }))
  resolveA.settle(new Response(bodyA, { headers: { ETag: '"etag-A"' } }))

  const [resultA, resultB] = await Promise.all([first, second])
  assert.equal(resultA.etag, '"etag-A"')
  assert.equal(resultA.customFieldTokens.value, '9007199254740993')
  assert.equal(resultB.etag, '"etag-B"')
  assert.equal(resultB.customFieldTokens.value, '1.000000000000000001')
})
