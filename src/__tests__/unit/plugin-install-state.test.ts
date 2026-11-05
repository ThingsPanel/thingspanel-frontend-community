import { describe, expect, it } from 'vitest'
import {
  buildConfig,
  errorText,
  isHttpUrl,
  missingFields,
  stateView,
  stepProgress
} from '@/views/apply/plugin/install-state'
import type { Installation } from '@/service/api/plugin-install'

const tx = (zh: string) => zh
const fields = {
  HA_BASE_URL: { required: true, secret: false, description: '', validate: 'url' },
  HA_ACCESS_TOKEN: { required: true, secret: true, description: '' }
}
const base = (over: Partial<Installation>): Installation => ({
  id: 'i',
  plugin_id: 'homeassistant',
  state: 'installing',
  desired: 'enabled',
  generation: 1,
  version: '1',
  health: '',
  op_id: 'op1',
  op_step: '',
  error_code: '',
  config: {},
  secrets_set: [],
  updated_at: '',
  ...over
})

describe('plugin install state view', () => {
  it('keeps installed, needs-configuration and enabled visibly different', () => {
    const labels = (['installed', 'pending_config', 'enabled'] as const).map(s => stateView(s, tx).label)
    expect(new Set(labels).size).toBe(3)
    expect(stateView('failed', tx).type).toBe('error')
    expect(stateView(undefined, tx).label).toBe('未安装')
  })

  it('does not send blank values, so a blank secret never overwrites the stored one', () => {
    expect(buildConfig(fields, { HA_BASE_URL: ' http://ha:8123 ', HA_ACCESS_TOKEN: '' })).toEqual({
      HA_BASE_URL: 'http://ha:8123'
    })
    expect(buildConfig(fields, { OTHER: 'x' })).toEqual({})
  })

  it('treats an already-set secret as satisfied', () => {
    expect(missingFields(fields, {}, [])).toEqual(['HA_BASE_URL', 'HA_ACCESS_TOKEN'])
    expect(missingFields(fields, { HA_BASE_URL: 'http://x' }, ['HA_ACCESS_TOKEN'])).toEqual([])
  })

  it('accepts only http(s) URLs', () => {
    expect(isHttpUrl('http://homeassistant.local:8123')).toBe(true)
    expect(isHttpUrl('javascript:alert(1)')).toBe(false)
    expect(isHttpUrl('ha.local')).toBe(false)
  })

  it('shows progress of the latest operation only', () => {
    const events = [
      { id: 3, op_id: 'op1', step: 'identity', outcome: 'ok', code: '', created_at: '' },
      { id: 2, op_id: 'op1', step: 'check', outcome: 'ok', code: '', created_at: '' },
      { id: 1, op_id: 'old', step: 'health', outcome: 'ok', code: '', created_at: '' }
    ] as any
    const p = stepProgress(base({}), events)
    expect(p.map(s => s.status)).toEqual(['done', 'done', 'todo', 'todo', 'todo'])
    const failed = stepProgress(base({ state: 'failed', op_step: 'agent_grant', error_code: 'agent_rejected' }), events)
    expect(failed.find(s => s.step === 'agent')?.status).toBe('failed')
    expect(stepProgress(base({ state: 'enabled' }), []).every(s => s.status === 'done')).toBe(true)
  })

  it('maps backend error codes to readable text and never echoes unknown payloads', () => {
    expect(errorText('health_failed', tx)).toContain('健康检查')
    expect(errorText('', tx)).toBe('')
  })
})
