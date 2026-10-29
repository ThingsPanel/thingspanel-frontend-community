import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createOrReuseDeviceGroupMembershipIntent,
  isCurrentDeviceGroupMembershipSession
} from './device-group-membership-state'

test('retries reuse the exact membership body and key; a confirmed newer version starts a new intent', () => {
  const keys = ['key-0000001', 'key-0000002']
  const makeKey = () => keys.shift()!
  const first = createOrReuseDeviceGroupMembershipIntent(null, 'add', 'group-1', 4, ['device-2', 'device-1'], makeKey)
  const retry = createOrReuseDeviceGroupMembershipIntent(first, 'add', 'group-1', 4, ['device-1', 'device-2'], makeKey)
  assert.equal(retry, first)
  assert.equal(retry.key, 'key-0000001')
  assert.deepEqual(retry.body, { deviceIds: ['device-1', 'device-2'], expectedGroupVersion: 4 })

  const reloaded = createOrReuseDeviceGroupMembershipIntent(
    retry,
    'add',
    'group-1',
    5,
    ['device-1', 'device-2'],
    makeKey
  )
  assert.notEqual(reloaded.key, retry.key)
  assert.deepEqual(reloaded.body, { deviceIds: ['device-1', 'device-2'], expectedGroupVersion: 5 })
})

test('membership intent deduplicates ids and enforces the service batch ceiling', () => {
  const intent = createOrReuseDeviceGroupMembershipIntent(
    null,
    'remove',
    'group-1',
    9,
    ['d1', 'd1'],
    () => 'key-0000001'
  )
  assert.deepEqual(intent.body.deviceIds, ['d1'])
  assert.throws(
    () =>
      createOrReuseDeviceGroupMembershipIntent(
        null,
        'add',
        'group-1',
        9,
        Array.from({ length: 101 }, (_, index) => `d${index}`),
        () => 'key-0000002'
      ),
    /at most 100/
  )
})

test('initial open, close/reopen, and group switch isolate late membership responses', () => {
  const initialOpen = { groupId: 'group-1', generation: 1 }
  assert.equal(isCurrentDeviceGroupMembershipSession(initialOpen, true, 'group-1', 1), true)

  const reopened = { groupId: 'group-1', generation: 3 }
  assert.equal(isCurrentDeviceGroupMembershipSession(initialOpen, false, 'group-1', 2), false)
  assert.equal(isCurrentDeviceGroupMembershipSession(initialOpen, true, 'group-1', reopened.generation), false)
  assert.equal(isCurrentDeviceGroupMembershipSession(reopened, true, 'group-1', reopened.generation), true)

  const switchedGroup = { groupId: 'group-2', generation: 4 }
  assert.equal(
    isCurrentDeviceGroupMembershipSession(reopened, true, switchedGroup.groupId, switchedGroup.generation),
    false
  )
  assert.equal(
    isCurrentDeviceGroupMembershipSession(switchedGroup, true, switchedGroup.groupId, switchedGroup.generation),
    true
  )
})
