<script setup lang="tsx">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton } from 'naive-ui'
import type { DataTableColumns, SelectOption } from 'naive-ui'
import { useAuthStore } from '@/store/modules/auth'
import {
  invalidateNotificationSession,
  notificationV2,
  NotificationSessionChangedError,
  registerNotificationSessionCleanup,
  type NotificationInstance
} from '@/service/api/notification-v2'
import type * as NotificationV2 from '@/service/api/notification-v2.types'
import { describeDeliveryStatus, describeIntakeStatus } from './workflow'

const auth = useAuthStore()
const notificationApiConfigured = Boolean(import.meta.env.VITE_NOTIFICATION_API_BASE_URL)
const { locale } = useI18n()
const isZh = computed(() => locale.value.toLowerCase().startsWith('zh'))
const tx = (zh: string, en: string) => (isZh.value ? zh : en)
const rows = ref<NotificationV2.DeliveryView[]>([])
const requests = ref<NotificationV2.NotificationView[]>([])
const instances = ref<NotificationInstance[]>([])
const total = ref(0)
const requestTotal = ref(0)
const loading = ref(false)
const requestLoading = ref(false)
const errorText = ref('')
const requestError = ref('')
const currentPage = ref(1)
const requestPage = ref(1)
const pageSize = ref(10)
const requestPageSize = ref(10)
const range = ref<[number, number] | null>(null)
const requestRange = ref<[number, number] | null>(null)
const query = reactive({
  instanceId: '',
  sourceId: '',
  dispatchStatus: null as NotificationV2.DispatchStatus | null,
  deliveryStatus: null as NotificationV2.DeliveryStatus | null
})
const requestQuery = reactive({
  sourceType: null as NotificationV2.SourceRef['type'] | null,
  sourceId: '',
  intakeStatus: null as NotificationV2.IntakeStatus | null
})
const listController = ref<AbortController | null>(null)
const requestController = ref<AbortController | null>(null)
const viewGeneration = ref(0)
const requestGeneration = ref(0)
const detailModal = ref(false)
const detailLoading = ref(false)
const detailError = ref('')
const selectedDelivery = ref<NotificationV2.DeliveryView | null>(null)
const selectedNotification = ref<NotificationV2.NotificationView | null>(null)
const detailController = ref<AbortController | null>(null)
const detailGeneration = ref(0)
const pollTimer = ref<ReturnType<typeof setTimeout> | undefined>()

function clearPoll() {
  if (pollTimer.value) clearTimeout(pollTimer.value)
  pollTimer.value = undefined
}

function clearSession() {
  clearPoll()
  listController.value?.abort()
  requestController.value?.abort()
  detailController.value?.abort()
  rows.value = []
  requests.value = []
  instances.value = []
  total.value = 0
  selectedDelivery.value = null
  selectedNotification.value = null
  detailModal.value = false
  errorText.value = ''
  detailError.value = ''
  viewGeneration.value += 1
  requestGeneration.value += 1
  detailGeneration.value += 1
}

const unregisterCleanup = registerNotificationSessionCleanup(clearSession)
watch(
  () => [auth.token, auth.userInfo.tenant_id, auth.userInfo.id, auth.userInfo.userId],
  () => invalidateNotificationSession()
)
onBeforeUnmount(() => {
  unregisterCleanup()
  clearSession()
  document.removeEventListener('visibilitychange', onVisibilityChange)
})

async function loadInstances() {
  try {
    const response = await notificationV2.listInstances({ page: 1, pageSize: 100 })
    instances.value = response.data.items
  } catch {
    instances.value = []
  }
}

async function loadDeliveries() {
  const generation = ++viewGeneration.value
  listController.value?.abort()
  const controller = new AbortController()
  listController.value = controller
  loading.value = true
  errorText.value = ''
  const params: Parameters<typeof notificationV2.listDeliveries>[0] = {
    page: currentPage.value,
    pageSize: pageSize.value
  }
  if (query.instanceId) params.instanceId = query.instanceId
  if (query.sourceId.trim()) params.sourceId = query.sourceId.trim()
  if (query.dispatchStatus) params.dispatchStatus = query.dispatchStatus
  if (query.deliveryStatus) params.deliveryStatus = query.deliveryStatus
  if (range.value) {
    params.from = new Date(range.value[0]).toISOString()
    params.to = new Date(range.value[1]).toISOString()
  }
  try {
    const response = await notificationV2.listDeliveries(params, controller.signal)
    if (generation !== viewGeneration.value) return
    rows.value = response.data.items
    total.value = response.data.total
  } catch (error) {
    if (
      generation !== viewGeneration.value ||
      controller.signal.aborted ||
      error instanceof NotificationSessionChangedError
    )
      return
    const status = (error as { httpStatus?: number }).httpStatus
    errorText.value =
      status === 403
        ? tx('当前账号没有查看通知记录的权限。', 'Your account cannot read notification records.')
        : error instanceof Error
          ? error.message
          : tx('无法读取新投递记录。', 'Could not load new deliveries.')
  } finally {
    if (generation === viewGeneration.value) loading.value = false
  }
}

