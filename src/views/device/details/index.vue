<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  getCurrentInstance,
  markRaw,
  nextTick,
  onBeforeMount,
  reactive,
  ref,
  watch
} from 'vue'
import { useRoute } from 'vue-router'
import { useLoading } from '@sa/hooks'
import { useWebSocket } from '@vueuse/core'
import { $t } from '@/locales'
import { deviceDetail, deviceUpdate } from '@/service/api/device'
import { localStg } from '@/utils/storage'
import { useRouterPush } from '@/hooks/common/router'
import { getWebsocketServerUrl } from '@/utils/common/tool'
import { hasThingsVisChartContent } from '@/utils/thingsvis/template-presets'
import { getCachedDeviceTemplateDetail } from '@/utils/thingsvis/template-detail-cache'
import { message } from '@/utils/common/discrete'
import { isDeviceDetailDemo } from '@/utils/device-detail-demo-data'
const route = useRoute()
const { query } = useRoute()
let { d_id } = query

const getDeviceId = () => {
  return (Array.isArray(d_id) ? d_id[0] : d_id) || ''
}

const isDemoDevice = computed(() => isDeviceDetailDemo(getDeviceId()))

const { loading, startLoading, endLoading } = useLoading()

// 详情页 Tab 按需加载，避免首次进入时同步解析所有重型模块。
const Telemetry = defineAsyncComponent(() => import('@/views/device/details/modules/telemetry/telemetry.vue'))
const TelemetryChart = defineAsyncComponent(() => import('@/views/device/details/modules/telemetry-chart.vue'))
const Join = defineAsyncComponent(() => import('@/views/device/details/modules/join.vue'))
const DeviceAnalysis = defineAsyncComponent(() => import('@/views/device/details/modules/device-analysis.vue'))
const Message = defineAsyncComponent(() => import('@/views/device/details/modules/message.vue'))
const Stats = defineAsyncComponent(() => import('@/views/device/details/modules/stats.vue'))
const EventReport = defineAsyncComponent(() => import('@/views/device/details/modules/event-report.vue'))
const CommandDelivery = defineAsyncComponent(() => import('@/views/device/details/modules/command-delivery.vue'))
const ExpectMessage = defineAsyncComponent(() => import('@/views/device/details/modules/expect-message.vue'))
const Automate = defineAsyncComponent(() => import('@/views/device/details/modules/automate.vue'))
const GiveAnAlarm = defineAsyncComponent(() => import('@/views/device/details/modules/give-an-alarm.vue'))
const Settings = defineAsyncComponent(() => import('@/views/device/details/modules/settings.vue'))
const DeviceStatusHistory = defineAsyncComponent(() => import('@/views/device/details/modules/device-status.vue'))
const DeviceDiagnosis = defineAsyncComponent(() => import('@/views/device/details/modules/device-diagnosis.vue'))

type TabComponent = {
  key: string
  name: () => string
  component: any
  refreshKey: number
}

const baseComponents: TabComponent[] = [
  {
    key: 'chart',
    name: () => $t('custom.device_details.chart'),
    component: markRaw(TelemetryChart),
    refreshKey: 0
  },
  {
    key: 'telemetry',
    name: () => $t('custom.device_details.telemetry'),
    component: markRaw(Telemetry),
    refreshKey: 0
  },
  {
    key: 'join',
    name: () => $t('custom.device_details.join'),
    component: markRaw(Join),
    refreshKey: 0
  },
  {
    key: 'device-analysis',
    name: () => $t('custom.device_details.subdevice'),
    component: markRaw(DeviceAnalysis),
    refreshKey: 0
  },
  {
    key: 'message',
    name: () => $t('custom.device_details.AdditionalDetails'),
    component: markRaw(Message),
    refreshKey: 0
  },
  {
    key: 'stats',
    name: () => $t('custom.device_details.attributes'),
    component: markRaw(Stats),
    refreshKey: 0
  },
  {
    key: 'event-report',
    name: () => $t('custom.device_details.eventReport'),
    component: markRaw(EventReport),
    refreshKey: 0
  },
  {
    key: 'command-delivery',
    name: () => $t('custom.device_details.commandDelivery'),
    component: markRaw(CommandDelivery),
    refreshKey: 0
  },
  {
    key: 'expect-message',
    name: () => $t('custom.device_details.expectMessage'),
    component: markRaw(ExpectMessage),
    refreshKey: 0
  },
  {
    key: 'automate',
    name: () => $t('custom.device_details.automate'),
    component: markRaw(Automate),
    refreshKey: 0
  },
  {
    key: 'give-an-alarm',
    name: () => $t('custom.device_details.giveAnAlarm'),
    component: markRaw(GiveAnAlarm),
    refreshKey: 0
  },
  {
    key: 'device-diagnosis',
    name: () => $t('custom.device_details.deviceDiagnosis'),
    component: markRaw(DeviceDiagnosis),
    refreshKey: 0
  },
  {
    key: 'settings',
    name: () => $t('custom.device_details.settings'),
    component: markRaw(Settings),
    refreshKey: 0
  }
]

