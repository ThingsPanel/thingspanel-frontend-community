<!--
  ECharts 重复注册修复测试页面
-->
<template>
  <div class="echarts-fix-test">
    <n-card title="ECharts 重复注册修复测试">
      <n-space vertical size="large">
        <!-- 状态检查 -->
        <n-card title="系统状态" size="small">
          <n-space vertical size="small">
            <n-tag :type="echartsManager.isRegistered() ? 'success' : 'error'">
              ECharts 组件注册状态: {{ echartsManager.isRegistered() ? '已注册' : '未注册' }}
            </n-tag>

            <n-tag v-if="testStatus.message" :type="testStatus.status">
              {{ testStatus.message }}
            </n-tag>
          </n-space>
        </n-card>

        <!-- 测试按钮 -->
        <n-card title="功能测试" size="small">
          <n-space>
            <n-button type="primary" @click="testTraditionalChart">测试传统图表</n-button>

            <n-button type="primary" @click="testCard2Chart">测试 Card 2.0 图表</n-button>

            <n-button type="primary" @click="testMultipleCharts">测试多图表并发</n-button>

            <n-button type="error" secondary @click="clearAllTests">清空测试</n-button>
          </n-space>
        </n-card>

        <!-- 测试结果区域 -->
        <div class="test-charts-container">
          <div
            v-for="chart in testCharts"
            :key="chart.id"
            :ref="el => (chartRefs[chart.id] = el)"
            class="test-chart-item"
          >
            <n-tag :type="chart.status === 'success' ? 'success' : 'error'" size="small">
              {{ chart.title }} - {{ chart.status }}
            </n-tag>
          </div>
        </div>

        <!-- 错误日志 -->
        <n-card v-if="errorLogs.length > 0" title="错误日志" size="small">
          <n-space vertical size="small">
            <div v-for="(error, index) in errorLogs" :key="index" class="error-log">
              <n-text type="error">{{ error.time }}: {{ error.message }}</n-text>
            </div>
          </n-space>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useMessage } from 'naive-ui'
import { useEChartsInstance } from '@/utils/echarts/echarts-manager'

const message = useMessage()
const echartsManager = useEChartsInstance()

// 测试状态
const testStatus = ref<{ status: 'info' | 'success' | 'error' | 'warning'; message: string }>({
  status: 'info',
  message: ''
})

// 图表引用
const chartRefs = reactive<Record<string, HTMLElement>>({})

// 测试图表列表
const testCharts = ref<
  Array<{
    id: string
    title: string
    status: 'pending' | 'success' | 'error'
    instance?: any
  }>
>([])

// 错误日志
const errorLogs = ref<Array<{ time: string; message: string }>>([])

// 添加错误日志
const addErrorLog = (message: string) => {
  errorLogs.value.push({
    time: new Date().toLocaleTimeString(),
    message
  })
}

// 监听全局错误
const handleGlobalError = (event: ErrorEvent) => {
  if (event.error && event.error.message && event.error.message.includes('exists')) {
    addErrorLog(`全局错误: ${event.error.message}`)
    testStatus.value = {
      status: 'error',
      message: '检测到 ECharts 重复注册错误'
    }
  }
}

// 测试传统图表
const testTraditionalChart = async () => {
  const chartId = `traditional-${Date.now()}`

  try {
    testCharts.value.push({
      id: chartId,
      title: '传统图表',
      status: 'pending'
    })

    // 等待 DOM 更新
    await new Promise(resolve => setTimeout(resolve, 100))

    const container = chartRefs[chartId]
    if (!container) {
      throw new Error('找不到容器元素')
    }

    // 设置容器样式
    container.style.width = '300px'
    container.style.height = '200px'
    container.style.border = '1px solid #ccc'
    container.style.margin = '10px'

    // 创建图表实例
    const chartInstance = echartsManager.createInstance(container)

    // 设置配置
    chartInstance.setOption({
      title: { text: '传统测试图表' },
      xAxis: { data: ['A', 'B', 'C'] },
      yAxis: {},
      series: [
        {
          type: 'bar',
          data: [10, 20, 30]
        }
      ]
    })

    // 更新状态
    const chart = testCharts.value.find(c => c.id === chartId)
    if (chart) {
      chart.status = 'success'
      chart.instance = chartInstance
    }

    testStatus.value = {
      status: 'success',
      message: '传统图表创建成功'
    }
  } catch (error) {
    addErrorLog(`传统图表测试失败: ${error}`)
    const chart = testCharts.value.find(c => c.id === chartId)
    if (chart) {
      chart.status = 'error'
    }
    testStatus.value = {
      status: 'error',
      message: `传统图表测试失败: ${error}`
    }
  }
}

