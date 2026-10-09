<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { fetchUserList } from '@/service/api/auth'
import NotificationInstances from './NotificationInstances.vue'

const { locale } = useI18n()
const tx = (zh: string, en: string) => (locale.value.toLowerCase().startsWith('zh') ? zh : en)
const selectedTenant = ref<string | null>(null)
const tenantOptions = ref<{ label: string; value: string }[]>([])
const loading = ref(false)
const errorText = ref('')
let generation = 0

async function loadTenants(search = '') {
  const requestGeneration = ++generation
  loading.value = true
  errorText.value = ''
  try {
    const { data } = await fetchUserList({ page: 1, page_size: 100, name: search.trim() || undefined })
    if (requestGeneration !== generation) return
    if (!data || !Array.isArray(data.list)) throw new Error('Invalid tenant list response.')
    tenantOptions.value = data.list.flatMap(user => {
      if (typeof user.tenant_id !== 'string' || !user.tenant_id.trim()) return []
      return [
        { value: user.tenant_id, label: user.name?.trim() || `${tx('租户', 'Tenant')} ${user.tenant_id.slice(0, 8)}` }
      ]
    })
  } catch {
    if (requestGeneration === generation)
      errorText.value = tx('无法读取租户列表，请重试。', 'Could not load the tenant list. Try again.')
  } finally {
    if (requestGeneration === generation) loading.value = false
  }
}

onMounted(() => loadTenants())
onBeforeUnmount(() => {
  generation += 1
})
</script>

<template>
  <div>
    <NAlert type="info" class="mb-12px">
      {{
        tx(
          '服务账号与密钥由超管维护。先选租户，再配置该租户可用的通知服务；租户只选择和使用。',
          'The system administrator maintains service accounts and credentials. Select a tenant to configure its available services; tenants can select and use them.'
        )
      }}
    </NAlert>
    <div class="mb-12px flex items-center gap-12px">
      <label for="notification-account-tenant">{{ tx('目标租户', 'Target tenant') }}</label>
      <NSelect
        v-model:value="selectedTenant"
        class="max-w-480px flex-1"
        filterable
        remote
        clearable
        :loading="loading"
        :options="tenantOptions"
        :placeholder="tx('选择或搜索租户', 'Select or search a tenant')"
        :input-props="{ id: 'notification-account-tenant', 'aria-label': tx('目标租户', 'Target tenant') }"
        @search="loadTenants"
      />
      <NButton @click="loadTenants()">{{ tx('刷新租户', 'Refresh tenants') }}</NButton>
    </div>
    <NAlert v-if="errorText" type="error" class="mb-12px">{{ errorText }}</NAlert>
    <NotificationInstances :target-tenant-id="selectedTenant || undefined" />
  </div>
</template>
