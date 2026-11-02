import assert from 'node:assert/strict'
import { test } from 'node:test'
import { shallowRef } from 'vue'
import type { CustomFieldDefinition } from '../../../../service/api/template-custom-fields-state'
import {
  applyDeviceInfoFieldDrafts,
  clearDeviceInfoAttempt,
  createDeviceInfoAttempt,
  getDeviceInfoLocationValidationError,
  getDeviceInfoAttemptForSession,
  getDeviceInfoAttempt,
  getDeviceInfoSessionGeneration,
  isCurrentDeviceInfoSession,
  isActiveDeviceInfoTarget,
  makeDeviceInfoFieldDraft,
  makeDeviceInfoLocationDraft,
  makeDeviceInfoLocationTokens,
  markDeviceInfoAttemptUnknown,
  serializeDeviceInfoFieldDraft,
  shouldRetainDeviceInfoAttempt,
  syncDeviceInfoTarget,
  isCurrentDeviceInfoTarget,
  syncDeviceInfoSession
} from './device-info-state'

function definition(overrides: Partial<CustomFieldDefinition> = {}): CustomFieldDefinition {
  return {
    key: 'reading',
    name: 'Reading',
    type: 'number',
    defaultValue: null,
    description: null,
    enabled: true,
    enumValues: [],
    ...overrides
  }
}

test('unmodified values preserve raw tokens while false, zero, null, empty string and unset stay distinct', () => {
  const definitions = [
    definition(),
    definition({ key: 'switch', type: 'boolean' }),
    definition({ key: 'optional', type: 'string' }),
    definition({ key: 'legacy', enabled: false })
  ]
  const original = {
    reading: '9007199254740993',
    switch: 'false',
    optional: '""',
    legacy: '1.0000000000000001',
    unknown: '9007199254740999'
  }
  const unchanged = {
    reading: makeDeviceInfoFieldDraft('number', true, original.reading),
    switch: makeDeviceInfoFieldDraft('boolean', true, original.switch),
    optional: makeDeviceInfoFieldDraft('string', true, original.optional),
    legacy: { mode: 'value' as const, text: '0' }
  }
  const noChanges = applyDeviceInfoFieldDrafts(original, definitions, unchanged)
  assert.equal(noChanges.changed, false)
  assert.deepEqual(Object.fromEntries(Object.entries(noChanges.tokens)), original)

  const drafts = {
    ...unchanged,
    reading: { mode: 'null' as const, text: '' },
    switch: { mode: 'value' as const, text: 'true' },
    optional: { mode: 'value' as const, text: '' }
  }
  const changed = applyDeviceInfoFieldDrafts(original, definitions, drafts)
  assert.equal(changed.changed, true)
  assert.equal(changed.tokens.reading, 'null')
  assert.equal(changed.tokens.switch, 'true')
  assert.equal(changed.tokens.optional, '""')
  assert.equal(changed.tokens.legacy, original.legacy)
  assert.equal(changed.tokens.unknown, original.unknown)

  const unset = applyDeviceInfoFieldDrafts({ ...original, reading: '0' }, definitions, {
    ...unchanged,
    reading: { mode: 'unset', text: '' }
  })
  assert.equal(Object.hasOwn(unset.tokens, 'reading'), false)
})

test('special property names are treated as own custom field keys', () => {
  const original: Record<string, string> = Object.create(null)
  Object.defineProperty(original, '__proto__', { value: '"old"', enumerable: true, writable: true })
  Reflect.set(original, 'constructor', '1')
  const definitions = [
    definition({ key: '__proto__', type: 'string' }),
    definition({ key: 'constructor', type: 'number' })
  ]
  const drafts: Record<string, { mode: 'value'; text: string }> = Object.create(null)
  Object.defineProperty(drafts, '__proto__', { value: { mode: 'value', text: 'new' }, enumerable: true })
  Reflect.set(drafts, 'constructor', { mode: 'value', text: '2' })
  const result = applyDeviceInfoFieldDrafts(original, definitions, drafts)
  assert.equal(Object.hasOwn(result.tokens, '__proto__'), true)
  assert.equal(result.tokens.__proto__, '"new"')
  assert.equal(result.tokens.constructor, '2')
})

