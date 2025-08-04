<template>
  <div class="multi-data-test-card" :style="{ fontSize: displayFontSize + 'px', color: displayColor }">
    <div class="card-header">
      <h3>{{ displayTitle }}</h3>
    </div>
    
    <div class="card-content">
      <div class="data-section">
        <h4>传感器数据:</h4>
        <div class="data-item">
          <span>温度: {{ displayTemperature }}°C</span>
        </div>
        <div class="data-item">
          <span>湿度: {{ displayHumidity }}%</span>
        </div>
      </div>
      
      <div class="data-section">
        <h4>设备状态:</h4>
        <div class="data-item">
          <span>{{ displayStatus }}</span>
        </div>
      </div>
      
      <div class="debug-info">
        <details>
          <summary>调试信息</summary>
          <div class="debug-content">
            <div><strong>数据源1:</strong> {{ dataSource1Info }}</div>
            <div><strong>数据源2:</strong> {{ dataSource2Info }}</div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DataSourceValue } from '../../../components/visual-editor/types/data-source'

interface Props {
  title?: string
  color?: string
  fontSize?: number
  dataSourceValue?: DataSourceValue
}

const props = withDefaults(defineProps<Props>(), {
  title: '多数据测试',
  color: '#1890ff',
  fontSize: 16
})

// 显示属性
const displayTitle = computed(() => props.title)
const displayColor = computed(() => props.color)
const displayFontSize = computed(() => props.fontSize)

// 从数据源提取数据
const displayTemperature = computed(() => {
  // 根据新的映射逻辑，temperature直接映射到values.temperature
  return props.dataSourceValue?.values?.temperature || 0
})

const displayHumidity = computed(() => {
  // 根据新的映射逻辑，humidity直接映射到values.humidity
  return props.dataSourceValue?.values?.humidity || 0
})

const displayStatus = computed(() => {
  // 根据新的映射逻辑，deviceStatus直接映射到values.deviceStatus
  return props.dataSourceValue?.values?.deviceStatus || '未知'
})

// 调试信息
const dataSource1Info = computed(() => {
  const temperature = props.dataSourceValue?.values?.temperature
  const humidity = props.dataSourceValue?.values?.humidity
  return (temperature !== undefined || humidity !== undefined) ? JSON.stringify({ temperature, humidity }) : '无数据'
})

const dataSource2Info = computed(() => {
  const deviceStatus = props.dataSourceValue?.values?.deviceStatus
  return deviceStatus ? JSON.stringify(deviceStatus) : '无数据'
})
</script>

<style scoped>
.multi-data-test-card {
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
}

.card-header h3 {
  margin: 0 0 12px 0;
  font-size: 1.2em;
}

.data-section {
  margin-bottom: 16px;
}

.data-section h4 {
  margin: 0 0 8px 0;
  font-size: 0.9em;
  color: #666;
}

.data-item {
  margin-bottom: 4px;
  padding: 4px 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.debug-info {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.debug-info summary {
  cursor: pointer;
  color: #666;
  font-size: 0.8em;
}

.debug-content {
  margin-top: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 0.8em;
  font-family: monospace;
}

.debug-content div {
  margin-bottom: 4px;
}
</style> 