<template>
  <div ref="containerRef" class="digit-indicator">
    <!-- 图标区域 -->
    <div class="icon-container">
      <n-icon
        class="indicator-icon"
        :color="config.iconColor || '#1890ff'"
        :style="{ fontSize: iconSize }"
      >
        <component :is="iconComponent" />
      </n-icon>
    </div>

    <!-- 数值区域 -->
    <div class="value-container">
      <span
        class="value-text"
        :style="{ fontSize: valueSize }"
        :title="fullValueText"
      >
        {{ displayValue }}
        <span class="unit-text" :style="{ fontSize: unitSize }">
          {{ displayUnit }}
        </span>
      </span>
    </div>

    <!-- 标题区域 -->
    <div v-if="config.showTitle !== false && displayTitle" class="title-container">
      <span
        class="title-text"
        :style="{ fontSize: titleSize }"
        :title="displayTitle"
      >
        {{ displayTitle }}
      </span>
    </div>

    <!-- 空状态 -->
    <div v-if="!hasValidData" class="empty-state">
      <span class="empty-text">{{ $t('common.noData') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { NIcon } from 'naive-ui'
import { useCard2Props } from '@/card2.1/hooks/useCard2Props'
import { icons as iconOptions } from '@/components/common/icons'
import { createLogger } from '@/utils/logger'
import { useI18n } from 'vue-i18n'

const logger = createLogger('DigitIndicator')
const { t } = useI18n()

// 组件配置接口
interface ComponentConfig {
  iconName?: string
  iconColor?: string
  unit?: string
  title?: string
  decimalPlaces?: number
  showTitle?: boolean
  autoResize?: boolean
}

// 数据接口
interface IndicatorData {
  value?: number | string
  unit?: string
  timestamp?: string
  [key: string]: any
}

// Props定义
interface Props {
  componentId?: string
  initialConfig?: ComponentConfig
  initialUnifiedConfig?: any
}

const props = withDefaults(defineProps<Props>(), {
  componentId: '',
  initialConfig: () => ({}),
  initialUnifiedConfig: () => ({})
})

// 使用统一配置管理
const {
  config,
  displayData,
  updateConfig,
  exposeWhitelistedProperties
} = useCard2Props<ComponentConfig>({
  config: props.initialConfig,
  componentId: props.componentId,
  initialUnifiedConfig: props.initialUnifiedConfig
})

// DOM引用
const containerRef = ref<HTMLElement>()
let resizeObserver: ResizeObserver | null = null

// 响应式尺寸
const containerSize = ref({ width: 0, height: 0 })
const baseSize = computed(() => Math.min(containerSize.value.width, containerSize.value.height))

// 计算字体大小（基于容器大小）
const iconSize = computed(() => {
  if (!config.value.autoResize) return '3em'
  return `${Math.max(baseSize.value / 8, 24)}px`
})

const valueSize = computed(() => {
  if (!config.value.autoResize) return '2em'
  return `${Math.max(baseSize.value / 6, 20)}px`
})

const unitSize = computed(() => {
  if (!config.value.autoResize) return '1.5em'
  return `${Math.max(baseSize.value / 10, 14)}px`
})

const titleSize = computed(() => {
  if (!config.value.autoResize) return '1em'
  return `${Math.max(baseSize.value / 12, 12)}px`
})

// 图标组件
const iconComponent = computed(() => {
  const iconName = config.value.iconName || 'Water'
  return iconOptions[iconName] || iconOptions.Water
})

// 数据处理
const processedData = computed((): IndicatorData => {
  if (!displayData.value) return {}

  // 如果是数组，取第一个元素
  if (Array.isArray(displayData.value)) {
    return displayData.value.length > 0 ? displayData.value[0] : {}
  }

  // 直接返回对象
  return displayData.value as IndicatorData
})

// 数值显示
const displayValue = computed(() => {
  const data = processedData.value
  let value = data?.value

  // 处理不同类型的值
  if (value === undefined || value === null || value === '') {
    return '45' // 默认值，与原组件保持一致
  }

  // 转换为数字
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) {
    return String(value) // 如果不是数字，直接显示字符串
  }

  // 格式化小数位数
  const decimalPlaces = config.value.decimalPlaces ?? 1
  return numValue.toFixed(decimalPlaces)
})

// 单位显示
const displayUnit = computed(() => {
  // 优先使用配置中的单位覆盖
  if (config.value.unit) {
    return config.value.unit
  }

  // 使用数据中的单位
  const data = processedData.value
  if (data?.unit) {
    return data.unit
  }

  // 默认单位
  return '%'
})

// 标题显示
const displayTitle = computed(() => {
  // 优先使用配置中的标题
  if (config.value.title) {
    return config.value.title
  }

  // 使用数据中的名称
  const data = processedData.value
  if (data?.name) {
    return data.name
  }

  // 默认标题
  return t('card.humidity')
})

// 完整数值文本（用于tooltip）
const fullValueText = computed(() => {
  return `${displayValue.value}${displayUnit.value}`
})

// 数据有效性检查
const hasValidData = computed(() => {
  const data = processedData.value
  return data && Object.keys(data).length > 0
})

// 容器大小监听
const handleResize = (entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect
    containerSize.value = { width, height }
  }
}

// 生命周期
onMounted(() => {
  if (containerRef.value && config.value.autoResize !== false) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(containerRef.value)

    // 初始化尺寸
    const rect = containerRef.value.getBoundingClientRect()
    containerSize.value = { width: rect.width, height: rect.height }
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

// 暴露属性供交互使用
exposeWhitelistedProperties()

// 监听配置变化
watch(() => config.value, (newConfig) => {
  logger.debug('配置已更新:', newConfig)
}, { deep: true })

// 监听数据变化
watch(() => displayData.value, (newData) => {
  logger.debug('数据已更新:', newData)
}, { deep: true })
</script>

<style scoped>
.digit-indicator {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 5%;
  box-sizing: border-box;
  background: var(--card-color);
  border-radius: var(--border-radius, 6px);
  position: relative;
  overflow: hidden;
}

.icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  flex-shrink: 0;
}

.indicator-icon {
  transition: all 0.3s ease;
}

.value-container {
  display: flex;
  justify-content: center;
  align-items: baseline;
  width: 100%;
  flex-grow: 1;
  min-height: 0;
}

.value-text {
  font-weight: bold;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
  line-height: 1.2;
  transition: all 0.3s ease;
}

.unit-text {
  margin-left: 0.2em;
  font-weight: normal;
  color: var(--text-color-2);
}

.title-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
  flex-shrink: 0;
}

.title-text {
  color: var(--text-color-2);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
  line-height: 1.4;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--text-color-3);
  font-size: 14px;
}

.empty-text {
  opacity: 0.6;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .digit-indicator {
    padding: 8px;
  }
}

/* 暗主题适配 */
[data-theme="dark"] .digit-indicator {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

/* 悬停效果 */
.digit-indicator:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

[data-theme="dark"] .digit-indicator:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}
</style>