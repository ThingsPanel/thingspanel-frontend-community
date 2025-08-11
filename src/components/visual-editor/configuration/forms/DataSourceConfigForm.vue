<template>
  <div class="simple-data-source-form">
    <div class="config-header">
      <h4>数据源测试配置</h4>
    </div>

    <!-- JSON数据录入 -->
    <div class="json-input-section">
      <div class="section-title">复杂JSON数据</div>
      <div class="json-editor">
        <n-input
          v-model:value="jsonInput"
          type="textarea"
          placeholder="输入复杂JSON数据..."
          :rows="8"
          @update:value="handleJsonChange"
        />
        <div class="json-actions">
          <n-button size="small" @click="loadExampleData">对象示例</n-button>
          <n-button size="small" type="info" @click="loadArrayExample">数组示例</n-button>
          <n-button size="small" type="primary" @click="randomizeData">随机更新</n-button>
          <n-button size="small" @click="formatJson">格式化</n-button>
        </div>
      </div>
    </div>

    <!-- 智能数据配置 - 根据数据类型显示不同配置 -->
    <div class="mapping-section">
      <div class="section-title">
        数据配置
        <n-tag :type="dataTypeTag.type" size="tiny" style="margin-left: 8px">
          {{ dataTypeTag.label }}
        </n-tag>
      </div>

      <!-- 数组数据配置 -->
      <div v-if="isArrayDataDetected" class="array-config">
        <div class="config-description">
          <n-text depth="3" style="font-size: 12px">配置数组中每个对象的字段映射，用于图表X/Y轴显示</n-text>
        </div>
        <div class="mapping-list">
          <div class="mapping-item">
            <span class="mapping-label">X轴字段名:</span>
            <n-input
              v-model:value="arrayConfig.xField"
              placeholder="例: timestamp, time, date"
              size="small"
              @update:value="handleMappingChange"
            />
            <n-text depth="3" style="font-size: 11px; margin-top: 2px">时间或索引字段，用于图表横轴</n-text>
          </div>
          <div class="mapping-item">
            <span class="mapping-label">Y轴字段名:</span>
            <n-input
              v-model:value="arrayConfig.yField"
              placeholder="例: temperature, value, count"
              size="small"
              @update:value="handleMappingChange"
            />
            <n-text depth="3" style="font-size: 11px; margin-top: 2px">数值字段，用于图表纵轴</n-text>
          </div>
          <div class="mapping-item">
            <span class="mapping-label">标签字段名:</span>
            <n-input
              v-model:value="arrayConfig.labelField"
              placeholder="例: name, label (可选)"
              size="small"
              @update:value="handleMappingChange"
            />
            <n-text depth="3" style="font-size: 11px; margin-top: 2px">可选，用于数据点标签显示</n-text>
          </div>
        </div>
      </div>

      <!-- 对象数据配置 -->
      <div v-else-if="isObjectDataDetected" class="object-config">
        <div class="config-description">
          <n-text depth="3" style="font-size: 12px">对象数据将自动扫描所有数值字段，无需额外配置</n-text>
        </div>
        <div v-if="detectedNumericFields.length > 0" class="auto-fields-preview">
          <div class="preview-title">检测到的数值字段:</div>
          <div class="fields-list">
            <n-tag
              v-for="field in detectedNumericFields"
              :key="field.path"
              size="small"
              type="info"
              style="margin: 2px"
            >
              {{ field.path }}: {{ field.value }}
            </n-tag>
          </div>
        </div>
      </div>

      <!-- 未识别数据类型 -->
      <div v-else class="unknown-data-config">
        <n-alert type="warning" :show-icon="false" size="small">请先输入有效的JSON数据以显示配置选项</n-alert>
      </div>
    </div>

    <!-- 智能数据预览 -->
    <div class="preview-section">
      <div class="section-title">数据预览</div>
      <div class="preview-content">
        <!-- 数组数据预览 -->
        <div v-if="isArrayDataDetected && currentOutputData.arrayLength" class="array-preview">
          <div class="preview-header">
            <n-text style="font-size: 12px; color: var(--success-color)">
              ✅ 数组数据 ({{ currentOutputData.arrayLength }} 项)
            </n-text>
          </div>
          <div class="preview-mapping">
            <div class="mapping-preview-item">
              <span class="field-name">X轴 ({{ arrayConfig.xField }}):</span>
              <span class="field-value">{{ currentOutputData.xValue }}</span>
            </div>
            <div class="mapping-preview-item">
              <span class="field-name">Y轴 ({{ arrayConfig.yField }}):</span>
              <span class="field-value">{{ currentOutputData.yValue }}</span>
            </div>
            <div
              v-if="arrayConfig.labelField && currentOutputData.labelValue !== '未配置'"
              class="mapping-preview-item"
            >
              <span class="field-name">标签 ({{ arrayConfig.labelField }}):</span>
              <span class="field-value">{{ currentOutputData.labelValue }}</span>
            </div>
          </div>
        </div>

        <!-- 对象数据预览 -->
        <div v-else-if="isObjectDataDetected && currentOutputData.numericFieldsCount" class="object-preview">
          <div class="preview-header">
            <n-text style="font-size: 12px; color: var(--info-color)">
              ✅ 对象数据 ({{ currentOutputData.numericFieldsCount }} 个数值字段)
            </n-text>
          </div>
          <div class="fields-preview">
            <n-tag
              v-for="field in currentOutputData.fields"
              :key="field.path"
              size="small"
              type="info"
              style="margin: 2px 4px 2px 0"
            >
              {{ field.path }}: {{ field.value }}
            </n-tag>
            <n-text v-if="currentOutputData.numericFieldsCount > 5" depth="3" style="font-size: 11px">
              ...还有 {{ currentOutputData.numericFieldsCount - 5 }} 个字段
            </n-text>
          </div>
        </div>

        <!-- 无数据或错误状态 -->
        <div v-else class="no-preview">
          <n-text depth="3" style="font-size: 12px">
            {{ currentOutputData.error || '请输入有效的JSON数据以查看预览' }}
          </n-text>
        </div>
      </div>
    </div>

    <!-- 当前输出数据 -->
    <div class="output-section">
      <div class="section-title">当前输出给组件的数据</div>
      <pre class="output-preview">{{ JSON.stringify(currentOutputData, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NInput, NButton, useMessage } from 'naive-ui'

interface Props {
  modelValue?: any
  widget?: any
  readonly?: boolean
  showAdvanced?: boolean
}

interface Emits {
  'update:modelValue': [value: any]
  validate: [isValid: boolean]
  'toggle-advanced': []
  'data-updated': [data: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const message = useMessage()

// 状态数据
const jsonInput = ref('')

// 🎯 新的数据配置结构 - 语义化字段替换key1/key2/key3
const arrayConfig = ref({
  xField: 'timestamp', // X轴字段名（时间、索引等）
  yField: 'temperature', // Y轴字段名（数值）
  labelField: 'label' // 标签字段名（可选）
})

// 保留旧配置以兼容现有代码（将逐步移除）
const mappingConfig = ref({
  key1: 'sensors.temperature.current',
  key2: 'device.status',
  key3: 'statistics.dataPoints'
})

// 解析后的JSON对象
const parsedJson = ref<any>({})

// 当前输出给组件的数据
const currentOutputData = ref<any>({ key1: null, key2: null, key3: null })

// 🎯 智能数据类型检测
const isArrayDataDetected = computed(() => {
  return Array.isArray(parsedJson.value) && parsedJson.value.length > 0
})

const isObjectDataDetected = computed(() => {
  return parsedJson.value && typeof parsedJson.value === 'object' && !Array.isArray(parsedJson.value)
})

const dataTypeTag = computed(() => {
  if (isArrayDataDetected.value) {
    const length = parsedJson.value.length
    return { type: 'success', label: `数组数据 (${length}项)` }
  } else if (isObjectDataDetected.value) {
    const keys = Object.keys(parsedJson.value).length
    return { type: 'info', label: `对象数据 (${keys}字段)` }
  } else {
    return { type: 'warning', label: '未识别' }
  }
})

// 🎯 自动检测对象中的数值字段
const detectedNumericFields = computed(() => {
  if (!isObjectDataDetected.value) return []

  const fields: Array<{ path: string; value: any; type: string }> = []

  const extractFields = (obj: any, prefix = '') => {
    Object.entries(obj).forEach(([key, value]) => {
      const fullPath = prefix ? `${prefix}.${key}` : key

      if (typeof value === 'number') {
        fields.push({ path: fullPath, value, type: 'number' })
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        extractFields(value, fullPath)
      }
    })
  }

  extractFields(parsedJson.value)
  return fields.slice(0, 10) // 最多显示10个字段
})

// 🎯 自动检测数组中的字段
const detectedArrayFields = computed(() => {
  if (!isArrayDataDetected.value) return []

  const firstItem = parsedJson.value[0]
  if (!firstItem || typeof firstItem !== 'object') return []

  return Object.keys(firstItem).map(key => ({
    name: key,
    type: typeof firstItem[key],
    value: firstItem[key]
  }))
})

// 解析路径值
const resolveValue = (key: 'key1' | 'key2' | 'key3') => {
  const path = mappingConfig.value[key]
  if (!path || !parsedJson.value) return 'null'

  try {
    const value = getValueByPath(parsedJson.value, path)
    return JSON.stringify(value)
  } catch {
    return 'path error'
  }
}

// 根据路径获取值
const getValueByPath = (obj: any, path: string): any => {
  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (current === null || current === undefined) {
      return null
    }
    current = current[key]
  }

  return current
}

// 处理JSON变化
const handleJsonChange = () => {
  try {
    parsedJson.value = JSON.parse(jsonInput.value)
    updateOutput()
  } catch (error) {
    // JSON格式错误时不更新
  }
}

// 处理映射变化
const handleMappingChange = () => {
  console.log('🔄 [DataSourceConfigForm] 配置变化，当前arrayConfig:', arrayConfig.value)
  updateOutput()
}

// 🎯 新的统一数据输出函数 - 支持智能数据处理
const updateOutput = () => {
  if (!parsedJson.value) return

  // 🎯 关键：直接传递原始数据给组件，让组件自己处理
  if (props.widget) {
    // 🎯 重要：创建全新的metadata对象确保响应式更新
    const newMetadata = {
      ...props.widget.metadata,
      card2Data: parsedJson.value,
      dataConfig: {
        isArray: isArrayDataDetected.value,
        isObject: isObjectDataDetected.value,
        arrayConfig: isArrayDataDetected.value
          ? {
              xField: arrayConfig.value.xField,
              yField: arrayConfig.value.yField,
              labelField: arrayConfig.value.labelField
            }
          : null,
        detectedFields: isArrayDataDetected.value ? detectedArrayFields.value : detectedNumericFields.value
      },
      // 添加时间戳确保每次都是新对象
      _updateTimestamp: Date.now()
    }

    // 替换整个metadata对象触发响应式更新
    props.widget.metadata = newMetadata

    console.log('🎯 DataSourceConfigForm - 统一数据已更新:', {
      data: parsedJson.value,
      config: props.widget.metadata.dataConfig,
      isArray: isArrayDataDetected.value,
      isObject: isObjectDataDetected.value
    })
  }

  // 🎯 更新输出数据用于预览显示
  if (isArrayDataDetected.value) {
    // 数组数据预览：显示配置的字段值
    const firstItem = parsedJson.value[0] || {}
    currentOutputData.value = {
      xValue: firstItem[arrayConfig.value.xField] || '未找到',
      yValue: firstItem[arrayConfig.value.yField] || '未找到',
      labelValue: firstItem[arrayConfig.value.labelField] || '未配置',
      arrayLength: parsedJson.value.length
    }
  } else if (isObjectDataDetected.value) {
    // 对象数据预览：显示检测到的数值字段
    currentOutputData.value = {
      numericFieldsCount: detectedNumericFields.value.length,
      fields: detectedNumericFields.value.slice(0, 5) // 显示前5个字段
    }
  } else {
    currentOutputData.value = { error: '无效的数据格式' }
  }

  // 🎯 关键：构建ConfigurationManager期望的数据源格式
  const dataSourceConfig = {
    type: 'static' as const, // ConfigurationManager验证需要的类型
    config: {
      data: parsedJson.value,
      mappings: mappingConfig.value,
      output: currentOutputData.value, // 使用当前输出数据
      // 🎯 新增：语义化配置信息
      dataType: isArrayDataDetected.value ? 'array' : isObjectDataDetected.value ? 'object' : 'unknown',
      arrayConfig: isArrayDataDetected.value ? arrayConfig.value : null
    },
    refreshInterval: 0, // 静态数据不需要刷新
    enableCache: false, // 静态数据不需要缓存
    cacheTimeout: 0,
    retryAttempts: 0
  }

  console.log('🔧 DataSourceConfigForm - 发送数据源配置:', dataSourceConfig)

  emit('update:modelValue', dataSourceConfig)
  emit('validate', true)

  // 🎯 关键：发送data-updated事件给SettingsPanel（使用新的数据结构）
  const eventData = {
    data: parsedJson.value, // 总是传递原始数据
    config: {
      ...dataSourceConfig.config,
      // 🎯 新增：语义化配置信息
      dataType: isArrayDataDetected.value ? 'array' : isObjectDataDetected.value ? 'object' : 'unknown',
      arrayConfig: isArrayDataDetected.value ? arrayConfig.value : null,
      detectedFields: isArrayDataDetected.value ? detectedArrayFields.value : detectedNumericFields.value
    },
    type: 'static',
    isArrayData: isArrayDataDetected.value,
    isObjectData: isObjectDataDetected.value,
    // 兼容性保留
    originalData: parsedJson.value,
    mappings: mappingConfig.value,
    timestamp: Date.now()
  }

  console.log('🎯 DataSourceConfigForm - 发送data-updated事件（新结构）:', eventData)
  emit('data-updated', eventData)
}

// 加载示例数据
const loadExampleData = () => {
  const exampleData = {
    sensors: {
      temperature: {
        current: 25.5,
        unit: '°C',
        status: 'normal'
      },
      humidity: {
        current: 60,
        unit: '%',
        status: 'normal'
      },
      pressure: {
        current: 1013.25,
        unit: 'hPa',
        status: 'normal'
      }
    },
    device: {
      id: 'sensor_001',
      name: '环境监测传感器',
      status: 'online',
      lastUpdate: new Date().toISOString(),
      location: {
        building: 'A',
        floor: 2,
        room: '201'
      }
    },
    statistics: {
      uptime: 86400,
      dataPoints: 1440,
      errors: 0,
      warnings: 2
    },
    timestamp: new Date().toISOString()
  }

  jsonInput.value = JSON.stringify(exampleData, null, 2)
  parsedJson.value = exampleData
  updateOutput()
  message.success('示例数据已加载')
}

// 🎯 加载数组数据示例（支持ECharts曲线渲染）
const loadArrayExample = () => {
  const arrayExampleData = [
    { timestamp: '2024-01-01 10:00', temperature: 22.5, humidity: 65, pressure: 1013.2, label: '数据点1' },
    { timestamp: '2024-01-01 11:00', temperature: 23.2, humidity: 62, pressure: 1013.5, label: '数据点2' },
    { timestamp: '2024-01-01 12:00', temperature: 21.8, humidity: 68, pressure: 1012.8, label: '数据点3' },
    { timestamp: '2024-01-01 13:00', temperature: 24.1, humidity: 60, pressure: 1014.1, label: '数据点4' },
    { timestamp: '2024-01-01 14:00', temperature: 25.0, humidity: 58, pressure: 1014.3, label: '数据点5' },
    { timestamp: '2024-01-01 15:00', temperature: 23.7, humidity: 63, pressure: 1013.9, label: '数据点6' },
    { timestamp: '2024-01-01 16:00', temperature: 22.9, humidity: 66, pressure: 1013.4, label: '数据点7' }
  ]

  jsonInput.value = JSON.stringify(arrayExampleData, null, 2)
  parsedJson.value = arrayExampleData

  // 🎯 智能设置数组配置（新的语义化字段）
  arrayConfig.value = {
    xField: 'timestamp', // X轴：时间戳
    yField: 'temperature', // Y轴：温度数值
    labelField: 'label' // 标签：数据点标签
  }

  updateOutput()
  message.success('数组数据示例已加载！字段映射: X轴=timestamp, Y轴=temperature')
}

// 随机更新数据
const randomizeData = () => {
  if (!parsedJson.value || Object.keys(parsedJson.value).length === 0) {
    loadExampleData()
    return
  }

  try {
    const randomizeObject = (obj: any): any => {
      if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        const newObj = { ...obj }
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'number') {
            // 随机变化±20%
            newObj[key] = Math.round((value + (Math.random() - 0.5) * value * 0.4) * 100) / 100
          } else if (typeof value === 'string') {
            if (key === 'status') {
              const statuses = ['online', 'offline', 'maintenance', 'warning']
              newObj[key] = statuses[Math.floor(Math.random() * statuses.length)]
            } else if (key === 'lastUpdate' || key === 'timestamp') {
              newObj[key] = new Date().toISOString()
            }
          } else if (typeof value === 'object') {
            newObj[key] = randomizeObject(value)
          }
        }
        return newObj
      }
      return obj
    }

    const randomizedData = randomizeObject(parsedJson.value)

    // 更新时间戳
    if (randomizedData.timestamp) {
      randomizedData.timestamp = new Date().toISOString()
    }
    if (randomizedData.device?.lastUpdate) {
      randomizedData.device.lastUpdate = new Date().toISOString()
    }

    jsonInput.value = JSON.stringify(randomizedData, null, 2)
    parsedJson.value = randomizedData
    updateOutput()
    message.success('数据已随机更新，组件应该看到新数据')
  } catch (error) {
    message.error('随机更新失败')
  }
}

