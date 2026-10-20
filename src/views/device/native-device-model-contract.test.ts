import assert from 'node:assert/strict'
import { test } from 'node:test'
import { computed, nextTick, ref } from 'vue'
import type { DeviceConfigNativeBinding } from '../../service/api/native-template-binding'
import type { ModelDraft, SnapshotDetail } from '../../service/api/thingmodel-native-transport'
import {
  assertDeviceSnapshotMatchesBinding,
  decorateNativeAttributeRows,
  decorateNativeEventRows,
  formatNativeAttributeValue,
  hasNativeDeviceBinding,
  nativeCommandOptions,
  nativeDevicePlatformFields
} from './native-device-model-contract'
import { useNativeDeviceMetadata } from './use-native-device-metadata'

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
    {
      kind: 'TELEMETRY',
      identifier: 'temperature',
      nameI18n: { default: 'Temperature' },
      access: { read: true, write: true, observe: true },
      unit: '°C',
      valueType: { kind: 'FLOAT' }
    },
    {
      kind: 'ATTRIBUTE',
      identifier: 'mode',
      nameI18n: { default: 'Mode' },
      access: { read: true, write: true, observe: false },
      valueType: { kind: 'STRING' }
    },
    {
      kind: 'EVENT',
      identifier: 'alarm',
      nameI18n: { default: 'Alarm' },
      access: { read: false, write: true, observe: true },
      parameters: { schemaVersion: 1, items: [] }
    },
    {
      kind: 'COMMAND',
      identifier: 'setMode',
      nameI18n: { default: 'Set mode' },
      access: { read: false, write: true, observe: false },
      parameters: {
        schemaVersion: 1,
        items: [
          {
            identifier: 'mode',
            nameI18n: { default: 'Mode' },
            valueType: {
              kind: 'ENUM',
              baseKind: 'STRING',
              enumValues: [
                { code: 'auto', label: { default: 'Automatic' } },
                { code: 'manual', label: { default: 'Manual' } }
              ]
            }
          },
          { identifier: 'enabled', nameI18n: { default: 'Enabled' }, valueType: { kind: 'BOOL' } },
          { identifier: 'note', nameI18n: { default: 'Note' }, valueType: { kind: 'STRING' } }
        ]
      }
    }
  ]
}

const metadataV3Model: ModelDraft = {
  ...model,
  fields: [
    model.fields[0],
    {
      kind: 'ATTRIBUTE',
      identifier: 'battery',
      nameI18n: { default: 'Battery' },
      access: { read: true, write: true, observe: true },
      unit: '%',
      valueType: { kind: 'NUMBER' }
    },
    {
      kind: 'ATTRIBUTE',
      identifier: 'mode',
      nameI18n: { default: 'Mode' },
      access: { read: true, write: true, observe: true },
      valueType: {
        kind: 'ENUM',
        baseKind: 'STRING',
        enumValues: [
          { code: 'auto', label: { default: 'Automatic' } },
          { code: 'manual', label: { default: 'Manual' } }
        ]
      }
    },
    {
      kind: 'EVENT',
      identifier: 'alarm',
      nameI18n: { default: 'Alarm' },
      access: { read: false, write: false, observe: true },
      parameters: {
        schemaVersion: 1,
        items: [
          { identifier: 'event_code', nameI18n: { default: 'Event code' }, valueType: { kind: 'INT' } },
          { identifier: 'message', nameI18n: { default: 'Message' }, valueType: { kind: 'STRING' } }
        ]
      }
    },
    model.fields[3]
  ]
}

const snapshot: SnapshotDetail = {
  modelID: 'model-1',
  snapshotID: 'snapshot-2',
  publishedRevision: 2,
  checksum: 'checksum',
  createdAt: '2026-10-18T00:00:00Z',
  model,
  resources: {
    profile: { author: '', tags: [], cover: '', version: '', brand: '', modelNumber: '' },
    webChartConfig: null,
    appChartConfig: null
  }
}

