<template>
  <div class="thingsvis-frame-container">
    <iframe ref="iframeRef" v-if="url && token" :src="url" class="thingsvis-frame" frameborder="0" allowfullscreen></iframe>
    <div v-else class="loading-placeholder">正在连接可视化引擎...</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { getThingsVisToken } from '@/utils/thingsvis'
import {
  deviceList,
  deviceTemplateDetail,
  getDeviceConfigList,
  telemetryDataCurrent,
  getAttributeDataSet,
  telemetryDataHistoryList
} from '@/service/api/device'
import { attributesApi, commandsApi, eventsApi, getOnlineDeviceTrend, telemetryApi } from '@/service/api'
import { extractPlatformFields } from '@/utils/thingsvis/platform-fields'

const props = defineProps<{
  id: string
  mode?: string
}>()

type HistoryPoint = { value: unknown; ts: number }
type RequestedFieldResult = {
  fields: Record<string, unknown>
  histories: Array<{ fieldId: string; history: HistoryPoint[]; deviceId?: string }>
}

const token = ref('')
const url = ref('')
const iframeRef = ref<HTMLIFrameElement>()

/** Strip any hash fragment and return the bare Studio HTML base URL. */
function getStudioBase(): string {
  const raw = (import.meta.env.VITE_THINGSVIS_STUDIO_URL as string) || 'http://localhost:3000/main'
  const hashIdx = raw.indexOf('#')
  return hashIdx !== -1 ? raw.substring(0, hashIdx) : raw
}

function normalizeHistory(records: any[], valueKey: string): HistoryPoint[] {
  return records
    .map((item: any) => ({
      value: item?.[valueKey] ?? item?.value ?? item?.avg ?? item?.y ?? 0,
      ts: new Date(item?.timestamp || item?.time || item?.x || item?.ts || Date.now()).getTime()
    }))
    .filter((point) => !Number.isNaN(point.ts))
}

function unwrapList(payload: any): any[] {
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload)) return payload
  return []
}

function parsePresetMap(rawConfig: unknown): Record<string, unknown[]> | null {
  if (!rawConfig) return null
  try {
    const parsed = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : rawConfig
    return parsed?.device_widget_presets && typeof parsed.device_widget_presets === 'object'
      ? parsed.device_widget_presets
      : null
  } catch {
    return null
  }
}

async function loadTemplateEntry(templateId: string | number) {
  const [detailRes, telemetryRes, attributesRes, eventsRes, commandsRes] = await Promise.all([
    deviceTemplateDetail({ id: templateId }),
    telemetryApi({ page: 1, page_size: 1000, device_template_id: templateId }),
    attributesApi({ page: 1, page_size: 1000, device_template_id: templateId }),
    eventsApi({ page: 1, page_size: 1000, device_template_id: templateId }),
    commandsApi({ page: 1, page_size: 1000, device_template_id: templateId })
  ])

  const detail = detailRes?.data || {}
  const platformSource = {
    telemetry: unwrapList(telemetryRes?.data),
    attributes: unwrapList(attributesRes?.data),
    events: unwrapList(eventsRes?.data),
    commands: unwrapList(commandsRes?.data)
  }
  const extractedFields = extractPlatformFields(platformSource)
  const fallbackFields = extractPlatformFields(detail)

  return {
    groupName: detail?.name || detail?.template_name || '设备字段',
    fields: extractedFields.length > 0 ? extractedFields : fallbackFields,
    presetsMap: parsePresetMap(detail?.web_chart_config)
  }
}

