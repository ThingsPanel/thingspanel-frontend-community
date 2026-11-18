import { beforeEach, expect, it, vi } from 'vitest'
import { sceneInfo, sceneEdit } from '@/service/api/automation-native'
import { sceneFormToDefinition } from '@/service/api/automation-legacy-mapping'
import { getRule, previewRuleChange, updateRule } from '@/service/api/automation-rules'

vi.mock('@/service/api/automation-rules', async importOriginal => ({
  ...(await importOriginal<typeof import('@/service/api/automation-rules')>()),
  getRule: vi.fn(),
  previewRuleChange: vi.fn(),
  updateRule: vi.fn()
}))
const form = {
  name: '原场景',
  actions: [
    {
      action_type: '10',
      action_target: 'dev-a',
      action_param_type: 'attributes',
      action_param: 'power',
      action_value: '{"power":true}'
    }
  ]
}
const definition = sceneFormToDefinition(form).value
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(getRule).mockResolvedValue({
    id: 'scene-a',
    name: form.name,
    enabled: true,
    version: 3,
    definition
  } as Awaited<ReturnType<typeof getRule>>)
})
it('preserves the loaded scene definition on rename and submits its preview token', async () => {
  const loaded = await sceneInfo('scene-a')
  vi.mocked(previewRuleChange).mockResolvedValue({
    token: 'token',
    scope: { deviceCount: 0 },
    requiresConfirmation: false
  } as Awaited<ReturnType<typeof previewRuleChange>>)
  const result = await sceneEdit({ ...loaded.data.info, actions: loaded.data.actions, name: '新名称' })
  expect(result.error).toBeNull()
  expect(updateRule).toHaveBeenCalledWith('scene-a', { name: '新名称', version: 3, definition, previewToken: 'token' })
})
it('rejects a stale form before saving', async () => {
  const result = await sceneEdit({ ...form, id: 'scene-a', version: 2 })
  expect(result.error?.message).toContain('规则已更新')
  expect(updateRule).not.toHaveBeenCalled()
})
