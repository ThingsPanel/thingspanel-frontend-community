<template>
  <div class="enhanced-test-page">
    <h1>数据源配置增强测试页面</h1>

    <!-- 状态指示器 -->
    <div class="status-bar">
      <div class="status-item">
        <span class="status-label">执行器状态:</span>
        <span :class="['status-value', executorStatus]">
          {{ executorStatusText }}
        </span>
      </div>
      <div class="status-item">
        <span class="status-label">自动更新:</span>
        <n-switch v-model:value="autoUpdate" @update:value="toggleAutoUpdate" />
      </div>
      <div class="status-item">
        <span class="status-label">更新间隔:</span>
        <n-input-number v-model:value="updateInterval" :min="1000" :max="30000" :step="1000" style="width: 120px" />
        ms
      </div>
    </div>

    <!-- 配置表单 -->
    <div class="config-section">
      <h2>配置表单</h2>
      <DataSourceConfigForm v-model="configData" :data-sources="dataSources" @update:model-value="onConfigUpdate" />
    </div>

    <!-- 实时数据显示 -->
    <div class="data-display">
      <div class="current-config">
        <h2>当前配置数据</h2>
        <div class="config-preview">
          <div class="config-item">
            <strong>激活数据源:</strong>
            {{ configData.activeDataSourceKey || '未选择' }}
          </div>
          <div class="config-item">
            <strong>配置详情:</strong>
            <pre>{{ formatConfig(configData.dataSourceBindings) }}</pre>
          </div>
        </div>
      </div>

      <div class="component-data">
        <h2>组件数据 (实时更新)</h2>
        <div v-if="componentData" class="data-content">
          <div class="data-meta">
            <span>最后更新: {{ lastUpdateTime }}</span>
            <span>执行耗时: {{ lastExecutionTime }}ms</span>
          </div>
          <pre>{{ JSON.stringify(componentData, null, 2) }}</pre>
        </div>
        <div v-else class="no-data">
          <p>暂无数据 - 请配置数据源并启动执行器</p>
        </div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="control-buttons">
      <n-button type="primary" :loading="executing" @click="executeOnce">立即执行</n-button>
      <n-button type="success" :disabled="executorRunning" @click="startExecutor">启动执行器</n-button>
      <n-button type="warning" :disabled="!executorRunning" @click="stopExecutor">停止执行器</n-button>
      <n-button type="error" @click="resetAll">重置所有</n-button>
      <n-button type="info" @click="addTestData">添加测试数据</n-button>
    </div>

    <!-- 执行历史 -->
    <div class="execution-history">
      <h2>执行历史</h2>
      <div class="history-controls">
        <n-button size="small" @click="clearHistory">清空历史</n-button>
        <span class="history-count">共 {{ executionHistory.length }} 条记录</span>
      </div>
      <div class="history-list">
        <div
          v-for="(record, index) in executionHistory.slice(0, 10)"
          :key="index"
          class="history-item"
          :class="{ success: record.success, error: !record.success }"
        >
          <div class="history-time">{{ record.time }}</div>
          <div class="history-status">
            {{ record.success ? '成功' : '失败' }}
          </div>
          <div class="history-duration">{{ record.duration }}ms</div>
          <div class="history-message">{{ record.message }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUnmounted, computed } from 'vue'
import { NButton, NSwitch, NInputNumber } from 'naive-ui'
import DataSourceConfigForm from './components/data-source-config-form/forms/DataSourceConfigForm.vue'
// import { simpleDataExecutor } from './core/simple-data-executor' - 已被 UnifiedDataExecutor 替代
import type { ModelValue, DataSource, ComponentData, SimpleDataSourceConfig } from './types'

// 执行器状态
const executorStatus = ref<'idle' | 'running' | 'error'>('idle')
const executorRunning = ref(false)
const executing = ref(false)
const autoUpdate = ref(false)
const updateInterval = ref(3000)

// 定时器
let updateTimer: NodeJS.Timeout | null = null

// 执行历史
interface ExecutionRecord {
  time: string
  success: boolean
  duration: number
  message: string
  data?: any
}

const executionHistory = ref<ExecutionRecord[]>([])
const lastUpdateTime = ref<string>('')
const lastExecutionTime = ref<number>(0)

// 计算属性
const executorStatusText = computed(() => {
  switch (executorStatus.value) {
    case 'running':
      return '运行中'
    case 'error':
      return '错误'
    default:
      return '空闲'
  }
})

