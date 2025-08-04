<template>
  <div class="multi-data-source-test">
    <h2>多数据源测试</h2>
    
    <div class="test-section">
      <h3>测试场景</h3>
      <p>这个测试演示了多数据源功能：</p>
      <ul>
        <li><strong>数据源1</strong>：提供传感器数据（温度和湿度）</li>
        <li><strong>数据源2</strong>：提供设备状态</li>
        <li><strong>组件</strong>：从不同数据源获取数据并显示</li>
      </ul>
    </div>
    
    <div class="test-section">
      <h3>数据源配置</h3>
      
      <!-- 数据源1配置 -->
      <n-card title="数据源1 - 传感器数据" class="data-source-card">
        <n-form :model="dataSource1" label-placement="left" label-width="120px">
          <n-form-item label="JSON数据">
            <n-input
              v-model:value="dataSource1Json"
              type="textarea"
              :rows="4"
              placeholder="输入传感器数据JSON"
            />
          </n-form-item>
          
          <n-form-item label="数据路径映射">
            <div class="mapping-item">
              <span class="mapping-label">路径:</span>
              <n-input v-model:value="dataSource1Mappings[0].key" placeholder="如: sensors.temperature" />
              <span class="mapping-arrow">→</span>
              <n-input v-model:value="dataSource1Mappings[0].target" placeholder="sensorData" />
            </div>
            <div class="mapping-item">
              <span class="mapping-label">路径:</span>
              <n-input v-model:value="dataSource1Mappings[1].key" placeholder="如: sensors.humidity" />
              <span class="mapping-arrow">→</span>
              <n-input v-model:value="dataSource1Mappings[1].target" placeholder="sensorData" />
            </div>
          </n-form-item>
        </n-form>
      </n-card>
      
      <!-- 数据源2配置 -->
      <n-card title="数据源2 - 设备状态" class="data-source-card">
        <n-form :model="dataSource2" label-placement="left" label-width="120px">
          <n-form-item label="JSON数据">
            <n-input
              v-model:value="dataSource2Json"
              type="textarea"
              :rows="3"
              placeholder="输入设备状态JSON"
            />
          </n-form-item>
          
          <n-form-item label="数据路径映射">
            <div class="mapping-item">
              <span class="mapping-label">路径:</span>
              <n-input v-model:value="dataSource2Mappings[0].key" placeholder="如: device.status" />
              <span class="mapping-arrow">→</span>
              <n-input v-model:value="dataSource2Mappings[0].target" placeholder="deviceStatus" />
            </div>
          </n-form-item>
        </n-form>
      </n-card>
      
      <n-button type="primary" @click="updateDataSources">
        更新数据源
      </n-button>
    </div>
    
    <div class="test-section">
      <h3>组件显示</h3>
      <div class="component-container">
        <MultiDataTestCard
          :properties="componentProperties"
          :metadata="{ dataSource: combinedDataSource }"
        />
      </div>
    </div>
    
    <div class="test-section">
      <h3>调试信息</h3>
      <n-card>
        <pre>{{ debugInfo }}</pre>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { NCard, NForm, NFormItem, NInput, NButton } from 'naive-ui'
import MultiDataTestCard from '@/card2.1/components/multi-data-test/MultiDataTestCard.vue'
import type { DataSource } from '../types/data-source'

// 组件属性
const componentProperties = ref({
  title: '多数据源测试组件',
  color: '#1890ff',
  fontSize: 16
})

// 数据源1 - 传感器数据
const dataSource1Json = ref(`{
  "sensors": {
    "temperature": 25.5,
    "humidity": 65.2
  },
  "timestamp": "2024-01-01T12:00:00Z"
}`)

const dataSource1Mappings = ref([
  { key: 'sensors', target: 'sensorData', description: '传感器数据' }
])

const dataSource1 = computed(() => {
  try {
    return {
      type: 'static' as const,
      enabled: true,
      name: '传感器数据源',
      description: '提供温度和湿度数据',
      data: JSON.parse(dataSource1Json.value),
      dataPaths: dataSource1Mappings.value,
      refreshInterval: 0
    }
  } catch {
    return {
      type: 'static' as const,
      enabled: true,
      name: '传感器数据源',
      description: '提供温度和湿度数据',
      data: {},
      dataPaths: dataSource1Mappings.value,
      refreshInterval: 0
    }
  }
})

// 数据源2 - 设备状态
const dataSource2Json = ref(`{
  "device": {
    "status": "运行中",
    "mode": "自动"
  }
}`)

const dataSource2Mappings = ref([
  { key: 'device.status', target: 'deviceStatus', description: '设备状态' }
])

const dataSource2 = computed(() => {
  try {
    return {
      type: 'static' as const,
      enabled: true,
      name: '设备状态数据源',
      description: '提供设备运行状态',
      data: JSON.parse(dataSource2Json.value),
      dataPaths: dataSource2Mappings.value,
      refreshInterval: 0
    }
  } catch {
    return {
      type: 'static' as const,
      enabled: true,
      name: '设备状态数据源',
      description: '提供设备运行状态',
      data: {},
      dataPaths: dataSource2Mappings.value,
      refreshInterval: 0
    }
  }
})

// 合并的数据源（实际应用中可能需要更复杂的合并逻辑）
const combinedDataSource = computed(() => {
  // 这里简化处理，实际应该支持多个独立的数据源
  return {
    type: 'static' as const,
    enabled: true,
    name: '合并数据源',
    description: '合并的传感器和设备数据',
    data: {
      ...dataSource1.value.data,
      ...dataSource2.value.data
    },
    dataPaths: [
      ...dataSource1.value.dataPaths,
      ...dataSource2.value.dataPaths
    ],
    refreshInterval: 0
  }
})

// 调试信息
const debugInfo = computed(() => {
  return {
    数据源1: {
      原始数据: dataSource1.value.data,
      映射: dataSource1.value.dataPaths
    },
    数据源2: {
      原始数据: dataSource2.value.data,
      映射: dataSource2.value.dataPaths
    },
    合并数据源: {
      原始数据: combinedDataSource.value.data,
      映射: combinedDataSource.value.dataPaths
    }
  }
})

// 更新数据源
const updateDataSources = () => {
  console.log('🔧 MultiDataSourceTest - 更新数据源:', {
    dataSource1: dataSource1.value,
    dataSource2: dataSource2.value,
    combined: combinedDataSource.value
  })
}

onMounted(() => {
  console.log('🔧 MultiDataSourceTest - 组件挂载完成')
})
</script>

<style scoped>
.multi-data-source-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
}

.data-source-card {
  margin-bottom: 16px;
}

.mapping-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.mapping-label {
  min-width: 60px;
  font-weight: 500;
  color: #666;
}

.mapping-arrow {
  color: #999;
  font-weight: bold;
}

.component-container {
  width: 400px;
  height: 300px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

pre {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 12px;
  max-height: 300px;
  overflow: auto;
  white-space: pre-wrap;
}
</style> 