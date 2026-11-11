import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  readConfigurationMember,
  readConfigurationObject,
  readConfigurationPath,
  replaceConfigurationMember,
  replaceConfigurationMemberAndExtract,
  replaceConfigurationPath
} from './template-configuration-raw'

/** A response body whose untouched values would be rounded by a JSON round-trip. */
function rawResponse(): string {
  return [
    '{',
    '  "data": {',
    '    "id": "11111111-1111-4111-8111-111111111111",',
    '    "name": "网关模板 \\"A\\"",',
    '    "resourceVersion": 5,',
    '    "configuration": {',
    '      "deviceKind": "gateway",',
    '      "model": { "modelId": "22222222-2222-4222-8222-222222222222", "publishedRevision": 9007199254740993 },',
    '      "access": {',
    '        "mode": "direct",',
    '        "protocol": "mqtt",',
    '        "providerId": null,',
    '        "parameters": { "clientId": "a,b}{c", "precision": 9007199254740993 },',
    '        "credentialPolicy": { "kind": "token", "autoRegister": false },',
    '        "onlinePolicy": { "mode": "transport", "timeoutSeconds": 30 },',
    '        "connectionDirection": "device_to_platform",',
    '        "serviceInstanceId": null',
    '      },',
    '      "topicMappings": [],',
    '      "processingScripts": [',
    '        { "id": "33333333-3333-4333-8333-333333333333", "name": "解码", "content": "return {a=1}", "phase": "telemetry_up" }',
    '      ],',
    '      "customFieldDefinitions": [',
    '        { "key": "count", "type": "number", "defaultValue": 9007199254740993 }',
    '      ]',
    '    }',
    '  },',
    '  "meta": { "requestId": "req-1" }',
    '}'
  ].join('\n')
}

test('replacing topic mappings keeps every other token byte-identical', () => {
  const raw = rawResponse()
  const mappings = '[{"id":"44444444-4444-4444-8444-444444444444","name":"上行","direction":"up"}]'
  const patched = replaceConfigurationMember(raw, 'topicMappings', mappings)

  assert.equal(patched.includes(mappings), true)
  // Precision-sensitive integers outside the edited member are untouched.
  assert.equal(patched.split('9007199254740993').length - 1, 3)
  assert.equal(patched.replace(mappings, '[]'), raw)
})

test('replacing one member does not disturb sibling members with braces inside strings', () => {
  const raw = rawResponse()
  const patched = replaceConfigurationMember(raw, 'topicMappings', '[]')
  const parsed = JSON.parse(patched) as {
    data: {
      configuration: {
        access: { parameters: { clientId: string } }
        processingScripts: Array<{ content: string }>
      }
    }
  }
  assert.equal(parsed.data.configuration.access.parameters.clientId, 'a,b}{c')
  assert.equal(parsed.data.configuration.processingScripts[0].content, 'return {a=1}')
  assert.equal(patched.includes('"content": "return {a=1}"'), true)
})

test('extracting the configuration returns the exact object text for a PATCH body', () => {
  const raw = rawResponse()
  const configuration = readConfigurationObject(raw)
  assert.equal(configuration.startsWith('{'), true)
  assert.equal(configuration.endsWith('}'), true)
  const parsed = JSON.parse(configuration) as { customFieldDefinitions: Array<{ defaultValue: number }> }
  assert.equal(typeof parsed.customFieldDefinitions[0].defaultValue, 'number')
  // The number was large enough to lose precision in the parsed value, while the text stays exact.
  assert.equal(configuration.includes('9007199254740993'), true)
})

test('a spliced configuration can be re-parsed and still carries the original precision text', () => {
  const raw = rawResponse()
  const patched = replaceConfigurationMemberAndExtract(raw, 'topicMappings', '[]')
  assert.equal(patched.includes('"precision": 9007199254740993'), true)
  assert.equal(patched.includes('"publishedRevision": 9007199254740993'), true)
  const parsed = JSON.parse(patched) as { topicMappings: unknown[] }
  assert.deepEqual(parsed.topicMappings, [])
})

test('reading a member returns its exact text', () => {
  const raw = rawResponse()
  assert.equal(readConfigurationMember(raw, 'topicMappings'), '[]')
  assert.equal(readConfigurationMember(raw, 'processingScripts').startsWith('['), true)
})

test('missing members and non-object payloads are rejected instead of guessed', () => {
  assert.throws(
    () => replaceConfigurationMember('{"data":{"configuration":null}}', 'topicMappings', '[]'),
    /configuration/
  )
  assert.throws(() => replaceConfigurationMember('{"meta":{}}', 'topicMappings', '[]'), /missing data/)
  assert.throws(() => replaceConfigurationMember('{"data":{}}', 'topicMappings', '[]'), /missing configuration/)
  assert.throws(
    () => replaceConfigurationMember('{"data":{"configuration":{"deviceKind":"gateway"}}}', 'topicMappings', '[]'),
    /missing topicMappings/
  )
  assert.throws(() => replaceConfigurationMember('[]', 'topicMappings', '[]'), /not a JSON object/)
})

test('a nested scalar can be replaced without re-encoding its siblings', () => {
  const raw = rawResponse()
  const patched = replaceConfigurationPath(raw, ['access', 'credentialPolicy', 'autoRegister'], 'true')
  assert.equal(patched.includes('"precision": 9007199254740993'), true)
  assert.equal(patched.includes('"kind": "token"'), true)
  assert.equal(
    readConfigurationPath(patched, ['access', 'credentialPolicy']),
    '{ "kind": "token", "autoRegister": true }'
  )
})

test('a nested object can be replaced and read back as exact text', () => {
  const raw = rawResponse()
  const patched = replaceConfigurationPath(raw, ['access', 'onlinePolicy'], '{"mode":"heartbeat","timeoutSeconds":120}')
  assert.equal(readConfigurationPath(patched, ['access', 'onlinePolicy']), '{"mode":"heartbeat","timeoutSeconds":120}')
  assert.equal(patched.includes('"publishedRevision": 9007199254740993'), true)
})

test('a path that does not resolve is rejected instead of silently ignored', () => {
  const raw = rawResponse()
  assert.throws(() => replaceConfigurationPath(raw, ['access', 'missing'], '1'), /missing access.missing/)
  assert.throws(() => replaceConfigurationPath(raw, ['access', 'mode', 'deeper'], '1'), /not a JSON object/)
  assert.throws(() => replaceConfigurationPath(raw, [], '1'), /must not be empty/)
  assert.throws(() => replaceConfigurationPath(raw, ['access', 'mode'], '   '), /must not be empty/)
})
