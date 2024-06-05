<script setup lang="ts">
import { watch } from 'vue';
import { $t } from '@/locales';
import { useEcharts } from '@/hooks/chart/use-echarts';
import type { ICardData } from '@/components/panel/card';

const props = defineProps<{
  card: ICardData;
  // mode: IConfigCtx['view'];
}>();

defineOptions({
  name: 'LineChart'
});

const { domRef, updateOptions } = useEcharts(() => ({
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    }
  },
  legend: {
    data: [$t('page.home.downloadCount'), $t('page.home.registerCount')]
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: [] as string[]
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      color: '#8e9dff',
      name: $t('page.home.downloadCount'),
      type: 'line',
      smooth: true,
      stack: 'Total',
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0.25,
              color: '#8e9dff'
            },
            {
              offset: 1,
              color: '#fff'
            }
          ]
        }
      },
      emphasis: {
        focus: 'series'
      },
      data: [] as number[]
    },
    {
      color: '#26deca',
      name: $t('page.home.registerCount'),
      type: 'line',
      smooth: true,
      stack: 'Total',
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0.25,
              color: '#26deca'
            },
            {
              offset: 1,
              color: '#fff'
            }
          ]
        }
      },
      emphasis: {
        focus: 'series'
      },
      data: []
    }
  ]
}));

async function mockData() {
  await new Promise(resolve => {
    setTimeout(resolve, 1000);
  });

  updateOptions(opts => {
    opts.xAxis.data = props.card.config?.times || [];
    opts.series[0].data = [4623, 6145, 6268, 6411, 1890, 4251, 2978, 3880, 3606, 4311];
    opts.series[1].data = [2208, 2016, 2916, 4512, 8281, 2008, 1963, 2367, 2956, 678];
    opts.series[0].color = props.card.config?.color || '#8e9dff';
    opts.series[0].areaStyle.color.colorStops[0].color = props.card.config?.color || '#8e9dff';

    return opts;
  });
}

async function init() {
  mockData();
}

watch(
  () => props.card.config,
  () => {
    init();
  }
);

// init
init();
</script>

<template>
  <div ref="domRef" class="h-360px w-full"></div>
</template>

<style scoped></style>
