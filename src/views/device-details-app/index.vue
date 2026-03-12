
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ThingsVisWidget from '@/components/thingsvis/ThingsVisWidget.vue'
import { extractPlatformFields } from '@/utils/thingsvis/platform-fields'
import { $t, setLocale } from '@/locales'
import { deviceDetail, deviceTemplateDetail, telemetryDataCurrent, getAttributeDataSet } from '@/service/api/device'
import { telemetryApi, attributesApi } from '@/service/api'
import { formatDateTime } from '@/utils/common/datetime'
import { localStg } from '@/utils/storage'
import type { PlatformField } from '@/utils/thingsvis/types'
import TelemetryDataCards from './telemetryDataCards.vue'
import { useHistoryBackfill } from '@/hooks/thingsvis/useHistoryBackfill'
import { useRealtimePush } from '@/hooks/thingsvis/useRealtimePush'
import { useAlarmPush } from '@/hooks/thingsvis/useAlarmPush'

const route = useRoute()
const router = useRouter()
const { d_id, token, lang } = route.query
const deviceData: any = ref({})

// Handle Token from URL (Magic Link)
if (token) {
  localStg.set('token', token as string)

  // Clean URL to prevent infinite loop on reload (Handle Hash Mode)
  const hash = window.location.hash
  if (hash.includes('token=')) {
    const [path, queryStr] = hash.split('?')
    if (queryStr) {
      const params = new URLSearchParams(queryStr)
      params.delete('token')
      const newQuery = params.toString()
      const newHash = path + (newQuery ? `?${newQuery}` : '')
      const newUrl = window.location.href.replace(hash, newHash)
      window.history.replaceState({}, '', newUrl)
    }
  }
}

// Redirect to login if no token found (e.g. after 401 reload)
if (!localStg.get('token')) {
  router.push({ name: 'login' })
}

if (lang) {
  setLocale(lang as App.I18n.LangType)
}

const device_color = ref('#ccc')
const device_type = ref('')
const icon_type = ref('')
const device_number = ref('')

const showDefaultCards = ref(false)
const showAppChart = ref(false)
const cardHeight = ref(160)
const cardMargin = ref(15)

// ThingsVis 编辑器相关
const initialConfig = ref<any>(null)
const platformFields = ref<PlatformField[]>([])
const currentData = ref<Record<string, any>>({})

// ThingsVis Widget ref
const visWidgetRef = ref<InstanceType<typeof ThingsVisWidget> | null>(null)

// deviceId computed ref
const deviceIdRef = computed(() => d_id as string)

// ─── tp-02/03/04 composables ──────────────────────────────────────────────────
const realtimePush = ref<ReturnType<typeof useRealtimePush> | null>(null)
const alarmPush = ref<ReturnType<typeof useAlarmPush> | null>(null)
const historyBackfill = ref<ReturnType<typeof useHistoryBackfill> | null>(null)

// 推送实时数据到 ThingsVis
const pushDataToVis = (fields: Record<string, unknown>) => {
  visWidgetRef.value?.pushPlatformData(fields)
}

const pushHistoryToVis = (fieldId: string, history: Array<{ value: unknown; ts: number }>) => {
  visWidgetRef.value?.pushHistory(fieldId, history)
}

const getDeviceDetail = async () => {
  const { data, error } = await deviceDetail(d_id)
  if (!error) {
    deviceData.value = data
    device_number.value = data.device_number
    if (data.is_online !== 0) {
      device_color.value = 'rgb(2,153,52)'
      icon_type.value = 'rgb(2,153,52)'
    }
    if (data.device_config !== undefined) {
      device_type.value = data.device_config.device_type
    }

    // 加载模板配置
    if (data.device_config?.device_template_id) {
      const templateId = data.device_config.device_template_id
      const res = await deviceTemplateDetail({ id: templateId })
      if (res.data) {
        // 从物模型接口获取平台字段（与 telemetry-chart.vue 保持一致）
        const [telemetryRes, attributesRes] = await Promise.all([
          telemetryApi({ page: 1, page_size: 1000, device_template_id: templateId }),
          attributesApi({ page: 1, page_size: 1000, device_template_id: templateId })
        ])

        const telemetryList = Array.isArray(telemetryRes?.data?.list)
          ? telemetryRes.data.list
          : Array.isArray(telemetryRes?.data)
            ? telemetryRes.data
            : []

        const attributesList = Array.isArray(attributesRes?.data?.list)
          ? attributesRes.data.list
          : Array.isArray(attributesRes?.data)
            ? attributesRes.data
            : []

        const platformSource = {
          telemetry: telemetryList,
          attributes: attributesList
        }

        const extractedFields = extractPlatformFields(platformSource)
        platformFields.value = extractedFields.length > 0 ? extractedFields : extractPlatformFields(res.data)

        // 加载 app_chart_config
        if (res.data.app_chart_config) {
          try {
            const configJson = JSON.parse(res.data.app_chart_config)
            initialConfig.value = configJson
            showAppChart.value = true

            // tp-03: 启动 WebSocket 实时推送
            realtimePush.value = useRealtimePush(
              deviceIdRef,
              platformFields,
              pushDataToVis,
              fetchDeviceData
            )
            // tp-04: 启动告警推送
            alarmPush.value = useAlarmPush(
              deviceIdRef,
              platformFields,
              pushDataToVis,
              pushHistoryToVis
            )
            // tp-02: 准备历史回填
            historyBackfill.value = useHistoryBackfill(
              deviceIdRef,
              platformFields,
              pushHistoryToVis
            )

            realtimePush.value.start()
            alarmPush.value.start()
          } catch (e) {
            console.warn('解析 app_chart_config 失败', e)
            showDefaultCards.value = true
          }
        } else {
          showDefaultCards.value = true
        }
      }
    } else {
      showDefaultCards.value = true
    }
  }
}

