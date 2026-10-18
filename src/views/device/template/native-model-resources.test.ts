import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { ModelDraft, ResourcesDocument } from '../../../service/api/thingmodel-native-transport'
import { nativeModelFieldsToPlatformFields, normalizeNativeProfile, normalizeResourcesDocument, stableFingerprint } from './native-model-resources'

test('stable resource fingerprints ignore nested object key order and preserve array order', () => {
  const first = { webChartConfig: { nodes: [{ id: 'n1', props: { title: 'Value', color: 'blue' } }], canvas: { width: 800, height: 600 } } }
  const reordered = { webChartConfig: { canvas: { height: 600, width: 800 }, nodes: [{ props: { color: 'blue', title: 'Value' }, id: 'n1' }] } }
  const arrayReordered = { webChartConfig: { canvas: { width: 800, height: 600 }, nodes: [{ props: { title: 'Value', color: 'blue' }, id: 'n1' }, { id: 'n2' }] } }

  assert.equal(stableFingerprint(first), stableFingerprint(reordered))
  assert.notEqual(stableFingerprint(first), stableFingerprint(arrayReordered))
})

test('resource normalization keeps profile fields and treats empty chart payloads as null', () => {
  const profile = normalizeNativeProfile({ author: 'Ada', tags: ['indoor', 4 as never], cover: './cover.png', version: 'v2', brand: 'TP', modelNumber: 'M1' })
  assert.deepEqual(profile, { author: 'Ada', tags: ['indoor'], cover: './cover.png', version: 'v2', brand: 'TP', modelNumber: 'M1' })
  assert.deepEqual(normalizeResourcesDocument({ profile, webChartConfig: null, appChartConfig: null }), {
    profile, webChartConfig: null, appChartConfig: null
  } satisfies ResourcesDocument)
})

test('native fields expose four model kinds, enum values, units, access, and command targets', () => {
  const model: ModelDraft = {
    name: 'Model',
    fields: [
      { kind: 'TELEMETRY', identifier: 'temp', nameI18n: { default: 'Temperature' }, descriptionI18n: { default: 'Room temperature' }, unit: '°C', access: { read: true, write: false, observe: true }, valueType: { kind: 'FLOAT', constraint: { min: -20 } } },
      { kind: 'ATTRIBUTE', identifier: 'mode', nameI18n: { default: 'Mode' }, access: { read: true, write: true, observe: false }, valueType: { kind: 'ENUM', baseKind: 'STRING', enumValues: [{ code: 'auto', label: { default: 'Automatic' } }, { code: 'manual', label: { default: 'Manual' } }] } },
      { kind: 'ATTRIBUTE', identifier: 'enabled', nameI18n: { default: 'Enabled' }, access: { read: true, write: false, observe: false }, valueType: { kind: 'ENUM', baseKind: 'BOOL', enumValues: [{ code: true, label: { default: 'Yes' } }, { code: false, label: { default: 'No' } }] } },
      { kind: 'EVENT', identifier: 'alarm', nameI18n: { default: 'Alarm' }, access: { read: false, write: false, observe: true }, parameters: { schemaVersion: 1, items: [] } },
      { kind: 'COMMAND', identifier: 'setMode', nameI18n: { default: 'Set mode' }, access: { read: false, write: true, observe: false }, parameters: { schemaVersion: 1, items: [{ identifier: 'mode', nameI18n: { default: 'Mode' }, valueType: { kind: 'STRING' } }] } }
    ]
  }
  const fields = nativeModelFieldsToPlatformFields(model)
  assert.deepEqual(fields.map(({ id, dataType, type }) => ({ id, dataType, type })), [
    { id: 'temp', dataType: 'telemetry', type: 'number' },
    { id: 'mode', dataType: 'attribute', type: 'string' },
    { id: 'enabled', dataType: 'attribute', type: 'boolean' },
    { id: 'alarm', dataType: 'event', type: 'json' },
    { id: 'setMode', dataType: 'command', type: 'json' }
  ])
  assert.equal(fields[0]?.unit, '°C')
  assert.deepEqual(fields[1]?.options, [{ label: 'Automatic', value: 'auto' }, { label: 'Manual', value: 'manual' }])
  assert.deepEqual(fields[2]?.options, [{ label: 'Yes', value: true }, { label: 'No', value: false }])
  assert.equal(fields[1]?.write?.target, 'attribute')
  assert.equal(fields[4]?.write?.target, 'command')
  assert.equal((fields[4]?.nativeSchema?.parameters as { schemaVersion: number }).schemaVersion, 1)
})
