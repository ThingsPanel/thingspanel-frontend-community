<template>
  <div class="websocket-example">
    <n-card title="WebSocket 数据流示例" size="small">
      <n-space vertical>
        <!-- 说明 -->
        <n-alert type="info" title="WebSocket 数据流架构">
          <template #default>
            <p>
              <strong>1. 数据源配置</strong>
              ：配置 WebSocket 连接和订阅主题
            </p>
            <p>
              <strong>2. 建立连接</strong>
              ：建立 WebSocket 连接并订阅数据
            </p>
            <p>
              <strong>3. 数据接收</strong>
              ：接收实时数据并处理数组格式
            </p>
            <p>
              <strong>4. 数据映射</strong>
              ：将接收的数据映射到组件需要的格式
            </p>
            <p>
              <strong>5. 实时更新</strong>
              ：组件自动更新显示最新数据
            </p>
          </template>
        </n-alert>

        <!-- WebSocket 连接配置 -->
        <n-divider title-placement="left">WebSocket 连接配置</n-divider>

        <n-space>
          <n-form-item label="WebSocket URL">
            <n-input v-model:value="websocketConfig.url" placeholder="ws://localhost:8080/ws" style="width: 300px" />
          </n-form-item>
          <n-form-item label="订阅主题">
            <n-input
              v-model:value="websocketConfig.topic"
              placeholder="/device/{deviceId}/telemetry"
              style="width: 300px"
            />
          </n-form-item>
        </n-space>

        <!-- 连接控制 -->
        <n-space>
          <n-button type="primary" :loading="isConnecting" :disabled="isConnected" @click="connectWebSocket">
            建立连接
          </n-button>
          <n-button type="error" :disabled="!isConnected" @click="disconnectWebSocket">断开连接</n-button>
          <n-tag :type="connectionStatus.type" size="large">
            {{ connectionStatus.text }}
          </n-tag>
        </n-space>

        <!-- 模拟数据发送 -->
        <n-divider title-placement="left">模拟数据发送</n-divider>

        <n-space>
          <n-button type="success" :disabled="!isConnected" @click="sendMockData">发送模拟数据</n-button>
          <n-button type="warning" :disabled="!isConnected" @click="sendMockArrayData">发送数组数据</n-button>
        </n-space>

        <!-- 数据流展示 -->
        <n-divider title-placement="left">数据流展示</n-divider>

        <n-space>
          <!-- 原始数据 -->
          <n-card title="原始 WebSocket 数据" size="small" class="data-card">
            <div class="data-content">
              <div v-if="rawData" class="data-item">
                <n-text strong>时间:</n-text>
                {{ formatTime(rawData.timestamp) }}
              </div>
              <div v-if="rawData" class="data-item">
                <n-text strong>数据:</n-text>
                <pre class="data-json">{{ JSON.stringify(rawData.data, null, 2) }}</pre>
              </div>
              <n-empty v-else description="等待数据..." size="small" />
            </div>
          </n-card>

          <!-- 映射后数据 -->
          <n-card title="映射后数据" size="small" class="data-card">
            <div class="data-content">
              <div v-if="mappedData" class="data-item">
                <n-text strong>值:</n-text>
                {{ mappedData.value }}
              </div>
              <div v-if="mappedData" class="data-item">
                <n-text strong>单位:</n-text>
                {{ mappedData.unit }}
              </div>
              <div v-if="mappedData" class="data-item">
                <n-text strong>标题:</n-text>
                {{ mappedData.title }}
              </div>
              <n-empty v-else description="等待映射..." size="small" />
            </div>
          </n-card>

          <!-- 组件显示 -->
          <n-card title="组件显示效果" size="small" class="data-card">
            <div class="component-preview">
              <div class="mock-digit-indicator">
                <div class="icon">💧</div>
                <div class="value">{{ displayValue }} {{ displayUnit }}</div>
                <div class="title">{{ displayTitle }}</div>
              </div>
            </div>
          </n-card>
        </n-space>

        <!-- 数据映射配置 -->
        <n-divider title-placement="left">数据映射配置</n-divider>

        <n-card size="small">
          <DataMappingConfig :data="rawData?.data" :mappings="dataMappings" @update:mappings="updateMappings" />
        </n-card>

        <!-- 日志 -->
        <n-divider title-placement="left">连接日志</n-divider>

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
import { ref, computed, onUnmounted } from 'vue'
import { NCard, NSpace, NDivider, NFormItem, NInput, NButton, NTag, NAlert, NText, NEmpty } from 'naive-ui'
import DataMappingConfig from './DataMappingConfig.vue'
import type { DataPathMapping } from '../../types/data-source'

// WebSocket 配置
const websocketConfig = ref({
  url: 'ws://localhost:8080/ws',
  topic: '/device/device_001/telemetry'
})

// 连接状态
const isConnecting = ref(false)
const isConnected = ref(false)
const connectionStatus = computed(() => {
  if (isConnecting.value) return { type: 'warning', text: '连接中...' }
  if (isConnected.value) return { type: 'success', text: '已连接' }
  return { type: 'error', text: '未连接' }
})