test('device binding requires the exact model, snapshot ID, and published revision', () => {
  assert.equal(hasNativeDeviceBinding({ ...binding, native_thing_model_id: '' }), true)
  assert.equal(
    hasNativeDeviceBinding({
      ...binding,
      native_thing_model_id: null,
      native_thing_model_snapshot_id: null,
      native_thing_model_revision: 0
    }),
    true
  )
  assert.equal(
    hasNativeDeviceBinding({
      ...binding,
      native_thing_model_id: null,
      native_thing_model_snapshot_id: null,
      native_thing_model_revision: null
    }),
    false
  )
  assert.equal(
    hasNativeDeviceBinding({
      ...binding,
      native_thing_model_id: null,
      native_thing_model_snapshot_id: null,
      native_thing_model_revision: null,
      native_binding_revision: 3
    }),
    false
  )
  assert.doesNotThrow(() => assertDeviceSnapshotMatchesBinding(binding, snapshot))
  assert.throws(
    () => assertDeviceSnapshotMatchesBinding({ ...binding, native_thing_model_id: 'other-model' }, snapshot),
    /does not match/
  )
  assert.throws(
    () =>
      assertDeviceSnapshotMatchesBinding({ ...binding, native_thing_model_snapshot_id: 'other-snapshot' }, snapshot),
    /does not match/
  )
  assert.throws(
    () => assertDeviceSnapshotMatchesBinding({ ...binding, native_thing_model_revision: 3 }, snapshot),
    /does not match/
  )
  assert.throws(
    () => assertDeviceSnapshotMatchesBinding({ ...binding, native_thing_model_id: '' }, snapshot),
    /incomplete/
  )
  assert.doesNotThrow(() => assertDeviceSnapshotMatchesBinding({ ...binding, device_template_id: '' }, snapshot))
  assert.throws(
    () => assertDeviceSnapshotMatchesBinding({ ...binding, device_template_id: 'legacy-template' }, snapshot),
    /cannot be combined/
  )
})

test('native device fields are writable only through commands', () => {
  const fields = nativeDevicePlatformFields(model)
  assert.deepEqual(
    fields.map(field => [field.id, field.writable, field.write?.target]),
    [
      ['temperature', false, undefined],
      ['mode', false, undefined],
      ['alarm', false, undefined],
      ['setMode', true, 'command']
    ]
  )
})

test('native command options map parameter identifiers and typed enum values without string coercion', () => {
  const [command] = nativeCommandOptions(model)
  assert.equal(command?.data_identifier, 'setMode')
  assert.deepEqual(JSON.parse(command?.params || '[]'), [
    {
      id: 'mode',
      data_name: 'Mode',
      data_identifier: 'mode',
      param_type: 'Enum',
      data_type: 'STRING',
      description: '',
      enum_config: [
        { value: 'auto', desc: 'Automatic' },
        { value: 'manual', desc: 'Manual' }
      ]
    },
    {
      id: 'enabled',
      data_name: 'Enabled',
      data_identifier: 'enabled',
      param_type: 'Boolean',
      data_type: 'Boolean',
      description: '',
      enum_config: []
    },
    {
      id: 'note',
      data_name: 'Note',
      data_identifier: 'note',
      param_type: 'string',
      data_type: 'String',
      description: '',
      enum_config: []
    }
  ])
})

test('native attribute rows use pinned field name, unit, type, and enum labels and discard stale raw metadata', () => {
  const fields = nativeDevicePlatformFields(metadataV3Model)
  const rows = decorateNativeAttributeRows(
    [
      { key: 'battery', data_name: 'Legacy battery', unit: 'V', data_type: 'string', value: 85 },
      { key: 'mode', data_name: 'Legacy mode', unit: 'old', data_type: 'string', enum: [], value: 'manual' },
      { key: 'mode', data_name: 'Legacy mode', value: 1 },
      {
        key: 'new_raw_field',
        data_name: 'Stale label',
        unit: 'old',
        data_type: 'string',
        enum: [{ value: 'bad' }],
        value: 12
      }
    ],
    fields
  )
  assert.equal(rows[0].data_name, 'Battery')
  assert.equal(rows[0].unit, '%')
  assert.equal(rows[0].data_type, 'Number')
  assert.equal(formatNativeAttributeValue(rows[0]), '85%')
  assert.equal(rows[1].data_name, 'Mode')
  assert.equal(rows[1].data_type, 'Enum')
  assert.equal(rows[1].enum_label, 'Manual')
  assert.equal(formatNativeAttributeValue(rows[1]), 'Manual')
  assert.equal(rows[2].enum_label, undefined)
  assert.equal(formatNativeAttributeValue(rows[2]), '1')
  assert.equal(rows[3].data_name, 'new_raw_field')
  assert.equal('unit' in rows[3], false)
  assert.equal('data_type' in rows[3], false)
  assert.equal('enum' in rows[3], false)
  assert.deepEqual(
    fields.map(field => field.id),
    ['temperature', 'battery', 'mode', 'alarm', 'setMode']
  )
})

