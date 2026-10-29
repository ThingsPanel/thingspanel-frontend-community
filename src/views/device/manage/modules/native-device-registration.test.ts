import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createNativeDeviceRegistrationAttempt,
  normalizeNativeDeviceTags,
  shouldRetainNativeDeviceRegistrationAttempt
} from './native-device-registration'

test('native device registration freezes literal tags and reuses the same key and payload', () => {
  const tags = ['区域,北侧', '传感器|A']
  const input = { name: '泵站 1', tags, templateId: 'template-7', deviceKind: 'gateway' as const }
  const attempt = createNativeDeviceRegistrationAttempt(input, 'device-create-attempt-1')
  tags.push('later-change')

  assert.equal(attempt.key, 'device-create-attempt-1')
  assert.deepEqual(attempt.payload, {
    name: '泵站 1',
    tags: ['区域,北侧', '传感器|A'],
    templateId: 'template-7',
    deviceKind: 'gateway',
    initialAdministrativeState: 'enabled'
  })
  assert.equal('deviceNumber' in attempt.payload, false)
})

test('native device registration defaults to standalone when no template is selected', () => {
  const attempt = createNativeDeviceRegistrationAttempt(
    { name: '独立设备', tags: [], deviceKind: 'standalone' },
    'device-create-attempt-2'
  )
  assert.deepEqual(attempt.payload, {
    name: '独立设备',
    tags: [],
    deviceKind: 'standalone',
    initialAdministrativeState: 'enabled'
  })
  assert.equal('templateId' in attempt.payload, false)
})

test('native device tags preserve literal text, deduplicate, and enforce the generated schema bounds', () => {
  assert.deepEqual(normalizeNativeDeviceTags(['北区,泵房', '中文标签', '北区,泵房']), ['北区,泵房', '中文标签'])
  assert.equal(normalizeNativeDeviceTags(['字'.repeat(128)])[0], '字'.repeat(128))
  assert.throws(() => normalizeNativeDeviceTags(['字'.repeat(129)]), /128/)
  assert.throws(() => normalizeNativeDeviceTags(Array.from({ length: 101 }, (_, index) => `tag-${index}`)), /100/)
  assert.throws(() => normalizeNativeDeviceTags(['']), /1 至 128/)
})

test('registration retries retain the frozen key after unknown outcomes and conflicts', () => {
  assert.equal(shouldRetainNativeDeviceRegistrationAttempt(401, true), true)
  assert.equal(shouldRetainNativeDeviceRegistrationAttempt(409, true), true)
  assert.equal(shouldRetainNativeDeviceRegistrationAttempt(429, true), true)
  assert.equal(shouldRetainNativeDeviceRegistrationAttempt(409, false), true)
  assert.equal(shouldRetainNativeDeviceRegistrationAttempt(422, false), false)
})
