import { defineComponent, h, reactive } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
vi.mock('@/locales', () => ({ $t: (key: string) => key }))
vi.mock('@/router', () => ({ router: { go: vi.fn() } }))
const routeState = vi.hoisted(() => ({ current: null as any }))
vi.mock('vue-router', () => ({ useRoute: () => routeState.current }))
vi.mock('@/service/api/device', () => ({
  deviceConfigAdd: vi.fn(),
  deviceConfigEdit: vi.fn(),
  deviceConfigInfo: vi.fn(),
  deviceConfigVoucherType: vi.fn(),
  deviceProtocalServiceList: vi.fn(),
  protocolPluginConfigForm: vi.fn()
}))
vi.mock('@/service/api/device-config-metadata', async () => {
  const api = await import('@/service/api/device')
  return {
    readDeviceConfigMetadata: vi.fn(async (id: string) => ({
      ...(await api.deviceConfigInfo({ id })),
      etag: '"dc1-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"'
    })),
    saveDeviceConfigMetadata: vi.fn((body: any, _etag: string) => api.deviceConfigEdit(body)),
    templateSaveError: (error: any) =>
      error?.response?.status === 412 ? '模板已被其他操作修改，请重新加载后再保存' : 'failed',
    templateVersionUnavailable: '版本信息不可用'
  }
})
vi.mock('naive-ui', () => ({
  useDialog: () => ({ warning: vi.fn() }),
  NTooltip: { template: '<div><slot name="trigger"/><slot/></div>' },
  NIcon: { template: '<i><slot/></i>' },
  NFlex: { template: '<div><slot/></div>' },
  useMessage: () => ({ error: vi.fn() })
}))
import ConfigEdit from '@/views/device/config-edit/index.vue'
import * as api from '@/service/api/device'
import * as metadata from '@/service/api/device-config-metadata'
import { router } from '@/router'

const wrappers: ReturnType<typeof mount>[] = []
beforeEach(() => {
  vi.clearAllMocks()
  routeState.current = reactive({ query: {} })
  vi.mocked(api.deviceProtocalServiceList).mockResolvedValue({ data: { protocol: [], service: [] } } as any)
  vi.mocked(api.deviceConfigVoucherType).mockResolvedValue({ data: {} } as any)
})

it.each([0, 7])('ordinary edit omits binding CAS even at revision %s', async revision => {
  routeState.current.query.id = 'A'
  vi.mocked(api.deviceConfigInfo).mockResolvedValue({
    data: {
      id: 'A',
      name: 'A',
      native_binding_revision: revision,
      native_thing_model_id: revision ? 'model' : null,
      native_thing_model_snapshot_id: revision ? 'snapshot' : null,
      native_thing_model_revision: revision || null,
      tenant_id: 'tenant',
      device_count: 12,
      protocol_config: '{}'
    }
  } as any)
  vi.mocked(api.deviceConfigEdit).mockResolvedValue({} as any)
  const { state } = page()
  await flushPromises()
  state.configForm.name = 'renamed'
  await state.handleSubmit()
  expect(api.deviceConfigEdit).toHaveBeenCalledOnce()
  const body = vi.mocked(api.deviceConfigEdit).mock.calls[0][0]
  expect(body).toMatchObject({ id: 'A', name: 'renamed', protocol_config: '{}' })
  expect(Object.keys(body).some(k => k.startsWith('native_') || k === 'tenant_id' || k === 'device_template_id')).toBe(
    false
  )
})

it('route changes clear stale data and reject delayed loads and validation', async () => {
  let loadA!: (value: any) => void
  routeState.current.query.id = 'A'
  vi.mocked(api.deviceConfigInfo).mockImplementation(({ id }: any) =>
    id === 'A'
      ? new Promise(resolve => {
          loadA = resolve
        })
      : Promise.resolve({ data: { id, name: id, protocol_config: '{}' } } as any)
  )
  vi.mocked(api.deviceConfigEdit).mockResolvedValue({} as any)
  const { state } = page()
  routeState.current.query.id = 'B'
  await flushPromises()
  loadA({ data: { id: 'A', name: 'stale', protocol_config: '{}' } })
  await flushPromises()
  expect(state.configForm.id).toBe('B')
  let validated!: () => void
  state.configFormRef.validate = () =>
    new Promise<void>(resolve => {
      validated = resolve
    })
  const save = state.handleSubmit()
  routeState.current.query.id = 'C'
  await flushPromises()
  validated()
  await save
  expect(api.deviceConfigEdit).not.toHaveBeenCalled()
  expect(state.configForm.id).toBe('C')
})

it('failed new route load cannot save the prior object; edit to create omits id', async () => {
  routeState.current.query.id = 'A'
  vi.mocked(api.deviceConfigInfo).mockResolvedValue({ data: { id: 'A', name: 'A', protocol_config: '{}' } } as any)
  const { state } = page()
  await flushPromises()
  vi.mocked(api.deviceConfigInfo).mockResolvedValue({ error: true } as any)
  routeState.current.query.id = 'B'
  await flushPromises()
  await state.handleSubmit()
  expect(api.deviceConfigEdit).not.toHaveBeenCalled()
  expect(state.configForm.id).toBeNull()
  delete routeState.current.query.id
  await flushPromises()
  vi.mocked(api.deviceConfigAdd).mockResolvedValue({} as any)
  state.configForm.name = 'new'
  await state.handleSubmit()
  expect(api.deviceConfigAdd).toHaveBeenCalledOnce()
  expect(vi.mocked(api.deviceConfigAdd).mock.calls[0][0]).not.toHaveProperty('id')
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

it('passes the loaded version and keeps the draft after a 412 without retry/navigation', async () => {
  routeState.current.query.id = 'A'
  vi.mocked(api.deviceConfigInfo).mockResolvedValue({
    data: { id: 'A', name: 'original', protocol_config: '{}' }
  } as any)
  vi.mocked(api.deviceConfigEdit).mockResolvedValue({ error: { response: { status: 412 } } } as any)
  const { state } = page()
  await flushPromises()
  state.configForm.name = 'unsaved draft'
  await state.handleSubmit()
  expect(metadata.saveDeviceConfigMetadata).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'A', name: 'unsaved draft' }),
    '"dc1-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"'
  )
  expect(api.deviceConfigEdit).toHaveBeenCalledTimes(1)
  expect(router.go).not.toHaveBeenCalled()
  expect(state.configForm.name).toBe('unsaved draft')
})
it('missing ETag fails closed rather than sending an unconditional edit', async () => {
  routeState.current.query.id = 'A'
  vi.mocked(metadata.readDeviceConfigMetadata).mockResolvedValueOnce({
    data: { id: 'A', name: 'A', protocol_config: '{}' },
    etag: null
  } as any)
  const { state } = page()
  await flushPromises()
  await state.handleSubmit()
  expect(state.configLoadFailed).toBe(true)
  expect(metadata.saveDeviceConfigMetadata).not.toHaveBeenCalled()
})
