<template>
  <div class="websocket-demo">
    <n-card title="Digit Indicator WebSocket 演示" size="small">
      <n-space vertical>
        <!-- 说明 -->
        <n-alert type="info" title="WebSocket 数据流演示">
          <template #default>
            <p>
              <strong>目标</strong>
              ：设备数据源支持 WebSocket 方式请求数据，组件响应数据更新
            </p>
            <p>
              <strong>流程</strong>
              ：配置数据源 → 建立 WebSocket 连接 → 接收数据 → 映射显示 → 实时更新
            </p>
          </template>
        </n-alert>

        <!-- 模拟 WebSocket 数据发送 -->
        <n-divider title-placement="left">模拟 WebSocket 数据</n-divider>

        <n-space>
          <n-button type="primary" @click="sendMockData">发送模拟数据</n-button>
          <n-button type="success" @click="sendArrayData">发送数组数据</n-button>
          <n-button type="warning" @click="sendObjectData">发送对象数据</n-button>
        </n-space>

        <!-- Digit Indicator 组件 -->
        <n-divider title-placement="left">Digit Indicator 组件</n-divider>

        <div class="component-container">
          <component :is="digitIndicatorComponent" ref="digitIndicatorRef" :card="cardData" />
        </div>

        <!-- 数据日志 -->
        <n-divider title-placement="left">数据更新日志</n-divider>

        <n-card size="small" class="log-card">
          <div class="log-header">
            <n-text strong>WebSocket 数据更新日志</n-text>
            <n-button size="small" @click="clearLogs">清空</n-button>
          </div>
          <div class="log-content">
            <div v-for="(log, index) in logs" :key="index" class="log-item">
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
import { ref, onMounted } from 'vue'
import { NCard, NSpace, NDivider, NButton, NAlert, NText } from 'naive-ui'
import digitIndicatorComponent from './component.vue'

// 卡片数据
const cardData = ref({
  config: {
    color: '#1890ff',
    iconName: 'Water',
    unit: '%'
  },
  dataSource: {
    deviceSource: [
      {
        deviceId: 'demo_device_001',
        metricsId: 'humidity',
        metricsName: '湿度',
        metricsType: 'telemetry'
      }
    ]
  }
})

// 组件引用
const digitIndicatorRef = ref<any>(null)

// 日志
const logs = ref<Array<{ timestamp: string; message: string }>>([])

const addLog = (message: string) => {
  logs.value.push({
    timestamp: new Date().toISOString(),
    message
  })
}

const clearLogs = () => {
  logs.value = []
}

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString()
}

// 模拟 WebSocket 数据发送
const sendMockData = () => {
  if (!digitIndicatorRef.value) {
    addLog('组件未加载')
    return
  }

  const mockData = {
    humidity: 65.5
  }

  digitIndicatorRef.value.updateData('demo_device_001', 'humidity', mockData)
  addLog(`发送数据: ${JSON.stringify(mockData)}`)
}

const sendArrayData = () => {
  if (!digitIndicatorRef.value) {
    addLog('组件未加载')
    return
  }

  const arrayData = {
    humidity: [
      { value: 72.3, unit: '%' },
      { value: 68.9, unit: '%' }
    ]
  }

  digitIndicatorRef.value.updateData('demo_device_001', 'humidity', arrayData)
  addLog(`发送数组数据: ${JSON.stringify(arrayData)}`)
}

const sendObjectData = () => {
  if (!digitIndicatorRef.value) {
    addLog('组件未加载')
    return
  }

  const objectData = {
    humidity: {
      value: 58.7,
      unit: '%',
      timestamp: new Date().toISOString()
    }
  }

  digitIndicatorRef.value.updateData('demo_device_001', 'humidity', objectData)
  addLog(`发送对象数据: ${JSON.stringify(objectData)}`)
}

onMounted(() => {
  addLog('组件已加载，可以开始发送模拟数据')
})
</script>

<style scoped>
.websocket-demo {
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.component-container {
  width: 300px;
  height: 200px;
  margin: 0 auto;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  overflow: hidden;
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
  background: #f8f9fa;
  font-size: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.log-time {
  color: #666;
  margin-right: 8px;
}

.log-message {
  font-weight: 500;
}
</style>
