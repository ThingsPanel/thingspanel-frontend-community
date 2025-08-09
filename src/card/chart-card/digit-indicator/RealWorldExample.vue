<template>
  <div class="real-world-example">
    <n-card title="真实场景 WebSocket 数据流示例" size="small">
      <n-space vertical>
        <!-- 场景说明 -->
        <n-alert type="success" title="生产环境使用场景">
          <template #default>
            <p>
              <strong>场景</strong>
              ：工厂温度监控系统
            </p>
            <p>
              <strong>设备</strong>
              ：温度传感器 (device_001)
            </p>
            <p>
              <strong>数据</strong>
              ：实时温度数据，每5秒更新一次
            </p>
            <p>
              <strong>显示</strong>
              ：digit-indicator 组件实时显示温度
            </p>
          </template>
        </n-alert>

        <!-- 设备状态 -->
        <n-divider title-placement="left">设备状态</n-divider>

        <n-space>
          <n-tag :type="deviceStatus.type" size="large">
            {{ deviceStatus.text }}
          </n-tag>
          <n-text>设备ID: device_001</n-text>
          <n-text>指标: temperature</n-text>
        </n-space>

        <!-- 实时数据显示 -->
        <n-divider title-placement="left">实时数据显示</n-divider>

        <div class="dashboard">
          <div class="component-container">
            <component :is="digitIndicatorComponent" ref="digitIndicatorRef" :card="cardData" />
          </div>

          <div class="data-panel">
            <n-card title="数据详情" size="small">
              <n-space vertical>
                <div class="data-item">
                  <n-text strong>当前温度:</n-text>
                  {{ currentTemperature }}°C
                </div>
                <div class="data-item">
                  <n-text strong>更新时间:</n-text>
                  {{ lastUpdateTime }}
                </div>
                <div class="data-item">
                  <n-text strong>数据质量:</n-text>
                  <n-tag :type="dataQuality.type" size="small">
                    {{ dataQuality.text }}
                  </n-tag>
                </div>
              </n-space>
            </n-card>
          </div>
        </div>

        <!-- 模拟控制 -->
        <n-divider title-placement="left">模拟控制</n-divider>

        <n-space>
          <n-button type="primary" :disabled="isSimulating" @click="startSimulation">开始模拟</n-button>
          <n-button type="error" :disabled="!isSimulating" @click="stopSimulation">停止模拟</n-button>
          <n-button type="warning" :disabled="!isSimulating" @click="sendAlert">发送告警</n-button>
        </n-space>

        <!-- 数据历史 -->
        <n-divider title-placement="left">数据历史</n-divider>

        <n-card size="small" class="history-card">
          <div class="history-header">
            <n-text strong>最近10次数据更新</n-text>
            <n-button size="small" @click="clearHistory">清空历史</n-button>
          </div>
          <div class="history-content">
            <div v-for="(record, index) in dataHistory" :key="index" class="history-item">
              <span class="history-time">{{ formatTime(record.timestamp) }}</span>
              <span class="history-value">{{ record.value }}°C</span>
              <span class="history-type">{{ record.type }}</span>
            </div>
            <n-empty v-if="dataHistory.length === 0" description="暂无数据" size="small" />
          </div>
        </n-card>

        <!-- 系统日志 -->
        <n-divider title-placement="left">系统日志</n-divider>

        <n-card size="small" class="log-card">
          <div class="log-header">
            <n-text strong>WebSocket 连接日志</n-text>
            <n-button size="small" @click="clearLogs">清空日志</n-button>
          </div>
          <div class="log-content">
            <div v-for="(log, index) in logs" :key="index" class="log-item" :class="log.type">
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { NCard, NSpace, NDivider, NButton, NAlert, NText, NTag, NEmpty } from 'naive-ui'
import digitIndicatorComponent from './component.vue'

// 卡片数据
const cardData = ref({
  config: {
    color: '#ff4d4f',
    iconName: 'Thermometer',
    unit: '°C'
  },
  dataSource: {
    deviceSource: [
      {
        deviceId: 'device_001',
        metricsId: 'temperature',
        metricsName: '温度',
        metricsType: 'telemetry'
      }
    ]
  }
})

// 组件引用
const digitIndicatorRef = ref<any>(null)

// 状态管理
const isSimulating = ref(false)
const deviceStatus = ref({ type: 'success', text: '在线' })
const currentTemperature = ref(25.0)
const lastUpdateTime = ref('--')
const dataQuality = ref({ type: 'success', text: '良好' })

