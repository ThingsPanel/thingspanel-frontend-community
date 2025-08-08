<template>
  <div class="simple-data-source-selector">
    <div class="config-header">
      <span>数据源测试配置</span>
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
          <n-button size="small" @click="loadExampleData">加载示例</n-button>
          <n-button size="small" type="primary" @click="randomizeData">随机更新</n-button>
          <n-button size="small" @click="formatJson">格式化</n-button>
        </div>
      </div>
    </div>

    <!-- 路径映射配置 -->
    <div class="mapping-section">
      <div class="section-title">路径映射配置</div>
      <div class="mapping-list">
        <div class="mapping-item">
          <span class="mapping-label">Key1:</span>
          <n-input
            v-model:value="mappingConfig.key1"
            placeholder="例: sensors.temperature.current"
            size="small"
            @update:value="handleMappingChange"
          />
        </div>
        <div class="mapping-item">
          <span class="mapping-label">Key2:</span>
          <n-input
            v-model:value="mappingConfig.key2"
            placeholder="例: device.status"
            size="small"
            @update:value="handleMappingChange"
          />
        </div>
        <div class="mapping-item">
          <span class="mapping-label">Key3:</span>
          <n-input
            v-model:value="mappingConfig.key3"
            placeholder="例: statistics.dataPoints"
            size="small"
            @update:value="handleMappingChange"
          />
        </div>
      </div>
    </div>

    <!-- 数据预览 -->
    <div class="preview-section">
      <div class="section-title">数据预览</div>
      <div class="preview-content">
        <div class="preview-item">
          <span class="preview-label">Key1:</span>
          <span class="preview-value">{{ resolveValue('key1') }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">Key2:</span>
          <span class="preview-value">{{ resolveValue('key2') }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">Key3:</span>
          <span class="preview-value">{{ resolveValue('key3') }}</span>
        </div>
      </div>
    </div>

    <!-- 原始JSON预览 -->
    <div class="raw-json-section">
      <div class="section-title">原始JSON</div>
      <pre class="json-preview">{{ formattedJson }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NInput, NButton, useMessage } from 'naive-ui'

interface Props {
  modelValue?: any
  componentDataSources?: any[]
}

interface Emits {
  'update:modelValue': [value: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const message = useMessage()

// 状态数据
const jsonInput = ref('')
const mappingConfig = ref({
  key1: 'sensors.temperature.current',
  key2: 'device.status',
  key3: 'statistics.dataPoints'
})

// 解析后的JSON对象
const parsedJson = ref<any>({})

// 格式化显示的JSON
const formattedJson = computed(() => {
  try {
    return JSON.stringify(parsedJson.value, null, 2)
  } catch {
    return '无效的JSON数据'
  }
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
  updateOutput()
}

// 更新输出数据
const updateOutput = () => {
  if (!parsedJson.value) return

  const result = {
    key1: getValueByPath(parsedJson.value, mappingConfig.value.key1),
    key2: getValueByPath(parsedJson.value, mappingConfig.value.key2),
    key3: getValueByPath(parsedJson.value, mappingConfig.value.key3)
  }

  emit('update:modelValue', result)
  console.log('🔧 SimpleDataSourceSelector - 输出数据:', result)
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
    message.success('数据已随机更新')
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

// 初始化
onMounted(() => {
  loadExampleData()
})
</script>

<style scoped>
.simple-data-source-selector {
  padding: 16px;
  max-width: 100%;
}

.config-header {
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
  gap: 8px;
  margin-top: 8px;
  justify-content: flex-end;
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
  align-items: center;
  gap: 8px;
}

.mapping-label {
  min-width: 50px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color-2);
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

.raw-json-section {
  margin-bottom: 20px;
}

.json-preview {
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
  font-size: 11px;
  font-family: 'Courier New', monospace;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
}
</style>
