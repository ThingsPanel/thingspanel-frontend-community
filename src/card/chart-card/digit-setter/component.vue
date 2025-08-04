<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NSlider } from 'naive-ui'
import type { ICardData } from '@/components/panel/card'
import { $t } from '@/locales'
import { attributeDataPub, getAttributeDataSet, telemetryDataCurrentKeys, telemetryDataPub } from '@/service/api/device'

const props = defineProps<{
  card: ICardData
}>()

const detail = ref<number>(0)
const unit = ref<string>('')
const fontSize = ref('14px')
const cardRef = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

const config = computed(() => props.card?.config || {})
const min = computed(() => Number(config.value.min) || 0)
const max = computed(() => Number(config.value.max) || 100)
const step = computed(() => Number(config.value.step) || 0.1)
const decimals = computed(() => Number(config.value.decimals) || 1)

const formattedDetail = computed(() => detail.value.toFixed(decimals.value))

const setSeries = async (dataSource: ICardData['dataSource']) => {
  if (!dataSource?.deviceSource?.[0]) return

  const { metricsType, deviceId, metricsId } = dataSource.deviceSource[0]

  if (metricsType === 'telemetry' && deviceId && metricsId) {
    const detailValue = await telemetryDataCurrentKeys({
      device_id: deviceId,
      keys: metricsId
    })
    unit.value = detailValue?.data?.[0]?.unit
    detail.value = detailValue?.data?.[0]?.value
  } else if (metricsType === 'attributes' && deviceId && metricsId) {
    const res = await getAttributeDataSet({ device_id: deviceId })
    const attributeData = res.data.find(item => item.key === metricsId)
    detail.value = attributeData?.value
    if (attributeData?.unit) {
      unit.value = attributeData.unit
    }
  }
}

const handleResize = (entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect
    const newFontSize = `${Math.min(width, height) / 10}px`
    fontSize.value = newFontSize
  }
}

const updateValue = async (value: number) => {
  const dataSource = props.card?.dataSource
  if (!dataSource?.deviceSource?.[0]) return

  const { metricsType, deviceId, metricsId } = dataSource.deviceSource[0]
  if (!deviceId || !metricsId) return

  const obj = {
    device_id: deviceId,
    value: JSON.stringify({
      [metricsId]: value
    })
  }

  if (metricsType === 'attributes') {
    await attributeDataPub(obj)
  } else if (metricsType === 'telemetry') {
    await telemetryDataPub(obj)
  }

  detail.value = value
}

watch(
  () => props.card?.dataSource?.deviceSource,
  () => {
    setSeries(props.card?.dataSource)
  },
  { deep: true }
)

watch(
  () => props.card?.config,
  () => {
    // 配置变化时可能需要重新设置一些值，比如detail的范围等
    detail.value = Math.max(min.value, Math.min(max.value, detail.value))
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
  }
})

defineExpose({
  updateData: (_deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    if (metricsId && data[metricsId] !== undefined) {
      detail.value = Number(data[metricsId])
    }
  }
})
</script>

<template>
  <div ref="cardRef" class="card-container">
    <div class="card-content" :style="{ fontSize: fontSize }">
      <div class="value-container">
        <span class="value">{{ formattedDetail }}</span>
        <span class="unit">{{ unit }}</span>
      </div>
      <NSlider v-model:value="detail" :min="min" :max="max" :step="step" @update:value="updateValue" />
      <div class="metric-name">
        {{ props.card?.dataSource?.deviceSource?.[0]?.metricsName || $t('generate.device') + '1' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px;
  box-sizing: border-box;
}

.card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.value-container {
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.value {
  font-size: 2em;
  font-weight: bold;
}

.unit {
  font-size: 0.8em;
  margin-left: 5px;
}

.metric-name {
  text-align: center;
  font-size: 0.9em;
  margin-top: 10px;
}
</style>
