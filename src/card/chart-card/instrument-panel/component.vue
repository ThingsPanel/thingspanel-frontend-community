<script setup lang="ts">
import { defineProps, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import VChart from 'vue-echarts';
import * as echarts from 'echarts';
import { CanvasRenderer } from 'echarts/renderers';
import { GaugeChart } from 'echarts/charts';
import { LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import { deviceDetail } from '../curve/modules/api';

// 注册 ECharts 所需的组件和渲染器
echarts.use([CanvasRenderer, GaugeChart, TitleComponent, TooltipComponent, LegendComponent]);

interface ICardData {
  dataSource: any; // 定义数据源接口
}

const initDetailValue = 8;
const valueColor = '#105ba8';

const props = defineProps<{ card: ICardData }>();

const cardRef = ref(null);
const chartRef = ref<VChart | null>(null);

const detail = ref<string>('');

const chartOptions = ref({
  series: [
    {
      type: 'gauge',
      startAngle: 180,
      endAngle: -45,
      min: 0, // 动态变化
      max: 100, // 动态变化
      radius: '90%',
      center: ['50%', '60%'],
      splitNumber: 1, // 只展示最大和最小值
      axisLine: {
        lineStyle: {
          width: 30,
          color: [
            [0.064, valueColor],
            [0.8, '#ddd']
          ] // 动态变化
        }
      },
      axisTick: { show: false },
      axisLabel: {
        show: true,
        fontSize: 14,
        verticalAlign: 'bottom', // 垂直对齐方式
        align: 'center',
        distance: 12
      },
      splitLine: { show: false },
      pointer: { show: false },
      detail: { show: true, offsetCenter: [0, '-20%'], fontSize: 20 },
      data: [
        {
          value: initDetailValue,
          detail: {
            show: true,
            width: '100%',
            overflow: 'breakAll',
            formatter: value => value
          }
        }
      ]
    }
  ]
});

const setSeries: (dataSource) => void = async dataSource => {
  const querDetail = {
    device_id: dataSource?.deviceSource ? dataSource?.deviceSource?.[0]?.deviceId ?? '' : '',
    keys: dataSource?.deviceSource ? dataSource?.deviceSource?.[0]?.metricsId : ''
  };
  if (querDetail.device_id && querDetail.keys) {
    detail.value = await deviceDetail(querDetail);
  }
};

// const updateChart = (newValue: number) => {
//   chartOptions.value.series[0].data[0].value = newValue;
//   const chartInstance = chartRef.value;
//   if (chartInstance) {
//     chartInstance.setOption(chartOptions.value, true);
//   }
// };

// const updateData = (_deviceId: string | undefined, metricsId: string | undefined, data: any) => {
//   detail.value = metricsId ? data[metricsId] : '';
//   // updateChart(Number(detail.value));
// };

const resizeChart = () => {
  const chartInstance = chartRef.value;
  if (chartInstance) {
    chartInstance.resize();

    const containerWidth = Math.min(chartRef.value.$el.clientWidth, chartRef.value.$el.clientHeight);
    const adjustedOptions = chartOptions.value;
    const min = props?.card?.config?.min || 0;
    const max = props?.card?.config?.max || 100;
    adjustedOptions.series[0].min = min;
    adjustedOptions.series[0].max = max;
    const detailValue = detail?.value?.data && detail?.value?.data[0] ? detail?.value?.data[0]?.value : initDetailValue;
    const unit =
      props?.card?.config?.unit ||
      (detail?.value?.data && detail?.value?.data[0] ? detail?.value?.data[0]?.unit || '' : '');
    let ratio = 0.064;
    if (detailValue >= max) {
      ratio = 1;
    } else if (detailValue <= min) {
      ratio = 0;
    } else {
      ratio = (detailValue - min) / (max - min);
    }
    const changeColorArr = [ratio * 0.8, valueColor];
    adjustedOptions.series[0].axisLine.lineStyle.color[0] = changeColorArr;
    adjustedOptions.series[0].detail.fontSize = containerWidth / 10;
    adjustedOptions.series[0].axisLabel.fontSize = containerWidth / 16;
    adjustedOptions.series[0].data[0].value = detailValue;
    adjustedOptions.series[0].data[0].detail.formatter = value => `${value} ${unit}`;
    adjustedOptions.series[0].data[0].detail.lineHeight = containerWidth / 16;
    // adjustedOptions.series[0].axisLine.lineStyle.width = containerWidth / 14;
    chartInstance.setOption(adjustedOptions);
  }
};

watch(
  () => props.card.dataSource,
  () => setSeries(props.card.dataSource),
  { immediate: true, deep: true }
);
watch(
  () => detail?.value?.data?.[0]?.value,
  () => {
    resizeChart();
  }
);
watch(
  () => props?.card?.config?.unit,
  () => {
    resizeChart();
  }
);
watch(
  () => props?.card?.config?.min,
  () => {
    resizeChart();
  }
);
watch(
  () => props?.card?.config?.max,
  () => {
    resizeChart();
  }
);

onMounted(() => {
  setSeries(props.card.dataSource);
  resizeChart();
  window.addEventListener('resize', resizeChart);

  const resizeObserver = new ResizeObserver(() => {
    resizeChart();
  });

  if (cardRef.value) {
    resizeObserver.observe(cardRef.value.$el);
  }

  onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeChart);
    resizeObserver.disconnect();
  });
});
</script>

<template>
  <div class="dashboard-card">
    <n-card ref="cardRef" :bordered="false" class="h-full w-full">
      <div class="chart-container">
        <VChart ref="chartRef" :option="chartOptions" class="chart" />
      </div>
      <div class="data-info">
        <span class="title">{{ card.dataSource?.deviceSource[0]?.metricsName || '仪表盘' }}</span>
      </div>
    </n-card>
  </div>
</template>

<style scoped>
.dashboard-card {
  height: 100%;
}
.chart-container {
  position: relative;
  width: 100%;
  height: 80%;
}
.chart {
  width: 100%;
  height: 100%;
}
.data-info {
  text-align: center;
  /* padding: 10px 0; */
}
.title {
  font-size: 16px;
  margin-bottom: 5px;
}
</style>
../curve/modules/api