const templateChartAvailabilityCache = new Map<string, boolean>()

const components = ref<TabComponent[]>([])

const tabsRenderKey = ref(0)
let lastTabsSig = ''
let lastConfigId = ''
let detailRequestId = 0

function getPreferredTabKey() {
  const keys = components.value.map(item => item.key)

  // Prefer chart first, otherwise telemetry, otherwise the first available.
  if (keys.includes('chart')) return 'chart'
  if (keys.includes('telemetry')) return 'telemetry'
  return components.value[0]?.key || ''
}

function ensureActiveTab() {
  const preferredKey = getPreferredTabKey()
  if (!preferredKey) {
    tabValue.value = ''
    return
  }

  const exists = components.value.some(item => item.key === tabValue.value)
  if (!exists) tabValue.value = preferredKey
}

function bumpRefreshKey(targetKey: string) {
  const current = components.value.find(item => item.key === targetKey)
  if (current) current.refreshKey += 1
}

// Default active: will be set by ensureActiveTab after data loads
const tabValue = ref<string>('')
const showDialog = ref(false)
const showStatusHistoryDialog = ref(false)
const labels = ref<string[]>([])

const deviceData: any = ref({})
const device_type = ref('')
const icon_type = ref('')
const name = ref('')
const device_number = ref('')
const device_is_online = ref(0)
const device_loop = ref(false)
let wsUrl = getWebsocketServerUrl()
const DEVICE_STATUS_INACTIVE_COLOR = '#ccc'
const DEVICE_ALARM_ACTIVE_COLOR = '#ee0808'

wsUrl += `/device/online/status/ws`
const normalizeOnlineStatus = (payload: unknown): number | null => {
  if (Array.isArray(payload)) {
    for (const item of payload) {
      const status = normalizeOnlineStatus(item)
      if (status !== null) return status
    }
    return null
  }
  if (!payload || typeof payload !== 'object') return null
  const info = payload as Record<string, unknown>
  if (info.data !== undefined) return normalizeOnlineStatus(info.data)
  if (info.payload !== undefined) return normalizeOnlineStatus(info.payload)

  const targetDeviceId = getDeviceId()
  const frameDeviceId = info.device_id ?? info.deviceId
  if (frameDeviceId && String(frameDeviceId) !== String(targetDeviceId)) return null

  const rawStatus = info.is_online ?? info.isOnline
  if (typeof rawStatus === 'boolean') return rawStatus ? 1 : 0
  if (typeof rawStatus === 'number') return rawStatus === 1 ? 1 : 0
  if (typeof rawStatus === 'string') {
    const normalized = rawStatus.trim().toLowerCase()
    if (normalized === '1' || normalized === 'true' || normalized === 'online') return 1
    if (normalized === '0' || normalized === 'false' || normalized === 'offline') return 0
  }

  return null
}
const { send } = useWebSocket(wsUrl, {
  heartbeat: {
    message: 'ping',
    interval: 8000,
    pongTimeout: 3000
  },
  onMessage(_ws: WebSocket, event: MessageEvent) {
    if (event.data && event.data !== 'pong') {
      try {
        const status = normalizeOnlineStatus(JSON.parse(event.data))
        if (status !== null) {
          device_is_online.value = status
        }
      } catch {
        // ignore non-JSON frames
      }
    }
  }
})

