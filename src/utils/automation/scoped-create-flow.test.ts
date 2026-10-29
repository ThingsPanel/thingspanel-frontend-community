import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createScopedCreateState, resolveScopedEnableReadback, runScopedCreateFlow } from './scoped-create-flow'

const scope = { type: 'device' as const, id: 'device-1' }
const isUnknown = (error: unknown) => error instanceof Error && error.message === 'unknown'

test('retry after create outcome unknown reuses the exact create request id and payload fingerprint', async () => {
  let requestSequence = 0
  let createCalls = 0
  const state = createScopedCreateState(null, {
    fingerprint: 'frozen-payload',
    scope,
    desiredEnabled: true,
    createRequestId: () => `request-${++requestSequence}`
  })
  const createKeys: string[] = []
  const first = await runScopedCreateFlow(state, {
    create: async (requestId, enabled) => {
      createCalls += 1
      assert.equal(enabled, false)
      createKeys.push(requestId)
      throw new Error('unknown')
    },
    attach: async () => assert.fail('must not attach before create is confirmed'),
    enable: async () => assert.fail('must not enable before create is confirmed'),
    isOutcomeUnknown: isUnknown
  })
  assert.equal(first.state.phase, 'create-unknown')
  assert.throws(
    () =>
      createScopedCreateState(first.state, {
        fingerprint: 'changed-payload',
        scope,
        desiredEnabled: true,
        createRequestId: () => 'new'
      }),
    /原内容和原请求/
  )

  const retryState = createScopedCreateState(first.state, {
    fingerprint: 'frozen-payload',
    scope,
    desiredEnabled: true,
    createRequestId: () => `request-${++requestSequence}`
  })
  const second = await runScopedCreateFlow(retryState, {
    create: async (requestId, enabled) => {
      createCalls += 1
      assert.equal(enabled, false)
      createKeys.push(requestId)
      return { id: 'rule-1', version: 4 }
    },
    attach: async () => undefined,
    enable: async (_ruleId, version) => ({ version: version + 1, enabled: true }),
    isOutcomeUnknown: isUnknown
  })
  assert.deepEqual(createKeys, ['request-1', 'request-1'])
  assert.equal(createCalls, 2)
  assert.equal(second.state.phase, 'attached')
  assert.equal(second.state.ruleId, 'rule-1')
})

test('scope create stays disabled until attach succeeds; attach failure never enables', async () => {
  let createCalls = 0
  let attachCalls = 0
  let enableCalls = 0
  const attachKeys: string[] = []
  let requestSequence = 0
  const initial = createScopedCreateState(null, {
    fingerprint: 'payload',
    scope,
    desiredEnabled: true,
    createRequestId: () => `request-${++requestSequence}`
  })
  const first = await runScopedCreateFlow(initial, {
    create: async (_requestId, enabled) => {
      createCalls += 1
      assert.equal(enabled, false)
      return { id: 'rule-2', version: 7 }
    },
    attach: async (_ruleId, _scope, requestId) => {
      attachCalls += 1
      attachKeys.push(requestId)
      throw new Error('attach failed')
    },
    enable: async () => {
      enableCalls += 1
      return { version: 8, enabled: true }
    },
    isOutcomeUnknown: () => false
  })
  assert.equal(first.state.phase, 'attach-failed')
  assert.equal(first.state.ruleId, 'rule-2')
  const retry = await runScopedCreateFlow(first.state, {
    create: async () => {
      createCalls += 1
      return { id: 'duplicate-rule', version: 1 }
    },
    attach: async (ruleId, _scope, requestId) => {
      assert.equal(ruleId, 'rule-2')
      attachCalls += 1
      attachKeys.push(requestId)
    },
    enable: async (_ruleId, version) => {
      enableCalls += 1
      return { version: version + 1, enabled: true }
    },
    isOutcomeUnknown: () => false
  })
  assert.equal(createCalls, 1)
  assert.equal(attachCalls, 2)
  assert.equal(enableCalls, 1)
  assert.deepEqual(attachKeys, ['request-2', 'request-2'])
  assert.equal(retry.state.phase, 'attached')
})

test('enable unknown resolves by readback without repeating create or attach', async () => {
  let createCalls = 0
  let attachCalls = 0
  let enableCalls = 0
  let requestSequence = 0
  const state = createScopedCreateState(null, {
    fingerprint: 'payload',
    scope,
    desiredEnabled: true,
    createRequestId: () => `request-${++requestSequence}`
  })
  const first = await runScopedCreateFlow(state, {
    create: async (_requestId, enabled) => {
      createCalls += 1
      assert.equal(enabled, false)
      return { id: 'rule-3', version: 3 }
    },
    attach: async () => {
      attachCalls += 1
    },
    enable: async () => {
      enableCalls += 1
      throw new Error('unknown')
    },
    isOutcomeUnknown: isUnknown
  })
  assert.equal(first.state.phase, 'enable-unknown')

  const readback = resolveScopedEnableReadback(first.state, { version: 4, enabled: true })
  assert.equal(readback.kind, 'confirmed')
  assert.equal(readback.state.phase, 'attached')
  assert.equal(createCalls, 1)
  assert.equal(attachCalls, 1)
  assert.equal(enableCalls, 1)
})

test('scope create requested disabled attaches without sending an enable request', async () => {
  let createEnabled: boolean | undefined
  let attachCalls = 0
  let enableCalls = 0
  const state = createScopedCreateState(null, {
    fingerprint: 'disabled-payload',
    scope,
    desiredEnabled: false,
    createRequestId: () => 'create-disabled'
  })
  const result = await runScopedCreateFlow(state, {
    create: async (_requestId, enabled) => {
      createEnabled = enabled
      return { id: 'rule-disabled', version: 5 }
    },
    attach: async () => {
      attachCalls += 1
    },
    enable: async () => {
      enableCalls += 1
      return { version: 6, enabled: true }
    },
    isOutcomeUnknown: () => false
  })

  assert.equal(createEnabled, false)
  assert.equal(attachCalls, 1)
  assert.equal(enableCalls, 0)
  assert.equal(result.state.phase, 'attached')
  assert.equal(result.state.enabledConfirmed, true)
})
