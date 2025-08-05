<template>
  <div class="data-source-config">
    <!-- 数据源类型选择 -->
    <div class="config-section">
      <div class="section-title">数据源类型</div>
      <n-select
        v-model:value="localConfig.type"
        :options="dataSourceTypeOptions"
        size="small"
        @update:value="onDataSourceTypeChange"
      />
    </div>

    <!-- 静态数据配置 -->
    <div v-if="localConfig.type === 'static'" class="config-section">
      <div class="section-title">
        <span>静态数据</span>
        <n-button text size="small" @click="loadSampleData">
          <template #icon>
            <i class="i-carbon-document-add" />
          </template>
          加载示例
        </n-button>
      </div>

      <!-- JSON编辑器 -->
      <div class="json-editor">
        <n-input
          v-model:value="jsonDataString"
          type="textarea"
          placeholder="输入JSON格式的数据"
          :rows="6"
          size="small"
          @input="onJsonDataChange"
        />
        <div v-if="jsonError" class="json-error">
          <n-text type="error" size="small">{{ jsonError }}</n-text>
        </div>
      </div>

      <!-- 数据预览 -->
      <div v-if="parsedData" class="data-preview">
        <div class="preview-title">数据预览:</div>
        <div class="preview-content">
          <pre class="json-preview">{{ formatJsonData(parsedData) }}</pre>
        </div>
      </div>
    </div>

    <!-- 设备API配置 -->
    <div v-if="localConfig.type === 'device-api'" class="config-section">
      <div class="section-title">设备API配置</div>

      <!-- API类型选择 -->
      <div class="form-item">
        <label class="form-label">API类型:</label>
        <n-select
          v-model:value="deviceApiType"
          :options="[{ label: '遥测数据 (telemetryDataCurrentKeys)', value: 'telemetryDataCurrentKeys' }]"
          size="small"
          placeholder="选择API类型"
        />
      </div>

      <!-- 设备ID -->
      <div class="form-item">
        <label class="form-label">设备ID:</label>
        <n-input
          v-model:value="deviceId"
          size="small"
          placeholder="输入设备ID，如: device-001"
          @input="onDeviceApiConfigChange"
        />
      </div>

      <!-- 指标Keys -->
      <div class="form-item">
        <label class="form-label">指标Keys:</label>
        <n-input
          v-model:value="deviceKeys"
          size="small"
          placeholder="输入指标名称，如: temperature,humidity"
          @input="onDeviceApiConfigChange"
        />
      </div>

      <!-- 测试API连接 -->
      <div class="form-item">
        <n-space>
          <n-button size="small" :loading="testingApi" :disabled="!deviceId || !deviceKeys" @click="testDeviceApi">
            <template #icon>
              <i class="i-carbon-api" />
            </template>
            测试API连接
          </n-button>
          <n-tag v-if="apiTestResult" :type="apiTestResult.success ? 'success' : 'error'" size="small">
            {{ apiTestResult.success ? '连接成功' : '连接失败' }}
          </n-tag>
        </n-space>
      </div>

      <!-- API响应预览 -->
      <div v-if="deviceApiResponse" class="api-response-preview">
        <div class="preview-title">API响应预览:</div>
        <div class="preview-content">
          <pre class="json-preview">{{ formatJsonData(deviceApiResponse) }}</pre>
        </div>
      </div>
    </div>

    <!-- 字段映射配置 -->
    <div v-if="parsedData || deviceApiResponse" class="config-section">
      <div class="section-title">字段映射</div>
      <div class="field-mappings">
        <div v-for="(schema, fieldName) in componentSchema" :key="fieldName" class="mapping-item">
          <div class="mapping-header">
            <span class="field-name">{{ fieldName }}</span>
            <n-tag size="small" :type="schema.required ? 'error' : 'info'">
              {{ schema.required ? '必填' : '可选' }}
            </n-tag>
            <span class="field-type">({{ schema.type }})</span>
          </div>

          <div class="field-description">{{ schema.description }}</div>

          <!-- 路径选择 -->
          <div class="path-selector">
            <n-select
              v-model:value="localConfig.fieldMappings[fieldName]"
              :options="getPathOptions()"
              placeholder="选择数据路径"
              size="small"
              filterable
              clearable
              @update:value="onMappingChange"
            />
          </div>

          <!-- 映射预览 -->
          <div v-if="localConfig.fieldMappings[fieldName]" class="mapping-preview">
            <span class="preview-label">预览值:</span>
            <code class="preview-value">
              {{ getMappingPreview(fieldName) }}
            </code>
            <n-tag size="small" :type="isMappingValid(fieldName) ? 'success' : 'warning'">
              {{ isMappingValid(fieldName) ? '有效' : '无效' }}
            </n-tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 配置操作 -->
    <div class="config-actions">
      <n-space>
        <n-button size="small" @click="testConfiguration">
          <template #icon>
            <i class="i-carbon-play" />
          </template>
          测试配置
        </n-button>
        <n-button type="primary" size="small" @click="saveConfiguration">
          <template #icon>
            <i class="i-carbon-checkmark" />
          </template>
          应用配置
        </n-button>
      </n-space>
    </div>

    <!-- 测试结果 -->
    <div v-if="testResult" class="test-result">
      <n-divider title-placement="left" size="small">测试结果</n-divider>
      <div class="result-content">
        <div v-for="(result, field) in testResult" :key="field" class="result-item">
          <span class="result-field">{{ field }}:</span>
          <code class="result-value">{{ JSON.stringify(result.value) }}</code>
          <n-tag size="small" :type="result.valid ? 'success' : 'error'">
            {{ result.valid ? '成功' : '失败' }}
          </n-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { NSelect, NInput, NButton, NTag, NText, NSpace, NDivider } from 'naive-ui'
