<template>
  <div class="data-field-mapping-input">
    <!-- 字段映射配置区域 -->
    <div class="field-mappings-section">
      <n-space vertical size="12">
        <!-- 组件需要的字段列表 -->
        <div v-if="validRequiredFields && validRequiredFields.length > 0" class="required-fields-section">
          <n-text strong style="font-size: 12px; color: var(--text-color-2)">组件需要的字段</n-text>
          <n-divider style="margin: 8px 0" />

          <n-form label-placement="left" label-width="120px" size="small">
            <n-form-item v-for="field in validRequiredFields" :key="field.targetField" :label="field.targetField">
              <template #label>
                <n-space align="center" size="4">
                  <span>{{ field.targetField }}</span>
                  <n-tag v-if="field.required" type="error" size="tiny">必需</n-tag>
                  <n-tag :type="getFieldTypeColor(field.type)" size="tiny">{{ field.type }}</n-tag>
                </n-space>
              </template>

              <n-space align="center" size="8" class="field-mapping-row">
                <!-- 源数据路径输入 -->
                <n-input
                  :value="getFieldSourcePath(field.targetField)"
                  placeholder="输入源数据路径 (如: $.data.name, items[0].value)"
                  style="flex: 1"
                  @update:value="value => updateFieldSourcePath(field.targetField, value)"
                />

                <!-- 预览值 -->
                <n-tag :type="getFieldPreviewType(field.targetField)" size="small" style="min-width: 80px">
                  {{ getFieldPreview(field.targetField) }}
                </n-tag>
              </n-space>

              <!-- 字段描述 -->
              <template v-if="field.description" #feedback>
                <n-text depth="3" style="font-size: 11px">{{ field.description }}</n-text>
              </template>
            </n-form-item>
          </n-form>
        </div>

        <!-- 自定义映射规则（可选） -->
        <div v-if="hasCustomMappings" class="custom-mappings-section">
          <n-text strong style="font-size: 12px; color: var(--text-color-2)">自定义字段映射</n-text>
          <n-divider style="margin: 8px 0" />

          <n-form label-placement="left" label-width="100px" size="small">
            <n-form-item
              v-for="(mapping, index) in customMappings"
              :key="index"
              :label="mapping.targetField || `自定义 ${index + 1}`"
            >
              <n-space align="center" size="8" class="mapping-row">
                <!-- 目标字段名 -->
                <n-input
                  v-model:value="mapping.targetField"
                  placeholder="自定义字段名"
                  style="width: 140px"
                  @input="handleMappingChange"
                />

                <!-- 映射箭头 -->
                <n-icon size="16" color="var(--text-color-3)">
                  <ArrowForwardOutline />
                </n-icon>

                <!-- 源字段路径 -->
                <n-input
                  v-model:value="mapping.sourcePath"
                  placeholder="源数据路径"
                  style="flex: 1"
                  @input="handleMappingChange"
                />

                <!-- 预览值 -->
                <n-tag :type="getMappingPreviewType(mapping.sourcePath)" size="small" style="min-width: 60px">
                  {{ getMappingPreview(mapping.sourcePath) }}
                </n-tag>

                <!-- 删除按钮 -->
                <n-button size="small" type="error" ghost circle @click="removeCustomMapping(index)">
                  <template #icon>
                    <n-icon>
                      <TrashOutline />
                    </n-icon>
                  </template>
                </n-button>
              </n-space>
            </n-form-item>
          </n-form>
        </div>

        <!-- 添加自定义映射按钮 -->
        <n-button type="primary" dashed size="small" block @click="addCustomMapping">
          <template #icon>
            <n-icon>
              <AddOutline />
            </n-icon>
          </template>
          添加自定义字段映射
        </n-button>

        <!-- 映射预览 -->
        <div v-if="hasValidPreviewData && showPreview" class="mapping-preview">
          <n-text strong style="font-size: 12px">映射结果预览</n-text>
          <n-divider style="margin: 6px 0" />

          <div class="preview-result">
            <n-space align="center" size="8">
              <n-tag :type="isValidMapping ? 'success' : 'warning'" size="small">
                {{ isValidMapping ? '映射有效' : '存在问题' }}
              </n-tag>

              <n-text depth="3" style="font-size: 12px">
                {{ Array.isArray(mappedResult) ? `数组 (${mappedResult.length}项)` : '对象' }}
              </n-text>
            </n-space>

            <n-code
              :code="JSON.stringify(mappedResult, null, 2)"
              language="json"
              :show-line-numbers="false"
              style="margin-top: 8px; max-height: 150px; overflow-y: auto; font-size: 11px"
            />
          </div>
        </div>

        <!-- 状态提示 -->
        <div v-if="statusMessage" class="status-message">
          <n-alert :type="statusType" size="small" :show-icon="false">
            {{ statusMessage }}
          </n-alert>
        </div>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据字段映射配置组件
 * 参考 SimpleDataMappingForm 的设计思想，简化实现
 * 核心功能：将原始数据字段映射为组件需要的字段
 */

