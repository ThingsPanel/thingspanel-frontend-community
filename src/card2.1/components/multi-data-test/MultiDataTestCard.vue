<template>
  <div ref="cardRef" class="multi-data-test-container">
    <div class="card-content" :style="{ fontSize: displayFontSize + 'px' }">
      <div class="title-container">
        <span class="title" :style="{ color: displayColor }">
          {{ displayTitle }}
        </span>
      </div>
      
      <div class="data-container">
        <div class="data-item">
          <span class="label">温度:</span>
          <span class="value" :style="{ color: displayColor }">
            {{ displayTemperature }}°C
          </span>
        </div>
        
        <div class="data-item">
          <span class="label">湿度:</span>
          <span class="value" :style="{ color: displayColor }">
            {{ displayHumidity }}%
          </span>
        </div>
        
        <div class="data-item">
          <span class="label">状态:</span>
          <span class="value" :style="{ color: displayColor }">
            {{ displayStatus }}
          </span>
        </div>
      </div>
      
      <div class="data-source-info">
        <div class="info-item">
          <span class="info-label">数据源1:</span>
          <span class="info-value">{{ dataSource1Info }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">数据源2:</span>
          <span class="info-value">{{ dataSource2Info }}</span>
        </div>
      </div>
      
      <div class="timestamp-container">
        <span class="timestamp">
          更新时间: {{ displayTimestamp }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed, watch } from 'vue'
import { dataSourceManager } from '@/components/visual-editor/core/data-source-manager'
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
}

const props = withDefaults(defineProps<Props>(), {
  properties: () => ({})
})

const cardRef = ref<HTMLElement | null>(null)

// 数据源相关状态
const dataSourceValue = ref<DataSourceValue | null>(null)
let unsubscribeDataSource: (() => void) | null = null

// 计算显示值
const displayTitle = computed(() => {
  return props.properties?.title || '多数据测试'
})

const displayTemperature = computed(() => {
  // 从 sensorData 中获取温度
  if (dataSourceValue.value?.values?.sensorData) {
    const sensorData = dataSourceValue.value.values.sensorData
    if (typeof sensorData === 'object' && sensorData !== null) {
      return sensorData.temperature || 0
    }
  }
  return 25
})

const displayHumidity = computed(() => {
  // 从 sensorData 中获取湿度
  if (dataSourceValue.value?.values?.sensorData) {
    const sensorData = dataSourceValue.value.values.sensorData
    if (typeof sensorData === 'object' && sensorData !== null) {
      return sensorData.humidity || 0
    }
  }
  return 60
})

const displayStatus = computed(() => {
  // 从 deviceStatus 中获取状态
  if (dataSourceValue.value?.values?.deviceStatus) {
    return dataSourceValue.value.values.deviceStatus
  }
  return '正常'
})

const displayTimestamp = computed(() => {
  if (dataSourceValue.value?.timestamp) {
    return new Date(dataSourceValue.value.timestamp).toLocaleTimeString()
  }
  return new Date().toLocaleTimeString()
})

const displayColor = computed(() => {
  return props.properties?.color ?? '#1890ff'
})

const displayFontSize = computed(() => {
  return props.properties?.fontSize ?? 16
})

// 数据源信息显示
const dataSource1Info = computed(() => {
  if (dataSourceValue.value?.metadata?.dataPaths) {
    const sensorDataPath = dataSourceValue.value.metadata.dataPaths.find(p => p.target === 'sensorData')
    return sensorDataPath ? `路径: ${sensorDataPath.key}` : '未配置'
  }
  return '未配置'
})

const dataSource2Info = computed(() => {
  if (dataSourceValue.value?.metadata?.dataPaths) {
    const statusDataPath = dataSourceValue.value.metadata.dataPaths.find(p => p.target === 'deviceStatus')
    return statusDataPath ? `路径: ${statusDataPath.key}` : '未配置'
  }
  return '未配置'
})

// 处理数据源
const handleDataSource = (dataSource: DataSource | undefined) => {
  // 取消之前的订阅
  if (unsubscribeDataSource) {
    unsubscribeDataSource()
    unsubscribeDataSource = null
  }
  
  // 重置数据源值
  dataSourceValue.value = null
  
  // 如果有新的数据源，订阅它
  if (dataSource && dataSource.enabled) {
    console.log('🔧 MultiDataTestCard - 订阅数据源:', {
      type: dataSource.type,
      dataPaths: dataSource.dataPaths,
      name: dataSource.name
    })
    
    unsubscribeDataSource = dataSourceManager.subscribe(dataSource, (value) => {
      console.log('🔧 MultiDataTestCard - 收到数据源更新:', {
        values: value.values,
        dataPaths: value.metadata?.dataPaths,
        originalData: value.metadata?.originalData
      })
      dataSourceValue.value = value
    })
  }
}

// 监听数据源变化
watch(() => props.metadata?.dataSource, (newDataSource) => {
  handleDataSource(newDataSource)
}, { immediate: true, deep: true })

// 组件卸载时清理
onBeforeUnmount(() => {
  if (unsubscribeDataSource) {
    unsubscribeDataSource()
    unsubscribeDataSource = null
  }
})
</script>

<style scoped>
.multi-data-test-container {
  width: 100%;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;
}

.card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.title-container {
  text-align: center;
  margin-bottom: 16px;
}

.title {
  font-size: 1.2em;
  font-weight: bold;
}

.data-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  width: 100%;
  margin-bottom: 16px;
}

.data-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.label {
  font-weight: 500;
  color: #666;
}

.value {
  font-weight: bold;
}

.data-source-info {
  width: 100%;
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  margin-bottom: 4px;
  font-size: 0.8em;
}

.info-label {
  color: #666;
  font-weight: 500;
}

.info-value {
  color: #333;
  font-family: monospace;
}

.timestamp-container {
  text-align: center;
  margin-top: 16px;
}

.timestamp {
  font-size: 0.8em;
  color: #999;
}
</style> 