async function loadRequests() {
  const generation = ++requestGeneration.value
  requestController.value?.abort()
  const controller = new AbortController()
  requestController.value = controller
  requestLoading.value = true
  requestError.value = ''
  const params: NotificationV2.NotificationListQuery = {
    page: requestPage.value,
    pageSize: requestPageSize.value
  }
  if (requestQuery.sourceType) params.sourceType = requestQuery.sourceType
  if (requestQuery.sourceId.trim()) params.sourceId = requestQuery.sourceId.trim()
  if (requestQuery.intakeStatus) params.intakeStatus = requestQuery.intakeStatus
  if (requestRange.value) {
    params.from = new Date(requestRange.value[0]).toISOString()
    params.to = new Date(requestRange.value[1]).toISOString()
  }
  try {
    const response = await notificationV2.listNotifications(params, controller.signal)
    if (generation !== requestGeneration.value) return
    requests.value = response.data.items
    requestTotal.value = response.data.total
  } catch (error) {
    if (
      generation !== requestGeneration.value ||
      controller.signal.aborted ||
      error instanceof NotificationSessionChangedError
    )
      return
    requestError.value =
      error instanceof Error ? error.message : tx('无法读取通知请求。', 'Could not load notification requests.')
  } finally {
    if (generation === requestGeneration.value) requestLoading.value = false
  }
}

function handleRequestSearch() {
  requestPage.value = 1
  loadRequests()
}

function handleRequestReset() {
  requestQuery.sourceType = null
  requestQuery.sourceId = ''
  requestQuery.intakeStatus = null
  requestRange.value = null
  handleRequestSearch()
}

function handleSearch() {
  currentPage.value = 1
  loadDeliveries()
}

function handleReset() {
  query.instanceId = ''
  query.sourceId = ''
  query.dispatchStatus = null
  query.deliveryStatus = null
  range.value = null
  handleSearch()
}

function stopDetail() {
  clearPoll()
  detailController.value?.abort()
  detailGeneration.value += 1
}

function schedulePoll(generation: number) {
  clearPoll()
  if (document.hidden || generation !== detailGeneration.value || !selectedDelivery.value) return
  const status = describeDeliveryStatus(selectedDelivery.value.dispatchStatus, selectedDelivery.value.deliveryStatus)
  if (!status.polling) return
  pollTimer.value = setTimeout(() => void refreshSelectedDelivery(generation), 3000)
}

async function refreshSelectedDelivery(generation = detailGeneration.value) {
  if (!selectedDelivery.value || generation !== detailGeneration.value) return
  detailController.value?.abort()
  const controller = new AbortController()
  detailController.value = controller
  detailLoading.value = true
  detailError.value = ''
  const deliveryId = selectedDelivery.value.deliveryId
  try {
    const deliveryResponse = await notificationV2.getDelivery(deliveryId, controller.signal)
    if (generation !== detailGeneration.value) return
    selectedDelivery.value = deliveryResponse.data
    try {
      const notificationResponse = await notificationV2.getNotification(
        deliveryResponse.data.notificationId,
        controller.signal
      )
      if (generation === detailGeneration.value) selectedNotification.value = notificationResponse.data
    } catch (error) {
      if (controller.signal.aborted || error instanceof NotificationSessionChangedError) return
      selectedNotification.value = null
      detailError.value =
        error instanceof Error ? error.message : tx('请求摘要暂不可用。', 'Notification summary is unavailable.')
    }
  } catch (error) {
    if (
      controller.signal.aborted ||
      generation !== detailGeneration.value ||
      error instanceof NotificationSessionChangedError
    )
      return
    detailError.value =
      error instanceof Error ? error.message : tx('无法读取投递详情。', 'Could not load delivery details.')
  } finally {
    if (generation === detailGeneration.value) {
      detailLoading.value = false
      schedulePoll(generation)
    }
  }
}

