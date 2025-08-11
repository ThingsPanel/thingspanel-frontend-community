<!--
  数据预览组件
  以紧凑的方式显示数据内容预览
-->
<template>
  <div class="data-preview">
    <!-- 数组数据预览 -->
    <div v-if="isArrayData" class="array-preview">
      <div class="preview-header">
        <n-text class="data-type-label">数组数据预览</n-text>
        <n-text depth="3" class="data-count">{{ data.length }} 条记录</n-text>
      </div>
      
      <div class="array-content">
        <div 
          v-for="(item, index) in previewItems"
          :key="index"
          class="array-item"
        >
          <div class="item-index">{{ index + 1 }}</div>
          <div class="item-content">
            <!-- 配置字段优先显示 -->
            <div v-if="config?.arrayConfig" class="configured-fields">
              <div 
                v-if="config.arrayConfig.xField && item[config.arrayConfig.xField] !== undefined"
                class="field-preview"
              >
                <span class="field-name">{{ config.arrayConfig.xField }}:</span>
                <span class="field-value primary">{{ item[config.arrayConfig.xField] }}</span>
              </div>
              <div 
                v-if="config.arrayConfig.yField && item[config.arrayConfig.yField] !== undefined"
                class="field-preview"
              >
                <span class="field-name">{{ config.arrayConfig.yField }}:</span>
                <span class="field-value success">{{ item[config.arrayConfig.yField] }}</span>
              </div>
              <div 
                v-if="config.arrayConfig.labelField && item[config.arrayConfig.labelField] !== undefined"
                class="field-preview"
              >
                <span class="field-name">{{ config.arrayConfig.labelField }}:</span>
                <span class="field-value">{{ item[config.arrayConfig.labelField] }}</span>
              </div>
            </div>
            
            <!-- 所有字段预览（简化） -->
            <div v-else class="all-fields">
              <div 
                v-for="(value, key) in item"
                :key="key"
                class="field-preview"
              >
                <span class="field-name">{{ key }}:</span>
                <span class="field-value">{{ formatValue(value) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="data.length > maxItems" class="more-indicator">
        <n-text depth="3" class="more-text">
          还有 {{ data.length - maxItems }} 条记录...
        </n-text>
      </div>
    </div>

    <!-- 对象数据预览 -->
    <div v-else-if="isObjectData" class="object-preview">
      <div class="preview-header">
        <n-text class="data-type-label">对象数据预览</n-text>
        <n-text depth="3" class="data-count">{{ objectFieldCount }} 个字段</n-text>
      </div>
      
      <div class="object-content">
        <!-- 选中字段优先显示 -->
        <div v-if="config?.objectConfig?.selectedFields?.length" class="selected-fields">
          <div 
            v-for="fieldName in config.objectConfig.selectedFields"
            :key="fieldName"
            class="field-preview important"
          >
            <span class="field-name">{{ fieldName }}:</span>
            <span class="field-value">{{ formatValue(data[fieldName]) }}</span>
            <span class="field-type">{{ getFieldType(data[fieldName]) }}</span>
          </div>
        </div>
        
        <!-- 所有字段预览 -->
        <div v-else class="all-fields">
          <div 
            v-for="(value, key) in previewObject"
            :key="key"
            class="field-preview"
          >
            <span class="field-name">{{ key }}:</span>
            <span class="field-value">{{ formatValue(value) }}</span>
            <span class="field-type">{{ getFieldType(value) }}</span>
          </div>
        </div>
      </div>
      
      <div v-if="objectFieldCount > maxFields" class="more-indicator">
        <n-text depth="3" class="more-text">
          还有 {{ objectFieldCount - maxFields }} 个字段...
        </n-text>
      </div>
    </div>

    <!-- 其他类型数据 -->
    <div v-else class="other-preview">
      <div class="preview-header">
        <n-text class="data-type-label">数据预览</n-text>
        <n-text depth="3" class="data-count">{{ typeof data }} 类型</n-text>
      </div>
      
      <div class="other-content">
        <n-text class="raw-data">{{ formatValue(data) }}</n-text>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NText } from 'naive-ui'

// Props
interface Props {
  /** 预览数据 */
  data: any
  /** 数据配置 */
  config?: {
    arrayConfig?: {
      xField: string
      yField: string
      labelField?: string
    }
    objectConfig?: {
      selectedFields: string[]
    }
  }
  /** 最大显示项数 */
  maxItems?: number
  /** 对象最大显示字段数 */
  maxFields?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxItems: 3,
  maxFields: 6
})

