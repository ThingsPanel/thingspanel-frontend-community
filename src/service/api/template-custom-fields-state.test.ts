import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildCustomFieldUpsert,
  clearTemplateCustomFieldAttempt,
  createTemplateCustomFieldAttempt,
  getTemplateCustomFieldAttempt,
  getTemplateCustomFieldSessionGeneration,
  makeCustomFieldChanges,
  makeNewCustomFieldDefinition,
  markTemplateCustomFieldUnknown,
  parseCustomFieldDefault,
  shouldRetainTemplateCustomFieldAttempt,
  syncTemplateCustomFieldSession,
  validateNewCustomField,
  type CustomFieldDefinition
} from './template-custom-fields-state'

function field(overrides: Partial<CustomFieldDefinition> = {}): CustomFieldDefinition {
  return {
    key: 'threshold',
    name: 'Threshold',
    type: 'number',
    defaultValue: 9007199254740992,
    description: 'old description',
    enabled: true,
    enumValues: [],
    ...overrides
  }
}

test('editing a field name omits default precision, unchanged properties, and other definitions', () => {
  const baseline = field()
  const change = buildCustomFieldUpsert(baseline, { name: 'New name' })
  assert.deepEqual(change, { key: 'threshold', name: 'New name' })
  assert.equal(Object.hasOwn(change, 'defaultValue'), false)

  const payload = makeCustomFieldChanges([change])
  assert.deepEqual(payload, { upsert: [{ key: 'threshold', name: 'New name' }], remove: [] })
  assert.equal(payload.upsert.length, 1)
})

test('partial diff preserves false, zero, and null as explicit changes', () => {
  const baseline = field({ defaultValue: 1, enabled: true, description: 'present' })
  assert.deepEqual(buildCustomFieldUpsert(baseline, { defaultValue: 0, enabled: false, description: null }), {
    key: 'threshold',
    defaultValue: 0,
    enabled: false,
    description: null
  })
  assert.equal(parseCustomFieldDefault('number', { text: '', isNull: false, booleanValue: false }), null)
  assert.equal(parseCustomFieldDefault('boolean', { text: '', isNull: false, booleanValue: false }), false)
  assert.equal(parseCustomFieldDefault('string', { text: '', isNull: false, booleanValue: false }), '')
  assert.throws(
    () => parseCustomFieldDefault('number', { text: 'Infinity', isNull: false, booleanValue: false }),
    /有限数字/
  )
})

test('custom field changes require both arrays and enforce disjoint keys and count bounds', () => {
  assert.deepEqual(makeCustomFieldChanges([], ['field-a']), { upsert: [], remove: ['field-a'] })
  assert.throws(() => makeCustomFieldChanges([], []), /between 1 and 100/)
  assert.throws(() => makeCustomFieldChanges([{ key: 'field-a' }], ['field-a']), /upserted and removed/)
  assert.throws(
    () => makeCustomFieldChanges(Array.from({ length: 101 }, (_, i) => ({ key: `field-${i}` }))),
    /between 1 and 100/
  )
})

test('new number zero, boolean false, and nullable values validate without truthy coercion', () => {
  const newDefinition = (
    key: string,
    type: CustomFieldDefinition['type'],
    defaultValue: CustomFieldDefinition['defaultValue']
  ) => makeNewCustomFieldDefinition({ key, name: key, type, defaultValue, description: null, enumValues: [] })
  const numberField = newDefinition('count', 'number', 0)
  const booleanField = newDefinition('active', 'boolean', false)
  const nullableField = newDefinition('optional', 'string', null)
  assert.equal(numberField.defaultValue, 0)
  assert.equal(booleanField.defaultValue, false)
  assert.equal(nullableField.defaultValue, null)
  assert.equal(numberField.enabled, false)
  assert.deepEqual(numberField.enumValues, [])
  assert.equal(numberField.description, null)
  assert.equal(validateNewCustomField(numberField, []), undefined)
  assert.equal(validateNewCustomField(booleanField, []), undefined)
  assert.equal(validateNewCustomField(nullableField, []), undefined)
  const nullableEnum = newDefinition('mode', 'enum', null)
  nullableEnum.enumValues = [{ value: 'auto', label: 'Automatic' }]
  assert.equal(validateNewCustomField(nullableEnum, []), undefined)
  assert.equal(parseCustomFieldDefault('enum', { text: '', isNull: true, booleanValue: false }), null)
})

