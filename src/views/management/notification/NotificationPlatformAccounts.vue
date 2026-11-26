<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import NotificationPlugins from '@/views/apply/plugin/NotificationPlugins.vue'
import NotificationInstances from './NotificationInstances.vue'
import { useNotificationTenants } from './tenant-directory'
import { registerNotificationSessionCleanup } from '@/service/api/notification-v2'

const props = defineProps<{ initialTenantId?: string }>()
const { locale } = useI18n()
const tx = (zh: string, en: string) => (locale.value.toLowerCase().startsWith('zh') ? zh : en)
const selectedTenant = ref<string | null>(props.initialTenantId || null)
const { tenants: tenantOptions, loading, failed, load: loadTenants } = useNotificationTenants()
watch(
  () => props.initialTenantId,
  value => {
    selectedTenant.value = value || null
  }
)
const unregister = registerNotificationSessionCleanup(() => {
  selectedTenant.value = null
})
onBeforeUnmount(unregister)
onMounted(loadTenants)
</script>

<template>
  <div>
    <NotificationPlugins v-if="!selectedTenant" channel-overview @configure-tenant="selectedTenant = $event" />
    <div class="my-16px flex flex-wrap items-center gap-12px">
      <label for="notification-account-tenant">{{ tx('租户渠道', 'Tenant channels') }}</label>
      <NSelect
        v-model:value="selectedTenant"
        class="max-w-480px flex-1"
        filterable
        clearable
        :loading="loading"
        :options="tenantOptions"
        :placeholder="tx('选择或搜索租户', 'Select or search a tenant')"
        :input-props="{ id: 'notification-account-tenant', 'aria-label': tx('租户渠道', 'Tenant channels') }"
      />
      <NButton @click="loadTenants()">{{ tx('刷新租户', 'Refresh tenants') }}</NButton>
    </div>
    <NAlert v-if="failed" type="error" class="mb-12px">
      {{ tx('租户列表加载失败，请重试。', 'Could not load tenants. Please retry.') }}
    </NAlert>
    <NotificationInstances v-if="selectedTenant" :target-tenant-id="selectedTenant || undefined" />
  </div>
</template>
