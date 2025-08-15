<template>
  <div class="data-field-mapping-input">
    <!-- 字段映射配置区域 -->
    <n-space vertical :size="12">
      <!-- 映射规则列表 -->
      <div v-if="modelValue && modelValue.length > 0" class="mapping-list">
        <n-space vertical :size="8">
          <div 
            v-for="(mapping, index) in modelValue" 
            :key="index" 
            class="mapping-item"
          >
            <n-card size="small" embedded>
              <n-space align="center" :size="12">
                <!-- 目标字段名 -->
                <div class="field-input">
                  <n-form-item label="目标字段" size="small" :show-feedback="false">
                    <n-input
                      v-model:value="mapping.targetField"
                      placeholder="组件需要的字段名"
                      size="small"
                      @input="handleMappingChange"
                    />
                  </n-form-item>
                </div>

                <!-- 箭头 -->
                <div class="arrow-icon">
                  <n-icon size="16" color="var(--text-color-3)">
                    <ArrowForwardOutline />
                  </n-icon>
                </div>

                <!-- 源字段路径 -->
                <div class="field-input">
                  <n-form-item label="源字段路径" size="small" :show-feedback="false">
                    <n-input
                      v-model:value="mapping.sourcePath"
                      placeholder="原始数据字段名或路径 (如: name, user.name)"
                      size="small"
                      @input="handleMappingChange"
                    />
                  </n-form-item>
                </div>

                <!-- 删除按钮 -->
                <n-button
                  size="small"
                  type="error"
                  ghost
                  circle
                  @click="removeMappingRule(index)"
                >
                  <template #icon>
                    <n-icon>
                      <TrashOutline />
                    </n-icon>
                  </template>
                </n-button>
              </n-space>
            </n-card>
          </div>
        </n-space>
      </div>

      <!-- 空状态提示 -->
      <n-empty 
        v-else
        size="small" 
        description="暂无字段映射规则"
        class="empty-state"
      >
        <template #extra>
          <n-button size="small" @click="addMappingRule">
            添加映射规则
          </n-button>
        </template>
      </n-empty>

      <!-- 添加映射按钮 -->
      <div v-if="modelValue && modelValue.length > 0" class="add-mapping">
        <n-button 
          type="primary" 
          dashed 
          size="small" 
          block
          @click="addMappingRule"
        >
          <template #icon>
            <n-icon>
              <AddOutline />
            </n-icon>
          </template>
          添加字段映射
        </n-button>
      </div>

      <!-- 预览结果 -->
      <div v-if="previewData && showPreview" class="preview-section">
        <n-divider>映射预览</n-divider>
        <n-card size="small" title="映射结果">
          <template #header-extra>
            <n-tag 
              :type="isValidMapping ? 'success' : 'warning'" 
              size="small"
            >
              {{ isValidMapping ? '映射有效' : '存在问题' }}
            </n-tag>
          </template>
          
          <div class="preview-content">
            <!-- 原始数据 -->
            <div class="data-section">
              <n-text depth="3" class="section-title">原始数据:</n-text>
              <n-code 
                :code="JSON.stringify(previewData, null, 2)" 
                language="json"
                :show-line-numbers="false"
                style="max-height: 120px; overflow-y: auto;"
              />
            </div>
            
            <!-- 映射结果 -->
            <div class="data-section">
              <n-text depth="3" class="section-title">映射结果:</n-text>
              <n-code 
                :code="JSON.stringify(mappedResult, null, 2)" 
                language="json"
                :show-line-numbers="false"
                style="max-height: 120px; overflow-y: auto;"
              />
            </div>
          </div>
        </n-card>
      </div>

      <!-- 状态显示 -->
      <div v-if="statusMessage" class="status-message">
        <n-alert 
          :type="statusType" 
          size="small"
          :show-icon="false"
        >
          {{ statusMessage }}
        </n-alert>
      </div>
    </n-space>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据字段映射配置组件
 * 用于配置数据字段映射规则，将原始数据字段映射为组件需要的字段
 * 支持：
 * 1. 简单字段映射 (name -> title)
 * 2. 嵌套路径映射 (user.name -> title)  
 * 3. 数组数据批量映射
 * 4. 实时预览映射结果
 */

