<template>
  <div class="h-full bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
    <!-- 卡片标题栏 -->
    <div class="flex items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-800">
      <div class="flex items-center space-x-3">
        <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
          <Icon icon="mdi:account-group" class="text-lg text-purple-600 dark:text-purple-400" />
        </div>
        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">
          {{ $t('card.tenantChart.title') }}
        </h3>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="flex-1 p-4 min-h-0">
      <n-spin :show="loading">
        <div class="h-full flex gap-4">
          <!-- 左侧统计数据 -->
          <div class="w-1/3 flex flex-col justify-around py-2 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 pr-4 space-y-4">
            <!-- 总用户数 -->
            <div class="text-center bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
              <div class="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {{ $t('card.tenantChart.totalUsers', '总用户数') }}
              </div>
              <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                <NNumberAnimation :from="0" :to="stats.user_total" />
              </div>
            </div>

            <!-- 本月新增 -->
            <div class="text-center bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
              <div class="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {{ $t('card.tenantChart.addedMonth', '本月新增') }}
              </div>
              <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                <NNumberAnimation :from="0" :to="stats.user_added_month" />
              </div>
            </div>

            <!-- 昨日新增 -->
            <div class="text-center bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              <div class="text-xs text-gray-600 dark:text-gray-400 mb-1">
                {{ $t('card.tenantChart.addedYesterday', '昨日新增') }}
              </div>
              <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">
                <NNumberAnimation :from="0" :to="stats.user_added_yesterday" />
              </div>
            </div>
          </div>

          <!-- 右侧图表 -->
          <div class="flex-1 min-w-0">
            <!-- 错误状态 -->
            <div v-if="!loading && errorMsg" class="h-full flex flex-col items-center justify-center text-center">
              <div class="p-4 bg-red-100 dark:bg-red-900 rounded-full mb-3">
                <Icon icon="mdi:alert-circle-outline" class="w-8 h-8 text-red-500 dark:text-red-400" />
              </div>
              <div class="text-sm text-red-600 dark:text-red-400">
                {{ errorMsg }}
              </div>
            </div>

            <!-- 无数据状态 -->
            <div v-else-if="!loading && isEmpty" class="h-full flex flex-col items-center justify-center text-center">
              <div class="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                <Icon icon="mdi:chart-bar" class="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <div class="text-sm text-gray-500 dark:text-gray-400">
                {{ $t('card.noData') }}
              </div>
            </div>

            <!-- 图表 -->
            <v-chart
              v-else-if="!loading"
              ref="chartRef"
              class="w-full h-full"
              :option="chartOption"
              autoresize
            />
          </div>
        </div>
      </n-spin>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 租户图表组件
 * 显示租户用户统计数据和月度新增用户趋势图表
 */
import { ref, onMounted, computed, provide } from 'vue'
import { Icon } from '@iconify/vue'
import { NSpin, NNumberAnimation } from 'naive-ui'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  ToolboxComponent
} from 'echarts/components'
import VChart, { THEME_KEY } from 'vue-echarts'
import { useThemeStore } from '@/store/modules/theme'
import { tenant } from '@/service/api/system-data'
import { $t } from '@/locales'

// ECharts 组件注册
use([
  CanvasRenderer,
  BarChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  ToolboxComponent
])

const themeStore = useThemeStore()
const loading = ref(true)
const errorMsg = ref<string | null>(null)
const isEmpty = ref(false)
const chartOption = ref({})
const chartRef = ref<any>(null)

// 统计数据
const stats = ref({
  user_total: 0,
  user_added_yesterday: 0,
  user_added_month: 0
})

// 提供 ECharts 主题
provide(
  THEME_KEY,
  computed(() => themeStore.naiveThemeName)
)

/**
 * 获取月份标签
 */
const getMonthLabel = (monthNumber: number): string => {
  return `${monthNumber}月`
}

/**
 * 处理图表数据
 */
