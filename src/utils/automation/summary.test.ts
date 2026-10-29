import assert from 'node:assert/strict'
import { test } from 'node:test'
import { buildTimeline } from './summary'

test('run timeline describes the actual outbox state and acceptance evidence', () => {
  const timeline = buildTimeline({
    status: 'succeeded',
    outbox: [
      {
        id: 'outbox-1',
        kind: 'command',
        state: 'accepted',
        attempt: 2,
        idempotency_key: 'intent-1',
        accepted_ref: 'command-1'
      }
    ]
  })
  const intent = timeline.find(entry => entry.key === 'outbox-outbox-1')

  assert.equal(intent?.title, '外发 command：已受理')
  assert.match(intent?.detail ?? '', /受理不代表设备已执行/)
  assert.match(intent?.detail ?? '', /幂等键：intent-1/)
  assert.match(intent?.detail ?? '', /尝试次数：2/)
  assert.match(intent?.detail ?? '', /受理凭据：command-1/)
})
