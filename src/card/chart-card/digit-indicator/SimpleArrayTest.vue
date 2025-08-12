<template>
  <div class="simple-array-test">
    <n-card title="简单数组数据测试" size="small">
      <n-space vertical>
        <!-- 测试说明 -->
        <n-alert type="info" title="简单数组测试">
          <template #default>
            <p>测试 digit-indicator 组件对简单数组数据的处理</p>
          </template>
        </n-alert>

        <!-- 测试按钮 -->
        <n-space>
          <n-button type="primary" @click="sendSimpleArray">发送简单数组 [25.6]</n-button>
          <n-button type="success" @click="sendObjectArray">发送对象数组 [{value: 72.3, unit: '%'}]</n-button>
        </n-space>

        <!-- Digit Indicator 组件 -->
        <n-divider title-placement="left">Digit Indicator 组件</n-divider>

        <div class="component-container">
          <component :is="digitIndicatorComponent" ref="digitIndicatorRef" :card="cardData" />
        </div>

        <!-- 当前显示值 -->
        <n-divider title-placement="left">当前显示值</n-divider>

        <n-card size="small">
          <div>detail.value: {{ currentDetailValue }}</div>
          <div>unit.value: {{ currentUnitValue }}</div>
        </n-card>

        <!-- 日志 -->
        <n-divider title-placement="left">处理日志</n-divider>

        <n-card size="small" class="log-card">
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
import { ref, computed } from 'vue'
import { NCard, NSpace, NDivider, NButton, NAlert } from 'naive-ui'
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

// 当前显示值（通过计算属性获取）
const currentDetailValue = computed(() => {
  return digitIndicatorRef.value?.detail || '未设置'
})

const currentUnitValue = computed(() => {
  return digitIndicatorRef.value?.unit || '未设置'
})

const addLog = (message: string) => {
  logs.value.push({
    timestamp: new Date().toISOString(),
    message
  })
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
    test_metric: [25.6]
  }

  digitIndicatorRef.value.updateData('test_device_001', 'test_metric', data)
  addLog(`发送简单数组: ${JSON.stringify(data)}`)
}

const sendObjectArray = () => {
  if (!digitIndicatorRef.value) {
    addLog('组件未加载')
    return
  }

  const data = {
    test_metric: [{ value: 72.3, unit: '%' }]
  }

  digitIndicatorRef.value.updateData('test_device_001', 'test_metric', data)
  addLog(`发送对象数组: ${JSON.stringify(data)}`)
}
</script>

<style scoped>
.simple-array-test {
  padding: 16px;
  max-width: 600px;
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
  max-height: 200px;
}

.log-content {
  max-height: 150px;
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
