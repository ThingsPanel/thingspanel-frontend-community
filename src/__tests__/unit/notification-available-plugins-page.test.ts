import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NotificationAvailablePlugins from '@/views/alarm/notification-group/NotificationAvailablePlugins.vue'

const { api, authState } = vi.hoisted(() => ({
  api: { listPlugins: vi.fn() },
  authState: {
    token: 'tenant-session',
    userInfo: {
      id: 'tenant-user',
      userId: 'tenant-user',
      tenant_id: 'tenant-a',
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
  return { useAuthStore: () => reactive(authState) }
})
vi.mock('vue-i18n', () => ({ useI18n: () => ({ locale: { value: 'en-us' } }) }))

const CardStub = defineComponent({
  setup(_, { slots }) {
    return () => h('section', slots.default?.())
  }
})
const AlertStub = defineComponent({
  setup(_, { slots }) {
    return () => h('div', { role: 'alert' }, slots.default?.())
  }
})
const TableStub = defineComponent({
  props: ['columns', 'data'],
  setup(props) {
    return () =>
      h(
        'div',
        (props.data as Array<Record<string, any>>).map(row =>
          h(
            'div',
            (props.columns as Array<{ key: string; render?: object }>).map(column => {
              const value =
                typeof column.render === 'function'
                  ? Reflect.apply(column.render, undefined, [row])
                  : (row[column.key] ?? '')
              return String(value)
            })
          )
        )
      )
  }
})
const ButtonStub = defineComponent({
  emits: ['click'],
  setup(_, { slots, emit }) {
    return () => h('button', { onClick: () => emit('click') }, slots.default?.())
  }
})

describe('tenant available notification plugins page', () => {
  beforeEach(() => {
    api.listPlugins.mockReset().mockResolvedValue({
      data: {
        items: [
          {
            id: 'enabled-plugin',
            pluginId: 'fixture.enabled',
            pluginVersion: '1.0.0',
            origin: 'https://private.example.test',
            manifestDigest: 'private-digest',
            manifest: {
              pluginId: 'fixture.enabled',
              name: 'Enabled plugin',
              pluginVersion: '1.0.0',
              channels: ['email'],
              contentModes: ['text'],
              configSchema: { properties: { password: { type: 'string' } } },
              recipientSchema: {},
              secretFields: ['password'],
              capabilities: { deliveryReceipts: false }
            },
            enabled: true,
            health: 'unknown'
          },
          {
            id: 'revoked-plugin',
            pluginId: 'fixture.revoked',
            pluginVersion: '1.0.0',
            origin: 'https://private.example.test',
            manifestDigest: 'private-digest',
            manifest: {
              pluginId: 'fixture.revoked',
              name: 'Revoked plugin',
              pluginVersion: '1.0.0',
              channels: ['sms'],
              contentModes: ['text'],
              configSchema: {},
              recipientSchema: {},
              secretFields: [],
              capabilities: { deliveryReceipts: false }
            },
            enabled: false,
            health: 'unknown'
          }
        ]
      }
    })
  })

  it('shows only enabled tenant plugins and exposes no registration or grant controls', async () => {
    const wrapper = mount(NotificationAvailablePlugins, {
      global: { stubs: { NCard: CardStub, NAlert: AlertStub, NDataTable: TableStub, NButton: ButtonStub } }
    })
    await flushPromises()

    expect(api.listPlugins).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('Enabled plugin')
    expect(wrapper.text()).toContain('fixture.enabled')
    expect(wrapper.text()).not.toContain('Revoked plugin')
    expect(wrapper.text()).not.toContain('private.example.test')
    expect(wrapper.text()).not.toContain('private-digest')
    expect(wrapper.text()).not.toContain('password')
    expect(wrapper.text()).not.toContain('Register')
    expect(wrapper.text()).not.toContain('Tenant grants')
  })
})
