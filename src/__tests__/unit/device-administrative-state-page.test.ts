import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import naive from 'naive-ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import StatePanel from '@/views/device/details/modules/native-device-administrative-state.vue'

const { lifecycle, auth } = vi.hoisted(() => ({
  lifecycle: { readAdministrativeState: vi.fn(), setAdministrativeState: vi.fn(), getOperation: vi.fn() },
  auth: { userInfo: { id: 'tenant-admin', roles: ['TENANT_ADMIN'] } }
}))
vi.mock('@/service/api/device-lifecycle-native', () => ({ deviceLifecycleNative: lifecycle }))
vi.mock('@/store/modules/auth', () => ({ useAuthStore: () => auth }))
const wrappers: VueWrapper[] = []
async function panel(props: { id: string; readonly?: boolean } = { id: 'device-a' }) {
  const wrapper = mount(StatePanel, { props, global: { plugins: [naive] } })
  wrappers.push(wrapper)
  await flushPromises()
  return wrapper
}
function enable(w: VueWrapper) {
  return w.findAll('button').find(b => b.text() === '启用设备')!
}

beforeEach(() => {
  vi.useFakeTimers()
  sessionStorage.clear()
  Object.values(lifecycle).forEach(fn => fn.mockReset())
  auth.userInfo.roles = ['TENANT_ADMIN']
  lifecycle.readAdministrativeState.mockResolvedValue({ state: { state: 'disabled' }, etag: '"state-a"' })
  lifecycle.setAdministrativeState.mockResolvedValue({ operation: { id: 'op-a', state: 'pending' } })
  lifecycle.getOperation.mockResolvedValue({ id: 'op-a', state: 'pending' })
})
afterEach(() => {
  wrappers.splice(0).forEach(w => w.unmount())
  vi.useRealTimers()
})

describe('native administrative state', () => {
  it('does not report accepted or pending operations as applied, then follows the actual succeeded receipt', async () => {
    const w = await panel()
    await enable(w).trigger('click')
    await flushPromises()
    expect(w.text()).toContain('正在应用')
    expect(w.text()).not.toContain('已生效')
    expect(lifecycle.setAdministrativeState).toHaveBeenCalledWith(
      'device-a',
      { state: 'enabled' },
      '"state-a"',
      expect.any(String)
    )
    expect(enable(w).attributes('disabled')).toBeDefined()
    lifecycle.getOperation.mockResolvedValue({ id: 'op-a', state: 'succeeded' })
    lifecycle.readAdministrativeState.mockResolvedValue({ state: { state: 'enabled' }, etag: '"state-b"' })
    await vi.advanceTimersByTimeAsync(2000)
    await flushPromises()
    expect(w.text()).toContain('已生效')
    expect(w.emitted('change')).toHaveLength(1)
    expect(sessionStorage.getItem('device-state-operation:tenant-admin:device-a')).toBeNull()
  })
  it('does not offer writes for retained read-only access or a reader role', async () => {
    const w = await panel({ id: 'device-a', readonly: true })
    expect(enable(w)).toBeUndefined()
    auth.userInfo.roles = ['TENANT_USER']
    const reader = await panel()
    expect(enable(reader)).toBeUndefined()
    expect(lifecycle.setAdministrativeState).not.toHaveBeenCalled()
  })
  it('clears the previous device ETag before a failed new-device read', async () => {
    const w = await panel()
    expect(enable(w).attributes('disabled')).toBeUndefined()
    lifecycle.readAdministrativeState.mockRejectedValue(new Error('device-b unavailable'))
    await w.setProps({ id: 'device-b' })
    await flushPromises()
    expect(w.text()).toContain('device-b unavailable')
    expect(enable(w).attributes('disabled')).toBeDefined()
    expect(lifecycle.setAdministrativeState).not.toHaveBeenCalled()
  })
  it('replays the exact body, ETag and key after a network-unknown outcome', async () => {
    lifecycle.setAdministrativeState.mockRejectedValueOnce(new TypeError('network down'))
    const w = await panel()
    await enable(w).trigger('click')
    await flushPromises()
    expect(w.text()).toContain('请求结果未知')
    await w
      .findAll('button')
      .find(b => b.text() === '重试原请求')!
      .trigger('click')
    await flushPromises()
    expect(lifecycle.setAdministrativeState).toHaveBeenCalledTimes(2)
    expect(lifecycle.setAdministrativeState.mock.calls[1]).toEqual(lifecycle.setAdministrativeState.mock.calls[0])
    expect(w.text()).not.toContain('已生效')
  })
})
