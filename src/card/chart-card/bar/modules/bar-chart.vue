<script lang="ts" setup>
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useMessage } from 'naive-ui';
import { debounce } from 'lodash';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { v4 as uuid4 } from 'uuid';
import VChart from 'vue-echarts';
import * as echarts from 'echarts';
import { GridComponent, LegendComponent, ToolboxComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { ComposeOption } from 'echarts/core';
import type { LineSeriesOption } from 'echarts/charts';
import type {
  GridComponentOption,
  LegendComponentOption,
  ToolboxComponentOption,
  TooltipComponentOption
} from 'echarts/components';
import type { ICardData } from '@/components/panel/card';
import { telemetryDataCurrentKeys, telemetryDataHistoryList } from '@/service/api/device';
import { createLogger } from '@/utils/logger';
import TelemetryDataHistoryListFilter from '@/components/TelemetryDataHistoryListFilter/index.vue';

const logger = createLogger('Chart');
type EChartsOption = ComposeOption<
  TooltipComponentOption | LegendComponentOption | ToolboxComponentOption | GridComponentOption | LineSeriesOption
>;
use([TooltipComponent, LegendComponent, ToolboxComponent, GridComponent, LineChart, CanvasRenderer]);
const chartContainer = ref<HTMLDivElement | null>(null);
const chartRef = ref();

const legendColor = ref('auto');

const detail: any = ref(null);

const props = defineProps<{
  card: ICardData;
  colorGroup: { name: string; top: string; bottom: string; line: string }[];
}>();

const sampleData = [
  [1716986172333, 8],
  [1716986177338, 21],
  [1716986182345, 10],
  [1716986187352, 13],
  [1716986192360, 20],
  [1716986197366, 17],
  [1716986202373, 19],
  [1716986207380, 17],
  [1716986212387, 16],
  [1716986217394, 19],
  [1716986222401, 10],
  [1716986227414, 13],
  [1716986232415, 18],
  [1716986237422, 19],
  [1716986242428, 19],
  [1716986247435, 23],
  [1716986252442, 25],
  [1716986257451, 21],
  [1716986262457, 21],
  [1716986267465, 22],
  [1716986272471, 29],
  [1716986277478, 22],
  [1716986282485, 20],
  [1716986287494, 19],
  [1716986292499, 15],
  [1716986297505, 12],
  [1716986302513, 21],
  [1716986307522, 28],
  [1716986307964, 21],
  [1716986312528, 22],
  [1716986312870, 22],
  [1716986317533, 21],
  [1716986317876, 14],
  [1716986322540, 18],
  [1716986322866, 21],
  [1716986327547, 23],
  [1716986327882, 21],
  [1716986332553, 21],
  [1716986332897, 21],
  [1716986337557, 23],
  [1716986337893, 25],
  [1716986342565, 20]
];
const legendData = ref<any[]>([]);

const option = ref<EChartsOption>({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: legendData.value,
    textStyle: {
      color: legendColor.value,
      fontSize: '1.1em'
    }
  },
  dataZoom: [
    {
      type: 'slider',
      show: true,
      start: 0,
      end: 100,
      xAxisIndex: [0],
      bottom: 20
    },
    {
      type: 'inside',
      start: 0,
      end: 30,
      xAxisIndex: [0]
    }
  ],
  grid: {
    left: '3%',
    right: '4%',
    bottom: '50px',
    containLabel: true
  },
  xAxis: {
    boundaryGap: false,
    type: 'time' as 'category',
    axisLabel: {
      interval: 'auto',
      color: legendColor.value
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: legendColor.value
    }
  },
  series: [] as any[]
});
const updateLegendColor = () => {
  if (chartContainer.value) {
    // @ts-ignore // 或者使用 as any
    const computedStyle = window.getComputedStyle(chartContainer.value as Element);
    legendColor.value = computedStyle.color;

    // 使用 as any 来绕过 legend/axisLabel 的类型检查
    const legendOption = option.value.legend as any;
    if (legendOption && legendOption.textStyle) {
      legendOption.textStyle.color = legendColor.value;
    }

    const xAxisOption = option.value.xAxis as any;
    if (xAxisOption && xAxisOption.axisLabel) {
      xAxisOption.axisLabel.color = legendColor.value;
    }

    const yAxisOption = option.value.yAxis as any;
    if (yAxisOption && yAxisOption.axisLabel) {
      yAxisOption.axisLabel.color = legendColor.value;
    }
  }
};

