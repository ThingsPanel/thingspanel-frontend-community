<template>
  <div class="array-data-test">
    <n-card title="Digit Indicator 数组数据测试" size="small">
      <n-space vertical>
        <!-- 测试说明 -->
        <n-alert type="info" title="数组数据处理测试">
          <template #default>
            <p>测试 digit-indicator 组件对各种数组数据格式的处理能力</p>
            <p>包括：简单数组、对象数组、嵌套数组等</p>
          </template>
        </n-alert>

        <!-- 测试数据选择 -->
        <n-divider title-placement="left">测试数据</n-divider>

        <n-space>
          <n-button type="primary" @click="sendSimpleArray">简单数组 [25.6, 30.2]</n-button>
          <n-button type="success" @click="sendObjectArray">对象数组 [{value: 72.3, unit: '%'}]</n-button>
          <n-button type="warning" @click="sendNestedArray">嵌套数组 [{data: {value: 58.7}}]</n-button>
          <n-button type="error" @click="sendComplexArray">复杂数组 [{temp: 25.6}, {humidity: 60.2}]</n-button>
        </n-space>

        <!-- Digit Indicator 组件 -->
        <n-divider title-placement="left">Digit Indicator 组件</n-divider>

        <div class="component-container">
          <component :is="digitIndicatorComponent" ref="digitIndicatorRef" :card="cardData" />
        </div>

        <!-- 数据日志 -->
        <n-divider title-placement="left">数据处理日志</n-divider>

        <n-card size="small" class="log-card">
          <div class="log-header">
            <n-text strong>数组数据处理日志</n-text>
            <n-button size="small" @click="clearLogs">清空</n-button>
          </div>
          <div class="log-content">
            <div v-for="(log, index) in logs" :key="index" class="log-item">
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
        </n-card>

        <!-- 原始数据预览 -->
        <n-divider title-placement="left">原始数据预览</n-divider>

        <n-card size="small">
          <pre>{{ JSON.stringify(lastSentData, null, 2) }}</pre>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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
        deviceId: 'test_device_001',
        metricsId: 'test_metric',
        metricsName: '测试指标',
        metricsType: 'telemetry'
      }
    ]
  }
})

// 组件引用
const digitIndicatorRef = ref<any>(null)

// 日志
const logs = ref<Array<{ timestamp: string; message: string }>>([])
const lastSentData = ref<any>(null)

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

// 测试数据发送
const sendSimpleArray = () => {
  if (!digitIndicatorRef.value) {
    addLog('组件未加载')
    return
  }

  const data = {
    test_metric: [25.6, 30.2, 28.9]
  }

  lastSentData.value = data
  digitIndicatorRef.value.updateData('test_device_001', 'test_metric', data)
  addLog(`发送简单数组: ${JSON.stringify(data)}`)
}

const sendObjectArray = () => {
  if (!digitIndicatorRef.value) {
    addLog('组件未加载')
    return
  }

  const data = {
    test_metric: [
      { value: 72.3, unit: '%' },
      { value: 68.9, unit: '%' },
      { value: 75.1, unit: '%' }
    ]
  }

  lastSentData.value = data
  digitIndicatorRef.value.updateData('test_device_001', 'test_metric', data)
  addLog(`发送对象数组: ${JSON.stringify(data)}`)
}

const sendNestedArray = () => {
  if (!digitIndicatorRef.value) {
    addLog('组件未加载')
    return
  }

  const data = {
    test_metric: [{ data: { value: 58.7, unit: '°C' } }, { data: { value: 62.3, unit: '°C' } }]
  }

  lastSentData.value = data
  digitIndicatorRef.value.updateData('test_device_001', 'test_metric', data)
  addLog(`发送嵌套数组: ${JSON.stringify(data)}`)
}

const sendComplexArray = () => {
  if (!digitIndicatorRef.value) {
    addLog('组件未加载')
    return
  }

  const data = {
    test_metric: [
      { temp: 25.6, humidity: 60.2 },
      { temp: 26.8, humidity: 58.5 },
      { temp: 24.9, humidity: 62.1 }
    ]
  }

  lastSentData.value = data
  digitIndicatorRef.value.updateData('test_device_001', 'test_metric', data)
  addLog(`发送复杂数组: ${JSON.stringify(data)}`)
}
</script>

<style scoped>
.array-data-test {
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
