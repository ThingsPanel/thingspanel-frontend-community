<!--
  对象数据配置组件
  提供对象数据的字段选择和配置
-->
<template>
  <div class="object-data-config">
    <div class="config-header">
      <n-text class="config-title">对象字段配置</n-text>
      <n-text depth="3" class="config-description">
        选择需要展示的对象字段，适用于统计数据、指标卡片等场景
      </n-text>
    </div>
    
    <div class="config-content">
      <!-- 字段选择器 -->
      <div class="field-selector">
        <div class="selector-header">
          <n-text class="selector-title">选择展示字段</n-text>
          <div class="selector-actions">
            <n-button size="small" type="primary" ghost @click="selectAllFields">
              全选
            </n-button>
            <n-button size="small" @click="selectNumericFields">
              仅数值
            </n-button>
            <n-button size="small" @click="clearSelection">
              清空
            </n-button>
          </div>
        </div>
        
        <div class="field-list">
          <div 
            v-for="field in availableFields"
            :key="field.name"
            class="field-item"
            :class="{ selected: isFieldSelected(field.name) }"
            @click="toggleField(field.name)"
          >
            <div class="field-checkbox">
              <n-checkbox 
                :checked="isFieldSelected(field.name)"
                @update:checked="(checked) => handleFieldToggle(field.name, checked)"
              />
            </div>
            
            <div class="field-info">
              <div class="field-name-row">
                <n-text class="field-name">{{ field.name }}</n-text>
                <n-tag 
                  size="tiny" 
                  :type="getFieldTagType(field.type)"
                  class="field-type-tag"
                >
                  {{ getFieldTypeLabel(field.type) }}
                </n-tag>
              </div>
              
              <div class="field-value-row">
                <n-text depth="3" class="field-value">
                  值: {{ getFieldDisplayValue(field.name) }}
                </n-text>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 已选择字段预览 -->
      <div class="selected-preview" v-if="localConfig.selectedFields.length > 0">
        <div class="preview-header">
          <n-text class="preview-title">
            已选择字段 ({{ localConfig.selectedFields.length }})
          </n-text>
        </div>
        
        <div class="preview-content">
          <div class="selected-fields">
            <n-tag 
              v-for="fieldName in localConfig.selectedFields"
              :key="fieldName"
              closable
              @close="removeField(fieldName)"
              class="selected-field-tag"
            >
              {{ fieldName }}
            </n-tag>
          </div>
        </div>
      </div>

      <!-- 字段统计 -->
      <div class="field-stats">
        <div class="stats-header">
          <n-text class="stats-title">字段统计</n-text>
        </div>
        
        <div class="stats-content">
          <div class="stats-grid">
            <div class="stat-card">
              <n-text class="stat-label">总字段数</n-text>
              <n-text class="stat-value">{{ availableFields.length }}</n-text>
            </div>
            
            <div class="stat-card">
              <n-text class="stat-label">数值字段</n-text>
              <n-text class="stat-value">{{ numericFieldsCount }}</n-text>
            </div>
            
            <div class="stat-card">
              <n-text class="stat-label">文本字段</n-text>
              <n-text class="stat-value">{{ stringFieldsCount }}</n-text>
            </div>
            
            <div class="stat-card">
              <n-text class="stat-label">已选择</n-text>
              <n-text class="stat-value" type="primary">{{ localConfig.selectedFields.length }}</n-text>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NText, NButton, NCheckbox, NTag } from 'naive-ui'

// 字段信息接口
interface FieldInfo {
  name: string
  type: 'number' | 'string' | 'boolean' | 'date' | 'object' | 'array' | 'unknown'
  value: any
}

// Props
interface Props {
  data: Record<string, any>
  config: {
    selectedFields: string[]
  }
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  update: [config: { selectedFields: string[] }]
}>()

// 响应式状态
const localConfig = ref({
  selectedFields: [...(props.config?.selectedFields || [])]
})

