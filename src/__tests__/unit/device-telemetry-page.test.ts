import { flushPromises, mount } from '@vue/test-utils'
import naive from 'naive-ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Telemetry from '@/views/device/details/modules/telemetry/telemetry.vue'

const deviceId = '7c1bdb51-842a-4baa-8f58-4cb27f7132fd'
const { runtime, socket } = vi.hoisted(() => ({
  runtime: { listReadings: vi.fn() },
  socket: {
    send: vi.fn(),
    close: vi.fn(),
    open: vi.fn(),
    connected: undefined as undefined | ((socket: WebSocket) => void)
  }
}))

vi.mock('@/service/api/device-runtime-native', () => ({ deviceRuntimeNative: runtime }))
vi.mock('@vueuse/core', () => ({
  useWebSocket: (_url: string, options: { onConnected: (socket: WebSocket) => void }) => {
    socket.connected = options.onConnected
    return { open: socket.open, close: socket.close }
  }
}))
vi.mock('moving-numbers-vue3', async () => {
  const { defineComponent, h } = await import('vue')
  return { MovingNumbers: defineComponent({ props: ['mNum'], setup: props => () => h('span', String(props.mNum)) }) }
})
vi.mock('@/utils/storage', () => ({ localStg: { get: () => 'session-token' } }))
vi.mock('@/utils/common/tool', () => ({ getWebsocketServerUrl: () => 'ws://example.invalid', isJSON: () => false }))
vi.mock('@/views/device/native-model-consumption', () => ({
  deviceBindingRequiresNativeModel: () => false,
  resolveDeviceNativeModel: async () => null
}))

function readings(items: Array<Record<string, unknown>>) {
  return { items, page: 1, pageSize: 100, total: items.length }
}

const reading = (identifier: string, value: unknown) => ({
  deviceId,
  identifier,
  kind: 'telemetry',
  value,
  observedAt: '2026-10-29T08:00:00.000Z',
  snapshotId: null,
  sampleId: `legacy-current:${identifier}`,
  cacheVersion: null,
  aggregation: 'last'
})

async function mountPage() {
  const wrapper = mount(Telemetry, {
    props: { id: deviceId, deviceData: {} },
    global: { plugins: [naive] },
    attachTo: document.body
  })
  await flushPromises()
  return wrapper
}

describe('device telemetry page (native latest readings)', () => {
  beforeEach(() => {
    runtime.listReadings.mockReset()
    socket.send.mockReset()
    socket.open.mockReset()
  })

  it('reads the latest telemetry values natively and renders each one', async () => {
    runtime.listReadings.mockResolvedValue(readings([reading('temperature', 21.5), reading('mode', 'auto')]))
    const wrapper = await mountPage()
    expect(runtime.listReadings).toHaveBeenCalledWith(deviceId, {
      kind: 'telemetry',
      latestOnly: true,
      page: 1,
      pageSize: 100
    })
    const text = wrapper.text()
    expect(text).toContain('temperature')
    expect(text).toContain('21.5')
    expect(text).toContain('mode')
    expect(text).toContain('auto')
    expect(socket.send).not.toHaveBeenCalled()
  })

  it('opens after the initial read and subscribes on every connection', async () => {
    runtime.listReadings.mockResolvedValue(readings([]))
    const wrapper = await mountPage()
    expect(socket.open).toHaveBeenCalledTimes(1)
    const ws = { send: socket.send } as unknown as WebSocket
    socket.connected?.(ws)
    socket.connected?.(ws)
    expect(socket.send).toHaveBeenCalledTimes(2)
    expect(JSON.parse(socket.send.mock.calls[0][0])).toEqual({ device_id: deviceId, token: 'session-token' })
    wrapper.unmount()
  })

  it('does not open a socket after the page is closed during the initial read', async () => {
    let resolveRead!: (value: ReturnType<typeof readings>) => void
    runtime.listReadings.mockReturnValue(
      new Promise(resolve => {
        resolveRead = resolve
      })
    )
    const wrapper = await mountPage()
    expect(socket.open).not.toHaveBeenCalled()
    wrapper.unmount()
    resolveRead(readings([]))
    await flushPromises()
    expect(socket.open).not.toHaveBeenCalled()
  })

  it('says plainly which telemetry features are not connected and offers no dead delete control', async () => {
    runtime.listReadings.mockResolvedValue(readings([reading('temperature', 21.5)]))
    const wrapper = await mountPage()
    const text = wrapper.text()
    expect(text).toContain('删除最新值、历史曲线暂不可用')
    // The simulator panel is real; unavailable features (delete latest value, history curve) get no control.
    const labels = wrapper.findAll('button').map(b => b.text())
    expect(labels.some(l => l.includes('删除'))).toBe(false)
    expect(wrapper.html()).not.toContain('/api/v1')
  })

  it('warns when more than one page of values exists', async () => {
    runtime.listReadings.mockResolvedValue({ ...readings([reading('a', 1)]), total: 250 })
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('仅显示前 100 个遥测值')
  })

  it('shows the error and no values when the native read fails', async () => {
    runtime.listReadings.mockRejectedValue(new Error('运行时暂不可用'))
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('运行时暂不可用')
    expect(wrapper.text()).not.toContain('temperature')
  })
})