const processData = (
  userListMonth: { mon: number; num: number }[]
): { monthLabels: string[]; userCounts: number[] } => {
  const monthLabels: string[] = []
  const userCounts: number[] = []

  if (Array.isArray(userListMonth)) {
    userListMonth.sort((a, b) => a.mon - b.mon)
    userListMonth.forEach(item => {
      monthLabels.push(getMonthLabel(item.mon))
      userCounts.push(item.num || 0)
    })
  }

  isEmpty.value = monthLabels.length === 0
  return { monthLabels, userCounts }
}

/**
 * 更新图表配置
 */
const updateChartOption = (processedData: { monthLabels: string[]; userCounts: number[] }) => {
  const { monthLabels, userCounts } = processedData
  const seriesName = $t('card.tenantChart.seriesName', '新增用户')

  // 柱状图颜色配置
  const barColor = themeStore.isDark ? '#36a2eb' : '#4bc0c0'
  const hoverColor = themeStore.isDark ? '#4cb1ef' : '#5cd1d1'

  chartOption.value = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      backgroundColor: themeStore.isDark ? 'rgba(40, 40, 40, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      borderColor: themeStore.isDark ? '#555' : '#ddd',
      borderWidth: 1,
      textStyle: {
        color: themeStore.isDark ? '#ccc' : '#333',
        fontSize: 12
      },
      formatter: (params: any) => {
        if (!params || params.length === 0) return ''
        const p = params[0]
        return `<div style="margin-bottom: 4px; font-weight: bold;">${p.name}</div><div>${p.marker}${p.seriesName}: <span style="font-weight: bold;">${p.value}</span></div>`
      }
    },
    grid: {
      left: '5%',
      right: '5%',
      top: '15%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: monthLabels,
      axisTick: {
        show: false,
        alignWithLabel: true
      },
      axisLine: {
        lineStyle: {
          color: themeStore.isDark ? '#555' : '#e1e5e9'
        }
      },
      axisLabel: {
        color: themeStore.isDark ? '#aaa' : '#666',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: themeStore.isDark ? '#aaa' : '#666',
        fontSize: 11
      },
      splitLine: {
        lineStyle: {
          color: themeStore.isDark ? '#333' : '#f0f0f0',
          type: 'dashed'
        }
      },
      axisLine: {
        show: false
      }
    },
    series: [
      {
        name: seriesName,
        type: 'bar',
        barWidth: '40%',
        data: userCounts,
        itemStyle: {
          color: barColor,
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: hoverColor,
            shadowColor: 'rgba(0, 0, 0, 0.2)',
            shadowBlur: 10
          }
        }
      }
    ]
  }
}

/**
 * 获取租户数据
 */
const fetchData = async () => {
  loading.value = true
  errorMsg.value = null
  isEmpty.value = false

  try {
    const response = await tenant()
    const responseData = response?.data

    if (responseData) {
      // 存储统计数据
      stats.value = {
        user_total: responseData.user_total || 0,
        user_added_yesterday: responseData.user_added_yesterday || 0,
        user_added_month: responseData.user_added_month || 0
      }

      // 处理图表数据
      const userListMonth = responseData.user_list_month
      if (userListMonth) {
        const processed = processData(userListMonth)
        updateChartOption(processed)
      } else {
        isEmpty.value = true
      }
    } else {
      console.error('No data found in API response:', response)
      isEmpty.value = true
      stats.value = { user_total: 0, user_added_yesterday: 0, user_added_month: 0 }
    }
  } catch (err: any) {
    console.error('Error fetching or processing tenant data:', err)
    errorMsg.value = $t('common.loadFailure', 'Failed to load data')
    stats.value = { user_total: 0, user_added_yesterday: 0, user_added_month: 0 }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

defineOptions({
  name: 'TenantChartCard21'
})
</script>

<style scoped>
/* 确保图表响应式 */
:deep(.echarts) {
  min-height: 180px;
}

/* 数字动画样式优化 */
:deep(.n-number-animation) {
  font-family: 'Inter', system-ui, sans-serif;
  font-variant-numeric: tabular-nums;
}

/* 深色模式适配 */
:deep(.dark) {
  .echarts {
    color-scheme: dark;
  }
}
</style>