async function buildRequestedFieldData(fieldIds: unknown[], deviceId?: string): Promise<RequestedFieldResult> {
  const requestedFields = Array.isArray(fieldIds)
    ? fieldIds.filter((fieldId): fieldId is string => typeof fieldId === 'string')
    : []

  if (requestedFields.length === 0) {
    return { fields: {}, histories: [] }
  }

  const currentFieldIds = requestedFields.filter((fieldId) => !fieldId.endsWith('__history'))
  const historyFieldIds = requestedFields
    .filter((fieldId) => fieldId.endsWith('__history'))
    .map((fieldId) => fieldId.replace(/__history$/, ''))

  if (deviceId) {
    const result: RequestedFieldResult = { fields: {}, histories: [] }

    if (currentFieldIds.length > 0) {
      const [telemetryRes, attributeRes] = await Promise.all([
        telemetryDataCurrent(deviceId),
        getAttributeDataSet({ device_id: deviceId })
      ])

      const kvMap: Record<string, unknown> = {}
      const collect = (item: any) => {
        if (item?.key !== undefined) kvMap[item.key] = item.value
        if (item?.label) kvMap[item.label] = item.value
      }

      if (Array.isArray(telemetryRes?.data)) telemetryRes.data.forEach(collect)
      if (Array.isArray(attributeRes?.data)) attributeRes.data.forEach(collect)

      currentFieldIds.forEach((fieldId) => {
        if (kvMap[fieldId] !== undefined) result.fields[fieldId] = kvMap[fieldId]
      })
    }

    if (historyFieldIds.length > 0) {
      const historyResults = await Promise.allSettled(
        historyFieldIds.map(async (fieldId) => {
          const historyRes = await telemetryDataHistoryList({
            device_id: deviceId,
            key: fieldId,
            time_range: 'custom',
            start_time: Date.now() - 3600 * 1000,
            end_time: Date.now(),
            aggregate_window: '1m',
            aggregate_function: 'avg'
          })
          const list = Array.isArray(historyRes?.data?.list) ? historyRes.data.list : []
          const history = normalizeHistory(list, 'value')
          if (history.length > 0) {
            result.histories.push({ fieldId, history, deviceId })
          }
        })
      )

      historyResults.forEach((item) => {
        if (item.status === 'rejected') {
          console.warn('[AppFrame] Device history fetch failed:', item.reason)
        }
      })
    }

    return result
  }

  const result: RequestedFieldResult = { fields: {}, histories: [] }
  const devRes = await deviceList({ page: 1, page_size: 1000 })
  const devices = devRes?.data?.list || devRes?.data || []
  const deviceTotal = Array.isArray(devices) ? devices.length : 0
  const deviceOnline = Array.isArray(devices)
    ? devices.filter((device: any) => Number(device?.is_online || 0) !== 0).length
    : 0
  const aggregateValues: Record<string, unknown> = {
    device_total: deviceTotal,
    device_online: deviceOnline,
    device_offline: Math.max(0, deviceTotal - deviceOnline),
    device_activity: deviceOnline
  }

  currentFieldIds.forEach((fieldId) => {
    if (aggregateValues[fieldId] !== undefined) result.fields[fieldId] = aggregateValues[fieldId]
  })

  if (historyFieldIds.some((fieldId) => fieldId === 'device_online' || fieldId === 'device_offline')) {
    const trendRes = await getOnlineDeviceTrend()
    const points = Array.isArray(trendRes?.data?.points) ? trendRes.data.points : []

    if (historyFieldIds.includes('device_online')) {
      const history = normalizeHistory(points, 'device_online')
      if (history.length > 0) result.histories.push({ fieldId: 'device_online', history })
    }

    if (historyFieldIds.includes('device_offline')) {
      const history = normalizeHistory(points, 'device_offline')
      if (history.length > 0) result.histories.push({ fieldId: 'device_offline', history })
    }
  }

  return result
}

async function buildPlatformDevices() {
  try {
    const [devRes, confRes] = await Promise.all([
      deviceList({ page: 1, page_size: 1000 }),
      getDeviceConfigList({ page: 1, page_size: 1000 })
    ])

    const devices = unwrapList(devRes?.data)
    const configs = unwrapList(confRes?.data)
    const configTemplateMap = new Map(configs.map((config: any) => [config.id, config.device_template_id]))
    const templateIds = Array.from(
      new Set(
        devices
          .map((device: any) => device?.device_config?.device_template_id || configTemplateMap.get(device?.device_config_id))
          .filter((templateId): templateId is string | number => Boolean(templateId))
      )
    )

    const templateEntries = new Map<string | number, Awaited<ReturnType<typeof loadTemplateEntry>>>()
    const templateResults = await Promise.allSettled(
      templateIds.map(async (templateId) => {
        const entry = await loadTemplateEntry(templateId)
        templateEntries.set(templateId, entry)
      })
    )

    templateResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn('[AppFrame] Failed to load template fields:', templateIds[index], result.reason)
      }
    })

    const platformDevices = devices
      .map((device: any) => {
        const templateId = device?.device_config?.device_template_id || configTemplateMap.get(device?.device_config_id)
        if (!templateId) return null

        const templateEntry = templateEntries.get(templateId)
        if (!templateEntry) return null

        const presets: any[] = []
        Object.values(templateEntry.presetsMap || {}).forEach((arr: any) => {
          if (Array.isArray(arr)) presets.push(...arr)
        })

        if (presets.length === 0 && templateEntry.fields.length === 0) {
          return null
        }

        return {
          deviceId: device.id,
          deviceName: device.name || device.device_number,
          groupName: templateEntry.groupName,
          fields: templateEntry.fields,
          presets
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))

    console.log('[AppFrame] platformDevices assembled:', platformDevices.length)
    return platformDevices
  } catch (err) {
    console.error('[AppFrame] Failed to assemble platformDevices', err)
    return []
  }
}

