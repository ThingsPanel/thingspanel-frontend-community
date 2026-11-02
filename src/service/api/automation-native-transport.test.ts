import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  AutomationNativeError,
  createAutomationNativeClient,
  mergeAutomationAlarmPages,
  type AutomationNativeOptions
} from './automation-native-transport'

const binding = {
  id: 'binding-1',
  rule_id: 'rule-1',
  source: 'template',
  kind: 'alarm_policy',
  device_config_id: 'cfg/1',
  revision: 2,
  enabled: true,
  created_at: '2026-10-27T00:00:00Z',
  effective_params: { limit: '30' }
}

function makeClient(fetcher: AutomationNativeOptions['fetch']) {
  const seen: Array<{ path: string; init: RequestInit }> = []
  const client = createAutomationNativeClient({
    fetch: async (input, init = {}) => {
      seen.push({ path: String(input), init })
      return fetcher(input, init)
    },
    getToken: () => 'session-token',
    getLanguage: () => 'zh-CN'
  })
  return { client, seen }
}

test('reads use raw JSON, encoded resource IDs, exact query names, and Community auth context', async () => {
  const responses = [
    new Response(JSON.stringify({ device_id: 'device/1', rules: [], issues: [] })),
    new Response(
      JSON.stringify({ device_config_id: 'cfg/1', attached: 1, detached: 0, device_count: 2, bindings: [binding] })
    ),
    new Response(JSON.stringify({ rules: [], total: 0 })),
    new Response(JSON.stringify({ alarms: [], total: 0, limit: 200, offset: 0 })),
    new Response(JSON.stringify({ alarms: [], total: 0, limit: 50, offset: 50 })),
    new Response(
      JSON.stringify({
        id: 'alarm/1',
        policy_id: 'p',
        policy_key: 'k',
        subject_id: 'device/1',
        state: 'active',
        opened_at: '2026-10-27T00:00:00Z'
      })
    )
  ]
  const { client, seen } = makeClient(async () => responses.shift()!)

  assert.equal((await client.deviceAutomation('device/1')).device_id, 'device/1')
  const templateBindings = await client.templateBindings('cfg/1')
  assert.equal(templateBindings.bindings[0].rule_id, 'rule-1')
  assert.equal(templateBindings.bindings[0].kind, 'alarm_policy')
  assert.equal(
    (await client.rules({ kind: 'alarm_policy', device_config_id: 'cfg/1', limit: 50, offset: 100 })).total,
    0
  )
  assert.deepEqual(await client.alarms('device/1', 'active', 200), { alarms: [], total: 0, limit: 200, offset: 0 })
  assert.deepEqual(await client.alarms('device/1', undefined, 50, 50), { alarms: [], total: 0, limit: 50, offset: 50 })
  assert.equal((await client.alarm('alarm/1')).subject_id, 'device/1')

  assert.deepEqual(
    seen.map(call => call.path),
    [
      '/v1/device-automation/device%2F1',
      '/v1/device-configs/cfg%2F1/bindings',
      '/v1/rules?kind=alarm_policy&device_config_id=cfg%2F1&limit=50&offset=100',
      '/v1/alarms?subject_id=device%2F1&state=active&limit=200&offset=0',
      '/v1/alarms?subject_id=device%2F1&limit=50&offset=50',
      '/v1/alarms/alarm%2F1'
    ]
  )
  const headers = new Headers(seen[0].init.headers)
  assert.equal(headers.get('Authorization'), 'Bearer session-token')
  assert.equal(headers.get('x-token'), 'session-token')
  assert.equal(headers.get('Accept-Language'), 'zh-CN')
  assert.equal(
    seen.every(call => call.init.redirect === 'manual'),
    true
  )
})

