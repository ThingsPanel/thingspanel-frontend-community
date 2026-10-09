import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationClientError } from '@/service/api/notification-v2'
import NotificationGroups from '@/views/alarm/notification-group/NotificationGroups.vue'

const { api, getUserListMock, authState } = vi.hoisted(() => ({
  api: {
    listGroups: vi.fn(),
    listInstances: vi.fn(),
    listPlugins: vi.fn(),
    getGroup: vi.fn(),
    createGroup: vi.fn(),
    updateGroup: vi.fn(),
    testInstance: vi.fn(),
    createIdempotencyKey: vi.fn(() => 'fixture-idempotency-key')
  },
  getUserListMock: vi.fn(),
  authState: {
    token: 'fixture-session',
    userInfo: {
      id: 'fixture-user',
      userId: 'fixture-user',
      tenant_id: 'fixture-tenant',
      authority: 'TENANT_ADMIN',
      roles: ['TENANT_ADMIN']
    }
  }
}))

vi.mock('@/service/api/notification-v2', async importOriginal => {
  const original = await importOriginal<typeof import('@/service/api/notification-v2')>()
  return { ...original, notificationV2: api }
})
vi.mock('@/service/api/notification', () => ({ getUserList: getUserListMock }))
vi.mock('@/store/modules/auth', async () => {
  const { reactive: makeReactive } = await import('vue')
  const state = makeReactive(authState)
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

const ButtonStub = defineComponent({
  name: 'NButton',
  props: ['disabled', 'loading'],
  emits: ['click'],
  setup(props, { slots, emit, attrs }) {
    return () =>
      h(
        'button',
        { ...attrs, disabled: props.disabled, onClick: (event: Event) => emit('click', event) },
        slots.default?.()
      )
  }
})

const SelectStub = defineComponent({
  name: 'NSelect',
  props: ['value', 'options', 'disabled', 'loading', 'inputProps'],
  emits: ['update:value', 'search', 'focus'],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        'select',
        {
          ...attrs,
          ...((props.inputProps || {}) as Record<string, unknown>),
          value: props.value ?? '',
          disabled: props.disabled,
          onChange: (event: Event) => emit('update:value', (event.target as HTMLSelectElement).value),
          onFocus: () => emit('focus')
        },
        [
          h('option', { value: '' }, ''),
          ...((props.options || []) as Array<{ label: string; value: string; disabled?: boolean }>).map(option =>
            h('option', { value: option.value, disabled: option.disabled }, option.label)
          )
        ]
      )
  }
})

const InputStub = defineComponent({
  name: 'NInput',
  props: ['value', 'disabled', 'type', 'inputProps'],
  emits: ['update:value'],
  setup(props, { emit, attrs }) {
    return () =>
      h('input', {
        ...attrs,
        ...((props.inputProps || {}) as Record<string, unknown>),
        value: props.value ?? '',
        disabled: props.disabled,
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
        (props.data as Array<Record<string, unknown>>).map(row =>
          h(
            'div',
            (props.columns as Array<{ key: string; render?: CallableFunction }>).map(column =>
              column.render ? column.render.call(column.render, row) : String(row[column.key] ?? '')
            )
          )
        )
      )
  }
})

const FormItemStub = defineComponent({
  name: 'NFormItem',
  props: ['label'],
  setup(props, { slots }) {
    return () => h('label', [h('span', String(props.label)), ...(slots.default?.() || [])])
  }
})

const ModalStub = defineComponent({
  name: 'NModal',
  props: ['show'],
  emits: ['update:show', 'after-leave'],
  setup(props, { slots }) {
    return () => (props.show ? h('div', { class: 'qa-modal' }, slots.default?.()) : null)
  }
})

const CardStub = defineComponent({
  inheritAttrs: true,
  setup(_, { attrs, slots }) {
    return () => h('div', { ...attrs, class: ['qa-card', attrs.class] }, slots.default?.())
  }
})

const SlotStub = defineComponent({
  inheritAttrs: true,
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  }
})

const stubs = {
  NButton: ButtonStub,
  NSelect: SelectStub,
  NInput: InputStub,
  NDataTable: DataTableStub,
  NFormItem: FormItemStub,
  NModal: ModalStub,
  NCard: CardStub,
  NForm: SlotStub,
  NDivider: SlotStub,
  NAlert: SlotStub,
  NRadioGroup: SlotStub,
  NRadio: SlotStub,
  NSwitch: SlotStub,
  NInputNumber: SlotStub,
  NDatePicker: SlotStub,
  NPagination: SlotStub
}