function openDelivery(row: NotificationV2.DeliveryView) {
  stopDetail()
  selectedNotification.value = null
  selectedDelivery.value = row
  detailError.value = ''
  detailModal.value = true
  const generation = ++detailGeneration.value
  void refreshSelectedDelivery(generation)
}

function closeDelivery() {
  stopDetail()
  detailModal.value = false
  selectedDelivery.value = null
  selectedNotification.value = null
}

function onVisibilityChange() {
  if (document.hidden) clearPoll()
  else if (detailModal.value) schedulePoll(detailGeneration.value)
}

function openNotification(row: NotificationV2.NotificationView) {
  stopDetail()
  selectedDelivery.value = null
  selectedNotification.value = row
  detailLoading.value = false
  detailError.value = ''
  detailModal.value = true
}

const instanceOptions = computed(() =>
  instances.value.map(instance => ({ label: `${instance.name} · ${instance.channel}`, value: instance.id }))
)
const dispatchOptions = ['queued', 'sending', 'accepted', 'failed', 'unknown'].map(value => ({ label: value, value }))
const deliveryOptions = ['unsupported', 'pending', 'delivered', 'failed', 'unknown'].map(value => ({
  label: value,
  value
}))
const statusLabel = (row: NotificationV2.DeliveryView) => describeDeliveryStatus(row.dispatchStatus, row.deliveryStatus)
const dateText = (value: string) => new Date(value).toLocaleString()
const sourceOptions: SelectOption[] = ['alarm', 'automation', 'manual', 'test'].map(value => ({ label: value, value }))
const intakeOptions = ['ready', 'blocked'].map(value => ({ label: value, value }))
const intakeLabel = (row: NotificationV2.NotificationView) => describeIntakeStatus(row.intakeStatus)
const requestColumns: DataTableColumns<NotificationV2.NotificationView> = [
  { title: tx('接收时间', 'Received'), key: 'createdAt', minWidth: 170, render: row => dateText(row.createdAt) },
  {
    title: tx('业务来源', 'Source'),
    key: 'source',
    minWidth: 180,
    render: row => `${row.source.type} · ${row.source.id}`
  },
  {
    title: tx('入口状态', 'Intake status'),
    key: 'intakeStatus',
    minWidth: 220,
    render: row => (isZh.value ? intakeLabel(row).zh : intakeLabel(row).en)
  },
  { title: tx('投递数', 'Deliveries'), key: 'deliveries', width: 110, render: row => row.deliveries.length },
  {
    title: tx('详情', 'Details'),
    key: 'details',
    width: 100,
    render: row => (
      <NButton text type="primary" onClick={() => openNotification(row)}>
        {tx('查看', 'View')}
      </NButton>
    )
  }
]
const columns: DataTableColumns<NotificationV2.DeliveryView> = [
  { title: tx('时间', 'Created'), key: 'createdAt', minWidth: 170, render: row => dateText(row.createdAt) },
  {
    title: tx('业务来源', 'Source'),
    key: 'source',
    minWidth: 150,
    render: row => `${row.source.type} · ${row.source.id}`
  },
  { title: tx('实例', 'Instance'), key: 'instanceId', minWidth: 180, ellipsis: { tooltip: true } },
  {
    title: tx('脱敏目标', 'Masked recipient'),
    key: 'recipient',
    minWidth: 160,
    render: row => row.recipient.display || '—'
  },
  { title: tx('提交状态', 'Dispatch'), key: 'dispatchStatus', minWidth: 140, render: row => row.dispatchStatus },
  {
    title: tx('送达状态', 'Delivery'),
    key: 'deliveryStatus',
    minWidth: 180,
    render: row => (statusLabel(row).zh && isZh.value ? statusLabel(row).zh : statusLabel(row).en)
  },
  { title: tx('尝试次数', 'Attempts'), key: 'attemptCount', width: 100 },
  {
    title: tx('详情', 'Details'),
    key: 'details',
    width: 100,
    render: row => (
      <NButton text type="primary" onClick={() => openDelivery(row)}>
        {tx('查看', 'View')}
      </NButton>
    )
  }
]

onMounted(() => {
  document.addEventListener('visibilitychange', onVisibilityChange)
  void loadInstances()
  void loadRequests()
  void loadDeliveries()
})
</script>