import { ref, computed, watch } from 'vue'
import {
  NSpace,
  NCard,
  NFormItem,
  NInput,
  NButton,
  NIcon,
  NEmpty,
  NDivider,
  NTag,
  NCode,
  NText,
  NAlert
} from 'naive-ui'
import { 
  ArrowForwardOutline,
  TrashOutline,
  AddOutline
} from '@vicons/ionicons5'

// 字段映射规则接口
interface FieldMappingRule {
  targetField: string // 目标字段名 (组件需要的字段)
  sourcePath: string  // 源数据路径 (原始数据中的字段路径)
}

// 组件 Props
interface Props {
  modelValue: FieldMappingRule[] // 字段映射规则数组
  previewData?: any // 预览数据，用于显示映射结果
  showPreview?: boolean // 是否显示预览
}

// 组件 Emits
interface Emits {
  (e: 'update:modelValue', value: FieldMappingRule[]): void
  (e: 'mapping-change', mappedData: any): void // 映射结果变化事件
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  showPreview: true
})

const emit = defineEmits<Emits>()

// 响应式状态
const statusMessage = ref<string>('')
const statusType = ref<'success' | 'warning' | 'error'>('success')

/**
 * 从对象中根据路径获取值
 * 支持嵌套路径，如 'user.profile.name'
 */
const getValueByPath = (obj: any, path: string): any => {
  if (!obj || !path) return undefined
  
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined
    }
    current = current[key]
  }
  
  return current
}

/**
 * 应用字段映射规则
 * 将原始数据转换为目标字段结构
 */
const applyFieldMapping = (data: any, mappingRules: FieldMappingRule[]): any => {
  if (!data || !mappingRules || mappingRules.length === 0) {
    return data
  }

  // 处理数组数据
  if (Array.isArray(data)) {
    return data.map(item => applyFieldMapping(item, mappingRules))
  }

  // 处理对象数据
  if (typeof data === 'object' && data !== null) {
    const result: Record<string, any> = {}
    
    // 应用映射规则
    mappingRules.forEach(rule => {
      if (rule.targetField && rule.sourcePath) {
        const value = getValueByPath(data, rule.sourcePath)
        if (value !== undefined) {
          result[rule.targetField] = value
        }
      }
    })
    
    return result
  }

  return data
}

// 计算映射结果
const mappedResult = computed(() => {
  if (!props.previewData || !props.modelValue) {
    return null
  }
  
  try {
    return applyFieldMapping(props.previewData, props.modelValue)
  } catch (error) {
    console.error('映射处理错误:', error)
    return { error: '映射处理失败' }
  }
})

// 检查映射有效性
const isValidMapping = computed(() => {
  if (!props.modelValue || props.modelValue.length === 0) {
    return true // 无映射规则时认为是有效的
  }
  
  // 检查是否有空的字段配置
  const hasEmptyFields = props.modelValue.some(rule => 
    !rule.targetField?.trim() || !rule.sourcePath?.trim()
  )
  
  // 检查是否有重复的目标字段
  const targetFields = props.modelValue
    .filter(rule => rule.targetField?.trim())
    .map(rule => rule.targetField.trim())
  const hasDuplicateTargets = new Set(targetFields).size !== targetFields.length
  
  return !hasEmptyFields && !hasDuplicateTargets
})

// 添加映射规则
const addMappingRule = () => {
  const newRule: FieldMappingRule = {
    targetField: '',
    sourcePath: ''
  }
  
  const updatedMappings = [...(props.modelValue || []), newRule]
  emit('update:modelValue', updatedMappings)
  
  statusMessage.value = '已添加新的映射规则'
  statusType.value = 'success'
  setTimeout(() => {
    statusMessage.value = ''
  }, 2000)
}

// 删除映射规则
const removeMappingRule = (index: number) => {
  const updatedMappings = props.modelValue.filter((_, i) => i !== index)
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
  () => props.modelValue,
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