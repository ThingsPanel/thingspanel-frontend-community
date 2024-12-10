<script lang="ts" setup>
import { onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import type { SelectOption } from 'naive-ui';
import { useMessage } from 'naive-ui';
import { debounce } from 'lodash';
import { use } from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { v4 as uuid4 } from 'uuid';
import VChart from 'vue-echarts';
import * as echarts from 'echarts';
import { DiscOutline, FilterCircleOutline, RefreshCircleOutline, TimeOutline } from '@vicons/ionicons5';
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
import { addMonths } from 'date-fns';
import { $t } from '@/locales';
import type { ICardData } from '@/components/panel/card';
import { telemetryDataCurrentKeys, telemetryDataHistoryList } from '@/service/api/device';
import { createLogger } from '@/utils/logger';
const logger = createLogger('chart');
type EChartsOption = ComposeOption<
  TooltipComponentOption | LegendComponentOption | ToolboxComponentOption | GridComponentOption | LineSeriesOption
>;
use([TooltipComponent, LegendComponent, ToolboxComponent, GridComponent, LineChart, CanvasRenderer]);
const chartContainer = ref<HTMLElement | null>(null);
const chartRef = ref();
const isAggregate = ref<boolean>(false);
const isTimeSelect = ref<boolean>(false);
const dateRange = ref<[number, number] | null>(null);

const legendColor = ref('auto');

const detail: any = ref(null);

const props = defineProps<{
  card: ICardData;
  colorGroup: { name: string; top: string; bottom: string; line: string }[];
  curveWidth: number;
}>();

const message = useMessage();
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
const name = ref('');

const option = ref<EChartsOption>({
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    data: legendData.value,
    textStyle: {
      color: legendColor.value,
      fontSize: '1.1em'
    },
    itemGap: 15,
    orient: 'horizontal'
  },
  dataZoom: [
    // 1.横向使用滚动条
    {
      type: 'slider', // 有单独的滑动条，用户在滑动条上进行缩放或漫游。inside是直接可以是在内部拖动显示
      show: true, // 是否显示 组件。如果设置为 false，不会显示，但是数据过滤的功能还存在。
      start: 0, // 数据窗口范围的起始百分比0-100
      end: 100, // 数据窗口范围的结束百分比0-100
      xAxisIndex: [0], // 此处表示控制第一个xAxis，设置 dataZoom-slider 组件控制的 x轴 可是已数组[0,2]表示控制第一，三个；xAxisIndex: 2 ，表示控制第二个。yAxisIndex属性同理
      bottom: 20 // 距离底部的距离
    },
    // 2.在内部可以横向拖动
    {
      type: 'inside', // 内置于坐标系中
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
  /* toolbox: {
    feature: {
      saveAsImage: {}
    }
  }, */
  xAxis: {
    boundaryGap: false,
    type: 'time' as 'category',
    axisLabel: {
      interval: 'auto',
      textStyle: {
        color: 'auto'
      }
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      textStyle: {
        color: 'auto'
      }
    }
  },
  series: [] as any[]
});

const updateLegendColor = () => {
  if (chartContainer.value) {
    const computedStyle = window.getComputedStyle(chartContainer.value);
    legendColor.value = computedStyle.color;
    option.value.legend.textStyle.color = legendColor.value;
    option.value.yAxis.axisLabel.textStyle.color = legendColor.value;
  }
};
const d_end_time = new Date().getTime();
// 获取1小时前的时间
const d_start_time = d_end_time - 3600000;
const params = reactive({
  start_time: d_start_time,
  end_time: d_end_time,
  aggregate_window: 'no_aggregate',
  aggregate_function: '',
  time_range: 'custom'
});
const timeOptions: SelectOption[] = [
  { label: $t('common.custom'), value: 300000 },
  { label: $t('common.last_15m'), value: 900000, id: 'last_15m' },
  { label: $t('common.last_30m'), value: 1800000, id: 'last_30m' },
  { label: $t('common.lastHours1'), value: 3600000, id: 'last_1h' },
  { label: $t('common.lastHours3'), value: 10800000, id: 'last_3h' },
  { label: $t('common.lastHours6'), value: 21600000, id: 'last_6h' },
  { label: $t('common.lastHours12'), value: 43200000, id: 'last_12h' },
  { label: $t('common.lastHours24'), value: 86400000, id: 'last_24h' },
  { label: $t('common.lastDays3'), value: 259200000, id: 'last_3d' },
  { label: $t('common.lastDays7'), value: 604800000, id: 'last_7d' },
  { label: $t('common.lastDays15'), value: 1296000000, id: 'last_15d' },
  { label: $t('common.lastDays30'), value: 2592000000, id: 'last_30d' },
  { label: $t('common.lastDays60'), value: 5184000000, id: 'last_60d' },
  { label: $t('common.lastDays90'), value: 7776000000, id: 'last_90d' },
  { label: '最近6个月', value: 15811200000 },
  { label: '最近1年', value: 31536000000 },
  { label: '今天', value: 28740000 },
  { label: '昨天', value: 86400000 },
  { label: '前天', value: 172800000 },
  { label: '上周今日', value: 604800000 },
  { label: '本周', value: 518400000 },
  { label: '上周', value: 604800000 },
  { label: '本月', value: 2592000000 },
  { label: '上个月', value: 2592000000 },
  { label: '今年', value: 7776000000 },
  { label: '去年', value: 31536000000 }
];
const timeOptionsValue = ref();
const aggregateOptions: SelectOption[] = [
  { label: $t('common.notAggre'), value: 'no_aggregate', disabled: false },
  { label: $t('common.seconds30'), value: '30s', disabled: false },
  { label: $t('common.minute1'), value: '1m', disabled: false },
  { label: $t('common.minute2'), value: '2m', disabled: false },
  { label: $t('common.minutes5'), value: '5m', disabled: false },
  { label: $t('common.minutes10'), value: '10m', disabled: false },
  { label: $t('common.minutes30'), value: '30m', disabled: false },
  { label: $t('common.hours1'), value: '1h', disabled: false },
  { label: $t('common.hours3'), value: '3h', disabled: false },
  { label: $t('common.hours6'), value: '6h', disabled: false },
  { label: $t('common.days1'), value: '1d', disabled: false },
  { label: $t('common.days7'), value: '7d', disabled: false },
  { label: '1月', value: '1mo', disabled: false }
];
const aggregateOptionsValue = ref<string>('');
const aggregateFunctionOptions: SelectOption[] = [
  { label: $t('common.average'), value: 'avg' },
  { label: $t('generate.max-value'), value: 'max' },
  { label: $t('common.sum'), value: 'sum' },
  { label: $t('common.diffValue'), value: 'diff' }
];
const aggregateFunctionValue = ref<string>('avg');

const updateAggregateFunction = v => {
  aggregateFunctionValue.value = v;
  params.aggregate_function = v;
};
const updateAggregate = (v: string) => {
  aggregateOptionsValue.value = v;
  params.aggregate_window = v;
  if (v !== 'no_aggregate') {
    aggregateFunctionValue.value = 'avg';
    params.aggregate_function = 'avg';
  } else {
    aggregateFunctionValue.value = '';
    params.aggregate_function = '';
  }
};
const updateDisabledOptions = (timeFrame: string) => {
  const disableBeforeIndex: { [key: string]: number } = {
    最近3小时: 1, // 30秒
    最近6小时: 2, // 1分钟
    最近12小时: 3, // 2分钟
    最近24小时: 4, // 5分钟
    最近3天: 5, // 10分钟
    最近7天: 6, // 30分钟
    最近15天: 7, // 1小时
    最近30天: 7, // 1小时
    最近60天: 8, // 3小时
    最近90天: 9, // 6小时
    最近6个月: 9, // 6小时
    最近1年: 12, // 1月
    今天: 4, // 5分钟
    昨天: 4, // 5分钟
    前天: 4, // 5分钟
    上周今日: 4, // 5分钟
    本周: 6, // 30分钟
    上周: 6, // 30分钟
    本月: 7, // 1小时
    上个月: 7, // 1小时
    今年: 12, // 1月
    去年: 12 // 1月
  };

  // 默认不禁用“不聚合”，根据时间范围禁用其余选项
  aggregateOptions.forEach((item, index, array) => {
    if (!disableBeforeIndex[timeFrame]) {
      item.disabled = false;
      aggregateOptionsValue.value = 'no_aggregate';
      params.aggregate_window = aggregateOptionsValue.value;
      return;
    }

    item.disabled = index < (disableBeforeIndex[timeFrame] || 0);
    if (index < (disableBeforeIndex[timeFrame] || 0)) {
      aggregateOptionsValue.value = array[index + 1].value as string;
      params.aggregate_window = aggregateOptionsValue.value;
    }
  });
};

const updateTime = (v: number, o: SelectOption) => {
  let now = new Date();
  let start_time: Date;
  let end_time: Date = new Date();
  isAggregate.value = true;
  timeOptionsValue.value = v;
  updateDisabledOptions(o.label as string);
  switch (o.label) {
    case $t('common.custom'):
      isTimeSelect.value = true;
      isAggregate.value = false;
      return;
    case '今天':
      start_time = new Date(now.setHours(0, 0, 0, 0));
      now = new Date(); // 重新获取当前时间，避免修改
      end_time = new Date(now.setHours(23, 59, 59, 999));
      break;
    case '昨天':
      start_time = new Date();
      start_time.setDate(now.getDate() - 1);
      start_time.setHours(0, 0, 0, 0);
      end_time = new Date(start_time);
      end_time.setHours(23, 59, 59, 999);
      break;
    case '前天':
      start_time = new Date();
      start_time.setDate(start_time.getDate() - 2); // 设置为两天前的日期
      start_time.setHours(0, 0, 0, 0); // 那一天的开始
      end_time = new Date(start_time);
      end_time.setHours(23, 59, 59, 999); // 那一天的结束一天的结束
      break;
    case '本周':
      // eslint-disable-next-line no-case-declarations
      const currentDayOfWeek = now.getDay(); // 当前是周几，周日为0
      // eslint-disable-next-line no-case-declarations
      const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek; // 计算到周一需要回退的天数
      start_time = new Date();
      start_time.setDate(now.getDate() + distanceToMonday); // 设置为本周一
      start_time.setHours(0, 0, 0, 0); // 本周一的开始
      end_time = new Date(); // 本周的当前时间
      break;
    case '上周':
      // eslint-disable-next-line no-case-declarations
      const daysToLastMonday = now.getDay() === 0 ? -6 : 1; // 如果今天是周日，则上周一是6天前
      start_time = new Date();
      start_time.setDate(now.getDate() - now.getDay() - daysToLastMonday);
      start_time.setHours(0, 0, 0, 0);
      end_time = new Date(start_time);
      end_time.setDate(start_time.getDate() + 6);
      end_time.setHours(23, 59, 59, 999);
      break;
    case '本月':
      start_time = new Date(now.getFullYear(), now.getMonth(), 1);
      end_time = now;
      break;
    case '上个月':
      start_time = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end_time = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case '今年':
      start_time = new Date(now.getFullYear(), 0, 1);
      end_time = now;
      break;
    case '去年':
      start_time = new Date(now.getFullYear() - 1, 0, 1);
      end_time = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      break;
    default:
      start_time = new Date(now.getTime() - v);
      end_time = new Date();
  }
  isTimeSelect.value = false;
  params.start_time = start_time.getTime();
  params.end_time = end_time.getTime();
};
const checkDateRange = value => {
  const [start, end] = value;
  if (start && end && addMonths(start, 1) < end) {
    dateRange.value = null;
    message.error($t('common.withinOneMonth'));
  } else {
    params.start_time = start;
    params.end_time = end;
  }
};

const reFresh = () => {
  timeOptionsValue.value = '';
  isAggregate.value = false;
  const endtime = new Date().getTime();
  const starttime = endtime - 3600000;
  params.start_time = starttime;
  params.end_time = endtime;
  params.aggregate_window = 'no_aggregate';
  params.aggregate_function = 'avg';
  params.time_range = 'custom';
};

// eslint-disable-next-line max-params
const getTelemetryData = async (device_id, key, index, metricName) => {
  const sampleObj = {
    name: metricName,
    type: 'line',
    stack: 'Total',
    smooth: true,
    lineStyle: {
      width: props.curveWidth,
      color: props.colorGroup[index].line || 'blue'
    },
    showSymbol: false,
    itemStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: props.colorGroup[index].top },
        { offset: 1, color: props.colorGroup[index].bottom }
      ]) // 自定义颜色
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
  if (!device_id || !key) return sampleObj;

  const aggregateFunction =
    props.card?.dataSource?.deviceSource?.[index]?.aggregate_function || params.aggregate_function || 'avg';

  const metricsParams = {
    device_id,
    key,
    ...params,
    aggregate_function: aggregateFunction
  };

  try {
    const { data } = await telemetryDataHistoryList(metricsParams);
    const seriesData = data ? data.map(item => [item.x, item.y]) : sampleData;
    return {
      ...sampleObj,
      stack: `Total${index}`,
      data: seriesData
    };
  } catch (error) {
    // 如果发生错误，返回默认数据
    return sampleObj;
  }
};