// 测试用的数据源定义
const dataSources = reactive<Record<string, DataSource>>({
  staticData: {
    key: 'staticData',
    name: '静态数据',
    description: '静态数据源，用于测试基本功能',
    defaultConfig: {
      data: {
        message: 'Hello World',
        count: 0,
        timestamp: Date.now()
      },
      enabled: true
    }
  },
  dynamicData: {
    key: 'dynamicData',
    name: '动态数据',
    description: '动态生成的随机数据',
    defaultConfig: {
      type: 'random',
      min: 0,
      max: 100,
      precision: 2,
      fields: ['temperature', 'humidity', 'pressure']
    }
  },
  counterData: {
    key: 'counterData',
    name: '计数器数据',
    description: '自增计数器数据源',
    defaultConfig: {
      start: 0,
      step: 1,
      max: 1000,
      reset: false
    }
  }
})

// 配置数据 - v-model绑定
const configData = ref<ModelValue>({
  activeDataSourceKey: 'staticData',
  dataSourceBindings: {
    staticData: {
      data: {
        message: 'Hello World',
        count: 0,
        timestamp: Date.now()
      },
      enabled: true
    }
  }
})

// 组件数据 - 执行器输出
const componentData = ref<ComponentData | null>(null)

// 内部计数器（用于动态数据生成）
let internalCounter = 0

// 格式化配置显示
function formatConfig(bindings: Record<string, any> | undefined) {
  if (!bindings) return '{}'
  return JSON.stringify(bindings, null, 2)
}

// 添加执行记录
function addExecutionRecord(success: boolean, duration: number, message: string, data?: any) {
  executionHistory.value.unshift({
    time: new Date().toLocaleTimeString(),
    success,
    duration,
    message,
    data
  })

  // 保持最多100条记录
  if (executionHistory.value.length > 100) {
    executionHistory.value = executionHistory.value.slice(0, 100)
  }
}

// 配置更新回调
function onConfigUpdate(newConfig: ModelValue) {
  console.log('配置更新:', newConfig)

  // 如果自动更新开启，立即执行一次
  if (autoUpdate.value) {
    executeOnce()
  }
}

// 生成动态数据
function generateDynamicData(config: any) {
  const activeKey = configData.value.activeDataSourceKey

  switch (activeKey) {
    case 'staticData':
      return {
        ...config.data,
        lastUpdate: new Date().toISOString()
      }

    case 'dynamicData':
      const fields = config.fields || ['value']
      const data: any = {}

      fields.forEach((field: string) => {
        const min = config.min || 0
        const max = config.max || 100
        const precision = config.precision || 0
        data[field] = Number((Math.random() * (max - min) + min).toFixed(precision))
      })

      return {
        ...data,
        timestamp: Date.now(),
        iteration: ++internalCounter
      }

    case 'counterData':
      const start = config.start || 0
      const step = config.step || 1
      const max = config.max || 1000

      internalCounter += step
      if (internalCounter > max && config.reset) {
        internalCounter = start
      }

      return {
        count: internalCounter,
        timestamp: Date.now(),
        progress: Math.min((internalCounter / max) * 100, 100)
      }

    default:
      return { message: 'Unknown data source', timestamp: Date.now() }
  }
}

// 执行数据源（单次）
async function executeOnce() {
  if (executing.value) return

  executing.value = true
  const startTime = Date.now()

  try {
    executorStatus.value = 'running'

    // 构建配置
    const activeKey = configData.value.activeDataSourceKey
    const activeConfig = configData.value.dataSourceBindings?.[activeKey || '']

    if (!activeKey || !activeConfig) {
      throw new Error('没有激活的数据源配置')
    }

    // 生成数据
    const generatedData = generateDynamicData(activeConfig)

    // 模拟执行器返回格式
    const result = {
      success: true,
      data: {
        [activeKey]: {
          type: activeKey,
          data: generatedData,
          lastUpdated: Date.now(),
          metadata: {
            source: 'enhanced-test-executor',
            version: '1.0.0'
          }
        }
      },
      executionTime: Date.now() - startTime,
      timestamp: Date.now()
    }

    // 更新组件数据
    componentData.value = result.data
    lastUpdateTime.value = new Date().toLocaleTimeString()
    lastExecutionTime.value = result.executionTime

    // 记录成功
    addExecutionRecord(true, result.executionTime, `成功执行 ${activeKey}`)
    executorStatus.value = 'idle'
  } catch (error) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : '未知错误'

    addExecutionRecord(false, duration, `执行失败: ${message}`)
    executorStatus.value = 'error'
    console.error('执行数据源出错:', error)
  } finally {
    executing.value = false
  }
}

// 启动执行器
function startExecutor() {
  if (executorRunning.value) return

  executorRunning.value = true
  executorStatus.value = 'running'

  // 立即执行一次
  executeOnce()

  // 设置定时器
  if (autoUpdate.value) {
    updateTimer = setInterval(() => {
      executeOnce()
    }, updateInterval.value)
  }

  addExecutionRecord(true, 0, '执行器已启动')
}