// 格式化JSON
const formatJson = () => {
  try {
    const parsed = JSON.parse(jsonInput.value)
    jsonInput.value = JSON.stringify(parsed, null, 2)
    parsedJson.value = parsed
    updateOutput()
    message.success('JSON已格式化')
  } catch (error) {
    message.error('JSON格式错误')
  }
}

// 🎯 监听arrayConfig变化，确保实时更新
watch(
  () => arrayConfig.value,
  (newConfig, oldConfig) => {
    if (isArrayDataDetected.value && parsedJson.value) {
      console.log('🔄 [DataSourceConfigForm] arrayConfig变化:', {
        old: oldConfig,
        new: newConfig
      })
      updateOutput()
    }
  },
  { deep: true }
)

// 监听widget变化
watch(
  () => props.widget,
  newWidget => {
    console.log('🔧 DataSourceConfigForm - 选中组件变化:', newWidget)
  },
  { deep: true }
)

// 初始化
onMounted(() => {
  console.log('🔧 DataSourceConfigForm - 组件挂载，当前选中widget:', props.widget)

  // 先发送一个符合验证规范的初始配置，防止验证报错
  const initialConfig = {
    type: 'static' as const,
    config: {
      data: {},
      mappings: mappingConfig.value,
      output: { key1: null, key2: null, key3: null }
    },
    refreshInterval: 0,
    enableCache: false,
    cacheTimeout: 0,
    retryAttempts: 0
  }

  console.log('🔧 DataSourceConfigForm - 发送初始配置:', initialConfig)
  emit('update:modelValue', initialConfig)
  emit('validate', true)

  // 然后加载示例数据
  loadExampleData()
})
</script>

