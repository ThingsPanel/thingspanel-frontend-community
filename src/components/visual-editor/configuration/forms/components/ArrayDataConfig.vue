<!--
  数组数据配置组件
  提供数组数据的字段映射配置
-->
<template>
  <div class="array-data-config">
    <div class="config-header">
      <n-text class="config-title">数组字段配置</n-text>
      <n-text depth="3" class="config-description">
        配置数组中每个对象的字段映射，用于图表X/Y轴显示
      </n-text>
    </div>
    
    <div class="config-content">
      <div class="field-list">
        <!-- X轴字段配置 -->
        <div class="field-item">
          <div class="field-header">
            <n-text class="field-label">X轴字段名</n-text>
            <n-tag size="tiny" type="info">必需</n-tag>
          </div>
          <n-select
            v-model:value="localConfig.xField"
            :options="fieldOptions"
            placeholder="选择用作X轴的字段"
            @update:value="handleConfigChange"
            class="field-select"
          />
          <n-text depth="3" class="field-hint">
            时间或索引字段，用于图表横轴
          </n-text>
        </div>

        <!-- Y轴字段配置 -->
        <div class="field-item">
          <div class="field-header">
            <n-text class="field-label">Y轴字段名</n-text>
            <n-tag size="tiny" type="info">必需</n-tag>
          </div>
          <n-select
            v-model:value="localConfig.yField"
            :options="fieldOptions"
            placeholder="选择用作Y轴的字段"
            @update:value="handleConfigChange"
            class="field-select"
          />
          <n-text depth="3" class="field-hint">
            数值字段，用于图表纵轴
          </n-text>
        </div>

        <!-- 标签字段配置 -->
        <div class="field-item">
          <div class="field-header">
            <n-text class="field-label">标签字段名</n-text>
            <n-tag size="tiny" type="default">可选</n-tag>
          </div>
          <n-select
            v-model:value="localConfig.labelField"
            :options="fieldOptionsWithEmpty"
            placeholder="选择用作标签的字段"
            @update:value="handleConfigChange"
            class="field-select"
          />
          <n-text depth="3" class="field-hint">
            可选，用于数据点标签显示
          </n-text>
        </div>
      </div>

      <!-- 字段预览 -->
      <div class="field-preview" v-if="hasValidData">
        <div class="preview-header">
          <n-text class="preview-title">字段值预览</n-text>
        </div>
        <div class="preview-content">
          <div class="preview-row" v-if="localConfig.xField">
            <n-text class="preview-label">X轴 ({{ localConfig.xField }}):</n-text>
            <n-text class="preview-value" :type="getPreviewType('x')">
              {{ getFieldPreviewValue(localConfig.xField) }}
            </n-text>
          </div>
          <div class="preview-row" v-if="localConfig.yField">
            <n-text class="preview-label">Y轴 ({{ localConfig.yField }}):</n-text>
            <n-text class="preview-value" :type="getPreviewType('y')">
              {{ getFieldPreviewValue(localConfig.yField) }}
            </n-text>
          </div>
          <div class="preview-row" v-if="localConfig.labelField">
            <n-text class="preview-label">标签 ({{ localConfig.labelField }}):</n-text>
            <n-text class="preview-value">
              {{ getFieldPreviewValue(localConfig.labelField) }}
            </n-text>
          </div>
        </div>
      </div>

      <!-- 数据统计 -->
      <div class="data-stats" v-if="hasValidData">
        <div class="stats-header">
          <n-text class="stats-title">数据统计</n-text>
        </div>
        <div class="stats-content">
          <div class="stat-item">
            <n-text depth="2" class="stat-label">数据条数:</n-text>
            <n-text class="stat-value">{{ data.length }}</n-text>
          </div>
          <div class="stat-item">
            <n-text depth="2" class="stat-label">可用字段:</n-text>
            <n-text class="stat-value">{{ availableFields.length }}</n-text>
          </div>
          <div class="stat-item" v-if="numericFields.length > 0">
            <n-text depth="2" class="stat-label">数值字段:</n-text>
            <n-text class="stat-value">{{ numericFields.join(', ') }}</n-text>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NText, NSelect, NTag } from 'naive-ui'

// Props
interface Props {
  data: any[]
  config: {
    xField: string
    yField: string
    labelField?: string
  }
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  update: [config: { xField: string; yField: string; labelField?: string }]
}>()

// 响应式状态
const localConfig = ref({
  xField: props.config?.xField || 'timestamp',
  yField: props.config?.yField || 'value',
  labelField: props.config?.labelField || ''
})

// 计算属性
const hasValidData = computed(() => {
  return Array.isArray(props.data) && props.data.length > 0
})

const availableFields = computed(() => {
  if (!hasValidData.value) return []
  
  const firstItem = props.data[0]
  if (typeof firstItem !== 'object' || firstItem === null) return []
  
  return Object.keys(firstItem)
})

const numericFields = computed(() => {
  if (!hasValidData.value) return []
  
  const firstItem = props.data[0]
  return availableFields.value.filter(field => {
    const value = firstItem[field]
    return typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))
  })
})

