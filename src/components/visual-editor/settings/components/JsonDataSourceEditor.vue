<template>
  <div class="json-data-source-editor">
    <!-- 编辑器头部 -->
    <div class="editor-header">
      <div class="header-info">
        <n-icon size="16" class="header-icon">
          <DocumentTextOutline />
        </n-icon>
        <span class="header-title">JSON数据源编辑器</span>
        <n-tag v-if="parsedStructure?.type" :type="structureTagType" size="small">
          {{ structureTypeLabel }}
        </n-tag>
      </div>

      <n-space size="small">
        <n-button size="small" :disabled="!isValidJson" @click="formatJson">
          <template #icon>
            <n-icon><CodeOutline /></n-icon>
          </template>
          格式化
        </n-button>
        <n-button size="small" type="primary" ghost @click="loadSample">
          <template #icon>
            <n-icon><PlayOutline /></n-icon>
          </template>
          加载示例
        </n-button>
      </n-space>
    </div>

    <!-- JSON输入区域 -->
    <div class="json-input-section">
      <n-input
        ref="jsonInputRef"
        v-model:value="jsonText"
        type="textarea"
        :rows="12"
        placeholder="请输入JSON数据..."
        :status="jsonValidationStatus"
        class="json-textarea"
        @input="handleJsonInput"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
      />
    </div>

    <!-- 验证状态显示 -->
    <div class="validation-section">
      <div v-if="!isValidJson && jsonText.length > 0" class="validation-error">
        <n-alert type="error" :show-icon="false" size="small">
          <template #header>
            <n-space align="center" size="small">
              <n-icon size="14"><WarningOutline /></n-icon>
              <span>JSON格式错误</span>
            </n-space>
          </template>
          {{ jsonError }}
        </n-alert>
      </div>

      <div v-else-if="isValidJson && parsedStructure" class="validation-success">
        <n-alert type="success" :show-icon="false" size="small">
          <template #header>
            <n-space align="center" size="small">
              <n-icon size="14"><CheckmarkOutline /></n-icon>
              <span>JSON格式正确</span>
            </n-space>
          </template>
          检测到 {{ structureTypeLabel }}，包含 {{ fieldCount }} 个字段
        </n-alert>
      </div>
    </div>

    <!-- 数据结构预览 -->
    <div v-if="isValidJson && parsedStructure" class="structure-preview">
      <div class="preview-header">
        <h4 class="preview-title">
          <n-icon size="14"><LayersOutline /></n-icon>
          数据结构预览
        </h4>
        <n-text depth="3" class="preview-subtitle">自动分析的字段信息</n-text>
      </div>

      <div class="structure-content">
        <!-- 对象结构显示 -->
        <div v-if="parsedStructure.type === 'object'" class="object-structure">
          <div v-for="field in parsedStructure.fields" :key="field.name" class="field-item">
            <div class="field-header">
              <n-space align="center" size="small">
                <n-icon size="12" class="field-icon">
                  <EllipseOutline v-if="field.type === 'string'" />
                  <TriangleOutline v-else-if="field.type === 'number'" />
                  <SquareOutline v-else-if="field.type === 'boolean'" />
                  <CalendarOutline v-else-if="field.type === 'date'" />
                  <HelpOutline v-else />
                </n-icon>
                <span class="field-name">{{ field.name }}</span>
                <n-tag size="tiny" :type="getFieldTypeColor(field.type)">{{ field.type }}</n-tag>
              </n-space>
            </div>
            <div class="field-path">
              <n-text depth="3" class="path-text">路径: {{ field.path }}</n-text>
            </div>
            <div class="field-example">
              <n-text depth="3" class="example-text">示例: {{ formatFieldExample(field.example) }}</n-text>
            </div>
          </div>
        </div>

        <!-- 数组结构显示 -->
        <div v-else-if="parsedStructure.type === 'array'" class="array-structure">
          <div class="array-info">
            <n-space align="center" size="small" class="array-header">
              <n-icon size="14"><ListOutline /></n-icon>
              <span class="array-title">数组结构（{{ rawDataArray?.length || 0 }} 个元素）</span>
            </n-space>
          </div>

          <div v-if="parsedStructure.arrayElementStructure?.fields" class="array-element-structure">
            <h5 class="element-title">元素字段:</h5>
            <div v-for="field in parsedStructure.arrayElementStructure.fields" :key="field.name" class="field-item">
              <div class="field-header">
                <n-space align="center" size="small">
                  <n-icon size="12" class="field-icon">
                    <EllipseOutline v-if="field.type === 'string'" />
                    <TriangleOutline v-else-if="field.type === 'number'" />
                    <SquareOutline v-else-if="field.type === 'boolean'" />
                    <CalendarOutline v-else-if="field.type === 'date'" />
                    <HelpOutline v-else />
                  </n-icon>
                  <span class="field-name">{{ field.name }}</span>
                  <n-tag size="tiny" :type="getFieldTypeColor(field.type)">{{ field.type }}</n-tag>
                </n-space>
              </div>
              <div class="field-path">
                <n-text depth="3" class="path-text">数组路径: [0].{{ field.name }}</n-text>
              </div>
              <div class="field-example">
                <n-text depth="3" class="example-text">示例: {{ formatFieldExample(field.example) }}</n-text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 示例数据选择弹窗 -->
    <n-modal v-model:show="showSampleModal" title="选择示例数据">
      <n-card style="width: 600px" title="JSON数据示例" :bordered="false" size="small">
        <div class="sample-list">
          <div v-for="(sample, key) in sampleData" :key="key" class="sample-item">
            <div class="sample-header" @click="selectSample(key)">
              <div class="sample-info">
                <h4 class="sample-title">{{ sample.title }}</h4>
                <n-text depth="3" class="sample-description">{{ sample.description }}</n-text>
              </div>
              <n-tag :type="sample.type === 'object' ? 'info' : 'success'" size="small">
                {{ sample.type === 'object' ? '对象' : '数组' }}
              </n-tag>
            </div>
            <div class="sample-preview">
              <pre class="sample-code">{{ JSON.stringify(sample.data, null, 2) }}</pre>
            </div>
          </div>
        </div>

        <template #footer>
          <n-space justify="end">
            <n-button @click="showSampleModal = false">取消</n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * JSON数据源编辑器组件
 * 提供JSON数据输入、验证、格式化和结构分析功能
 */

