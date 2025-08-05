<template>
  <div class="flexible-array-example">
    <n-card title="灵活数组处理模式示例" size="small">
      <n-space vertical>
        <!-- 说明 -->
        <n-alert type="info" title="灵活数组处理模式功能说明">
          <template #default>
            <p>
              <strong>三种处理模式</strong>
              ：
            </p>
            <p>
              •
              <strong>自动模式</strong>
              ：系统自动使用默认索引处理数组
            </p>
            <p>
              •
              <strong>手动模式</strong>
              ：用户手动指定数组索引
            </p>
            <p>
              •
              <strong>不处理</strong>
              ：保持数组原样，不进行索引处理
            </p>
            <p>
              <strong>灵活配置</strong>
              ：每个映射可以独立配置处理模式，提供最大灵活性
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

        <DataMappingConfig :data="sampleData" :mappings="dataMappings" @update:mappings="updateMappings" />

        <!-- 映射结果预览 -->
        <n-divider title-placement="left">映射结果预览</n-divider>

        <n-card size="small">
          <div v-if="mappedData">
            <div class="result-item">
              <strong>映射配置:</strong>
              <pre>{{ JSON.stringify(dataMappings, null, 2) }}</pre>
            </div>
            <div class="result-item">
              <strong>处理模式分析:</strong>
              <div class="mode-analysis">
                <div v-for="(mapping, index) in dataMappings" :key="index" class="mode-item">
                  <n-text depth="3" size="small">
                    <strong>{{ mapping.target }}</strong>
                    :
                    <span v-if="mapping.isArray">
                      <n-tag size="small" type="info">{{ getModeLabel(mapping.arrayMode) }}</n-tag>
                      <span v-if="mapping.arrayMode === 'manual'">(索引: {{ mapping.arrayIndex }})</span>
                      <span v-else-if="mapping.arrayMode === 'auto'">(自动索引: {{ mapping.arrayIndex }})</span>
                    </span>
                    <span v-else>
                      <n-tag size="small" type="success">{{ getDataTypeInfo(mapping.key).type }}</n-tag>
                    </span>
                  </n-text>
                </div>
              </div>
            </div>
            <div class="result-item">
              <strong>映射结果:</strong>
              <pre>{{ JSON.stringify(mappedData, null, 2) }}</pre>
            </div>
          </div>
          <n-empty v-else description="请配置数据映射" size="small" />
        </n-card>

        <!-- 模式对比测试 -->
        <n-divider title-placement="left">模式对比测试</n-divider>

        <n-card size="small">
          <n-space vertical>
            <div class="test-section">
              <n-text strong>测试不同处理模式的效果:</n-text>
              <n-space>
                <n-button size="small" @click="testModeFunction('auto')">测试自动模式</n-button>
                <n-button size="small" @click="testModeFunction('manual')">测试手动模式</n-button>
                <n-button size="small" @click="testModeFunction('none')">测试不处理</n-button>
              </n-space>
            </div>
            <div v-if="testResult" class="test-result">
              <n-text depth="3" size="small">
                <strong>测试结果 ({{ testMode }}):</strong>
                {{ JSON.stringify(testResult, null, 2) }}
              </n-text>
            </div>
          </n-space>
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
import { NCard, NSpace, NDivider, NFormItem, NSelect, NButton, NAlert, NEmpty, NText } from 'naive-ui'
import DataMappingConfig from './DataMappingConfig.vue'
import { dataPathResolver } from '../../utils/data-path-resolver'
import type { DataPathMapping } from '../../types/data-source'

// 响应式数据
const selectedDataType = ref('mixed_data')
const testMode = ref('')
const testResult = ref<any>(null)
const dataMappings = ref<DataPathMapping[]>([
  { key: '', target: 'deviceName', description: '设备名称' },
  { key: '', target: 'deviceId', description: '设备ID' },
  { key: '', target: 'status', description: '设备状态' }
])

// 模拟数据 - 包含多种数组结构
const sampleDataSets = {
  simple_array: [
    {
      deviceName: '温度传感器01',
      deviceId: 'temp_sensor_001',
      status: 'online'
    },
    {
      deviceName: '湿度传感器01',
      deviceId: 'humidity_sensor_001',
      status: 'offline'
    }
  ],
  nested_array: {
    response: {
      code: 200,
      message: 'success',
      data: [
        {
          deviceName: '温度传感器01',
          deviceId: 'temp_sensor_001',
          status: 'online'
        },
        {
          deviceName: '湿度传感器01',
          deviceId: 'humidity_sensor_001',
          status: 'offline'
        }
      ]
    }
  },
  mixed_data: {
    devices: [
      { name: '设备1', status: 'online' },
      { name: '设备2', status: 'offline' }
    ],
    summary: {
      total: 2,
      online: 1,
      offline: 1
    },
    lastUpdate: '2024-01-15T10:30:00Z'
  },
  complex_nested: {
    api_response: {
      status: 'success',
      timestamp: '2024-01-15T10:30:00Z',
      results: [
        {
          page: 1,
          items: [
            { id: 1, name: '设备A', value: 100 },
            { id: 2, name: '设备B', value: 200 }
          ]
        },
        {
          page: 2,
          items: [
            { id: 3, name: '设备C', value: 300 },
            { id: 4, name: '设备D', value: 400 }
          ]
        }
      ]
    }
  }
}