<template>
  <NCard>
    <div class="flex flex-wrap items-center justify-between gap-12px mb-12px">
      <div>
        <div class="text-lg font-600">{{ tx('新通知投递', 'New notification deliveries') }}</div>
        <div class="text-sm opacity-70">
          {{
            tx(
              '按稳定 deliveryId 分页；新投递与旧历史分开查询。',
              'Paged by stable deliveryId; new deliveries and old history stay separate.'
            )
          }}
        </div>
      </div>
      <NButton :loading="loading" @click="loadDeliveries">{{ tx('刷新', 'Refresh') }}</NButton>
    </div>
    <NDivider>{{ tx('通知请求', 'Notification requests') }}</NDivider>
    <div class="grid grid-cols-1 gap-12px lg:grid-cols-4 mb-12px">
      <NFormItem :label="tx('来源类型', 'Source type')">
        <NSelect v-model:value="requestQuery.sourceType" :options="sourceOptions" clearable />
      </NFormItem>
      <NFormItem :label="tx('来源 ID', 'Source ID')">
        <NInput v-model:value="requestQuery.sourceId" clearable />
      </NFormItem>
      <NFormItem :label="tx('入口状态', 'Intake status')">
        <NSelect v-model:value="requestQuery.intakeStatus" :options="intakeOptions" clearable />
      </NFormItem>
      <NFormItem :label="tx('请求时间范围', 'Request time range')">
        <NDatePicker v-model:value="requestRange" type="datetimerange" clearable class="w-full" />
      </NFormItem>
      <div class="flex items-center gap-8px">
        <NButton type="primary" @click="handleRequestSearch">{{ tx('筛选请求', 'Filter requests') }}</NButton>
        <NButton @click="handleRequestReset">{{ tx('重置', 'Reset') }}</NButton>
        <NButton :loading="requestLoading" @click="loadRequests">{{ tx('刷新', 'Refresh') }}</NButton>
      </div>
    </div>
    <NAlert v-if="requestError" type="error" class="mb-12px">{{ requestError }}</NAlert>
    <NDataTable
      :columns="requestColumns"
      :data="requests"
      :loading="requestLoading"
      :row-key="row => row.id"
      :scroll-x="900"
      :remote="true"
    />
    <div class="flex justify-end mt-12px">
      <NPagination
        v-model:page="requestPage"
        :page-size="requestPageSize"
        :item-count="requestTotal"
        @update:page="loadRequests"
      />
    </div>
    <NDivider>{{ tx('投递明细', 'Delivery records') }}</NDivider>
    <div class="grid grid-cols-1 gap-12px lg:grid-cols-3 mb-12px">
      <NFormItem :label="tx('实例', 'Instance')">
        <NSelect v-model:value="query.instanceId" :options="instanceOptions" clearable filterable />
      </NFormItem>
      <NFormItem :label="tx('来源 ID', 'Source ID')"><NInput v-model:value="query.sourceId" clearable /></NFormItem>
      <NFormItem :label="tx('提交状态', 'Dispatch status')">
        <NSelect v-model:value="query.dispatchStatus" :options="dispatchOptions" clearable />
      </NFormItem>
      <NFormItem :label="tx('送达状态', 'Delivery status')">
        <NSelect v-model:value="query.deliveryStatus" :options="deliveryOptions" clearable />
      </NFormItem>
      <NFormItem :label="tx('时间范围', 'Time range')">
        <NDatePicker v-model:value="range" type="datetimerange" clearable class="w-full" />
      </NFormItem>
      <div class="flex items-center gap-8px">
        <NButton type="primary" @click="handleSearch">{{ tx('筛选', 'Filter') }}</NButton>
        <NButton @click="handleReset">{{ tx('重置', 'Reset') }}</NButton>
      </div>
    </div>
    <NAlert v-if="errorText" type="error" class="mb-12px">{{ errorText }}</NAlert>
    <NAlert v-if="!notificationApiConfigured" type="info" class="mb-12px">
      {{
        tx(
          '通知服务未启用；旧历史记录仍可在旧历史页查看。',
          'Notification service is not enabled; legacy history remains available in its tab.'
        )
      }}
    </NAlert>
    <NDataTable
      :columns="columns"
      :data="rows"
      :loading="loading"
      :row-key="row => row.deliveryId"
      :scroll-x="1200"
      :remote="true"
    />
    <div class="flex justify-end mt-12px">
      <NPagination v-model:page="currentPage" :page-size="pageSize" :item-count="total" @update:page="loadDeliveries" />
    </div>

    <NModal
      v-model:show="detailModal"
      preset="card"
      :title="
        selectedDelivery ? tx('投递详情', 'Delivery details') : tx('通知请求详情', 'Notification request details')
      "
      :style="{ width: 'min(880px, calc(100vw - 24px))' }"
      :mask-closable="false"
      @after-leave="closeDelivery"
    >
      <div class="flex justify-end mb-8px">
        <NButton v-if="selectedDelivery" :loading="detailLoading" @click="refreshSelectedDelivery()">
          {{ tx('手动刷新', 'Refresh now') }}
        </NButton>
      </div>
      <NSpin :show="detailLoading">
        <NAlert v-if="detailError" type="warning" class="mb-8px">{{ detailError }}</NAlert>
        <NAlert
          v-if="selectedDelivery"
          :type="
            selectedDelivery.dispatchStatus === 'failed' || selectedDelivery.dispatchStatus === 'unknown'
              ? 'warning'
              : 'info'
          "
          class="mb-8px"
        >
          {{ isZh ? statusLabel(selectedDelivery).zh : statusLabel(selectedDelivery).en }}
        </NAlert>
        <dl v-if="selectedDelivery" class="grid grid-cols-1 gap-8px sm:grid-cols-2 break-all text-sm">
          <dt>notificationId</dt>
          <dd>{{ selectedDelivery.notificationId }}</dd>
          <dt>deliveryId</dt>
          <dd>{{ selectedDelivery.deliveryId }}</dd>
          <dt>source</dt>
          <dd>{{ selectedDelivery.source.type }} · {{ selectedDelivery.source.id }}</dd>
          <dt>instanceId</dt>
          <dd>{{ selectedDelivery.instanceId }}</dd>
          <dt>configVersion</dt>
          <dd>{{ selectedDelivery.configVersion }}</dd>
          <dt>{{ tx('尝试次数', 'Attempt count') }}</dt>
          <dd>{{ selectedDelivery.attemptCount }}</dd>
          <dt>{{ tx('脱敏目标', 'Masked recipient') }}</dt>
          <dd>{{ selectedDelivery.recipient.display }}</dd>
          <template v-if="selectedDelivery.error">
            <dt>{{ tx('安全错误代码', 'Safe error code') }}</dt>
            <dd>{{ selectedDelivery.error.code }}</dd>
            <dt>{{ tx('错误说明', 'Error reason') }}</dt>
            <dd class="whitespace-pre-wrap">{{ selectedDelivery.error.reason || selectedDelivery.error.message }}</dd>
          </template>
        </dl>
        <div v-if="selectedNotification" class="mt-12px text-xs opacity-70">
          {{ tx('请求 ID', 'Request ID') }}: {{ selectedNotification.id }} ·
          {{ tx('请求接收时间', 'Request received') }}: {{ dateText(selectedNotification.createdAt) }} ·
          {{ tx('入口状态', 'Intake') }}: {{ selectedNotification.intakeStatus }}
        </div>
        <NAlert v-if="selectedNotification?.intakeStatus === 'blocked'" type="warning" class="mt-8px">
          {{
            isZh
              ? describeIntakeStatus(selectedNotification.intakeStatus, selectedNotification.blockedReason).zh
              : describeIntakeStatus(selectedNotification.intakeStatus, selectedNotification.blockedReason).en
          }}: {{ selectedNotification.blockedReason || tx('未提供具体原因', 'No reason provided') }}
        </NAlert>
        <div v-if="selectedNotification?.deliveries.length" class="mt-12px">
          <div class="font-600 mb-8px">{{ tx('请求投递摘要', 'Request delivery summary') }}</div>
          <ul class="pl-20px list-disc text-sm">
            <li v-for="delivery in selectedNotification.deliveries" :key="delivery.deliveryId" class="break-all">
              {{ delivery.deliveryId }} · {{ delivery.dispatchStatus }} ·
              {{
                isZh
                  ? describeDeliveryStatus(delivery.dispatchStatus, delivery.deliveryStatus).zh
                  : describeDeliveryStatus(delivery.dispatchStatus, delivery.deliveryStatus).en
              }}
            </li>
          </ul>
        </div>
        <div class="mt-12px text-xs opacity-60">
          {{
            tx('系统不会在未知结果下提供一键重发。', 'No one-click resend is available when the outcome is unknown.')
          }}
        </div>
      </NSpin>
    </NModal>
  </NCard>
</template>
