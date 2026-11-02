<script setup lang="ts">
import { computed, defineAsyncComponent, getCurrentInstance, markRaw, nextTick, onBeforeMount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useLoading } from '@sa/hooks'
import { useWebSocket } from '@vueuse/core'
import { $t } from '@/locales'
import { deviceNative, type Device, type UpdateDevice } from '@/service/api/device-native'
import { templateNative } from '@/service/api/template-native'
import type { DeviceConfigNativeBinding } from '@/service/api/native-template-binding'
import { localStg } from '@/utils/storage'
import { useRouterPush } from '@/hooks/common/router'
import { getWebsocketServerUrl } from '@/utils/common/tool'
import { hasThingsVisChartContent } from '@/utils/thingsvis/template-presets'
import { resolveDeviceNativeModel } from '@/views/device/native-model-consumption'
import { normalizeNativeDeviceTags } from '@/views/device/manage/modules/native-device-registration'
import { message } from '@/utils/common/discrete'
import { isDeviceDetailDemo } from '@/utils/device-detail-demo-data'
import NativeDeviceCredentials from '@/views/device/details/modules/native-device-credentials.vue'
import NativeDeviceInfo from '@/views/device/details/modules/native-device-info.vue'
const route = useRoute()
const { query } = useRoute()
let { d_id } = query

const getDeviceId = () => {
  return (Array.isArray(d_id) ? d_id[0] : d_id) || ''
}

const isDemoDevice = computed(() => Boolean(deviceData.value?.id) && isDeviceDetailDemo(getDeviceId()))

const { loading, startLoading, endLoading } = useLoading()

// 详情页 Tab 按需加载，避免首次进入时同步解析所有重型模块。
const Telemetry = defineAsyncComponent(() => import('@/views/device/details/modules/telemetry/telemetry.vue'))
const TelemetryChart = defineAsyncComponent(() => import('@/views/device/details/modules/telemetry-chart.vue'))
const Stats = defineAsyncComponent(() => import('@/views/device/details/modules/stats.vue'))
const EventReport = defineAsyncComponent(() => import('@/views/device/details/modules/event-report.vue'))
const CommandDelivery = defineAsyncComponent(() => import('@/views/device/details/modules/command-delivery.vue'))
const ExpectMessage = defineAsyncComponent(() => import('@/views/device/details/modules/expect-message.vue'))
const Automate = defineAsyncComponent(() => import('@/views/device/details/modules/automate.vue'))
const GiveAnAlarm = defineAsyncComponent(() => import('@/views/device/details/modules/give-an-alarm.vue'))
const DeviceStatusHistory = defineAsyncComponent(() => import('@/views/device/details/modules/device-status.vue'))
const DeviceDiagnosis = defineAsyncComponent(() => import('@/views/device/details/modules/device-diagnosis.vue'))
const NativeDeviceSettings = defineAsyncComponent(
  () => import('@/views/device/details/modules/native-device-settings.vue')
)
const NativeSubdevices = defineAsyncComponent(() => import('@/views/device/details/modules/native-subdevices.vue'))

type TabComponent = {
  key: string
  name: () => string
  component: any
  refreshKey: number
  pendingTitle?: string
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
    component: markRaw(NativeDeviceCredentials),
    refreshKey: 0,
    pendingTitle: '连接配置'
  },
  {
    key: 'device-analysis',
    name: () => $t('custom.device_details.subdevice'),
    component: markRaw(NativeSubdevices),
    refreshKey: 0,
    pendingTitle: '子设备关系'
  },
  {
    key: 'message',
    name: () => $t('custom.device_details.AdditionalDetails'),
    component: markRaw(NativeDeviceInfo),
    refreshKey: 0,
    pendingTitle: '设备附加信息'
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
    component: markRaw(NativeDeviceSettings),
    refreshKey: 0,
    pendingTitle: '设备设置'
  }
]

const components = ref<TabComponent[]>([])