const normalizeAlarmActive = (raw: unknown): boolean => {
  if (typeof raw === 'boolean') return raw
  if (typeof raw === 'number') return raw > 0
  if (typeof raw === 'string') {
    const normalized = raw.trim().toLowerCase()
    if (
      !normalized ||
      normalized === '0' ||
      normalized === 'false' ||
      normalized === 'off' ||
      normalized === 'no' ||
      normalized === 'n'
    ) {
      return false
    }
    if (
      normalized === '1' ||
      normalized === 'true' ||
      normalized === 'on' ||
      normalized === 'yes' ||
      normalized === 'y'
    ) {
      return true
    }
  }
  return Boolean(raw)
}

const deviceAlarmActive = computed(() =>
  normalizeAlarmActive(
    deviceData.value?.warn_status ??
      deviceData.value?.warnStatus ??
      deviceData.value?.alarm_status ??
      deviceData.value?.alarmStatus
  )
)

const deviceAlarmColor = computed(() =>
  deviceAlarmActive.value ? DEVICE_ALARM_ACTIVE_COLOR : DEVICE_STATUS_INACTIVE_COLOR
)

const queryParams = reactive({
  label: '',
  id: '',
  name: '',
  device_number: '',
  description: ''
})
const changeTabs = v => {
  startLoading()

  tabValue.value = String(v)
  setTimeout(() => {
    endLoading()
  }, 500)
}
const editConfig = () => {
  showDialog.value = true
}

const rules = {
  name: {
    required: true,
    message: $t('custom.devicePage.enterDeviceName'),
    trigger: 'blur'
  },
  device_number: {
    required: true,
    message: $t('custom.devicePage.enterDeviceNumber'),
    trigger: 'blur'
  }
}
const getDeviceDetail = async () => {
  const currentRequestId = ++detailRequestId
  device_loop.value = false
  const { error, data } = await deviceDetail(getDeviceId())
  if (currentRequestId !== detailRequestId) return

  device_loop.value = true
  deviceData.value = data
  labels.value.length = 0

  if (data.label) {
    if (data.label.includes(',')) {
      labels.value = data.label.split(',')
    } else {
      labels.value.push(data.label)
    }
  }
  if (!error) {
    device_number.value = data.device_number
    device_is_online.value = data.is_online
    name.value = data.name

    // 先展示基础 Tab，模板图表判断放到后台执行，避免阻塞首屏。
    let filtered = baseComponents.map(item => ({ ...item }))
    filtered = filtered.filter(item => item.key !== 'chart')

    if (data?.device_config) {
      device_type.value = data.device_config.device_type
      if (device_type.value !== '2' || !data?.device_config_name) {
        filtered = filtered.filter(item => item.key !== 'device-analysis')
      }
      if (device_type.value === '3') {
        filtered = filtered.filter(item => item.key !== 'join')
      }
    } else if (!data?.device_config_name) {
      filtered = filtered.filter(item => item.key !== 'device-analysis')
    }

    // 一次性赋值
    components.value = filtered

    ensureActiveTab()

    const nextSig = components.value.map(item => item.key).join('|')
    const currentConfigId = data?.device_config_id || ''

    if (nextSig !== lastTabsSig || (lastConfigId && lastConfigId !== currentConfigId)) {
      const isFirstRender = lastTabsSig === ''
      lastTabsSig = nextSig
      lastConfigId = currentConfigId
      if (!isFirstRender) {
        await nextTick()
        tabsRenderKey.value += 1
      }
    } else {
      lastTabsSig = nextSig
      lastConfigId = currentConfigId
    }

    send(
      JSON.stringify({
        device_id: getDeviceId(),
        token: localStg.get('token')
      })
    )

    const templateId = data?.device_config?.device_template_id
    if (templateId) {
      void addChartTabWhenAvailable(templateId, currentRequestId)
    }
  }
}