// 计算属性
const availableFields = computed((): FieldInfo[] => {
  if (!props.data || typeof props.data !== 'object') return []
  
  return Object.entries(props.data).map(([name, value]) => ({
    name,
    type: inferFieldType(value),
    value
  }))
})

const numericFieldsCount = computed(() => {
  return availableFields.value.filter(field => field.type === 'number').length
})

const stringFieldsCount = computed(() => {
  return availableFields.value.filter(field => field.type === 'string').length
})

// 推断字段类型
const inferFieldType = (value: any): FieldInfo['type'] => {
  if (value === null || value === undefined) {
    return 'unknown'
  }
  
  if (typeof value === 'number') {
    return 'number'
  }
  
  if (typeof value === 'boolean') {
    return 'boolean'
  }
  
  if (Array.isArray(value)) {
    return 'array'
  }
  
  if (typeof value === 'object') {
    // 检查是否是日期
    if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
      return 'date'
    }
    return 'object'
  }
  
  if (typeof value === 'string') {
    // 检查是否是数字字符串
    if (!isNaN(Number(value)) && value.trim() !== '') {
      return 'number'
    }
    
    // 检查是否是日期字符串
    if (!isNaN(Date.parse(value))) {
      return 'date'
    }
    
    return 'string'
  }
  
  return 'unknown'
}

// 获取字段类型标签
const getFieldTagType = (type: FieldInfo['type']) => {
  switch (type) {
    case 'number':
      return 'info'
    case 'string':
      return 'default'
    case 'boolean':
      return 'warning'
    case 'date':
      return 'success'
    case 'object':
    case 'array':
      return 'error'
    default:
      return 'default'
  }
}

// 获取字段类型标签文本
const getFieldTypeLabel = (type: FieldInfo['type']) => {
  switch (type) {
    case 'number':
      return '数值'
    case 'string':
      return '文本'
    case 'boolean':
      return '布尔'
    case 'date':
      return '日期'
    case 'object':
      return '对象'
    case 'array':
      return '数组'
    default:
      return '未知'
  }
}

// 获取字段显示值
const getFieldDisplayValue = (fieldName: string): string => {
  const value = props.data[fieldName]
  
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return `[${value.length} 项]`
    }
    return `{${Object.keys(value).length} 字段}`
  }
  
  const stringValue = String(value)
  return stringValue.length > 30 ? `${stringValue.substring(0, 30)}...` : stringValue
}

// 检查字段是否已选择
const isFieldSelected = (fieldName: string) => {
  return localConfig.value.selectedFields.includes(fieldName)
}

// 切换字段选择状态
const toggleField = (fieldName: string) => {
  if (isFieldSelected(fieldName)) {
    removeField(fieldName)
  } else {
    addField(fieldName)
  }
}

// 处理字段切换
const handleFieldToggle = (fieldName: string, checked: boolean) => {
  if (checked) {
    addField(fieldName)
  } else {
    removeField(fieldName)
  }
}

// 添加字段
const addField = (fieldName: string) => {
  if (!isFieldSelected(fieldName)) {
    localConfig.value.selectedFields.push(fieldName)
    emitConfigChange()
  }
}

// 移除字段
const removeField = (fieldName: string) => {
  const index = localConfig.value.selectedFields.indexOf(fieldName)
  if (index > -1) {
    localConfig.value.selectedFields.splice(index, 1)
    emitConfigChange()
  }
}

// 选择所有字段
const selectAllFields = () => {
  localConfig.value.selectedFields = availableFields.value.map(field => field.name)
  emitConfigChange()
}

// 仅选择数值字段
const selectNumericFields = () => {
  localConfig.value.selectedFields = availableFields.value
    .filter(field => field.type === 'number')
    .map(field => field.name)
  emitConfigChange()
}

// 清空选择
const clearSelection = () => {
  localConfig.value.selectedFields = []
  emitConfigChange()
}