test('binding and acknowledgement writes carry a stable request_id and detach query key', async () => {
  const responses = [
    new Response(JSON.stringify({ acknowledged: true })),
    new Response(JSON.stringify(binding)),
    new Response(JSON.stringify(binding))
  ]
  const { client, seen } = makeClient(async () => responses.shift()!)
  const requestId = 'request-id-123'

  assert.deepEqual(await client.ack('alarm-1', requestId), { acknowledged: true })
  await client.attach('rule-1', {
    scope_type: 'device_config',
    scope_id: 'cfg/1',
    params: { limit: '35' },
    request_id: requestId
  })
  await client.detach('binding/1', requestId)

  assert.deepEqual(
    seen.map(call => call.path),
    ['/v1/alarms/alarm-1/ack', '/v1/rules/rule-1/bindings', '/v1/bindings/binding%2F1?request_id=request-id-123']
  )
  assert.deepEqual(JSON.parse(String(seen[0].init.body)), { request_id: requestId })
  assert.deepEqual(JSON.parse(String(seen[1].init.body)), {
    scope_type: 'device_config',
    scope_id: 'cfg/1',
    params: { limit: '35' },
    request_id: requestId
  })
  assert.equal(seen[2].init.method, 'DELETE')
})

test('writes are single-attempt and distinguish known validation failures from unknown outcomes', async () => {
  let calls = 0
  const { client, seen } = makeClient(async () => {
    calls += 1
    return new Response(JSON.stringify({ code: 'unavailable', message: 'owner unavailable' }), { status: 503 })
  })
  await assert.rejects(client.ack('alarm-1', 'request-id-123'), error => {
    assert.ok(error instanceof AutomationNativeError)
    assert.equal(error.status, 503)
    assert.equal(error.outcomeUnknown, true)
    return true
  })
  assert.equal(calls, 1)
  assert.equal(seen.length, 1)

  const known = makeClient(
    async () =>
      new Response(
        JSON.stringify({
          code: 'invalid_argument',
          message: 'bad parameters',
          details: { fields: [{ field: 'params.limit', code: 'out_of_range', message: '超出范围' }] }
        }),
        { status: 422 }
      )
  )
  await assert.rejects(
    known.client.attach('rule-1', {
      scope_type: 'device',
      scope_id: 'device-1',
      params: {},
      request_id: 'request-id-124'
    }),
    error => {
      assert.ok(error instanceof AutomationNativeError)
      assert.equal(error.outcomeUnknown, false)
      assert.equal(error.code, 'invalid_argument')
      assert.equal(error.fieldIssues[0]?.field, 'params.limit')
      return true
    }
  )

  const detailed = makeClient(
    async () =>
      new Response(
        JSON.stringify({
          code: 'generic_failure',
          message: 'bad parameters',
          details: { code: 'parameter_out_of_range', fields: [] }
        }),
        { status: 422 }
      )
  )
  await assert.rejects(
    detailed.client.attach('rule-1', {
      scope_type: 'device',
      scope_id: 'device-1',
      params: {},
      request_id: 'request-id-126'
    }),
    error => {
      assert.ok(error instanceof AutomationNativeError)
      assert.equal(error.code, 'parameter_out_of_range')
      return true
    }
  )
})

test('alarm pages merge without duplicates and preserve server ordering', () => {
  const alarm = (id: string, opened_at: string) => ({
    id,
    policy_id: 'p',
    policy_key: 'k',
    subject_id: 'device-1',
    state: 'active',
    opened_at,
    revision: 1,
    epoch: 1,
    first_seq: 1,
    last_seq: 1,
    sample_count: 1
  })
  assert.deepEqual(
    mergeAutomationAlarmPages(
      [alarm('a', '2026-10-27T00:00:02Z'), alarm('c', '2026-10-27T00:00:01Z')],
      [alarm('c', '2026-10-27T00:00:01Z'), alarm('b', '2026-10-27T00:00:01Z')]
    ).map(item => item.id),
    ['a', 'c', 'b']
  )
})

test('malformed successful write response is an unknown result', async () => {
  const { client } = makeClient(async () => new Response('{broken json', { status: 200 }))
  await assert.rejects(client.ack('alarm-1', 'request-id-125'), error => {
    assert.ok(error instanceof AutomationNativeError)
    assert.equal(error.status, 200)
    assert.equal(error.outcomeUnknown, true)
    return true
  })
})
