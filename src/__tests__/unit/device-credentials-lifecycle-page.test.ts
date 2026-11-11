import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import naive from 'naive-ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NativeDeviceCredentials from '@/views/device/details/modules/native-device-credentials.vue'

const deviceId = '7c1bdb51-842a-4baa-8f58-4cb27f7132fd'
const activeId = '11111111-1111-1111-1111-111111111111'
const pendingId = '22222222-2222-2222-2222-222222222222'
const { credentials, devices, runtime, toast } = vi.hoisted(() => ({
  credentials: { list: vi.fn(), create: vi.fn(), revoke: vi.fn(), rotate: vi.fn() },
  devices: { get: vi.fn() },
  runtime: { readConnectionInfo: vi.fn() },
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() }
}))

vi.mock('@/service/api/device-credentials-native', () => ({
  deviceCredentialsNative: credentials,
  DeviceCredentialNativeError: class extends Error {}
}))
vi.mock('@/service/api/device-native', () => ({ deviceNative: devices }))
vi.mock('@/service/api/device-runtime-native', () => ({ deviceRuntimeNative: runtime }))
vi.mock('@/store/modules/auth', async () => {
  const { reactive } = await import('vue')
  return { useAuthStore: () => reactive({ token: 'session', userInfo: { id: 'u1', tenant_id: 't1' } }) }
})
vi.mock('vue-router', () => ({ onBeforeRouteLeave: vi.fn(), onBeforeRouteUpdate: vi.fn() }))
vi.mock('naive-ui', async importOriginal => {
  const original = await importOriginal<typeof import('naive-ui')>()
  return { ...original, useMessage: () => toast }
})

// A popconfirm that confirms on trigger click, so the confirmed flow runs without a popover.
const Popconfirm = defineComponent({
  props: { onPositiveClick: { type: Function, default: undefined } },
  setup(props, { slots }) {
    return () =>
      h('span', { onClick: () => (props.onPositiveClick as (() => void) | undefined)?.() }, slots.trigger?.())
  }
})

function summary(id: string, status: string, extra: Record<string, unknown> = {}) {
  return {
    id,
    deviceId,
    kind: 'token',
    status,
    publicIdentifier: null,
    fingerprint: 'a'.repeat(64),
    createdAt: '2026-10-29T01:00:00Z',
    revokedAt: null,
    ...extra
  }
}

const accepted = { operationId: '9b1b3c0e-5f5d-4d0f-9d0e-0c1b6f3a1e11', state: 'pending' }

async function mountPage() {
  const wrapper = mount(NativeDeviceCredentials, {
    props: { id: deviceId },
    global: {
      plugins: [
        naive,
        {
          install: (app: any) => {
            app.component('NPopconfirm', Popconfirm)
            app.component('n-popconfirm', Popconfirm)
          }
        }
      ]
    },
    attachTo: document.body
  })
  await flushPromises()
  return wrapper
}

const buttons = (wrapper: Awaited<ReturnType<typeof mountPage>>, label: string) =>
  wrapper.findAll('button').filter(button => button.text() === label)

describe('device credentials page: rotation, revocation and connection info', () => {
  beforeEach(() => {
    Object.values(credentials).forEach(fn => fn.mockReset())
    Object.values(toast).forEach(fn => fn.mockReset())
    devices.get.mockReset().mockResolvedValue({ device: { resourceVersion: 5 }, etag: '"sha256-x"' })
    runtime.readConnectionInfo.mockReset().mockResolvedValue({
      deviceId,
      protocol: 'mqtt',
      endpoint: null,
      clientIdentifier: null,
      gatewayId: null,
      observedAt: null
    })
    credentials.list.mockResolvedValue({
      items: [
        summary(activeId, 'active'),
        summary(pendingId, 'pending'),
        summary('33333333-3333-3333-3333-333333333333', 'revoked')
      ],
      page: 1,
      pageSize: 20,
      total: 3
    })
  })

  it('shows redacted connection info and offers revoke only for credentials that are not revoked', async () => {
    const wrapper = await mountPage()
    const text = wrapper.text()
    expect(text).toContain('mqtt')
    expect(text).toContain('未配置（由部署方提供）')
    expect(buttons(wrapper, '撤销')).toHaveLength(2)
    expect(buttons(wrapper, '轮换')).toHaveLength(1)
  })

  it('revokes with the freshly read device version and a key, then reloads the list', async () => {
    credentials.revoke.mockResolvedValue(accepted)
    const wrapper = await mountPage()
    await buttons(wrapper, '撤销')[0].element.parentElement!.click()
    await flushPromises()
    expect(devices.get).toHaveBeenCalledWith(deviceId)
    expect(credentials.revoke).toHaveBeenCalledTimes(1)
    const [id, credentialId, body, key] = credentials.revoke.mock.calls[0]
    expect([id, credentialId]).toEqual([deviceId, activeId])
    expect(body.expectedDeviceVersion).toBe(5)
    expect(body.reason).toBeTruthy()
    expect(key).toMatch(/^[A-Za-z0-9._:-]{8,128}$/)
    expect(toast.success).toHaveBeenCalled()
    expect(credentials.list.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('rotates the active credential onto the pending one', async () => {
    credentials.rotate.mockResolvedValue(accepted)
    const wrapper = await mountPage()
    await buttons(wrapper, '轮换')[0].element.parentElement!.click()
    await flushPromises()
    const [, credentialId, body] = credentials.rotate.mock.calls[0]
    expect(credentialId).toBe(activeId)
    expect(body).toEqual({ replacementCredentialId: pendingId, overlapSeconds: 0, expectedDeviceVersion: 5 })
  })

  it('reuses the key when the revoke outcome is unknown and takes a new key after a definite refusal', async () => {
    credentials.revoke
      .mockRejectedValueOnce(new TypeError('network down'))
      .mockRejectedValueOnce(Object.assign(new Error('stale'), { status: 412 }))
      .mockResolvedValue(accepted)
    const wrapper = await mountPage()
    for (let i = 0; i < 3; i++) {
      await buttons(wrapper, '撤销')[0].element.parentElement!.click()
      await flushPromises()
    }
    const keys = credentials.revoke.mock.calls.map(call => call[3])
    expect(keys[1]).toBe(keys[0])
    expect(keys[2]).not.toBe(keys[1])
    expect(toast.error).toHaveBeenCalled()
  })

  it('shows a warning instead of connection info when the server cannot provide it', async () => {
    runtime.readConnectionInfo.mockRejectedValue(new Error('device access is not configured'))
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('该设备尚未配置接入信息')
    expect(wrapper.text()).not.toContain('device access is not configured')
  })

  it('keeps other connection-info errors as the server wrote them', async () => {
    runtime.readConnectionInfo.mockRejectedValue(new Error('runtime unavailable'))
    const wrapper = await mountPage()
    expect(wrapper.text()).toContain('runtime unavailable')
  })
})
