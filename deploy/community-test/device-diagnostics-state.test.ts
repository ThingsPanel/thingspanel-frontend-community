import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ diagnostics: vi.fn() }))
vi.mock('@/locales', () => ({ $t: (key: string) => key }))
vi.mock('@/service/api', () => ({
  deviceDiagnostics: api.diagnostics,
  getDeviceDebugStatus: vi.fn(async () => ({ data: { enabled: false } })),
  setDeviceDebugStatus: vi.fn(async () => ({})),
  getDeviceDebugLogs: vi.fn(async () => ({ data: { list: [] } }))
}))
vi.mock('@/utils/device-detail-demo-data', () => ({
  isDeviceDetailDemo: () => false,
  demoDiagnostics: vi.fn(),
  demoDebugLogs: () => []
}))
vi.mock('naive-ui', async () => {
  const { defineComponent, h } = await import('vue')
  return {
    NDataTable: defineComponent({
      props: ['data'],
      setup: p => () => h('pre', { 'data-failures': true }, JSON.stringify(p.data))
    }),
    NEmpty: { template: '<div/>' },
    NTag: { template: '<span><slot/></span>' }
  }
})
// This config runs in the actual staged composition: the reviewed legacy page,
// not the unrelated native source component at the same path in the checkout.
import Diagnosis from '@/views/device/details/modules/device-diagnosis.vue'

const wrappers: ReturnType<typeof mount>[] = []
const slot = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      h('div', slots.default?.())
})
const card = defineComponent({
  props: ['title'],
  setup:
    (p, { slots }) =>
    () =>
      h('section', { 'data-card': p.title }, slots.default?.())
})
const button = defineComponent({
  emits: ['click'],
  setup:
    (_, { slots, emit }) =>
    () =>
      h('button', { onClick: () => emit('click') }, slots.default?.())
})
const animation = defineComponent({ props: ['to'], setup: p => () => h('span', String(p.to)) })

function start(id = 'qa-device-a') {
  const wrapper = mount(Diagnosis, {
    props: { id },
    global: {
      stubs: {
        NCard: card,
        NFlex: slot,
        NText: slot,
        NAlert: slot,
        NButton: button,
        NIcon: slot,
        NTooltip: slot,
        NSwitch: true,
        NNumberAnimation: animation
      }
    }
  })
  wrappers.push(wrapper)
  return wrapper
}
function stats(success = 4, failed = 0, pending = 0) {
  const row = { success, failed, pending, total: success + failed + pending, success_rate: 100 }
  return {
    data: {
      stats: { uplink: { ...row }, downlink: { success: 2, total: 2 }, storage: { ...row } },
      recent_failures: [
        { timestamp: '2026-11-13T00:00:00Z', direction: 'uplink', stage: 'qa-stage', error: 'qa-old-failure' }
      ]
    }
  }
}
function metric(wrapper: ReturnType<typeof mount>, name: string) {
  return wrapper.get(`[data-card="custom.device_details.${name}SuccessRate"]`).text()
}
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
async function refresh(wrapper: ReturnType<typeof mount>) {
  await wrapper.get('button').trigger('click')
  await flushPromises()
}
beforeEach(() => {
  vi.clearAllMocks()
  api.diagnostics.mockResolvedValue(stats())
})
afterEach(() => {
  wrappers.splice(0).forEach(w => w.unmount())
})

it.each(['rejected', 'flat-null-error', 'missing-stats'])(
  'clears successful counters and old failures after %s',
  async mode => {
    const wrapper = start()
    await flushPromises()
    expect(metric(wrapper, 'uplink')).toContain('100')
    expect(wrapper.get('[data-failures]').text()).toContain('qa-old-failure')
    if (mode === 'rejected') api.diagnostics.mockRejectedValueOnce(new Error('network unavailable'))
    else
      api.diagnostics.mockResolvedValueOnce(
        mode === 'flat-null-error' ? { data: null, error: { code: 500 } } : { data: {} }
      )
    await refresh(wrapper)
    for (const kind of ['uplink', 'downlink', 'storage']) {
      expect(metric(wrapper, kind)).toContain('--')
      expect(metric(wrapper, kind)).not.toContain('100')
    }
    expect(wrapper.get('[data-failures]').text()).toBe('[]')
    expect(wrapper.text()).toContain('common.loadFailure')
  }
)

it('renders an empty observation as unknown rate, not 0% or 100%', async () => {
  const payload = stats(0, 0, 0)
  payload.data.stats.downlink = { success: 0, total: 0 }
  api.diagnostics.mockResolvedValueOnce(payload)
  const wrapper = start()
  await flushPromises()
  for (const kind of ['uplink', 'downlink', 'storage']) {
    expect(metric(wrapper, kind)).toContain('--')
    expect(metric(wrapper, kind)).toContain('0/0')
    expect(metric(wrapper, kind)).not.toContain('%')
  }
})

it('keeps pending separate and computes rate from consistent counters instead of stale success_rate', async () => {
  const payload: any = stats(2, 1, 1)
  payload.data.observation = {
    schema_version: 2,
    count_unit: 'logical_device_message',
    counter_window: 'since_last_idle_expiry',
    applies_to: ['uplink', 'storage']
  }
  api.diagnostics.mockResolvedValueOnce(payload)
  const wrapper = start()
  await flushPromises()
  for (const kind of ['uplink', 'storage']) {
    expect(metric(wrapper, kind)).toContain('50.0%')
    expect(metric(wrapper, kind)).toContain('2/4')
    expect(metric(wrapper, kind)).toContain('custom.device_details.diagnosticsPending 1')
  }
  expect(metric(wrapper, 'downlink')).not.toContain('diagnosticsPending')
  expect(wrapper.text()).toContain('custom.device_details.logicalMessageCounts')
})

it('replaces previous success with the latest terminal rejection counters', async () => {
  const wrapper = start()
  await flushPromises()
  api.diagnostics.mockResolvedValueOnce(stats(0, 3, 0))
  await refresh(wrapper)
  expect(metric(wrapper, 'uplink')).toContain('0.0%')
  expect(metric(wrapper, 'uplink')).toContain('0/3')
  expect(metric(wrapper, 'uplink')).not.toContain('100')
})

it('device B starts empty and late device A success cannot overwrite B', async () => {
  const a = deferred<any>(),
    b = deferred<any>()
  api.diagnostics.mockImplementation((id: string) => (id === 'qa-device-a' ? a.promise : b.promise))
  const wrapper = start()
  await wrapper.setProps({ id: 'qa-device-b' })
  await flushPromises()
  expect(api.diagnostics).toHaveBeenCalledWith('qa-device-b')
  expect(metric(wrapper, 'uplink')).toContain('--')
  b.resolve(stats(1, 3, 0))
  await flushPromises()
  expect(metric(wrapper, 'uplink')).toContain('25.0%')
  a.resolve(stats())
  await flushPromises()
  expect(metric(wrapper, 'uplink')).toContain('25.0%')
  expect(metric(wrapper, 'uplink')).not.toContain('100')
})

it('late failure from an older same-device refresh cannot clear newer success', async () => {
  const old = deferred<any>()
  api.diagnostics.mockReturnValueOnce(old.promise).mockResolvedValueOnce(stats(3, 1, 0))
  const wrapper = start()
  await refresh(wrapper)
  expect(metric(wrapper, 'uplink')).toContain('75.0%')
  old.reject(new Error('late failure'))
  await flushPromises()
  expect(metric(wrapper, 'uplink')).toContain('75.0%')
  expect(wrapper.text()).not.toContain('common.loadFailure')
})
