import { defineComponent, h } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { useNotificationTenants } from '@/views/management/notification/tenant-directory'

const { fetchUsers, cleanups } = vi.hoisted(() => ({ fetchUsers: vi.fn(), cleanups: new Set<() => void>() }))
vi.mock('@/service/api/auth', () => ({ fetchUserList: fetchUsers }))
vi.mock('@/service/api/notification-v2', () => ({
  registerNotificationSessionCleanup: (fn: () => void) => {
    cleanups.add(fn)
    return () => cleanups.delete(fn)
  }
}))
const Harness = defineComponent({
  setup() {
    const directory = useNotificationTenants()
    return () =>
      h('div', [h('button', { onClick: directory.load }, 'Load'), directory.tenants.value.map(t => h('span', t.label))])
  }
})

describe('platform tenant directory', () => {
  it('includes later pages, labels accounts and deduplicates tenant identities', async () => {
    fetchUsers
      .mockReset()
      .mockResolvedValueOnce({ data: { list: [{ tenant_id: 'a', name: 'A', email: 'a@test.cn' }], total: 101 } })
      .mockResolvedValueOnce({
        data: {
          list: [
            { tenant_id: 'a', name: 'A', email: 'a@test.cn' },
            { tenant_id: 'b', name: 'B', email: 'b@test.cn' }
          ],
          total: 101
        }
      })
    const wrapper = mount(Harness)
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(fetchUsers).toHaveBeenLastCalledWith({ page: 2, page_size: 100 })
    expect(wrapper.findAll('span').map(s => s.text())).toEqual(['A (a@test.cn)', 'B (b@test.cn)'])
    wrapper.unmount()
  })
  it('discards a directory response after a login/session change', async () => {
    let finish!: (value: unknown) => void
    fetchUsers.mockReset().mockReturnValue(
      new Promise(resolve => {
        finish = resolve
      })
    )
    const wrapper = mount(Harness)
    await wrapper.get('button').trigger('click')
    cleanups.forEach(fn => fn())
    finish({ data: { list: [{ tenant_id: 'old', name: 'Previous tenant', email: 'old@test.cn' }], total: 1 } })
    await flushPromises()
    expect(wrapper.text()).not.toContain('Previous tenant')
    wrapper.unmount()
  })
})
