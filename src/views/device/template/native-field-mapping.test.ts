import assert from 'node:assert/strict'
import { test } from 'node:test'
import { reactive } from 'vue'
import type { ModelField } from '../../../service/api/thingmodel-native-transport'
import { fromNativeField, toNativeField, toNativeFieldFromEditor } from './native-field-mapping'

const localized = { default: 'Temperature', locales: { 'zh-CN': '温度', 'en-US': 'Temperature' } }

test('scalar kind and attribute/telemetry identity survive a form round trip', () => {
  const field: ModelField = {
    fieldID: 'f1', kind: 'TELEMETRY', identifier: ' Temp.Sensor/Value ', nameI18n: localized,
    descriptionI18n: { default: 'Measured', locales: { 'zh-CN': '测量值' } },
    valueType: { kind: 'INT', constraint: { min: -20, max: 80, precision: 0 } },
    access: { read: true, write: true, observe: true }, unit: '°C',
  }
  const form = fromNativeField(field)
  assert.equal(form.id, 'f1')
  assert.deepEqual(toNativeField('TELEMETRY', form), field)
  assert.equal(toNativeField('ATTRIBUTE', { ...form, type: undefined, kind: undefined }).kind, 'ATTRIBUTE')
  assert.equal((toNativeField('TELEMETRY', form) as Extract<ModelField, { kind: 'TELEMETRY' | 'ATTRIBUTE' }>).valueType.kind, 'INT')
})

test('legacy Number means general NUMBER while hidden native INT/FLOAT types stay exact', () => {
  const form = { data_name: 'Numeric', data_identifier: 'numeric', data_type: 'Number', read_write_flag: 'R' }
  assert.equal((toNativeField('TELEMETRY', form) as Extract<ModelField, { kind: 'TELEMETRY' | 'ATTRIBUTE' }>).valueType.kind, 'NUMBER')
  for (const kind of ['INT', 'FLOAT'] as const) {
    const native: ModelField = {
      kind: 'TELEMETRY', identifier: 'numeric', nameI18n: { default: 'Numeric' },
      valueType: { kind }, access: { read: true, write: false, observe: false },
    }
    const roundTrip = toNativeField('TELEMETRY', fromNativeField(native)) as Extract<ModelField, { kind: 'TELEMETRY' | 'ATTRIBUTE' }>
    assert.equal(roundTrip.valueType.kind, kind)
  }
})

test('enum codes preserve number and boolean JSON scalar types', () => {
  const numeric: ModelField = {
    kind: 'ATTRIBUTE', identifier: 'level', nameI18n: { default: 'Level' },
    valueType: { kind: 'ENUM', baseKind: 'NUMBER', enumValues: [{ code: 1, label: { default: 'Low' } }, { code: 3, label: { default: 'High', locales: { 'zh-CN': '高' } } }] },
    access: { read: true, write: false, observe: false },
  }
  const bool: ModelField = {
    kind: 'TELEMETRY', identifier: 'active', nameI18n: { default: 'Active' },
    valueType: { kind: 'ENUM', baseKind: 'BOOL', enumValues: [{ code: true, label: { default: 'On' } }, { code: false, label: { default: 'Off' } }] },
    access: { read: true, write: false, observe: false },
  }
  for (const field of [numeric, bool]) {
    const form = fromNativeField(field)
    if (field === bool) {
      assert.equal((form.additional_info as Array<{ value_type: string }>)[0]?.value_type, 'Boolean')
      assert.equal((form.additional_info as Array<{ value: unknown }>)[0]?.value, true)
    }
    const roundTrip = toNativeField(field.kind, form)
    assert.deepEqual(roundTrip, field)
    const got = (roundTrip as Extract<ModelField, { kind: 'TELEMETRY' | 'ATTRIBUTE' }>).valueType as { kind: 'ENUM'; enumValues: Array<{ code: unknown }> }
    const expected = (field as Extract<ModelField, { kind: 'TELEMETRY' | 'ATTRIBUTE' }>).valueType as { kind: 'ENUM'; enumValues: Array<{ code: unknown }> }
    assert.equal(typeof got.enumValues[0].code, typeof expected.enumValues[0].code)
  }
})

