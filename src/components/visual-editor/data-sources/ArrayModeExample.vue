<template>
  <div class="array-mode-example">
    <n-card title="数组模式示例" size="small">
      <n-space vertical>
        <!-- 说明 -->
        <n-alert type="info" title="数组模式功能说明">
          <template #default>
            <p>
              <strong>问题背景</strong>
              ：当数据源返回数组时，用户需要手动指定
              <code>[0]</code>
              来获取第一个元素
            </p>
            <p>
              <strong>解决方案</strong>
              ：启用数组模式后，系统会自动使用数组的第一个元素进行数据映射
            </p>
            <p>
              <strong>使用场景</strong>
              ：适用于API返回数组格式数据的场景，如设备列表、历史数据等
            </p>
          </template>
        </n-alert>

        <!-- 数据源配置 -->
        <n-divider title-placement="left">数据源配置</n-divider>

        <!-- 模拟数据选择 -->
        <n-form-item label="选择模拟数据">
          <n-select
            v-model:value="selectedDataType"
            :options="dataTypeOptions"
            placeholder="选择数据类型"
            @update:value="updateSampleData"
          />
        </n-form-item>

        <!-- 数据预览 -->
        <n-form-item label="原始数据">
          <n-card size="small" class="data-preview">
            <pre>{{ JSON.stringify(sampleData, null, 2) }}</pre>
          </n-card>
        </n-form-item>

        <!-- 数据映射配置 -->
        <n-divider title-placement="left">数据映射配置</n-divider>

        <DataMappingConfig
          :data="sampleData"
          :mappings="dataMappings"
          :array-mode="arrayMode"
          @update:mappings="updateMappings"
          @update:array-mode="updateArrayMode"
        />

        <!-- 映射结果预览 -->
        <n-divider title-placement="left">映射结果预览</n-divider>

        <n-card size="small">
          <div v-if="mappedData">
            <div class="result-item">
              <strong>映射配置:</strong>
              <pre>{{ JSON.stringify(dataMappings, null, 2) }}</pre>
            </div>
            <div class="result-item">
              <strong>数组模式:</strong>
              {{ arrayMode ? '启用' : '禁用' }}
            </div>
            <div class="result-item">
              <strong>映射结果:</strong>
              <pre>{{ JSON.stringify(mappedData, null, 2) }}</pre>
            </div>
          </div>
          <n-empty v-else description="请配置数据映射" size="small" />
        </n-card>

        <!-- 操作按钮 -->
        <n-space>
          <n-button type="primary" :disabled="dataMappings.length === 0" @click="testMapping">测试映射</n-button>
          <n-button @click="resetConfig">重置配置</n-button>
        </n-space>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NCard, NSpace, NDivider, NFormItem, NSelect, NButton, NAlert, NEmpty } from 'naive-ui'
import DataMappingConfig from './DataMappingConfig.vue'
import { dataPathResolver } from '../../utils/data-path-resolver'
import type { DataPathMapping } from '../../types/data-source'

// 响应式数据
const selectedDataType = ref('device_list')
const arrayMode = ref(false)
const dataMappings = ref<DataPathMapping[]>([
  { key: '', target: 'deviceName', description: '设备名称' },
  { key: '', target: 'deviceId', description: '设备ID' },
  { key: '', target: 'status', description: '设备状态' }
])

// 模拟数据
const sampleDataSets = {
  device_list: [
    {
      deviceName: '温度传感器01',
      deviceId: 'temp_sensor_001',
      status: 'online',
      lastSeen: '2024-01-15T10:30:00Z'
    },
    {
      deviceName: '湿度传感器01',
      deviceId: 'humidity_sensor_001',
      status: 'offline',
      lastSeen: '2024-01-15T09:15:00Z'
    }
  ],
  telemetry_data: [
    {
      timestamp: '2024-01-15T10:30:00Z',
      temperature: 25.6,
      humidity: 60.2,
      pressure: 1013.25
    },
    {
      timestamp: '2024-01-15T10:29:00Z',
      temperature: 25.4,
      humidity: 59.8,
      pressure: 1013.2
    }
  ],
  alarm_list: [
    {
      id: 'alarm_001',
      severity: 'high',
      message: '温度过高',
      timestamp: '2024-01-15T10:25:00Z'
    },
    {
      id: 'alarm_002',
      severity: 'medium',
      message: '湿度偏低',
      timestamp: '2024-01-15T10:20:00Z'
    }
  ],
  single_object: {
    deviceName: '单设备',
    deviceId: 'single_device_001',
    status: 'online',
    metrics: {
      temperature: 25.6,
      humidity: 60.2
    }
  }
}

const sampleData = ref(sampleDataSets.device_list)

// 数据类型选项
const dataTypeOptions = [
  { label: '设备列表 (数组)', value: 'device_list' },
  { label: '遥测数据 (数组)', value: 'telemetry_data' },
  { label: '告警列表 (数组)', value: 'alarm_list' },
  { label: '单设备数据 (对象)', value: 'single_object' }
]

// 计算属性
const mappedData = computed(() => {
  if (dataMappings.value.length === 0) return null

  const result: Record<string, any> = {}

  dataMappings.value.forEach(mapping => {
    if (mapping.key) {
      const value = dataPathResolver.resolve(sampleData.value, mapping.key, { arrayMode: arrayMode.value })
      result[mapping.target] = value
    }
  })

  return result
})

// 方法
const updateSampleData = (dataType: string) => {
  sampleData.value = sampleDataSets[dataType as keyof typeof sampleDataSets]

  // 根据数据类型自动调整映射
  if (dataType === 'device_list') {
    dataMappings.value = [
      { key: '', target: 'deviceName', description: '设备名称' },
      { key: '', target: 'deviceId', description: '设备ID' },
      { key: '', target: 'status', description: '设备状态' }
    ]
  } else if (dataType === 'telemetry_data') {
    dataMappings.value = [
      { key: '', target: 'temperature', description: '温度' },
      { key: '', target: 'humidity', description: '湿度' },
      { key: '', target: 'pressure', description: '气压' }
    ]
  } else if (dataType === 'alarm_list') {
    dataMappings.value = [
      { key: '', target: 'severity', description: '告警级别' },
      { key: '', target: 'message', description: '告警消息' },
      { key: '', target: 'timestamp', description: '时间戳' }
    ]
  } else if (dataType === 'single_object') {
    dataMappings.value = [
      { key: '', target: 'deviceName', description: '设备名称' },
      { key: '', target: 'deviceId', description: '设备ID' },
      { key: '', target: 'temperature', description: '温度' }
    ]
  }
}

const updateMappings = (mappings: DataPathMapping[]) => {
  dataMappings.value = mappings
}

const updateArrayMode = (mode: boolean) => {
  arrayMode.value = mode
}

const testMapping = () => {
  console.log('测试映射结果:', mappedData.value)
}

const resetConfig = () => {
  selectedDataType.value = 'device_list'
  arrayMode.value = false
  updateSampleData('device_list')
}
</script>

<style scoped>
.array-mode-example {
  padding: 16px;
  max-width: 900px;
  margin: 0 auto;
}

.data-preview {
  max-height: 200px;
  overflow-y: auto;
}

.data-preview pre {
  margin: 0;
  font-size: 11px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.result-item {
  margin-bottom: 12px;
}

.result-item strong {
  display: block;
  margin-bottom: 4px;
  color: #666;
}

.result-item pre {
  margin: 0;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 11px;
  max-height: 150px;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}
</style>