const setSeries = async dataSource => {
  if (!dataSource) return;

  const deviceSource = dataSource.deviceSource || [];
  const deviceCount = dataSource.deviceCount || 1;

  const firstDevice = deviceSource[0] || {};
  const querDetail = {
    device_id: firstDevice.deviceId || '',
    keys: firstDevice.metricsId || ''
  };

  if (querDetail.device_id && querDetail.keys) {
    detail.value = await telemetryDataCurrentKeys(querDetail);
  } else {
    // window.$message?.error("查询不到设备");
  }

  // 收集所有系列数据的Promise
  const seriesPromises = deviceSource.slice(0, deviceCount).map((item, index) => {
    const metricName = item.metricsName || item.metricsId || '';
    name.value = metricName;
    const color = new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: props.colorGroup[index].top },
      { offset: 1, color: props.colorGroup[index].bottom }
    ]);
    const obj = { name: metricName, icon: 'circle', itemStyle: { color } };
    legendData.value.push(obj);
    // 返回一个Promise，包含系列配置和数据
    return getTelemetryData(item.deviceId, item.metricsId, index, metricName);
  });

  // 等待所有系列数据获取完成
  const seriesData = await Promise.all(seriesPromises);

  // 一次性赋值给option.value.series
  option.value.series = seriesData;
};