// 停止执行器
function stopExecutor() {
  executorRunning.value = false
  executorStatus.value = 'idle'

  if (updateTimer) {
    clearInterval(updateTimer)
    updateTimer = null
  }

  addExecutionRecord(true, 0, '执行器已停止')
}

// 切换自动更新
function toggleAutoUpdate(enabled: boolean) {
  if (enabled && executorRunning.value) {
    // 启动定时器
    updateTimer = setInterval(() => {
      executeOnce()
    }, updateInterval.value)
  } else if (updateTimer) {
    // 停止定时器
    clearInterval(updateTimer)
    updateTimer = null
  }
}

// 重置所有
function resetAll() {
  stopExecutor()

  configData.value = {
    activeDataSourceKey: 'staticData',
    dataSourceBindings: {
      staticData: {
        data: {
          message: 'Hello World',
          count: 0,
          timestamp: Date.now()
        },
        enabled: true
      }
    }
  }

  componentData.value = null
  internalCounter = 0
  executionHistory.value = []
  lastUpdateTime.value = ''
  lastExecutionTime.value = 0

  addExecutionRecord(true, 0, '已重置所有数据')
}

// 添加测试数据
function addTestData() {
  const activeKey = configData.value.activeDataSourceKey
  if (activeKey && configData.value.dataSourceBindings) {
    const currentConfig = configData.value.dataSourceBindings[activeKey] || {}

    // 添加测试字段
    const testData = {
      ...currentConfig,
      testField: `test_${Date.now()}`,
      randomValue: Math.floor(Math.random() * 1000),
      timestamp: Date.now(),
      nested: {
        level1: {
          level2: 'deep value'
        }
      }
    }

    configData.value.dataSourceBindings[activeKey] = testData
    addExecutionRecord(true, 0, `已添加测试数据到 ${activeKey}`)
  }
}

// 清空历史
function clearHistory() {
  executionHistory.value = []
}

// 监听配置变化
watch(
  () => configData.value,
  newConfig => {
    console.log('配置变化监听:', newConfig)
  },
  { deep: true }
)

// 监听更新间隔变化
watch(updateInterval, newInterval => {
  if (autoUpdate.value && updateTimer) {
    clearInterval(updateTimer)
    updateTimer = setInterval(() => {
      executeOnce()
    }, newInterval)
  }
})

// 组件挂载
onMounted(() => {
  addExecutionRecord(true, 0, '增强测试页面已加载')
})

// 组件卸载
onUnmounted(() => {
  stopExecutor()
})
</script>

<style scoped>
.enhanced-test-page {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
  font-size: 28px;
}

h2 {
  color: #34495e;
  margin-bottom: 15px;
  font-size: 18px;
  border-bottom: 2px solid #3498db;
  padding-bottom: 5px;
}

.status-bar {
  display: flex;
  gap: 20px;
  align-items: center;
  padding: 15px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  font-weight: 500;
}

.status-value {
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.status-value.idle {
  background: #95a5a6;
}

.status-value.running {
  background: #27ae60;
  animation: pulse 2s infinite;
}

.status-value.error {
  background: #e74c3c;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
  100% {
    opacity: 1;
  }
}

.config-section,
.data-display,
.control-buttons,
.execution-history {
  margin-bottom: 25px;
  padding: 20px;
  border: 1px solid #e1e8ed;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.data-display {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 768px) {
  .data-display {
    grid-template-columns: 1fr;
  }
}

.config-preview {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #3498db;
}

.config-item {
  margin-bottom: 10px;
}

.config-item strong {
  color: #2c3e50;
}

.data-content {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  border-left: 4px solid #27ae60;
}

.data-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 12px;
  color: #7f8c8d;
}

.no-data {
  text-align: center;
  color: #95a5a6;
  font-style: italic;
  padding: 40px;
}

pre {
  background: #2c3e50;
  color: #ecf0f1;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.4;
  margin: 0;
}

.control-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.history-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.history-count {
  color: #7f8c8d;
  font-size: 14px;
}

.history-list {
  max-height: 300px;
  overflow-y: auto;
}

.history-item {
  display: grid;
  grid-template-columns: 80px 60px 80px 1fr;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 13px;
  align-items: center;
}

.history-item.success {
  background: #d5f4e6;
  border-left: 3px solid #27ae60;
}

.history-item.error {
  background: #ffeaa7;
  border-left: 3px solid #e17055;
}

.history-time {
  color: #7f8c8d;
  font-family: monospace;
}

.history-status {
  font-weight: bold;
}

.history-item.success .history-status {
  color: #27ae60;
}

.history-item.error .history-status {
  color: #e74c3c;
}

.history-duration {
  color: #7f8c8d;
  font-family: monospace;
}

.history-message {
  color: #2c3e50;
}
</style>