const params = reactive({
  start_time: undefined as number | undefined,
  end_time: undefined as number | undefined,
  aggregate_window: 'no_aggregate' as any,
  aggregate_function: undefined as (string | undefined),
  time_range: 'last_1h' as any
});

const getTelemetryData = async (device_id, key, index, metricName) => {
  const sampleObj = {
    name: metricName,
    type: 'line',
    stack: 'Total',
    smooth: true,
    showSymbol: false,
    itemStyle: {
      opacity: 0.8,
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: props.colorGroup[index].top },
        { offset: 1, color: props.colorGroup[index].bottom }
      ])
    },
    areaStyle: { 
        opacity: 0.8,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
           { offset: 0, color: props.colorGroup[index].top },
           { offset: 1, color: props.colorGroup[index].bottom }
        ])
    },
    emphasis: {
      focus: 'series'
    },
    data: sampleData,
    tooltip: {
      valueFormatter: value => value + (detail?.value?.data[0]?.unit || '')
    }
  };
  if (!device_id || !key) {
      logger.warn('Skipping fetch: Missing device_id or key');
      return sampleObj;
  }

  const metricsParams: any = {
    device_id,
    key,
    aggregate_window: params.aggregate_window,
    time_range: params.time_range,
  };

  if (params.aggregate_window !== 'no_aggregate' && params.aggregate_function) {
      metricsParams.aggregate_function = params.aggregate_function;
  }
  if (params.time_range === 'custom' && params.start_time && params.end_time) {
      metricsParams.start_time = params.start_time;
      metricsParams.end_time = params.end_time;
  } else {
      delete metricsParams.start_time;
      delete metricsParams.end_time;
  }

  try {
    logger.info(`Fetching telemetry for ${key} with params:`, JSON.parse(JSON.stringify(metricsParams)));
    const { data } = await telemetryDataHistoryList(metricsParams);
    const seriesData = data && Array.isArray(data) ? data.map(item => [item.x, item.y]) : []; 
    sampleObj.data = seriesData; 

    return sampleObj;
  } catch (error) {
    logger.error(`Error fetching telemetry for ${key}:`, error);
    sampleObj.data = []; 
    return sampleObj;
  }
};

const setSeries = async dataSource => {
  if (!dataSource) return;

  const deviceSource = dataSource.deviceSource || [];
  const deviceCount = dataSource.deviceCount || 1;
  const newLegendData: string[] = [];

  const firstDevice = deviceSource[0] || {};
  const querDetail = {
    device_id: firstDevice.deviceId || '',
    keys: firstDevice.metricsId || ''
  };

  if (!detail.value && querDetail.device_id && querDetail.keys) { 
     try {
       detail.value = await telemetryDataCurrentKeys(querDetail);
     } catch (err) {
       logger.error("Error fetching current keys:", err);
     }
  }

  const seriesPromises = deviceSource.slice(0, deviceCount).map((item, index) => {
    const metricName = item.metricsName || item.metricsId || `Series ${index + 1}`;
    newLegendData.push(metricName); 
    return getTelemetryData(item.deviceId, item.metricsId, index, metricName);
  });

  try {
      const seriesData = await Promise.all(seriesPromises);
      if (option.value.legend && typeof option.value.legend === 'object' && !Array.isArray(option.value.legend)) {
        option.value.legend.data = newLegendData;
      }
      option.value.series = Array.isArray(seriesData) ? seriesData as any[] : []; 
      legendData.value = newLegendData;
  } catch (err) {
      logger.error("Error resolving series data:", err);
      option.value.series = [];
      if (option.value.legend && typeof option.value.legend === 'object' && !Array.isArray(option.value.legend)) {
          option.value.legend.data = [];
      }
      legendData.value = [];
  }
};

