import { flushPromises, mount } from '@vue/test-utils'
import naive, { NInputNumber, NSelect, NSwitch } from 'naive-ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Settings from '@/views/device/config-detail/modules/native-template-settings.vue'
import {
  changeTemplateOnlineMode,
  isBuiltinNativeMqttConfiguration,
  nativeMqttPolicyIssue
} from '@/service/api/template-settings-state'

const { getRaw, patchBody } = vi.hoisted(() => ({ getRaw: vi.fn(), patchBody: vi.fn() }))
vi.mock('naive-ui', async original => ({
  ...(await original<typeof import('naive-ui')>()),
  useMessage: () => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn() })
}))
vi.mock('@/service/api/template-native', () => ({ templateNative: { getRaw, patchBody } }))
vi.mock('@/service/api/file-assets-native', () => ({ fileAssetsNative: { get: vi.fn() } }))
vi.mock('@/store/modules/auth', () => ({
  useAuthStore: () => ({ isLogin: true, userInfo: { id: 'qa-user', tenantId: 'qa-tenant', roles: ['TENANT_ADMIN'] } })
}))
vi.mock('vue-router', () => ({ onBeforeRouteLeave: vi.fn(), onBeforeRouteUpdate: vi.fn() }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

function fixture(timeout = 60, autoRegister = false, deviceKind = 'standalone') {
  return {
    id: 'qa-template',
    administrativeState: 'enabled',
    imageAssetId: null,
    configuration: {
      deviceKind,
      access: {
        mode: 'direct',
        protocol: 'mqtt',
        providerId: null,
        serviceInstanceId: null,
        credentialPolicy: { kind: 'none', autoRegister },
        onlinePolicy: { mode: 'transport', timeoutSeconds: timeout }
      },
      topicMappings: [],
      processingScripts: [],
      customFieldDefinitions: []
    }
  }
}
async function page(template = fixture()) {
  getRaw.mockResolvedValue({ template, rawText: JSON.stringify({ data: template }), etag: '"v1"' })
  const wrapper = mount(Settings, { props: { id: 'qa-template' }, global: { plugins: [naive] } })
  await flushPromises()
  return wrapper
}
describe('native MQTT policy UI', () => {
  beforeEach(() => {
    getRaw.mockReset()
    patchBody.mockReset()
  })
  it('disables automatic registration and shows timeout only for timed modes', async () => {
    const wrapper = await page()
    expect(wrapper.findComponent(NSwitch).props('disabled')).toBe(true)
    expect(wrapper.findComponent(NInputNumber).exists()).toBe(false)
    wrapper.findComponent(NSelect).vm.$emit('update:value', 'activity')
    await flushPromises()
    expect(wrapper.findComponent(NInputNumber).exists()).toBe(true)
    wrapper.findComponent(NInputNumber).vm.$emit('update:value', 120)
    wrapper.findComponent(NSelect).vm.$emit('update:value', 'transport')
    await flushPromises()
    expect(wrapper.findComponent(NInputNumber).exists()).toBe(false)
    expect(wrapper.text()).not.toContain('native-mqtt-policy.transportNeedsReset')
    wrapper.unmount()
  })
  it('preserves old unsupported values until explicit correction and save', async () => {
    const wrapper = await page(fixture(90, true))
    expect(wrapper.findComponent(NSwitch).props('value')).toBe(true)
    expect(wrapper.text()).toContain('native-mqtt-policy.transportNeedsReset')
    await wrapper
      .findAll('button')
      .find(b => b.text().includes('保存注册与在线策略'))!
      .trigger('click')
    expect(patchBody).not.toHaveBeenCalled()
    await wrapper
      .findAll('button')
      .find(b => b.text().includes('native-mqtt-policy.disableRegistration'))!
      .trigger('click')
    await wrapper
      .findAll('button')
      .find(b => b.text().includes('native-mqtt-policy.resetTransport'))!
      .trigger('click')
    expect(patchBody).not.toHaveBeenCalled()
    patchBody.mockResolvedValue({ template: fixture(), etag: '"v2"' })
    await wrapper
      .findAll('button')
      .find(b => b.text().includes('保存注册与在线策略'))!
      .trigger('click')
    await flushPromises()
    const body = JSON.parse(patchBody.mock.calls[0][1])
    expect(body.configuration.access.credentialPolicy.autoRegister).toBe(false)
    expect(body.configuration.access.onlinePolicy.timeoutSeconds).toBe(60)
    wrapper.unmount()
  })
  it('does not impose standalone MQTT limitations on gateway or provider access', async () => {
    const wrapper = await page(fixture(90, true, 'gateway'))
    expect(wrapper.findComponent(NSwitch).props('disabled')).toBe(false)
    expect(wrapper.findComponent(NInputNumber).exists()).toBe(true)
    expect(
      isBuiltinNativeMqttConfiguration({
        deviceKind: 'standalone',
        access: { mode: 'direct', protocol: 'mqtt', providerId: 'provider' }
      })
    ).toBe(false)
    expect(
      nativeMqttPolicyIssue({ autoRegister: true, onlineMode: 'transport', onlineTimeoutSeconds: 90 }, false)
    ).toBeUndefined()
    expect(
      changeTemplateOnlineMode(
        { autoRegister: false, onlineMode: 'activity', onlineTimeoutSeconds: 120 },
        'transport',
        false
      ).onlineTimeoutSeconds
    ).toBe(120)
    wrapper.unmount()
  })
})
