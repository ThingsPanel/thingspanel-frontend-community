import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  PROCESSING_PHASES,
  buildProcessingScriptsConfiguration,
  cloneProcessingScripts,
  makeProcessingScript,
  processingPhaseLabel,
  removeProcessingScript,
  serializeProcessingScripts,
  setProcessingScriptEnabled,
  upsertProcessingScript,
  validateProcessingScript,
  type ProcessingScript
} from './template-processing-scripts-state'

function script(overrides: Partial<ProcessingScript> = {}): ProcessingScript {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    name: '上行遥测解码',
    description: null,
    phase: 'telemetry_up',
    language: 'lua',
    entrypoint: 'encodeInp',
    content: 'function encodeInp(msg, topic) return msg end',
    enabled: true,
    lastSampleInput: null,
    ...overrides
  }
}

const rawBody = `{"data":{"id":"t-1","configuration":{"deviceKind":"gateway","model":null,"access":{"mode":"direct","protocol":"mqtt","providerId":null,"parameters":{"precision":9007199254740993},"credentialPolicy":{"kind":"none","autoRegister":false},"onlinePolicy":{"mode":"transport","timeoutSeconds":30},"connectionDirection":"device_to_platform","serviceInstanceId":null},"topicMappings":[],"processingScripts":[],"customFieldDefinitions":[]}},"meta":{"requestId":"r-1"}}`

test('the six native phases keep their legacy A–F grouping', () => {
  assert.deepEqual(
    PROCESSING_PHASES.map(option => [option.legacyCode, option.value]),
    [
      ['A', 'telemetry_up'],
      ['B', 'telemetry_down'],
      ['C', 'attribute_up'],
      ['D', 'attribute_down'],
      ['E', 'command_down'],
      ['F', 'event_up']
    ]
  )
  assert.equal(processingPhaseLabel('command_down'), '命令下发预处理')
})

test('a complete script passes the same rules the native configuration enforces', () => {
  assert.equal(validateProcessingScript(script()), undefined)
  assert.equal(validateProcessingScript(script({ enabled: false, description: '说明' })), undefined)
})

test('name, description, and content bounds are rejected before the request', () => {
  assert.match(String(validateProcessingScript(script({ name: '   ' }))), /名称/)
  assert.match(String(validateProcessingScript(script({ name: 'a'.repeat(129) }))), /128/)
  assert.match(String(validateProcessingScript(script({ description: 'a'.repeat(2001) }))), /描述/)
  assert.match(String(validateProcessingScript(script({ content: '' }))), /脚本内容/)
  assert.match(String(validateProcessingScript(script({ content: 'a'.repeat(262145) }))), /262144/)
  assert.match(String(validateProcessingScript(script({ lastSampleInput: 'a'.repeat(262145) }))), /示例输入/)
})

test('the execution contract is fixed to lua and encodeInp', () => {
  assert.match(String(validateProcessingScript(script({ language: 'python' as unknown as 'lua' }))), /lua/)
  assert.match(String(validateProcessingScript(script({ entrypoint: 'main' as unknown as 'encodeInp' }))), /encodeInp/)
})

test('only one enabled script per phase is accepted, and editing the same row is allowed', () => {
  const other = script({ id: '22222222-2222-4222-8222-222222222222' })
  assert.match(String(validateProcessingScript(other, { existing: [script()] })), /只能有一条启用/)
  assert.equal(validateProcessingScript(other, { existing: [script({ enabled: false })] }), undefined)
  assert.equal(validateProcessingScript(script(), { existing: [script()] }), undefined)
  assert.equal(validateProcessingScript(script({ phase: 'event_up' }), { existing: [script()] }), undefined)
})

test('serialization keeps the contract fields in a stable order and only those fields', () => {
  assert.equal(
    serializeProcessingScripts([script({ description: '说明', lastSampleInput: '{"t":1}', enabled: false })]),
    '[{"id":"11111111-1111-4111-8111-111111111111","name":"上行遥测解码","description":"说明","phase":"telemetry_up","language":"lua","entrypoint":"encodeInp","content":"function encodeInp(msg, topic) return msg end","enabled":false,"lastSampleInput":"{\\"t\\":1}"}]'
  )
})

test('the configuration sent to PATCH keeps untouched tokens, including precision', () => {
  const configuration = buildProcessingScriptsConfiguration(rawBody, [script()])
  assert.equal(configuration.includes('"precision":9007199254740993'), true)
  const parsed = JSON.parse(configuration) as {
    topicMappings: unknown[]
    processingScripts: Array<{ id: string }>
    customFieldDefinitions: unknown[]
  }
  assert.equal(parsed.processingScripts.length, 1)
  assert.deepEqual(parsed.topicMappings, [])
  assert.deepEqual(parsed.customFieldDefinitions, [])
})

test('list edits are immutable so an unknown save cannot mutate the frozen view', () => {
  const original = [script()]
  const added = upsertProcessingScript(
    original,
    script({ id: '33333333-3333-4333-8333-333333333333', phase: 'event_up', enabled: false })
  )
  assert.equal(original.length, 1)
  assert.equal(added.length, 2)
  const updated = upsertProcessingScript(original, script({ name: '改名' }))
  assert.equal(original[0].name, '上行遥测解码')
  assert.equal(updated[0].name, '改名')
  const removed = removeProcessingScript(added, '33333333-3333-4333-8333-333333333333')
  assert.equal(removed.length, 1)
  assert.equal(added.length, 2)
  const toggled = setProcessingScriptEnabled(original, original[0].id, false)
  assert.equal(original[0].enabled, true)
  assert.equal(toggled[0].enabled, false)
  const cloned = cloneProcessingScripts(original)
  cloned[0].name = '另一个'
  assert.equal(original[0].name, '上行遥测解码')
})

test('a new script starts on telemetry_up, disabled, with the fixed contract', () => {
  const created = makeProcessingScript('44444444-4444-4444-8444-444444444444')
  assert.equal(created.phase, 'telemetry_up')
  assert.equal(created.enabled, false)
  assert.equal(created.language, 'lua')
  assert.equal(created.entrypoint, 'encodeInp')
  assert.equal(created.content, '')
  assert.equal(created.description, null)
  assert.equal(created.lastSampleInput, null)
})