// 发射配置变化事件
const emitConfigChange = () => {
  const newConfig = {
    selectedFields: [...localConfig.value.selectedFields]
  }
  
  console.log('🔄 [ObjectDataConfig] 配置变化:', newConfig)
  emit('update', newConfig)
}

// 智能预选字段
const autoSelectFields = () => {
  if (localConfig.value.selectedFields.length > 0) {
    // 如果已有选择，不覆盖
    return
  }
  
  // 优先选择数值字段
  const numericFields = availableFields.value
    .filter(field => field.type === 'number')
    .map(field => field.name)
  
  if (numericFields.length > 0) {
    // 最多选择前5个数值字段
    localConfig.value.selectedFields = numericFields.slice(0, 5)
  } else {
    // 如果没有数值字段，选择前3个字段
    localConfig.value.selectedFields = availableFields.value
      .slice(0, 3)
      .map(field => field.name)
  }
  
  if (localConfig.value.selectedFields.length > 0) {
    emitConfigChange()
  }
}

// 监听配置变化
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig?.selectedFields) {
      localConfig.value.selectedFields = [...newConfig.selectedFields]
    }
  },
  { immediate: true }
)

// 监听数据变化
watch(
  () => props.data,
  () => {
    autoSelectFields()
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  console.log('🔧 [ObjectDataConfig] 组件挂载')
  autoSelectFields()
})
</script>

<style scoped>
.object-data-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.config-title {
  font-size: 14px;
  font-weight: 500;
}

.config-description {
  font-size: 12px;
}

.config-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selector-title {
  font-size: 13px;
  font-weight: 500;
}

.selector-actions {
  display: flex;
  gap: 8px;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.field-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
}

.field-item:hover {
  border-color: var(--primary-color);
  background: rgba(24, 144, 255, 0.02);
}

.field-item.selected {
  border-color: var(--primary-color);
  background: rgba(24, 144, 255, 0.05);
}

.field-checkbox {
  margin-top: 2px;
}

.field-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-name {
  font-size: 13px;
  font-weight: 500;
  font-family: 'Courier New', monospace;
}

.field-type-tag {
  font-size: 10px;
  height: 16px;
  line-height: 1;
}

.field-value-row {
  display: flex;
  align-items: center;
}

.field-value {
  font-size: 11px;
  font-family: 'Courier New', monospace;
}

.selected-preview {
  padding: 12px;
  background: rgba(82, 196, 26, 0.04);
  border-radius: 6px;
  border: 1px solid rgba(82, 196, 26, 0.1);
}

.preview-header {
  margin-bottom: 8px;
}

.preview-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--success-color);
}

.preview-content {
  display: flex;
  flex-direction: column;
}

.selected-fields {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.selected-field-tag {
  font-size: 11px;
  font-family: 'Courier New', monospace;
}

.field-stats {
  padding: 12px;
  background: rgba(24, 144, 255, 0.04);
  border-radius: 6px;
  border: 1px solid rgba(24, 144, 255, 0.1);
}

.stats-header {
  margin-bottom: 12px;
}

.stats-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--info-color);
}

.stats-content {
  display: flex;
  flex-direction: column;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.stat-label {
  font-size: 11px;
  font-weight: 500;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
}

/* 深色主题适配 */
[data-theme="dark"] .field-item:hover {
  background: rgba(24, 144, 255, 0.05);
}

[data-theme="dark"] .field-item.selected {
  background: rgba(24, 144, 255, 0.08);
}

[data-theme="dark"] .selected-preview {
  background: rgba(82, 196, 26, 0.08);
  border-color: rgba(82, 196, 26, 0.15);
}

[data-theme="dark"] .field-stats {
  background: rgba(24, 144, 255, 0.08);
  border-color: rgba(24, 144, 255, 0.15);
}

[data-theme="dark"] .stat-card {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}
</style>