// 数据历史
const dataHistory = ref<Array<{ timestamp: string; value: number; type: string }>>([])

// 日志
const logs = ref<Array<{ timestamp: string; message: string; type: string }>>([])

// 模拟定时器
let simulationTimer: any = null

const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
  logs.value.push({
    timestamp: new Date().toISOString(),
    message,
    type
  })
}

const clearLogs = () => {
  logs.value = []
}

const clearHistory = () => {
  dataHistory.value = []
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}

// 模拟数据生成
const generateTemperature = () => {
  // 生成20-30度之间的随机温度
  const baseTemp = 25
  const variation = (Math.random() - 0.5) * 10
  return Math.round((baseTemp + variation) * 10) / 10
}

// 发送数据到组件
const sendDataToComponent = (temperature: number, type: string = 'normal') => {
  if (!digitIndicatorRef.value) return

  const data = {
    temperature: temperature
  }

  digitIndicatorRef.value.updateData('device_001', 'temperature', data)

  // 更新状态
  currentTemperature.value = temperature
  lastUpdateTime.value = new Date().toLocaleTimeString()

  // 添加到历史记录
  dataHistory.value.unshift({
    timestamp: new Date().toISOString(),
    value: temperature,
    type: type
  })

  // 保持最近10条记录
  if (dataHistory.value.length > 10) {
    dataHistory.value = dataHistory.value.slice(0, 10)
  }

  addLog(`温度数据更新: ${temperature}°C (${type})`, 'success')
}

// 开始模拟
const startSimulation = () => {
  if (isSimulating.value) return

  isSimulating.value = true
  deviceStatus.value = { type: 'success', text: '在线' }
  dataQuality.value = { type: 'success', text: '良好' }

  addLog('开始温度数据模拟', 'info')

  // 立即发送一次数据
  const initialTemp = generateTemperature()
  sendDataToComponent(initialTemp, 'initial')

  // 每5秒发送一次数据
  simulationTimer = setInterval(() => {
    const temp = generateTemperature()
    sendDataToComponent(temp, 'normal')
  }, 5000)
}

// 停止模拟
const stopSimulation = () => {
  if (!isSimulating.value) return

  isSimulating.value = false
  deviceStatus.value = { type: 'error', text: '离线' }
  dataQuality.value = { type: 'error', text: '无数据' }

  if (simulationTimer) {
    clearInterval(simulationTimer)
    simulationTimer = null
  }

  addLog('停止温度数据模拟', 'warning')
}

// 发送告警
const sendAlert = () => {
  if (!isSimulating.value) return

  const alertTemp = 35.0 // 高温告警
  sendDataToComponent(alertTemp, 'alert')

  dataQuality.value = { type: 'error', text: '告警' }
  addLog(`温度告警: ${alertTemp}°C`, 'error')
}

onMounted(() => {
  addLog('温度监控系统已启动', 'success')
})

onUnmounted(() => {
  if (simulationTimer) {
    clearInterval(simulationTimer)
  }
})
</script>

<style scoped>
.real-world-example {
  padding: 16px;
  max-width: 1000px;
  margin: 0 auto;
}

.dashboard {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.component-container {
  width: 300px;
  height: 200px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.data-panel {
  flex: 1;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
}

.history-card,
.log-card {
  max-height: 300px;
}

.history-header,
.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.history-content,
.log-content {
  max-height: 200px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  margin-bottom: 2px;
  border-radius: 4px;
  background: #f8f9fa;
  font-size: 12px;
}

.history-time {
  color: #666;
  width: 80px;
}

.history-value {
  font-weight: bold;
  color: #ff4d4f;
  width: 60px;
  text-align: center;
}

.history-type {
  color: #666;
  width: 60px;
  text-align: right;
}

.log-item {
  padding: 4px 8px;
  margin-bottom: 2px;
  border-radius: 4px;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.log-item.info {
  background: #e6f7ff;
  color: #1890ff;
}

.log-item.success {
  background: #f6ffed;
  color: #52c41a;
}

.log-item.error {
  background: #fff2f0;
  color: #ff4d4f;
}

.log-item.warning {
  background: #fffbe6;
  color: #faad14;
}

.log-time {
  color: #666;
  margin-right: 8px;
}

.log-message {
  font-weight: 500;
}
</style>
