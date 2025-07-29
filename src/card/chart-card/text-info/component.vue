<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import type { ICardData } from '@/components/panel/card'
import { getAttributeDataSet } from '@/service/api/device'
import { $t } from '@/locales'

const props = defineProps<{
  card: ICardData
}>()

const detail = ref<number | string>()
const unit = ref<string>('')
const fontSize = ref('14px')
const cardRef = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null

const setSeries = async (dataSource: ICardData['dataSource']) => {
  if (!dataSource?.deviceSource?.[0]) return

  const { metricsType, deviceId, metricsId } = dataSource.deviceSource[0]

  if (metricsType === 'attributes' && deviceId && metricsId) {
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

watch(
  () => props.card?.dataSource?.deviceSource,
  () => {
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
  }
})

defineExpose({
  updateData: (_deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    if (metricsId && data[metricsId] !== undefined && data[metricsId] !== null && data[metricsId] !== '') {
      detail.value = data[metricsId]
    }
  }
})
</script>

<template>
  <div ref="cardRef" class="card-container">
    <div class="card-content" :style="{ fontSize: fontSize }">
      <div class="metric-name">
        {{ props.card?.dataSource?.deviceSource?.[0]?.metricsName || $t('card.firmVersion') }}
      </div>
      <div class="value-container">
        <span class="value">{{ detail ?? '1.9.2' }}</span>
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
  justify-content: center;
}

.value-container {
  display: flex;
  align-items: baseline;
  justify-content: center;
}

.value {
  font-size: 3em;
  font-weight: bold;
}

.metric-name {
  text-align: center;
  font-size: 0.9em;
  margin-top: 10px;
}
</style>
