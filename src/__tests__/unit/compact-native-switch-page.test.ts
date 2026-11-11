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
vi.mock('@/service/api/device-runtime-native', () => ({ deviceRuntimeNative: { listReadings: mocks.telemetry } }))
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
    mocks.telemetry.mockResolvedValue({
      items: [
        {
          deviceId: 'device-1',
          kind: 'telemetry',
          identifier: 'power',
          value: false,
          observedAt: new Date(Date.now() - 10000).toISOString()
        }
      ],
      total: 1,
      page: 1,
      pageSize: 100
    })
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
    expect(mocks.telemetry).toHaveBeenCalledWith('device-1', {
      kind: 'telemetry',
      latestOnly: true,
      page: 1,
      pageSize: 100
    })
    expect(mocks.telemetry).toHaveBeenCalledTimes(2)
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
      items: [
        {
          deviceId: 'device-1',
          kind: 'telemetry',
          identifier: 'power',
          value: true,
          observedAt: new Date(Date.now() + 1).toISOString(),
          label: 'untrusted label'
        }
      ],
      total: 1,
      page: 1,
      pageSize: 100
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
  it('fails closed when the runtime owner cannot resolve an identity', async () => {
    mocks.telemetry.mockRejectedValue(new Error('runtime identity unavailable'))
    const wrapper = await page()
    expect(wrapper.text()).toContain('runtime identity unavailable')
    expect(wrapper.find('[role="switch"]').exists()).toBe(false)
    expect(mocks.resolve).not.toHaveBeenCalled()
    expect(mocks.submit).not.toHaveBeenCalled()
    wrapper.unmount()
  })
  it('rejects native telemetry attributed to another device', async () => {
    mocks.telemetry.mockResolvedValue({
      items: [
        {
          deviceId: 'another-device',
          kind: 'telemetry',
          identifier: 'power',
          value: false,
          observedAt: new Date().toISOString()
        }
      ],
      page: 1,
      pageSize: 100,
      total: 1
    })
    const wrapper = await page()
    expect(wrapper.text()).toContain('遥测结果与设备不匹配')
    expect(wrapper.find('[role="switch"]').exists()).toBe(false)
    wrapper.unmount()
  })
  it('reads every latest-value page through the native owner', async () => {
    mocks.telemetry.mockImplementation(async (_id, query) => ({
      items: [
        {
          deviceId: 'device-1',
          kind: 'telemetry',
          identifier: query.page === 1 ? 'power' : 'temperature',
          value: false,
          observedAt: new Date().toISOString()
        }
      ],
      page: query.page,
      pageSize: 100,
      total: 2
    }))
    const wrapper = await page()
    expect(mocks.telemetry).toHaveBeenNthCalledWith(2, 'device-1', {
      kind: 'telemetry',
      latestOnly: true,
      page: 2,
      pageSize: 100
    })
    expect(wrapper.text()).toContain('temperature')
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
