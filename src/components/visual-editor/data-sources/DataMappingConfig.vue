<template>
  <div class="data-mapping-config">
    <div class="config-header">
      <span class="config-title">数据映射</span>
      <div class="config-actions">
        <n-button size="small" type="primary" ghost :disabled="availableFields.length === 0" @click="autoMapFields">
          自动映射
        </n-button>
        <n-button
          size="small"
          type="info"
          ghost
          :disabled="!data || Object.keys(data).length === 0"
          @click="suggestPaths"
        >
          智能建议
        </n-button>
      </div>
    </div>

    <!-- 全局配置 -->
    <div class="global-config">
      <n-space align="center" size="small">
        <span class="config-label">默认数组模式:</span>
        <n-select
          v-model:value="defaultArrayMode"
          :options="arrayModeOptions"
          size="small"
          style="width: 120px"
          @update:value="updateGlobalConfig"
        />
        <span class="config-label">默认索引:</span>
        <n-input-number
          v-model:value="defaultArrayIndex"
          size="small"
          :min="0"
          style="width: 80px"
          @update:value="updateGlobalConfig"
        />
        <n-switch v-model:value="enableAutoDetection" size="small">
          <template #checked>自动检测</template>
          <template #unchecked>手动配置</template>
        </n-switch>
      </n-space>
    </div>

    <!-- 数组模式说明 -->
    <n-alert v-if="hasArrayData" type="info" size="small" style="margin-bottom: 12px">
      <template #default>
        <p>
          <strong>检测到数组数据</strong>
          ：请选择数组处理模式
        </p>
        <p>
          <strong>自动模式</strong>
          ：系统自动使用默认索引处理数组
        </p>
        <p>
          <strong>手动模式</strong>
          ：用户手动指定数组索引
        </p>
        <p>
          <strong>不处理</strong>
          ：保持数组原样，不进行索引处理
        </p>
      </template>
    </n-alert>

    <div v-if="localMappings && localMappings.length > 0" class="mapping-list">
      <div v-for="(mapping, index) in localMappings" :key="index" class="mapping-item">
        <div class="mapping-row">
          <span class="mapping-label">{{ mapping.target }}</span>
          <n-select
            v-model:value="mapping.key"
            :options="fieldOptions"
            placeholder="选择JSON路径或手动输入"
            size="small"
            filterable
            clearable
            @update:value="updateMappings"
          />
        </div>

        <!-- 数据类型信息和数组配置 -->
        <div v-if="mapping.key" class="mapping-info">
          <div class="type-info">
            <n-text depth="3" size="small">
              <span v-if="getDataTypeInfo(mapping.key).isArray">
                类型:
                <n-tag size="small" type="info">数组 ({{ getDataTypeInfo(mapping.key).arrayLength }}个元素)</n-tag>
                <span v-if="getDataTypeInfo(mapping.key).sampleValue">
                  • 示例:
                  <code>{{ JSON.stringify(getDataTypeInfo(mapping.key).sampleValue) }}</code>
                </span>
              </span>
              <span v-else>
                类型:
                <n-tag size="small" type="success">{{ getDataTypeInfo(mapping.key).type }}</n-tag>
                <span v-if="getDataTypeInfo(mapping.key).sampleValue !== undefined">
                  • 值:
                  <code>{{ JSON.stringify(getDataTypeInfo(mapping.key).sampleValue) }}</code>
                </span>
              </span>
            </n-text>
          </div>

          <!-- 数组处理配置 -->
          <div v-if="getDataTypeInfo(mapping.key).isArray" class="array-config">
            <n-space align="center" size="small">
              <span class="config-label">处理模式:</span>
              <n-select
                v-model:value="mapping.arrayMode"
                :options="arrayModeOptions"
                size="small"
                style="width: 100px"
                @update:value="updateMappings"
              />
              <span v-if="mapping.arrayMode === 'manual'" class="config-label">索引:</span>
              <n-input-number
                v-if="mapping.arrayMode === 'manual'"
                v-model:value="mapping.arrayIndex"
                size="small"
                :min="0"
                :max="getDataTypeInfo(mapping.key).arrayLength - 1"
                style="width: 60px"
                @update:value="updateMappings"
              />
            </n-space>
          </div>
        </div>

        <!-- 手动路径输入 -->
        <div class="mapping-manual">
          <n-input
            v-model:value="mapping.key"
            placeholder="或手动输入路径，如: data.items[0].value"
            size="small"
            @update:value="updateMappings"
          />
        </div>
      </div>
    </div>

    <!-- 数据预览 -->
    <div v-if="data && Object.keys(data).length > 0" class="data-preview">
      <n-divider title-placement="left" size="small">数据预览</n-divider>
      <div class="preview-content">
        <n-text depth="3" size="small">原始数据:</n-text>
        <pre class="data-json">{{ formatData(data) }}</pre>

        <n-text v-if="hasArrayData" depth="3" size="small">检测到的数组数据:</n-text>
        <div v-if="hasArrayData" class="array-preview">
          <div v-for="(arrayInfo, index) in arrayDataInfo" :key="index" class="array-item">
            <n-text depth="3" size="small">
              路径:
              <code>{{ arrayInfo.path }}</code>
              ({{ arrayInfo.length }}个元素)
            </n-text>
            <pre class="data-json">{{ formatData(arrayInfo.sample) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NSelect, NButton, NAlert, NDivider, NText, NTag, NInput, NInputNumber, NSwitch, NSpace } from 'naive-ui'
import type { DataPathMapping } from '../../types/data-source'
import { dataPathResolver } from '../utils/data-path-resolver'

interface Props {
  data: any // 数据源数据
  mappings: DataPathMapping[] // 现有映射配置
  componentFields?: ComponentField[] // 组件数据源定义
}

interface Emits {
  'update:mappings': [mappings: DataPathMapping[]]
}

interface ComponentField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description: string
  defaultValue: any
}

