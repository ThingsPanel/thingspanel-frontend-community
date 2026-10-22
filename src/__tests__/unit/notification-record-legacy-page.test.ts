import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import NotificationRecord from '@/views/alarm/notification-record/index.vue'

const { getHistoryMock } = vi.hoisted(() => ({ getHistoryMock: vi.fn() }))

vi.mock('@/service/api/notification', () => ({ getNotificationHistoryList: getHistoryMock }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ locale: { value: 'en-us' } }) }))
vi.mock('@/locales', () => ({ $t: (key: string) => key }))
vi.mock('@/utils/storage', () => {
  const storage = { get: vi.fn(), set: vi.fn(), remove: vi.fn(), clear: vi.fn() }
  return {
    localStg: storage,
    sessionStg: storage,
    localforage: { getItem: vi.fn(), setItem: vi.fn(), removeItem: vi.fn(), clear: vi.fn() }
  }
})
vi.mock('~/packages/hooks', () => ({
  useLoading: () => ({ loading: { value: false }, startLoading: vi.fn(), endLoading: vi.fn() }),
  useContext: () => ({ setupStore: vi.fn(), useStore: vi.fn() })
}))

const SlotStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  }
})
const TabPaneStub = defineComponent({
  props: ['tab'],
  setup(props, { slots }) {
    return () => h('section', [h('div', props.tab), slots.default?.()])
  }
})
const ButtonStub = defineComponent({
  emits: ['click'],
  setup(_, { slots, emit, attrs }) {
    return () => h('button', { ...attrs, onClick: (event: Event) => emit('click', event) }, slots.default?.())
  }
})
const TabsStub = defineComponent({
  props: ['value'],
  emits: ['update:value'],
  setup(_, { slots, emit }) {
    return () =>
      h('div', [
        h('button', { onClick: () => emit('update:value', 'legacy') }, 'Open legacy history'),
        slots.default?.()
      ])
  }
})
const DataTableStub = defineComponent({
  props: ['data'],
  setup(props) {
    return () =>
      h(
        'div',
        (props.data as Array<Record<string, unknown>>).map(row =>
          h(
            'div',
            Object.values(row).map(value => String(value ?? ''))
          )
        )
      )
  }
})

describe('legacy notification record page status boundary', () => {
  it('labels old SUCCESS as historical and keeps the old raw value visible without implying delivery', async () => {
    getHistoryMock.mockReset().mockResolvedValue({
      data: {
        list: [
          {
            send_time: '2026-10-09T00:00:00Z',
            send_target: 'fixture@example.test',
            notification_type: 'email',
            send_content: 'fixture body',
            send_result: 'SUCCESS'
          }
        ],
        total: 1
      }
    })
    const wrapper = mount(NotificationRecord, {
      global: {
        stubs: {
          NTabs: TabsStub,
          NTabPane: TabPaneStub,
          NButton: ButtonStub,
          NDataTable: DataTableStub,
          NAlert: SlotStub,
          NCard: SlotStub,
          NEmpty: SlotStub,
          NDatePicker: SlotStub,
          NInput: SlotStub,
          NSelect: SlotStub,
          NModal: SlotStub,
          NotificationDeliveries: true
        }
      }
    })
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Send records')
    expect(wrapper.text()).toContain('History')
    expect(getHistoryMock).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('SUCCESS/FAILURE are stored historical values, not delivery receipts.')
    expect(wrapper.text()).toContain('SUCCESS')
    expect(wrapper.text()).not.toContain('Delivered')
    wrapper.unmount()
  })
})
