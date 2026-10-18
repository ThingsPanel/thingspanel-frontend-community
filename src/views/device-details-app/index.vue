<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ThingsVisWidget from '@/components/thingsvis/ThingsVisWidget.vue'
import { $t } from '@/locales'
import { deviceDetail, telemetryDataCurrent, getAttributeDataSet } from '@/service/api/device'
import { formatDateTime } from '@/utils/common/datetime'
import type { PlatformField } from '@/utils/thingsvis/types'
import TelemetryDataCards from './telemetryDataCards.vue'
import { useRealtimePush } from '@/hooks/thingsvis/useRealtimePush'
import { useAlarmPush } from '@/hooks/thingsvis/useAlarmPush'
import { bootstrapAppEmbedSession } from '@/utils/app-embed-auth'
import { normalizeAppChartConfig } from '@/utils/thingsvis/chart-config-initialization'
import { deviceBindingRequiresNativeModel, resolveDeviceNativeModel } from '@/views/device/native-model-consumption'

const route = useRoute()
const router = useRouter()
const d_id = computed(() => {
  const value = route.query.d_id
  return Array.isArray(value) ? value[0] || '' : value || ''
})
const { token, lang } = route.query
const deviceData: any = ref({})

const icon_type = ref('')
const device_number = ref('')
const showDefaultCards = ref(false)
const showAppChart = ref(false)
const nativeBindingError = ref('')
const cardHeight = ref(160)
const cardMargin = ref(15)

const initialConfig = ref<any>(null)
const platformFields = ref<PlatformField[]>([])
const currentData = ref<Record<string, any>>({})
let deviceDetailRequestId = 0
let appDataFetchRequestId = 0
let sessionReady = false
const viewerPlatformDevices = computed(() => {
  if (!d_id.value || platformFields.value.length === 0) return []
  return [
    {
      deviceId: d_id.value,
      deviceName: deviceData.value?.name || device_number.value || 'Device',
      fields: platformFields.value
    }
  ]
})

const visWidgetRef = ref<InstanceType<typeof ThingsVisWidget> | null>(null)
const deviceIdRef = computed(() => d_id.value)

const realtimePush = ref<ReturnType<typeof useRealtimePush> | null>(null)
const alarmPush = ref<ReturnType<typeof useAlarmPush> | null>(null)

const pushDataToVis = (fields: Record<string, unknown>, deviceId = d_id.value) => {
  if (Object.keys(fields).length === 0) return
  currentData.value = {
    ...currentData.value,
    ...fields
  }
  visWidgetRef.value?.pushPlatformData(fields, deviceId)
}

const fetchDeviceData = async () => {
  if (!showAppChart.value) return
  const requestId = ++appDataFetchRequestId
  const deviceId = d_id.value

  try {
    const hasAttributes = platformFields.value.some(f => f.dataType === 'attribute')

    const [telemetryRes, attributeRes] = await Promise.all([
      telemetryDataCurrent(deviceId),
      hasAttributes ? getAttributeDataSet({ device_id: deviceId }) : Promise.resolve({ data: [] })
    ])
    if (requestId !== appDataFetchRequestId || deviceId !== d_id.value) return

    const telemetryList = telemetryRes?.data || []
    const attributeList = attributeRes?.data || []

    const kvMap: Record<string, any> = {}
    const processItem = (item: any) => {
      if (item?.key !== undefined) {
        kvMap[item.key] = item.value
      } else if (item?.label !== undefined) {
        if (!kvMap[item.label]) kvMap[item.label] = item.value
      }
    }

    if (Array.isArray(telemetryList)) telemetryList.forEach(processItem)
    if (Array.isArray(attributeList)) attributeList.forEach(processItem)

    const dataMap: Record<string, any> = {}
    platformFields.value.forEach(field => {
      const val = kvMap[field.id] ?? kvMap[field.name]
      if (val !== undefined) {
        dataMap[field.id] = val
      }
    })

    if (Object.keys(dataMap).length > 0) {
      currentData.value = {
        ...currentData.value,
        ...dataMap
      }
      pushDataToVis(dataMap, deviceId)
    }
  } catch (error) {
    console.error('[DeviceDetailsApp] 获取设备数据失败:', error)
  }
}