interface DataField {
  path: string
  value: any
  type: string
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localMappings = ref<DataPathMapping[]>([])

// 全局配置
const defaultArrayMode = ref<'auto' | 'manual' | 'none'>('auto')
const defaultArrayIndex = ref(0)
const enableAutoDetection = ref(true)

// 数组模式选项
const arrayModeOptions = [
  { label: '自动', value: 'auto' },
  { label: '手动', value: 'manual' },
  { label: '不处理', value: 'none' }
]

// 计算属性
const availableFields = computed(() => {
  return extractFields(props.data)
})

const fieldOptions = computed(() => {
  return availableFields.value.map(field => ({
    label: `${field.path} (${field.type})`,
    value: field.path
  }))
})

const hasArrayData = computed(() => {
  return arrayDataInfo.value.length > 0
})

const arrayDataInfo = computed(() => {
  const info: Array<{ path: string; length: number; sample: any }> = []

  const collectArrayInfo = (obj: any, currentPath: string) => {
    if (Array.isArray(obj)) {
      info.push({
        path: currentPath || '根数据',
        length: obj.length,
        sample: obj.length > 0 ? obj[0] : null
      })
    } else if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        const newPath = currentPath ? `${currentPath}.${key}` : key
        collectArrayInfo(obj[key], newPath)
      })
    }
  }

  collectArrayInfo(props.data, '')
  return info
})

// 方法
const formatData = (data: any): string => {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

const getDataTypeInfo = (path: string) => {
  return dataPathResolver.detectDataType(props.data, path)
}

const extractFields = (obj: any, prefix = ''): DataField[] => {
  const fields: DataField[] = []

  if (obj === null || obj === undefined) {
    return fields
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const path = prefix ? `${prefix}[${index}]` : `[${index}]`
      if (typeof item === 'object' && item !== null) {
        fields.push(...extractFields(item, path))
      } else {
        fields.push({
          path,
          value: item,
          type: typeof item
        })
      }
    })
  } else if (typeof obj === 'object') {
    Object.keys(obj).forEach(key => {
      const path = prefix ? `${prefix}.${key}` : key
      const value = obj[key]

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        fields.push(...extractFields(value, path))
      } else {
        fields.push({
          path,
          value,
          type: Array.isArray(value) ? 'array' : typeof value
        })
      }
    })
  } else {
    fields.push({
      path: prefix || 'value',
      value: obj,
      type: typeof obj
    })
  }

  return fields
}