function installTsxShim() {
  ;(globalThis as { React?: unknown }).React = {
    createElement: (type: Parameters<typeof h>[0], props: Parameters<typeof h>[1], ...children: unknown[]) =>
      h(type, props, () => children)
  }
}

describe('notification group page failure and conflict flow', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_NOTIFICATION_API_BASE_URL', 'https://encore.example.test')
    api.listGroups.mockReset().mockResolvedValue({ data: { items: [], total: 0 } })
    api.listInstances
      .mockReset()
      .mockResolvedValue({ data: { items: [{ id: 'email-1', name: 'Email', channel: 'email', enabled: true }] } })
    api.listPlugins.mockReset().mockResolvedValue({ data: { items: [] } })
    api.getGroup.mockReset()
    api.createGroup.mockReset()
    api.updateGroup.mockReset()
    api.createIdempotencyKey.mockReturnValue('fixture-idempotency-key')
    getUserListMock.mockReset()
    authState.token = 'fixture-session'
    authState.userInfo.tenant_id = 'fixture-tenant'
    installTsxShim()
  })

  it('distinguishes a failed member-directory lookup from an empty list and retries it', async () => {
    getUserListMock.mockRejectedValueOnce(new Error('directory unavailable')).mockResolvedValueOnce({
      data: { list: [{ user_id: 'member-1', name: 'Fixture member' }] }
    })
    const wrapper = mount(NotificationGroups, { global: { stubs } })
    await flushPromises()
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Create group')!
      .trigger('click')
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Add binding')!
      .trigger('click')
    const selects = wrapper.findAll('select')
    await selects[0].setValue('email-1')
    await selects[1].setValue('member')
    await flushPromises()

    const memberSelect = wrapper
      .findAllComponents(SelectStub)
      .find(select => select.element.closest('label')?.textContent?.includes('Member'))!
    await memberSelect.trigger('focus')
    await flushPromises()
    expect(wrapper.text()).toContain('Could not load the member directory.')
    expect(wrapper.findAll('button').some(button => button.text() === 'Retry member lookup')).toBe(true)

    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Retry member lookup')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.text()).not.toContain('Could not load the member directory.')
    expect((memberSelect.props('options') as Array<{ value: string }>).map(option => option.value)).toContain(
      'member-1'
    )
    expect(getUserListMock).toHaveBeenCalledTimes(2)
    expect(api.createGroup).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('ignores an older member-search failure after a newer query succeeds', async () => {
    getUserListMock.mockRejectedValueOnce(new Error('old query failed')).mockResolvedValueOnce({
      data: { list: [{ user_id: 'new-member', name: 'New result' }] }
    })
    const wrapper = mount(NotificationGroups, { global: { stubs } })
    await flushPromises()
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Create group')!
      .trigger('click')
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Add binding')!
      .trigger('click')
    await wrapper.findAll('select')[0].setValue('email-1')
    await wrapper.findAll('select')[1].setValue('member')
    await flushPromises()
    const memberSelect = wrapper
      .findAllComponents(SelectStub)
      .find(select => select.element.closest('label')?.textContent?.includes('Member'))!
    await memberSelect.vm.$emit('search', 'old')
    await memberSelect.vm.$emit('search', 'new')
    await flushPromises()

    expect((memberSelect.props('options') as Array<{ value: string }>).map(option => option.value)).toEqual([
      'new-member'
    ])
    expect(wrapper.text()).toContain('New result')
    expect(wrapper.text()).not.toContain('Old result')
    expect(wrapper.text()).not.toContain('Could not load the member directory.')
    expect(api.createGroup).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('keeps applicationUserId member bindings out of submit', async () => {
    const group = {
      id: 'group-1',
      name: 'Native group',
      enabled: false,
      bindings: [
        {
          bindingId: 'binding-1',
          instanceId: 'email-1',
          recipientSource: { kind: 'member', userId: 'member-1', contactField: 'applicationUserId' },
          contentBinding: { kind: 'text', title: '', text: 'Fixture content' }
        }
      ],
      revision: 1,
      version: 4,
      migrationState: 'native' as const
    }
    api.listGroups.mockResolvedValue({ data: { items: [group], total: 1 } })
    api.getGroup.mockResolvedValue({ data: group })
    api.updateGroup.mockRejectedValue(new NotificationClientError('group version changed', 409))
    const wrapper = mount(NotificationGroups, { global: { stubs } })
    await flushPromises()
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Edit')!
      .trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('application user IDs are never converted')
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Save group')!
      .trigger('click')
    await flushPromises()
    expect(api.updateGroup).not.toHaveBeenCalled()
    expect(api.createGroup).not.toHaveBeenCalled()
    expect(api.testInstance).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('keeps a group version 409 as an explicit refresh conflict without sending any binding', async () => {
    const group = {
      id: 'group-1',
      name: 'Native group',
      enabled: false,
      bindings: [
        {
          bindingId: 'binding-1',
          instanceId: 'email-1',
          recipientSource: { kind: 'literal', recipient: { kind: 'email', address: 'fixture@example.test' } },
          contentBinding: { kind: 'text', title: '', text: 'Fixture content' }
        }
      ],
      revision: 1,
      version: 4,
      migrationState: 'native' as const
    }
    api.listGroups.mockResolvedValue({ data: { items: [group], total: 1 } })
    api.getGroup.mockResolvedValue({ data: group })
    api.updateGroup.mockRejectedValue(new NotificationClientError('group version changed', 409))
    const wrapper = mount(NotificationGroups, { global: { stubs } })
    await flushPromises()
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Edit')!
      .trigger('click')
    await flushPromises()
    await wrapper.find('input').setValue('Renamed group')
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Save group')!
      .trigger('click')
    await flushPromises()

    expect(api.updateGroup).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain(
      'Another administrator changed this group. Refresh and review before saving again.'
    )
    expect(wrapper.findAll('button').some(button => button.text() === 'Refresh this group and review again')).toBe(true)
    expect(api.testInstance).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('places validation errors on each matching binding in a multi-binding group', async () => {
    const group = {
      id: 'group-1',
      name: 'Native group',
      enabled: false,
      bindings: ['binding-1', 'binding-2'].map((bindingId, index) => ({
        bindingId,
        instanceId: 'email-1',
        recipientSource: {
          kind: 'literal' as const,
          recipient: { kind: 'email' as const, address: `member-${index + 1}@example.test` }
        },
        contentBinding: { kind: 'text' as const, title: '', text: `Fixture content ${index + 1}` }
      })),
      revision: 3,
      version: 7,
      migrationState: 'native' as const
    }
    api.listGroups.mockResolvedValue({ data: { items: [group], total: 1 } })
    api.getGroup.mockResolvedValue({ data: group })
    api.updateGroup.mockRejectedValue(
      new NotificationClientError('group validation failed', 422, undefined, undefined, {
        fields: [
          { field: 'bindings[binding-1].recipientSource.recipient.address', reason: 'first binding rejected' },
          { field: 'bindings[binding-2].contentBinding.text', reason: 'second binding rejected' }
        ]
      } as never)
    )
    const wrapper = mount(NotificationGroups, { attachTo: document.body, global: { stubs } })
    await flushPromises()
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Edit')!
      .trigger('click')
    await flushPromises()
    expect(wrapper.find('input').attributes('aria-label')).toBe('Group name')
    await wrapper.find('input').setValue('Updated group')
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Save group')!
      .trigger('click')
    await flushPromises()

    expect(api.updateGroup).toHaveBeenCalledTimes(1)
    const bindingCards = wrapper.findAll('.qa-card').filter(card => card.find('code').exists())
    const firstCard = bindingCards.find(
      card => card.findAll('code').length === 1 && card.find('code').text() === 'binding-1'
    )
    const secondCard = bindingCards.find(
      card => card.findAll('code').length === 1 && card.find('code').text() === 'binding-2'
    )
    expect(firstCard?.text()).toContain('first binding rejected')
    expect(firstCard?.text()).not.toContain('second binding rejected')
    expect(secondCard?.text()).toContain('second binding rejected')
    expect(secondCard?.text()).not.toContain('first binding rejected')
    const recipientInput = wrapper.get('#notification-group-binding-1-recipient-address')
    expect(recipientInput.attributes('aria-invalid')).toBe('true')
    expect(recipientInput.attributes('aria-describedby')).toBe('notification-group-binding-1-recipient-address-error')
    expect(wrapper.get('#notification-group-binding-1-recipient-address-error').text()).toContain(
      'first binding rejected'
    )
    expect(document.activeElement).toBe(recipientInput.element)
    expect(api.testInstance).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