const resolveTemplateHasChartContent = async (templateId?: string | number) => {
  const normalizedTemplateId = String(templateId || '').trim()
  if (!normalizedTemplateId) return false

  if (templateChartAvailabilityCache.has(normalizedTemplateId)) {
    return templateChartAvailabilityCache.get(normalizedTemplateId) || false
  }

  try {
    const res = await getCachedDeviceTemplateDetail(normalizedTemplateId)
    const template = res?.data || {}
    const hasChart =
      hasThingsVisChartContent(template?.web_chart_config) || hasThingsVisChartContent(template?.app_chart_config)

    templateChartAvailabilityCache.set(normalizedTemplateId, hasChart)
    return hasChart
  } catch (err) {
    console.warn('[DeviceDetail] 加载模板图表标签失败', normalizedTemplateId, err)
    templateChartAvailabilityCache.set(normalizedTemplateId, false)
    return false
  }
}

async function addChartTabWhenAvailable(templateId: string | number, requestId: number) {
  const hasTemplateChart = await resolveTemplateHasChartContent(templateId)
  if (!hasTemplateChart || requestId !== detailRequestId) return
  if (components.value.some(item => item.key === 'chart')) return

  const chartComponent = baseComponents.find(item => item.key === 'chart')
  if (!chartComponent) return

  // 图表可用时把它放到首位，并切换为默认 Tab；没有图表时保持遥测 Tab。
  components.value = [{ ...chartComponent }, ...components.value]
  lastTabsSig = components.value.map(item => item.key).join('|')
  tabValue.value = 'chart'
}
const closeModal = async () => {
  await getDeviceDetail()
  showDialog.value = false
}
const { routerPushByKey } = useRouterPush()
const clickConfig: () => void = () => {
  routerPushByKey('device_config-detail', {
    query: {
      id: deviceData.value?.device_config_id
    }
  })
}
const clickGateway = () => {
  routerPushByKey('device_details', {
    query: {
      d_id: deviceData.value?.parent_id
    }
  })
}
const clickAlarmHistory = () => {
  routerPushByKey('alarm_warning-message', {
    query: {
      device_id: getDeviceId()
    }
  })
}

onBeforeMount(() => {
  getDeviceDetail()
})

watch(
  () => route.query.d_id,
  async newVal => {
    d_id = newVal
    await getDeviceDetail()
    bumpRefreshKey(tabValue.value)
  },
  { deep: true }
)

const save = async () => {
  if (!deviceData.value?.name) {
    message.error($t('custom.devicePage.enterDeviceName'))
    return
  }
  if (!deviceData.value?.device_number) {
    message.error($t('custom.devicePage.enterDeviceNumber'))
    return
  }
  if (deviceData.value?.device_number.length > 100) {
    message.error($t('custom.devicePage.deviceNumberMax'))
    return
  }
  device_number.value = deviceData.value.device_number
  queryParams.id = deviceData.value?.id
  queryParams.name = deviceData.value?.name
  queryParams.device_number = deviceData.value?.device_number
  queryParams.label = labels.value.join(',')
  queryParams.description = deviceData.value?.description

  const { error } = await deviceUpdate(queryParams)
  if (!error) {
    showDialog.value = false
    getDeviceDetail()
  }
}
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})

const isEmbeddedHost = computed(() => {
  try {
    return window.self !== window.top
  } catch {
    return true
  }
})
</script>

