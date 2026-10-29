import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildTopicMappingsConfiguration,
  clearTemplateTopicAttempt,
  cloneTopicMappings,
  createTemplateTopicAttempt,
  getTemplateTopicAttempt,
  getTemplateTopicSessionGeneration,
  makeTopicMapping,
  markTemplateTopicUnknown,
  removeTopicMapping,
  serializeTopicMappings,
  setTopicMappingEnabled,
  shouldRetainTemplateTopicAttempt,
  syncTemplateTopicSession,
  upsertTopicMapping,
  validateTopicMapping,
  type TopicMapping
} from './template-topic-mappings-state'

function mapping(overrides: Partial<TopicMapping> = {}): TopicMapping {
  return {
    id: '44444444-4444-4444-8444-444444444444',
    name: '上行遥测',
    description: null,
    direction: 'up',
    sourceTopic: 'devices/up',
    targetTopic: 'telemetry',
    dataIdentifier: null,
    priority: 100,
    enabled: true,
    dataKind: null,
    ...overrides
  }
}

const rawBody = `{"data":{"id":"t-1","configuration":{"deviceKind":"gateway","model":null,"access":{"mode":"direct","protocol":"mqtt","providerId":null,"parameters":{"precision":9007199254740993},"credentialPolicy":{"kind":"none","autoRegister":false},"onlinePolicy":{"mode":"transport","timeoutSeconds":30},"connectionDirection":"device_to_platform","serviceInstanceId":null},"topicMappings":[],"processingScripts":[],"customFieldDefinitions":[]}},"meta":{"requestId":"r-1"}}`

test('a complete mapping passes the same rules the native configuration enforces', () => {
  assert.equal(validateTopicMapping(mapping(), { hasModel: false }), undefined)
  assert.equal(
    validateTopicMapping(mapping({ dataKind: 'TELEMETRY', dataIdentifier: 'temperature' }), { hasModel: true }),
    undefined
  )
})

test('name, topic, and priority bounds are rejected before the request', () => {
  assert.match(String(validateTopicMapping(mapping({ name: '   ' }), { hasModel: false })), /名称/)
  assert.match(String(validateTopicMapping(mapping({ name: 'a'.repeat(129) }), { hasModel: false })), /128/)
  assert.match(String(validateTopicMapping(mapping({ sourceTopic: '' }), { hasModel: false })), /源主题/)
  assert.match(String(validateTopicMapping(mapping({ targetTopic: 'a'.repeat(1025) }), { hasModel: false })), /1024/)
  assert.match(String(validateTopicMapping(mapping({ priority: -1 }), { hasModel: false })), /优先级/)
  assert.match(String(validateTopicMapping(mapping({ priority: 10001 }), { hasModel: false })), /优先级/)
  assert.match(String(validateTopicMapping(mapping({ priority: 1.5 }), { hasModel: false })), /优先级/)
  assert.match(String(validateTopicMapping(mapping({ description: 'a'.repeat(2001) }), { hasModel: false })), /描述/)
})

test('data kind and identifier must be paired and resolvable', () => {
  assert.match(String(validateTopicMapping(mapping({ dataKind: 'TELEMETRY' }), { hasModel: true })), /同时/)
  assert.match(String(validateTopicMapping(mapping({ dataIdentifier: 'temperature' }), { hasModel: true })), /同时/)
  assert.match(
    String(validateTopicMapping(mapping({ dataKind: 'TELEMETRY', dataIdentifier: '  ' }), { hasModel: true })),
    /数据标识/
  )
  assert.match(
    String(
      validateTopicMapping(mapping({ dataKind: 'TELEMETRY', dataIdentifier: 'temperature' }), { hasModel: false })
    ),
    /物模型/
  )
})

test('a duplicate direction/source/target triple is rejected while editing the same row', () => {
  const existing = [mapping(), mapping({ id: '55555555-5555-4555-8555-555555555555', targetTopic: 'other' })]
  const duplicate = mapping({ id: '88888888-8888-4888-8888-888888888888' })
  assert.match(String(validateTopicMapping(duplicate, { hasModel: false, existing })), /相同/)
  assert.equal(validateTopicMapping(mapping(), { hasModel: false, existing: [mapping()] }), undefined)
})

test('serialization keeps the contract fields in a stable order and only those fields', () => {
  const serialized = serializeTopicMappings([
    mapping({ description: '说明', dataKind: 'EVENT', dataIdentifier: 'alarm', enabled: false })
  ])
  assert.equal(
    serialized,
    '[{"id":"44444444-4444-4444-8444-444444444444","name":"上行遥测","description":"说明","direction":"up","sourceTopic":"devices/up","targetTopic":"telemetry","dataIdentifier":"alarm","priority":100,"enabled":false,"dataKind":"EVENT"}]'
  )
})

