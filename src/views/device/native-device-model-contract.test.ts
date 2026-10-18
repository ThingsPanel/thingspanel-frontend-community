import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { DeviceConfigNativeBinding } from '../../service/api/native-template-binding'
import type { ModelDraft, SnapshotDetail } from '../../service/api/thingmodel-native-transport'
import {
  assertDeviceSnapshotMatchesBinding,
  nativeCommandOptions,
  nativeDevicePlatformFields
} from './native-device-model-contract'

const binding: DeviceConfigNativeBinding = {
  id: 'config-1',
  native_thing_model_id: 'model-1',
  native_thing_model_snapshot_id: 'snapshot-2',
  native_thing_model_revision: 2,
  native_binding_revision: 4,
  device_template_id: null
}

const model: ModelDraft = {
  name: 'Device model',
  fields: [
    { kind: 'TELEMETRY', identifier: 'temperature', nameI18n: { default: 'Temperature' }, access: { read: true, write: true, observe: true }, unit: '°C', valueType: { kind: 'FLOAT' } },
    { kind: 'ATTRIBUTE', identifier: 'mode', nameI18n: { default: 'Mode' }, access: { read: true, write: true, observe: false }, valueType: { kind: 'STRING' } },
    { kind: 'EVENT', identifier: 'alarm', nameI18n: { default: 'Alarm' }, access: { read: false, write: true, observe: true }, parameters: { schemaVersion: 1, items: [] } },
    { kind: 'COMMAND', identifier: 'setMode', nameI18n: { default: 'Set mode' }, access: { read: false, write: true, observe: false }, parameters: { schemaVersion: 1, items: [
      { identifier: 'mode', nameI18n: { default: 'Mode' }, valueType: { kind: 'ENUM', baseKind: 'STRING', enumValues: [{ code: 'auto', label: { default: 'Automatic' } }, { code: 'manual', label: { default: 'Manual' } }] } },
      { identifier: 'enabled', nameI18n: { default: 'Enabled' }, valueType: { kind: 'BOOL' } },
      { identifier: 'note', nameI18n: { default: 'Note' }, valueType: { kind: 'STRING' } }
    ] } }
  ]
}

const snapshot: SnapshotDetail = {
  modelID: 'model-1',
  snapshotID: 'snapshot-2',
  publishedRevision: 2,
  checksum: 'checksum',
  createdAt: '2026-10-18T00:00:00Z',
  model,
  resources: { profile: { author: '', tags: [], cover: '', version: '', brand: '', modelNumber: '' }, webChartConfig: null, appChartConfig: null }
}

test('device binding requires the exact model, snapshot ID, and published revision', () => {
  assert.doesNotThrow(() => assertDeviceSnapshotMatchesBinding(binding, snapshot))
  assert.throws(() => assertDeviceSnapshotMatchesBinding({ ...binding, native_thing_model_id: 'other-model' }, snapshot), /does not match/)
  assert.throws(() => assertDeviceSnapshotMatchesBinding({ ...binding, native_thing_model_snapshot_id: 'other-snapshot' }, snapshot), /does not match/)
  assert.throws(() => assertDeviceSnapshotMatchesBinding({ ...binding, native_thing_model_revision: 3 }, snapshot), /does not match/)
  assert.throws(() => assertDeviceSnapshotMatchesBinding({ ...binding, native_thing_model_id: '' }, snapshot), /incomplete/)
})

test('device fields keep telemetry and events read-only while preserving writable attributes and commands', () => {
  const fields = nativeDevicePlatformFields(model)
  assert.deepEqual(fields.map(field => [field.id, field.writable, field.write?.target]), [
    ['temperature', false, undefined],
    ['mode', true, 'attribute'],
    ['alarm', false, undefined],
    ['setMode', true, 'command']
  ])
})

test('native command options map parameter identifiers and typed enum values without string coercion', () => {
  const [command] = nativeCommandOptions(model)
  assert.equal(command?.data_identifier, 'setMode')
  assert.deepEqual(JSON.parse(command?.params || '[]'), [
    { id: 'mode', data_name: 'Mode', data_identifier: 'mode', param_type: 'Enum', data_type: 'STRING', description: '', enum_config: [{ value: 'auto', desc: 'Automatic' }, { value: 'manual', desc: 'Manual' }] },
    { id: 'enabled', data_name: 'Enabled', data_identifier: 'enabled', param_type: 'Boolean', data_type: 'Boolean', description: '', enum_config: [] },
    { id: 'note', data_name: 'Note', data_identifier: 'note', param_type: 'string', data_type: 'String', description: '', enum_config: [] }
  ])
})