<template>
  <div class="device-details-page" :class="{ 'device-details-page--embedded': isEmbeddedHost }">
    <section class="device-details-shell">
      <div class="device-details-header">
        <div class="device-details-title-row">
          <span class="device-details-title">{{ name || '--' }}</span>
          <NTag v-if="isDemoDevice" size="small" type="warning" :bordered="false">演示数据</NTag>
          <NButton v-show="true" type="primary" @click="editConfig">
            {{ $t('common.edit') }}
          </NButton>
        </div>

        <n-modal
          v-model:show="showDialog"
          :title="$t('generate.issue-attribute')"
          :class="getPlatform ? 'w-90%' : 'w-400px'"
        >
          <n-card>
            <n-form :model="deviceData" :rules="rules">
              <div>
                <NH3>{{ $t('generate.modify-device-info') }}</NH3>
              </div>
              <n-form-item :label="$t('page.irrigation.group.deviceName')" path="name">
                <n-input v-model:value="deviceData.name" aria-required="true" />
              </n-form-item>
              <n-form-item :label="$t('generate.device-code')" path="device_number">
                <n-input v-model:value="deviceData.device_number" />
              </n-form-item>
              <n-form-item :label="$t('custom.devicePage.label')" path="label">
                <n-dynamic-tags v-model:value="labels" />
              </n-form-item>
              <n-form-item :label="$t('generate.device-description')">
                <!-- <n-input v-model:value="queryParams.deviceDescribe" type="textarea"/> -->
                <NInput v-model:value="deviceData.description" type="textarea" />
              </n-form-item>
              <n-space>
                <n-button @click="closeModal">{{ $t('generate.cancel') }}</n-button>
                <n-button @click="save">{{ $t('common.save') }}</n-button>
              </n-space>
            </n-form>
          </n-card>
        </n-modal>

        <DeviceStatusHistory v-model:visible="showStatusHistoryDialog" :device-id="getDeviceId()" />

        <NFlex class="device-details-meta">
          <div class="device-details-meta-item">
            <span class="device-details-meta-label">ID:</span>
            <span>{{ getDeviceId() || '--' }}</span>
          </div>
          <div class="device-details-meta-item">
            <span class="device-details-meta-label">{{ $t('custom.devicePage.configTemplate') }} :</span>
            <span v-if="deviceData?.device_config_name" class="device-details-link" @click="clickConfig">
              {{ deviceData?.device_config_name }}
            </span>
            <span v-else>--</span>
          </div>
          <div v-if="device_type === '3'" class="device-details-meta-item">
            <span class="device-details-meta-label">{{ $t('generate.gateway') }}:</span>
            <span class="device-details-link" @click="clickGateway">
              {{ deviceData?.gateway_device_name || '--' }}
            </span>
          </div>
          <!-- 在线/离线，弹窗展示详情 -->
          <div class="device-details-status" @click="showStatusHistoryDialog = true">
            <!-- <span class="mr-2">{{ $t('generate.status') }}:</span> -->
            <SvgIcon
              local-icon="CellTowerRound"
              :style="{ color: DEVICE_STATUS_INACTIVE_COLOR, marginRight: '5px' }"
              class="text-20px text-primary"
              :stroke="device_is_online === 1 ? 'rgb(2,153,52)' : DEVICE_STATUS_INACTIVE_COLOR"
            />
            <span
              :style="{
                color: device_is_online === 1 ? 'rgb(2,153,52)' : DEVICE_STATUS_INACTIVE_COLOR
              }"
            >
              {{ device_is_online === 1 ? $t('custom.device_details.online') : $t('custom.device_details.offline') }}
            </span>

            <!-- 历史记录 -->
            <SvgIcon local-icon="history" style="margin-left: 5px" class="text-18px text-primary" />
          </div>
          <div
            class="device-details-status"
            :class="{ 'device-details-status--alarm': deviceAlarmActive }"
            @click="clickAlarmHistory"
          >
            <SvgIcon
              local-icon="AlertFilled"
              :style="{ color: deviceAlarmColor, marginRight: '5px' }"
              class="text-20px text-primary"
            />
            <span :style="{ color: deviceAlarmColor }">{{ $t('generate.alarmHistory') }}</span>
          </div>
        </NFlex>
      </div>
      <div class="device-details-content">
        <n-tabs
          :key="tabsRenderKey"
          v-model:value="tabValue"
          class="device-details-tabs"
          :class="{ 'device-details-tabs--chart-active': tabValue === 'chart' }"
          animated
          type="line"
          @update:value="changeTabs"
        >
          <n-tab-pane
            v-for="component in components"
            :key="component.key"
            :tab="component.name()"
            :name="component.key"
          >
            <n-spin class="device-details-tab-body" size="small" :show="loading">
              <component
                :is="component.component"
                :id="getDeviceId()"
                :key="component.refreshKey"
                :online="device_is_online"
                :device-data="deviceData"
                :device-config-id="deviceData?.device_config_id || ''"
                :device-template-id="deviceData?.device_config?.device_template_id"
                @change="getDeviceDetail"
              />
            </n-spin>
          </n-tab-pane>
        </n-tabs>
      </div>
    </section>
  </div>