defineExpose({
  updateData: (deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    if (params.aggregate_window !== 'no_aggregate') {
      logger.info('Update data: Curve is aggregate, return directly');
      return;
    }
    const deviceIndex = props?.card?.dataSource?.deviceSource?.findIndex(
      item => item.deviceId === deviceId && item.metricsId === metricsId
    );
    // const seriesData = JSON.parse(JSON.stringify(option.value.series[deviceIndex]))?.data;
    const seriesData =
      option.value.series && option.value.series[deviceIndex || 0] ? option.value.series[deviceIndex || 0].data : [];
    const value = metricsId && data && data[metricsId];

    if (value && data.systime) {
      const timestamp = new Date(data.systime).getTime();
      if (seriesData.length === 0 || timestamp !== seriesData[seriesData.length - 1][0]) {
        const len = seriesData?.push([timestamp, value]);
        // 如果长度大于100且第一个数据和最后一个数据的间隔时间大于采样周期则删除最后一个元素
        if (len >= 100) {
          seriesData.shift();
        }
      }
    }
  }
});

const throttledWatcher = debounce(() => {
  setSeries(props?.card?.dataSource);
}, 300);

const initDateTimeRange = () => {
  if (props.card?.dataSource?.dataTimeRange) {
    const timeOption = timeOptions.find(item => item.id === props.card?.dataSource?.dataTimeRange);
    if (timeOption) {
      timeOptionsValue.value = timeOption.value;
      updateTime(timeOption.value as number, timeOption);
      if (props.card?.dataSource?.dataAggregateRange) {
        updateAggregate(props.card?.dataSource?.dataAggregateRange);
      }
      if (props.card?.dataSource?.deviceSource?.length === 1) {
        updateAggregateFunction(props.card?.dataSource?.deviceSource[0]?.aggregate_function);
      }
    }
  }
};

