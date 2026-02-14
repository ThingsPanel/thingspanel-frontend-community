
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
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

// 数据更新定时器
let dataUpdateInterval: NodeJS.Timeout | null = null

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
            // 配置加载成功后，启动数据轮询
            startDataUpdate()
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
 * 获取设备实时数据（与 telemetry-chart.vue 保持一致）
 */
const fetchDeviceData = async () => {
  if (!showAppChart.value) return

  try {
    const hasAttributes = platformFields.value.some(f => f.dataType === 'attribute')

    const [telemetryRes, attributeRes] = await Promise.all([
      telemetryDataCurrent(d_id as string),
      hasAttributes ? getAttributeDataSet({ device_id: d_id as string }) : Promise.resolve({ data: [] })
    ])

    const telemetryList = telemetryRes?.data || telemetryRes?.data?.value || []
    const attributeList = attributeRes?.data || attributeRes?.data?.list || attributeRes?.data?.value || []

    const dataMap: Record<string, any> = {}
    const kvMap: Record<string, any> = {}

    const processItem = (item: any) => {
      if (item?.key !== undefined) kvMap[item.key] = item.value
      if (item?.label) kvMap[item.label] = item.value
    }

    if (Array.isArray(telemetryList)) telemetryList.forEach(processItem)
    if (Array.isArray(attributeList)) attributeList.forEach(processItem)

    // 根据 platformFields 筛选所需数据
    platformFields.value.forEach(field => {
      const val = kvMap[field.id] ?? kvMap[field.name]
      if (val !== undefined) {
        dataMap[field.id] = val
      }
    })

    if (Object.keys(dataMap).length > 0) {
      currentData.value = dataMap
    }
  } catch (error) {
    console.error('获取设备数据失败:', error)
  }
}

/**
 * 启动数据更新
 */
const startDataUpdate = () => {
  fetchDeviceData()
  const interval = initialConfig.value?.refreshInterval ?? 5000
  if (interval > 0) {
    dataUpdateInterval = setInterval(fetchDeviceData, interval)
  }
}

/**
 * 停止数据更新
 */
const stopDataUpdate = () => {
  if (dataUpdateInterval) {
    clearInterval(dataUpdateInterval)
    dataUpdateInterval = null
  }
}

onMounted(() => {
  getDeviceDetail()
})

onBeforeUnmount(() => {
  stopDataUpdate()
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
        mode="viewer"
        :config="initialConfig"
        :platform-fields="platformFields"
        :data="currentData"
        height="calc(100vh - 250px)"
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