import type { ComponentDataSchema, DataSourceConfig } from './types'

interface Props {
  dataSourceConfig: DataSourceConfig
  componentSchema: ComponentDataSchema
}

interface Emits {
  'update-config': [config: DataSourceConfig]
  'test-data': [data: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 响应式数据
const localConfig = reactive<DataSourceConfig>({ ...props.dataSourceConfig })
const jsonDataString = ref('')
const jsonError = ref('')
const parsedData = ref<any>(null)
const testResult = ref<any>(null)

// 设备API相关数据
const deviceApiType = ref('telemetryDataCurrentKeys')
const deviceId = ref('')
const deviceKeys = ref('')
const testingApi = ref(false)
const apiTestResult = ref<{ success: boolean; message?: string } | null>(null)
const deviceApiResponse = ref<any>(null)

// 数据源类型选项
const dataSourceTypeOptions = [
  { label: '静态数据', value: 'static' },
  { label: '设备API', value: 'device-api' }
]

// 示例数据
const sampleDataOptions = [
  {
    name: '温度传感器数据',
    data: {
      temperature: 25.6,
      humidity: 68.2,
      title: '温度传感器',
      unit: '°C',
      status: 'normal'
    }
  },
  {
    name: '设备状态数据',
    data: {
      value: 1,
      title: '设备在线状态',
      unit: '台',
      online: true,
      deviceName: '传感器001'
    }
  },
  {
    name: '嵌套对象数据',
    data: {
      sensor: {
        value: 42.5,
        name: '压力传感器',
        unit: 'Pa'
      },
      meta: {
        timestamp: '2024-01-01T12:00:00Z',
        quality: 'good'
      }
    }
  }
]

// 计算属性
const componentSchema = computed(() => props.componentSchema)

// 方法
const formatJsonData = (data: any): string => {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

const onDataSourceTypeChange = () => {
  // 重置配置和状态
  apiTestResult.value = null
  deviceApiResponse.value = null
  parsedData.value = null

  if (localConfig.type === 'static') {
    loadSampleData()
  } else if (localConfig.type === 'device-api') {
    // 设置设备API默认值
    deviceApiType.value = 'telemetryDataCurrentKeys'
    deviceId.value = 'sample-device-001'
    deviceKeys.value = 'temperature,humidity'
  }
}

const loadSampleData = () => {
  // 加载第一个示例数据
  const sample = sampleDataOptions[0]
  localConfig.data = { ...sample.data }
  jsonDataString.value = formatJsonData(sample.data)
  parseJsonData()
}

const onJsonDataChange = () => {
  parseJsonData()
}

const parseJsonData = () => {
  try {
    if (jsonDataString.value.trim()) {
      parsedData.value = JSON.parse(jsonDataString.value)
      localConfig.data = parsedData.value
      jsonError.value = ''
    } else {
      parsedData.value = null
      jsonError.value = ''
    }
  } catch (error) {
    jsonError.value = error instanceof Error ? error.message : '无效的JSON格式'
    parsedData.value = null
  }
}

const getPathOptions = () => {
  if (!parsedData.value) return []

  const paths: Array<{ label: string; value: string }> = []

  // 递归收集所有可用路径
  const collectPaths = (obj: any, currentPath: string = '') => {
    if (obj === null || obj === undefined) return

    if (typeof obj === 'object' && !Array.isArray(obj)) {
      Object.keys(obj).forEach(key => {
        const newPath = currentPath ? `${currentPath}.${key}` : key
        const value = obj[key]

        // 添加当前路径
        paths.push({
          label: `${newPath} (${typeof value})`,
          value: newPath
        })

        // 如果是对象，继续递归
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          collectPaths(value, newPath)
        }
      })
    }
  }

  collectPaths(parsedData.value)
  return paths
}

const getMappingPreview = (fieldName: string): string => {
  const path = localConfig.fieldMappings[fieldName]
  if (!path || !parsedData.value) return '未配置'

  try {
    const value = getValueByPath(parsedData.value, path)
    return JSON.stringify(value)
  } catch {
    return '路径无效'
  }
}

const isMappingValid = (fieldName: string): boolean => {
  const path = localConfig.fieldMappings[fieldName]
  if (!path || !parsedData.value) return false

  try {
    const value = getValueByPath(parsedData.value, path)
    return value !== undefined
  } catch {
    return false
  }
}

const getValueByPath = (obj: any, path: string): any => {
  if (!obj || !path) return undefined

  const parts = path.split('.')
  let current = obj

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part]
    } else {
      return undefined
    }
  }

  return current
}

