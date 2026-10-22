<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { DataTableColumns } from 'naive-ui'
import { useAuthStore } from '@/store/modules/auth'
import {
  getNotificationUiCapabilities,
  invalidateNotificationSession,
  notificationV2,
  NotificationClientError,
  NotificationSessionChangedError,
  registerNotificationSessionCleanup,
  type NotificationPlugin
} from '@/service/api/notification-v2'

const auth = useAuthStore()
const { locale } = useI18n()
const tx = (zh: string, en: string) => (locale.value.toLowerCase().startsWith('zh') ? zh : en)
const canRead = computed(() => getNotificationUiCapabilities().canRead)
const rows = ref<NotificationPlugin[]>([])
const loading = ref(false)
const errorText = ref('')
let generation = 0

function clearSession() {
  generation += 1
  rows.value = []
  loading.value = false
  errorText.value = ''
}

const unregisterCleanup = registerNotificationSessionCleanup(clearSession)
watch(
  () => [auth.token, auth.userInfo.tenant_id, auth.userInfo.id, auth.userInfo.userId],
  () => invalidateNotificationSession()
)
onBeforeUnmount(unregisterCleanup)

async function load() {
  const current = ++generation
  rows.value = []
  errorText.value = ''
  if (!canRead.value) {
    errorText.value = tx('当前账号无权查看可用通知插件。', 'This account cannot view available notification plugins.')
    return
  }
  loading.value = true
  try {
    const response = await notificationV2.listPlugins()
    if (current === generation) rows.value = response.data.items.filter(plugin => plugin.enabled)
  } catch (error) {
    if (current !== generation || error instanceof NotificationSessionChangedError) return
    if (error instanceof NotificationClientError && error.httpStatus === 401) {
      errorText.value = tx('登录状态已失效，请重新登录。', 'Your session has expired. Sign in again.')
    } else if (error instanceof NotificationClientError && error.httpStatus === 403) {
      errorText.value = tx('当前账号无权查看可用通知插件。', 'This account cannot view available notification plugins.')
    } else {
      errorText.value = tx(
        '暂时无法读取可用通知插件，请稍后重试。',
        'Available notification plugins could not be loaded. Try again later.'
      )
    }
  } finally {
    if (current === generation) loading.value = false
  }
}

const columns = computed<DataTableColumns<NotificationPlugin>>(() => [
  { title: tx('插件名称', 'Plugin'), key: 'name', render: row => row.manifest.name, minWidth: 180 },
  { title: tx('插件 ID', 'Plugin ID'), key: 'pluginId', render: row => row.manifest.pluginId, minWidth: 180 },
  { title: tx('版本', 'Version'), key: 'pluginVersion', minWidth: 100 },
  {
    title: tx('支持的通知类型', 'Supported channels'),
    key: 'channels',
    render: row => row.manifest.channels.join(', '),
    minWidth: 180
  }
])

onMounted(load)
</script>

<template>
  <NCard :bordered="false">
    <NAlert type="info" class="mb-12px">
      {{
        tx(
          '此列表仅显示已向当前租户开放的插件。插件登记与租户授权由平台管理员管理。',
          'This list shows plugins available to the current tenant. Platform administrators manage plugin registration and tenant access.'
        )
      }}
    </NAlert>
    <NAlert v-if="errorText" type="error" class="mb-12px">{{ errorText }}</NAlert>
    <NDataTable :columns="columns" :data="rows" :loading="loading" :row-key="row => row.id" />
    <div v-if="!loading && !errorText && rows.length === 0" class="mt-12px text-secondary">
      {{ tx('当前租户暂无可用通知插件。', 'No notification plugins are currently available to this tenant.') }}
    </div>
    <div class="mt-12px flex justify-end">
      <NButton :loading="loading" @click="load">{{ tx('刷新', 'Refresh') }}</NButton>
    </div>
  </NCard>
</template>
