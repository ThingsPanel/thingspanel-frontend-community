<template>
  <div class="simplified-mapping-config">
    <div class="config-header">
      <span class="config-title">数据路径映射</span>
      <div class="config-actions">
        <n-button
          size="small"
          type="primary"
          ghost
          :disabled="!data || localMappings.length === 0"
          @click="autoSuggestAll"
        >
          <template #icon>
            <i class="i-carbon-magic-wand" />
          </template>
          智能建议
        </n-button>
        <n-button size="small" type="info" ghost :disabled="!data" @click="showDataPreview = !showDataPreview">
          <template #icon>
            <i class="i-carbon-view" />
          </template>
          {{ showDataPreview ? '隐藏预览' : '数据预览' }}
        </n-button>
      </div>
    </div>

    <!-- 简化的映射配置 -->
    <div v-if="localMappings && localMappings.length > 0" class="mapping-list">
      <div v-for="(mapping, index) in localMappings" :key="index" class="mapping-item">
        <!-- 映射标题和状态 -->
        <div class="mapping-header">
          <span class="mapping-target">{{ mapping.target }}</span>
          <n-tag v-if="mapping.key && getMappingStatus(mapping).isValid" size="small" type="success">已映射</n-tag>
          <n-tag v-else-if="mapping.key && !getMappingStatus(mapping).isValid" size="small" type="error">
            路径错误
          </n-tag>
          <n-tag v-else size="small" type="warning">未配置</n-tag>
        </div>

        <!-- 路径输入 -->
        <div class="mapping-input">
          <n-input
            v-model:value="mapping.key"
            placeholder="输入数据路径，如: data[0].value 或 data.items[0].name"
            size="small"
            @input="onMappingChange(mapping)"
            @focus="showPathSuggestions(mapping, index)"
          >
            <template #prefix>
              <i class="i-carbon-diagram-reference" />
            </template>
            <template #suffix>
              <n-button text size="small" :disabled="!data" @click="suggestPathForMapping(mapping)">
                <i class="i-carbon-light-bulb" />
              </n-button>
            </template>
          </n-input>
        </div>

        <!-- 路径建议（展开式） -->
        <div v-if="showSuggestions[index]" class="path-suggestions">
          <div class="suggestions-header">
            <span class="suggestions-title">建议路径:</span>
            <n-button text size="tiny" @click="hideSuggestions(index)">
              <i class="i-carbon-close" />
            </n-button>
          </div>
          <div class="suggestions-list">
            <n-button
              v-for="suggestion in getPathSuggestions(mapping.target)"
              :key="suggestion.path"
              size="tiny"
              secondary
              class="suggestion-item"
              @click="applyPathSuggestion(mapping, suggestion.path)"
            >
              <div class="suggestion-content">
                <code class="suggestion-path">{{ suggestion.path || '根数据' }}</code>
                <span class="suggestion-type">{{ suggestion.type }}</span>
                <span v-if="suggestion.preview" class="suggestion-preview">
                  {{ suggestion.preview }}
                </span>
              </div>
            </n-button>
          </div>
        </div>

        <!-- 映射结果预览 -->
        <div v-if="mapping.key" class="mapping-result">
          <div class="result-info">
            <span class="result-label">映射结果:</span>
            <n-tag size="small" :type="getMappingStatus(mapping).isArray ? 'info' : 'default'">
              {{ getMappingStatus(mapping).type }}
              <span v-if="getMappingStatus(mapping).isArray">({{ getMappingStatus(mapping).arrayLength }}个元素)</span>
            </n-tag>
          </div>
          <div class="result-preview">
            <code class="result-value">
              {{ formatMappingResult(mapping) }}
            </code>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据预览（可折叠） -->
    <div v-if="showDataPreview && data" class="data-preview">
      <n-divider title-placement="left" size="small">
        <span class="preview-title">原始数据结构</span>
      </n-divider>

      <!-- 数组检测提示 -->
      <div v-if="detectedArrays.length > 0" class="array-detection">
        <n-alert type="info" size="small" style="margin-bottom: 8px">
          <template #default>
            <div class="detection-content">
              <span class="detection-title">检测到 {{ detectedArrays.length }} 个数组:</span>
              <div class="detected-arrays">
                <n-tag
                  v-for="arrayInfo in detectedArrays"
                  :key="arrayInfo.path"
                  size="small"
                  type="info"
                  class="array-tag"
                >
                  {{ arrayInfo.path || '根数据' }} ({{ arrayInfo.length }}个元素)
                </n-tag>
              </div>
            </div>
          </template>
        </n-alert>
      </div>

      <!-- JSON数据预览 -->
      <div class="json-preview">
        <pre class="json-content">{{ formatJsonData(data) }}</pre>
        <div v-if="isDataTruncated" class="truncation-notice">
          <n-text depth="3" size="small">... 数据过长已截断</n-text>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from 'vue'
