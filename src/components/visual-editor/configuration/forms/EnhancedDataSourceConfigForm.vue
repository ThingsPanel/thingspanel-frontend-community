<template>
  <div class="enhanced-data-source-form">
    <!-- 数据源类型选择 -->
    <div class="data-type-section">
      <div class="section-title">数据源类型</div>
      <n-radio-group v-model:value="dataSourceType" @update:value="handleDataSourceTypeChange">
        <n-space>
          <n-radio value="object">对象数据</n-radio>
          <n-radio value="array">数组数据</n-radio>
        </n-space>
      </n-radio-group>
    </div>

    <!-- JSON数据录入 -->
    <div class="json-input-section">
      <div class="section-title">{{ dataSourceType === 'array' ? '数组JSON数据' : '对象JSON数据' }}</div>
      <div class="json-editor">
        <n-input
          v-model:value="jsonInput"
          type="textarea"
          :placeholder="jsonPlaceholder"
          :rows="10"
          @update:value="handleJsonChange"
        />
        <div class="json-actions">
          <n-button size="small" @click="loadExampleData">加载示例</n-button>
          <n-button size="small" type="primary" @click="randomizeData">随机更新</n-button>
          <n-button size="small" @click="formatJson">格式化</n-button>
        </div>
      </div>
    </div>

    <!-- 对象数据路径映射 -->
    <div v-if="dataSourceType === 'object'" class="object-mapping-section">
      <div class="section-title">对象字段映射</div>
      <div class="mapping-list">
        <div v-for="(key, index) in objectMappingKeys" :key="key" class="mapping-item">
          <span class="mapping-label">{{ key }}:</span>
          <n-input
            v-model:value="objectMappingConfig[key]"
            :placeholder="`例: sensors.temperature.current`"
            size="small"
            @update:value="handleMappingChange"
          />
        </div>
      </div>
    </div>

    <!-- 数组数据路径映射 -->
    <div v-if="dataSourceType === 'array'" class="array-mapping-section">
      <div class="section-title">数组数据配置</div>
      
      <!-- 数组路径 -->
      <div class="array-path-config">
        <div class="config-item">
          <span class="config-label">数组路径:</span>
          <n-input
            v-model:value="arrayMappingConfig.arrayPath"
            placeholder="例: data.measurements (留空表示根数组)"
            size="small"
            @update:value="handleMappingChange"
          />
        </div>
      </div>

      <!-- 数组项字段映射 -->
      <div class="array-fields-config">
        <div class="config-subtitle">数组项字段映射</div>
        <div class="array-field-list">
          <div v-for="field in arrayFields" :key="field.key" class="array-field-item">
            <div class="field-info">
              <span class="field-name">{{ field.name }}</span>
              <span class="field-desc">{{ field.description }}</span>
            </div>
            <n-input
              v-model:value="arrayMappingConfig.fieldMapping[field.key]"
              :placeholder="field.placeholder"
              size="small"
              @update:value="handleMappingChange"
            />
          </div>
        </div>
      </div>

      <!-- 数组处理选项 -->
      <div class="array-options">
        <n-space>
          <n-checkbox v-model:checked="arrayMappingConfig.autoGenerateIndex">
            自动生成索引作为X轴
          </n-checkbox>
          <n-checkbox v-model:checked="arrayMappingConfig.validateItems">
            验证数组项结构
          </n-checkbox>
        </n-space>
      </div>
    </div>

    <!-- 数据预览 -->
    <div class="preview-section">
      <div class="section-title">数据预览</div>
      <div class="preview-content">
        <div class="input-preview">
          <div class="preview-title">输入数据:</div>
          <n-code :code="inputPreview" language="json" show-line-numbers />
        </div>
        <div class="output-preview">
          <div class="preview-title">输出数据:</div>
          <n-code :code="outputPreview" language="json" show-line-numbers />
        </div>
      </div>
    </div>

    <!-- 调试信息 -->
    <div v-if="debugInfo.length > 0" class="debug-section">
      <div class="section-title">处理日志</div>
      <div class="debug-list">
        <div v-for="(info, index) in debugInfo" :key="index" class="debug-item">
          <span :class="['debug-type', `debug-${info.type}`]">{{ info.type.toUpperCase() }}</span>
          <span class="debug-message">{{ info.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useMessage } from 'naive-ui'

interface Props {
  modelValue?: any
  widget?: any
}

interface DebugInfo {
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: any]
  'validate': [valid: boolean]
}>()