/**
 * 获取设备实时数据（轮询回退时使用）
 */
const fetchDeviceData = async () => {
  if (!showAppChart.value) return

  try {
    const hasAttributes = platformFields.value.some(f => f.dataType === 'attribute')

    const [telemetryRes, attributeRes] = await Promise.all([
      telemetryDataCurrent(d_id as string),
      hasAttributes ? getAttributeDataSet({ device_id: d_id as string }) : Promise.resolve({ data: [] })
    ])

    const telemetryList = telemetryRes?.data || []
    const attributeList = attributeRes?.data || []

    const kvMap: Record<string, any> = {}
    const processItem = (item: any) => {
      if (item?.key !== undefined) kvMap[item.key] = item.value
      if (item?.label) kvMap[item.label] = item.value
    }

    if (Array.isArray(telemetryList)) telemetryList.forEach(processItem)
    if (Array.isArray(attributeList)) attributeList.forEach(processItem)

    console.log('[DeviceDetailsApp] kvMap:', JSON.stringify(kvMap))
    console.log('[DeviceDetailsApp] platformFields:', platformFields.value.map(f => `${f.id}/${f.name}`))

    const dataMap: Record<string, any> = {}
    platformFields.value.forEach(field => {
      const val = kvMap[field.id] ?? kvMap[field.name]
      if (val !== undefined) dataMap[field.id] = val
    })

    console.log('[DeviceDetailsApp] dataMap to push:', JSON.stringify(dataMap))

    if (Object.keys(dataMap).length > 0) {
      pushDataToVis(dataMap)
    } else {
      console.warn('[DeviceDetailsApp] dataMap is empty — field IDs may not match API keys')
    }
  } catch (error) {
    console.error('[DeviceDetailsApp] 获取设备数据失败:', error)
  }
}

/**
 * ThingsVis ready 回调
 */
const onVisReady = async () => {
  console.log('[DeviceDetailsApp] onVisReady fired')
  // tp-02: 历史数据回填
  if (historyBackfill.value) await historyBackfill.value.backfill()
  // tp-04: 告警历史回填
  if (alarmPush.value) await alarmPush.value.backfillAlarmHistory()
  // Push current snapshot so widgets show real values immediately after ready
  // Use a short delay to ensure iframe has finished registering data sources
  setTimeout(async () => {
    console.log('[DeviceDetailsApp] Pushing initial data after delay')
    await fetchDeviceData()
  }, 500)
}

onMounted(() => {
  getDeviceDetail()
})

onBeforeUnmount(() => {
  realtimePush.value?.stop()
  alarmPush.value?.stop()
})
</script>

<template>
  <div class="mx-auto max-w-md rounded-3xl bg-gray-50 p-6 shadow-lg">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl text-gray-900 font-semibold">{{ deviceData?.name || '--' }}</h1>
      <div class="flex items-center">
        <SvgIcon
          local-icon="CellTowerRound"
          style="margin-right: 5px"
          class="color-ccc text-20px text-primary"
          :stroke="icon_type"
        />
        <span class="text-sm text-blue-500 font-medium">
          {{ deviceData?.is_online === 1 ? $t('custom.device_details.online') : $t('custom.device_details.offline') }}
        </span>
        <template v-if="deviceData?.alarmStatus === true">
          <SvgIcon
            local-icon="AlertFilled"
            style="color: #ee0808; margin-right: 5px"
            class="text-20px text-primary"
            :stroke="icon_type"
          />
          <span style="color: #ee0808">{{ $t('custom.device_details.alarm') }}</span>
        </template>
      </div>
    </div>

    <div class="mb-6 text-sm text-gray-500">
      {{ $t('custom.device_details.lastUpdate') }}: {{ formatDateTime(deviceData?.ts) || '--' }}
    </div>

    <n-divider title-placement="left"></n-divider>

    <TelemetryDataCards
      v-if="showDefaultCards"
      :id="d_id as string"
      :card-height="cardHeight"
      :card-margin="cardMargin"
    />
    <div v-if="showAppChart">
      <ThingsVisWidget
        ref="visWidgetRef"
        mode="viewer"
        :config="initialConfig"
        :platform-fields="platformFields"
        height="calc(100vh - 250px)"
        :buffer-size="100"
        :device-id="d_id as string"
        @ready="onVisReady"
      />
    </div>
  </div>
</template>

<style scoped>
.color-ccc {
  color: #ccc;
}
:root {
  --n-padding-left: 0px;
  --n-padding-right: 0px;
}
:deep(.n-card__content) {
  padding-left: 5px !important;
  padding-right: 5px !important;
}
</style>