import { ref, computed, watch, nextTick } from 'vue'
import { NInput, NButton, NIcon, NTag, NSpace, NAlert, NModal, NCard, NText } from 'naive-ui'
import {
  DocumentTextOutline,
  CodeOutline,
  PlayOutline,
  WarningOutline,
  CheckmarkOutline,
  LayersOutline,
  EllipseOutline,
  TriangleOutline,
  SquareOutline,
  CalendarOutline,
  HelpOutline,
  ListOutline
} from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'
import type { ParsedJsonStructure, ComponentFieldRequirement, FieldType } from '../../core/data-source-config-types'

// 组件属性定义
interface Props {
  /** JSON数据内容 */
  modelValue: string
  /** 占位符文本 */
  placeholder?: string
  /** 是否只读 */
  readonly?: boolean
  /** 最大行数 */
  maxRows?: number
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'structure-change', structure: ParsedJsonStructure | null): void
  (e: 'validation-change', isValid: boolean, error?: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  placeholder: '请输入JSON数据...',
  readonly: false,
  maxRows: 12
})

const emit = defineEmits<Emits>()

// 国际化
const { t } = useI18n()

// 组件状态
const jsonInputRef = ref()
const jsonText = ref(props.modelValue)
const jsonError = ref('')
const isValidJson = ref(false)
const parsedStructure = ref<ParsedJsonStructure | null>(null)
const showSampleModal = ref(false)
const isInputFocused = ref(false)

// 示例数据
const sampleData = {
  simpleObject: {
    title: '简单对象',
    description: '基础的JSON对象结构',
    type: 'object',
    data: {
      id: 'device_001',
      name: '温度传感器',
      value: 25.6,
      unit: '°C',
      status: 'online',
      lastUpdate: '2024-01-15T10:30:00Z'
    }
  },
  complexObject: {
    title: '复杂对象',
    description: '包含嵌套结构的JSON对象',
    type: 'object',
    data: {
      device: {
        id: 'sensor_002',
        name: '湿度传感器',
        type: 'humidity'
      },
      readings: {
        current: 68.5,
        average: 65.2,
        max: 72.1,
        min: 58.3
      },
      metadata: {
        location: '机房A区',
        installDate: '2023-12-01',
        calibrated: true
      }
    }
  },
  simpleArray: {
    title: '时间序列数组',
    description: '简单的时间序列数据数组',
    type: 'array',
    data: [
      { time: '2024-01-15T08:00:00Z', value: 23.5 },
      { time: '2024-01-15T09:00:00Z', value: 24.1 },
      { time: '2024-01-15T10:00:00Z', value: 25.6 },
      { time: '2024-01-15T11:00:00Z', value: 26.2 },
      { time: '2024-01-15T12:00:00Z', value: 27.8 }
    ]
  },
  complexArray: {
    title: '设备状态数组',
    description: '复杂的设备状态数据数组',
    type: 'array',
    data: [
      {
        id: 'device_001',
        name: '温度传感器1',
        value: 25.6,
        status: 'online',
        location: { building: 'A', floor: 1, room: '101' }
      },
      {
        id: 'device_002',
        name: '湿度传感器1',
        value: 68.2,
        status: 'offline',
        location: { building: 'A', floor: 1, room: '102' }
      },
      {
        id: 'device_003',
        name: '压力传感器1',
        value: 1013.25,
        status: 'online',
        location: { building: 'B', floor: 2, room: '201' }
      }
    ]
  }
}