<style scoped>
.simple-data-source-form {
  padding: 12px;
  max-width: 100%;
}

/* 窄面板优化 */
.simple-data-source-form .section-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-color);
}

.simple-data-source-form .json-input-section,
.simple-data-source-form .mapping-section,
.simple-data-source-form .preview-section,
.simple-data-source-form .output-section {
  margin-bottom: 16px;
}

.config-header h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 8px;
}

.json-input-section {
  margin-bottom: 20px;
}

.json-editor {
  position: relative;
}

.json-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  justify-content: flex-start;
}

.json-actions .n-button {
  flex: 1;
  min-width: 70px;
}

/* 响应式设计 - 窄宽度适配 */
@media (max-width: 300px) {
  .json-actions {
    flex-direction: column;
  }

  .json-actions .n-button {
    width: 100%;
  }
}

.mapping-section {
  margin-bottom: 20px;
}

.mapping-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mapping-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

/* 在较宽的容器中使用水平布局 */
.mapping-item.horizontal {
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.mapping-label {
  min-width: 50px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-2);
  flex-shrink: 0;
}

.preview-section {
  margin-bottom: 20px;
}

.preview-content {
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-label {
  min-width: 50px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color-2);
}

.preview-value {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: var(--primary-color);
  background: var(--body-color);
  padding: 2px 6px;
  border-radius: 3px;
  border: 1px solid var(--border-color);
}

.output-section {
  margin-bottom: 20px;
}

.output-preview {
  background: #f0f9ff;
  border: 1px solid #0ea5e9;
  border-radius: 6px;
  padding: 12px;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  max-height: 150px;
  overflow-y: auto;
  white-space: pre-wrap;
  color: #0c4a6e;
}

/* 🎯 新的智能预览样式 */
.preview-content {
  min-height: 60px;
}

.array-preview,
.object-preview {
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background: var(--card-color);
}

.preview-header {
  margin-bottom: 8px;
  font-weight: 500;
}

.preview-mapping {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mapping-preview-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 0;
  font-size: 12px;
}

.field-name {
  color: var(--text-color-2);
  font-weight: 500;
  flex-shrink: 0;
}

.field-value {
  color: var(--primary-color);
  font-family: monospace;
  background: var(--hover-color);
  padding: 1px 4px;
  border-radius: 2px;
  font-size: 11px;
  margin-left: 8px;
}

.fields-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
}

.no-preview {
  padding: 16px;
  text-align: center;
  color: var(--text-color-3);
  background: var(--hover-color);
  border-radius: 4px;
  border: 1px dashed var(--border-color);
}
</style>
