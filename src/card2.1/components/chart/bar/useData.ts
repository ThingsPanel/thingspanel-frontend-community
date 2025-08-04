import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useMessage } from 'naive-ui'
import * as echarts from 'echarts'
import { telemetryDataCurrentKeys, telemetryDataHistoryList } from '@/service/api/device'
import { createLogger } from '@/utils/logger'
import type { ComposeOption } from 'echarts/core'
import type { LineSeriesOption } from 'echarts/charts'
import type {
  GridComponentOption,
  LegendComponentOption,
  ToolboxComponentOption,
  TooltipComponentOption
} from 'echarts/components'

const logger = createLogger('BarChart')

type EChartsOption = ComposeOption<
  TooltipComponentOption | LegendComponentOption | ToolboxComponentOption | GridComponentOption | LineSeriesOption
>

interface BarDataProps {
  config?: any
  properties?: any
  metadata?: any
}

interface ColorGroup {
  name: string
  top: string
  bottom: string
  line: string
}

export function useBarData(props: BarDataProps, colorGroup: ColorGroup[]) {
  const message = useMessage()

  const isAggregate = ref<boolean>(false)
  const isTimeSelect = ref<boolean>(false)
  const dateRange = ref<[number, number] | null>(null)
  const legendColor = ref('auto')
  const detail = ref<any>(null)
  const legendData = ref<any[]>([])
  const name = ref('')

  // 示例数据
  const sampleData = [
    [1716986172333, 8],
    [1716986177338, 21],
    [1716986182346, 16],
    [1716986187353, 21],
    [1716986192360, 18],
    [1716986197366, 23],
    [1716986202376, 21],
    [1716986207383, 20],
    [1716986212393, 23],
    [1716986217401, 25],
    [1716986222411, 21]
  ]

  // ECharts 配置
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
    series: []
  })

  // 查询参数
  const params = reactive({
    limit: 50,
    start_time: '',
    end_time: '',
    aggregate_window: 'no_aggregate',
    aggregate_function: 'avg'
  })

  // 获取遥测数据
  const getTelemetryData = async (device_id: string, key: string, index: number, metricName: string) => {
    const sampleObj = {
      name: metricName,
      type: 'bar',
      stack: 'Total',
      smooth: true,
      showSymbol: false,
      itemStyle: {
        opacity: 0.8,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: colorGroup[index]?.top || '#FF6B6B'
          },
          {
            offset: 1,
            color: colorGroup[index]?.bottom || '#4ECDC4'
          }
        ])
      },
      emphasis: {
        focus: 'series'
      },
      data: sampleData,
      tooltip: {
        valueFormatter: (value: any) => value + (detail?.value?.data[0]?.unit || '')
      }
    }

    if (!device_id || !key) return sampleObj

    const dataSource = props.metadata?.card2Data?.dataSource
    const aggregateFunction =
      dataSource?.deviceSource?.[index]?.aggregate_function || params.aggregate_function || 'avg'

    const metricsParams = {
      device_id,
      key,
      ...params,
      aggregate_function: aggregateFunction
    }

    try {
      const { data } = await telemetryDataHistoryList(metricsParams)
      const seriesData = data ? data.map((item: any) => [item.x, item.y]) : sampleData

      sampleObj.data = seriesData
      return sampleObj
    } catch (error) {
      logger.error('获取遥测数据失败:', error)
      return sampleObj
    }
  }

  // 设置系列数据
  const setSeries = async (dataSource: any) => {
    if (!dataSource) return

    const deviceSource = dataSource.deviceSource || []
    const deviceCount = dataSource.deviceCount || 1
    const newLegendData: string[] = []

    const firstDevice = deviceSource[0] || {}
    const querDetail = {
      device_id: firstDevice.deviceId || '',
      keys: firstDevice.metricsId || ''
    }

    if (querDetail.device_id && querDetail.keys) {
      try {
        detail.value = await telemetryDataCurrentKeys(querDetail)
      } catch (error) {
        logger.error('获取设备详情失败:', error)
      }
    }

    // 收集所有系列数据的 Promise
    const seriesPromises = deviceSource.slice(0, deviceCount).map((item: any, index: number) => {
      const metricName = item.metricsName || item.metricsId || ''
      name.value = metricName
      newLegendData.push(metricName)

      return getTelemetryData(item.deviceId, item.metricsId, index, metricName)
    })

    // 等待所有系列数据获取完成
    const seriesData = await Promise.all(seriesPromises)

    // 一次性赋值给 option.value.series 和 option.value.legend.data
    if (option.value.legend) {
      option.value.legend.data = newLegendData
    }
    option.value.series = seriesData
    legendData.value = newLegendData
  }

  // 更新数据
  const updateData = (deviceId: string | undefined, metricsId: string | undefined, data: any) => {
    if (params.aggregate_window !== 'no_aggregate') {
      logger.info('Update data: Bar chart is aggregate, return directly')
      return
    }

    const dataSource = props.metadata?.card2Data?.dataSource
    const deviceIndex = dataSource?.deviceSource?.findIndex(
      (item: any) => item.deviceId === deviceId && item.metricsId === metricsId
    )

    if (deviceIndex !== -1 && option.value.series && option.value.series[deviceIndex]) {
      const series = option.value.series[deviceIndex] as any
      if (series.data && Array.isArray(series.data)) {
        series.data.push([data.ts, data.value])

        // 限制数据点数量，保持性能
        if (series.data.length > 100) {
          series.data.shift()
        }
      }
    }
  }

  // 初始化数据
  const initializeData = () => {
    const dataSource = props.metadata?.card2Data?.dataSource
    if (dataSource) {
      setSeries(dataSource)
    }
  }

  // 监听数据源变化
  watch(
    () => props.metadata?.card2Data?.dataSource,
    newDataSource => {
      if (newDataSource) {
        setSeries(newDataSource)
      }
    },
    { deep: true }
  )

  onMounted(() => {
    initializeData()
  })

  return {
    option,
    legendData,
    detail,
    isAggregate,
    isTimeSelect,
    dateRange,
    legendColor,
    name,
    params,
    updateData,
    setSeries,
    initializeData
  }
}
