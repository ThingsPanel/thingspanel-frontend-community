<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NIcon } from 'naive-ui'
import type { ICardData } from '@/components/panel/card'
import { getAttributeDataSet, telemetryDataCurrentKeys } from '@/service/api/device'
import { icons as iconOptions } from '@/components/common/icons'
import { createLogger } from '@/utils/logger'
import { $t } from '@/locales'

const logger = createLogger('Indicator')
const props = defineProps<{
  card: ICardData
}>()

const detail = ref<string>('')
const unit = ref<string>('') // Unit will be '%' for humidity
const fontSize = ref('14px')
const cardRef = ref(null)
let resizeObserver: ResizeObserver | null = null

// 简化的数组数据处理
const processWebSocketData = (data: any) => {
  if (!data) return null

  // 如果数据是数组，直接取第一个元素
  if (Array.isArray(data)) {
    return data.length > 0 ? data[0] : null
  }

  // 直接返回数据
  return data
}

const setSeries = async (dataSource: ICardData['dataSource']) => {
  if (!dataSource?.deviceSource?.[0]) return

  const { metricsType, deviceId, metricsId } = dataSource.deviceSource[0]

  if (metricsType === 'telemetry' && deviceId && metricsId) {
    const detailValue = await telemetryDataCurrentKeys({
      device_id: deviceId,
      keys: metricsId
    })
    unit.value = detailValue?.data?.[0]?.unit ?? '%'
    detail.value = detailValue?.data?.[0]?.value ?? ''
  } else if (metricsType === 'attributes' && deviceId && metricsId) {
    const res = await getAttributeDataSet({ device_id: deviceId })
    const attributeData = res.data.find(item => item.key === metricsId)
    detail.value = attributeData?.value ?? ''
    unit.value = attributeData?.unit ?? '%'
  }
}

const handleResize = (entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect
    const newFontSize = `${Math.min(width, height) / 10}px`
    fontSize.value = newFontSize
  }
}

watch(
  () => props.card?.dataSource?.deviceSource,
  () => {
    detail.value = ''
    unit.value = ''
    setSeries(props.card?.dataSource)
  },
  { deep: true }
)

onMounted(() => {
  setSeries(props.card?.dataSource)
  if (cardRef.value) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(cardRef.value)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

defineExpose({
  updateData: (_deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    // Only update detail value when data[metricsId] is not undefined, null or ''
    if (!metricsId || data[metricsId] === undefined || data[metricsId] === null || data[metricsId] === '') {
      logger.warn(`No data returned from websocket for ${metricsId}`)
      return
    }

    // 处理 WebSocket 数据
    const processedData = processWebSocketData(data[metricsId])

    if (processedData) {
      // 如果处理后的数据是对象，提取 value 和 unit
      if (typeof processedData === 'object' && processedData !== null) {
        // 检查是否有value属性
        if (processedData.value !== undefined) {
          detail.value = processedData.value
          if (processedData.unit) {
            unit.value = processedData.unit
          }
        } else {
          // 直接使用处理后的数据
          detail.value = processedData
        }
      } else {
        // 直接使用处理后的数据
        detail.value = processedData
      }

      logger.info(`WebSocket data updated for ${metricsId}:`, {
        original: data[metricsId],
        processed: processedData,
        detail: detail.value,
        unit: unit.value
      })
    } else {
      detail.value = data[metricsId]
    }
  }
})
</script>

<template>
  <div ref="cardRef" class="card-container">
    <div class="card-content" :style="{ fontSize: fontSize }">
      <div class="icon-container">
        <NIcon class="iconclass" :color="props?.card?.config?.color || 'blue'">
          <component :is="iconOptions[props?.card?.config?.iconName || 'Water']" />
        </NIcon>
      </div>
      <div class="value-container">
        <span class="value" :title="(detail || '45') + (props?.card?.config?.unit || unit || '%')">
          {{ detail !== null && detail !== '' ? detail : '45' }} {{ props?.card?.config?.unit || unit || '%' }}
        </span>
      </div>
      <div class="metric-name-container">
        <span class="metric-name" :title="card?.dataSource?.deviceSource?.[0]?.metricsName">
          {{ card?.dataSource?.deviceSource?.[0]?.metricsName || $t('card.humidity') }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-container {
  width: 100%;
  height: 100%;
}

.card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 5% 5%;
}

.icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.iconclass {
  font-size: 3em;
}

.value-container {
  display: flex;
  justify-content: center;
  align-items: baseline;
  width: 100%;
}

.value {
  font-size: 2em;
  font-weight: bold;
  text-wrap: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unit {
  margin-left: 0.3em;
  font-size: 2em;
}

.metric-name-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
}

.metric-name {
  font-size: 1em;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
}
</style>