const fieldOptions = computed(() => {
  return availableFields.value.map(field => ({
    label: field,
    value: field
  }))
})

const fieldOptionsWithEmpty = computed(() => {
  const options = [
    { label: '(不使用)', value: '' }
  ]
  
  return options.concat(fieldOptions.value)
})

// 获取字段预览值
const getFieldPreviewValue = (fieldName: string): string => {
  if (!fieldName || !hasValidData.value) return '未选择'
  
  const firstItem = props.data[0]
  const value = firstItem[fieldName]
  
  if (value === undefined || value === null) {
    return '未找到'
  }
  
  return String(value)
}

// 获取预览值类型
const getPreviewType = (axis: 'x' | 'y') => {
  if (!hasValidData.value) return 'default'
  
  const fieldName = axis === 'x' ? localConfig.value.xField : localConfig.value.yField
  if (!fieldName) return 'default'
  
  const firstItem = props.data[0]
  const value = firstItem[fieldName]
  
  if (value === undefined || value === null) {
    return 'error'
  }
  
  if (axis === 'y') {
    // Y轴应该是数值
    const isNumeric = typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))
    return isNumeric ? 'success' : 'warning'
  }
  
  return 'default'
}

// 处理配置变化
const handleConfigChange = () => {
  const newConfig = {
    xField: localConfig.value.xField,
    yField: localConfig.value.yField,
    labelField: localConfig.value.labelField || undefined
  }
  
  console.log('🔄 [ArrayDataConfig] 配置变化:', newConfig)
  emit('update', newConfig)
}

// 智能推断默认字段
const inferDefaultFields = () => {
  if (!hasValidData.value) return
  
  const firstItem = props.data[0]
  const fields = Object.keys(firstItem)
  
  // 推断X轴字段（时间、索引相关）
  const timeFields = fields.filter(field => 
    field.toLowerCase().includes('time') || 
    field.toLowerCase().includes('date') || 
    field === 'timestamp' ||
    field === 'index'
  )
  
  if (timeFields.length > 0 && !localConfig.value.xField) {
    localConfig.value.xField = timeFields[0]
  }
  
  // 推断Y轴字段（数值字段）
  if (numericFields.value.length > 0 && !localConfig.value.yField) {
    // 排除可能是时间戳的字段
    const nonTimeNumericFields = numericFields.value.filter(field => 
      !timeFields.includes(field) && 
      !field.toLowerCase().includes('id')
    )
    
    if (nonTimeNumericFields.length > 0) {
      localConfig.value.yField = nonTimeNumericFields[0]
    } else {
      localConfig.value.yField = numericFields.value[0]
    }
  }
  
  // 推断标签字段
  const labelFields = fields.filter(field => 
    field.toLowerCase().includes('label') || 
    field.toLowerCase().includes('name') ||
    field === 'title'
  )
  
  if (labelFields.length > 0 && !localConfig.value.labelField) {
    localConfig.value.labelField = labelFields[0]
  }
}

// 监听数据变化
watch(
  () => props.data,
  () => {
    inferDefaultFields()
    handleConfigChange()
  },
  { immediate: true, deep: true }
)

// 监听配置变化
watch(
  () => props.config,
  (newConfig) => {
    if (newConfig) {
      localConfig.value = {
        xField: newConfig.xField,
        yField: newConfig.yField,
        labelField: newConfig.labelField || ''
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
  console.log('🔧 [ArrayDataConfig] 组件挂载')
  inferDefaultFields()
})
</script>

<style scoped>
.array-data-config {
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

.field-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
}

.field-select {
  width: 100%;
}

.field-hint {
  font-size: 11px;
  margin-left: 4px;
}

.field-preview {
  padding: 12px;
  background: rgba(24, 144, 255, 0.04);
  border-radius: 6px;
  border: 1px solid rgba(24, 144, 255, 0.1);
}

.preview-header {
  margin-bottom: 8px;
}

.preview-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--info-color);
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-label {
  font-size: 12px;
  font-weight: 500;
  min-width: 80px;
}

.preview-value {
  font-size: 12px;
  font-family: 'Courier New', monospace;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 3px;
}

.data-stats {
  padding: 12px;
  background: rgba(82, 196, 26, 0.04);
  border-radius: 6px;
  border: 1px solid rgba(82, 196, 26, 0.1);
}

.stats-header {
  margin-bottom: 8px;
}

.stats-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--success-color);
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 12px;
  min-width: 70px;
}

.stat-value {
  font-size: 12px;
  font-family: 'Courier New', monospace;
}

/* 深色主题适配 */
[data-theme="dark"] .field-preview {
  background: rgba(24, 144, 255, 0.08);
  border-color: rgba(24, 144, 255, 0.15);
}

[data-theme="dark"] .preview-value {
  background: rgba(255, 255, 255, 0.08);
}

[data-theme="dark"] .data-stats {
  background: rgba(82, 196, 26, 0.08);
  border-color: rgba(82, 196, 26, 0.15);
}
</style>