const message = useMessage()

// 基础状态
const dataSourceType = ref<'object' | 'array'>('object')
const jsonInput = ref('')
const parsedJson = ref<any>(null)
const debugInfo = ref<DebugInfo[]>([])

// 对象数据映射配置
const objectMappingKeys = ['key1', 'key2', 'key3']
const objectMappingConfig = ref<Record<string, string>>({
  key1: 'sensors.temperature.current',
  key2: 'device.status', 
  key3: 'statistics.dataPoints'
})

// 数组数据映射配置
const arrayMappingConfig = ref({
  arrayPath: '', // 数组在JSON中的路径
  fieldMapping: {
    x: 'x', // X轴字段映射
    y: 'y', // Y轴字段映射
    label: 'label', // 标签字段映射
    timestamp: 'timestamp' // 时间戳字段映射
  },
  autoGenerateIndex: true, // 是否自动生成索引
  validateItems: true // 是否验证数组项
})

// 数组字段配置
const arrayFields = [
  {
    key: 'x',
    name: 'X轴字段',
    description: 'X轴数据字段',
    placeholder: '例: x 或 time'
  },
  {
    key: 'y', 
    name: 'Y轴字段',
    description: 'Y轴数值字段',
    placeholder: '例: y 或 value'
  },
  {
    key: 'label',
    name: '标签字段',
    description: '数据点标签（可选）',
    placeholder: '例: label 或 name'
  },
  {
    key: 'timestamp',
    name: '时间戳字段', 
    description: '时间戳字段（可选）',
    placeholder: '例: timestamp 或 time'
  }
]

// 计算属性
const jsonPlaceholder = computed(() => {
  if (dataSourceType.value === 'array') {
    return `输入包含数组的JSON数据，例如:
{
  "data": [
    {"x": 1, "y": 10, "label": "点1"},
    {"x": 2, "y": 20, "label": "点2"}
  ]
}`
  } else {
    return `输入包含对象结构的JSON数据，例如:
{
  "sensors": {
    "temperature": {"current": 25.5},
    "humidity": {"current": 60}
  }
}`
  }
})

const inputPreview = computed(() => {
  return parsedJson.value ? JSON.stringify(parsedJson.value, null, 2) : 'JSON数据无效'
})

const outputPreview = computed(() => {
  const result = processData()
  return JSON.stringify(result, null, 2)
})

// 数据处理函数
const processData = () => {
  if (!parsedJson.value) return null

  addDebugInfo('info', '开始数据处理...')

  if (dataSourceType.value === 'object') {
    return processObjectData()
  } else {
    return processArrayData()
  }
}

const processObjectData = () => {
  const result: Record<string, any> = {}
  
  Object.entries(objectMappingConfig.value).forEach(([key, path]) => {
    if (path.trim()) {
      result[key] = getValueByPath(parsedJson.value, path)
      addDebugInfo('info', `映射 ${key}: ${path} = ${result[key]}`)
    }
  })
  
  addDebugInfo('success', `对象数据处理完成，获得${Object.keys(result).length}个字段`)
  return result
}

