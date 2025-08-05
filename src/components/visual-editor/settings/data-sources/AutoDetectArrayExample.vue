<template>
  <div class="auto-detect-array-example">
    <n-card title="自动检测数组模式示例" size="small">
      <n-space vertical>
        <!-- 说明 -->
        <n-alert type="info" title="自动检测数组模式功能说明">
          <template #default>
            <p>
              <strong>核心改进</strong>
              ：系统自动检测数据类型，无需用户手动选择
            </p>
            <p>
              <strong>智能映射</strong>
              ：自动识别数组数据并使用第一个元素进行映射
            </p>
            <p>
              <strong>手动路径</strong>
              ：支持用户手动输入复杂路径，如
              <code>data.items[0].value</code>
            </p>
            <p>
              <strong>类型感知</strong>
              ：组件能够知道最终数据是数组还是非数组
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
              <strong>数据类型分析:</strong>
              <div class="type-analysis">
                <div v-for="(mapping, index) in dataMappings" :key="index" class="type-item">
                  <n-text depth="3" size="small">
                    <strong>{{ mapping.target }}</strong>
                    :
                    <span v-if="mapping.isArray">
                      <n-tag size="small" type="info">数组 (索引: {{ mapping.arrayIndex }})</n-tag>
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

        <!-- 手动路径测试 -->
        <n-divider title-placement="left">手动路径测试</n-divider>

        <n-card size="small">
          <n-form-item label="手动输入路径">
            <n-input
              v-model:value="manualPath"
              placeholder="输入路径，如: data.items[0].value 或 response.data[1].name"
              @keyup.enter="testManualPath"
            />
          </n-form-item>
          <n-button type="primary" size="small" :disabled="!manualPath" @click="testManualPath">测试路径</n-button>
          <div v-if="manualPathResult" class="manual-result">
            <n-text depth="3" size="small">
              <strong>路径结果:</strong>
              {{ JSON.stringify(manualPathResult, null, 2) }}
            </n-text>
          </div>
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
import { NCard, NSpace, NDivider, NFormItem, NSelect, NButton, NAlert, NEmpty, NInput, NTag, NText } from 'naive-ui'
import DataMappingConfig from './DataMappingConfig.vue'
import { dataPathResolver } from '../../utils/data-path-resolver'
import type { DataPathMapping } from '../../types/data-source'

// 响应式数据
const selectedDataType = ref('nested_array')
const manualPath = ref('')
const manualPathResult = ref<any>(null)
const dataMappings = ref<DataPathMapping[]>([
  { key: '', target: 'deviceName', description: '设备名称' },
  { key: '', target: 'deviceId', description: '设备ID' },
  { key: '', target: 'status', description: '设备状态' }
])

// 模拟数据 - 包含复杂的嵌套结构
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
          status: 'online',
          metrics: {
            temperature: 25.6,
            humidity: 60.2
          }
        },
        {
          deviceName: '湿度传感器01',
          deviceId: 'humidity_sensor_001',
          status: 'offline',
          metrics: {
            temperature: 24.8,
            humidity: 58.5
          }
        }
      ]
    }
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
  }
}

const sampleData = ref(sampleDataSets.nested_array)

// 数据类型选项
const dataTypeOptions = [
  { label: '简单数组', value: 'simple_array' },
  { label: '嵌套数组 (response.data)', value: 'nested_array' },
  { label: '复杂嵌套 (api_response.results[0].items)', value: 'complex_nested' },
  { label: '混合数据', value: 'mixed_data' }
]

// 计算属性
const mappedData = computed(() => {
  if (dataMappings.value.length === 0) return null

  const result: Record<string, any> = {}

  dataMappings.value.forEach(mapping => {
    if (mapping.key) {
      const value = dataPathResolver.resolve(sampleData.value, mapping.key, {
        autoDetectArray: mapping.isArray ?? true,
        defaultArrayIndex: mapping.arrayIndex ?? 0
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
      { key: '', target: 'temperature', description: '温度' }
    ]
  } else if (dataType === 'complex_nested') {
    dataMappings.value = [
      { key: '', target: 'deviceName', description: '设备名称' },
      { key: '', target: 'deviceId', description: '设备ID' },
      { key: '', target: 'value', description: '数值' }
    ]
  } else if (dataType === 'mixed_data') {
    dataMappings.value = [
      { key: '', target: 'deviceName', description: '设备名称' },
      { key: '', target: 'status', description: '状态' },
      { key: '', target: 'total', description: '总数' }
    ]
  }
}

const updateMappings = (mappings: DataPathMapping[]) => {
  dataMappings.value = mappings
}

const getDataTypeInfo = (path: string) => {
  return dataPathResolver.detectDataType(sampleData.value, path)
}

const testManualPath = () => {
  if (manualPath.value) {
    manualPathResult.value = dataPathResolver.resolve(sampleData.value, manualPath.value, {
      autoDetectArray: true,
      defaultArrayIndex: 0
    })
  }
}

const testMapping = () => {
  console.log('测试映射结果:', mappedData.value)
  console.log('映射配置:', dataMappings.value)
}

const resetConfig = () => {
  selectedDataType.value = 'nested_array'
  manualPath.value = ''
  manualPathResult.value = null
  updateSampleData('nested_array')
}
</script>

<style scoped>
.auto-detect-array-example {
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

.type-analysis {
  margin-top: 8px;
}

.type-item {
  margin-bottom: 4px;
}

.manual-result {
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