</template>

<style scoped>
.device-details-page {
  padding: 12px;
}

.device-details-page--embedded {
  padding: 8px;
}

.device-details-shell {
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
}

.device-details-page--embedded .device-details-shell {
  border-radius: 10px;
}

.device-details-header {
  padding: 18px 20px 8px;
}

.device-details-page--embedded .device-details-header {
  padding: 16px 18px 6px;
}

.device-details-title-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.device-details-title {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.2;
  color: inherit;
}

.device-details-meta {
  margin-top: 10px;
  gap: 10px 16px;
  color: inherit;
}

.device-details-meta-item {
  display: flex;
  align-items: center;
  min-height: 28px;
}

.device-details-meta-label {
  margin-right: 8px;
  color: #666;
}

.device-details-link {
  color: blue;
  cursor: pointer;
}

.device-details-status {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.device-details-status--alarm {
  cursor: pointer;
}

.device-details-content {
  padding-bottom: 8px;
}

.device-details-page--embedded .device-details-content {
  padding-bottom: 8px;
}

.device-details-tab-body {
  padding: 10px 14px 14px;
}

.device-details-page--embedded .device-details-tab-body {
  padding: 10px 12px 12px;
}

:deep(.device-details-tabs .n-tabs-nav) {
  padding: 0 20px;
}

:deep(.device-details-page--embedded .device-details-tabs .n-tabs-nav) {
  padding: 0 18px;
}

:deep(.device-details-tabs .n-tabs-nav::before) {
  border-bottom-color: #e5e7eb;
}

/* Web 图表 Tab：与内容区视觉连续，不显示标签栏底部分隔线 */
:deep(.device-details-tabs.device-details-tabs--chart-active .n-tabs-nav::before) {
  border-bottom: none;
}

:deep(.device-details-tabs .n-tabs-tab) {
  padding-bottom: 12px;
  font-weight: 500;
}

:deep(.device-details-tabs .n-tab-pane) {
  padding-top: 0;
}

/* 详情页所有列表统一使用同一套表头、边框、密度和悬浮反馈。 */
:deep(.device-detail-table) {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}

:deep(.device-detail-table .n-data-table-th) {
  height: 44px;
  padding: 0 14px;
  background: #f7f8fa;
  color: #4b5563;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
}

:deep(.device-detail-table .n-data-table-td) {
  height: 48px;
  padding: 0 14px;
  color: #374151;
  font-variant-numeric: tabular-nums;
}

:deep(.device-detail-table .n-data-table-tr:hover .n-data-table-td) {
  background: #f8fbff;
}

:deep(.device-detail-table .n-data-table-th--last-col),
:deep(.device-detail-table .n-data-table-td--last-col) {
  border-right: 0;
}

:deep(.device-detail-table .n-data-table-tr:last-child .n-data-table-td) {
  border-bottom: 0;
}

:deep(.device-detail-table .n-data-table-empty) {
  min-height: 132px;
}

:deep(.device-detail-table.detail-table) {
  border: 0;
}

:deep(.detail-table) {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}

:deep(.detail-table th),
:deep(.detail-table td) {
  height: 48px;
  padding: 0 14px;
  border-bottom: 1px solid #edf0f3;
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
}

:deep(.detail-table th) {
  height: 44px;
  background: #f7f8fa;
  color: #4b5563;
  font-size: 13px;
  font-weight: 600;
}

:deep(.detail-table tbody tr:hover > td) {
  background: #f8fbff;
}
</style>
