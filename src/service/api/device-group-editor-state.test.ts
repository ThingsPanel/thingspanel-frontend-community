import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { DeviceGroup } from './device-group-native-transport'
import {
  acceptDeviceGroupEditorReload,
  canManageDeviceGroups,
  canSubmitDeviceGroupEditor,
  createDeviceGroupEditorState,
  initialParentSelection,
  markDeviceGroupEditorConflict,
  ROOT_DEVICE_GROUP_SELECTION
} from './device-group-editor-state'

const group: DeviceGroup = {
  id: 'g1',
  tenantId: 't1',
  createdAt: '2026-10-26T00:00:00Z',
  updatedAt: '2026-10-26T00:00:00Z',
  createdBy: 'u1',
  updatedBy: 'u1',
  resourceVersion: 2,
  name: 'Server name',
  description: 'Server description',
  parentId: null,
  sortOrder: 0,
  directDeviceCount: 0,
  descendantDeviceCount: 0,
  subtreeDeviceCount: 0,
  path: [],
  pathComplete: true,
  activeAlarmCount: null,
  alarmsObservedAt: null
}

test('new child form keeps a specified parent and only uses root for no parent', () => {
  assert.equal(initialParentSelection('parent-1'), 'parent-1')
  assert.equal(initialParentSelection(undefined), ROOT_DEVICE_GROUP_SELECTION)
  assert.equal(initialParentSelection('0'), ROOT_DEVICE_GROUP_SELECTION)
})

test('only the confirmed tenant administrator role enables group mutations', () => {
  assert.equal(canManageDeviceGroups(['TENANT_ADMIN']), true)
  assert.equal(canManageDeviceGroups(['SYS_ADMIN']), false)
  assert.equal(canManageDeviceGroups(undefined), false)
})

test('409/412 conflict preserves draft and ETag and blocks save until explicit reload', () => {
  const original = { group, etag: '"v2"' }
  const draft = { name: 'My unsaved name', parentId: 'parent-1', description: 'Keep these edits' }
  const conflicted = markDeviceGroupEditorConflict(createDeviceGroupEditorState(original), draft)
  assert.equal(conflicted.current.etag, '"v2"')
  assert.equal(conflicted.current.group, group)
  assert.deepEqual(conflicted.draft, draft)
  assert.equal(conflicted.conflict, true)
  assert.equal(canSubmitDeviceGroupEditor(conflicted), false)
  assert.equal(canSubmitDeviceGroupEditor(null), false)

  const latest = { group: { ...group, resourceVersion: 3, name: 'New server name' }, etag: '"v3"' }
  const reloaded = acceptDeviceGroupEditorReload(latest)
  assert.equal(reloaded.current.etag, '"v3"')
  assert.equal(reloaded.draft.name, 'New server name')
  assert.equal(reloaded.conflict, false)
  assert.equal(canSubmitDeviceGroupEditor(reloaded), true)
})