const getDeviceDetail = async () => {
  const requestId = ++deviceDetailRequestId
  appDataFetchRequestId += 1
  const deviceId = d_id.value
  realtimePush.value?.stop()
  alarmPush.value?.stop()
  platformFields.value = []
  showDefaultCards.value = false
  showAppChart.value = false
  nativeBindingError.value = ''
  initialConfig.value = null
  currentData.value = {}
  const { data, error } = await deviceDetail(deviceId)
  if (requestId !== deviceDetailRequestId || deviceId !== d_id.value) return
  if (error) return

  deviceData.value = data
  device_number.value = data.device_number
  icon_type.value = data.is_online !== 0 ? 'rgb(2,153,52)' : '#ccc'
  currentData.value = {
    ...currentData.value,
    is_online: data.is_online,
    online_text: data.is_online === 1 ? '在线' : '离线',
    online_status_updated_at: typeof data.ts === 'number' ? data.ts : Date.now()
  }
  showDefaultCards.value = false
  showAppChart.value = false
  nativeBindingError.value = ''
  initialConfig.value = null

  let resolved: Awaited<ReturnType<typeof resolveDeviceNativeModel>>
  try {
    resolved = await resolveDeviceNativeModel(data.device_config)
  } catch (error) {
    if (requestId !== deviceDetailRequestId || deviceId !== d_id.value) return
    console.error('[DeviceDetailsApp] 加载绑定物模型快照失败:', error)
    nativeBindingError.value = error instanceof Error ? error.message : '读取设备绑定的物模型失败'
    return
  }
  if (requestId !== deviceDetailRequestId || deviceId !== d_id.value) return
  if (!resolved) {
    showDefaultCards.value = true
    if (deviceBindingRequiresNativeModel(data.device_config)) {
      nativeBindingError.value = '此设备模板尚未绑定固定版本的原生物模型，无法加载模型图表。'
    }
    return
  }
  platformFields.value = resolved.platformFields
  const appChartConfig = resolved.snapshot.resources.appChartConfig
  if (!appChartConfig) {
    showDefaultCards.value = true
    return
  }

  try {
    const configJson: any = normalizeAppChartConfig(appChartConfig)

    // App 详情页使用保存时的固定手机网格，不按运行容器宽度再次响应式重排。
    configJson.canvas = {
      ...(configJson.canvas || {}),
      responsive: false
    }

    if (configJson.dataSources && Array.isArray(configJson.dataSources)) {
      configJson.dataSources.forEach((ds: any) => {
        if (ds.type === 'PLATFORM_FIELD') {
          ds.config = ds.config || {}
          ds.config.deviceId = deviceId
        }
      })
    }

    initialConfig.value = configJson
    showAppChart.value = true

    realtimePush.value?.stop()
    alarmPush.value?.stop()

    realtimePush.value = useRealtimePush(deviceIdRef, platformFields, pushDataToVis, fetchDeviceData)
    alarmPush.value = useAlarmPush(deviceIdRef, platformFields, pushDataToVis)

    realtimePush.value?.start()
    alarmPush.value?.start()
  } catch (e) {
    console.warn('解析 app_chart_config 失败', e)
    showDefaultCards.value = true
  }
}

const onVisReady = async () => {
  setTimeout(async () => {
    await fetchDeviceData()
  }, 500)
}

onMounted(async () => {
  const authenticated = await bootstrapAppEmbedSession({ token, lang })
  if (!authenticated) {
    await router.push({ name: 'login' })
    return
  }

  sessionReady = true
  await getDeviceDetail()
})

watch(d_id, () => {
  if (sessionReady) void getDeviceDetail()
})

onBeforeUnmount(() => {
  deviceDetailRequestId += 1
  appDataFetchRequestId += 1
  realtimePush.value?.stop()
  alarmPush.value?.stop()
})
</script>

<template>
  <div class="device-details-app bg-gray-50">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl text-gray-900 font-semibold">{{ deviceData?.name || '--' }}</h1>
      <div class="flex items-center" style="min-width: 60px">
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

    <n-alert v-if="nativeBindingError" type="error" :show-icon="false" class="mb-4">
      {{ nativeBindingError }}
    </n-alert>

    <TelemetryDataCards
      v-if="showDefaultCards"
      :id="d_id"
      :card-height="cardHeight"
      :card-margin="cardMargin"
      :platform-fields="platformFields"
      :native-model-expected="deviceBindingRequiresNativeModel(deviceData?.device_config)"
    />
    <div v-if="showAppChart" class="device-details-app__viewer">
      <ThingsVisWidget
        ref="visWidgetRef"
        mode="viewer"
        :config="initialConfig"
        :data="currentData"
        :platform-fields="platformFields"
        :platform-devices="viewerPlatformDevices"
        :buffer-size="100"
        :device-id="d_id"
        @ready="onVisReady"
      />
    </div>
  </div>
</template>

<style scoped>
.color-ccc {
  color: #ccc;
}

.device-details-app {
  width: 100%;
  min-height: 100vh;
  padding: 24px;
  box-sizing: border-box;
}

.device-details-app__viewer {
  width: 100%;
  overflow: visible;
}

.device-details-app__viewer :deep(.thingsvis-widget-container) {
  min-height: 400px;
  overflow: visible;
}

:deep(.device-details-app__viewer iframe) {
  overflow: hidden;
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
