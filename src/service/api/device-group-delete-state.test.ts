import assert from 'node:assert/strict'
import test from 'node:test'
import {
  beginDeviceGroupDelete,
  completeDeviceGroupDelete,
  createDeviceGroupDeleteIntent,
  DeviceGroupDeleteSessionChangedError,
  failDeviceGroupDelete,
  getDeviceGroupDeleteSessionGeneration,
  finishDeviceGroupDelete,
  getDeviceGroupDeleteIntent,
  isCurrentDeviceGroupDeleteSession,
  prepareDeviceGroupDeleteIntent,
  syncDeviceGroupDeleteSession
} from './device-group-delete-state'

test('unknown delete keeps the original ETag and key through later authorization or conflict errors', () => {
  syncDeviceGroupDeleteSession(true, 'user-a', 'tenant-a')
  const generation = getDeviceGroupDeleteSessionGeneration()
  createDeviceGroupDeleteIntent('group-a', '"v7"', 'delete-key-0001', generation)
  assert.equal(failDeviceGroupDelete('group-a', undefined, generation).retained, true)
  assert.equal(failDeviceGroupDelete('group-a', 401, generation).retained, true)
  assert.equal(failDeviceGroupDelete('group-a', 409, generation).retained, true)
  assert.deepEqual(getDeviceGroupDeleteIntent('group-a'), {
    groupId: 'group-a',
    etag: '"v7"',
    key: 'delete-key-0001',
    outcomeUnknown: true
  })
})

test('unknown retry reuses the intent without reading an ETag for an already-deleted group', async () => {
  const generation = getDeviceGroupDeleteSessionGeneration()
  createDeviceGroupDeleteIntent('group-a-retry', '"v9"', 'delete-key-0004', generation)
  failDeviceGroupDelete('group-a-retry', undefined, generation)
  let getCount = 0
  const retry = await prepareDeviceGroupDeleteIntent(
    'group-a-retry',
    async () => {
      getCount += 1
      throw new Error('group may already return 404')
    },
    () => 'incorrect-new-key',
    generation
  )
  assert.equal(getCount, 0)
  assert.equal(retry.etag, '"v9"')
  assert.equal(retry.key, 'delete-key-0004')
})

test('first explicit conflict clears intent and one group cannot delete concurrently', () => {
  const generation = getDeviceGroupDeleteSessionGeneration()
  createDeviceGroupDeleteIntent('group-b', '"v2"', 'delete-key-0002', generation)
  assert.equal(failDeviceGroupDelete('group-b', 412, generation).retained, false)
  assert.equal(getDeviceGroupDeleteIntent('group-b'), undefined)
  assert.equal(beginDeviceGroupDelete('group-b', generation), true)
  assert.equal(beginDeviceGroupDelete('group-b', generation), false)
  finishDeviceGroupDelete('group-b', generation)
  assert.equal(beginDeviceGroupDelete('group-b', generation), true)
  finishDeviceGroupDelete('group-b', generation)
})

test('confirmed delete clears its intent before any later list refresh', () => {
  const generation = getDeviceGroupDeleteSessionGeneration()
  createDeviceGroupDeleteIntent('group-c', '"v1"', 'delete-key-0003', generation)
  completeDeviceGroupDelete('group-c', generation)
  assert.equal(getDeviceGroupDeleteIntent('group-c'), undefined)
})

test('token refresh for the same user and tenant preserves the same pending delete intent', () => {
  const generation = getDeviceGroupDeleteSessionGeneration()
  const intent = createDeviceGroupDeleteIntent('group-token-refresh', '"v3"', 'same-actor-key', generation)
  failDeviceGroupDelete('group-token-refresh', undefined, generation)
  assert.equal(syncDeviceGroupDeleteSession(true, 'user-a', 'tenant-a'), false)
  assert.equal(getDeviceGroupDeleteSessionGeneration(), generation)
  assert.equal(getDeviceGroupDeleteIntent('group-token-refresh'), intent)
})

test('old account late ETag read cannot create or reuse an intent after session change', async () => {
  const oldGeneration = getDeviceGroupDeleteSessionGeneration()
  let finishGet!: (_etag: string) => void
  const pending = prepareDeviceGroupDeleteIntent(
    'group-late',
    () =>
      new Promise<string>(resolve => {
        finishGet = resolve
      }),
    () => 'old-account-key',
    oldGeneration
  )
  assert.equal(syncDeviceGroupDeleteSession(true, 'user-b', 'tenant-b'), true)
  finishGet('"old-account-etag"')
  await assert.rejects(pending, DeviceGroupDeleteSessionChangedError)
  assert.equal(isCurrentDeviceGroupDeleteSession(oldGeneration), false)
  assert.equal(getDeviceGroupDeleteIntent('group-late'), undefined)
  const nextGeneration = getDeviceGroupDeleteSessionGeneration()
  assert.notEqual(nextGeneration, oldGeneration)
  assert.equal(beginDeviceGroupDelete('group-late', oldGeneration), false)
  assert.equal(beginDeviceGroupDelete('group-late', nextGeneration), true)
  finishDeviceGroupDelete('group-late', nextGeneration)
  const newIntent = createDeviceGroupDeleteIntent('group-late', '"v4"', 'new-account-key', nextGeneration)
  assert.equal(completeDeviceGroupDelete('group-late', oldGeneration), false)
  assert.equal(failDeviceGroupDelete('group-late', 401, oldGeneration).retained, false)
  assert.equal(getDeviceGroupDeleteIntent('group-late'), newIntent)
})
