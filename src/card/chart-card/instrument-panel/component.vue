<script setup lang="ts">
import { defineProps, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { NCard } from 'naive-ui'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GaugeChart } from 'echarts/charts'
import { LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import type { ICardData } from '@/components/panel/card'
import { telemetryDataCurrentKeys } from '@/service/api/device'
import { $t } from '@/locales'

// 注册 ECharts 所需的组件和渲染器
use([CanvasRenderer, GaugeChart, TitleComponent, TooltipComponent, LegendComponent])

const initDetailValue = 8
const valueColor = '#105ba8'

const props = defineProps<{ card: ICardData }>()

const cardRef = ref(NCard)
const chartRef = ref<typeof VChart | null>(null)

const detail = ref<number>(0)
const unit = ref<string>('')

const chartOptions = ref({
  series: [
    {
      type: 'gauge',
      startAngle: 180,
      endAngle: -45,
      min: 0, // 动态变化
      max: 100, // 动态变化
      radius: '100%',
      center: ['50%', '80%'],
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
            formatter: value => value,
            color: 'inherit'
          }
        }
      ]
    }
  ]
})

const setSeries: (dataSource) => void = async dataSource => {
  const querDetail = {
    device_id: dataSource?.deviceSource ? (dataSource?.deviceSource?.[0]?.deviceId ?? '') : '',
    keys: dataSource?.deviceSource ? dataSource?.deviceSource?.[0]?.metricsId : ''
  }
  if (querDetail.device_id && querDetail.keys) {
    const detailValue = await telemetryDataCurrentKeys(querDetail)
    if (detailValue?.data[0]?.unit) {
      unit.value = detailValue?.data[0]?.unit
    }
    if (detailValue?.data[0]?.value) {
      detail.value = detailValue.data[0].value
    }
  }
}

defineExpose({
  updateData: (_deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    if (metricsId && data && typeof data === 'object' && Object.prototype.hasOwnProperty.call(data, metricsId)) {
      detail.value = data[metricsId]
    }
  }
})

const handleDataChange = () => {
  const adjustedOptions = chartOptions.value
  const min = props?.card?.config?.min || 0
  const max = props?.card?.config?.max || 100
  adjustedOptions.series[0].min = min
  adjustedOptions.series[0].max = max
  const detailValue = !detail.value ? 0 : detail.value
  const unitValue = props?.card?.config?.unit || unit.value
  let ratio = 0.064
  if (detailValue >= max) {
    ratio = 1
  } else if (detailValue <= min) {
    ratio = 0
  } else {
    ratio = (detailValue - min) / (max - min)
  }
  const changeColorArr = [ratio * 0.8, valueColor]
  adjustedOptions.series[0].axisLine.lineStyle.color[0] = changeColorArr
  adjustedOptions.series[0].data[0].value = detailValue || 0
  adjustedOptions.series[0].data[0].detail.formatter = value => `${value || 0} ${unitValue}`
}

const handleResize = () => {
  const chartInstance = chartRef.value
  if (chartInstance) {
    chartInstance.resize()

    const containerWidth = Math.min(chartRef.value?.$el.clientWidth, chartRef.value?.$el.clientHeight)
    const adjustedOptions = chartOptions.value
    adjustedOptions.series[0].detail.fontSize = containerWidth / 10
    adjustedOptions.series[0].axisLabel.fontSize = containerWidth / 16
    adjustedOptions.series[0].data[0].detail.lineHeight = containerWidth / 10
  }
}

watch(
  () => props.card.dataSource,
  () => setSeries(props.card.dataSource),
  { immediate: true, deep: true }
)
watch(
  () => detail.value,
  () => {
    handleDataChange()
  }
)
watch(
  () => props?.card?.config,
  () => {
    handleDataChange()
  },
  { deep: true }
)

onMounted(() => {
  setSeries(props.card.dataSource)
  handleDataChange()
  handleResize()

  const resizeObserver = new ResizeObserver(() => {
    handleResize()
  })

  if (cardRef.value) {
    resizeObserver.observe(cardRef.value)
  }

  onBeforeUnmount(() => {
    resizeObserver.disconnect()
  })
})
</script>

<template>
  <div ref="cardRef" class="dashboard-card">
    <div class="chart-container">
      <VChart ref="chartRef" :option="chartOptions" class="chart" />
    </div>
    <div class="data-info">
      <span class="title">
        {{ card.dataSource?.deviceSource?.[0]?.metricsName || $t('dashboard_panel.cardName.instrumentPanel') }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.dashboard-card {
  height: 100%;
  width: 100%;
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