const processArrayData = () => {
  let sourceArray = parsedJson.value
  
  // 如果指定了数组路径，提取对应数组
  if (arrayMappingConfig.value.arrayPath.trim()) {
    sourceArray = getValueByPath(parsedJson.value, arrayMappingConfig.value.arrayPath)
    addDebugInfo('info', `从路径提取数组: ${arrayMappingConfig.value.arrayPath}`)
  }
  
  if (!Array.isArray(sourceArray)) {
    addDebugInfo('error', '提取的数据不是数组格式')
    return []
  }
  
  addDebugInfo('info', `找到数组，长度: ${sourceArray.length}`)
  
  // 处理数组项
  const processedArray = sourceArray.map((item, index) => {
    if (typeof item === 'number') {
      // 纯数值数组
      return {
        x: index,
        y: item,
        label: `点${index + 1}`
      }
    } else if (typeof item === 'object' && item !== null) {
      // 对象数组，根据字段映射提取数据
      const mapped: any = {}
      
      Object.entries(arrayMappingConfig.value.fieldMapping).forEach(([targetField, sourceField]) => {
        if (sourceField && sourceField in item) {
          mapped[targetField] = item[sourceField]
        } else if (targetField === 'x' && arrayMappingConfig.value.autoGenerateIndex) {
          mapped[targetField] = index
        }
      })
      
      // 保留原始数据
      return { ...mapped, _original: item }
    } else {
      addDebugInfo('warning', `数组项${index}不是有效的数据格式`)
      return null
    }
  }).filter(item => item !== null)
  
  addDebugInfo('success', `数组数据处理完成，处理了${processedArray.length}个有效数据点`)
  return processedArray
}

// 工具函数
const getValueByPath = (obj: any, path: string): any => {
  if (!path || !obj) return undefined
  
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return undefined
    }
    current = current[key]
  }
  
  return current
}

const addDebugInfo = (type: DebugInfo['type'], message: string) => {
  debugInfo.value.push({
    type,
    message,
    timestamp: Date.now()
  })
  
  // 限制调试信息数量
  if (debugInfo.value.length > 20) {
    debugInfo.value = debugInfo.value.slice(-20)
  }
}

// 事件处理
const handleDataSourceTypeChange = () => {
  debugInfo.value = []
  addDebugInfo('info', `切换到${dataSourceType.value === 'array' ? '数组' : '对象'}数据模式`)
  loadExampleData()
}

const handleJsonChange = () => {
  try {
    parsedJson.value = jsonInput.value ? JSON.parse(jsonInput.value) : null
    updateOutput()
  } catch (error) {
    addDebugInfo('error', `JSON解析失败: ${error}`)
    parsedJson.value = null
  }
}

const handleMappingChange = () => {
  updateOutput()
}

const updateOutput = () => {
  debugInfo.value = [] // 清空之前的调试信息
  const result = processData()
  
  // 更新组件数据
  if (props.widget) {
    if (!props.widget.metadata) {
      props.widget.metadata = {}
    }
    props.widget.metadata.card2Data = result
    addDebugInfo('success', '组件数据已更新')
  }
  
  // 发送配置更新
  const dataSourceConfig = {
    type: 'static' as const,
    config: {
      data: parsedJson.value,
      mappings: dataSourceType.value === 'array' ? arrayMappingConfig.value : objectMappingConfig.value,
      output: result,
      dataSourceType: dataSourceType.value
    },
    refreshInterval: 0,
    enableCache: false,
    cacheTimeout: 0,
    retryAttempts: 0
  }
  
  emit('update:modelValue', dataSourceConfig)
  emit('validate', true)
}

const loadExampleData = () => {
  if (dataSourceType.value === 'array') {
    // 数组数据示例
    jsonInput.value = JSON.stringify({
      "timeSeries": {
        "sensor": "temperature_01", 
        "unit": "°C",
        "data": [
          { "timestamp": 1640995200000, "x": "09:00", "y": 22.5, "label": "早上" },
          { "timestamp": 1640998800000, "x": "10:00", "y": 24.8, "label": "上午" },
          { "timestamp": 1641002400000, "x": "11:00", "y": 26.2, "label": "上午" },
          { "timestamp": 1641006000000, "x": "12:00", "y": 28.5, "label": "中午" },
          { "timestamp": 1641009600000, "x": "13:00", "y": 30.1, "label": "下午" },
          { "timestamp": 1641013200000, "x": "14:00", "y": 31.8, "label": "下午" }
        ]
      }
    }, null, 2)
    
    arrayMappingConfig.value.arrayPath = 'timeSeries.data'
    arrayMappingConfig.value.fieldMapping = {
      x: 'x',
      y: 'y', 
      label: 'label',
      timestamp: 'timestamp'
    }
  } else {
    // 对象数据示例
    jsonInput.value = JSON.stringify({
      "sensors": {
        "temperature": {
          "current": 25.5,
          "unit": "°C",
          "status": "normal"
        },
        "humidity": {
          "current": 60,
          "unit": "%", 
          "status": "normal"
        }
      },
      "device": {
        "id": "sensor_001",
        "name": "环境监测传感器",
        "status": "online",
        "lastUpdate": "2024-01-01T12:00:00Z"
      },
      "statistics": {
        "uptime": 86400,
        "dataPoints": 1440,
        "errors": 0
      }
    }, null, 2)
  }
  
  handleJsonChange()
  addDebugInfo('success', '示例数据已加载')
}