// 测试 Card 2.0 图表
const testCard2Chart = async () => {
  const chartId = `card2-${Date.now()}`

  try {
    testCharts.value.push({
      id: chartId,
      title: 'Card 2.0 图表',
      status: 'pending'
    })

    // 等待 DOM 更新
    await new Promise(resolve => setTimeout(resolve, 100))

    const container = chartRefs[chartId]
    if (!container) {
      throw new Error('找不到容器元素')
    }

    // 设置容器样式
    container.style.width = '300px'
    container.style.height = '200px'
    container.style.border = '1px solid #007fff'
    container.style.margin = '10px'

    // 创建图表实例
    const chartInstance = echartsManager.createInstance(container, 'light')

    // 设置配置
    chartInstance.setOption({
      title: { text: 'Card 2.0 测试图表' },
      xAxis: { data: ['X', 'Y', 'Z'] },
      yAxis: {},
      series: [
        {
          type: 'line',
          data: [15, 25, 35],
          smooth: true
        }
      ]
    })

    // 更新状态
    const chart = testCharts.value.find(c => c.id === chartId)
    if (chart) {
      chart.status = 'success'
      chart.instance = chartInstance
    }

    testStatus.value = {
      status: 'success',
      message: 'Card 2.0 图表创建成功'
    }
  } catch (error) {
    addErrorLog(`Card 2.0 图表测试失败: ${error}`)
    const chart = testCharts.value.find(c => c.id === chartId)
    if (chart) {
      chart.status = 'error'
    }
    testStatus.value = {
      status: 'error',
      message: `Card 2.0 图表测试失败: ${error}`
    }
  }
}

// 测试多图表并发
const testMultipleCharts = async () => {
  try {
    testStatus.value = {
      status: 'info',
      message: '正在测试多图表并发创建...'
    }

    const promises = []

    // 并发创建多个图表
    for (let i = 0; i < 5; i++) {
      promises.push(createTestChart(`multi-${i}-${Date.now()}`, `并发图表 ${i + 1}`))
    }

    await Promise.all(promises)

    testStatus.value = {
      status: 'success',
      message: '多图表并发测试成功'
    }
  } catch (error) {
    addErrorLog(`多图表并发测试失败: ${error}`)
    testStatus.value = {
      status: 'error',
      message: `多图表并发测试失败: ${error}`
    }
  }
}

// 创建测试图表
const createTestChart = async (chartId: string, title: string) => {
  testCharts.value.push({
    id: chartId,
    title,
    status: 'pending'
  })

  // 等待 DOM 更新
  await new Promise(resolve => setTimeout(resolve, 50))

  const container = chartRefs[chartId]
  if (!container) {
    throw new Error('找不到容器元素')
  }

  // 设置容器样式
  container.style.width = '200px'
  container.style.height = '150px'
  container.style.border = '1px solid #00b96b'
  container.style.margin = '5px'
  container.style.display = 'inline-block'

  // 创建图表实例
  const chartInstance = echartsManager.createInstance(container)

  // 设置配置
  chartInstance.setOption({
    title: { text: title, textStyle: { fontSize: 12 } },
    xAxis: { data: ['1', '2', '3'] },
    yAxis: {},
    series: [
      {
        type: 'bar',
        data: [Math.random() * 100, Math.random() * 100, Math.random() * 100]
      }
    ]
  })

  // 更新状态
  const chart = testCharts.value.find(c => c.id === chartId)
  if (chart) {
    chart.status = 'success'
    chart.instance = chartInstance
  }
}

// 清空所有测试
const clearAllTests = () => {
  // 销毁所有图表实例
  testCharts.value.forEach(chart => {
    if (chart.instance) {
      try {
        chart.instance.dispose()
      } catch (error) {
        console.warn('销毁图表实例失败:', error)
      }
    }
  })

  testCharts.value = []
  errorLogs.value = []
  testStatus.value = { status: 'info', message: '' }

  // 清空容器
  Object.values(chartRefs).forEach(container => {
    if (container) {
      container.innerHTML = ''
    }
  })

  message.success('测试已清空')
}

onMounted(() => {
  console.log('🧪 ECharts 修复测试页面已加载')

  // 监听全局错误
  window.addEventListener('error', handleGlobalError)

  testStatus.value = {
    status: 'success',
    message: 'ECharts 管理器初始化完成'
  }
})

onUnmounted(() => {
  window.removeEventListener('error', handleGlobalError)
  clearAllTests()
})
</script>

<style scoped>
.echarts-fix-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-charts-container {
  min-height: 100px;
  border: 1px dashed var(--n-border-color);
  border-radius: 4px;
  padding: 16px;
  background: var(--n-body-color);
}

.test-chart-item {
  position: relative;
  display: inline-block;
  vertical-align: top;
}

.error-log {
  font-family: monospace;
  font-size: 12px;
  background: var(--n-error-color-suppl);
  padding: 4px 8px;
  border-radius: 2px;
}
</style>