test('the configuration sent to PATCH keeps untouched tokens, including precision', () => {
  const configuration = buildTopicMappingsConfiguration(rawBody, [mapping()])
  assert.equal(configuration.includes('"precision":9007199254740993'), true)
  const parsed = JSON.parse(configuration) as {
    topicMappings: Array<{ id: string }>
    processingScripts: unknown[]
    customFieldDefinitions: unknown[]
  }
  assert.equal(parsed.topicMappings.length, 1)
  assert.deepEqual(parsed.processingScripts, [])
  assert.deepEqual(parsed.customFieldDefinitions, [])
})

test('list edits are immutable so an unknown save cannot mutate the frozen view', () => {
  const original = [mapping()]
  const added = upsertTopicMapping(original, mapping({ id: '66666666-6666-4666-8666-666666666666', name: '下行' }))
  assert.equal(original.length, 1)
  assert.equal(added.length, 2)
  const updated = upsertTopicMapping(original, mapping({ name: '改名' }))
  assert.equal(original[0].name, '上行遥测')
  assert.equal(updated[0].name, '改名')
  const removed = removeTopicMapping(added, '66666666-6666-4666-8666-666666666666')
  assert.equal(removed.length, 1)
  assert.equal(added.length, 2)
  const toggled = setTopicMappingEnabled(original, original[0].id, false)
  assert.equal(original[0].enabled, true)
  assert.equal(toggled[0].enabled, false)
  const cloned = cloneTopicMappings(original)
  cloned[0].name = '另一个'
  assert.equal(original[0].name, '上行遥测')
})

test('a new mapping starts disabled for data binding and enabled for the mapping itself', () => {
  const created = makeTopicMapping('77777777-7777-4777-8777-777777777777')
  assert.equal(created.id, '77777777-7777-4777-8777-777777777777')
  assert.equal(created.dataKind, null)
  assert.equal(created.dataIdentifier, null)
  assert.equal(created.direction, 'up')
  assert.equal(created.enabled, true)
  assert.equal(created.description, null)
})

test('an unknown save keeps the frozen payload, ETag, and key for a same-actor retry', () => {
  syncTemplateTopicSession(true, 'subject-1', 'tenant-1')
  const generation = getTemplateTopicSessionGeneration()
  const attempt = createTemplateTopicAttempt('t-1', '{"a":1}', '"v1"', 'key-1', generation)
  assert.equal(createTemplateTopicAttempt('t-1', '{"a":2}', '"v2"', 'key-2', generation), attempt)
  assert.equal(attempt.configurationJson, '{"a":1}')
  const unknown = markTemplateTopicUnknown('t-1', generation)
  assert.equal(unknown?.previouslyUnknown, true)
  assert.equal(getTemplateTopicAttempt('t-1')?.key, 'key-1')
  assert.equal(clearTemplateTopicAttempt('t-1', generation), true)
  assert.equal(getTemplateTopicAttempt('t-1'), undefined)
})

test('a new authenticated actor drops the previous attempt and rejects a stale one', () => {
  syncTemplateTopicSession(true, 'subject-1', 'tenant-1')
  const staleGeneration = getTemplateTopicSessionGeneration()
  createTemplateTopicAttempt('t-1', '{"a":1}', '"v1"', 'key-1', staleGeneration)
  assert.equal(syncTemplateTopicSession(true, 'subject-2', 'tenant-1'), true)
  assert.equal(getTemplateTopicAttempt('t-1'), undefined)
  assert.throws(() => createTemplateTopicAttempt('t-1', '{"a":1}', '"v1"', 'key-1', staleGeneration), /session changed/)
  assert.equal(markTemplateTopicUnknown('t-1', staleGeneration), undefined)
  assert.equal(clearTemplateTopicAttempt('t-1', staleGeneration), false)
})

test('only a known rejection is correctable; uncertainty stays frozen', () => {
  for (const status of [400, 409, 412, 422]) {
    assert.equal(shouldRetainTemplateTopicAttempt(status, false), false)
  }
  for (const status of [undefined, 500, 502, 503]) {
    assert.equal(shouldRetainTemplateTopicAttempt(status, false), true)
  }
  assert.equal(shouldRetainTemplateTopicAttempt(412, true), true)
})