import { ref, computed, watch } from 'vue'
import { NSpace, NForm, NFormItem, NInput, NButton, NIcon, NDivider, NTag, NCode, NText, NAlert } from 'naive-ui'
import { ArrowForwardOutline, TrashOutline, AddOutline } from '@vicons/ionicons5'

// 字段映射规则接口
interface FieldMappingRule {
  targetField: string // 目标字段名 (组件需要的字段)
  sourcePath: string // 源数据路径 (原始数据中的字段路径)
}

// 组件 Props
interface Props {
  modelValue?: FieldMappingRule[] // 字段映射规则数组
  previewData?: any // 预览数据，用于显示映射结果
  showPreview?: boolean // 是否显示预览
  requiredFields?: Array<{
    targetField: string // 组件需要的字段名
    type: 'value' | 'object' | 'array'
    required: boolean
    description?: string
  }> // 组件定义的必需字段列表
}

// 组件 Emits
interface Emits {
  (e: 'update:modelValue', value: FieldMappingRule[]): void
  (e: 'mapping-change', mappedData: any): void // 映射结果变化事件
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  showPreview: true,
  requiredFields: () => []
})

const emit = defineEmits<Emits>()

// 响应式状态
const statusMessage = ref<string>('')
const statusType = ref<'success' | 'warning' | 'error'>('success')

// 确保映射规则是数组
const currentMappings = computed(() => {
  return Array.isArray(props.modelValue) ? props.modelValue : []
})

// 验证和过滤必需字段
const validRequiredFields = computed(() => {
  if (!props.requiredFields || !Array.isArray(props.requiredFields)) return []

  return props.requiredFields.filter(
    field => field && typeof field === 'object' && field.targetField && typeof field.targetField === 'string'
  )
})

// 必需字段的映射（从组件定义来的）
const requiredFieldMappings = computed(() => {
  if (!validRequiredFields.value) return []

  return validRequiredFields.value.map(field => {
    const existingMapping = currentMappings.value.find(m => m.targetField === field.targetField)
    return {
      targetField: field.targetField,
      sourcePath: existingMapping?.sourcePath || '',
      required: field.required,
      type: field.type,
      description: field.description
    }
  })
})

// 自定义映射（用户额外添加的）
const customMappings = computed(() => {
  const requiredFieldNames = new Set(props.requiredFields?.map(f => f.targetField) || [])
  return currentMappings.value.filter(mapping => !requiredFieldNames.has(mapping.targetField))
})

// 是否有自定义映射
const hasCustomMappings = computed(() => {
  return customMappings.value.length > 0
})

// 检查是否有有效的预览数据
const hasValidPreviewData = computed(() => {
  return props.previewData && typeof props.previewData === 'object' && Object.keys(props.previewData).length > 0
})

/**
 * 简化的JSONPath解析器 (借鉴参考文件的实现)
 * 支持：$.name, user.name, [0].name, user.profile.name 等
 */
