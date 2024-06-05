<script setup lang="ts">
import { defineProps, reactive, ref, watch } from 'vue';
import { useFullscreen } from '@vueuse/core';
import dayjs from 'dayjs';
import { deviceTelemetryList } from '@/card/chart-card/curve/api';
import { $t } from '@/locales';
import ChartComponent from './ChartComponent.vue';
import AggregationSelector from './AggregationSelector.vue';
import { useLoading } from '~/packages/hooks';

const tableData = ref<any[]>([]);
const chartRef = ref();
const { isFullscreen, toggle } = useFullscreen(chartRef);

interface Created {
  deviceId: string;
  theKey: string;
}

const props = defineProps<Created>();
const selectedOption = ref();
const { loading, startLoading, endLoading } = useLoading();
const columns = [
  { title: $t('common.time'), key: 'x', render: row => dayjs(row.x).format('YYYY-MM-DD HH:mm:ss') },
  { title: $t('generate.fieldValue'), key: 'y' }
];
const pagination = reactive({
  page: 1,
  pageSize: 5,
  pageCount: 1,
  onChange: (page: number) => {
    pagination.page = page;
  }
});
const initialOptions = ref({
  baseOption: undefined,
  options: [],
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: ['test_key']
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  toolbox: {
    right: 44,
    feature: {
      myTool1: {
        show: true,
        title: $t('common.switchLineChart'),
        icon: 'path://M-7.5 -1.036L-5.428 -1.036L-2.714 -7.4562L-0.5545 3.6333L2.2763 -2.1158L3.1518 1.6196L7.5 1.6196M-7.5 7.4562L7.5 7.4562',
        onclick: () => {
          if (initialOptions.value.series) {
            if (initialOptions.value.series[0].type === 'line') {
              window.NMessage.destroyAll();
              window.NMessage.info($t('common.alreadyCurveChart'));
              return;
            }
            initialOptions.value.series[0].type = 'line';
          }
        }
      },
      myTool2: {
        show: true,
        title: $t('common.switchBarChart'),
        icon: 'path://M-6.2277 -1.9018L-3.5491 -1.9018L-3.5491 4.8214L-6.2277 4.8214L-6.2277 -1.9018ZM-1.3527 -4.5536L1.3259 -4.5536L1.3259 4.8214L-1.3527 4.8214L-1.3527 -4.5536ZM3.5491 -7.5L6.2277 -7.5L6.2277 4.8214L3.5491 4.8214L3.5491 -7.5ZM-7.192 7.5L7.192 7.5\n',
        onclick: () => {
          if (initialOptions.value.series) {
            if (initialOptions.value.series[0].type === 'bar') {
              window.NMessage.destroyAll();
              window.NMessage.info($t('common.alreadyToChart'));
              return;
            }
            initialOptions.value.series[0].type = 'bar';
          }
        }
      },
      myTool3: {
        show: true,
        title: $t('common.alreadyToChart'),
        icon: 'path://M6 6V42H42 M20 24C22.2091 24 24 22.2091 24 20C24 17.7909 22.2091 16 20 16C17.7909 16 16 17.7909 16 20C16 22.2091 17.7909 24 20 24Z M37 16C39.7614 16 42 13.7614 42 11C42 8.23858 39.7614 6 37 6C34.2386 6 32 8.23858 32 11C32 13.7614 34.2386 16 37 16Z M15 36C16.6569 36 18 34.6569 18 33C18 31.3431 16.6569 30 15 30C13.3431 30 12 31.3431 12 33C12 34.6569 13.3431 36 15 36Z M33 32C34.6569 32 36 30.6569 36 29C36 27.3431 34.6569 26 33 26C31.3431 26 30 27.3431 30 29C30 30.6569 31.3431 32 33 32Z\n',
        onclick: () => {
          if (initialOptions.value.series) {
            if (initialOptions.value.series[0].type === 'scatter') {
              window.NMessage.destroyAll();
              window.NMessage.info($t('common.alreadyScatterPlot'));
              return;
            }
            initialOptions.value.series[0].type = 'scatter';
          }
        }
      }
    }
  },
  xAxis: {
    boundaryGap: false,
    type: 'time' as 'category'
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      data: [] as any[],
      type: 'line',
      smooth: true
    }
  ]
});
watch(
  selectedOption,
  async v => {
    // 这里是当 selectedOption 变化时需要执行的逻辑

    if (v.time_range === 'custom' && (!v.start_time || !v.end_time)) {
      window.NMessage.destroyAll();
      window.NMessage.info($t('common.rangeMustSelected'));
      return;
    }
    startLoading();
    const { data, error } = await deviceTelemetryList({
      ...v
    });
    if (!error && data && initialOptions.value.series) {
      tableData.value = data;
      // 这里是当 通过接口改变 initialOptions的数据
      initialOptions.value.series.forEach(series => {
        series.data = data.map(item => {
          return [item.x, item.y];
        });
      });
      endLoading();
    }
  },
  { deep: true }
);
</script>

<template>
  <n-card ref="chartRef" :bordered="false" class="m-0 p-0">
    <div :class="`${isFullscreen ? 'm-0' : 'mb-4 mt--16 ml--26px mr--36px'} flex items-center justify-between`">
      <div :class="`${isFullscreen ? 'top-36px' : 'top-56px'} relative  z-9999`">
        <AggregationSelector v-model:value="selectedOption" :device_id="props.deviceId" :thekey="props.theKey" />
      </div>
      <div class="relative right-0px top-56px z-9999">
        <FullScreen v-if="!isFullscreen" :full="isFullscreen" @click="toggle" />
      </div>
    </div>
    <div :class="`${isFullscreen ? 'h-full' : 'h-320px'}  p-2 `">
      <ChartComponent :initial-options="initialOptions" />
    </div>
  </n-card>
  <div class="mt-8">
    <n-data-table :loading="loading" :columns="columns" :data="tableData" :pagination="pagination" />
  </div>
</template>

<style scoped></style>
