<template>
  <div class="simple-data-display">
    <!-- 组件标题 -->
    <div v-if="showTitle" class="component-title">
      <n-icon size="16" class="title-icon">
        <DocumentTextOutline />
      </n-icon>
      <span class="title-text">{{ title || '数据展示' }}</span>
    </div>

    <!-- 数据内容区域 -->
    <div class="data-content">
      <div v-if="!hasData" class="no-data">
        <n-empty size="small" description="暂无数据">
          <template #icon>
            <n-icon><InformationCircleOutline /></n-icon>
          </template>
          <template #extra>
            <n-text depth="3">请配置数据源</n-text>
          </template>
        </n-empty>
      </div>

      <div v-else class="data-fields">
        <div v-for="(value, key) in displayData" :key="key" class="data-field">
          <div class="field-label">{{ getFieldLabel(key) }}</div>
          <div class="field-value">{{ formatValue(value) }}</div>
        </div>
      </div>
    </div>

    <!-- 调试信息（开发时显示） -->
    <div v-if="showDebugInfo" class="debug-info">
      <n-collapse>
        <n-collapse-item title="调试信息">
          <div class="debug-content">
            <h4>原始数据:</h4>
            <pre>{{ JSON.stringify(rawData, null, 2) }}</pre>
            <h4>处理后数据:</h4>
            <pre>{{ JSON.stringify(displayData, null, 2) }}</pre>
            <h4>数据源配置:</h4>
            <pre>{{ JSON.stringify(dataSourceConfig, null, 2) }}</pre>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 简单数据显示组件
 * 用于展示单个JSON对象的数据，支持字段映射和格式化
 */

import { ref, computed, watch } from 'vue'
import { NIcon, NEmpty, NText, NCollapse, NCollapseItem } from 'naive-ui'
import { DocumentTextOutline, InformationCircleOutline } from '@vicons/ionicons5'

// 组件属性定义
interface Props {
  /** 组件标题 */
  title?: string
  /** 是否显示标题 */
  showTitle?: boolean
  /** 原始数据 */
  rawData?: any
  /** 数据源配置 */
  dataSourceConfig?: any
  /** 字段标签映射 */
  fieldLabels?: Record<string, string>
  /** 是否显示调试信息 */
  showDebugInfo?: boolean
  /** 最大显示字段数量 */
  maxFields?: number
}

const props = withDefaults(defineProps<Props>(), {
  title: '数据展示',
  showTitle: true,
  rawData: undefined,
  dataSourceConfig: undefined,
  fieldLabels: () => ({}),
  showDebugInfo: false,
  maxFields: 10
})

// 响应式数据
const displayData = ref<Record<string, any>>({})

// 计算属性
const hasData = computed(() => {
  return displayData.value && Object.keys(displayData.value).length > 0
})

/**
 * 获取字段显示标签
 */
const getFieldLabel = (key: string): string => {
  return props.fieldLabels[key] || key
}

/**
 * 格式化显示值
 */
const formatValue = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'boolean') return value ? '是' : '否'
  if (typeof value === 'number') {
    // 数字格式化
    if (Number.isInteger(value)) return value.toString()
    return value.toFixed(2)
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

/**
 * 处理原始数据
 */
const processRawData = () => {
  if (!props.rawData) {
    displayData.value = {}
    return
  }

  // 如果是对象，直接使用
  if (typeof props.rawData === 'object' && !Array.isArray(props.rawData)) {
    const processed: Record<string, any> = {}
    const entries = Object.entries(props.rawData)

    // 限制显示字段数量
    const limitedEntries = entries.slice(0, props.maxFields)

    limitedEntries.forEach(([key, value]) => {
      processed[key] = value
    })

    displayData.value = processed
  }
  // 如果是数组，取第一个元素
  else if (Array.isArray(props.rawData) && props.rawData.length > 0) {
    const firstItem = props.rawData[0]
    if (typeof firstItem === 'object') {
      const processed: Record<string, any> = {}
      const entries = Object.entries(firstItem)

      const limitedEntries = entries.slice(0, props.maxFields)

      limitedEntries.forEach(([key, value]) => {
        processed[key] = value
      })

      displayData.value = processed
    } else {
      displayData.value = { value: firstItem }
    }
  }
  // 其他情况，包装为对象
  else {
    displayData.value = { value: props.rawData }
  }
}

// 监听数据变化
watch(
  () => props.rawData,
  () => {
    processRawData()
  },
  { immediate: true, deep: true }
)

watch(
  () => props.maxFields,
  () => {
    processRawData()
  }
)

// 暴露方法给父组件
defineExpose({
  refresh: processRawData,
  getData: () => displayData.value
})
</script>

<style scoped>
.simple-data-display {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 12px;
  background: var(--card-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

/* === 组件标题 === */
.component-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--divider-color);
}

.title-icon {
  color: var(--primary-color);
}

.title-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

/* === 数据内容区域 === */
.data-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.no-data {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.data-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: var(--hover-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.data-field:hover {
  background: var(--hover-color-suppl);
  border-color: var(--primary-color-suppl);
}

.field-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-color-2);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.field-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  word-break: break-all;
  white-space: pre-wrap;
}

/* === 调试信息 === */
.debug-info {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--divider-color);
}

.debug-content {
  font-size: 12px;
}

.debug-content h4 {
  margin: 8px 0 4px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color-2);
}

.debug-content pre {
  background: var(--code-color);
  padding: 8px;
  border-radius: 4px;
  font-size: 10px;
  max-height: 150px;
  overflow-y: auto;
  margin: 4px 0 8px 0;
  border: 1px solid var(--border-color);
}

/* === 响应式设计 === */
@media (max-width: 480px) {
  .simple-data-display {
    padding: 8px;
  }

  .data-field {
    padding: 6px;
  }

  .field-value {
    font-size: 12px;
  }
}

/* === 主题适配 === */
[data-theme='dark'] .simple-data-display {
  background: var(--card-color-dark);
  border-color: var(--border-color-dark);
}

[data-theme='dark'] .component-title {
  border-color: var(--divider-color-dark);
}

[data-theme='dark'] .data-field {
  background: var(--hover-color-dark);
  border-color: var(--border-color-dark);
}

[data-theme='dark'] .data-field:hover {
  background: var(--hover-color-suppl-dark);
}

[data-theme='dark'] .debug-content pre {
  background: var(--code-color-dark);
  border-color: var(--border-color-dark);
}
</style>
