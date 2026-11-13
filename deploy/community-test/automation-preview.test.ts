import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ preview: vi.fn(), update: vi.fn(), warning: vi.fn(), error: vi.fn() }))
vi.mock('vue-router', () => ({
  useRoute: () => ({ query: { id: 'rule-a' }, path: '/automation/rule-edit' }),
  useRouter: () => ({ replace: vi.fn() })
}))
vi.mock('@/store/modules/tab', () => ({ useTabStore: () => ({ removeTab: vi.fn() }) }))
vi.mock('@/service/api/automation-rules', () => ({
  AutomationApiError: class extends Error {},
  getRule: vi.fn(async () => ({
    id: 'rule-a',
    name: 'QA preview',
    enabled: false,
    version: 4,
    definition: {
      kind: 'scene',
      mode: 'single',
      targets: { device_ids: ['device-a'] },
      steps: [{ kind: 'wait', wait: '1s' }]
    }
  })),
  listRules: vi.fn(async () => ({ rules: [] })),
  validateRule: vi.fn(async () => ({ valid: true })),
  previewRuleChange: mocks.preview,
  updateRule: mocks.update,
  createRule: vi.fn(),
  setRuleEnabled: vi.fn()
}))
vi.mock('@/views/automation/modules/condition-editor.vue', () => ({ default: { template: '<div/>' } }))
vi.mock('@/views/automation/modules/step-editor.vue', () => ({ default: { template: '<div/>' } }))
vi.mock('@/views/automation/modules/simulate-drawer.vue', () => ({ default: { template: '<div/>' } }))
vi.mock('naive-ui', async () => {
  const { defineComponent, h } = await import('vue')
  const slot = defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('div', [slots.default?.(), slots.footer?.()])
  })
  const button = defineComponent({
    props: ['disabled', 'loading'],
    emits: ['click'],
    setup:
      (p, { slots, emit }) =>
      () =>
        h('button', { disabled: p.disabled || p.loading, onClick: () => emit('click') }, slots.default?.())
  })
  const modal = defineComponent({
    props: ['show'],
    setup:
      (p, { slots }) =>
      () =>
        p.show ? h('section', { 'data-modal': true }, [slots.default?.(), slots.footer?.()]) : null
  })
  return {
    NAlert: slot,
    NButton: button,
    NCard: slot,
    NCollapse: slot,
    NCollapseItem: slot,
    NDivider: slot,
    NFlex: slot,
    NForm: slot,
    NFormItem: slot,
    NInput: slot,
    NInputNumber: slot,
    NModal: modal,
    NSelect: slot,
    NSpace: slot,
    NSwitch: slot,
    NTag: slot,
    useMessage: () => ({ error: mocks.error, warning: mocks.warning, success: vi.fn() }),
    useDialog: () => ({ warning: vi.fn() })
  }
})
import Editor from '@/views/automation/rule-edit/index.vue'

const wrappers: ReturnType<typeof mount>[] = []
function preview(extra = {}) {
  return {
    ruleId: 'rule-a',
    baseRevision: 1,
    baseVersion: 4,
    hashBefore: 'before',
    hashAfter: 'after',
    changed: true,
    scope: { deviceIds: ['device-a', 'device-b'], deviceCount: 200, templateDeviceCount: 199, truncated: true },
    requiresConfirmation: true,
    token: 'reviewed-token',
    expiresAt: '2099-01-01T00:00:00Z',
    ...extra
  }
}
async function start() {
  const w = mount(Editor)
  wrappers.push(w)
  await flushPromises()
  await w
    .findAll('button')
    .find(b => b.text() === '保存')!
    .trigger('click')
  await flushPromises()
  return w
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.preview.mockResolvedValue(preview())
  mocks.update.mockResolvedValue({ version: 5 })
})
afterEach(() => {
  wrappers.splice(0).forEach(w => w.unmount())
})

it('renders the real camelCase scope and requires confirmation before sending the exact token', async () => {
  const w = await start()
  expect(mocks.preview).toHaveBeenCalledOnce()
  expect(mocks.update).not.toHaveBeenCalled()
  expect(w.find('[data-modal]').text()).toContain('200')
  expect(w.text()).toContain('device-b')
  expect(w.text()).toContain('仅显示前 50 台')
  expect(w.text()).not.toContain('399')
  await w
    .findAll('button')
    .find(b => b.text() === '确认保存')!
    .trigger('click')
  await flushPromises()
  expect(mocks.update).toHaveBeenCalledWith(
    'rule-a',
    expect.objectContaining({ version: 4, previewToken: 'reviewed-token' })
  )
})
it('honors confirmation even with zero device count and never guesses source labels', async () => {
  mocks.preview.mockResolvedValue(preview({ scope: { deviceCount: 0, templateDeviceCount: 0, truncated: false } }))
  const w = await start()
  expect(w.find('[data-modal]').exists()).toBe(true)
  expect(mocks.update).not.toHaveBeenCalled()
})
it('shows binding incompatibility and prevents the normal confirmation write', async () => {
  mocks.preview.mockResolvedValue(
    preview({ bindingIssues: [{ field: 'bindings', code: 'invalid', message: '旧参数不适用于新规则' }] })
  )
  const w = await start()
  expect(w.text()).toContain('旧参数不适用于新规则')
  expect(
    w
      .findAll('button')
      .find(b => b.text() === '确认保存')!
      .attributes('disabled')
  ).toBeDefined()
  expect(mocks.update).not.toHaveBeenCalled()
})
it('does not write on invalid preview or missing wire scope', async () => {
  mocks.preview.mockResolvedValue({ device_count: 0, token: 'old-shape' })
  const w = await start()
  expect(w.text()).toContain('未能获取完整的影响范围')
  expect(mocks.update).not.toHaveBeenCalled()
})
it('does not write when server preview reports validation issues', async () => {
  mocks.preview.mockResolvedValue(
    preview({ token: '', issues: [{ field: 'definition', code: 'invalid', message: '规则定义无效' }] })
  )
  const w = await start()
  expect(w.text()).toContain('规则定义无效')
  expect(mocks.update).not.toHaveBeenCalled()
})
it('saves an empty valid nonconfirming scope with its preview token', async () => {
  mocks.preview.mockResolvedValue(
    preview({ requiresConfirmation: false, scope: { deviceCount: 0, templateDeviceCount: 0, truncated: false } })
  )
  await start()
  expect(mocks.update).toHaveBeenCalledOnce()
})
it('an expired preview does not offer a stale force-write or immediately resubmit', async () => {
  mocks.update.mockRejectedValue({ code: 'preview_stale', httpStatus: 409, message: 'expired' })
  const w = await start()
  await w
    .findAll('button')
    .find(b => b.text() === '确认保存')!
    .trigger('click')
  await flushPromises()
  expect(mocks.warning).toHaveBeenCalledWith('预览已过期，请重新点击保存以确认最新影响范围')
  expect(mocks.update).toHaveBeenCalledOnce()
  expect(mocks.preview).toHaveBeenCalledOnce()
})
it('binding changes after preview do not enter the generic 409 force-save path', async () => {
  mocks.update.mockRejectedValue({ code: 'binding_incompatible', httpStatus: 409, message: '绑定参数已变化' })
  const w = await start()
  await w
    .findAll('button')
    .find(b => b.text() === '确认保存')!
    .trigger('click')
  await flushPromises()
  expect(w.text()).toContain('绑定参数已变化')
  expect(mocks.warning).toHaveBeenCalledWith('绑定参数不兼容，请修改后重新保存')
  expect(mocks.update).toHaveBeenCalledOnce()
})