const evaluateJsonPath = (data: any, path: string): any => {
  if (!path || path === '$') return data

  try {
    // 处理简单的路径，如 $.name, [0].name, user.name 等
    let cleanPath = path.replace(/^\$\.?/, '').replace(/\[(\d+)\]/g, '.$1')
    if (cleanPath.startsWith('.')) cleanPath = cleanPath.slice(1)

    const keys = cleanPath.split('.')
    let current = data

    for (const key of keys) {
      if (key === '') continue
      if (current === null || current === undefined) return null

      if (/^\d+$/.test(key)) {
        const index = parseInt(key)
        current = Array.isArray(current) ? current[index] : current[key]
      } else {
        current = current[key]
      }

      if (current === undefined) return null
    }

    return current
  } catch {
    return null
  }
}

/**
 * 应用字段映射规则 (按照指导思想实现)
 * 核心逻辑：遍历映射规则，从原始数据中提取对应字段值
 */
const applyFieldMapping = (data: any, mappingRules: FieldMappingRule[]): any => {
  if (!data || !mappingRules || mappingRules.length === 0) {
    return data
  }

  // 处理数组数据：对数组中每个对象应用相同的映射规则
  if (Array.isArray(data)) {
    return data.map(item => applyFieldMapping(item, mappingRules))
  }

  // 处理对象数据：按映射规则生成新对象
  if (typeof data === 'object' && data !== null) {
    const result: Record<string, any> = {}

    mappingRules.forEach(rule => {
      if (rule.targetField && rule.sourcePath) {
        const value = evaluateJsonPath(data, rule.sourcePath)
        if (value !== null && value !== undefined) {
          result[rule.targetField] = value
        }
      }
    })

    return result
  }

  return data
}

// 获取单个映射路径的预览值
const getMappingPreview = (sourcePath: string): string => {
  if (!hasValidPreviewData.value) return '无数据'
  if (!sourcePath) return '未配置'

  try {
    const value = evaluateJsonPath(props.previewData, sourcePath)

    if (value === null || value === undefined) return '路径无效'

    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  } catch {
    return '解析错误'
  }
}

// 获取预览值的类型颜色
const getMappingPreviewType = (sourcePath: string): string => {
  const preview = getMappingPreview(sourcePath)
  if (preview === '无数据' || preview === '未配置') return 'default'
  if (preview === '路径无效' || preview === '解析错误') return 'error'
  return 'success'
}

// 计算最终映射结果
const mappedResult = computed(() => {
  if (!hasValidPreviewData.value || currentMappings.value.length === 0) {
    return null
  }

  try {
    return applyFieldMapping(props.previewData, currentMappings.value)
  } catch (error) {
    return { error: '映射处理失败' }
  }
})

// 检查映射有效性
const isValidMapping = computed(() => {
  if (currentMappings.value.length === 0) {
    return true // 无映射规则时认为是有效的
  }

  // 检查是否有空的字段配置
  const hasEmptyFields = currentMappings.value.some(rule => !rule.targetField?.trim() || !rule.sourcePath?.trim())

  // 检查是否有重复的目标字段
  const targetFields = currentMappings.value
    .filter(rule => rule.targetField?.trim())
    .map(rule => rule.targetField.trim())
  const hasDuplicateTargets = new Set(targetFields).size !== targetFields.length

  return !hasEmptyFields && !hasDuplicateTargets
})

// 获取字段的源路径
const getFieldSourcePath = (targetField: string): string => {
  const mapping = currentMappings.value.find(m => m.targetField === targetField)
  return mapping?.sourcePath || ''
}

// 更新字段的源路径
const updateFieldSourcePath = (targetField: string, sourcePath: string) => {
  const updatedMappings = [...currentMappings.value]
  const existingIndex = updatedMappings.findIndex(m => m.targetField === targetField)

  if (existingIndex >= 0) {
    // 更新现有映射
    updatedMappings[existingIndex] = { targetField, sourcePath }
  } else {
    // 添加新映射
    updatedMappings.push({ targetField, sourcePath })
  }

  emit('update:modelValue', updatedMappings)
  handleMappingChange()
}

