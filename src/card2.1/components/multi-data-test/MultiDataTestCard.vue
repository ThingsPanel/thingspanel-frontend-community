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
            <div>
              <strong>数据源值:</strong>
              {{ JSON.stringify($props.dataSourceValue?.values || {}, null, 2) }}
            </div>
            <div>
              <strong>数据路径:</strong>
              {{ JSON.stringify($props.dataSourceValue?.metadata?.dataPaths || [], null, 2) }}
            </div>
            <div>
              <strong>原始数据:</strong>
              {{ JSON.stringify($props.dataSourceValue?.rawData || {}, null, 2) }}
            </div>
            <div>
              <strong>数据源配置:</strong>
              {{ JSON.stringify($props.metadata?.dataSource?.dataPaths || [], null, 2) }}
            </div>
          </div>
        </details>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DataSource, DataSourceValue } from '@/components/visual-editor/types/data-source'

interface Props {
  properties?: {
    title?: string
    color?: string
    fontSize?: number
  }
  metadata?: {
    dataSource?: DataSource
  }
  dataSourceValue?: DataSourceValue | null
}

const props = withDefaults(defineProps<Props>(), {
  properties: () => ({}),
  dataSourceValue: null
})

// 显示属性
const displayTitle = computed(() => props.properties?.title || '多数据测试')
const displayColor = computed(() => props.properties?.color || '#1890ff')
const displayFontSize = computed(() => props.properties?.fontSize || 16)

// 从数据源提取数据
const displayTemperature = computed(() => {
  // 使用来自 Card2Wrapper 的数据源值
  if (props.dataSourceValue?.values) {
    console.log('🔧 MultiDataTestCard - 温度数据:', {
      temperature: props.dataSourceValue.values.temperature,
      allValues: props.dataSourceValue.values
    })
    return props.dataSourceValue.values.temperature || 0
  }
  return 0
})

const displayHumidity = computed(() => {
  // 使用来自 Card2Wrapper 的数据源值
  if (props.dataSourceValue?.values) {
    console.log('🔧 MultiDataTestCard - 湿度数据:', {
      humidity: props.dataSourceValue.values.humidity,
      allValues: props.dataSourceValue.values
    })
    return props.dataSourceValue.values.humidity || 0
  }
  return 0
})

const displayStatus = computed(() => {
  // 使用来自 Card2Wrapper 的数据源值
  if (props.dataSourceValue?.values) {
    console.log('🔧 MultiDataTestCard - 状态数据:', {
      status: props.dataSourceValue.values.status,
      deviceStatus: props.dataSourceValue.values.deviceStatus,
      allValues: props.dataSourceValue.values
    })
    return props.dataSourceValue.values.status || props.dataSourceValue.values.deviceStatus || '未知'
  }
  return '未知'
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

.card-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.data-section h4 {
  margin: 0 0 8px 0;
  font-size: 1em;
  color: #666;
}

.data-item {
  padding: 4px 0;
  font-size: 0.9em;
}

.debug-info {
  margin-top: 16px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 0.8em;
}

.debug-info summary {
  cursor: pointer;
  font-weight: bold;
}

.debug-content {
  margin-top: 8px;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
  font-family: monospace;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
