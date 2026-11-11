import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createNativeCredentialAndRefresh,
  createNativeCredentialAttempt,
  nativeCredentialIdentityParts,
  shouldRetainNativeCredentialAttempt
} from './native-device-credentials-flow'

test('empty legacy identity aliases cannot hide the current account or tenant', () => {
  assert.deepEqual(
    nativeCredentialIdentityParts({ id: 'account-a', userId: '', tenantId: '', tenant_id: 'tenant-a' }),
    {
      subjectId: 'account-a',
      tenantId: 'tenant-a'
    }
  )
  assert.equal(nativeCredentialIdentityParts({ id: 'account-b', userId: '' }).subjectId, 'account-b')
  assert.equal(nativeCredentialIdentityParts({ id: '', userId: 'alternate-account' }).subjectId, 'alternate-account')
})

test('credential attempt freezes its payload and reuses its idempotency key after uncertain responses', () => {
  const payload = { kind: 'token' as const, secret: 'synthetic-secret' }
  const attempt = createNativeCredentialAttempt('device-1', payload, 'credential-create-key-1')
  payload.secret = 'edited-after-submit'

  assert.deepEqual(attempt.payload, { kind: 'token', secret: 'synthetic-secret' })
  assert.equal(attempt.key, 'credential-create-key-1')
  assert.equal(shouldRetainNativeCredentialAttempt(401, false, true), true)
  assert.equal(shouldRetainNativeCredentialAttempt(409, false, true), true)
  assert.equal(shouldRetainNativeCredentialAttempt(422, false, true), true)
  assert.equal(shouldRetainNativeCredentialAttempt(422, false, false), false)
})

test('a summary refresh failure after creation keeps the in-memory secret and never calls create again', async () => {
  const attempt = createNativeCredentialAttempt(
    'device-1',
    { kind: 'username_password', secret: 'synthetic-password' },
    'credential-create-key-2'
  )
  const created = {
    credential: {
      credential: {
        id: 'credential-id',
        deviceId: 'device-1',
        kind: 'username_password',
        status: 'pending',
        publicIdentifier: 'user',
        fingerprint: 'a'.repeat(64),
        createdAt: '2026-10-27T00:00:00Z',
        revokedAt: null
      },
      secret: 'one-time-secret',
      expiresAt: '2026-10-27T00:10:00Z'
    },
    location: '/api/v2/devices/device-1/credentials/credential-id',
    requestId: 'request-1'
  }
  let createCalls = 0
  let refreshCalls = 0
  const accepted: { value: typeof created | null } = { value: null }

  const completion = await createNativeCredentialAndRefresh(
    attempt,
    async (deviceId, body, key) => {
      createCalls += 1
      assert.equal(deviceId, attempt.deviceId)
      assert.deepEqual(body, attempt.payload)
      assert.equal(key, attempt.key)
      return created
    },
    result => {
      accepted.value = result
    },
    async deviceId => {
      refreshCalls += 1
      assert.equal(deviceId, attempt.deviceId)
      throw new Error('synthetic list read failure')
    }
  )

  assert.equal(completion.refreshFailed, true)
  assert.equal(completion.result.credential.secret, 'one-time-secret')
  assert.equal(accepted.value?.credential.secret, 'one-time-secret')
  assert.equal(createCalls, 1)
  assert.equal(refreshCalls, 1)
})

test('a late creation response from a previous account never reaches the current view or refreshes it', async () => {
  const attempt = createNativeCredentialAttempt('device-1', { kind: 'token' }, 'credential-create-old-account')
  let complete!: (value: { secret: string }) => void
  const pending = new Promise<{ secret: string }>(resolve => {
    complete = resolve
  })
  let currentSession = true
  let accepted = 0
  let refreshed = 0
  const completion = createNativeCredentialAndRefresh(
    attempt,
    async () => pending,
    () => {
      accepted += 1
    },
    async () => {
      refreshed += 1
    },
    () => currentSession
  )
  currentSession = false
  complete({ secret: 'synthetic-old-account-secret' })
  const result = await completion
  assert.equal(result.stale, true)
  assert.equal(accepted, 0)
  assert.equal(refreshed, 0)
})