// 计算属性
const jsonValidationStatus = computed(() => {
  if (jsonText.value.length === 0) return undefined
  return isValidJson.value ? 'success' : 'error'
})

const structureTagType = computed(() => {
  switch (parsedStructure.value?.type) {
    case 'object':
      return 'info'
    case 'array':
      return 'success'
    default:
      return 'default'
  }
})

const structureTypeLabel = computed(() => {
  switch (parsedStructure.value?.type) {
    case 'object':
      return 'JSON对象'
    case 'array':
      return 'JSON数组'
    case 'primitive':
      return '基本类型'
    default:
      return '未知'
  }
})

const fieldCount = computed(() => {
  if (!parsedStructure.value) return 0
  if (parsedStructure.value.type === 'object') {
    return parsedStructure.value.fields?.length || 0
  }
  if (parsedStructure.value.type === 'array') {
    return parsedStructure.value.arrayElementStructure?.fields?.length || 0
  }
  return 0
})

const rawDataArray = computed(() => {
  if (parsedStructure.value?.type === 'array') {
    return parsedStructure.value.rawData
  }
  return null
})

// JSON解析和验证
const parseAndValidateJson = (jsonString: string): void => {
  if (!jsonString.trim()) {
    isValidJson.value = false
    jsonError.value = ''
    parsedStructure.value = null
    emit('validation-change', false)
    emit('structure-change', null)
    return
  }

  try {
    const parsed = JSON.parse(jsonString)
    isValidJson.value = true
    jsonError.value = ''

    // 分析数据结构
    const structure = analyzeJsonStructure(parsed)
    parsedStructure.value = structure

    emit('validation-change', true)
    emit('structure-change', structure)
  } catch (error) {
    isValidJson.value = false
    jsonError.value = error instanceof Error ? error.message : '未知错误'
    parsedStructure.value = null
    emit('validation-change', false, jsonError.value)
    emit('structure-change', null)
  }
}

// 分析JSON结构
const analyzeJsonStructure = (data: any): ParsedJsonStructure => {
  if (Array.isArray(data)) {
    // 数组类型
    const structure: ParsedJsonStructure = {
      type: 'array',
      rawData: data,
      errors: []
    }

    // 分析数组元素结构（取第一个元素作为样本）
    if (data.length > 0) {
      const firstElement = data[0]
      if (typeof firstElement === 'object' && firstElement !== null) {
        structure.arrayElementStructure = analyzeJsonStructure(firstElement)
      }
    }

    return structure
  } else if (typeof data === 'object' && data !== null) {
    // 对象类型
    const fields = extractObjectFields(data)
    return {
      type: 'object',
      fields,
      rawData: data,
      errors: []
    }
  } else {
    // 基本类型
    return {
      type: 'primitive',
      rawData: data,
      errors: []
    }
  }
}

// 提取对象字段信息
const extractObjectFields = (obj: any, prefix: string = ''): ComponentFieldRequirement[] => {
  const fields: ComponentFieldRequirement[] = []

  Object.entries(obj).forEach(([key, value]) => {
    const fieldPath = prefix ? `${prefix}.${key}` : key
    const fieldType = getValueType(value)

    fields.push({
      name: key,
      type: fieldType,
      description: `字段 ${key}`,
      required: true, // 默认为必填
      example: value,
      path: fieldPath
    } as ComponentFieldRequirement & { path: string })
  })

  return fields
}

// 获取值的类型
const getValueType = (value: any): FieldType => {
  if (typeof value === 'string') {
    // 检查是否是日期字符串
    if (isDateString(value)) {
      return 'date'
    }
    return 'string'
  } else if (typeof value === 'number') {
    return 'number'
  } else if (typeof value === 'boolean') {
    return 'boolean'
  } else {
    return 'any'
  }
}

// 检查字符串是否是日期格式
const isDateString = (value: string): boolean => {
  // 简单的日期格式检查
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/, // ISO格式
    /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}/ // MM/DD/YYYY
  ]

  return datePatterns.some(pattern => pattern.test(value)) && !isNaN(Date.parse(value))
}