// 计算属性
const isArrayData = computed(() => Array.isArray(props.data))
const isObjectData = computed(() => 
  props.data && typeof props.data === 'object' && !Array.isArray(props.data)
)

const previewItems = computed(() => {
  if (!isArrayData.value) return []
  return props.data.slice(0, props.maxItems)
})

const objectFieldCount = computed(() => {
  if (!isObjectData.value) return 0
  return Object.keys(props.data).length
})

const previewObject = computed(() => {
  if (!isObjectData.value) return {}
  
  const entries = Object.entries(props.data)
  const limitedEntries = entries.slice(0, props.maxFields)
  
  return Object.fromEntries(limitedEntries)
})

// 格式化值显示
const formatValue = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  
  if (typeof value === 'string') {
    // 限制字符串长度
    return value.length > 20 ? `"${value.substring(0, 20)}..."` : `"${value}"`
  }
  
  if (typeof value === 'number') {
    // 数字保留适当精度
    return Number.isInteger(value) ? value.toString() : value.toFixed(2)
  }
  
  if (typeof value === 'boolean') {
    return value.toString()
  }
  
  if (Array.isArray(value)) {
    return `[${value.length} 项]`
  }
  
  if (typeof value === 'object') {
    return `{${Object.keys(value).length} 字段}`
  }
  
  return String(value)
}

// 获取字段类型
const getFieldType = (value: any): string => {
  if (value === null || value === undefined) return ''
  
  if (typeof value === 'number') return 'num'
  if (typeof value === 'string') return 'str'
  if (typeof value === 'boolean') return 'bool'
  if (Array.isArray(value)) return 'arr'
  if (typeof value === 'object') return 'obj'
  
  return typeof value
}
</script>

<style scoped>
.data-preview {
  font-size: 12px;
  line-height: 1.4;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--divider-color);
}

.data-type-label {
  font-size: 12px;
  font-weight: 500;
}

.data-count {
  font-size: 11px;
}

/* 数组预览样式 */
.array-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.array-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.array-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.item-index {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: var(--primary-color);
  color: white;
  font-size: 10px;
  font-weight: 600;
  border-radius: 50%;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

/* 对象预览样式 */
.object-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.object-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

/* 字段预览样式 */
.configured-fields,
.selected-fields,
.all-fields {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Courier New', monospace;
}

.field-preview.important {
  padding: 2px 4px;
  background: rgba(82, 196, 26, 0.08);
  border-radius: 3px;
}

.field-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-color-2);
  min-width: 60px;
  flex-shrink: 0;
}

.field-value {
  font-size: 11px;
  color: var(--text-color);
  flex: 1;
}

.field-value.primary {
  color: var(--primary-color);
  font-weight: 500;
}

.field-value.success {
  color: var(--success-color);
  font-weight: 500;
}

.field-type {
  font-size: 9px;
  color: var(--text-color-3);
  background: rgba(0, 0, 0, 0.05);
  padding: 1px 4px;
  border-radius: 2px;
  font-weight: 500;
}

/* 其他类型预览 */
.other-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.other-content {
  padding: 8px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.raw-data {
  font-family: 'Courier New', monospace;
  font-size: 11px;
  word-break: break-all;
}

/* 更多指示器 */
.more-indicator {
  text-align: center;
  padding: 4px;
  border-top: 1px dashed var(--border-color);
  margin-top: 4px;
}

.more-text {
  font-size: 11px;
  font-style: italic;
}

/* 深色主题适配 */
[data-theme="dark"] .array-item,
[data-theme="dark"] .object-content,
[data-theme="dark"] .other-content {
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--border-color-dark);
}

[data-theme="dark"] .field-preview.important {
  background: rgba(82, 196, 26, 0.12);
}

[data-theme="dark"] .field-type {
  background: rgba(255, 255, 255, 0.08);
}
</style>