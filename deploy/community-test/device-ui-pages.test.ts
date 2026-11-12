import { defineComponent, h } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
vi.mock('@/locales', () => ({ $t: (key: string) => key }))
vi.mock('@/router', () => ({ router: { go: vi.fn() } }))
vi.mock('vue-router', () => ({ useRoute: () => ({ query: {} }) }))
vi.mock('@/service/api/device', () => ({
  deviceConfigAdd: vi.fn(),
  deviceConfigEdit: vi.fn(),
  deviceConfigInfo: vi.fn(),
  deviceConfigVoucherType: vi.fn(),
  deviceProtocalServiceList: vi.fn(),
  protocolPluginConfigForm: vi.fn()
}))
vi.mock('naive-ui', () => ({
  NTooltip: { template: '<div><slot name="trigger"/><slot/></div>' },
  NIcon: { template: '<i><slot/></i>' },
  NFlex: { template: '<div><slot/></div>' },
  useMessage: () => ({ error: vi.fn() })
}))
import ConfigEdit from '@/views/device/config-edit/index.vue'
import * as api from '@/service/api/device'

const wrappers: ReturnType<typeof mount>[] = []
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.deviceProtocalServiceList).mockResolvedValue({ data: { protocol: [], service: [] } } as any)
  vi.mocked(api.deviceConfigVoucherType).mockResolvedValue({ data: {} } as any)
})
afterEach(() => wrappers.splice(0).forEach(wrapper => wrapper.unmount()))
const slot = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      h('div', slots.default?.())
})
const form = defineComponent({
  setup: (_, { slots, expose }) => {
    expose({ restoreValidation: vi.fn(), validate: vi.fn() })
    return () => h('div', slots.default?.())
  }
})
function page() {
  const wrapper = mount(ConfigEdit, {
    global: {
      stubs: {
        NCard: slot,
        NForm: form,
        NFormItem: slot,
        NButton: slot,
        NSpace: slot,
        NRadioGroup: slot,
        NInput: true,
        NSelect: true,
        FormInput: true
      }
    }
  })
  wrappers.push(wrapper)
  return { wrapper, state: (wrapper.vm as any).$.setupState }
}
it('actual composed template clears old table data, renders no stale form and refuses submit after failed schema', async () => {
  let old!: (value: any) => void
  vi.mocked(api.protocolPluginConfigForm).mockImplementation(({ protocol_type }: any) =>
    protocol_type === 'modbus'
      ? new Promise(resolve => {
          old = resolve
        })
      : Promise.resolve({ data: [] } as any)
  )
  const { wrapper, state } = page()
  await flushPromises()
  state.configForm.device_type = '3'
  state.protocol_config = { registers: [{ address: 1 }] }
  const pending = state.choseProtocolType('modbus')
  expect(state.protocol_config).toEqual({})
  await state.choseProtocolType('chirpstack')
  old({ data: [{ type: 'table', dataKey: 'registers' }] })
  await pending
  await flushPromises()
  expect(state.formElements).toEqual([])
  expect(wrapper.find('form-input-stub').exists()).toBe(false)
  vi.mocked(api.protocolPluginConfigForm).mockResolvedValue({ error: true } as any)
  await state.choseProtocolType('bad')
  await state.handleSubmit()
  expect(state.schemaFailed).toBe(true)
  expect(api.deviceConfigAdd).not.toHaveBeenCalled()
})
it('actual editing loader retains saved protocol data; type switch clears schema and saved credentials', async () => {
  vi.mocked(api.protocolPluginConfigForm).mockResolvedValue({ data: [{ type: 'table', dataKey: 'registers' }] } as any)
  const { state } = page()
  await flushPromises()
  state.configForm.device_type = '3'
  state.configForm.voucher_type = 'saved'
  state.protocol_config = { registers: [{ address: 7 }] }
  await state.protocolSelection.select('3', 'modbus', false)
  expect(state.protocol_config.registers[0].address).toBe(7)
  state.handleDeviceTypeChange('1')
  expect(state.protocol_config).toEqual({})
  expect(state.configForm.voucher_type).toBeNull()
  expect(state.formElements).toEqual([])
})
