<script lang="ts" setup>
import { ref } from 'vue'
import type { ICardData } from '@/components/panel/card'
import BarChart from '@/card/chart-card/bar/modules/bar-chart.vue'
import { colorGroups } from './theme'

const props = defineProps<{
  card: ICardData
}>()

const barChart = ref<InstanceType<typeof BarChart>>()

defineExpose({
  updateData: (deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    barChart.value?.updateData(deviceId, metricsId, data)
  }
})
</script>

<template>
  <BarChart
    ref="barChart"
    :card="props.card"
    :color-group="props?.card?.config?.colorGroups?.colorGroup || colorGroups"
  />
</template>

<style scoped>
:deep(.n-card__content) {
  width: 100%;
}
</style>
