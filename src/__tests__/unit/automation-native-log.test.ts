import { describe, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ listRuns: vi.fn(), getRun: vi.fn() }))
vi.mock('@/service/api/automation-rules', () => ({
  AutomationApiError: class extends Error {},
  ...mocks,
  createRule: vi.fn(),
  deleteRule: vi.fn(),
  getRule: vi.fn(),
  listRules: vi.fn(),
  runRule: vi.fn(),
  setRuleEnabled: vi.fn(),
  updateRule: vi.fn()
}))
vi.mock('@/service/api/automation', () => ({}))
import { sceneLog } from '@/service/api/automation-native'

describe('native execution log evidence', () => {
  it('loads detail instead of treating a summary as zero steps', async () => {
    mocks.listRuns.mockResolvedValue({ runs: [{ id: 'run-a', status: 'succeeded', steps: null }], total: 1 })
    mocks.getRun.mockResolvedValue({
      id: 'run-a',
      status: 'succeeded',
      steps: [{ kind: 'action', status: 'accepted' }],
      targets: [{ selected: true }]
    })
    const result = await sceneLog({ id: 'rule-a' })
    expect(result.error).toBeNull()
    expect(mocks.getRun).toHaveBeenCalledWith('run-a')
    expect(result.data.list[0].detail).toContain('1/1 步完成')
  })
  it.each(['partial', 'running', 'queued', 'ignored', 'cancelled', 'rejected'])(
    'does not label %s as success or failure',
    async status => {
      mocks.listRuns.mockResolvedValue({ runs: [{ id: 'run-a' }], total: 1 })
      mocks.getRun.mockResolvedValue({ id: 'run-a', status, steps: [], targets: [] })
      const result = await sceneLog({ id: 'rule-a' })
      expect(result.data.list[0].execution_result).toBe(status)
      expect(result.data.list[0].execution_label).toBeTruthy()
    }
  )
})