// 获取字段类型对应的颜色
const getFieldTypeColor = (type: FieldType) => {
  switch (type) {
    case 'string':
      return 'info'
    case 'number':
      return 'success'
    case 'boolean':
      return 'warning'
    case 'date':
      return 'error'
    default:
      return 'default'
  }
}

// 格式化字段示例值
const formatFieldExample = (value: any): string => {
  if (typeof value === 'string') {
    return `"${value}"`
  } else if (value === null) {
    return 'null'
  } else if (value === undefined) {
    return 'undefined'
  } else {
    return String(value)
  }
}

// 事件处理
const handleJsonInput = (value: string) => {
  jsonText.value = value
  emit('update:modelValue', value)
  parseAndValidateJson(value)
}

const handleInputFocus = () => {
  isInputFocused.value = true
}

const handleInputBlur = () => {
  isInputFocused.value = false
}

// 格式化JSON
const formatJson = () => {
  if (isValidJson.value) {
    try {
      const parsed = JSON.parse(jsonText.value)
      const formatted = JSON.stringify(parsed, null, 2)
      jsonText.value = formatted
      emit('update:modelValue', formatted)
    } catch (error) {
      console.error('格式化失败:', error)
    }
  }
}

// 加载示例数据
const loadSample = () => {
  showSampleModal.value = true
}

// 选择示例数据
const selectSample = (key: keyof typeof sampleData) => {
  const sample = sampleData[key]
  const jsonString = JSON.stringify(sample.data, null, 2)
  jsonText.value = jsonString
  emit('update:modelValue', jsonString)
  parseAndValidateJson(jsonString)
  showSampleModal.value = false
}

// 监听props变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue !== jsonText.value) {
      jsonText.value = newValue
      parseAndValidateJson(newValue)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.json-data-source-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--card-color);
  border-radius: 6px;
  padding: 16px;
  border: 1px solid var(--border-color);
}

/* === 头部样式 === */
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--divider-color);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: var(--primary-color);
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

/* === JSON输入区域 === */
.json-input-section {
  position: relative;
}

.json-textarea :deep(.n-input__textarea-el) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace !important;
  font-size: 12px;
  line-height: 1.5;
  resize: vertical;
  min-height: 200px;
}

/* === 验证状态区域 === */
.validation-section {
  margin: 0;
}

.validation-error {
  margin-bottom: 8px;
}

.validation-success {
  margin-bottom: 8px;
}

/* === 结构预览区域 === */
.structure-preview {
  padding: 12px;
  background: var(--hover-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.preview-subtitle {
  font-size: 11px;
}

.structure-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* === 字段项样式 === */
.field-item {
  padding: 8px;
  background: var(--card-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.field-header {
  margin-bottom: 4px;
}

.field-icon {
  color: var(--primary-color);
}

.field-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color);
  font-family: monospace;
}

.field-path,
.field-example {
  margin-top: 2px;
}

.path-text,
.example-text {
  font-size: 11px;
  font-family: monospace;
}

/* === 数组结构样式 === */
.array-structure {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.array-info {
  padding: 8px;
  background: var(--info-color-suppl);
  border-radius: 4px;
  border: 1px solid var(--info-color-suppl);
}

.array-header {
  color: var(--info-color);
}

.array-title {
  font-size: 12px;
  font-weight: 500;
}

.array-element-structure {
  padding-left: 12px;
  border-left: 2px solid var(--primary-color-suppl);
}

.element-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color-2);
  margin: 0 0 8px 0;
}

/* === 示例数据弹窗样式 === */
.sample-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 500px;
  overflow-y: auto;
}

.sample-item {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.sample-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--hover-color);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.sample-header:hover {
  background: var(--primary-color-suppl);
}

.sample-info {
  flex: 1;
}

.sample-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 4px 0;
}

.sample-description {
  font-size: 12px;
  line-height: 1.4;
}

.sample-preview {
  padding: 12px;
  background: var(--code-color);
  border-top: 1px solid var(--border-color);
}

.sample-code {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  line-height: 1.4;
  margin: 0;
  color: var(--text-color);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 150px;
  overflow-y: auto;
}

/* === 响应式设计 === */
@media (max-width: 480px) {
  .editor-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .json-textarea :deep(.n-input__textarea-el) {
    font-size: 11px;
  }

  .sample-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* === 主题适配 === */
[data-theme='dark'] .structure-preview {
  background: var(--hover-color-dark);
  border-color: var(--border-color-dark);
}

[data-theme='dark'] .field-item {
  background: var(--card-color-dark);
  border-color: var(--border-color-dark);
}
</style>