const onMappingChange = () => {
  // 字段映射变化时的处理
}

const testConfiguration = () => {
  if (!parsedData.value) {
    testResult.value = null
    return
  }

  const result: any = {}

  Object.keys(componentSchema.value).forEach(fieldName => {
    const path = localConfig.fieldMappings[fieldName]
    if (path) {
      try {
        const value = getValueByPath(parsedData.value, path)
        result[fieldName] = {
          value,
          valid: value !== undefined
        }
      } catch (error) {
        result[fieldName] = {
          value: undefined,
          valid: false,
          error: error instanceof Error ? error.message : '解析错误'
        }
      }
    } else {
      result[fieldName] = {
        value: componentSchema.value[fieldName].defaultValue,
        valid: true,
        note: '使用默认值'
      }
    }
  })

  testResult.value = result

  // 触发测试数据事件
  const testData: any = {}
  Object.keys(result).forEach(field => {
    if (result[field].valid) {
      testData[field] = result[field].value
    }
  })

  emit('test-data', testData)
}

const saveConfiguration = () => {
  emit('update-config', { ...localConfig })
}

// 设备API相关方法
const onDeviceApiConfigChange = () => {
  // 清除之前的测试结果
  apiTestResult.value = null
  deviceApiResponse.value = null
  parsedData.value = null
}

const testDeviceApi = async () => {
  if (!deviceId.value || !deviceKeys.value) {
    return
  }

  testingApi.value = true
  apiTestResult.value = null

  try {
    // 动态导入API函数
    const { telemetryDataCurrentKeys } = await import('@/service/api/device')

    console.log('🔌 [DataSourceTestConfig] 测试设备API:', {
      device_id: deviceId.value,
      keys: deviceKeys.value
    })

    const response = await telemetryDataCurrentKeys({
      device_id: deviceId.value,
      keys: deviceKeys.value
    })

    console.log('✅ [DataSourceTestConfig] API测试成功:', response)

    // 保存响应结果
    deviceApiResponse.value = response
    parsedData.value = response // 用于字段映射

    // 更新本地配置
    localConfig.data = response
    localConfig.type = 'device-api'

    apiTestResult.value = {
      success: true,
      message: '连接成功'
    }
  } catch (error) {
    console.error('❌ [DataSourceTestConfig] API测试失败:', error)

    apiTestResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'API调用失败'
    }
  } finally {
    testingApi.value = false
  }
}

// 初始化
onMounted(() => {
  if (localConfig.data) {
    jsonDataString.value = formatJsonData(localConfig.data)
    parseJsonData()
  } else {
    loadSampleData()
  }
})

// 监听外部配置变化
watch(
  () => props.dataSourceConfig,
  newConfig => {
    Object.assign(localConfig, newConfig)
    if (newConfig.data) {
      jsonDataString.value = formatJsonData(newConfig.data)
      parseJsonData()
    }
  },
  { deep: true }
)
</script>

<style scoped>
.data-source-config {
  padding: 16px;
  max-height: 600px;
  overflow-y: auto;
}

.config-section {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.json-editor {
  position: relative;
}

.json-error {
  margin-top: 4px;
}

.data-preview {
  margin-top: 12px;
}

.preview-title {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  margin-bottom: 4px;
}

.preview-content {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 8px;
  border: 1px solid #e9ecef;
}

.json-preview {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  line-height: 1.4;
  color: #333;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;
}

.field-mappings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mapping-item {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e9ecef;
}

.mapping-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.field-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.field-type {
  font-size: 11px;
  color: #666;
  font-style: italic;
}

.field-description {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.path-selector {
  margin-bottom: 8px;
}

.mapping-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.preview-label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.preview-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  background: #f0f0f0;
  padding: 2px 4px;
  border-radius: 2px;
  color: #333;
}

.config-actions {
  display: flex;
  justify-content: center;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.test-result {
  margin-top: 16px;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 12px;
}

.result-field {
  font-weight: 500;
  color: #333;
  min-width: 60px;
}

.result-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  background: white;
  padding: 2px 4px;
  border-radius: 2px;
  border: 1px solid #e9ecef;
  color: #333;
}

/* 设备API配置样式 */
.form-item {
  margin-bottom: 12px;
}

.form-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #666;
  margin-bottom: 4px;
}

.api-response-preview {
  margin-top: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e9ecef;
}

.api-response-preview .preview-title {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.api-response-preview .preview-content {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 8px;
  border: 1px solid #e9ecef;
}

.api-response-preview .json-preview {
  max-height: 200px;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 600px) {
  .mapping-header {
    flex-wrap: wrap;
    gap: 4px;
  }

  .result-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .form-item {
    margin-bottom: 8px;
  }
}
</style>
