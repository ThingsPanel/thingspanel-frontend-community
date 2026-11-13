import { defineComponent, h, reactive } from 'vue'
import type { App } from 'vue'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DeviceDetail from '@/views/device/details/index.vue'

const { detail, resolveModel, routeState, runtimeState, websocket } = vi.hoisted(() => ({
  websocket: { onMessage: null as any },
  detail: vi.fn(),
  runtimeState: vi.fn(),
  resolveModel: vi.fn(),
  routeState: { current: null as any }
}))

vi.mock('vue-router', () => ({ useRoute: () => routeState.current }))
vi.mock('@/service/api/device', () => ({ deviceDetail: detail, deviceUpdate: vi.fn() }))
vi.mock('@/service/api/device-native', () => ({ deviceNative: { get: detail } }))
vi.mock('@/service/api/device-runtime-native', () => ({ deviceRuntimeNative: { readRuntimeState: runtimeState } }))
vi.mock('@/service/api/template-native', () => ({ templateNative: { get: vi.fn() } }))
vi.mock('@/views/device/native-model-consumption', () => ({ resolveDeviceNativeModel: resolveModel }))
vi.mock('@/locales', () => ({ $t: (key: string) => key }))
vi.mock('@/utils/storage', () => ({ localStg: { get: vi.fn() } }))
vi.mock('@/hooks/common/router', () => ({ useRouterPush: () => ({ routerPushByKey: vi.fn() }) }))
vi.mock('@/utils/common/tool', () => ({ getWebsocketServerUrl: () => 'ws://localhost' }))
vi.mock('@/utils/common/discrete', () => ({ message: { error: vi.fn() } }))
vi.mock('@vueuse/core', () => ({
  useWebSocket: (_url: string, options: any) => {
    websocket.onMessage = options.onMessage
    return { send: vi.fn() }
  }
}))
vi.mock('@/views/device/details/modules/device-status.vue', () => ({ default: { render: () => null } }))
vi.mock('@/views/device/details/modules/native-device-credentials.vue', () => ({ default: { render: () => null } }))
vi.mock('@/views/device/details/modules/native-device-info.vue', () => ({ default: { render: () => null } }))

const Tabs = defineComponent({
  props: ['value'],
  emits: ['update:value'],
  setup(props, { slots }) {
    return () => h('div', { 'data-active': props.value }, slots.default?.())
  }
})

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => {
    resolve = done
  })
  return { promise, resolve }
}

const withChart = { snapshot: { resources: { webChartConfig: { nodes: [{ id: 'chart-1' }] } } } }
let wrapper: ReturnType<typeof shallowMount>

function mountPage() {
  wrapper = shallowMount(DeviceDetail, {
    global: {
      mocks: { $t: (key: string) => key },
      plugins: [
        (app: App) => {
          app.config.globalProperties.getPlatform = () => false
        }
      ],
      stubs: {
        NTabs: Tabs,
        NTabPane: { props: ['name'], template: '<div :data-tab="name" />' },
        NButton: true,
        NTag: true,
        NModal: true,
        NCard: true,
        NForm: true,
        NH3: true,
        NFormItem: true,
        NInput: true,
        NDynamicTags: true,
        NSpace: true,
        NFlex: true,
        SvgIcon: true,
        NAlert: true,
        NTooltip: true,
        NSpin: true
      }
    }
  })
  return wrapper
}

const activeTab = () => wrapper.find('[data-active]').attributes('data-active')
const tabNames = () => wrapper.findAll('[data-tab]').map(tab => tab.attributes('data-tab'))

