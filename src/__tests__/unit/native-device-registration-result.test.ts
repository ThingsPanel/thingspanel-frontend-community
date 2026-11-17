import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { Device } from '@/service/api/device-native'
import MqttLoginFields from '@/views/device/shared/mqtt-login-fields.vue'
import RegistrationResult from '@/views/device/manage/modules/native-device-registration-result.vue'

const api = vi.hoisted(() => ({
  create: vi.fn(),
  list: vi.fn(),
  readConnectionInfo: vi.fn()
}))

vi.mock('naive-ui', () => ({ useMessage: () => ({ success: vi.fn(), warning: vi.fn() }) }))
vi.mock('@/service/api/device-credentials-native', () => ({
  deviceCredentialsNative: api,
  DeviceCredentialNativeError: class extends Error {}
}))
vi.mock('@/service/api/device-runtime-native', () => ({ deviceRuntimeNative: api }))

describe('first MQTT login after device creation', () => {
  it('automatically requests a credential, retries the same request, and shows MQTT login after confirmation', async () => {
    const credential = { id: 'credential-1', kind: 'token', status: 'pending' }
    api.create
      .mockRejectedValueOnce(new TypeError('connection lost'))
      .mockResolvedValueOnce({ credential: { credential, secret: 'test-token' } })
    api.list.mockResolvedValue({ items: [{ ...credential, status: 'active', secret: 'test-token' }] })
    api.readConnectionInfo.mockResolvedValue({ endpoint: 'mqtt://example.test:1883' })

    const wrapper = mount(RegistrationResult, {
      props: {
        device: { id: 'device-1', name: '测试设备', deviceNumber: '101' } as Device,
        credentialKind: 'token',
        onBack: vi.fn(),
        onDetails: vi.fn()
      },
      global: {
        stubs: {
          NCard: { template: '<div><slot /></div>' },
          NAlert: { template: '<div><slot /></div>' },
          NButton: { template: '<button><slot /></button>' },
          NDescriptions: { template: '<div><slot /></div>' },
          NDescriptionsItem: { template: '<div><slot /></div>' }
        }
      }
    })

    try {
      await flushPromises()
      expect(wrapper.text()).toContain('设备只会登记一次')
      const retry = wrapper.findAll('button').find(button => button.text() === '重试生成')
      expect(retry).toBeDefined()
      await retry?.trigger('click')
      await flushPromises()

      expect(api.create.mock.calls).toEqual([
        ['device-1', { kind: 'token' }, 'first-credential-device-1'],
        ['device-1', { kind: 'token' }, 'first-credential-device-1']
      ])
      expect(wrapper.text()).toContain('登录信息已生效')
      expect(wrapper.text()).toContain('mqtt://example.test:1883')
      expect(wrapper.text()).not.toContain('test-token')
      const reveal = wrapper.findAll('button').find(button => button.text() === '显示登录信息')
      expect(reveal).toBeDefined()
      await reveal?.trigger('click')
      expect(wrapper.text()).toContain('test-token')
      expect(wrapper.text()).toContain('留空')
    } finally {
      wrapper.unmount()
    }
  })

  it('keeps the account name visible and masks the password for username/password devices', async () => {
    const wrapper = mount(MqttLoginFields, {
      props: { kind: 'username_password', publicIdentifier: 'device-user', secret: 'test-password' },
      global: { stubs: { NButton: { template: '<button><slot /></button>' } } }
    })
    try {
      expect(wrapper.text()).toContain('device-user')
      expect(wrapper.text()).toContain('复制密码')
      expect(wrapper.text()).not.toContain('test-password')
      const reveal = wrapper.findAll('button').find(button => button.text() === '显示登录信息')
      await reveal?.trigger('click')
      expect(wrapper.text()).toContain('test-password')
      expect(wrapper.text()).not.toContain('留空')
    } finally {
      wrapper.unmount()
    }
  })
})
