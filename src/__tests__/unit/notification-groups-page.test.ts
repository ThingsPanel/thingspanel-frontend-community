import { defineComponent, Fragment, h } from 'vue'
import type { VNodeChild } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationClientError } from '@/service/api/notification-v2'
import NotificationGroups from '@/views/alarm/notification-group/NotificationGroups.vue'

const { api, getUserListMock, getPublishStatusMock, publishNativeGroupMock, authState } = vi.hoisted(() => ({
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
  getPublishStatusMock: vi.fn(),
  publishNativeGroupMock: vi.fn(),
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
vi.mock('@/service/api/notification', () => ({
  getUserList: getUserListMock,
  getNativeNotificationGroupPublishStatus: getPublishStatusMock,
  publishNativeNotificationGroup: publishNativeGroupMock
}))
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
    }),
    NSpace: define({
      name: 'NSpace',
      setup(_, { slots }) {
        return () => createElement('div', slots.default?.())
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
  props: {
    value: null,
    options: null,
    disabled: null,
    loading: null,
    inputProps: null,
    filterable: { type: Boolean, default: false }
  },
  emits: ['update:value', 'search', 'focus'],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        'select',
        {
          ...attrs,
          ...((props.inputProps || {}) as Record<string, unknown>),
          'data-filterable': props.filterable ? 'true' : undefined,
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
            (props.columns as Array<{ key: string; render?: unknown }>).map(column =>
              typeof column.render === 'function'
                ? (Reflect.apply(column.render, undefined, [row]) as VNodeChild)
                : String(row[column.key] ?? '')
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
    return () => (props.show ? h('div', { class: 'qa-modal' }, [slots.default?.(), slots.footer?.()]) : null)
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
  NSpace: SlotStub,
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
    Fragment,
    createElement: (
      type: Parameters<typeof h>[0] | typeof Fragment,
      props: Parameters<typeof h>[1],
      ...children: unknown[]
    ) =>
      type === Fragment
        ? h(Fragment, props, children.flat(Infinity) as never)
        : h(type as Parameters<typeof h>[0], props, () => children)
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
    getPublishStatusMock.mockReset().mockResolvedValue({ published: false, routeVersion: 0 })
    publishNativeGroupMock.mockReset()
    authState.token = 'fixture-session'
    authState.userInfo.tenant_id = 'fixture-tenant'
    installTsxShim()
  })

  it.each([true, false, 'slow-refresh'])('saves once and reports publication outcome (%s)', async outcome => {
    const succeeds = outcome !== false
    const group = {
      id: 'publish-group',
      name: 'Alarm policy',
      enabled: true,
      revision: 2,
      version: 2,
      migrationState: 'native',
      bindings: [
        {
          bindingId: 'binding-1',
          instanceId: 'email-1',
          recipientSource: { kind: 'literal', recipient: { kind: 'email', address: 'test@example.test' } },
          contentBinding: { kind: 'text', title: 'Alarm', text: 'Device alarm' }
        }
      ]
    }
    api.listGroups.mockResolvedValue({ data: { items: [group], total: 1 } })
    api.getGroup.mockResolvedValue({ data: group })
    api.updateGroup.mockResolvedValue({ data: group })
    const published = { published: true, routeVersion: 1, effectiveGroupRevision: 2, legacyGroupId: 'alias' }
    publishNativeGroupMock.mockImplementation(async () => {
      if (!succeeds) throw new Error('network unavailable')
      if (outcome === 'slow-refresh') getPublishStatusMock.mockImplementation(() => new Promise(() => {}))
      else getPublishStatusMock.mockResolvedValue(published)
      return published
    })
    const wrapper = mount(NotificationGroups, { global: { stubs } })
    await flushPromises()
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Edit')!
      .trigger('click')
    await flushPromises()
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Save and publish')!
      .trigger('click')
    await flushPromises()
    expect(api.updateGroup).toHaveBeenCalledTimes(1)
    expect(publishNativeGroupMock).toHaveBeenCalledTimes(1)
    expect(api.testInstance).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain(
      succeeds ? 'Policy saved and published.' : 'Configuration saved, but publication is not confirmed.'
    )
    if (!succeeds) {
      await wrapper
        .findAll('button')
        .find(button => button.text() === 'Result unconfirmed; retry the same request')!
        .trigger('click')
      await flushPromises()
      expect(api.updateGroup).toHaveBeenCalledTimes(1)
      expect(publishNativeGroupMock.mock.calls[1]).toEqual(publishNativeGroupMock.mock.calls[0])
    }
    wrapper.unmount()
  })

  it('groups members for editing and preserves each binding identity when saved', async () => {
    const group = {
      id: 'multi',
      name: 'Team alerts',
      enabled: true,
      revision: 1,
      version: 1,
      migrationState: 'native',
      bindings: ['one', 'two'].map(id => ({
        bindingId: `binding-${id}`,
        instanceId: 'email-1',
        recipientSource: { kind: 'member', userId: id, contactField: 'email' },
        contentBinding: { kind: 'text', title: 'Alarm', text: 'Device alarm' }
      }))
    }
    api.listGroups.mockResolvedValue({ data: { items: [group], total: 1 } })
    api.getGroup.mockResolvedValue({ data: group })
    api.updateGroup.mockResolvedValue({ data: group })
    getUserListMock.mockResolvedValue({ data: { list: [] } })
    const wrapper = mount(NotificationGroups, { global: { stubs } })
    await flushPromises()
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Edit')!
      .trigger('click')
    await flushPromises()
    const member = wrapper.findAllComponents(SelectStub).find(select => select.attributes('aria-label') === 'Member')!
    expect(member.props('value')).toEqual(['one', 'two'])
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Save group')!
      .trigger('click')
    await flushPromises()
    expect(api.updateGroup.mock.calls[0][1].bindings).toEqual(group.bindings)
    wrapper.unmount()
  })

  it('saves an App member alarm policy without a literal CID', async () => {
    const group = {
      id: 'app-group',
      name: 'App alarms',
      enabled: true,
      revision: 1,
      version: 1,
      migrationState: 'native',
      bindings: [
        {
          bindingId: 'binding-app',
          instanceId: 'app-instance',
          recipientSource: { kind: 'member', userId: 'member-1', contactField: 'appDevice' },
          contentBinding: { kind: 'text', title: 'Alarm', text: 'alarm' }
        }
      ]
    }
    api.listGroups.mockResolvedValue({ data: { items: [group], total: 1 } })
    api.getGroup.mockResolvedValue({ data: group })
    api.listInstances.mockResolvedValue({
      data: {
        items: [{ id: 'app-instance', name: 'App', channel: 'im', enabled: true, pluginRegistrationId: 'plugin-app' }]
      }
    })
    api.listPlugins.mockResolvedValue({
      data: {
        items: [
          { id: 'plugin-app', pluginId: 'thingspanel.unipush', pluginVersion: '2.0.0', manifest: { name: 'App' } }
        ]
      }
    })
    api.updateGroup.mockResolvedValue({ data: group })
    const wrapper = mount(NotificationGroups, { global: { stubs } })
    await flushPromises()
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Edit')!
      .trigger('click')
    await flushPromises()
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Use device alarm notification for all active phones')!
      .trigger('click')
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Save group')!
      .trigger('click')
    await flushPromises()
    expect(api.updateGroup).toHaveBeenCalled()
    const saved = api.updateGroup.mock.calls[0][1].bindings[0]
    expect(saved.recipientSource).toEqual({ kind: 'member', userId: 'member-1', contactField: 'appDevice' })
    expect(saved.contentBinding).toEqual({
      kind: 'template',
      templateId: 'device_alarm',
      locale: 'zh-CN',
      paramsMapping: { title: 'subject', text: 'text', alarmId: 'alarmId', alarmKind: 'alarmKind' }
    })
    expect(api.testInstance).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('distinguishes a failed member-directory lookup from an empty list and retries it', async () => {
    getUserListMock.mockRejectedValueOnce(new Error('directory unavailable')).mockResolvedValueOnce({
      data: { list: [{ user_id: 'member-1', name: 'Fixture member' }] }
    })
    const wrapper = mount(NotificationGroups, { global: { stubs } })
    await flushPromises()
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Create policy')!
      .trigger('click')
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Add binding')!
      .trigger('click')
    const selects = wrapper.findAll('select')
    const selectComponents = wrapper.findAllComponents(SelectStub)
    expect(selectComponents.length).toBeGreaterThan(1)
    for (const select of selectComponents) {
      expect(select.props('filterable')).toBe(true)
      expect((select.props('inputProps') as Record<string, unknown>).id).toContain('notification-group-')
      expect((select.props('inputProps') as Record<string, unknown>)['aria-label']).toBeTruthy()
    }
    await selects[0].setValue('email-1')
    await wrapper
      .findAllComponents(SelectStub)
      .find(select => select.element.closest('label')?.textContent?.includes('Recipient source'))!
      .get('select')
      .setValue('member')
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
      .find(button => button.text() === 'Create policy')!
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

    expect(wrapper.text()).toContain('application user IDs are not provider recipient addresses')
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

  it('retries an unconfirmed community alert publish with the same body and key', async () => {
    const group = {
      id: 'group-native-1',
      name: 'Enabled native group',
      enabled: true,
      bindings: [],
      revision: 3,
      version: 5,
      migrationState: 'native' as const
    }
    api.listGroups.mockResolvedValue({ data: { items: [group], total: 1 } })
    publishNativeGroupMock.mockRejectedValueOnce(new Error('connection closed before response')).mockResolvedValueOnce({
      published: true,
      nativeGroupId: group.id,
      legacyGroupId: 'legacy-alias-1',
      groupRevision: group.revision,
      routeVersion: 1,
      name: group.name
    })
    getPublishStatusMock
      .mockResolvedValueOnce({ published: false, routeVersion: 0 })
      .mockResolvedValueOnce({ published: false, routeVersion: 0 })
      .mockResolvedValue({
        published: true,
        nativeGroupId: group.id,
        legacyGroupId: 'legacy-alias-1',
        groupRevision: group.revision,
        effectiveGroupRevision: group.revision,
        routeVersion: 1,
        name: group.name
      })
    const wrapper = mount(NotificationGroups, { global: { stubs } })
    await flushPromises()

    const publishButton = () =>
      wrapper.findAll('button').find(button => /enable policy|same request/i.test(button.text()))!
    await publishButton().trigger('click')
    await flushPromises()

    expect(publishNativeGroupMock).toHaveBeenCalledTimes(1)
    expect(publishButton().text()).toContain('Result unconfirmed; retry the same request')
    const firstCall = publishNativeGroupMock.mock.calls[0]

    await publishButton().trigger('click')
    await flushPromises()

    expect(publishNativeGroupMock).toHaveBeenCalledTimes(2)
    expect(publishNativeGroupMock.mock.calls[1]).toEqual(firstCall)
    expect(firstCall).toEqual([
      {
        operation: 'publish',
        nativeGroupId: group.id,
        groupRevision: group.revision,
        name: group.name,
        expectedRouteVersion: 0
      },
      'fixture-idempotency-key'
    ])
    expect(wrapper.text()).toContain('Enabled')
    wrapper.unmount()
  })

  it('stops an alert route with a stable retry body and key', async () => {
    const group = {
      id: 'group-native-2',
      name: 'Published group',
      enabled: true,
      bindings: [],
      revision: 6,
      version: 9,
      migrationState: 'native' as const
    }
    const publishedStatus = {
      published: true,
      status: 'published',
      nativeGroupId: group.id,
      legacyGroupId: 'legacy-alias-2',
      groupRevision: 6,
      effectiveGroupRevision: 6,
      routeVersion: 3,
      engine: 'encore',
      enabled: true,
      name: group.name
    }
    const stoppedStatus = {
      published: false,
      status: 'stopped',
      nativeGroupId: group.id,
      legacyGroupId: 'legacy-alias-2',
      groupRevision: 6,
      effectiveGroupRevision: 0,
      routeVersion: 4,
      engine: 'legacy',
      enabled: false,
      name: group.name
    }
    api.listGroups.mockResolvedValue({ data: { items: [group], total: 1 } })
    getPublishStatusMock
      .mockResolvedValueOnce(publishedStatus)
      .mockResolvedValueOnce(publishedStatus)
      .mockResolvedValue(stoppedStatus)
    publishNativeGroupMock
      .mockRejectedValueOnce(new Error('connection closed before response'))
      .mockResolvedValueOnce(stoppedStatus)
    const wrapper = mount(NotificationGroups, { global: { stubs } })
    await flushPromises()
    const stopButton = () => wrapper.findAll('button').find(button => button.text() === 'Disable policy')!
    await stopButton().trigger('click')
    await flushPromises()

    expect(publishNativeGroupMock).toHaveBeenCalledTimes(1)
    const firstCall = publishNativeGroupMock.mock.calls[0]
    expect(firstCall).toEqual([
      { operation: 'unpublish', nativeGroupId: group.id, expectedRouteVersion: 3 },
      'fixture-idempotency-key'
    ])
    expect(wrapper.text()).toContain('Result unconfirmed; retry the same request')

    const retryButton = wrapper
      .findAll('button')
      .find(button => button.text() === 'Result unconfirmed; retry the same request')!
    await retryButton.trigger('click')
    await flushPromises()
    expect(publishNativeGroupMock).toHaveBeenCalledTimes(2)
    expect(publishNativeGroupMock.mock.calls[1]).toEqual(firstCall)
    expect(wrapper.findAll('button').some(button => button.text() === 'Stop using for community alerts')).toBe(false)
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