describe('device detail initial tab', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    routeState.current = reactive({ query: { d_id: 'device-a' } })
    detail.mockReset().mockImplementation(async (id: string) => ({
      device: { id, name: id, deviceKind: 'standalone', resourceVersion: 1, tags: [] },
      etag: '"1"'
    }))
    runtimeState.mockReset().mockResolvedValue({ connectivity: 'online' })
    resolveModel.mockReset()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('loads initial online status from native runtime state', async () => {
    resolveModel.mockResolvedValue(null)
    mountPage()
    await flushPromises()
    expect(runtimeState).toHaveBeenCalledWith('device-a')
    expect((wrapper.vm as any).device_is_online).toBe(1)
  })

  it('uses legacy online frames only to refresh native unknown state', async () => {
    resolveModel.mockResolvedValue(null)
    mountPage()
    await flushPromises()
    runtimeState.mockResolvedValue({ connectivity: 'unknown' })
    websocket.onMessage(null, { data: JSON.stringify({ device_id: 'device-a', is_online: 1 }) })
    await flushPromises()
    expect(runtimeState).toHaveBeenCalledTimes(2)
    expect((wrapper.vm as any).device_is_online).toBeNull()
    websocket.onMessage(null, { data: JSON.stringify({ device_id: 'another-device', is_online: 1 }) })
    await flushPromises()
    expect(runtimeState).toHaveBeenCalledTimes(2)
  })

  it('ignores stale runtime responses after a newer status frame', async () => {
    resolveModel.mockResolvedValue(null)
    const oldState = deferred<{ connectivity: string }>()
    runtimeState.mockReturnValueOnce(oldState.promise).mockResolvedValue({ connectivity: 'unknown' })
    mountPage()
    await flushPromises()
    websocket.onMessage(null, { data: JSON.stringify({ device_id: 'device-a', is_online: 1 }) })
    await flushPromises()
    oldState.resolve({ connectivity: 'online' })
    await flushPromises()
    expect((wrapper.vm as any).device_is_online).toBeNull()
  })

  it('clears previously online state when the triggered native refresh fails', async () => {
    resolveModel.mockResolvedValue(null)
    mountPage()
    await flushPromises()
    runtimeState.mockRejectedValue(new Error('runtime unavailable'))
    websocket.onMessage(null, { data: JSON.stringify({ device_id: 'device-a', is_online: 1 }) })
    await flushPromises()
    expect((wrapper.vm as any).device_is_online).toBeNull()
    expect((wrapper.vm as any).runtimeStateError).toBe('runtime unavailable')
  })

  it('keeps runtime failures visible without inventing an offline state', async () => {
    resolveModel.mockResolvedValue(null)
    runtimeState.mockRejectedValue(new Error('runtime unavailable'))
    mountPage()
    await flushPromises()
    expect((wrapper.vm as any).device_is_online).toBeNull()
    expect((wrapper.vm as any).runtimeStateError).toBe('runtime unavailable')
  })

  it('waits for chart availability before exposing any tabs, then opens chart directly', async () => {
    const model = deferred<typeof withChart>()
    resolveModel.mockReturnValue(model.promise)
    mountPage()
    await flushPromises()
    expect(tabNames()).toEqual([])
    expect(activeTab()).toBe('')

    model.resolve(withChart)
    await flushPromises()
    expect(tabNames().slice(0, 2)).toEqual(['chart', 'telemetry'])
    expect(activeTab()).toBe('chart')
  })

  it.each([null, { snapshot: { resources: { webChartConfig: { nodes: [] } } } }])(
    'opens telemetry when the model has no chart: %j',
    async model => {
      resolveModel.mockResolvedValue(model)
      mountPage()
      await flushPromises()
      expect(activeTab()).toBe('telemetry')
      expect(tabNames()).not.toContain('chart')
    }
  )

  it('falls back to telemetry when resolving the model fails', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    resolveModel.mockRejectedValue(new Error('model unavailable'))
    mountPage()
    await flushPromises()
    expect(activeTab()).toBe('telemetry')
    expect(tabNames()).not.toContain('chart')
  })

  it('keeps a manually selected tab when device details refresh', async () => {
    resolveModel.mockResolvedValue(withChart)
    mountPage()
    await flushPromises()
    wrapper.findComponent(Tabs).vm.$emit('update:value', 'telemetry')
    await flushPromises()
    // Closing the edit dialog refreshes device details through the real page handler.
    await (wrapper.vm as any).$.setupState.closeModal()
    await flushPromises()
    expect(activeTab()).toBe('telemetry')
    expect(tabNames()[0]).toBe('chart')
  })

  it('ignores an old chart response after navigation to another device', async () => {
    const oldModel = deferred<typeof withChart>()
    resolveModel.mockReturnValueOnce(oldModel.promise).mockResolvedValueOnce(null)
    mountPage()
    await flushPromises()
    routeState.current.query.d_id = 'device-b'
    await flushPromises()
    expect(activeTab()).toBe('telemetry')
    oldModel.resolve(withChart)
    await flushPromises()
    expect(activeTab()).toBe('telemetry')
    expect(tabNames()).not.toContain('chart')
  })

  it('reselects the default for a new device instead of retaining the previous telemetry tab', async () => {
    resolveModel.mockResolvedValueOnce(null).mockResolvedValueOnce(withChart)
    mountPage()
    await flushPromises()
    expect(activeTab()).toBe('telemetry')
    routeState.current.query.d_id = 'device-b'
    await flushPromises()
    expect(activeTab()).toBe('chart')
  })
})