defineExpose({
  updateData: (deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    if (params.aggregate_window !== 'no_aggregate') {
      logger.info('Update data: Aggregated view, ignoring realtime update.');
      return;
    }
    const deviceIndex = props?.card?.dataSource?.deviceSource?.findIndex(
      item => item.deviceId === deviceId && item.metricsId === metricsId
    );

    const currentSeries = option.value.series && option.value.series[deviceIndex || 0];
    if (!currentSeries || !currentSeries.data) {
        logger.warn(`Series data not found for index ${deviceIndex}. Cannot update.`);
        return;
    }
    const seriesData = currentSeries.data as [number, number][]; 

    const value = metricsId && data && data[metricsId];

    if (value !== undefined && value !== null && data.systime) {
      const timestamp = new Date(data.systime).getTime();
      if (seriesData.length === 0 || timestamp > seriesData[seriesData.length - 1][0]) {
        seriesData.push([timestamp, value]);
        if (seriesData.length > 100) {
          seriesData.shift();
        }
      } else if (timestamp === seriesData[seriesData.length - 1][0]) {
          logger.info(`Duplicate timestamp ${timestamp} received. Ignoring.`);
      } else {
          logger.warn(`Received out-of-order timestamp ${timestamp}. Ignoring.`);
      }
    }
  }
});

const throttledWatcher = debounce(() => {
  if (params.time_range) {
     setSeries(props?.card?.dataSource);
  }
}, 300);

watch(
  () => params,
  () => {
    logger.info('Params changed, triggering throttled fetch.');
    throttledWatcher();
  },
  { deep: true }
);
watch(
  () => props.card?.dataSource?.deviceSource,
  () => {
    logger.info('Device source changed, triggering fetch.');
    setSeries(props?.card?.dataSource); 
  },
  { deep: true, immediate: true }
);
watch(
  () => props.colorGroup,
  () => {
    logger.info('Color group changed, triggering fetch.');
    setSeries(props?.card?.dataSource);
  },
  { deep: true }
);

const handleFilterUpdate = (newFilterParams: any) => {
    logger.info('Received filter update:', JSON.parse(JSON.stringify(newFilterParams)));
    params.time_range = newFilterParams.time_range;
    params.aggregate_window = newFilterParams.aggregate_window;
    params.aggregate_function = newFilterParams.aggregate_function;
    params.start_time = newFilterParams.start_time;
    params.end_time = newFilterParams.end_time;
};

onMounted(() => {
  updateLegendColor();

  const resizeObserver = new ResizeObserver(() => {
    updateLegendColor();
  });

  if (chartContainer.value) {
    resizeObserver.observe(chartContainer.value as Element);
  }

  onUnmounted(() => {
    resizeObserver.disconnect();
  });
});
onUnmounted(() => {
  // clearInterval(intervalNum.value);
});
</script>

<template>
  <div ref="chartContainer" class="chart-container h-full flex flex-col pt-4px">
    <div class="button-container absolute  flex justify-end pt-1 pr-2" style="z-index: 10">
       <TelemetryDataHistoryListFilter
          :device-id="props.card?.dataSource?.deviceSource?.[0]?.deviceId || ''"
          :the-key="props.card?.dataSource?.deviceSource?.[0]?.metricsId || ''"
          :show-export-button="false"
          display-mode="simple"
          @update:filterParams="handleFilterUpdate"
       />
    </div>
    <VChart :key="uuid4()" ref="chartRef" class="chart flex-1 mt-4" :option="option" autoresize />
  </div>
</template>

<style scoped>
.name-unit {
  font-size: 18px;
}
.chart-container {
  color: var(--chart-legend-color); /* 使用 CSS 变量 */
  position: relative; /* Needed for absolute positioning of button container */
}
.button-container {
  /* Styles removed as filters are gone, position handled inline */
  top: 0; /* Adjust positioning as needed */
  right: 5px; /* Adjust positioning as needed */
}
</style>