watch(
  () => params,
  () => {
    throttledWatcher();
  },
  { deep: true }
);
watch(
  () => props.card?.dataSource?.deviceSource,
  () => {
    setSeries(props?.card?.dataSource);
  },
  { deep: true }
);
watch(
  () => props.colorGroup,
  () => {
    setSeries(props?.card?.dataSource);
  },
  { deep: true }
);
watch(
  () => props.curveWidth,
  newCurveWidth => {
    option.value.series?.forEach(seriesData => {
      seriesData.lineStyle.width = newCurveWidth;
    });
  },
  { deep: true }
);
watch(
  () => props.card?.dataSource?.dataTimeRange,
  newDateTiemRange => {
    if (newDateTiemRange) {
      initDateTimeRange();
    } else {
      reFresh();
    }
  }
);
watch(
  () => props.card?.dataSource?.dataAggregateRange,
  () => {
    initDateTimeRange();
  }
);

onMounted(() => {
  initDateTimeRange();
  setSeries(props?.card?.dataSource);

  updateLegendColor(); // 初始设置

  const resizeObserver = new ResizeObserver(() => {
    updateLegendColor();
  });

  if (chartContainer.value) {
    resizeObserver.observe(chartContainer.value);
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
    <div class="button-container absolute right-0 top-0 flex justify-between pt-1">
      <div class="name-unit"></div>
      <div class="flex justify-end pr-2">
        <n-popselect
          v-model:value="timeOptionsValue"
          class="mr-4px"
          :options="timeOptions"
          trigger="hover"
          scrollable
          @update:value="updateTime"
        >
          <n-icon size="24" class="hover:text-primary-500">
            <TimeOutline />
          </n-icon>
        </n-popselect>
        <n-date-picker
          v-if="isTimeSelect"
          v-model:value="dateRange"
          class="w-300px"
          type="datetimerange"
          @update:value="checkDateRange"
        />
        <n-popselect
          v-if="isAggregate"
          v-model:value="aggregateOptionsValue"
          class="mr-4px"
          :options="aggregateOptions"
          trigger="hover"
          scrollable
          @update:value="updateAggregate"
        >
          <n-icon size="24" class="hover:text-primary-500">
            <DiscOutline />
          </n-icon>
        </n-popselect>

        <n-popselect
          v-if="isAggregate"
          v-model:value="aggregateFunctionValue"
          class="mr-4px"
          :options="aggregateFunctionOptions"
          trigger="hover"
          scrollable
          @update:value="updateAggregateFunction"
        >
          <n-icon size="24" class="hover:text-primary-500">
            <FilterCircleOutline />
          </n-icon>
        </n-popselect>
        <n-icon size="24" class="hover:text-primary-500" @click="reFresh">
          <RefreshCircleOutline />
        </n-icon>
      </div>
    </div>
    <VChart :key="uuid4()" ref="chartRef" class="chart flex-1" :option="option" autoresize />
  </div>
</template>

<style scoped>
.name-unit {
  font-size: 18px;
}

.chart-container {
  color: var(--chart-legend-color); /* 使用 CSS 变量 */
}
.button-container {
  z-index: 99;
}
</style>