const randomizeData = () => {
  if (dataSourceType.value === 'array') {
    // 生成随机数组数据
    const randomArray = Array.from({ length: 8 }, (_, index) => ({
      x: index,
      y: Math.round((Math.random() * 50 + 10) * 10) / 10,
      label: `随机点${index + 1}`,
      timestamp: Date.now() + index * 1000
    }))
    
    jsonInput.value = JSON.stringify({
      "randomData": {
        "generated": new Date().toISOString(),
        "points": randomArray
      }
    }, null, 2)
    
    arrayMappingConfig.value.arrayPath = 'randomData.points'
  } else {
    // 生成随机对象数据
    const randomData = {
      sensors: {
        temperature: {
          current: Math.round((Math.random() * 30 + 10) * 10) / 10
        },
        humidity: {
          current: Math.round((Math.random() * 40 + 30) * 10) / 10
        }
      },
      device: {
        status: ['online', 'offline', 'maintenance'][Math.floor(Math.random() * 3)]
      },
      statistics: {
        dataPoints: Math.floor(Math.random() * 2000 + 1000)
      }
    }
    
    jsonInput.value = JSON.stringify(randomData, null, 2)
  }
  
  handleJsonChange()
  addDebugInfo('success', '随机数据已生成')
}

const formatJson = () => {
  if (parsedJson.value) {
    jsonInput.value = JSON.stringify(parsedJson.value, null, 2)
    addDebugInfo('success', 'JSON格式化完成')
  }
}

// 组件初始化
onMounted(() => {
  addDebugInfo('info', '增强数据源配置表单已初始化')
  
  // 根据组件类型自动选择数据源类型
  if (props.widget?.type === 'array-chart-test') {
    dataSourceType.value = 'array'
    addDebugInfo('info', '检测到数组图表组件，自动切换到数组模式')
  }
  
  loadExampleData()
})
</script>

<style scoped>
.enhanced-data-source-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.section-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-color);
  margin-bottom: 8px;
}

.config-subtitle {
  font-weight: 500;
  font-size: 12px;
  color: var(--text-color-2);
  margin-bottom: 8px;
}

.json-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.json-actions {
  display: flex;
  gap: 8px;
}

.mapping-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mapping-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mapping-label {
  min-width: 60px;
  font-size: 12px;
  color: var(--text-color-2);
}

.array-path-config,
.array-fields-config {
  margin-bottom: 12px;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.config-label {
  min-width: 80px;
  font-size: 12px;
  color: var(--text-color-2);
}

.array-field-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.array-field-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.field-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color);
}

.field-desc {
  font-size: 11px;
  color: var(--text-color-2);
}

.preview-content {
  display: flex;
  gap: 16px;
}

.input-preview,
.output-preview {
  flex: 1;
}

.preview-title {
  font-size: 12px;
  color: var(--text-color-2);
  margin-bottom: 8px;
}

.debug-section {
  max-height: 200px;
  overflow-y: auto;
}

.debug-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.debug-item {
  display: flex;
  gap: 8px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.debug-type {
  font-weight: 600;
  min-width: 60px;
}

.debug-info { color: var(--info-color); }
.debug-success { color: var(--success-color); }
.debug-warning { color: var(--warning-color); }
.debug-error { color: var(--error-color); }

.debug-message {
  color: var(--text-color-2);
}
</style>