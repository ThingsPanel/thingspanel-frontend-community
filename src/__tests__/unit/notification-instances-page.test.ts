import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotificationClientError } from '@/service/api/notification-v2'
import NotificationInstances from '@/views/management/notification/NotificationInstances.vue'

const { api, authState } = vi.hoisted(() => ({
  api: {
    listPlugins: vi.fn(),
    listInstances: vi.fn(),
    validateInstance: vi.fn(),
    createInstance: vi.fn(),
    updateInstance: vi.fn(),
    getInstance: vi.fn(),
    testInstance: vi.fn(),
    getNotification: vi.fn(),
    createIdempotencyKey: vi.fn(() => 'fixture-idempotency-key')
  },
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
vi.mock('@/store/modules/auth', async () => {
  const { reactive } = await import('vue')
  const state = reactive(authState)
  return { useAuthStore: () => state }
})
vi.mock('vue-i18n', () => ({ useI18n: () => ({ locale: { value: 'en-us' } }) }))
vi.mock('naive-ui', async () => {
  const { defineComponent: define, h: createElement } = await import('vue')
  return {
    NButton: define({
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
      setup(_, { slots }) {
        return () => createElement('div', slots.default?.())
      }
    })
  }
})

const plugin = {
  id: 'registration-1',
  pluginId: 'fixture.smtp',
  pluginVersion: '1.0.1',
  enabled: true,
  version: 1,
  manifest: {
    name: 'Fixture SMTP',
    channels: ['email'],
    contentModes: ['text'],
    configSchema: { type: 'object', properties: { host: { type: 'string' } }, required: ['host'] },
    recipientSchema: { type: 'object', properties: { email: { type: 'string', format: 'email' } } },
    secretFields: [],
    capabilities: { deliveryReceipts: false }
  }
}

const instance = {
  id: 'instance-1',
  pluginRegistrationId: 'registration-1',
  name: 'Fixture SMTP account',
  channel: 'email',
  config: { host: 'smtp.example.test' },
  providerIdentity: {},
  secretState: {},
  enabled: true,
  configVersion: 1,
  version: 1
}

const ButtonStub = defineComponent({
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
const InputStub = defineComponent({
  props: ['value', 'disabled', 'type', 'placeholder'],
  emits: ['update:value'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        value: props.value ?? '',
        disabled: props.disabled,
        placeholder: props.placeholder,
        onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value)
      })
  }
})
const SelectStub = defineComponent({
  props: ['value', 'options', 'disabled'],
  emits: ['update:value'],
  setup(props, { emit }) {
    return () =>
      h(
        'select',
        {
          value: props.value ?? '',
          disabled: props.disabled,
          onChange: (event: Event) => emit('update:value', (event.target as HTMLSelectElement).value)
        },
        [
          h('option', { value: '' }, ''),
          ...((props.options || []) as Array<{ label: string; value: string }>).map(option =>
            h('option', { value: option.value }, option.label)
          )
        ]
      )
  }
})
const DataTableStub = defineComponent({
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
const ModalStub = defineComponent({
  props: ['show'],
  emits: ['update:show', 'after-leave'],
  setup(props, { slots }) {
    return () => (props.show ? h('div', { class: 'qa-modal' }, slots.default?.()) : null)
  }
})
const SlotStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  }
})
const stubs = {
  NButton: ButtonStub,
  NInput: InputStub,
  NSelect: SelectStub,
  NDataTable: DataTableStub,
  NModal: ModalStub,
  NCard: SlotStub,
  NForm: SlotStub,
  NFormItem: SlotStub,
  NAlert: SlotStub,
  NSpace: SlotStub,
  NDivider: SlotStub,
  NSwitch: SlotStub,
  NInputNumber: SlotStub,
  NRadioGroup: SlotStub,
  NRadio: SlotStub,
  NCheckboxGroup: SlotStub,
  NCheckbox: SlotStub
}

describe('notification instance page submit boundaries', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_NOTIFICATION_API_BASE_URL', 'https://encore.example.test')
    api.listPlugins.mockReset().mockResolvedValue({ data: { items: [plugin] } })
    api.listInstances.mockReset().mockResolvedValue({ data: { items: [instance], total: 1 } })
    api.validateInstance.mockReset().mockResolvedValue({ data: { valid: true, errors: [] } })
    api.createInstance.mockReset().mockResolvedValue({ data: instance })
    api.updateInstance.mockReset().mockResolvedValue({ data: instance })
    api.getInstance.mockReset().mockResolvedValue({ data: instance })
    api.testInstance.mockReset()
    api.getNotification.mockReset().mockResolvedValue({ data: { deliveries: [] } })
    api.createIdempotencyKey.mockReturnValue('fixture-idempotency-key')
    authState.token = 'fixture-session'
    authState.userInfo.tenant_id = 'fixture-tenant'
    ;(globalThis as { React?: unknown }).React = {
      createElement: (type: Parameters<typeof h>[0], props: Parameters<typeof h>[1], ...children: unknown[]) =>
        h(type, props, () => children)
    }
  })

  it('validates configuration on the real form without saving or sending', async () => {
    const wrapper = mount(NotificationInstances, { global: { stubs } })
    await flushPromises()
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Create instance')!
      .trigger('click')
    await wrapper.findAll('input')[0].setValue('Fixture account')
    await wrapper.find('select').setValue('registration-1')
    await flushPromises()
    await wrapper.findAll('input')[1].setValue('smtp.example.test')
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Validate configuration')!
      .trigger('click')
    await flushPromises()

    expect(api.validateInstance).toHaveBeenCalledWith({
      draft: { pluginRegistrationId: 'registration-1', channel: 'email', config: { host: 'smtp.example.test' } }
    })
    expect(wrapper.text()).toContain('Configuration is valid; no notification was sent.')
    expect(api.createInstance).not.toHaveBeenCalled()
    expect(api.testInstance).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('keeps one stable test body and key across rapid confirmation clicks', async () => {
    let release!: () => void
    let logicalSendCount = 0
    const seen = new Map<string, string>()
    api.testInstance.mockImplementation((_id, body, key) => {
      const serialized = JSON.stringify(body)
      if (!seen.has(key)) {
        seen.set(key, serialized)
        logicalSendCount += 1
      } else {
        expect(seen.get(key)).toBe(serialized)
      }
      return new Promise(resolve => {
        release = () => resolve({ data: { notificationId: 'notification-accepted-1' } })
      })
    })
    const wrapper = mount(NotificationInstances, { global: { stubs } })
    await flushPromises()
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Send test')!
      .trigger('click')
    await wrapper.findAll('input')[0].setValue('ops@example.test')
    await wrapper.findAll('input')[2].setValue('fixture notification')
    const confirm = wrapper.findAll('button').find(button => button.text() === 'Confirm and submit once')!
    await confirm.trigger('click')
    await confirm.trigger('click')

    expect(api.testInstance).toHaveBeenCalledTimes(2)
    expect(api.testInstance.mock.calls[0]).toEqual(api.testInstance.mock.calls[1])
    expect(api.testInstance.mock.calls[0][2]).toBe('fixture-idempotency-key')
    expect(logicalSendCount).toBe(1)
    release()
    await flushPromises()
    expect(wrapper.text()).toContain('Accepted and processing.')
    expect(api.getNotification).toHaveBeenCalledWith('notification-accepted-1')
    wrapper.unmount()
  })

  it('shows a configuration failure in the page without issuing notification mutations', async () => {
    api.listPlugins.mockRejectedValueOnce(new NotificationClientError('Notification API is not configured.'))
    const wrapper = mount(NotificationInstances, { global: { stubs } })
    await flushPromises()
    expect(wrapper.text()).toContain('Notification API is not configured.')
    expect(api.validateInstance).not.toHaveBeenCalled()
    expect(api.createInstance).not.toHaveBeenCalled()
    expect(api.testInstance).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it.each([
    [401, 'Session expired. Sign in again.'],
    [403, 'You do not have permission to manage notification instances.']
  ])('shows the server authorization message for HTTP %s without a mutation', async (_status, message) => {
    api.listPlugins.mockRejectedValueOnce(Object.assign(new Error(message), { httpStatus: _status }))
    const wrapper = mount(NotificationInstances, { global: { stubs } })
    await flushPromises()
    expect(wrapper.text()).toContain(message)
    expect(api.createInstance).not.toHaveBeenCalled()
    expect(api.updateInstance).not.toHaveBeenCalled()
    expect(api.testInstance).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})
