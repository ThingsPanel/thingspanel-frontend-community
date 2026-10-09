import { defineComponent, h, nextTick } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type * as NotificationV2 from '@/service/api/notification-v2.types'
import NotificationDeliveries from '@/views/alarm/notification-record/NotificationDeliveries.vue'

const { api, cleanups, authState, authStateProxy } = vi.hoisted(() => ({
  api: {
    listInstances: vi.fn(),
    listNotifications: vi.fn(),
    listDeliveries: vi.fn(),
    getDelivery: vi.fn(),
    getNotification: vi.fn()
  },
  cleanups: [] as Array<() => void>,
  authStateProxy: { current: null as unknown },
  authState: {
    token: 'fixture-session',
    userInfo: { id: 'fixture-user', userId: 'fixture-user', tenant_id: 'fixture-tenant' }
  }
}))

vi.mock('@/service/api/notification-v2', () => ({
  notificationV2: api,
  NotificationSessionChangedError: class NotificationSessionChangedError extends Error {},
  registerNotificationSessionCleanup: (cleanup: () => void) => {
    cleanups.push(cleanup)
    return () => {
      const index = cleanups.indexOf(cleanup)
      if (index >= 0) cleanups.splice(index, 1)
    }
  },
  invalidateNotificationSession: () => cleanups.forEach(cleanup => cleanup())
}))

vi.mock('@/store/modules/auth', async () => {
  const { reactive } = await import('vue')
  const state = reactive(authState)
  authStateProxy.current = state
  return { useAuthStore: () => state }
})
vi.mock('vue-i18n', () => ({ useI18n: () => ({ locale: { value: 'en-us' } }) }))
vi.mock('naive-ui', async () => {
  const { defineComponent: define, h: createElement } = await import('vue')
  return {
    NButton: define({
      name: 'NButton',
      props: ['disabled', 'loading'],
      emits: ['click'],
      setup(props, { slots, emit, attrs }) {
        return () =>
          createElement(
            'button',
            { ...attrs, disabled: props.disabled, onClick: (event: Event) => emit('click', event) },
            slots.default?.()
          )
      }
    })
  }
})

const InputStub = defineComponent({
  name: 'NInput',
  props: ['value', 'clearable'],
  emits: ['update:value'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        value: props.value ?? '',
        onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value)
      })
  }
})

const DataTableStub = defineComponent({
  name: 'NDataTable',
  props: ['columns', 'data'],
  setup(props) {
    return () =>
      h(
        'div',
        { class: 'qa-data-table' },
        (props.data as Array<Record<string, unknown>>).map(row =>
          h(
            'div',
            { class: 'qa-row' },
            (props.columns as Array<{ key: string; render?: CallableFunction }>).map(column =>
              column.render ? column.render.call(column.render, row) : String(row[column.key] ?? '')
            )
          )
        )
      )
  }
})

const ModalStub = defineComponent({
  name: 'NModal',
  props: ['show'],
  emits: ['update:show', 'after-leave'],
  setup(props, { emit, slots }) {
    return () =>
      props.show
        ? h('div', { class: 'qa-modal' }, [
            h(
              'button',
              {
                type: 'button',
                'data-close-details': '',
                onClick: () => {
                  emit('update:show', false)
                  emit('after-leave')
                }
              },
              'Close details'
            ),
            slots.default?.()
          ])
        : null
  }
})

const SlotStub = defineComponent({
  inheritAttrs: true,
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  }
})

function deferred<T>() {
  let resolve!: CallableFunction
  const promise = new Promise<T>(settle => {
    resolve = settle
  })
  return { promise, resolve: (value: T) => resolve.call(resolve, value) }
}

const stubs = {
  NCard: SlotStub,
  NDivider: SlotStub,
  NFormItem: SlotStub,
  NSelect: SlotStub,
  NInput: InputStub,
  NDatePicker: SlotStub,
  NDataTable: DataTableStub,
  NPagination: SlotStub,
  NAlert: SlotStub,
  NModal: ModalStub,
  NSpin: SlotStub
}