test('editing a numeric null remains writable; an empty numeric input still means null', () => {
  const baseline = field({ key: 'optional-number', defaultValue: null })
  const changed = buildCustomFieldUpsert(baseline, { defaultValue: 0 })
  assert.deepEqual(changed, { key: 'optional-number', defaultValue: 0 })
  assert.equal(parseCustomFieldDefault('number', { text: '', isNull: false, booleanValue: false }), null)
  assert.equal(parseCustomFieldDefault('number', { text: '   ', isNull: false, booleanValue: false }), null)
})

test('unknown attempts reuse the frozen payload, ETag, and key across same-actor token refresh', () => {
  syncTemplateCustomFieldSession(true, 'subject-1', 'tenant-1')
  const generation = getTemplateCustomFieldSessionGeneration()
  const payload = makeCustomFieldChanges([{ key: 'threshold', name: 'renamed' }])
  const attempt = createTemplateCustomFieldAttempt('template-1', payload, '"etag-v1"', 'field-edit-key-1', generation)
  payload.upsert[0].name = 'mutated after send'
  assert.equal(attempt.payload.upsert[0].name, 'renamed')
  const unknownAttempt = markTemplateCustomFieldUnknown('template-1', generation)
  assert.notEqual(unknownAttempt, attempt)
  assert.equal(attempt.previouslyUnknown, false)
  assert.equal(unknownAttempt?.previouslyUnknown, true)
  assert.equal(getTemplateCustomFieldAttempt('template-1'), unknownAttempt)
  assert.equal(unknownAttempt?.etag, '"etag-v1"')
  assert.equal(unknownAttempt?.key, 'field-edit-key-1')
  assert.deepEqual(unknownAttempt?.payload, { upsert: [{ key: 'threshold', name: 'renamed' }], remove: [] })
  assert.equal(shouldRetainTemplateCustomFieldAttempt(401, true), true)
  assert.equal(shouldRetainTemplateCustomFieldAttempt(409, true), true)
  assert.equal(shouldRetainTemplateCustomFieldAttempt(412, true), true)
  assert.equal(syncTemplateCustomFieldSession(true, 'subject-1', 'tenant-1'), false)
  const reused = createTemplateCustomFieldAttempt(
    'template-1',
    makeCustomFieldChanges([], ['new-change']),
    '"etag-v2"',
    'new-key',
    generation
  )
  assert.equal(reused, unknownAttempt)
  assert.equal(reused.etag, '"etag-v1"')
  assert.equal(reused.key, 'field-edit-key-1')
  assert.deepEqual(reused.payload, { upsert: [{ key: 'threshold', name: 'renamed' }], remove: [] })
})

test('first explicit precondition or value conflict can be corrected while unknown retry errors remain frozen', () => {
  assert.equal(shouldRetainTemplateCustomFieldAttempt(412, false), false)
  assert.equal(shouldRetainTemplateCustomFieldAttempt(409, false), false)
  assert.equal(shouldRetainTemplateCustomFieldAttempt(422, false), false)
  assert.equal(shouldRetainTemplateCustomFieldAttempt(undefined, false), true)
  assert.equal(shouldRetainTemplateCustomFieldAttempt(412, true), true)
})

test('changing the authenticated actor clears the old template attempt and rejects stale completion', () => {
  syncTemplateCustomFieldSession(true, 'subject-2', 'tenant-2')
  const generation = getTemplateCustomFieldSessionGeneration()
  createTemplateCustomFieldAttempt(
    'template-2',
    makeCustomFieldChanges([{ key: 'field-b', enabled: false }]),
    '"etag"',
    'field-key-2',
    generation
  )
  assert.equal(syncTemplateCustomFieldSession(true, 'subject-3', 'tenant-2'), true)
  assert.equal(getTemplateCustomFieldAttempt('template-2'), undefined)
  assert.equal(clearTemplateCustomFieldAttempt('template-2', generation), false)
  assert.equal(getTemplateCustomFieldSessionGeneration(), generation + 1)
})