const sampleData = ref(sampleDataSets.mixed_data)

// 数据类型选项
const dataTypeOptions = [
  { label: '简单数组', value: 'simple_array' },
  { label: '嵌套数组 (response.data)', value: 'nested_array' },
  { label: '混合数据', value: 'mixed_data' },
  { label: '复杂嵌套 (api_response.results[0].items)', value: 'complex_nested' }
]

// 计算属性
const mappedData = computed(() => {
  if (dataMappings.value.length === 0) return null

  const result: Record<string, any> = {}

  dataMappings.value.forEach(mapping => {
    if (mapping.key) {
      const value = dataPathResolver.resolve(sampleData.value, mapping.key, {
        arrayMode: mapping.arrayMode ?? 'auto',
        defaultArrayIndex: mapping.arrayIndex ?? 0,
        enableAutoDetection: true
      })
      result[mapping.target] = value
    }
  })

  return result
})

// 方法
const updateSampleData = (dataType: string) => {
  sampleData.value = sampleDataSets[dataType as keyof typeof sampleDataSets]

  // 根据数据类型自动调整映射
  if (dataType === 'simple_array') {
    dataMappings.value = [
      { key: '', target: 'deviceName', description: '设备名称' },
      { key: '', target: 'deviceId', description: '设备ID' },
      { key: '', target: 'status', description: '设备状态' }
    ]
  } else if (dataType === 'nested_array') {
    dataMappings.value = [
      { key: '', target: 'deviceName', description: '设备名称' },
      { key: '', target: 'deviceId', description: '设备ID' },
      { key: '', target: 'status', description: '设备状态' }
    ]
  } else if (dataType === 'mixed_data') {
    dataMappings.value = [
      { key: '', target: 'deviceName', description: '设备名称' },
      { key: '', target: 'status', description: '状态' },
      { key: '', target: 'total', description: '总数' }
    ]
  } else if (dataType === 'complex_nested') {
    dataMappings.value = [
      { key: '', target: 'deviceName', description: '设备名称' },
      { key: '', target: 'deviceId', description: '设备ID' },
      { key: '', target: 'value', description: '数值' }
    ]
  }
}

const updateMappings = (mappings: DataPathMapping[]) => {
  dataMappings.value = mappings
}

const getDataTypeInfo = (path: string) => {
  return dataPathResolver.detectDataType(sampleData.value, path)
}

const getModeLabel = (mode?: string) => {
  switch (mode) {
    case 'auto':
      return '自动'
    case 'manual':
      return '手动'
    case 'none':
      return '不处理'
    default:
      return '自动'
  }
}

const testModeFunction = (mode: 'auto' | 'manual' | 'none') => {
  testMode.value = mode

  // 临时设置所有映射为指定模式
  const tempMappings = dataMappings.value.map(mapping => ({
    ...mapping,
    arrayMode: mode,
    arrayIndex: mode === 'manual' ? 1 : 0 // 手动模式使用索引1
  }))

  const result: Record<string, any> = {}

  tempMappings.forEach(mapping => {
    if (mapping.key) {
      const value = dataPathResolver.resolve(sampleData.value, mapping.key, {
        arrayMode: mode,
        defaultArrayIndex: mapping.arrayIndex ?? 0,
        enableAutoDetection: true
      })
      result[mapping.target] = value
    }
  })

  testResult.value = result
}

const testMapping = () => {
  console.log('测试映射结果:', mappedData.value)
  console.log('映射配置:', dataMappings.value)
}

const resetConfig = () => {
  selectedDataType.value = 'mixed_data'
  testMode.value = ''
  testResult.value = null
  updateSampleData('mixed_data')
}
</script>

<style scoped>
.flexible-array-example {
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

.mode-analysis {
  margin-top: 8px;
}

.mode-item {
  margin-bottom: 4px;
}

.test-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.test-result {
  margin-top: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

code {
  background: #f0f0f0;
  padding: 1px 4px;
  border-radius: 2px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
}
</style>
