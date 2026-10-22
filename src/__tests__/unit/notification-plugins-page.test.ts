import { defineComponent, h } from 'vue'
import type { VNodeChild } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { webcrypto } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NotificationPlugins from '@/views/apply/plugin/NotificationPlugins.vue'

const { requestMock, authState } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  authState: {
    token: 'platform-session-token',
    userInfo: {
      id: 'sys-user',
      userId: 'sys-user',
      tenant_id: 'platform-tenant',
      authority: 'SYS_ADMIN',
      roles: ['SYS_ADMIN']
    }
  }
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({ request: requestMock })),
    isAxiosError: (error: unknown) => Boolean((error as { isAxiosError?: boolean })?.isAxiosError)
  }
}))
vi.mock('@/store/modules/auth', () => ({ useAuthStore: () => authState }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ locale: { value: 'en-us' } }) }))
vi.mock('naive-ui', async () => {
  const { defineComponent: define, h: createElement } = await import('vue')
  const Slot = defineComponent({
    setup(_, { slots }) {
      return () => createElement('div', slots.default?.())
    }
  })
  const Button = define({
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
  return { NButton: Button, NSpace: Slot, NDrawer: Slot, NDrawerContent: Slot }
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
const InputStub = defineComponent({
  name: 'NInput',
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
const ModalStub = defineComponent({
  name: 'NModal',
  props: ['show'],
  emits: ['update:show', 'after-leave'],
  setup(props, { slots }) {
    return () => (props.show ? h('div', { class: 'qa-modal' }, slots.default?.()) : null)
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
const SlotStub = defineComponent({
  inheritAttrs: true,
  setup(_, { slots }) {
    return () => h('div', slots.default?.())
  }
})
const stubs = {
  NButton: ButtonStub,
  NInput: InputStub,
  NModal: ModalStub,
  NDataTable: DataTableStub,
  NCard: SlotStub,
  NForm: SlotStub,
  NFormItem: SlotStub,
  NAlert: SlotStub,
  NSpace: SlotStub,
  NDivider: SlotStub,
  NPagination: SlotStub,
  NDrawer: SlotStub,
  NDrawerContent: SlotStub
}

const manifestBytes = new TextEncoder().encode(
  JSON.stringify({
    api_version: '1.0',
    plugin_id: 'fixture.smtp',
    name: 'Fixture SMTP',
    plugin_version: '1.0.1',
    channels: ['email'],
    content_modes: ['text'],
    config_schema: { type: 'object', properties: { host: { type: 'string' } }, required: ['host'] },
    recipient_schema: { type: 'object', properties: { email: { type: 'string', format: 'email' } } },
    secret_fields: [],
    capabilities: { delivery_receipts: false }
  })
)

function envelope(data: unknown) {
  return { code: 200, message: 'ok', requestId: 'fixture-request', data }
}

describe('notification plugin registration page', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_NOTIFICATION_API_BASE_URL', 'https://encore.example.test')
    requestMock.mockReset()
    authState.token = 'platform-session-token'
    authState.userInfo.tenant_id = 'platform-tenant'
    vi.stubGlobal('crypto', webcrypto)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        arrayBuffer: async () =>
          manifestBytes.buffer.slice(manifestBytes.byteOffset, manifestBytes.byteOffset + manifestBytes.byteLength)
      })
    )
    ;(globalThis as { React?: unknown }).React = {
      createElement: (type: Parameters<typeof h>[0], props: Parameters<typeof h>[1], ...children: unknown[]) =>
        h(type, props, () => children)
    }
  })

  it('sends only plugin credentials to the manifest origin and registers the exact-byte digest through Encore', async () => {
    requestMock
      .mockResolvedValueOnce({ status: 200, data: envelope({ items: [], page: 1, pageSize: 20, total: 0 }) })
      .mockResolvedValueOnce({ status: 201, data: envelope({ id: 'registration-1', pluginId: 'fixture.smtp' }) })
      .mockResolvedValueOnce({ status: 200, data: envelope({ items: [], page: 1, pageSize: 20, total: 0 }) })
    const wrapper = mount(NotificationPlugins, { global: { stubs } })
    await flushPromises()
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Register notification plugin')!
      .trigger('click')
    await wrapper.findAll('input')[0].setValue('https://plugin.example.test')
    await wrapper.findAll('input')[1].setValue('plugin-fixture-secret')
    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Read and review manifest')!
      .trigger('click')
    await flushPromises()

    const fetchMock = vi.mocked(fetch)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://plugin.example.test/v1/manifest',
      expect.objectContaining({
        method: 'GET',
        headers: { Authorization: 'Bearer plugin-fixture-secret' },
        credentials: 'omit',
        redirect: 'error'
      })
    )
    expect(JSON.stringify(fetchMock.mock.calls[0])).not.toContain('platform-session-token')
    expect(wrapper.text()).toContain('Fixture SMTP')

    await wrapper
      .findAll('button')
      .find(button => button.text() === 'Confirm registration')!
      .trigger('click')
    await flushPromises()

    const digest = new Uint8Array(await webcrypto.subtle.digest('SHA-256', manifestBytes))
    const expectedDigest = `sha256:${Array.from(digest, byte => byte.toString(16).padStart(2, '0')).join('')}`
    const registration = requestMock.mock.calls
      .map(([config]) => config)
      .find(config => config.url === '/api/v2/notification-plugins' && config.method === 'POST')
    expect(registration).toMatchObject({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer platform-session-token' }),
      data: expect.objectContaining({
        pluginId: 'fixture.smtp',
        pluginVersion: '1.0.1',
        origin: 'https://plugin.example.test',
        authSecret: 'plugin-fixture-secret',
        manifestDigest: expectedDigest
      })
    })
    expect(wrapper.text()).toContain(
      'The plugin is registered globally; registration does not grant access to any tenant.'
    )
    wrapper.unmount()
  })
})
