import { flushPromises, mount } from '@vue/test-utils'
import naive from 'naive-ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import TelemetryChart from '@/views/device/details/modules/telemetry-chart.vue'

const deviceId = '7c1bdb51-842a-4baa-8f58-4cb27f7132fd'
const { runtime, model, push, widget } = vi.hoisted(() => ({
  runtime: { listReadings: vi.fn() },
  model: { resolve: vi.fn() },
  push: { start: vi.fn(), stop: vi.fn() },
  widget: { pushPlatformData: vi.fn() }
}))

vi.mock('@/service/api/device-runtime-native', () => ({ deviceRuntimeNative: runtime }))
vi.mock('@/views/device/native-model-consumption', () => ({ resolveDeviceNativeModel: model.resolve }))
vi.mock('@/hooks/thingsvis/useRealtimePush', () => ({ useRealtimePush: () => push }))
vi.mock('@/hooks/thingsvis/useAlarmPush', () => ({ useAlarmPush: () => push }))
vi.mock('@/components/thingsvis/ThingsVisWidget.vue', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    default: defineComponent({
      name: 'ThingsVisWidget',
      props: ['config', 'data', 'deviceId'],
      setup: (_props, { expose }) => {
        expose({ pushPlatformData: widget.pushPlatformData })
        return () => h('div', { class: 'vis' })
      }
    })
  }
})

const binding = { template_id: 't1' }
const reading = (identifier: string, value: unknown) => ({ identifier, value })
const readingsPage = (items: unknown[], total = items.length) => ({ items, page: 1, pageSize: 100, total })

function resolved(fields: Array<{ id: string; name: string; dataType: string }>, webChartConfig: unknown) {
  return { platformFields: fields, snapshot: { resources: { webChartConfig } } }
}

async function mountChart(deviceData: Record<string, unknown> | undefined) {
  const wrapper = mount(TelemetryChart, { props: { id: deviceId, deviceData }, global: { plugins: [naive] } })
  await flushPromises()
  return wrapper
}

describe('device chart page (native latest readings)', () => {
  beforeEach(() => {
    runtime.listReadings.mockReset()
    model.resolve.mockReset()
    push.start.mockReset()
    push.stop.mockReset()
    widget.pushPlatformData.mockReset()
  })

  it('shows the empty state and reads nothing for a device without a bound template', async () => {
    const wrapper = await mountChart({ name: 'd' })
    expect(wrapper.text()).toContain('未配置图表数据或设备未绑定模板')
    expect(model.resolve).not.toHaveBeenCalled()
    expect(runtime.listReadings).not.toHaveBeenCalled()
  })

  it('shows the empty state when the native snapshot carries no chart config', async () => {
    model.resolve.mockResolvedValue(resolved([{ id: 'temp', name: 'temp', dataType: 'telemetry' }], null))
    const wrapper = await mountChart({ device_config: binding })
    expect(wrapper.find('.vis').exists()).toBe(false)
    expect(wrapper.text()).toContain('未配置图表数据')
    expect(runtime.listReadings).not.toHaveBeenCalled()
  })

  it('renders the chart with the device id bound in and pushes native latest values by field id', async () => {
    model.resolve.mockResolvedValue(
      resolved([{ id: 'temp', name: 'temperature', dataType: 'telemetry' }], {
        dataSources: [
          { type: 'PLATFORM_FIELD', id: '__platform___template____', config: { requestedFields: ['temp', 'ghost'] } }
        ],
        nodes: []
      })
    )
    runtime.listReadings.mockResolvedValue(readingsPage([reading('temp', 21.5), reading('other', 1)]))
    const wrapper = await mountChart({ device_config: binding })

    expect(wrapper.find('.vis').exists()).toBe(true)
    // telemetry only: no attribute fields in the model, so no attribute request
    expect(runtime.listReadings).toHaveBeenCalledTimes(1)
    expect(runtime.listReadings).toHaveBeenCalledWith(deviceId, {
      kind: 'telemetry',
      latestOnly: true,
      page: 1,
      pageSize: 100
    })
    const ds = wrapper.findComponent({ name: 'ThingsVisWidget' }).props('config').dataSources[0]
    expect(ds.id).toBe(`__platform_${deviceId}__`)
    expect(ds.config).toMatchObject({ deviceId, requestedFields: ['temp'] })
    expect(wrapper.findComponent({ name: 'ThingsVisWidget' }).props('data')).toEqual({ temp: 21.5 })
    expect(push.start).toHaveBeenCalled()
  })

  it('also reads attributes when the model has attribute fields, and pages through large result sets', async () => {
    model.resolve.mockResolvedValue(
      resolved(
        [
          { id: 'temp', name: 'temp', dataType: 'telemetry' },
          { id: 'fw', name: 'fw', dataType: 'attribute' }
        ],
        { dataSources: [], nodes: [] }
      )
    )
    runtime.listReadings.mockImplementation(async (_id: string, q: { kind: string; page: number }) => {
      if (q.kind === 'attribute') return readingsPage([reading('fw', '1.2')])
      return q.page === 1
        ? readingsPage([reading('temp', 1), ...Array.from({ length: 99 }, (_, i) => reading(`x${i}`, i))], 101)
        : readingsPage([reading('last', 2)], 101)
    })
    const wrapper = await mountChart({ device_config: binding })
    const kinds = runtime.listReadings.mock.calls.map(c => `${c[1].kind}:${c[1].page}`).sort()
    expect(kinds).toEqual(['attribute:1', 'telemetry:1', 'telemetry:2'])
    expect(wrapper.findComponent({ name: 'ThingsVisWidget' }).props('data')).toEqual({ temp: 1, fw: '1.2' })
  })

  it('keeps the chart usable and pushes nothing when the readings request fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    model.resolve.mockResolvedValue(
      resolved([{ id: 'temp', name: 'temp', dataType: 'telemetry' }], { dataSources: [], nodes: [] })
    )
    runtime.listReadings.mockRejectedValue(new Error('down'))
    const wrapper = await mountChart({ device_config: binding })
    expect(wrapper.find('.vis').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'ThingsVisWidget' }).props('data')).toEqual({})
    spy.mockRestore()
  })
})
