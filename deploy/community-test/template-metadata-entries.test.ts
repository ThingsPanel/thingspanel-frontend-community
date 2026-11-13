import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, afterEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ save: vi.fn(), error: vi.fn(), success: vi.fn() }))
vi.mock('@/service/api/device-config-metadata', () => ({
  saveDeviceConfigMetadata: mocks.save,
  templateSaveError: () => '模板已被其他操作修改，请重新加载后再保存'
}))
vi.mock('@/service/api/device', () => ({
  deviceConfigDel: vi.fn(),
  deviceConfigVoucherType: vi.fn(async () => ({ data: {} })),
  deviceProtocalServiceList: vi.fn(async () => ({ data: {} })),
  protocolPluginConfigForm: vi.fn(async () => ({ data: [] })),
  getTopicMappingList: vi.fn(async () => ({ data: { list: [] } })),
  createTopicMapping: vi.fn(),
  updateTopicMapping: vi.fn(),
  deleteTopicMapping: vi.fn()
}))
vi.mock('@/locales', () => ({ $t: (s: string) => s }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (s: string) => s }) }))
vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/qa' }) }))
vi.mock('@/store/modules/tab', () => ({ useTabStore: () => ({ removeTab: vi.fn() }) }))
vi.mock('@/hooks/common/router', () => ({ useRouterPush: () => ({ routerPushByKey: vi.fn() }) }))
vi.mock('@/utils/storage', () => ({ localStg: { get: () => '' } }))
vi.mock('@/utils/common/tool', () => ({ getDemoServerUrl: () => 'http://localhost/api/v1' }))
vi.mock('@/views/device/config-detail/modules/components/topic-mapping-modal.vue', () => ({
  default: { template: '<div/>' }
}))
vi.mock('@/views/device/config-detail/modules/form.vue', () => ({ default: { template: '<div/>' } }))
vi.mock('naive-ui', async () => {
  const { defineComponent, h } = await import('vue')
  const slot = defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('div', slots.default?.())
  })
  const button = defineComponent({
    emits: ['click'],
    setup:
      (_, { emit, slots }) =>
      () =>
        h('button', { onClick: () => emit('click') }, slots.default?.())
  })
  return {
    NButton: button,
    NEmpty: slot,
    NPopconfirm: slot,
    NSpace: slot,
    NDataTable: slot,
    NSwitch: slot,
    useMessage: () => ({ error: mocks.error, success: mocks.success }),
    useDialog: () => ({ warning: vi.fn() })
  }
})
import Connection from '@/views/device/config-detail/modules/connection-info.vue'
import Extend from '@/views/device/config-detail/modules/extend-info.vue'
import Settings from '@/views/device/config-detail/modules/setting-info.vue'
const tag = `"dc1-${'a'.repeat(64)}"`
const wrappers: ReturnType<typeof mount>[] = []
const slot = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      h('div', slots.default?.())
})
function page(component: any) {
  const original = {
    id: 'A',
    name: 'original',
    protocol_type: 'MQTT',
    protocol_config: '{}',
    additional_info: '[]',
    other_config: '{"heartbeat":17,"extension":"keep"}',
    native_binding_revision: 7,
    native_thing_model_id: 'model',
    auto_register: 0
  }
  const wrapper = mount(component, {
    props: { configInfo: original, configEtag: tag },
    global: {
      config: { globalProperties: { getPlatform: () => 'web' } as any },
      stubs: {
        NModal: slot,
        NCard: slot,
        NForm: slot,
        NFormItem: slot,
        NUpload: slot,
        NInput: slot,
        NInputNumber: slot,
        NSelect: slot,
        NSwitch: slot
      }
    }
  })
  wrappers.push(wrapper)
  return { wrapper, original, state: (wrapper.vm as any).$?.setupState }
}
beforeEach(() => {
  vi.clearAllMocks()
  mocks.save.mockResolvedValue({ data: {} })
})
afterEach(() => wrappers.splice(0).forEach(w => w.unmount()))
it('connection form saves only protocol fields and the loaded version, without mutating props', async () => {
  const { state, original } = page(Connection)
  await flushPromises()
  state.extendForm.protocol_type = 'HTTP'
  state.extendForm.voucher_type = 'TOKEN'
  state.protocol_config = { endpoint: '/qa' }
  await state.handleSubmit()
  expect(mocks.save).toHaveBeenCalledWith(
    { id: 'A', protocol_type: 'HTTP', voucher_type: 'TOKEN', protocol_config: '{"endpoint":"/qa"}' },
    tag
  )
  expect(original.protocol_type).toBe('MQTT')
  expect(original.protocol_config).toBe('{}')
})
it('extension edits send only their field and keep the draft on conflict', async () => {
  mocks.save.mockResolvedValue({ error: { response: { status: 412 } } })
  const { state, original, wrapper } = page(Extend)
  await flushPromises()
  state.visible = true
  state.extendInfoList = [{ name: 'draft' }]
  await state.handleSave()
  expect(mocks.save).toHaveBeenCalledWith({ id: 'A', additional_info: '[{"name":"draft"}]' }, tag)
  expect(state.visible).toBe(true)
  expect(original.additional_info).toBe('[]')
  expect(wrapper.emitted('upDateConfig')).toBeUndefined()
  expect(mocks.success).not.toHaveBeenCalled()
})
it('online settings preserve extra keys, auto registration and image paths use independent DTOs', async () => {
  const { state, wrapper } = page(Settings)
  await flushPromises()
  state.modalIndex = 2
  state.onlinejson.heartbeat = 20
  state.onlinejson.online_timeout = 0
  await state.onSubmit()
  expect(mocks.save).toHaveBeenLastCalledWith(
    { id: 'A', other_config: '{"heartbeat":20,"extension":"keep","online_timeout":0}' },
    tag
  )
  state.modalIndex = 1
  state.auto_register = true
  await state.onSubmit()
  expect(mocks.save).toHaveBeenLastCalledWith({ id: 'A', auto_register: 1 }, tag)
  await state.saveImagePath('qa/image.png')
  expect(mocks.save).toHaveBeenLastCalledWith({ id: 'A', image_url: 'qa/image.png' }, tag)
  expect(wrapper.emitted('change')).toHaveLength(3)
})
it('settings conflict neither closes the dialog nor announces success', async () => {
  mocks.save.mockResolvedValue({ error: { response: { status: 412 } } })
  const { state, wrapper } = page(Settings)
  await flushPromises()
  state.showModal = true
  await state.onSubmit()
  expect(state.showModal).toBe(true)
  expect(mocks.success).not.toHaveBeenCalled()
  expect(mocks.error).toHaveBeenCalledOnce()
  expect(wrapper.emitted('change')).toBeUndefined()
})
