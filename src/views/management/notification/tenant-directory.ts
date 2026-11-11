import { computed, onBeforeUnmount, ref } from 'vue'
import { fetchUserList } from '@/service/api/auth'
import { registerNotificationSessionCleanup } from '@/service/api/notification-v2'

export interface NotificationTenant {
  value: string
  label: string
  name: string
  account: string
  disabled: boolean
}

// The platform /user endpoint returns tenant administrators. Read every page so
// existing grants and tenants beyond the first 100 are also selectable by name.
export function useNotificationTenants() {
  const tenants = ref<NotificationTenant[]>([])
  const loading = ref(false)
  const failed = ref(false)
  let generation = 0
  function clear() {
    generation++
    tenants.value = []
    loading.value = false
    failed.value = false
  }
  const unregister = registerNotificationSessionCleanup(clear)
  onBeforeUnmount(() => {
    clear()
    unregister()
  })

  async function load() {
    const current = ++generation
    loading.value = true
    failed.value = false
    const found = new Map<string, NotificationTenant>()
    try {
      for (let page = 1; ; page++) {
        const { data } = await fetchUserList({ page, page_size: 100 })
        if (current !== generation) return
        if (!data || !Array.isArray(data.list) || !Number.isFinite(data.total))
          throw new Error('Invalid tenant directory')
        for (const user of data.list) {
          if (!('tenant_id' in user) || typeof user.tenant_id !== 'string' || !user.tenant_id.trim()) continue
          const name = user.name?.trim() || ''
          const account = user.email?.trim() || ''
          found.set(user.tenant_id, {
            value: user.tenant_id,
            name,
            account,
            label: name && account && name !== account ? `${name} (${account})` : name || account || user.tenant_id,
            disabled: user.status === 'F'
          })
        }
        if (page * 100 >= data.total) break
        if (!data.list.length) throw new Error('Incomplete tenant directory')
      }
      tenants.value = [...found.values()]
    } catch {
      if (current === generation) {
        tenants.value = []
        failed.value = true
      }
    } finally {
      if (current === generation) loading.value = false
    }
  }
  const byId = computed(() => new Map(tenants.value.map(tenant => [tenant.value, tenant])))
  return { tenants, byId, loading, failed, load }
}
