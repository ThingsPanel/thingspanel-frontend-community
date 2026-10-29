import { flushPromises, mount } from '@vue/test-utils'
import naive from 'naive-ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import EventReport from '@/views/device/details/modules/event-report.vue'

const deviceId = '7c1bdb51-842a-4baa-8f58-4cb27f7132fd'
const { runtime } = vi.hoisted(() => ({ runtime: { listReadings: vi.fn() } }))

vi.mock('@/views/device/details/modules/public/distribution-and-table.vue', async () => {
  const { defineComponent, h } = await import('vue')
  // Calls the page's fetch contract once on click, as the real table does on mount.
  return {
    default: defineComponent({
      props: ['id', 'tableColumns', 'fetchDataApi', 'decorateRows'],
      setup: props => () =>
        h('button', {
          class: 'load',
          onClick: () =>
            props
              .fetchDataApi({ page: 2, page_size: 10, device_id: props.id })
              .then((r: unknown) => ((window as any).__result = r))
        })
    })
  }
})
vi.mock('@/locales', () => ({ $t: (key: string) => key }))
vi.mock('@/service/api/device-runtime-native', () => ({ deviceRuntimeNative: runtime }))
vi.mock('@/views/device/native-model-consumption', () => ({
  deviceBindingRequiresNativeModel: () => false,
  resolveDeviceNativeModel: async () => null
}))

async function mountPage() {
  const wrapper = mount(EventReport, {
    props: { id: deviceId, deviceData: {} },
    global: { plugins: [naive] }
  })
  await flushPromises()
  return wrapper
}

describe('device event report page (native event readings)', () => {
  beforeEach(() => {
    runtime.listReadings.mockReset()
    ;(window as any).__result = undefined
  })

  it('asks the native readings API for event kind with the table paging', async () => {
    runtime.listReadings.mockResolvedValue({
      items: [
        {
          deviceId,
          identifier: 'overheat',
          kind: 'event',
          value: { t: 91 },
          observedAt: '2026-10-29T08:00:00.000Z',
          sampleId: 's1'
        }
      ],
      page: 2,
      pageSize: 10,
      total: 11
    })
    const wrapper = await mountPage()
    await wrapper.find('.load').trigger('click')
    await flushPromises()
    expect(runtime.listReadings).toHaveBeenCalledWith(deviceId, { kind: 'event', page: 2, pageSize: 10 })
    const result = (window as any).__result
    expect(result.error).toBeNull()
    expect(result.data.count).toBe(11)
    expect(result.data.list[0]).toMatchObject({ id: 's1', identify: 'overheat' })
    expect(wrapper.text()).not.toContain('读取失败')
  })

  it('shows the failure and returns an error to the table instead of an empty list', async () => {
    runtime.listReadings.mockRejectedValue(new Error('upstream down'))
    const wrapper = await mountPage()
    await wrapper.find('.load').trigger('click')
    await flushPromises()
    expect((window as any).__result.data).toBeNull()
    expect(wrapper.text()).toContain('upstream down')
  })
})
