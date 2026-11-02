import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  clearTemplateConfigurationAttempt,
  configurationErrorStatus,
  createTemplateConfigurationAttempt,
  getTemplateConfigurationAttempt,
  getTemplateConfigurationSessionGeneration,
  hasTemplateConfigurationAttempt,
  isCurrentTemplateConfigurationSession,
  markTemplateConfigurationUnknown,
  shouldRetainConfigurationAttempt,
  syncTemplateConfigurationSession
} from './template-configuration-attempt'

test('two configuration members of one template keep separate frozen receipts', () => {
  syncTemplateConfigurationSession(true, 'subject-a', 'tenant-a')
  const generation = getTemplateConfigurationSessionGeneration()
  const topics = createTemplateConfigurationAttempt('t-1', 'topicMappings', '{"a":1}', '"v1"', 'key-1', generation)
  const scripts = createTemplateConfigurationAttempt('t-1', 'processingScripts', '{"b":2}', '"v1"', 'key-2', generation)
  assert.notEqual(topics, scripts)
  assert.equal(getTemplateConfigurationAttempt('t-1', 'topicMappings')?.key, 'key-1')
  assert.equal(getTemplateConfigurationAttempt('t-1', 'processingScripts')?.key, 'key-2')
  assert.equal(hasTemplateConfigurationAttempt('t-1'), true)
  assert.equal(hasTemplateConfigurationAttempt('t-2'), false)
  clearTemplateConfigurationAttempt('t-1', 'topicMappings', generation)
  assert.equal(getTemplateConfigurationAttempt('t-1', 'topicMappings'), undefined)
  assert.equal(hasTemplateConfigurationAttempt('t-1'), true)
  clearTemplateConfigurationAttempt('t-1', 'processingScripts', generation)
  assert.equal(hasTemplateConfigurationAttempt('t-1'), false)
})

test('a repeated start reuses the frozen payload instead of starting a second request', () => {
  syncTemplateConfigurationSession(true, 'subject-b', 'tenant-b')
  const generation = getTemplateConfigurationSessionGeneration()
  const first = createTemplateConfigurationAttempt('t-1', 'processingScripts', '{"a":1}', '"v1"', 'key-1', generation)
  const second = createTemplateConfigurationAttempt('t-1', 'processingScripts', '{"a":2}', '"v2"', 'key-2', generation)
  assert.equal(second, first)
  assert.equal(first.configurationJson, '{"a":1}')
  assert.equal(first.etag, '"v1"')
  assert.equal(first.key, 'key-1')
})

test('an unknown result keeps the receipt and cannot be corrected by a later attempt', () => {
  syncTemplateConfigurationSession(true, 'subject-c', 'tenant-c')
  const generation = getTemplateConfigurationSessionGeneration()
  createTemplateConfigurationAttempt('t-1', 'processingScripts', '{"a":1}', '"v1"', 'key-1', generation)
  const unknown = markTemplateConfigurationUnknown('t-1', 'processingScripts', generation)
  assert.equal(unknown?.previouslyUnknown, true)
  assert.equal(getTemplateConfigurationAttempt('t-1', 'processingScripts')?.key, 'key-1')
  assert.equal(shouldRetainConfigurationAttempt(412, true), true)
})

test('a new authenticated actor drops every member receipt and rejects stale generations', () => {
  syncTemplateConfigurationSession(true, 'subject-d', 'tenant-d')
  const staleGeneration = getTemplateConfigurationSessionGeneration()
  createTemplateConfigurationAttempt('t-1', 'topicMappings', '{"a":1}', '"v1"', 'key-1', staleGeneration)
  createTemplateConfigurationAttempt('t-1', 'processingScripts', '{"b":2}', '"v1"', 'key-2', staleGeneration)
  assert.equal(syncTemplateConfigurationSession(true, 'subject-e', 'tenant-d'), true)
  assert.equal(isCurrentTemplateConfigurationSession(staleGeneration), false)
  assert.equal(hasTemplateConfigurationAttempt('t-1'), false)
  assert.throws(
    () => createTemplateConfigurationAttempt('t-1', 'processingScripts', '{"a":1}', '"v1"', 'key-1', staleGeneration),
    /session changed/
  )
  assert.equal(markTemplateConfigurationUnknown('t-1', 'processingScripts', staleGeneration), undefined)
  assert.equal(clearTemplateConfigurationAttempt('t-1', 'processingScripts', staleGeneration), false)
})

test('the same actor does not invalidate a frozen receipt', () => {
  syncTemplateConfigurationSession(true, 'subject-f', 'tenant-f')
  const generation = getTemplateConfigurationSessionGeneration()
  createTemplateConfigurationAttempt('t-1', 'processingScripts', '{"a":1}', '"v1"', 'key-1', generation)
  assert.equal(syncTemplateConfigurationSession(true, 'subject-f', 'tenant-f'), false)
  assert.equal(getTemplateConfigurationAttempt('t-1', 'processingScripts')?.key, 'key-1')
})

test('only a known rejection is correctable; uncertainty stays frozen', () => {
  for (const status of [400, 409, 412, 422]) {
    assert.equal(shouldRetainConfigurationAttempt(status, false), false)
  }
  for (const status of [undefined, 500, 502, 503]) {
    assert.equal(shouldRetainConfigurationAttempt(status, false), true)
  }
  assert.equal(configurationErrorStatus({ status: 412 }), 412)
  assert.equal(configurationErrorStatus(new Error('network')), undefined)
})
