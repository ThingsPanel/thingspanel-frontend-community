import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExpectMessage from '@/views/device/details/modules/expect-message.vue'

const deviceId = '7c1bdb51-842a-4baa-8f58-4cb27f7132fd'
const { api } = vi.hoisted(() => ({ api: { list: vi.fn(), cancel: vi.fn() } }))

vi.mock('@/service/api/device-command-native', () => ({ deviceCommandNative: api }))
vi.mock('@/locales', () => ({ $t: (key: string) => key }))
// A popconfirm that confirms on trigger click, so the cancel flow can be driven without a popover.
vi.mock('naive-ui', async importOriginal => {
  const original = await importOriginal<typeof import('naive-ui')>()
  const Popconfirm = defineComponent({
    props: { onPositiveClick: { type: Function, default: undefined } },
    setup(props, { slots }) {
      return () =>
        h('span', { onClick: () => (props.onPositiveClick as (() => void) | undefined)?.() }, slots.trigger?.())
    }
  })
  return { ...original, NPopconfirm: Popconfirm }
})

function receipt(overrides: Record<string, unknown> = {}) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    deviceId,
    state: 'accepted',
    acceptedAt: '2026-10-29T08:00:00Z',
    deliveryAt: null,
    acknowledgedAt: null,
    reason: null,
    expiresAt: '2026-10-30T08:00:00Z',
    identifier: 'reboot',
    snapshotId: '22222222-2222-2222-2222-222222222222',
    deliveryMode: 'when_online',
    label: 'nightly',
    parameters: { delay: 5 },
    redactedParameterPaths: [],
    ...overrides
  }
}

function page(items: unknown[]) {
  return { items, page: 1, pageSize: 10, total: items.length }
}

async function mountPage() {
  const wrapper = mount(ExpectMessage, { props: { id: deviceId }, attachTo: document.body })
  await flushPromises()
  return wrapper
}

describe('expect message page (native when_online command queue)', () => {
  beforeEach(() => {
    api.list.mockReset()
    api.cancel.mockReset()
  })

  it('asks only for queued when_online commands and renders the receipt', async () => {
    api.list.mockResolvedValue(page([receipt()]))
    const wrapper = await mountPage()
    expect(api.list).toHaveBeenCalledWith(deviceId, {
      page: 1,
      pageSize: 10,
      deliveryMode: 'when_online',
      state: 'accepted'
    })
    const text = wrapper.text()
    expect(text).toContain('reboot')
    expect(text).toContain('nightly')
    expect(text).toContain('{"delay":5}')
    expect(text).toContain('运行时已接收')
    expect(wrapper.html()).not.toContain('/api/v1')
  })

  it('cancels a queued command once with an Idempotency-Key and then reloads', async () => {
    api.list.mockResolvedValueOnce(page([receipt()])).mockResolvedValue(page([]))
    api.cancel.mockResolvedValue(receipt({ state: 'cancelled' }))
    const wrapper = await mountPage()
    const cancel = wrapper.findAll('button').find(button => button.text() === '取消')
    expect(cancel, 'queued command must offer a cancel button').toBeTruthy()
    await cancel!.element.parentElement!.click()
    await flushPromises()
    expect(api.cancel).toHaveBeenCalledTimes(1)
    const [id, executionId, reason, key] = api.cancel.mock.calls[0]
    expect([id, executionId]).toEqual([deviceId, receipt().id])
    expect(reason).toBeTruthy()
    expect(key).toMatch(/^[A-Za-z0-9._:-]{8,128}$/)
    expect(api.list.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('does not offer cancel for a command that was already delivered', async () => {
    api.list.mockResolvedValue(page([receipt({ state: 'delivered' })]))
    const wrapper = await mountPage()
    expect(wrapper.findAll('button').some(button => button.text() === '取消')).toBe(false)
  })

  it('reuses the same key when a cancel outcome is unknown, and a new key after a definite answer', async () => {
    api.list.mockResolvedValue(page([receipt()]))
    api.cancel
      .mockRejectedValueOnce(new TypeError('network down'))
      .mockRejectedValueOnce(Object.assign(new Error('conflict'), { status: 409 }))
      .mockResolvedValue(receipt({ state: 'cancelled' }))
    const wrapper = await mountPage()
    const click = async () => {
      const cancel = wrapper.findAll('button').find(button => button.text() === '取消')!
      await cancel.element.parentElement!.click()
      await flushPromises()
    }
    await click()
    await click()
    await click()
    const keys = api.cancel.mock.calls.map(call => call[3])
    expect(keys[1]).toBe(keys[0])
    expect(keys[2]).not.toBe(keys[1])
  })

  it('shows the error and keeps the table empty when the native list fails', async () => {
    api.list.mockRejectedValue(new Error('服务暂不可用'))
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('服务暂不可用')
    expect(wrapper.text()).not.toContain('reboot')
  })
})
