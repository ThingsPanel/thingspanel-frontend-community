import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/storage', () => ({ localStg: { get: () => undefined } }))

import {
  createRule,
  deleteRule,
  explainRule,
  getRule,
  getRun,
  listRules,
  listRuns,
  previewRuleChange,
  setRuleEnabled,
  simulateRule,
  updateRule,
  validateRule,
  type Rule
} from '@/service/api/automation-rules'

const definition = {
  kind: 'automation' as const,
  mode: 'single' as const,
  scope: 'device' as const,
  trigger: { groups: [], for: '0s' },
  freshness: { max_age: '1m', max_gap: '1m' },
  targets: {},
  steps: []
}

const rule: Rule = {
  id: 'rule-1',
  tenant_id: 'tenant-1',
  name: 'Test rule',
  kind: 'automation',
  enabled: true,
  revision: 1,
  version: 1,
  definition_hash: 'hash-1',
  definition,
  created_at: '2026-10-27T00:00:00Z',
  updated_at: '2026-10-27T00:00:00Z'
}

const input = { name: rule.name, definition, enabled: true }

afterEach(() => vi.unstubAllGlobals())

describe('automation rule response validation', () => {
  it('treats empty HTTP 200 create and update bodies as unknown writes', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 }))
    )

    await expect(createRule(input, 'create-key')).rejects.toMatchObject({
      httpStatus: 200,
      outcomeUnknown: true
    })
    await expect(updateRule('rule-1', { name: rule.name, definition, version: 1 }, 'update-key')).rejects.toMatchObject(
      { httpStatus: 200, outcomeUnknown: true }
    )
  })

  it('accepts the bare rule DTO returned by the native service', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(rule), { status: 201 }))
    )

    await expect(createRule(input, 'create-key')).resolves.toMatchObject({ id: 'rule-1', name: 'Test rule' })
  })

  it('accepts the native list DTO with rules and total only', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ rules: [rule], total: 1 }), { status: 200 }))
    )

    await expect(listRules({ limit: 100 })).resolves.toMatchObject({ rules: [{ id: 'rule-1' }], total: 1 })
  })

  it('normalizes nil run slices and validates the real outbox wire fields', async () => {
    const run = {
      id: 'run-1',
      tenant_id: 'tenant-1',
      rule_id: 'rule-1',
      revision: 1,
      definition_hash: 'hash-1',
      scope_key: 'device:device-1',
      generation: 1,
      device_id: 'device-1',
      status: 'succeeded',
      started_at: '2026-10-27T00:00:00Z',
      steps: null,
      targets: null,
      outbox: [
        {
          id: 'outbox-1',
          kind: 'command',
          state: 'accepted',
          attempt: 1,
          idempotency_key: 'run-1:step-1',
          accepted_ref: 'command-1'
        }
      ]
    }
    vi.stubGlobal(
      'fetch',
      vi.fn(async input => {
        const path = String(input)
        const body = path.includes('/runs?') ? { runs: [run], total: 1, limit: 10, offset: 0 } : run
        return new Response(JSON.stringify(body), { status: 200 })
      })
    )

    await expect(listRuns('rule-1', { limit: 10 })).resolves.toMatchObject({
      runs: [{ steps: [], targets: [], outbox: [{ state: 'accepted', attempt: 1, accepted_ref: 'command-1' }] }]
    })
    await expect(getRun('run-1')).resolves.toMatchObject({ steps: [], targets: [], outbox: [{ state: 'accepted' }] })

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              ...run,
              outbox: [{ id: 'outbox-old', kind: 'command', status: 'accepted', proof: 'fake' }]
            }),
            { status: 200 }
          )
      )
    )
    await expect(getRun('run-1')).rejects.toMatchObject({ httpStatus: 200, outcomeUnknown: false })
  })

  it('accepts the native camelCase change preview and normalizes omitted collections', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              ruleId: 'rule-1',
              baseRevision: 1,
              baseVersion: 1,
              hashBefore: 'before',
              hashAfter: 'after',
              changed: true,
              scope: {
                deviceIds: ['device-1'],
                deviceCount: 1,
                templateIds: ['template-1'],
                templateDeviceCount: 2,
                truncated: false
              },
              runPolicy: { mode: 'single', maxSteps: 32, maxRunDuration: '10m0s', deadline: '2026-10-27T00:10:00Z' },
              requiresConfirmation: true,
              token: 'synthetic-preview-token',
              expiresAt: '2026-10-27T00:10:00Z'
            }),
            { status: 200 }
          )
      )
    )

    await expect(previewRuleChange('rule-1', definition)).resolves.toMatchObject({
      ruleId: 'rule-1',
      requiresConfirmation: true,
      scope: { deviceIds: ['device-1'], templateIds: ['template-1'], deviceCount: 1, templateDeviceCount: 2 },
      dependencies: [],
      bindingIssues: [],
      issues: []
    })
  })

  it('accepts native simulation traces and action DTOs while normalizing nil slices', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              rule_id: 'rule-1',
              revision: 1,
              definition_hash: 'hash-1',
              steps: [{ at: '0s', kind: 'verdict', verdict: 'true', reasons: null, actions: null }],
              actions: [{ path: 'steps[0]', kind: 'action', detail: 'would execute', outcome: 'would_execute' }],
              would_run: 1,
              side_effects: 0,
              notes: null
            }),
            { status: 200 }
          )
      )
    )

    await expect(
      simulateRule('rule-1', { samples: [{ at: '0s', signal: 'telemetry', key: 'temperature', value: '80' }] })
    ).resolves.toMatchObject({
      steps: [{ at: '0s', kind: 'verdict', reasons: [], actions: [] }],
      actions: [{ path: 'steps[0]', outcome: 'would_execute' }],
      notes: []
    })
  })

  it('normalizes nil explain reasons and runs and preserves evidence note', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              rule_id: 'rule-1',
              device_id: 'device-1',
              from: '2026-10-26T23:00:00Z',
              to: '2026-10-27T00:00:00Z',
              verdict: 'no_data',
              reasons: null,
              runs: null,
              evidence: { runs_in_window: 0, state_observed: false, complete: false, note: 'no history' }
            }),
            { status: 200 }
          )
      )
    )

    await expect(explainRule('rule-1', {})).resolves.toMatchObject({
      reasons: [],
      runs: [],
      evidence: { runs_in_window: 0, state_observed: false, complete: false, note: 'no history' }
    })
  })

  it('sends delete force as a query and accepts the native delete result', async () => {
    const fetcher = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            rule_id: 'rule-1',
            rule_name: 'Test rule',
            detached_bindings: 2,
            cleared_pending: 1,
            forced: false
          }),
          { status: 200 }
        )
    )
    vi.stubGlobal('fetch', fetcher)

    await expect(deleteRule('rule-1')).resolves.toMatchObject({
      detached_bindings: 2,
      cleared_pending: 1,
      forced: false
    })
    expect(String(fetcher.mock.calls[0][0])).toContain('?force=false')
    expect(fetcher.mock.calls[0][1]?.body).toBeUndefined()
  })

  it('sends enabled CAS fields without an unsupported request id', async () => {
    const updated = { ...rule, enabled: false, version: 2, revision: 2 }
    const fetcher = vi.fn(async () => new Response(JSON.stringify(updated), { status: 200 }))
    vi.stubGlobal('fetch', fetcher)

    await expect(setRuleEnabled('rule-1', false, 1)).resolves.toMatchObject({ enabled: false, version: 2 })
    const requestBody = JSON.parse(String(fetcher.mock.calls[0][1]?.body))
    expect(requestBody).toEqual({ enabled: false, version: 1 })
    expect(requestBody.request_id).toBeUndefined()
  })

  it('normalizes null validation issues to an empty list and rejects malformed issue entries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              valid: true,
              issues: null,
              definition_hash: 'hash-1',
              step_count: 0
            }),
            { status: 200 }
          )
      )
    )

    await expect(validateRule(definition)).resolves.toMatchObject({ valid: true, issues: [] })

    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              valid: false,
              issues: [{ field: 'definition.trigger', code: 'invalid' }]
            }),
            { status: 200 }
          )
      )
    )
    await expect(validateRule(definition)).rejects.toMatchObject({ httpStatus: 200, outcomeUnknown: false })
  })

  it('reports malformed read DTOs as explicit errors without unknown-write status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{}', { status: 200 }))
    )

    await expect(getRule('rule-1')).rejects.toMatchObject({
      httpStatus: 200,
      outcomeUnknown: false
    })
  })

  it('preserves network failures as unknown write outcomes', async () => {
    const fetcher = vi.fn(async () => {
      throw new TypeError('connection reset')
    })
    vi.stubGlobal('fetch', fetcher)

    await expect(createRule(input, 'create-key')).rejects.toMatchObject({
      httpStatus: 0,
      outcomeUnknown: true
    })
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
})
