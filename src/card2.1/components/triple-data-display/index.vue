<template>
  <div :class="['triple-data-display-component', layoutClass]" :style="componentStyle" @click="handleClick">
    <!-- 组件标题 -->
    <div v-if="currentConfig.customize.title" class="component-title">
      {{ currentConfig.customize.title }}
    </div>

    <!-- 三个数据源展示区域 -->
    <div class="data-sources-container">
      <!-- 数据源1 -->
      <div class="data-source-item">
        <div class="data-label">{{ currentConfig.customize.dataSource1Label }}</div>
        <div class="data-value">
          {{ JSON.stringify(dataSource1, null, 2) }}
        </div>
      </div>

      <!-- 数据源2 -->
      <div class="data-source-item">
        <div class="data-label">{{ currentConfig.customize.dataSource2Label }}</div>
        <div class="data-value">
          {{ JSON.stringify(dataSource2, null, 2) }}
        </div>
      </div>

      <!-- 数据源3 -->
      <div class="data-source-item">
        <div class="data-label">{{ currentConfig.customize.dataSource3Label }}</div>
        <div class="data-value">
          {{ JSON.stringify(dataSource3, null, 2) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * triple-data-display 组件
 * 展示三个数据源的数据对比，支持多种布局模式和主题定制
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { interactionManager } from '@/card2.1/core/interaction-manager'
import type { InteractionConfig } from '@/card2.1/core/interaction-types'
import type { TripleDataDisplayConfig } from './settingConfig'
import { tripleDataDisplaySettingConfig } from './settingConfig'

// 组件属性接口 - 支持新的 CustomConfig 结构
interface Props {
  componentId?: string
  // 数据源
  dataSource1?: any
  dataSource2?: any
  dataSource3?: any
  // 新的配置结构（优先）
  modelValue?: TripleDataDisplayConfig
  // 向后兼容的配置结构
  config?:
    | TripleDataDisplayConfig
    | {
        title?: string
        themeColor?: string
        fontSize?: number
        showBorder?: boolean
        layout?: 'grid' | 'horizontal' | 'vertical'
      }
  // 交互配置
  interactionConfigs?: InteractionConfig[]
  // 调试模式
  debugMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  componentId: '',
  dataSource1: null,
  dataSource2: null,
  dataSource3: null,
  debugMode: false
})

// 事件定义
interface Emits {
  (e: 'update:modelValue', config: TripleDataDisplayConfig): void
  (e: 'click', data: { componentId: string; dataSource: string; data: any }): void
  (e: 'refresh', componentId: string): void
  (e: 'interaction', data: { type: string; componentId: string; payload: any }): void
}

const emit = defineEmits<Emits>()

/**
 * 配置计算 - 支持新旧配置格式
 */
const currentConfig = computed<TripleDataDisplayConfig>(() => {
  // 优先使用 modelValue（新格式）
  if (props.modelValue) {
    return props.modelValue
  }

  // 其次使用 config
  if (props.config) {
    // 检查是否是新的 CustomConfig 格式
    if ('customize' in props.config) {
      return props.config as TripleDataDisplayConfig
    }

    // 🔥 修复：检查是否是扁平化配置（从Card2Wrapper传来的）
    const configKeys = Object.keys(props.config)
    const hasExpectedFlatKeys = ['title', 'dataSource1Label', 'dataSource2Label', 'dataSource3Label'].some(key =>
      configKeys.includes(key)
    )

    if (hasExpectedFlatKeys) {
      // 扁平化配置转换为嵌套格式
      const flatConfig = props.config as any
      return {
        ...tripleDataDisplaySettingConfig.customConfig,
        customize: {
          ...tripleDataDisplaySettingConfig.customConfig.customize,
          // 从扁平化配置中提取值
          title: flatConfig.title || tripleDataDisplaySettingConfig.customConfig.customize.title,
          themeColor: flatConfig.themeColor || tripleDataDisplaySettingConfig.customConfig.customize.themeColor,
          fontSize: flatConfig.fontSize || tripleDataDisplaySettingConfig.customConfig.customize.fontSize,
          showBorder:
            flatConfig.showBorder !== undefined
              ? flatConfig.showBorder
              : tripleDataDisplaySettingConfig.customConfig.customize.showBorder,
          layout: flatConfig.layout || tripleDataDisplaySettingConfig.customConfig.customize.layout,
          dataSource1Label:
            flatConfig.dataSource1Label || tripleDataDisplaySettingConfig.customConfig.customize.dataSource1Label,
          dataSource2Label:
            flatConfig.dataSource2Label || tripleDataDisplaySettingConfig.customConfig.customize.dataSource2Label,
          dataSource3Label:
            flatConfig.dataSource3Label || tripleDataDisplaySettingConfig.customConfig.customize.dataSource3Label,
          numberFormat: flatConfig.numberFormat || tripleDataDisplaySettingConfig.customConfig.customize.numberFormat,
          unit: flatConfig.unit || tripleDataDisplaySettingConfig.customConfig.customize.unit
        }
      }
    }

    // 转换旧格式到新格式（保持向后兼容）
    const legacyConfig = props.config as any
    return {
      ...tripleDataDisplaySettingConfig.customConfig,
      customize: {
        ...tripleDataDisplaySettingConfig.customConfig.customize,
        title: legacyConfig.title || tripleDataDisplaySettingConfig.customConfig.customize.title,
        themeColor: legacyConfig.themeColor || tripleDataDisplaySettingConfig.customConfig.customize.themeColor,
        fontSize: legacyConfig.fontSize || tripleDataDisplaySettingConfig.customConfig.customize.fontSize,
        showBorder:
          legacyConfig.showBorder !== undefined
            ? legacyConfig.showBorder
            : tripleDataDisplaySettingConfig.customConfig.customize.showBorder,
        layout: legacyConfig.layout || tripleDataDisplaySettingConfig.customConfig.customize.layout
      }
    }
  }

  // 使用默认配置
  return tripleDataDisplaySettingConfig.customConfig
})

/**
 * 布局样式类名
 */
const layoutClass = computed(() => {
  const layout = currentConfig.value.customize.layout
  return `layout-${layout}`
})

/**
 * 组件样式计算
 */
const componentStyle = computed(() => {
  const customize = currentConfig.value.customize
  return {
    '--theme-color': customize.themeColor,
    '--font-size': `${customize.fontSize}px`,
    border: customize.showBorder ? '1px solid var(--border-color)' : 'none'
  }
})

/**
 * 数字格式化工具 - 支持对象数据提取和多字段智能分配
 */
const formatNumber = (value: any, dataSourceIndex: number = 0): string => {
  if (value === null || value === undefined || value === '') return '--'

  // 🔥 修复：处理对象类型的数据源
  let actualValue = value
  if (typeof value === 'object' && value !== null) {
    // 🔥 新增：处理 Card2Wrapper 传递的嵌套数据结构 {type: 'json', data: {...}}
    if (value.type && value.data && typeof value.data === 'object') {
      const dataObj = value.data
      const numericEntries = Object.entries(dataObj).filter(
        ([key, val]) => typeof val === 'number' || (typeof val === 'string' && !isNaN(parseFloat(val as string)))
      )

      // 🎯 智能字段分配：根据数据源索引分配不同字段
      if (numericEntries.length > dataSourceIndex) {
        const [key, val] = numericEntries[dataSourceIndex]
        actualValue = typeof val === 'number' ? val : parseFloat(val as string)
      } else if (numericEntries.length > 0) {
        // 如果没有足够的数字字段，使用第一个
        const [key, val] = numericEntries[0]
        actualValue = typeof val === 'number' ? val : parseFloat(val as string)
      } else {
        // 如果没有数字字段，使用所有字段中的某个
        const allEntries = Object.entries(dataObj)
        if (allEntries.length > dataSourceIndex) {
          const [key, val] = allEntries[dataSourceIndex]
          actualValue = String(val)
        } else if (allEntries.length > 0) {
          const [key, val] = allEntries[0]
          actualValue = String(val)
        }
      }
    }
    // 🔥 保持原有逻辑：处理简单的数据字段
    else if (typeof value.value === 'number' || typeof value.value === 'string') {
      actualValue = value.value
    } else if (typeof value.data === 'number' || typeof value.data === 'string') {
      actualValue = value.data
    } else if (typeof value.val === 'number' || typeof value.val === 'string') {
      actualValue = value.val
    } else if (typeof value.number === 'number' || typeof value.number === 'string') {
      actualValue = value.number
    } else {
      return '[需要配置数据字段]'
    }
  }

  const numValue = typeof actualValue === 'number' ? actualValue : parseFloat(String(actualValue))
  if (isNaN(numValue)) {
    return String(actualValue)
  }

  const format = currentConfig.value.customize.numberFormat

  switch (format) {
    case 'thousands':
      return numValue.toLocaleString()
    case 'decimal2':
      return numValue.toFixed(2)
    case 'percentage':
      return `${(numValue * 100).toFixed(1)}%`
    default:
      return String(numValue)
  }
}

// 交互系统状态
const isInteractionEnabled = ref(false)
const registeredEvents = ref<Set<string>>(new Set())

/**
 * 点击事件处理
 */
const handleClick = () => {
  // 发送点击事件
  emit('click', {
    componentId: props.componentId,
    dataSource: 'triple-data-display',
    data: {
      dataSource1: props.dataSource1,
      dataSource2: props.dataSource2,
      dataSource3: props.dataSource3
    }
  })
}

/**
 * 监听属性更新事件（用于跨组件属性绑定）
 */
const handlePropertyUpdate = (data: any) => {
  if (data && typeof data === 'object') {
    // 更新配置并触发事件
    const newConfig = { ...currentConfig.value, ...data }
    emit('update:modelValue', newConfig)
  }
}

/**
 * 组件挂载时的初始化
 */
onMounted(() => {
  // 注册属性更新监听器（用于跨组件属性绑定）
  if (props.componentId) {
    interactionManager.watchComponentProperty(props.componentId, handlePropertyUpdate)
  }

  // 初始化交互配置
  if (props.interactionConfigs && props.interactionConfigs.length > 0) {
    try {
      isInteractionEnabled.value = true
    } catch (error) {}
  }
})

/**
 * 组件卸载时清理
 */
onUnmounted(() => {
  // 清理交互系统监听器
  if (props.componentId && registeredEvents.value.size > 0) {
    try {
      // 这里可以添加清理逻辑
    } catch (error) {}
  }
})

/**
 * 监听配置变化
 */
watch(
  () => currentConfig.value,
  newConfig => {},
  { deep: true }
)
</script>

<style scoped>
.triple-data-display-component {
  width: 100%;
  height: 100%;
  padding: 16px;
  background: var(--card-color);
  border-radius: var(--border-radius);
  display: flex;
  flex-direction: column;
  font-size: var(--font-size, 16px);
  color: var(--text-color);
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
}

.triple-data-display-component:hover {
  box-shadow: var(--box-shadow);
}

.component-title {
  font-size: calc(var(--font-size, 16px) + 2px);
  font-weight: 600;
  color: var(--theme-color);
  margin-bottom: 16px;
  text-align: center;
}

.data-sources-container {
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

/* 网格布局 */
.layout-grid .data-sources-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  align-items: stretch;
}

/* 水平布局 */
.layout-horizontal .data-sources-container {
  flex-direction: row;
}

/* 垂直布局 */
.layout-vertical .data-sources-container {
  flex-direction: column;
  align-items: stretch;
}

.data-source-item {
  flex: 1;
  padding: 12px;
  background: var(--body-color);
  border-radius: calc(var(--border-radius) * 0.5);
  border: 1px solid var(--border-color);
  text-align: center;
  transition: all 0.2s ease;
}

.data-source-item:hover {
  border-color: var(--theme-color);
  transform: translateY(-1px);
}

.data-label {
  font-size: calc(var(--font-size, 16px) - 2px);
  color: var(--text-color-2);
  margin-bottom: 8px;
}

.data-value {
  font-size: calc(var(--font-size, 16px) + 6px);
  font-weight: 600;
  color: var(--theme-color);
}

.data-unit {
  font-size: calc(var(--font-size, 16px) - 2px);
  font-weight: 400;
  color: var(--text-color-3);
  margin-left: 4px;
}

.json-display {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  background: var(--body-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 12px;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.json-display pre {
  font-size: 10px;
  margin: 0;
  color: var(--text-color-2);
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 响应式调整 */
@media (max-width: 600px) {
  .layout-grid .data-sources-container,
  .layout-horizontal .data-sources-container {
    flex-direction: column;
    align-items: stretch;
  }

  .data-source-item {
    margin-bottom: 8px;
  }
}

/* 暗色主题适配 */
[data-theme='dark'] .triple-data-display-component {
  border-color: var(--border-color);
}

[data-theme='dark'] .data-source-item {
  background: var(--modal-color);
}
</style>