import { NInput, NButton, NTag, NDivider, NAlert, NText } from 'naive-ui'
import type { DataPathMapping } from '../../types/data-source'
import { dataPathResolver } from '../../utils/data-path-resolver'

interface Props {
  data: any
  mappings: DataPathMapping[]
}

interface Emits {
  'update:mappings': [mappings: DataPathMapping[]]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态
const localMappings = ref<DataPathMapping[]>([])
const showDataPreview = ref(false)
const showSuggestions = reactive<Record<number, boolean>>({})

// 计算属性
const detectedArrays = computed(() => {
  const arrays: Array<{ path: string; length: number }> = []

  const detectArrays = (obj: any, currentPath: string) => {
    if (Array.isArray(obj)) {
      arrays.push({
        path: currentPath || '根数据',
        length: obj.length
      })
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        const newPath = currentPath ? `${currentPath}.${key}` : key
        detectArrays(obj[key], newPath)
      })
    }
  }

  if (props.data) {
    detectArrays(props.data, '')
  }

  return arrays
})

const isDataTruncated = computed(() => {
  if (!props.data) return false
  const jsonStr = JSON.stringify(props.data, null, 2)
  return jsonStr.length > 2000
})

// 方法
const formatJsonData = (data: any): string => {
  try {
    const jsonStr = JSON.stringify(data, null, 2)
    // 如果数据太长，截断显示
    if (jsonStr.length > 2000) {
      return jsonStr.substring(0, 2000) + '\n...'
    }
    return jsonStr
  } catch {
    return String(data)
  }
}

const getMappingStatus = (mapping: DataPathMapping) => {
  if (!mapping.key || !props.data) {
    return { isValid: false, type: 'unknown', isArray: false, arrayLength: 0 }
  }

  const typeInfo = dataPathResolver.detectDataType(props.data, mapping.key)
  const isValid = dataPathResolver.isValidPath(props.data, mapping.key)

  return {
    isValid,
    type: typeInfo.type,
    isArray: typeInfo.isArray,
    arrayLength: typeInfo.arrayLength || 0
  }
}

const formatMappingResult = (mapping: DataPathMapping): string => {
  if (!mapping.key || !props.data) return '未配置'

  try {
    const result = dataPathResolver.resolve(props.data, mapping.key)
    if (result === undefined) return '路径无效'

    const jsonStr = JSON.stringify(result)
    if (jsonStr.length > 100) {
      return jsonStr.substring(0, 100) + '...'
    }
    return jsonStr
  } catch {
    return '解析错误'
  }
}

const getPathSuggestions = (targetField: string) => {
  if (!props.data) return []

  const suggestions: Array<{ path: string; type: string; preview?: string }> = []

  // 获取所有可用路径（限制数量）
  const availablePaths = dataPathResolver.getAvailablePaths(props.data).slice(0, 20)

  // 智能建议
  const smartPath = dataPathResolver.suggestPath(props.data, targetField)
  if (smartPath && !availablePaths.includes(smartPath)) {
    availablePaths.unshift(smartPath)
  }

  availablePaths.forEach(path => {
    const typeInfo = dataPathResolver.detectDataType(props.data, path)
    let preview = ''

    try {
      const value = dataPathResolver.resolve(props.data, path)
      if (value !== undefined && value !== null) {
        const valueStr = JSON.stringify(value)
        preview = valueStr.length > 50 ? valueStr.substring(0, 50) + '...' : valueStr
      }
    } catch {
      // 忽略预览错误
    }

    suggestions.push({
      path,
      type: typeInfo.isArray ? `数组(${typeInfo.arrayLength})` : typeInfo.type,
      preview
    })
  })

  return suggestions
}