test('number editing keeps legal JSON lexemes and rejects blank, nonfinite, and malformed values', () => {
  assert.equal(serializeDeviceInfoFieldDraft('number', { mode: 'value', text: '9007199254740993' }), '9007199254740993')
  assert.equal(serializeDeviceInfoFieldDraft('number', { mode: 'value', text: '-1.25e+30' }), '-1.25e+30')
  assert.equal(serializeDeviceInfoFieldDraft('number', { mode: 'null', text: '' }), 'null')
  assert.equal(serializeDeviceInfoFieldDraft('number', { mode: 'unset', text: '' }), undefined)
  assert.throws(() => serializeDeviceInfoFieldDraft('number', { mode: 'value', text: '' }), /有限/)
  assert.throws(() => serializeDeviceInfoFieldDraft('number', { mode: 'value', text: 'Infinity' }), /有限/)
  assert.throws(() => serializeDeviceInfoFieldDraft('number', { mode: 'value', text: '01' }), /有限/)
})

test('location drafts preserve untouched coordinate and address tokens and support null clear', () => {
  const original = {
    latitude: '39.98412000000001',
    longitude: '116.30748400000002',
    address: '"\\u4e2d\\u6587地址"',
    historicalScalar: '9007199254740993'
  }
  const draft = makeDeviceInfoLocationDraft(original)
  assert.equal(draft.latitude, original.latitude)
  assert.equal(draft.longitude, original.longitude)
  assert.equal(draft.address, '中文地址')
  assert.deepEqual(Object.fromEntries(Object.entries(makeDeviceInfoLocationTokens(draft, original))), original)

  const addressOnly = makeDeviceInfoLocationTokens({ latitude: '', longitude: '', address: '新地址' }, original)
  assert.deepEqual(Object.fromEntries(Object.entries(addressOnly)), {
    latitude: 'null',
    longitude: 'null',
    address: '"新地址"',
    historicalScalar: '9007199254740993'
  })
  assert.deepEqual(makeDeviceInfoLocationDraft(null), { latitude: '', longitude: '', address: '' })
  const nullAddress = { latitude: 'null', longitude: 'null', address: 'null' }
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(makeDeviceInfoLocationTokens(makeDeviceInfoLocationDraft(nullAddress), nullAddress))
    ),
    nullAddress
  )
})

test('native location accepts zero coordinates and enforces paired finite ranges', () => {
  const zero = { latitude: '0', longitude: '0', address: '' }
  assert.equal(getDeviceInfoLocationValidationError(zero), null)
  assert.deepEqual(Object.fromEntries(Object.entries(makeDeviceInfoLocationTokens(zero, null))), {
    latitude: '0',
    longitude: '0',
    address: '""'
  })
  assert.equal(getDeviceInfoLocationValidationError({ latitude: '-90', longitude: '180', address: '' }), null)
  assert.match(
    getDeviceInfoLocationValidationError({ latitude: '0', longitude: '', address: '' }) ?? '',
    /必须同时填写/
  )
  assert.match(
    getDeviceInfoLocationValidationError({ latitude: '90.0001', longitude: '0', address: '' }) ?? '',
    /纬度必须在/
  )
  assert.match(
    getDeviceInfoLocationValidationError({ latitude: '0', longitude: '-180.01', address: '' }) ?? '',
    /经度必须在/
  )
})

test('save attempt is immutable across unknown retry and same-actor token renewal', () => {
  syncDeviceInfoSession(true, 'subject-device-info-a', 'tenant-device-info-a')
  const session = getDeviceInfoSessionGeneration()
  const attempt = createDeviceInfoAttempt(
    'device-info-a',
    'template-info-a',
    '{"customFields":{"reading":9007199254740993}}',
    '"etag-old"',
    'info-save-key-a',
    session,
    1
  )
  const unknown = markDeviceInfoAttemptUnknown(attempt)
  assert.notEqual(unknown, attempt)
  assert.equal(attempt.previouslyUnknown, false)
  assert.equal(unknown?.previouslyUnknown, true)
  assert.equal(unknown?.payloadJSON, attempt.payloadJSON)
  assert.equal(unknown?.etag, attempt.etag)
  assert.equal(unknown?.key, attempt.key)
  assert.equal(getDeviceInfoAttempt('device-info-a', 'template-info-a', session, 1), unknown)

  assert.equal(syncDeviceInfoSession(true, 'subject-device-info-a', 'tenant-device-info-a'), false)
  assert.equal(isCurrentDeviceInfoSession(session), true)
  assert.equal(
    createDeviceInfoAttempt('device-info-a', 'template-info-a', '{}', '"new-etag"', 'new-key', session, 1),
    unknown
  )
})