const autoMapFields = () => {
  // 智能映射逻辑：根据字段名称自动匹配
  localMappings.value.forEach(mapping => {
    if (!mapping.key) {
      const suggestedPath = dataPathResolver.suggestPath(props.data, mapping.target)
      if (suggestedPath) {
        mapping.key = suggestedPath
        // 自动设置数组处理模式
        const dataTypeInfo = dataPathResolver.detectDataType(props.data, suggestedPath)
        if (dataTypeInfo.isArray) {
          mapping.isArray = true
          mapping.arrayMode = defaultArrayMode.value
          mapping.arrayIndex = defaultArrayIndex.value
        }
      }
    }
  })

  updateMappings()
}

const suggestPaths = () => {
  // 为所有未配置的映射提供智能建议
  localMappings.value.forEach(mapping => {
    if (!mapping.key) {
      const suggestedPath = dataPathResolver.suggestPath(props.data, mapping.target)
      if (suggestedPath) {
        mapping.key = suggestedPath
        // 自动设置数组处理模式
        const dataTypeInfo = dataPathResolver.detectDataType(props.data, suggestedPath)
        if (dataTypeInfo.isArray) {
          mapping.isArray = true
          mapping.arrayMode = defaultArrayMode.value
          mapping.arrayIndex = defaultArrayIndex.value
        }
      }
    }
  })

  updateMappings()
}

const updateGlobalConfig = () => {
  // 更新全局配置时，同步更新所有使用默认模式的映射
  localMappings.value.forEach(mapping => {
    if (mapping.arrayMode === 'auto' || !mapping.arrayMode) {
      mapping.arrayMode = defaultArrayMode.value
      mapping.arrayIndex = defaultArrayIndex.value
    }
  })

  updateMappings()
}

const updateMappings = () => {
  // 自动检测每个映射的数据类型
  const processedMappings = localMappings.value.map(mapping => {
    if (mapping.key) {
      const dataTypeInfo = dataPathResolver.detectDataType(props.data, mapping.key)
      return {
        ...mapping,
        isArray: dataTypeInfo.isArray,
        arrayMode: mapping.arrayMode || defaultArrayMode.value,
        arrayIndex: mapping.arrayIndex ?? defaultArrayIndex.value
      }
    }
    return mapping
  })

  emit('update:mappings', processedMappings)
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
.data-mapping-config {
  width: 100%;
  padding: 8px;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
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

.global-config {
  margin-bottom: 12px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.config-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.mapping-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mapping-item {
  background: white;
  border-radius: 4px;
  border: 1px solid #e9ecef;
  padding: 8px;
}

.mapping-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.mapping-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  min-width: 60px;
  flex-shrink: 0;
}

.mapping-row .n-select {
  flex: 1;
}

.mapping-info {
  margin-bottom: 4px;
  padding-left: 68px;
}

.type-info {
  margin-bottom: 4px;
}

.array-config {
  margin-top: 4px;
  padding: 4px 0;
  border-top: 1px solid #f0f0f0;
}

.mapping-manual {
  padding-left: 68px;
}

.data-preview {
  margin-top: 16px;
}

.preview-content {
  margin-top: 8px;
}

.data-json {
  margin: 4px 0 0 0;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 11px;
  max-height: 150px;
  overflow-y: auto;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.array-preview {
  margin-top: 8px;
}

.array-item {
  margin-bottom: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 4px;
}

.array-item .data-json {
  margin-top: 4px;
  max-height: 100px;
}

code {
  background: #f0f0f0;
  padding: 1px 4px;
  border-radius: 2px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
}
</style>