const tabsRenderKey = ref(0)
let lastTabsSig = ''
let lastConfigId = ''
let detailRequestId = 0
let deviceETag = ''
let pendingDeviceUpdate: { etag: string; id: string; key: string; payloadJSON: string } | null = null

function requestedTabKey() {
  const requested = String(route.query.tab ?? '')
  return requested === 'automate' || requested === 'give-an-alarm' ? requested : ''
}

function getPreferredTabKey() {
  const requested = requestedTabKey()
  const keys = components.value.map(item => item.key)
  if (requested && keys.includes(requested)) return requested

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

  const requested = requestedTabKey()
  if (requested && components.value.some(item => item.key === requested)) {
    tabValue.value = requested
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
const tags = ref<string[]>([])
const detailError = ref('')
const relatedTemplateError = ref('')
const updateError = ref('')

const deviceData: any = ref({})
const structuredLabels = computed(() => Object.entries((deviceData.value?.labels ?? {}) as Record<string, string>))
const device_type = ref('')
const name = ref('')
const device_is_online = ref<number | null>(null)
let wsUrl = getWebsocketServerUrl()
const DEVICE_STATUS_INACTIVE_COLOR = '#ccc'
const deviceAlarmActive = ref<boolean | null>(null)
const deviceAlarmColor = computed(() => DEVICE_STATUS_INACTIVE_COLOR)

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

function legacyKind(kind: Device['deviceKind']) {
  if (kind === 'standalone') return '1'
  if (kind === 'gateway') return '2'
  return '3'
}

function toDeviceDetailView(device: Device, templateName: string, gatewayName: string) {
  const binding = device.modelBinding
    ? {
        id: device.id,
        native_thing_model_id: device.modelBinding.modelId,
        native_thing_model_snapshot_id: device.modelBinding.snapshotId,
        native_thing_model_revision: device.modelBinding.publishedRevision,
        // This is the exact device resource revision observed with modelBinding;
        // the model identity and published revision above come only from modelBinding.
        native_binding_revision: device.resourceVersion
      }
    : null

  return {
    ...device,
    device_number: device.deviceNumber,
    device_type: legacyKind(device.deviceKind),
    device_config_id: device.templateId ?? '',
    device_config_name: templateName,
    device_config: binding,
    parent_id: device.gatewayId ?? '',
    gateway_device_name: gatewayName,
    is_online: null
  }
}

const getDeviceDetail = async () => {
  const currentRequestId = ++detailRequestId
  const id = getDeviceId()
  detailError.value = ''
  relatedTemplateError.value = ''
  device_is_online.value = null
  if (!id) {
    detailError.value = '缺少设备 ID。'
    deviceData.value = {}
    components.value = []
    name.value = ''
    return
  }
  try {
    const { device, etag } = await deviceNative.get(id)
    if (currentRequestId !== detailRequestId) return
    deviceETag = etag

    let templateName = ''
    if (device.templateId) {
      try {
        const { template } = await templateNative.get(device.templateId)
        templateName = template.name
      } catch (error) {
        relatedTemplateError.value = error instanceof Error ? error.message : '设备模板名称暂不可读取。'
      }
    }
    let gatewayName = ''
    if (device.gatewayId) {
      try {
        const { device: gateway } = await deviceNative.get(device.gatewayId)
        gatewayName = gateway.name
      } catch {
        gatewayName = ''
      }
    }
    if (currentRequestId !== detailRequestId) return

    const data = toDeviceDetailView(device, templateName, gatewayName)
    deviceData.value = data
    tags.value = [...(device.tags ?? [])]
    name.value = device.name
    device_type.value = data.device_type

    // Start with live runtime tabs; the chart is enabled only from the exact
    // selected model snapshot included in the native device response.
    let filtered = baseComponents.map(item => ({ ...item }))
    filtered = filtered.filter(item => item.key !== 'chart')
    if (device.deviceKind !== 'gateway') {
      filtered = filtered.filter(item => item.key !== 'device-analysis')
    }
    if (device.deviceKind === 'subdevice') {
      filtered = filtered.filter(item => item.key !== 'join')
    }
    components.value = filtered
    ensureActiveTab()

    const nextSig = components.value.map(item => item.key).join('|')
    const currentConfigId = device.templateId || ''
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

    send(JSON.stringify({ device_id: id, token: localStg.get('token') }))
    void addChartTabWhenAvailable(data.device_config as DeviceConfigNativeBinding | null, currentRequestId)
  } catch (error) {
    if (currentRequestId === detailRequestId) {
      detailError.value = error instanceof Error ? error.message : '设备详情加载失败。'
      deviceData.value = {}
      components.value = []
      name.value = ''
    }
  }
}

const resolveTemplateHasChartContent = async (binding: DeviceConfigNativeBinding | null | undefined) => {
  try {
    const resolved = await resolveDeviceNativeModel(binding)
    return Boolean(resolved && hasThingsVisChartContent(resolved.snapshot.resources.webChartConfig))
  } catch (err) {
    console.warn('[DeviceDetail] 加载绑定物模型图表标签失败', err)
    return false
  }
}

async function addChartTabWhenAvailable(binding: DeviceConfigNativeBinding | null | undefined, requestId: number) {
  const hasTemplateChart = await resolveTemplateHasChartContent(binding)
  if (!hasTemplateChart || requestId !== detailRequestId) return
  if (components.value.some(item => item.key === 'chart')) return

  const chartComponent = baseComponents.find(item => item.key === 'chart')
  if (!chartComponent) return

  // 图表可用时把它放到首位，并切换为默认 Tab；没有图表时保持遥测 Tab。
  components.value = [{ ...chartComponent }, ...components.value]
  lastTabsSig = components.value.map(item => item.key).join('|')
  if (!requestedTabKey()) tabValue.value = 'chart'
}
const closeModal = () => {
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
  tabValue.value = 'give-an-alarm'
}

onBeforeMount(() => {
  getDeviceDetail()
})

watch(
  () => [route.query.d_id, route.query.tab],
  async ([newId], [oldId]) => {
    if (newId !== oldId) {
      d_id = newId
      await getDeviceDetail()
      bumpRefreshKey(tabValue.value)
      return
    }
    ensureActiveTab()
  },
  { deep: true }
)

function labelsMatch(actual: Record<string, string>, expected: Record<string, string>) {
  const sortEntries = (value: Record<string, string>) => Object.entries(value).sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify(sortEntries(actual)) === JSON.stringify(sortEntries(expected))
}

const save = async () => {
  if (!deviceData.value?.name?.trim()) {
    message.error($t('custom.devicePage.enterDeviceName'))
    return
  }
  if (!deviceETag) {
    updateError.value = '设备版本信息已失效，请刷新详情后重试。'
    return
  }

  let payload: UpdateDevice
  try {
    payload = {
      name: deviceData.value.name.trim(),
      description: deviceData.value.description ?? null,
      tags: normalizeNativeDeviceTags(tags.value)
    }
  } catch (error) {
    updateError.value = error instanceof Error ? error.message : '标签格式无效。'
    return
  }

  const id = getDeviceId()
  const payloadJSON = JSON.stringify(payload)
  const expectedLabels = { ...((deviceData.value.labels ?? {}) as Record<string, string>) }
  if (
    !pendingDeviceUpdate ||
    pendingDeviceUpdate.id !== id ||
    pendingDeviceUpdate.etag !== deviceETag ||
    pendingDeviceUpdate.payloadJSON !== payloadJSON
  ) {
    if (!globalThis.crypto?.randomUUID) {
      updateError.value = '当前环境无法安全提交修改，请稍后重试。'
      return
    }
    pendingDeviceUpdate = { id, etag: deviceETag, key: globalThis.crypto.randomUUID(), payloadJSON }
  }

  updateError.value = ''
  try {
    await deviceNative.update(id, payload, pendingDeviceUpdate.etag, pendingDeviceUpdate.key)
    const { device: verified, etag } = await deviceNative.get(id)
    if (
      verified.name !== payload.name ||
      verified.description !== payload.description ||
      JSON.stringify(verified.tags ?? []) !== JSON.stringify(payload.tags ?? []) ||
      !labelsMatch(verified.labels ?? {}, expectedLabels)
    ) {
      throw new Error('保存结果暂未确认，请保留此页面并重试读取。')
    }
    deviceETag = etag
    pendingDeviceUpdate = null
    showDialog.value = false
    await getDeviceDetail()
  } catch (error) {
    updateError.value = error instanceof Error ? error.message : '设备修改失败，输入内容仍保留。'
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
            <NAlert v-if="updateError" type="error" :show-icon="false" class="mb-3">
              {{ updateError }}
            </NAlert>
            <n-form :model="deviceData">
              <div>
                <NH3>{{ $t('generate.modify-device-info') }}</NH3>
              </div>
              <n-form-item :label="$t('page.irrigation.group.deviceName')" path="name">
                <n-input v-model:value="deviceData.name" aria-required="true" />
              </n-form-item>
              <n-form-item :label="$t('generate.device-code')" path="device_number">
                <n-input :value="deviceData.device_number" disabled />
              </n-form-item>
              <n-form-item :label="$t('custom.devicePage.label')" path="tags">
                <n-dynamic-tags v-model:value="tags" />
              </n-form-item>
              <n-form-item label="结构化标签（只读）">
                <n-space v-if="structuredLabels.length">
                  <n-tag v-for="(entry, index) in structuredLabels" :key="`${entry[0]}-${index}`" :bordered="false">
                    {{ entry[0] }}={{ entry[1] }}
                  </n-tag>
                </n-space>
                <span v-else>暂无结构化标签</span>
              </n-form-item>
              <n-form-item :label="$t('generate.device-description')">
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
              {{
                device_is_online === 1
                  ? $t('custom.device_details.online')
                  : device_is_online === 0
                    ? $t('custom.device_details.offline')
                    : '状态未知'
              }}
            </span>

            <!-- 历史记录 -->
            <SvgIcon local-icon="history" style="margin-left: 5px" class="text-18px text-primary" />
          </div>
          <div
            class="device-details-status"
            :class="{ 'device-details-status--alarm': deviceAlarmActive === true }"
            @click="clickAlarmHistory"
          >
            <SvgIcon
              local-icon="AlertFilled"
              :style="{ color: deviceAlarmColor, marginRight: '5px' }"
              class="text-20px text-primary"
            />
            <span :style="{ color: deviceAlarmColor }">查看告警</span>
          </div>
        </NFlex>
      </div>
      <NAlert v-if="detailError" type="error" :show-icon="false" class="mb-3">
        {{ detailError }}
      </NAlert>
      <NAlert v-else type="warning" :show-icon="false" class="mb-3">
        可管理设备资料和凭据；连接信息、关系及部分设置正在完善。
      </NAlert>
      <NAlert v-if="relatedTemplateError" type="warning" :show-icon="false" class="mb-3">
        设备模板名称暂不可读取：{{ relatedTemplateError }}
      </NAlert>
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
            :display-directive="component.key === 'join' || component.key === 'message' ? 'show:lazy' : 'if'"
          >
            <n-spin class="device-details-tab-body" size="small" :show="loading">
              <component
                :is="component.component"
                :id="getDeviceId()"
                :key="component.key === 'telemetry' ? `${component.refreshKey}:${getDeviceId()}` : component.refreshKey"
                :online="device_is_online"
                :device-data="deviceData"
                :device-config-id="deviceData?.device_config_id || ''"
                :title="component.pendingTitle"
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
