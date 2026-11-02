import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createFileAssetOperationKey,
  createFileAssetsNativeClient,
  FileAssetNativeError,
  type FileAsset
} from './file-assets-native-transport'
import type { MetadataNativeHttpOptions } from './metadata-native-http'

const asset: FileAsset = {
  id: '7b2c4c83-b8a7-4c5c-9177-0f79e46d4d58',
  contentType: 'image/png',
  sizeBytes: 8,
  checksum: 'a'.repeat(64),
  downloadUrl: 'https://assets.example.test/object?signature=capability',
  expiresAt: '2026-10-26T12:00:00Z'
}
const requestId = 'file-asset-request-1'
const envelope = { data: asset, meta: { requestId } }
const uploadFile = new File(['12345678'], 'cover.png', { type: 'image/png' })

function makeClient(fetcher: MetadataNativeHttpOptions['fetch']) {
  const seen: Array<{ path: string; init?: RequestInit }> = []
  const client = createFileAssetsNativeClient({
    fetch: async (input, init) => {
      seen.push({ path: String(input), init })
      return fetcher(input, init)
    },
    getToken: () => 'file-asset-test-token',
    getLanguage: () => 'zh-CN'
  })
  return { client, seen }
}

test('upload sends exact FormData fields and native auth headers without setting its own boundary', async () => {
  const { client, seen } = makeClient(
    async () =>
      new Response(JSON.stringify(envelope), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          'X-Request-Id': requestId,
          Location: `/api/v2/file-assets/${asset.id}`
        }
      })
  )

  const created = await client.upload(uploadFile, 'cover-upload-key-1')
  assert.deepEqual(created, { asset, location: `/api/v2/file-assets/${asset.id}`, requestId })
  assert.equal(seen.length, 1)
  assert.equal(seen[0].path, '/api/v2/file-assets')
  assert.equal(seen[0].init?.method, 'POST')
  assert.ok(seen[0].init?.body instanceof FormData)
  const form = seen[0].init?.body as FormData
  assert.equal(form.get('purpose'), 'template-image')
  assert.equal((form.get('file') as File).name, 'cover.png')
  assert.deepEqual(
    Array.from(new Uint8Array(await (form.get('file') as File).arrayBuffer())),
    [49, 50, 51, 52, 53, 54, 55, 56]
  )

  const headers = new Headers(seen[0].init?.headers)
  assert.equal(headers.get('Content-Type'), null)
  assert.equal(headers.get('Authorization'), 'Bearer file-asset-test-token')
  assert.equal(headers.get('Accept-Language'), 'zh-CN')
  assert.equal(headers.get('Accept'), 'application/json, application/problem+json')
  assert.equal(headers.get('Idempotency-Key'), 'cover-upload-key-1')
})

test('upload validates local media bounds and idempotency keys before making a request', async () => {
  const { client, seen } = makeClient(async () => new Response('{}', { status: 500 }))
  await assert.rejects(
    client.upload(new File(['x'], 'animation.gif', { type: 'image/gif' }), 'cover-upload-key-1'),
    /PNG, JPEG, or WebP/
  )
  await assert.rejects(
    client.upload(new File([''], 'empty.png', { type: 'image/png' }), 'cover-upload-key-1'),
    /between 1 byte and 10 MiB/
  )
  await assert.rejects(
    client.upload(
      new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' }),
      'cover-upload-key-1'
    ),
    /between 1 byte and 10 MiB/
  )
  await assert.rejects(client.upload(uploadFile, 'short'), /Idempotency-Key/)
  await assert.rejects(client.get('not-a-uuid'), /must be a UUID/)
  assert.equal(seen.length, 0)
})

test('upload requires the exact 201 status, resource Location, and matching request IDs', async () => {
  const wrongStatus = makeClient(
    async () =>
      new Response(JSON.stringify(envelope), {
        status: 200,
        headers: { 'X-Request-Id': requestId, Location: `/api/v2/file-assets/${asset.id}` }
      })
  )
  await assert.rejects(wrongStatus.client.upload(uploadFile, 'cover-upload-key-1'), error => {
    assert.ok(error instanceof FileAssetNativeError)
    assert.equal(error.status, 200)
    return true
  })
  assert.equal(wrongStatus.seen.length, 1)

  const missingLocation = makeClient(
    async () =>
      new Response(JSON.stringify(envelope), {
        status: 201,
        headers: { 'X-Request-Id': requestId }
      })
  )
  await assert.rejects(missingLocation.client.upload(uploadFile, 'cover-upload-key-1'), /Location/)

  const mismatchedRequestId = makeClient(
    async () =>
      new Response(JSON.stringify(envelope), {
        status: 201,
        headers: { 'X-Request-Id': 'different-request', Location: `/api/v2/file-assets/${asset.id}` }
      })
  )
  await assert.rejects(
    mismatchedRequestId.client.upload(uploadFile, 'cover-upload-key-1'),
    /inconsistent request identifiers/
  )
})