test('native event rows use pinned event and parameter labels, while unknown identifiers keep raw keys', () => {
  const fields = nativeDevicePlatformFields(metadataV3Model)
  const [known, unknown] = decorateNativeEventRows(
    [
      { identify: 'alarm', data_name: 'Legacy alarm', data: '{"event_code":7,"message":"overheated"}' },
      { identify: 'unknown_event', data_name: 'Stale event name', data: '{"x":1}' }
    ],
    fields
  )
  assert.equal(known.data_name, 'Alarm')
  assert.equal(known.data_display, '{"Event code [event_code]":7,"Message [message]":"overheated"}')
  assert.deepEqual(known.event_parameters, [
    { identifier: 'event_code', name: 'Event code', type: 'INT' },
    { identifier: 'message', name: 'Message', type: 'STRING' }
  ])
  assert.equal(unknown.data_name, 'unknown_event')
  assert.equal(unknown.data_display, '{"x":1}')
})

test('native event display keeps duplicate names, raw collisions, and enum value types intact', () => {
  const typedEventFields = metadataV3Model.fields.map(field =>
    field.identifier === 'alarm'
      ? {
          ...field,
          parameters: {
            schemaVersion: 1,
            items: [
              { identifier: 'event_code', nameI18n: { default: 'Alarm code' }, valueType: { kind: 'INT' } },
              { identifier: 'message', nameI18n: { default: 'Alarm code' }, valueType: { kind: 'STRING' } },
              {
                identifier: 'stage',
                nameI18n: { default: 'Mode' },
                valueType: {
                  kind: 'ENUM',
                  baseKind: 'STRING',
                  enumValues: [{ code: '1', label: { default: 'One' } }]
                }
              }
            ]
          }
        }
      : field
  ) as unknown as ModelDraft['fields']
  const typedEventModel: ModelDraft = {
    ...metadataV3Model,
    fields: typedEventFields
  }
  const rawData = '{"event_code":7,"message":"hot","stage":1,"Alarm code [event_code]":"raw"}'
  const [row] = decorateNativeEventRows(
    [{ identify: 'alarm', data: rawData }],
    nativeDevicePlatformFields(typedEventModel)
  )
  assert.equal(row.data, rawData)
  assert.deepEqual(JSON.parse(row.data_display), {
    'Alarm code [event_code] #2': 7,
    'Alarm code [message]': 'hot',
    'Mode [stage]': 1,
    'Alarm code [event_code]': 'raw'
  })
})

test('native metadata updates rows after async snapshot resolution and ignores stale binding responses', async () => {
  const currentBinding = ref<DeviceConfigNativeBinding | null>(binding)
  const pendingResolvers: Array<
    (value: { platformFields: ReturnType<typeof nativeDevicePlatformFields> } | null) => void
  > = []
  const metadata = useNativeDeviceMetadata(
    computed(() => currentBinding.value),
    'attribute',
    () =>
      new Promise(resolve => {
        pendingResolvers.push(resolve)
      })
  )
  const rawRows = [{ key: 'battery', data_name: 'Stale template label', unit: 'V', value: 42 }]

  await nextTick()
  assert.equal(pendingResolvers.length, 1)
  assert.equal(metadata.decorateRows.value?.(rawRows)[0].data_name, 'battery')

  const modelTwo: ModelDraft = {
    ...metadataV3Model,
    fields: metadataV3Model.fields.map(field =>
      field.identifier === 'battery' ? { ...field, nameI18n: { default: 'Current battery' } } : field
    )
  }
  currentBinding.value = { ...binding, native_thing_model_id: 'model-2' }
  await nextTick()
  assert.equal(pendingResolvers.length, 2)
  currentBinding.value = { ...binding, native_thing_model_id: 'model-3' }
  await nextTick()
  assert.equal(pendingResolvers.length, 3)

  pendingResolvers[2]({ platformFields: nativeDevicePlatformFields(modelTwo) })
  await nextTick()
  assert.equal(metadata.decorateRows.value?.(rawRows)[0].data_name, 'Current battery')
  pendingResolvers[1]({ platformFields: nativeDevicePlatformFields(metadataV3Model) })
  await nextTick()
  assert.equal(metadata.decorateRows.value?.(rawRows)[0].data_name, 'Current battery')

  currentBinding.value = {
    ...binding,
    native_thing_model_id: null,
    native_thing_model_snapshot_id: null,
    native_thing_model_revision: null
  }
  await nextTick()
  assert.equal(metadata.decorateRows.value, undefined)
})
