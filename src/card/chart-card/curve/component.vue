<script lang="ts" setup>
import { ref } from 'vue'
import type { ICardData } from '@/components/panel/card'
import LineChart from '@/card/chart-card/curve/modules/line-chart.vue'
import { colorGroups } from './theme'

const props = defineProps<{
  card: ICardData
}>()

const lineChart = ref<InstanceType<typeof LineChart>>()

defineExpose({
  updateData: (deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    lineChart.value?.updateData(deviceId, metricsId, data)
  }
})
</script>

<template>
  <LineChart
    ref="lineChart"
    :card="props.card"
    :color-group="props?.card?.config?.colorGroups?.colorGroup || colorGroups"
    :curve-width="props?.card?.config?.curveWidth || 1"
  />
</template>

<style scoped></style>