test('upload rejects unknown asset fields and oversized capability URLs without exposing their value', async () => {
  const withEnvelopeExtra = makeClient(
    async () =>
      new Response(JSON.stringify({ ...envelope, debug: 'unexpected' }), {
        status: 201,
        headers: { 'X-Request-Id': requestId, Location: `/api/v2/file-assets/${asset.id}` }
      })
  )
  await assert.rejects(withEnvelopeExtra.client.upload(uploadFile, 'cover-upload-key-1'), /invalid response envelope/)

  const withExtra = makeClient(
    async () =>
      new Response(
        JSON.stringify({
          ...envelope,
          data: { ...asset, extra: 'unexpected' }
        }),
        {
          status: 201,
          headers: { 'X-Request-Id': requestId, Location: `/api/v2/file-assets/${asset.id}` }
        }
      )
  )
  await assert.rejects(withExtra.client.upload(uploadFile, 'cover-upload-key-1'), /invalid asset shape/)

  const oversizedUrl = 's'.repeat(2049)
  const tooLong = makeClient(
    async () =>
      new Response(
        JSON.stringify({
          ...envelope,
          data: { ...asset, downloadUrl: oversizedUrl }
        }),
        {
          status: 201,
          headers: { 'X-Request-Id': requestId, Location: `/api/v2/file-assets/${asset.id}` }
        }
      )
  )
  await assert.rejects(tooLong.client.upload(uploadFile, 'cover-upload-key-1'), error => {
    assert.ok(error instanceof Error)
    assert.match(error.message, /invalid download URL/)
    assert.equal(error.message.includes(oversizedUrl), false)
    return true
  })
})

test('get returns the exact file asset DTO and requires strong ETag and matching request IDs', async () => {
  const { client, seen } = makeClient(
    async () =>
      new Response(JSON.stringify(envelope), {
        status: 200,
        headers: { ETag: '"asset-v1"', 'X-Request-Id': requestId }
      })
  )
  assert.deepEqual(await client.get('7b2c4c83-b8a7-4c5c-9177-0f79e46d4d58'), {
    asset,
    etag: '"asset-v1"',
    requestId
  })
  assert.equal(seen.length, 1)
  assert.equal(seen[0].path, `/api/v2/file-assets/${asset.id}`)
  assert.equal(seen[0].init?.method, 'GET')

  const weak = makeClient(
    async () =>
      new Response(JSON.stringify(envelope), {
        status: 200,
        headers: { ETag: 'W/"asset-v1"', 'X-Request-Id': requestId }
      })
  )
  await assert.rejects(weak.client.get(asset.id), /missing a strong ETag/)
})

test('native file requests preserve one-attempt Problem and Encore auth handling', async () => {
  for (const [status, body] of [
    [401, { code: 'UNAUTHENTICATED', message: 'invalid file-asset-test-token', details: null }],
    [
      503,
      {
        type: 'about:blank',
        title: 'Unavailable',
        status: 503,
        detail: 'retry file-asset-test-token',
        instance: '/api/v2/file-assets',
        code: 'UNAVAILABLE',
        requestId: 'r503'
      }
    ]
  ] as const) {
    const { client, seen } = makeClient(async () => new Response(JSON.stringify(body), { status }))
    await assert.rejects(client.get(asset.id), error => {
      assert.ok(error instanceof FileAssetNativeError)
      assert.equal(error.status, status)
      assert.equal(error.message.includes('file-asset-test-token'), false)
      assert.equal(error.message.includes(asset.downloadUrl), false)
      return true
    })
    assert.equal(seen.length, 1)
  }
})

test('caller retries retain the supplied idempotency key and no automatic retry occurs', async () => {
  let calls = 0
  const { client, seen } = makeClient(async () => {
    calls += 1
    if (calls === 1) return new Response('{"code":"UNAVAILABLE","message":"later","details":null}', { status: 503 })
    return new Response(JSON.stringify(envelope), {
      status: 201,
      headers: { 'X-Request-Id': requestId, Location: `/api/v2/file-assets/${asset.id}` }
    })
  })

  await assert.rejects(client.upload(uploadFile, 'stable-cover-key-1'))
  assert.equal(seen.length, 1)
  await client.upload(uploadFile, 'stable-cover-key-1')
  assert.equal(seen.length, 2)
  for (const request of seen) {
    assert.equal(new Headers(request.init?.headers).get('Idempotency-Key'), 'stable-cover-key-1')
    assert.equal((request.init?.body as FormData).get('purpose'), 'template-image')
  }
})

test('generated operation key is within the frozen header contract', () => {
  assert.match(createFileAssetOperationKey(), /^[A-Za-z0-9._:-]{8,128}$/)
})
