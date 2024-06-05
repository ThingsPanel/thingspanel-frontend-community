<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { CardData } from '@/components/tp-kan-ban/kan-ban';

const props = defineProps<{
  view?: boolean;
  card: CardData;
}>();

const cardData = ref<CardData>();
const initialOptions = ref({
  title: {
    text: '饼图示例',
    left: 'center',
    top: 0,
    subtext: '选择设备数据看看，大小随机，你也可以根据设备数据区接口取',
    textStyle: {
      color: '#ff0606'
    }
  },
  tooltip: {
    trigger: 'item'
  },
  legend: {
    bottom: 8,
    left: 'center'
  },
  series: [
    {
      name: 'Access From',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      padAngle: 5,
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 40,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      itemStyle: {
        shadowBlur: 200,
        shadowColor: 'rgba(255,0,0,0.5)'
      },
      data: [
        {
          value: 1048,
          name: 'Search Engine'
        }
      ]
    }
  ]
});

watch(
  () => cardData?.value?.config,
  v => {
    initialOptions.value.series[0].data = [{ value: 104, name: '固定值' }];
    initialOptions.value.series[0].itemStyle.shadowColor = v?.cardUI?.shadowColor;
    v?.source?.deviceSource?.forEach(item => {
      initialOptions.value.series[0].data.push({
        value: Math.floor(Math.random() * 401) + 100,
        name: `${item.metricsName}__${item.metricsId}`
      });
    });
  },
  { deep: true }
);

watch(
  () => props.card,
  () => {
    cardData.value = props.card;
  },
  { deep: true }
);
onMounted(() => {
  cardData.value = props.card;
});
</script>

<template>
  <ChartComponent :initial-options="initialOptions" />
</template>

<style scoped></style>
