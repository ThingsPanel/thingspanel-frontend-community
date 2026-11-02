import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import CompactReadings from '@/views/device/manage/modules/device-readings-compact.vue'

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  telemetry: vi.fn(),
  resolve: vi.fn(),
  submit: vi.fn(),
  get: vi.fn(),
  token: 'session-a'
}))
vi.mock('@/service/api/device-native', () => ({ deviceNative: { list: mocks.list } }))
vi.mock('@/service/api/device', () => ({ telemetryDataCurrent: mocks.telemetry }))
vi.mock('@/service/api/device-command-native', () => ({
  deviceCommandNative: { submit: mocks.submit, get: mocks.get }
}))
vi.mock('@/utils/storage', () => ({ localStg: { get: () => mocks.token } }))
vi.mock('@/locales', () => ({ $t: (key: string) => key }))
vi.mock('@/views/device/native-model-consumption', async () => {
  const actual = await import('@/views/device/native-device-model-contract')
  return {
    hasNativeDeviceBinding: actual.hasNativeDeviceBinding,
    nativeCommandOptions: actual.nativeCommandOptions,
    resolveDeviceNativeModel: mocks.resolve
  }
})
vi.mock('@/views/device/details/modules/telemetry/modules/history-data.vue', () => ({
  default: { template: '<div />' }
}))
vi.mock('@/views/device/details/modules/telemetry/modules/time-series-data.vue', () => ({
  default: { template: '<div />' }
}))
const model = {
  fields: [
    {
      kind: 'COMMAND',
      identifier: 'power',
      nameI18n: { default: 'Power' },
      parameters: { items: [{ identifier: 'enabled', valueType: { kind: 'BOOL' } }] }
    }
  ]
}
const receipt = { id: 'execution-1', deviceId: 'device-1', identifier: 'power', state: 'accepted' }
async function page() {
  const wrapper = mount(CompactReadings, {
    props: { filters: {}, groupId: '', groupScope: 'all', groupName: 'All' },
    global: {
      stubs: {
        NSwitch: {
          props: ['value', 'loading', 'disabled'],
          emits: ['update:value'],
          template:
            '<button class="switch" :disabled="disabled" @click="$emit(\'update:value\', !value)">{{value}}</button>'
        },
        NDrawer: true,
        NDrawerContent: true
      }
    }
  })
  await flushPromises()
  return wrapper
}
describe('compact native control lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.token = 'session-a'
    mocks.list.mockResolvedValue({
      total: 1,
      items: [
        {
          id: 'device-1',
          resourceVersion: 1,
          modelBinding: { modelId: 'model-1', snapshotId: 'pinned-1', publishedRevision: 1 }
        }
      ]
    })
    mocks.telemetry.mockResolvedValue({ data: [{ key: 'power', value: false, ts: Date.now() - 10000 }] })
    mocks.resolve.mockResolvedValue({
      snapshot: { snapshotID: 'pinned-1', model },
      platformFields: [{ id: 'power', name: 'Power', type: 'boolean', dataType: 'telemetry' }]
    })
    mocks.submit.mockResolvedValue(receipt)
    mocks.get.mockResolvedValue({ ...receipt, state: 'acknowledged' })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })
  it('uses the pinned native schema and keeps the switch at telemetry state after acceptance and ack', async () => {
    const wrapper = await page()
    await wrapper.find('[role="switch"]').trigger('click')
    await flushPromises()
    expect(mocks.submit).toHaveBeenCalledWith(
      'device-1',
      { identifier: 'power', snapshotId: 'pinned-1', parameters: { enabled: true }, timeoutSeconds: 8 },
      expect.stringMatching(/^[a-zA-Z0-9-]{36}$/)
    )
    expect(wrapper.find('[role="switch"]').attributes('aria-checked')).toBe('false')
    await vi.advanceTimersByTimeAsync(8400)
    expect(wrapper.text()).toContain('设备已回执，遥测尚未确认目标状态')
    wrapper.unmount()
  })
  it('confirms only fresh target telemetry, preserving snapshot field decoration', async () => {
    const wrapper = await page()
    mocks.telemetry.mockResolvedValue({
      data: [{ key: 'power', value: true, ts: Date.now() + 1, label: 'untrusted label' }]
    })
    await wrapper.find('[role="switch"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('新遥测已确认目标状态')
    expect(wrapper.find('[role="switch"]').attributes('aria-checked')).toBe('true')
    expect(wrapper.text()).not.toContain('untrusted label')
    wrapper.unmount()
  })
  it('stops receipt and telemetry polling after a session change', async () => {
    const wrapper = await page()
    let resolveSubmit!: (value: unknown) => void
    mocks.submit.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveSubmit = resolve
        })
    )
    await wrapper.find('[role="switch"]').trigger('click')
    mocks.token = 'session-b'
    resolveSubmit(receipt)
    await flushPromises()
    expect(mocks.get).not.toHaveBeenCalled()
    expect(mocks.telemetry).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })
  it('uses pinned Boolean type even when telemetry has enum display labels', async () => {
    const resolved = await mocks.resolve()
    resolved.platformFields[0].options = [
      { value: true, label: 'Enabled' },
      { value: false, label: 'Disabled' }
    ]
    const wrapper = await page()
    expect(wrapper.find('[role="switch"]').exists()).toBe(true)
    await wrapper.find('[role="switch"]').trigger('click')
    await flushPromises()
    expect(mocks.submit).toHaveBeenCalled()
    wrapper.unmount()
  })
  it('rejects command initiation from a previous session model', async () => {
    const wrapper = await page()
    mocks.token = 'session-b'
    await wrapper.find('[role="switch"]').trigger('click')
    await flushPromises()
    expect(mocks.submit).not.toHaveBeenCalled()
    wrapper.unmount()
  })
  it('fails closed when pinned metadata cannot be resolved', async () => {
    mocks.resolve.mockRejectedValue(new Error('snapshot mismatch'))
    const wrapper = await page()
    expect(wrapper.find('[role="switch"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('物模型字段读取失败')
    expect(mocks.submit).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
