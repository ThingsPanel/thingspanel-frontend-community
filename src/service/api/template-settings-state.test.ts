import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  administrativeStateNotice,
  buildAccessPolicyConfiguration,
  buildAdministrativeStatePatch,
  buildImageAssetPatch,
  nextAdministrativeState,
  readAccessPolicy,
  validateAccessPolicy,
  type TemplateAccessPolicy
} from './template-settings-state'
import type { DeviceAccessTemplate } from './template-native-transport'

const rawBody = `{"data":{"id":"t-1","administrativeState":"enabled","imageAssetId":null,"configuration":{"deviceKind":"gateway","model":null,"access":{"mode":"direct","protocol":"mqtt","providerId":null,"parameters":{"precision":9007199254740993,"nested":{"ratio":1.000000000000000001}},"credentialPolicy":{"kind":"token","autoRegister":false},"onlinePolicy":{"mode":"transport","timeoutSeconds":30},"connectionDirection":"device_to_platform","serviceInstanceId":null},"topicMappings":[],"processingScripts":[],"customFieldDefinitions":[]}},"meta":{"requestId":"r-1"}}`

function templateWith(access: Record<string, unknown>): DeviceAccessTemplate {
  return {
    configuration: { access }
  } as unknown as DeviceAccessTemplate
}

const policy: TemplateAccessPolicy = { autoRegister: true, onlineMode: 'heartbeat', onlineTimeoutSeconds: 120 }

test('the policy edit keeps provider parameters and every other token untouched', () => {
  const configuration = buildAccessPolicyConfiguration(rawBody, policy)
  assert.equal(configuration.includes('"precision":9007199254740993'), true)
  assert.equal(configuration.includes('"ratio":1.000000000000000001'), true)
  const parsed = JSON.parse(configuration) as {
    access: {
      credentialPolicy: { kind: string; autoRegister: boolean }
      onlinePolicy: { mode: string; timeoutSeconds: number }
    }
  }
  assert.equal(parsed.access.credentialPolicy.autoRegister, true)
  assert.equal(parsed.access.credentialPolicy.kind, 'token')
  assert.equal(parsed.access.onlinePolicy.mode, 'heartbeat')
  assert.equal(parsed.access.onlinePolicy.timeoutSeconds, 120)
})

test('the policy edit is repeatable so a retry stays byte-identical', () => {
  const first = buildAccessPolicyConfiguration(rawBody, policy)
  const second = buildAccessPolicyConfiguration(rawBody, policy)
  assert.equal(first, second)
})

test('the online policy bounds match the native configuration', () => {
  assert.equal(validateAccessPolicy(policy), undefined)
  assert.equal(validateAccessPolicy({ ...policy, onlineTimeoutSeconds: 1 }), undefined)
  assert.equal(validateAccessPolicy({ ...policy, onlineTimeoutSeconds: 86400 }), undefined)
  assert.match(String(validateAccessPolicy({ ...policy, onlineTimeoutSeconds: 0 })), /1 到 86400/)
  assert.match(String(validateAccessPolicy({ ...policy, onlineTimeoutSeconds: 86401 })), /1 到 86400/)
  assert.match(String(validateAccessPolicy({ ...policy, onlineTimeoutSeconds: 1.5 })), /整数/)
  assert.match(
    String(validateAccessPolicy({ ...policy, onlineMode: 'bogus' as unknown as TemplateAccessPolicy['onlineMode'] })),
    /在线判定方式/
  )
})

test('a missing policy member is read as the native defaults instead of guessing', () => {
  assert.equal(readAccessPolicy(null), null)
  assert.deepEqual(readAccessPolicy(templateWith({})), {
    autoRegister: false,
    onlineMode: 'transport',
    onlineTimeoutSeconds: 0
  })
  assert.deepEqual(readAccessPolicy(templateWith({ credentialPolicy: { autoRegister: true } })), {
    autoRegister: true,
    onlineMode: 'transport',
    onlineTimeoutSeconds: 0
  })
})

test('cover and administrative state are patched without carrying configuration', () => {
  assert.equal(
    buildImageAssetPatch('55555555-5555-4555-8555-555555555555'),
    '{"imageAssetId":"55555555-5555-4555-8555-555555555555"}'
  )
  assert.equal(buildImageAssetPatch(null), '{"imageAssetId":null}')
  assert.equal(buildAdministrativeStatePatch('disabled'), '{"administrativeState":"disabled"}')
  assert.equal(buildAdministrativeStatePatch('enabled'), '{"administrativeState":"enabled"}')
  assert.throws(() => buildAdministrativeStatePatch('paused' as unknown as 'enabled'), /enabled or disabled/)
})

test('the state toggle and notice describe the native rule: disabled blocks new binding only', () => {
  assert.equal(nextAdministrativeState('enabled'), 'disabled')
  assert.equal(nextAdministrativeState('disabled'), 'enabled')
  assert.equal(nextAdministrativeState(undefined), 'disabled')
  assert.match(administrativeStateNotice('disabled'), /不会新绑定/)
  assert.match(administrativeStateNotice('enabled'), /允许新绑定/)
})