function delivery(id: string): NotificationV2.DeliveryView {
  return {
    deliveryId: id,
    notificationId: `notification-${id}`,
    source: { type: 'manual', id: `source-${id}` },
    instanceId: 'instance-1',
    configVersion: 1,
    recipient: { kind: 'email', display: 'o***@example.test' },
    attemptCount: 1,
    dispatchStatus: 'accepted',
    deliveryStatus: 'pending',
    error: null,
    createdAt: '2026-10-09T00:00:00Z'
  }
}

function blockedRequest(id: string): NotificationV2.NotificationView {
  return {
    id,
    source: { type: 'alarm', id: `legacy-${id}` },
    intakeStatus: 'blocked',
    blockedReason: 'group_revision_unavailable',
    createdAt: '2026-10-09T00:00:00Z',
    deliveries: []
  }
}

function tableWithDeliveries(wrapper: ReturnType<typeof mount>) {
  return wrapper
    .findAllComponents(DataTableStub)
    .find(table => (table.props('data') as NotificationV2.DeliveryView[]).some(row => row.deliveryId))!
}

describe('notification delivery page async lifecycle', () => {
  beforeEach(() => {
    cleanups.splice(0)
    api.listInstances.mockReset().mockResolvedValue({ data: { items: [] } })
    api.listNotifications.mockReset().mockResolvedValue({ data: { items: [], total: 0 } })
    api.listDeliveries.mockReset().mockResolvedValue({ data: { items: [], total: 0 } })
    api.getDelivery.mockReset().mockImplementation(async (id: string) => ({ data: delivery(id) }))
    api.getNotification.mockReset().mockImplementation(async (id: string) => ({ data: { id, deliveries: [] } }))
    const auth = authStateProxy.current as typeof authState
    auth.token = 'fixture-session'
    auth.userInfo.tenant_id = 'fixture-tenant'
    ;(globalThis as { React?: unknown }).React = {
      createElement: (type: Parameters<typeof h>[0], props: Parameters<typeof h>[1], ...children: unknown[]) =>
        h(type, props, () => children)
    }
    vi.useRealTimers()
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
  })

  it('does not let an older filter response replace the newest delivery page', async () => {
    const oldResponse = deferred<{ data: { items: NotificationV2.DeliveryView[]; total: number } }>()
    api.listDeliveries
      .mockReturnValueOnce(oldResponse.promise)
      .mockResolvedValueOnce({ data: { items: [delivery('new')], total: 1 } })

    const wrapper = mount(NotificationDeliveries, { global: { stubs } })
    await flushPromises()
    const inputs = wrapper.findAll('input')
    await inputs[1].setValue('new-source')
    const filterButton = wrapper.findAll('button').find(button => button.text() === 'Filter')
    expect(filterButton).toBeDefined()
    await filterButton!.trigger('click')
    await flushPromises()
    expect(tableWithDeliveries(wrapper).props('data')).toEqual([delivery('new')])

    oldResponse.resolve({ data: { items: [delivery('old')], total: 1 } })
    await flushPromises()
    expect(tableWithDeliveries(wrapper).props('data')).toEqual([delivery('new')])
    expect(api.listDeliveries.mock.calls[1][0]).toMatchObject({ sourceId: 'new-source', page: 1 })
    wrapper.unmount()
  })

  it('clears and rejects a delivery response that arrives after the tenant changes', async () => {
    const oldResponse = deferred<{ data: { items: NotificationV2.DeliveryView[]; total: number } }>()
    api.listDeliveries.mockReturnValueOnce(oldResponse.promise)
    const wrapper = mount(NotificationDeliveries, { global: { stubs } })
    await flushPromises()
    const originalSignal = api.listDeliveries.mock.calls[0][1] as AbortSignal

    const auth = authStateProxy.current as typeof authState
    auth.userInfo.tenant_id = 'other-tenant'
    await nextTick()
    expect(originalSignal.aborted).toBe(true)
    oldResponse.resolve({ data: { items: [delivery('old-tenant')], total: 1 } })
    await flushPromises()

    const visibleDeliveries = wrapper
      .findAllComponents(DataTableStub)
      .flatMap(table => (table.props('data') as Array<{ deliveryId?: string }>).filter(row => row.deliveryId))
    expect(visibleDeliveries).toEqual([])
    wrapper.unmount()
  })

  it('shows a blocked request with zero deliveries as not sent and keeps the block reason', async () => {
    api.listNotifications.mockResolvedValue({ data: { items: [blockedRequest('blocked-1')], total: 1 } })
    const wrapper = mount(NotificationDeliveries, { global: { stubs } })
    await flushPromises()

    const requestTable = wrapper.findAllComponents(DataTableStub)[0]
    expect(requestTable.props('data')).toEqual([blockedRequest('blocked-1')])
    const viewButton = requestTable.find('button')
    expect(viewButton.text()).toBe('View')
    await viewButton.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Configuration/recipient needs attention; nothing was sent')
    expect(wrapper.text()).toContain('group_revision_unavailable')
    expect(wrapper.text()).toContain('No one-click resend is available when the outcome is unknown.')
    expect(api.getDelivery).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('labels accepted-without-receipt and unknown delivery rows without offering a resend action', async () => {
    const accepted = {
      ...delivery('accepted-no-receipt'),
      dispatchStatus: 'accepted' as const,
      deliveryStatus: 'unsupported' as const
    }
    const unknown = { ...delivery('unknown'), dispatchStatus: 'unknown' as const, deliveryStatus: 'unknown' as const }
    api.listDeliveries.mockResolvedValue({ data: { items: [accepted, unknown], total: 2 } })
    const wrapper = mount(NotificationDeliveries, { global: { stubs } })
    await flushPromises()

    const deliveryTable = tableWithDeliveries(wrapper)
    expect(deliveryTable.props('data')).toEqual([accepted, unknown])
    expect(wrapper.text()).toContain('Provider accepted; this channel has no delivery receipt')
    expect(wrapper.text()).toContain('Acceptance is unknown; the system will not retry automatically')
    expect(wrapper.findAll('button').some(button => /retry|resend/i.test(button.text()))).toBe(false)
    wrapper.unmount()
  })

  it('pauses detail polling while hidden, resumes while visible, and stops on unmount', async () => {
    vi.useFakeTimers()
    api.listDeliveries.mockResolvedValue({ data: { items: [delivery('polling')], total: 1 } })
    let hidden = false
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
    const wrapper = mount(NotificationDeliveries, { global: { stubs } })
    await flushPromises()
    const viewButton = wrapper.findAll('button').find(button => button.text() === 'View')
    expect(viewButton).toBeDefined()
    await viewButton!.trigger('click')
    await flushPromises()
    expect(api.getDelivery).toHaveBeenCalledTimes(1)

    hidden = true
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(3000)
    expect(api.getDelivery).toHaveBeenCalledTimes(1)

    hidden = false
    document.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(3000)
    await flushPromises()
    expect(api.getDelivery).toHaveBeenCalledTimes(2)

    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(6000)
    expect(api.getDelivery).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  it('clears the detail timer when the modal closes', async () => {
    vi.useFakeTimers()
    api.listDeliveries.mockResolvedValue({ data: { items: [delivery('close')], total: 1 } })
    const wrapper = mount(NotificationDeliveries, { global: { stubs } })
    await flushPromises()
    const viewButton = wrapper.findAll('button').find(button => button.text() === 'View')
    await viewButton!.trigger('click')
    await flushPromises()
    expect(api.getDelivery).toHaveBeenCalledTimes(1)

    await wrapper.get('[data-close-details]').trigger('click')
    await vi.advanceTimersByTimeAsync(6000)
    expect(api.getDelivery).toHaveBeenCalledTimes(1)
    wrapper.unmount()
    vi.useRealTimers()
  })
})