const showPathSuggestions = (mapping: DataPathMapping, index: number) => {
  showSuggestions[index] = true
}

const hideSuggestions = (index: number) => {
  showSuggestions[index] = false
}

const applyPathSuggestion = (mapping: DataPathMapping, path: string) => {
  mapping.key = path
  onMappingChange(mapping)

  // 隐藏建议
  const index = localMappings.value.indexOf(mapping)
  if (index !== -1) {
    hideSuggestions(index)
  }
}

const suggestPathForMapping = (mapping: DataPathMapping) => {
  if (!props.data) return

  const suggestedPath = dataPathResolver.suggestPath(props.data, mapping.target)
  if (suggestedPath) {
    mapping.key = suggestedPath
    onMappingChange(mapping)
  }
}

const autoSuggestAll = () => {
  if (!props.data) return

  localMappings.value.forEach(mapping => {
    if (!mapping.key) {
      const suggestedPath = dataPathResolver.suggestPath(props.data, mapping.target)
      if (suggestedPath) {
        mapping.key = suggestedPath
      }
    }
  })

  updateMappings()
}

const onMappingChange = (mapping: DataPathMapping) => {
  // 自动检测数组模式
  if (mapping.key && props.data) {
    const typeInfo = dataPathResolver.detectDataType(props.data, mapping.key)
    mapping.isArray = typeInfo.isArray

    if (typeInfo.isArray) {
      mapping.arrayMode = mapping.arrayMode || 'auto'
      mapping.arrayIndex = mapping.arrayIndex ?? 0
    }
  }

  updateMappings()
}

const updateMappings = () => {
  emit('update:mappings', [...localMappings.value])
}

// 监听外部变化
watch(
  () => props.mappings,
  newMappings => {
    localMappings.value = [...(newMappings || [])]
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.simplified-mapping-config {
  width: 100%;
  padding: 12px;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.config-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.config-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mapping-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mapping-item {
  background: white;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  padding: 12px;
  transition: all 0.2s ease;
}

.mapping-item:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.1);
}

.mapping-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.mapping-target {
  font-size: 13px;
  font-weight: 600;
  color: #495057;
}

.mapping-input {
  margin-bottom: 8px;
}

.path-suggestions {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e9ecef;
}

.suggestions-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.suggestions-title {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.suggestion-item {
  width: 100%;
  text-align: left;
  height: auto;
  padding: 6px 8px;
}

.suggestion-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
}

.suggestion-path {
  font-size: 11px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  color: #007bff;
  font-weight: 500;
}

.suggestion-type {
  font-size: 10px;
  color: #666;
  font-weight: 500;
}

.suggestion-preview {
  font-size: 10px;
  color: #999;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.mapping-result {
  background: #f1f3f4;
  border-radius: 4px;
  padding: 8px;
  border: 1px solid #dadce0;
}

.result-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.result-label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.result-preview {
  margin-top: 4px;
}

.result-value {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  color: #333;
  background: white;
  padding: 4px 6px;
  border-radius: 3px;
  border: 1px solid #dadce0;
  display: block;
  word-break: break-all;
}

.data-preview {
  margin-top: 20px;
}

.preview-title {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.array-detection {
  margin-bottom: 12px;
}

.detection-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detection-title {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.detected-arrays {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.array-tag {
  font-size: 11px;
}

.json-preview {
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.json-content {
  margin: 0;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  line-height: 1.4;
  color: #333;
  background: transparent;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.truncation-notice {
  padding: 8px 12px;
  background: #e9ecef;
  border-top: 1px solid #dadce0;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .config-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .config-actions {
    justify-content: center;
  }

  .mapping-header {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }

  .suggestion-content {
    font-size: 10px;
  }
}
</style>