test('shallow Vue state preserves helper attempt identity for retry and clear', () => {
  syncDeviceInfoSession(true, 'subject-shallow-a', 'tenant-shallow-a')
  const session = getDeviceInfoSessionGeneration()
  const target = syncDeviceInfoTarget('device-shallow-a', 'template-shallow-a')
  const attempt = createDeviceInfoAttempt(
    'device-shallow-a',
    'template-shallow-a',
    '{}',
    '"etag-shallow"',
    'key-shallow-a',
    session,
    target
  )
  const held = shallowRef(attempt)
  assert.equal(held.value, attempt)
  const unknown = markDeviceInfoAttemptUnknown(held.value)
  assert.ok(unknown)
  held.value = unknown
  assert.equal(getDeviceInfoAttempt('device-shallow-a', 'template-shallow-a', session, target), held.value)
  assert.equal(clearDeviceInfoAttempt(held.value), true)
  assert.equal(getDeviceInfoAttempt('device-shallow-a', 'template-shallow-a', session, target), undefined)
})

test('actor switch invalidates previous session and clears its late attempt', () => {
  syncDeviceInfoSession(true, 'subject-device-info-b', 'tenant-device-info-b')
  const oldSession = getDeviceInfoSessionGeneration()
  const oldAttempt = createDeviceInfoAttempt(
    'device-info-b',
    null,
    '{"location":null}',
    '"etag-b"',
    'info-save-key-b',
    oldSession,
    1
  )
  assert.equal(syncDeviceInfoSession(true, 'subject-device-info-c', 'tenant-device-info-b'), true)
  const newSession = getDeviceInfoSessionGeneration()
  assert.equal(isCurrentDeviceInfoSession(oldSession), false)
  assert.equal(getDeviceInfoAttempt('device-info-b', null, newSession, 1), undefined)
  assert.equal(clearDeviceInfoAttempt(oldAttempt), false)
})

test('switching device invalidates late callbacks and same actor token renewal retains target attempt', () => {
  syncDeviceInfoSession(true, 'subject-target-a', 'tenant-target-a')
  const session = getDeviceInfoSessionGeneration()
  const firstTarget = syncDeviceInfoTarget('target-device-a', 'target-template-a')
  const attempt = createDeviceInfoAttempt(
    'target-device-a',
    'target-template-a',
    '{}',
    '"etag-a"',
    'key-target-a',
    session,
    firstTarget
  )
  assert.equal(syncDeviceInfoSession(true, 'subject-target-a', 'tenant-target-a'), false)
  assert.equal(syncDeviceInfoTarget('target-device-a', 'target-template-a'), firstTarget)
  assert.equal(getDeviceInfoAttempt('target-device-a', 'target-template-a', session, firstTarget), attempt)

  syncDeviceInfoTarget('target-device-b', 'target-template-b')
  assert.equal(isCurrentDeviceInfoTarget('target-device-a', 'target-template-a', firstTarget), false)
  assert.equal(getDeviceInfoAttempt('target-device-a', 'target-template-a', session, firstTarget), attempt)
  assert.equal(isActiveDeviceInfoTarget('target-device-a', 'target-template-a'), false)
  const unknown = markDeviceInfoAttemptUnknown(attempt)
  assert.ok(unknown)
  assert.equal(getDeviceInfoAttemptForSession(session), unknown)
  const secondTarget = syncDeviceInfoTarget('target-device-b', 'target-template-b')
  assert.equal(
    createDeviceInfoAttempt(
      'target-device-b',
      'target-template-b',
      '{"new":true}',
      '"new-etag"',
      'new-key',
      session,
      secondTarget
    ),
    unknown
  )
  const remountedTarget = syncDeviceInfoTarget('target-device-a', 'target-template-a')
  assert.equal(isActiveDeviceInfoTarget('target-device-a', 'target-template-a'), true)
  assert.notEqual(remountedTarget, firstTarget)
  assert.equal(getDeviceInfoAttemptForSession(session), unknown)
})

test('only definite first-attempt responses clear the request; unknown responses stay frozen', () => {
  assert.equal(shouldRetainDeviceInfoAttempt(412, false), false)
  assert.equal(shouldRetainDeviceInfoAttempt(409, false), false)
  assert.equal(shouldRetainDeviceInfoAttempt(422, false), false)
  assert.equal(shouldRetainDeviceInfoAttempt(undefined, false), true)
  assert.equal(shouldRetainDeviceInfoAttempt(401, true), true)
  assert.equal(shouldRetainDeviceInfoAttempt(409, true), true)
  assert.equal(shouldRetainDeviceInfoAttempt(412, true), true)
})