// 数据状态
const rawData = ref<any>(null)
const mappedData = ref<any>(null)
const dataMappings = ref<DataPathMapping[]>([
  { key: '', target: 'value', description: '数值' },
  { key: '', target: 'unit', description: '单位' },
  { key: '', target: 'title', description: '标题' }
])

// 显示数据
const displayValue = computed(() => mappedData.value?.value || '--')
const displayUnit = computed(() => mappedData.value?.unit || '')
const displayTitle = computed(() => mappedData.value?.title || '数值')

// 日志
const logs = ref<Array<{ timestamp: string; message: string; type: string }>>([])

// WebSocket 连接
let ws: WebSocket | null = null

const addLog = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
  logs.value.push({
    timestamp: new Date().toISOString(),
    message,
    type
  })
}

const clearLogs = () => {
  logs.value = []
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}

const connectWebSocket = () => {
  if (!websocketConfig.value.url) {
    addLog('WebSocket URL 未配置', 'error')
    return
  }

  isConnecting.value = true
  addLog('开始建立 WebSocket 连接...', 'info')

  ws = new WebSocket(websocketConfig.value.url)

  ws.onopen = () => {
    isConnecting.value = false
    isConnected.value = true
    addLog('WebSocket 连接成功', 'success')

    // 订阅主题
    if (websocketConfig.value.topic) {
      const subscribeMessage = {
        type: 'subscribe',
        topic: websocketConfig.value.topic
      }
      ws.send(JSON.stringify(subscribeMessage))
      addLog(`订阅主题: ${websocketConfig.value.topic}`, 'info')
    }
  }

  ws.onerror = error => {
    isConnecting.value = false
    isConnected.value = false
    addLog(`WebSocket 连接失败: ${error}`, 'error')
  }

  ws.onmessage = event => {
    try {
      const message = JSON.parse(event.data)
      addLog(`收到数据: ${JSON.stringify(message)}`, 'info')

      if (message.type === 'data') {
        rawData.value = message
        processData(message.data)
      }
    } catch (e) {
      addLog(`数据解析失败: ${e}`, 'error')
    }
  }

  ws.onclose = () => {
    isConnecting.value = false
    isConnected.value = false
    addLog('WebSocket 连接已关闭', 'info')
  }
}

const disconnectWebSocket = () => {
  if (ws) {
    ws.close()
    ws = null
    addLog('主动断开 WebSocket 连接', 'info')
  }
}

const sendMockData = () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    addLog('WebSocket 未连接，无法发送数据', 'error')
    return
  }

  const mockData = {
    type: 'data',
    timestamp: new Date().toISOString(),
    data: {
      temperature: 25.6,
      humidity: 60.2,
      unit: '°C',
      title: '温度传感器'
    }
  }

  ws.send(JSON.stringify(mockData))
  addLog('发送模拟数据', 'info')
}

const sendMockArrayData = () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    addLog('WebSocket 未连接，无法发送数据', 'error')
    return
  }

  const mockArrayData = {
    type: 'data',
    timestamp: new Date().toISOString(),
    data: [
      {
        temperature: 25.6,
        humidity: 60.2,
        unit: '°C',
        title: '温度传感器'
      },
      {
        temperature: 26.8,
        humidity: 58.5,
        unit: '°C',
        title: '湿度传感器'
      }
    ]
  }

  ws.send(JSON.stringify(mockArrayData))
  addLog('发送模拟数组数据', 'info')
}

const processData = (data: any) => {
  // 处理数组数据
  let processedData = data
  if (Array.isArray(data)) {
    processedData = data[0] // 取第一个元素
    addLog('检测到数组数据，使用第一个元素', 'info')
  }

  // 应用数据映射
  const mapped: any = {}
  dataMappings.value.forEach(mapping => {
    if (mapping.key) {
      mapped[mapping.target] = processedData[mapping.key]
    }
  })

  mappedData.value = mapped
  addLog(`数据映射完成: ${JSON.stringify(mapped)}`, 'success')
}

const updateMappings = (mappings: DataPathMapping[]) => {
  dataMappings.value = mappings
  if (rawData.value) {
    processData(rawData.value.data)
  }
}

onUnmounted(() => {
  disconnectWebSocket()
})
</script>

<style scoped>
.websocket-example {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.data-card {
  flex: 1;
  min-width: 300px;
}

.data-content {
  min-height: 150px;
}

.data-item {
  margin-bottom: 8px;
}

.data-json {
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-size: 11px;
  max-height: 100px;
  overflow-y: auto;
  margin: 4px 0;
}

.component-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 150px;
}

.mock-digit-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
  min-width: 120px;
}

.mock-digit-indicator .icon {
  font-size: 2em;
  margin-bottom: 8px;
}

.mock-digit-indicator .value {
  font-size: 1.5em;
  font-weight: bold;
  margin-bottom: 4px;
}

.mock-digit-indicator .title {
  font-size: 0.9em;
  opacity: 0.9;
}

.log-card {
  max-height: 300px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.log-content {
  max-height: 200px;
  overflow-y: auto;
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

.log-time {
  color: #666;
  margin-right: 8px;
}

.log-message {
  font-weight: 500;
}
</style>
