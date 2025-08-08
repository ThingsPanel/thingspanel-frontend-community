<template>
  <div class="real-time-monitor-demo">
    <div class="demo-header">
      <h1>实时监控组件演示</h1>
      <p>展示 Card 2.1 实时监控组件的完整功能</p>
    </div>

    <div class="demo-content">
      <!-- 控制面板 -->
      <div class="control-panel">
        <div class="panel-section">
          <h3>演示控制</h3>
          <div class="control-buttons">
            <button :disabled="isRunning" class="btn btn-primary" @click="startDemo">
              {{ isRunning ? '运行中...' : '开始演示' }}
            </button>
            <button :disabled="!isRunning" class="btn btn-secondary" @click="stopDemo">停止演示</button>
            <button class="btn btn-reset" @click="resetDemo">重置</button>
          </div>
        </div>

        <div class="panel-section">
          <h3>数据源切换</h3>
          <div class="data-source-controls">
            <label class="radio-group">
              <input v-model="currentDataSource" type="radio" value="static" name="dataSource" />
              <span>静态数据</span>
            </label>
            <label class="radio-group">
              <input v-model="currentDataSource" type="radio" value="simulated" name="dataSource" />
              <span>模拟实时数据</span>
            </label>
            <label class="radio-group">
              <input v-model="currentDataSource" type="radio" value="api" name="dataSource" />
              <span>API数据</span>
            </label>
          </div>
        </div>

        <div class="panel-section">
          <h3>配置选项</h3>
          <div class="config-options">
            <label class="checkbox-group">
              <input v-model="showDebugInfo" type="checkbox" />
              <span>显示调试信息</span>
            </label>
            <label class="checkbox-group">
              <input v-model="showConfigPanel" type="checkbox" />
              <span>显示配置面板</span>
            </label>
            <label class="checkbox-group">
              <input v-model="enableAlerts" type="checkbox" />
              <span>启用告警</span>
            </label>
          </div>
        </div>

        <div class="panel-section">
          <h3>性能监控</h3>
          <div class="performance-stats">
            <div class="stat-item">
              <span class="stat-label">更新频率:</span>
              <span class="stat-value">{{ updateInterval }}ms</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">数据点数量:</span>
              <span class="stat-value">{{ dataPointCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">告警数量:</span>
              <span class="stat-value">{{ alertCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">运行时间:</span>
              <span class="stat-value">{{ runningTime }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 组件展示区域 -->
      <div class="component-area">
        <div class="component-container">
          <RealTimeMonitorCard
            :data-source="componentDataSource"
            :title="componentTitle"
            :show-debug-info="showDebugInfo"
          />
        </div>

        <!-- 配置面板 -->
        <div v-if="showConfigPanel" class="config-panel-container">
          <RealTimeMonitorConfigPanel v-model="componentConfig" @update:model-value="handleConfigUpdate" />
        </div>
      </div>
    </div>

    <!-- 日志区域 -->
    <div class="log-area">
      <div class="log-header">
        <h3>系统日志</h3>
        <button class="btn btn-small" @click="clearLogs">清空日志</button>
      </div>
      <div ref="logContainer" class="log-content">
        <div v-for="(log, index) in logs" :key="index" class="log-entry" :class="`log-${log.level}`">
          <span class="log-time">{{ log.time }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import RealTimeMonitorCard from '@/card2.1/components/real-time-monitor/RealTimeMonitorCard.vue'
import RealTimeMonitorConfigPanel from '@/card2.1/components/real-time-monitor/RealTimeMonitorConfigPanel.vue'

// 响应式数据
const isRunning = ref(false)
const currentDataSource = ref<'static' | 'simulated' | 'api'>('static')
const showDebugInfo = ref(false)
const showConfigPanel = ref(true)
const enableAlerts = ref(true)
const updateInterval = ref(5000)
const dataPointCount = ref(0)
const alertCount = ref(0)
const runningTime = ref('00:00:00')
const logs = ref<Array<{ time: string; level: string; message: string }>>([])
const logContainer = ref<HTMLElement>()

// 组件配置
const componentTitle = ref('实时监控演示')
const componentConfig = ref({
  title: '实时监控演示',
  updateInterval: 5000,
  dataSource: {
    type: 'static',
    data: {
      temperature: 25.0,
      humidity: 60.0,
      pressure: 1013.25
    }
  },
  thresholds: {
    temperature: { min: 10, max: 35, warning: 15, critical: 5 },
    humidity: { min: 30, max: 80, warning: 25, critical: 20 },
    battery: { warning: 20, critical: 10 },
    signal: { warning: 30, critical: 15 }
  },
  showDebugInfo: false,
  showHistoryChart: true,
  showAlerts: true
})

// 计算属性
const componentDataSource = computed(() => {
  return componentConfig.value.dataSource
})

// 定时器
let demoTimer: NodeJS.Timeout | null = null
let startTime: number = 0

// 方法
const addLog = (level: string, message: string) => {
  const time = new Date().toLocaleTimeString('zh-CN')
  logs.value.push({ time, level, message })

  // 保持最多100条日志
  if (logs.value.length > 100) {
    logs.value = logs.value.slice(-100)
  }

  // 自动滚动到底部
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

const startDemo = () => {
  isRunning.value = true
  startTime = Date.now()
  addLog('info', '开始实时监控演示')

  // 启动定时器
  demoTimer = setInterval(() => {
    updateRunningTime()
    simulateDataUpdate()
  }, updateInterval.value)
}

const stopDemo = () => {
  isRunning.value = false
  if (demoTimer) {
    clearInterval(demoTimer)
    demoTimer = null
  }
  addLog('info', '停止实时监控演示')
}

const resetDemo = () => {
  stopDemo()
  dataPointCount.value = 0
  alertCount.value = 0
  runningTime.value = '00:00:00'
  addLog('info', '重置演示数据')
}

const clearLogs = () => {
  logs.value = []
}

const updateRunningTime = () => {
  const elapsed = Date.now() - startTime
  const hours = Math.floor(elapsed / 3600000)
  const minutes = Math.floor((elapsed % 3600000) / 60000)
  const seconds = Math.floor((elapsed % 60000) / 1000)
  runningTime.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const simulateDataUpdate = () => {
  dataPointCount.value++

  // 模拟数据变化
  if (currentDataSource.value === 'simulated') {
    const temperature = 20 + Math.random() * 20
    const humidity = 40 + Math.random() * 40
    const pressure = 1000 + Math.random() * 50

    componentConfig.value.dataSource.data = {
      temperature: parseFloat(temperature.toFixed(1)),
      humidity: parseFloat(humidity.toFixed(1)),
      pressure: parseFloat(pressure.toFixed(1))
    }

    addLog(
      'debug',
      `数据更新: 温度=${temperature.toFixed(1)}°C, 湿度=${humidity.toFixed(1)}%, 气压=${pressure.toFixed(1)}hPa`
    )
  }

  // 模拟告警
  if (enableAlerts.value && Math.random() < 0.1) {
    alertCount.value++
    const alertMessages = ['温度异常波动', '湿度超出正常范围', '设备电池电量低', '信号强度下降', '数据更新延迟']
    const message = alertMessages[Math.floor(Math.random() * alertMessages.length)]
    addLog('warning', `告警: ${message}`)
  }
}

const handleConfigUpdate = (newConfig: any) => {
  componentConfig.value = newConfig
  updateInterval.value = newConfig.updateInterval
  addLog('info', '配置已更新')
}

// 生命周期
onMounted(() => {
  addLog('info', '实时监控演示页面已加载')
  addLog('info', 'Card 2.1 系统初始化完成')
})

onUnmounted(() => {
  if (demoTimer) {
    clearInterval(demoTimer)
  }
})
</script>

<style scoped>
.real-time-monitor-demo {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

.demo-header {
  text-align: center;
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.demo-header h1 {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
}

.demo-header p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

.demo-content {
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.control-panel {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.panel-section {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.panel-section:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.panel-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #1976d2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1565c0;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-reset {
  background: #ff9800;
  color: white;
}

.btn-reset:hover {
  background: #f57c00;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.data-source-controls,
.config-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-group,
.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
}

.radio-group input,
.checkbox-group input {
  margin: 0;
}

.performance-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.component-area {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.component-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  min-height: 600px;
}

.config-panel-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.log-area {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.log-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.log-content {
  height: 300px;
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

.log-entry {
  display: flex;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid #e0e0e0;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: #666;
  min-width: 80px;
}

.log-level {
  font-weight: 600;
  min-width: 60px;
}

.log-level.log-info {
  color: #1976d2;
}

.log-level.log-warning {
  color: #f57c00;
}

.log-level.log-error {
  color: #d32f2f;
}

.log-level.log-debug {
  color: #666;
}

.log-message {
  color: #333;
  flex: 1;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .demo-content {
    grid-template-columns: 1fr;
  }

  .control-panel {
    order: 2;
  }

  .component-area {
    order: 1;
  }
}

@media (max-width: 768px) {
  .real-time-monitor-demo {
    padding: 12px;
  }

  .demo-header {
    padding: 16px;
  }

  .demo-header h1 {
    font-size: 24px;
  }

  .component-container {
    padding: 12px;
  }
}
</style>