test('event and command use versioned flat parameters with typed values and no parent scalar', () => {
  const event: ModelField = {
    kind: 'EVENT', identifier: 'reading.changed', nameI18n: localized,
    access: { read: false, write: false, observe: true },
    parameters: { schemaVersion: 1, items: [
      { identifier: 'reading', nameI18n: localized, descriptionI18n: { default: 'Current reading' }, valueType: { kind: 'FLOAT', constraint: { min: -5, step: 0.25 } } },
      { identifier: 'enabled', nameI18n: { default: 'Enabled' }, valueType: { kind: 'ENUM', baseKind: 'BOOL', enumValues: [{ code: true, label: { default: 'On' } }, { code: false, label: { default: 'Off' } }] } },
    ] },
  }
  const command: ModelField = {
    kind: 'COMMAND', identifier: 'set.enabled', nameI18n: { default: 'Set enabled' },
    access: { read: false, write: true, observe: false },
    parameters: { schemaVersion: 1, items: [{ identifier: 'enabled', nameI18n: { default: 'Enabled' }, valueType: { kind: 'ENUM', baseKind: 'BOOL', enumValues: [{ code: true, label: { default: 'Enable' } }, { code: false, label: { default: 'Disable' } }] } }] },
  }
  for (const field of [event, command]) {
    const form = fromNativeField(field)
    const params = JSON.parse(form.params as string) as Array<{ data_type: string; enum_config?: Array<{ value: unknown }> }>
    const booleanParam = params.find(row => row.data_type === 'Boolean')
    assert.ok(booleanParam, `${field.kind} boolean enum parameter maps to the Boolean UI type`)
    assert.deepEqual(booleanParam.enum_config?.map(row => row.value), [true, false])
    const roundTrip = toNativeField(field.kind, form)
    assert.deepEqual(roundTrip, field)
    assert.equal('valueType' in roundTrip, false)
    assert.equal((roundTrip as Extract<ModelField, { kind: 'EVENT' | 'COMMAND' }>).parameters.schemaVersion, 1)
  }
})

test('event enum parameters retain their scalar codes and labels', () => {
  const event: ModelField = {
    kind: 'EVENT', identifier: 'mode.changed', nameI18n: { default: 'Mode changed' },
    access: { read: false, write: false, observe: true },
    parameters: { schemaVersion: 1, items: [{
      identifier: 'mode', nameI18n: { default: 'Mode' },
      valueType: { kind: 'ENUM', baseKind: 'NUMBER', enumValues: [{ code: 1, label: { default: 'Auto', locales: { 'zh-CN': '自动' } } }] },
    }] },
  }
  assert.deepEqual(toNativeField('EVENT', fromNativeField(event)), event)
})

test('an absent fieldID produces a stable view key and never a domain ID', () => {
  const field: ModelField = {
    kind: 'ATTRIBUTE', identifier: 'Mode/raw', nameI18n: { default: 'Mode' }, valueType: { kind: 'STRING' },
    access: { read: true, write: false, observe: false },
  }
  const form = fromNativeField(field)
  assert.equal(form.id, 'ATTRIBUTE:Mode/raw')
  assert.equal('fieldID' in toNativeField('ATTRIBUTE', form), false)
  assert.equal(toNativeField('ATTRIBUTE', form).identifier, 'Mode/raw')
})

test('native sort order survives a form round trip', () => {
  const field: ModelField = {
    kind: 'TELEMETRY', identifier: 'temperature', nameI18n: { default: 'Temperature' },
    valueType: { kind: 'FLOAT' }, access: { read: true, write: false, observe: true }, sortOrder: 27,
  }
  assert.deepEqual(toNativeField('TELEMETRY', fromNativeField(field)), field)
})