const handleMessage = async (event: MessageEvent) => {
  if (!event.data || typeof event.data !== 'object') return

  const { type, projectId } = event.data

  if (type === 'thingsvis:requestFieldData') {
    const payload = event.data?.payload || {}
    if (!iframeRef.value?.contentWindow) return

    try {
      const result = await buildRequestedFieldData(payload.fieldIds, payload.deviceId)
      if (Object.keys(result.fields).length > 0) {
        iframeRef.value.contentWindow.postMessage(
          {
            type: 'tv:platform-data',
            payload: {
              deviceId: payload.deviceId,
              fields: result.fields
            }
          },
          '*'
        )
      }

      result.histories.forEach((item) => {
        iframeRef.value?.contentWindow?.postMessage(
          {
            type: 'tv:platform-history',
            payload: {
              deviceId: item.deviceId,
              fieldId: item.fieldId,
              history: item.history
            }
          },
          '*'
        )
      })
    } catch (err) {
      console.error('[AppFrame] Failed to fulfill field data request', err)
    }
    return
  }

  if (type === 'tv:ready' || type === 'READY') {
    if (iframeRef.value?.contentWindow && token.value) {
      console.log('[AppFrame] Iframe ready, sending init postMessage')
      const apiBaseUrl = window.location.origin + '/thingsvis-api'

      const platformDevices = await buildPlatformDevices()

      iframeRef.value.contentWindow.postMessage(
        {
          type: 'tv:init',
          platformDevices,
          data: {
            meta: { id: props.id }
          },
          config: {
            mode: 'app',
            saveTarget: 'self',
            token: token.value,
            apiBaseUrl: apiBaseUrl
          }
        },
        '*'
      )
    }
  }

  if (type === 'tv:preview') {
    if (!token.value) return
    const previewUrl = `${getStudioBase()}#/preview?projectId=${projectId || props.id}&token=${token.value}&mode=embedded`
    window.open(previewUrl, '_blank')
  }

  if (type === 'tv:publish') {
    try {
      const { publishThingsVisDashboard } = await import('@/service/api/thingsvis')
      const res = await publishThingsVisDashboard(projectId || props.id)

      if (res.data) {
        if ((window as any).$message) {
          ;(window as any).$message.success('发布成功')
        } else {
          alert('发布成功')
        }
      } else {
        console.error('[AppFrame] Publish failed:', res.error)
        if ((window as any).$message) {
          ;(window as any).$message.error(`发布失败: ${res.error?.message || '未知错误'}`)
        }
      }
    } catch (e) {
      console.error('[AppFrame] Publish exception:', e)
    }
  }
}

onMounted(async () => {
  window.addEventListener('message', handleMessage)

  try {
    const tokenStr = await getThingsVisToken()
    if (tokenStr) {
      token.value = tokenStr
      const apiBaseUrl = encodeURIComponent(window.location.origin + '/thingsvis-api')
      url.value = `${getStudioBase()}#/editor/${props.id}?mode=embedded&token=${tokenStr}&apiBaseUrl=${apiBaseUrl}`
    } else {
      console.warn('[AppFrame] Token acquisition returned null')
    }
  } catch (error) {
    console.error('[AppFrame] Failed to acquire ThingsVis token:', error)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage)
})
</script>

<style scoped>
.thingsvis-frame-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #1a1a1a;
}

.thingsvis-frame {
  width: 100%;
  height: 100%;
  display: block;
}

.loading-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #888;
}
</style>
