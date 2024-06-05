<script lang="ts" setup>
import { ref, watch } from 'vue';
import type { ICardData } from '@/components/panel/card';
import LineChart from '@/card/chart-card/curve/modules/line-chart.vue';
import { colorGroups } from './theme';

const props = defineProps<{
  card: ICardData;
}>();

const lineChart = ref<InstanceType<typeof LineChart>>();

watch(
  () => props.card,
  newVal => {
    console.log('newVal', newVal);
  }
);

defineExpose({
  updateData: (deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    console.log('Curve updateData:', data);
    lineChart.value?.updateData(deviceId, metricsId, data);
  }
});
</script>

<template>
  <LineChart
    ref="lineChart"
    :card="props.card"
    :color-group="props?.card?.config?.colorGroups?.colorGroup || colorGroups"
  />
</template>

<style scoped>
:deep(.n-card__content) {
  width: 100%;
}
</style>
