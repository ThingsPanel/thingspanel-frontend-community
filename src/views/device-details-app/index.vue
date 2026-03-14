
<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ThingsVisWidget from '@/components/thingsvis/ThingsVisWidget.vue'
import { extractPlatformFields } from '@/utils/thingsvis/platform-fields'
import { normalizeThingsVisHistoryBindings } from '@/utils/thingsvis/normalize-history-bindings'
import { $t, setLocale } from '@/locales'
import { deviceDetail, deviceTemplateDetail, telemetryDataCurrent, getAttributeDataSet } from '@/service/api/device'
import { telemetryApi, attributesApi, eventsApi, commandsApi } from '@/service/api'
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
const viewerPlatformDevices = computed(() => {
  if (!d_id || platformFields.value.length === 0) return []
  return [
    {
      deviceId: d_id as string,
      deviceName: deviceData.value?.name || device_number.value || 'Device',
      fields: platformFields.value
    }
  ]
})

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
  if (Object.keys(fields).length === 0) return
  currentData.value = {
    ...currentData.value,
    ...fields
  }
  visWidgetRef.value?.pushPlatformData(fields, d_id as string)
}

const pushHistoryToVis = (fieldId: string, history: Array<{ value: unknown; ts: number }>) => {
  visWidgetRef.value?.pushHistory(fieldId, history, d_id as string)
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
        // 与设备详情图表 Tab 保持一致，运行时字段必须包含 telemetry/attributes/events/commands。
        const [telemetryRes, attributesRes, eventsRes, commandsRes] = await Promise.all([
          telemetryApi({ page: 1, page_size: 1000, device_template_id: templateId }),
          attributesApi({ page: 1, page_size: 1000, device_template_id: templateId }),
          eventsApi({ page: 1, page_size: 1000, device_template_id: templateId }),
          commandsApi({ page: 1, page_size: 1000, device_template_id: templateId })
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

        const eventsList = Array.isArray(eventsRes?.data?.list)
          ? eventsRes.data.list
          : Array.isArray(eventsRes?.data)
            ? eventsRes.data
            : []

        const commandsList = Array.isArray(commandsRes?.data?.list)
          ? commandsRes.data.list
          : Array.isArray(commandsRes?.data)
            ? commandsRes.data
            : []

        const platformSource = {
          telemetry: telemetryList,
          attributes: attributesList,
          events: eventsList,
          commands: commandsList
        }

        const extractedFields = extractPlatformFields(platformSource)
        platformFields.value = extractedFields.length > 0 ? extractedFields : extractPlatformFields(res.data)

        // 加载 app_chart_config
        if (res.data.app_chart_config) {
          try {
            const configJson = normalizeThingsVisHistoryBindings(JSON.parse(res.data.app_chart_config))

            // ⚠️ CRITICAL: 为所有 PLATFORM_FIELD datasource 注入真实设备 ID
            // 编辑器保存时不含 deviceId（防止误导和冗余）
            // 运行时需要根据当前设备动态注入
            if (configJson.dataSources && Array.isArray(configJson.dataSources)) {
              configJson.dataSources.forEach((ds: any) => {
                if (ds.type === 'PLATFORM_FIELD') {
                  ds.config = ds.config || {}
                  ds.config.deviceId = d_id as string
                }
              })
            }

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
      pushDataToVis(dataMap)
    }
  } catch (error) {
    console.error('[DeviceDetailsApp] 获取设备数据失败:', error)
  }
}

/**
 * ThingsVis ready 回调
 */
const onVisReady = async () => {
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
  <div class="device-details-app">
    <section class="device-details-app__shell">
      <n-card class="device-details-app__panel" content-style="padding: 0;">
        <div class="device-details-app__header">
          <div>
            <div class="device-details-app__eyebrow">ThingsPanel Device</div>
            <h1 class="device-details-app__title">{{ deviceData?.name || '--' }}</h1>
          </div>
          <div class="device-details-app__status">
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

        <div class="device-details-app__meta">
          <div class="device-details-app__meta-pill">
            <span>ID</span>
            <strong>{{ d_id || '--' }}</strong>
          </div>
          <div class="device-details-app__meta-pill">
            <span>{{ $t('custom.device_details.lastUpdate') }}</span>
            <strong>{{ formatDateTime(deviceData?.ts) || '--' }}</strong>
          </div>
        </div>

        <div class="device-details-app__divider"></div>
      </n-card>

      <div class="device-details-app__content">
        <TelemetryDataCards
          v-if="showDefaultCards"
          :id="d_id as string"
          :card-height="cardHeight"
          :card-margin="cardMargin"
        />
        <n-card v-if="showAppChart" class="device-details-app__viewer" content-style="padding: 0;">
          <ThingsVisWidget
            ref="visWidgetRef"
            mode="viewer"
            :config="initialConfig"
            :data="currentData"
            :platform-fields="platformFields"
            :platform-devices="viewerPlatformDevices"
            height="calc(100vh - 220px)"
            :buffer-size="100"
            :device-id="d_id as string"
            @ready="onVisReady"
          />
        </n-card>
      </div>
    </section>
  </div>
</template>

<style scoped>
.color-ccc {
  color: #ccc;
}

.device-details-app {
  min-height: 100vh;
  padding: 24px;
  background: transparent;
  box-sizing: border-box;
}

.device-details-app__shell {
  min-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.device-details-app__panel {
  overflow: hidden;
  border-radius: 16px;
}

.device-details-app__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px 10px;
  flex-wrap: wrap;
}

.device-details-app__eyebrow {
  display: none;
}

.device-details-app__title {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  font-weight: 600;
  color: inherit;
}

.device-details-app__status {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #fafafa;
  border: 1px solid #e5e7eb;
}

.device-details-app__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0 18px 14px;
}

.device-details-app__meta-pill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 10px;
  background: #fafafa;
  border: 1px solid #e5e7eb;
  color: #666;
}

.device-details-app__meta-pill strong {
  color: inherit;
  font-weight: 600;
}

.device-details-app__divider {
  height: 1px;
  margin: 0 18px;
  background: #e5e7eb;
}

.device-details-app__content {
  padding: 0;
}

.device-details-app__viewer {
  border-radius: 16px;
  overflow: hidden;
}

@media (max-width: 768px) {
  .device-details-app {
    padding: 16px;
  }

  .device-details-app__shell {
    min-height: calc(100vh - 32px);
    gap: 12px;
  }

  .device-details-app__panel {
    border-radius: 14px;
  }

  .device-details-app__header {
    padding: 14px 16px 8px;
  }

  .device-details-app__title {
    font-size: 24px;
  }

  .device-details-app__meta {
    padding: 0 16px 12px;
  }

  .device-details-app__divider {
    margin: 0 16px;
  }

  .device-details-app__content {
    padding: 0;
  }

  .device-details-app__viewer {
    border-radius: 14px;
  }
}
</style>