// 获取字段预览值
const getFieldPreview = (targetField: string): string => {
  const sourcePath = getFieldSourcePath(targetField)
  if (!sourcePath) return '未配置'
  return getMappingPreview(sourcePath)
}

// 获取字段预览类型
const getFieldPreviewType = (targetField: string): string => {
  const sourcePath = getFieldSourcePath(targetField)
  if (!sourcePath) return 'default'
  return getMappingPreviewType(sourcePath)
}

// 获取字段类型颜色
const getFieldTypeColor = (type: string): string => {
  switch (type) {
    case 'value':
      return 'info'
    case 'object':
      return 'warning'
    case 'array':
      return 'success'
    default:
      return 'default'
  }
}

// 添加自定义映射规则
const addCustomMapping = () => {
  const newRule: FieldMappingRule = {
    targetField: '',
    sourcePath: ''
  }

  const updatedMappings = [...currentMappings.value, newRule]
  emit('update:modelValue', updatedMappings)

  statusMessage.value = '已添加自定义映射规则'
  statusType.value = 'success'
  setTimeout(() => {
    statusMessage.value = ''
  }, 2000)
}

// 删除自定义映射规则
const removeCustomMapping = (index: number) => {
  const customMappingsArray = customMappings.value
  const mappingToRemove = customMappingsArray[index]

  if (mappingToRemove) {
    const updatedMappings = currentMappings.value.filter(
      m => !(m.targetField === mappingToRemove.targetField && m.sourcePath === mappingToRemove.sourcePath)
    )
    emit('update:modelValue', updatedMappings)

    statusMessage.value = '已删除自定义映射规则'
    statusType.value = 'success'
    setTimeout(() => {
      statusMessage.value = ''
    }, 2000)
  }
}

// 删除映射规则
const removeMappingRule = (index: number) => {
  const updatedMappings = currentMappings.value.filter((_, i) => i !== index)
  emit('update:modelValue', updatedMappings)

  statusMessage.value = '已删除映射规则'
  statusType.value = 'success'
  setTimeout(() => {
    statusMessage.value = ''
  }, 2000)
}

// 处理映射变化
const handleMappingChange = () => {
  // 延迟更新，确保输入完成
  setTimeout(() => {
    if (mappedResult.value !== null) {
      emit('mapping-change', mappedResult.value)
    }
  }, 100)
}

// 监听映射规则变化
watch(
  currentMappings,
  () => {
    handleMappingChange()
  },
  { deep: true }
)

// 监听预览数据变化
watch(
  () => props.previewData,
  () => {
    handleMappingChange()
  },
  { deep: true }
)
</script>

<style scoped>
.data-field-mapping-input {
  width: 100%;
}

.mapping-list {
  width: 100%;
}

.mapping-item {
  width: 100%;
}

.mapping-item :deep(.n-card) {
  border: 1px solid var(--border-color);
  border-radius: 6px;
}

.field-input {
  flex: 1;
  min-width: 0;
}

.field-input :deep(.n-form-item) {
  margin-bottom: 0;
}

.field-input :deep(.n-form-item-label) {
  font-size: 12px;
  color: var(--text-color-3);
  padding-bottom: 4px;
}

.arrow-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 8px;
  margin-top: 18px; /* 对齐到输入框位置 */
}

.add-mapping {
  margin-top: 8px;
}

.empty-state {
  padding: 20px 0;
}

.preview-section {
  margin-top: 16px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-section {
  width: 100%;
}

.section-title {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-message {
  margin-top: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mapping-item :deep(.n-space) {
    flex-direction: column;
    align-items: stretch;
  }

  .arrow-icon {
    margin: 8px 0;
    transform: rotate(90deg);
  }

  .field-input {
    width: 100%;
  }
}
</style>