test('actual new telemetry and command editor values map without leaking enum UI state', () => {
  const telemetry = toNativeFieldFromEditor('TELEMETRY', {
    kind: 'TELEMETRY', type: 'TELEMETRY', data_name: 'Temperature', data_identifier: 'temperature',
    description: '', enum_base: 'String', data_type: 'Number', read_write_flag: 'R', additional_info: [],
  })
  assert.deepEqual(telemetry, {
    kind: 'TELEMETRY', identifier: 'temperature', nameI18n: { default: 'Temperature' },
    access: { read: true, write: false, observe: false }, valueType: { kind: 'NUMBER' },
  })
  const command = toNativeFieldFromEditor('COMMAND', {
    kind: 'COMMAND', type: 'COMMAND', data_name: 'Set mode', data_identifier: 'set_mode', description: '',
    enum_base: 'String',
    params: JSON.stringify([{ data_name: 'Mode', data_identifier: 'mode', param_type: 'Number', data_type: 'Number', description: '' }]),
    paramsOrigin: JSON.stringify([{ data_name: 'Mode', data_identifier: 'mode', param_type: 'Number', data_type: 'Number', description: '' }]),
  })
  assert.equal(command.kind, 'COMMAND')
  assert.deepEqual('parameters' in command ? command.parameters.items.map(row => row.identifier) : [], ['mode'])
  assert.equal('enum_base' in command, false)
})

test('Vue reactive native fields and editor forms round trip without DataCloneError', () => {
  const field: ModelField = reactive({
    kind: 'ATTRIBUTE', identifier: 'mode', nameI18n: { default: 'Mode', locales: { 'zh-CN': '模式' } },
    valueType: { kind: 'ENUM', baseKind: 'BOOL', enumValues: [{ code: true, label: { default: 'On' } }, { code: false, label: { default: 'Off' } }] },
    access: { read: true, write: true, observe: false }, sortOrder: 2,
  })
  const editorForm = reactive(fromNativeField(field))
  assert.deepEqual(toNativeFieldFromEditor('ATTRIBUTE', editorForm), field)
})

test('unknown values and malformed data block conversion while supported event enums survive', () => {
  assert.throws(() => fromNativeField({
    kind: 'ATTRIBUTE', identifier: 'bad', nameI18n: { default: 'Bad' }, access: { read: true, write: false, observe: false },
    valueType: { kind: 'ENUM', baseKind: 'BOOLEAN', enumValues: [{ code: true, label: { default: 'True' } }] },
  } as unknown as ModelField), /baseKind is unsupported/)
  assert.throws(() => toNativeField('TELEMETRY', { data_name: 'x', data_identifier: 'x', data_type: 'Object', read_write_flag: 'R' }), /unsupported data_type/)
  assert.throws(() => toNativeField('TELEMETRY', {
    data_name: 'x', data_identifier: 'x', data_type: 'Enum', read_write_flag: 'R',
    additional_info: [{ value_type: 'Number', value: '1', description: 'one' }],
  }), /does not match Number/)
  assert.throws(() => toNativeField('TELEMETRY', {
    data_name: 'x', data_identifier: 'x', data_type: 'Number', read_write_flag: 'R',
    value_type: { kind: 'FLOAT', constraint: { vendorShape: { min: 1 } } },
  }), /unsupported property "vendorShape"/)
  const event = toNativeField('EVENT', {
    data_name: 'Changed', data_identifier: 'changed', params: JSON.stringify([{ data_name: 'Mode', data_identifier: 'mode', read_write_flag: 'Enum', data_type: 'String', enum_config: [{ value: 'auto', desc: 'Auto' }] }]),
  })
  assert.equal((event as { parameters: { items: Array<{ valueType: { kind: string } }> } }).parameters.items[0].valueType.kind, 'ENUM')
  assert.throws(() => toNativeField('COMMAND', {
    data_name: 'Set', data_identifier: 'set', params: JSON.stringify([{ data_name: 'Target', data_identifier: 'target', param_type: 'Number', unit: 'ms' }]),
  }), /Parameters has no unit field/)
  assert.throws(() => toNativeField('TELEMETRY', {
    data_name: 'Bad locale', data_identifier: 'bad', name_i18n: { default: 'Bad locale', locales: { 'zh-CN': { nested: true } } },
    data_type: 'String', read_write_flag: 'R',
  }), /locales values must be strings/)
})
