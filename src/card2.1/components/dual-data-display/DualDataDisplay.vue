<script setup lang="ts">
/**
 * 双数据源显示组件
 * 纯数据展示组件，通过props接收数据，不再内部执行数据获取
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// 导入交互系统
import { interactionManager } from '@/card2.1/core/interaction-manager'
import type { InteractionConfig, InteractionEventType } from '@/card2.1/core/interaction-types'

// 组件props - 包含配置和数据
interface Props {
  componentId?: string
  dataSource1?: any // 第一个数据源的数据
  dataSource2?: any // 第二个数据源的数据
  config?: {
    title?: string
    displayMode?: string
    themeColor?: string
    dataSource1Config?: {
      title?: string
      unit?: string
      precision?: number
    }
    dataSource2Config?: {
      title?: string
      unit?: string
      precision?: number
    }
    interactions?: {
      enableClick?: boolean
      clickAction?: string
      refreshInterval?: number
      enableCache?: boolean
    }
    style?: {
      showBorder?: boolean
      backgroundOpacity?: number
      fontSize?: number
      padding?: number
    }
  }
  // 标准交互配置
  interactionConfigs?: InteractionConfig[]
}

const props = withDefaults(defineProps<Props>(), {
  componentId: '',
  dataSource1: null,
  dataSource2: null,
  config: () => ({})
})

// 组件事件定义
interface Emits {
  (e: 'click', data: { componentId: string; action: string; data: any }): void
  (e: 'refresh', componentId: string): void
  (e: 'interaction', data: { type: string; componentId: string; payload: any }): void
}

const emit = defineEmits<Emits>()

// 交互系统状态
const isInteractionEnabled = ref(false)
const registeredEvents = ref<Set<string>>(new Set())

// 🔥 响应式数据状态 - 简化为纯展示逻辑
const lastUpdateTime = ref<Date | null>(null)
const executionCount = ref(0)

// 显示用的格式化数据
const formatData = (data: any): string => {
  if (!data) return 'null'
  if (typeof data === 'string') return data
  return JSON.stringify(data, null, 2)
}

// 🔥 监听props数据变化 - 纯数据展示逻辑
watch(
  [() => props.dataSource1, () => props.dataSource2],
  ([newDataSource1, newDataSource2]) => {
    console.log('👁️ [DualDataDisplay] 接收到数据更新:', {
      componentId: props.componentId,
      dataSource1: newDataSource1,
      dataSource2: newDataSource2
    })
    console.log('🔍 [DualDataDisplay] 数据源1详细信息:', JSON.stringify(newDataSource1, null, 2))
    console.log('🔍 [DualDataDisplay] 数据源2详细信息:', JSON.stringify(newDataSource2, null, 2))

    // 更新时间戳和计数
    if (newDataSource1 !== null || newDataSource2 !== null) {
      lastUpdateTime.value = new Date()
      executionCount.value++
      console.log('✅ [DualDataDisplay] 数据已更新，时间:', lastUpdateTime.value)
      console.log(`🎯 [DualDataDisplay] 组件 ${props.componentId} 执行次数: ${executionCount.value}`)
    } else {
      console.log('⚠️ [DualDataDisplay] 两个数据源都为空')
    }
  },
  { deep: true }
)

// 🔥 计算属性：显示状态
const displayStatus = computed(() => {
  const hasData1 = props.dataSource1 !== null && props.dataSource1 !== undefined
  const hasData2 = props.dataSource2 !== null && props.dataSource2 !== undefined

  if (hasData1 && hasData2) {
    return '双数据源已加载'
  } else if (hasData1 || hasData2) {
    return '部分数据源已加载'
  } else {
    return '等待数据源...'
  }
})

// 计算属性：配置相关
const currentTitle = computed(() => props.config?.title || '双数据源显示测试组件')
const dataSource1Title = computed(() => props.config?.dataSource1Config?.title || '数据源1')
const dataSource2Title = computed(() => props.config?.dataSource2Config?.title || '数据源2')
const themeColor = computed(() => props.config?.themeColor || '#18a058')
const isClickEnabled = computed(() => props.config?.interactions?.enableClick || false)

// 交互方法
const handleComponentClick = () => {
  // 同时支持旧版交互和标准交互系统

  // 1. 旧版交互处理（向后兼容）
  if (isClickEnabled.value) {
    const clickAction = props.config?.interactions?.clickAction || 'none'

    // 发送点击事件
    emit('click', {
      componentId: props.componentId || '',
      action: clickAction,
      data: {
        dataSource1: props.dataSource1,
        dataSource2: props.dataSource2,
        timestamp: new Date().toISOString()
      }
    })

    // 根据配置的行为执行相应动作
    switch (clickAction) {
      case 'refresh':
        handleRefresh()
        break
      case 'details':
        showDetails()
        break
      case 'toggle':
        toggleDisplay()
        break
      default:
        break
    }
  }

  // 2. 标准交互系统处理
  if (props.componentId && isInteractionEnabled.value) {
    console.log('🔍 [DualDataDisplay] 触发标准交互系统点击事件:', props.componentId)

    // 触发标准交互系统的点击事件
    interactionManager.triggerEvent(props.componentId, 'click', {
      dataSource1: props.dataSource1,
      dataSource2: props.dataSource2,
      timestamp: new Date().toISOString(),
      position: { x: 0, y: 0 } // 可以后续添加真实鼠标位置
    })
  }

  // 发送通用交互事件（向后兼容）
  emit('interaction', {
    type: 'click',
    componentId: props.componentId || '',
    payload: {
      action: props.config?.interactions?.clickAction || 'none',
      timestamp: new Date().toISOString()
    }
  })
}

const handleRefresh = () => {
  console.log('🔄 [DualDataDisplay] 刷新数据请求:', props.componentId)
  emit('refresh', props.componentId || '')

  emit('interaction', {
    type: 'refresh',
    componentId: props.componentId || '',
    payload: {
      timestamp: new Date().toISOString()
    }
  })
}

const showDetails = () => {
  console.log('📋 [DualDataDisplay] 显示详情:', {
    componentId: props.componentId,
    dataSource1: props.dataSource1,
    dataSource2: props.dataSource2
  })

  emit('interaction', {
    type: 'show-details',
    componentId: props.componentId || '',
    payload: {
      dataSource1: props.dataSource1,
      dataSource2: props.dataSource2
    }
  })
}

const isToggled = ref(false)
const toggleDisplay = () => {
  isToggled.value = !isToggled.value
  console.log('🔄 [DualDataDisplay] 切换显示模式:', isToggled.value)

  emit('interaction', {
    type: 'toggle',
    componentId: props.componentId || '',
    payload: {
      toggled: isToggled.value,
      timestamp: new Date().toISOString()
    }
  })
}

// 格式化数值（支持精度配置）
const formatNumber = (value: any, precision: number = 2): string => {
  if (typeof value !== 'number') return String(value)
  return value.toFixed(precision)
}

// 提取数值用于显示
const extractDisplayValue = (data: any, config: any) => {
  if (!data) return null

  // 尝试提取数值字段
  if (typeof data === 'number') return data
  if (data.value !== undefined) return data.value
  if (data.reading !== undefined) return data.reading
  if (data.temperature !== undefined) return data.temperature
  if (data.humidity !== undefined) return data.humidity

  return data
}

// 标准交互系统初始化
const initializeInteractionSystem = () => {
  if (!props.componentId || !props.interactionConfigs?.length) {
    console.log('🔍 [DualDataDisplay] 跳过交互系统初始化：缺少componentId或配置')
    return
  }

  console.log('🔍 [DualDataDisplay] 初始化交互系统:', {
    componentId: props.componentId,
    configCount: props.interactionConfigs.length,
    configs: props.interactionConfigs.map(c => ({
      event: c.event,
      responsesCount: c.responses?.length || 0,
      enabled: c.enabled
    }))
  })

  // 注册组件到交互管理器
  interactionManager.registerComponent(props.componentId, props.interactionConfigs)
  isInteractionEnabled.value = true

  // 记录已注册的事件
  props.interactionConfigs.forEach(config => {
    if (config.enabled !== false) {
      registeredEvents.value.add(config.event)
    }
  })
}

// 清理交互系统资源
const cleanupInteractionSystem = () => {
  if (props.componentId && isInteractionEnabled.value) {
    console.log('🔍 [DualDataDisplay] 清理交互系统资源:', props.componentId)
    interactionManager.unregisterComponent(props.componentId)
    isInteractionEnabled.value = false
    registeredEvents.value.clear()
  }
}

// 处理悬停事件
const handleComponentHover = (isHovering: boolean) => {
  if (props.componentId && isInteractionEnabled.value && registeredEvents.value.has('hover')) {
    console.log('🔍 [DualDataDisplay] 触发悬停事件:', { componentId: props.componentId, isHovering })

    interactionManager.triggerEvent(props.componentId, 'hover', {
      isHovering,
      dataSource1: props.dataSource1,
      dataSource2: props.dataSource2,
      timestamp: new Date().toISOString()
    })
  }
}

// 监听数据变化，触发数据变化事件
watch(
  [() => props.dataSource1, () => props.dataSource2],
  ([newDataSource1, newDataSource2], [oldDataSource1, oldDataSource2]) => {
    if (props.componentId && isInteractionEnabled.value && registeredEvents.value.has('dataChange')) {
      console.log('🔍 [DualDataDisplay] 数据变化，触发数据变化事件:', {
        componentId: props.componentId,
        oldDataSource1,
        newDataSource1,
        oldDataSource2,
        newDataSource2
      })

      interactionManager.triggerEvent(props.componentId, 'dataChange', {
        oldValues: {
          dataSource1: oldDataSource1,
          dataSource2: oldDataSource2
        },
        newValues: {
          dataSource1: newDataSource1,
          dataSource2: newDataSource2
        },
        changedProperty: 'dataSource1', // 可以根据实际变化的字段进行优化
        timestamp: new Date().toISOString()
      })
    }
  },
  { deep: true }
)

// 组件生命周期管理
onMounted(() => {
  console.log('🔍 [DualDataDisplay] 组件挂载，初始化交互系统')
  initializeInteractionSystem()
})

onUnmounted(() => {
  console.log('🔍 [DualDataDisplay] 组件卸载，清理交互系统')
  cleanupInteractionSystem()
})

// 监听交互配置变化
watch(
  () => props.interactionConfigs,
  newConfigs => {
    if (newConfigs?.length) {
      console.log('🔍 [DualDataDisplay] 交互配置变化，重新初始化:', {
        configCount: newConfigs.length
      })

      // 清理旧配置
      cleanupInteractionSystem()

      // 初始化新配置
      initializeInteractionSystem()
    }
  },
  { deep: true }
)
</script>

<template>
  <div
    class="dual-data-display"
    :class="{
      clickable: isClickEnabled,
      toggled: isToggled,
      bordered: config?.style?.showBorder !== false
    }"
    :style="{
      '--theme-color': themeColor,
      '--font-size': `${config?.style?.fontSize || 14}px`,
      '--padding': `${config?.style?.padding || 16}px`,
      '--background-opacity': config?.style?.backgroundOpacity || 0.9
    }"
    @click="handleComponentClick"
    @mouseenter="handleComponentHover(true)"
    @mouseleave="handleComponentHover(false)"
  >
    <div class="header">
      <h3>{{ currentTitle }}</h3>
      <div class="status">
        <span class="status-text">{{ displayStatus }}</span>
        <span class="execution-count">执行次数: {{ executionCount }}</span>
        <span v-if="lastUpdateTime" class="last-update">最后更新: {{ lastUpdateTime.toLocaleTimeString() }}</span>
      </div>

      <!-- 交互控制按钮 -->
      <div v-if="isClickEnabled" class="interaction-controls">
        <button class="refresh-btn" title="刷新数据" @click.stop="handleRefresh">🔄</button>
        <button class="details-btn" title="显示详情" @click.stop="showDetails">📋</button>
        <button class="toggle-btn" title="切换显示" @click.stop="toggleDisplay">🔄</button>
      </div>
    </div>

    <div class="data-sections" :class="{ compact: isToggled }">
      <!-- 数据源1 -->
      <div class="data-section">
        <h4 :style="{ backgroundColor: themeColor }">
          {{ dataSource1Title }}
          <span v-if="config?.dataSource1Config?.unit" class="unit">({{ config.dataSource1Config.unit }})</span>
        </h4>
        <div class="data-content">
          <div v-if="props.dataSource1" class="data-display">
            <!-- 数值显示 -->
            <div v-if="extractDisplayValue(props.dataSource1, config?.dataSource1Config)" class="value-display">
              <span class="value">
                {{
                  formatNumber(
                    extractDisplayValue(props.dataSource1, config?.dataSource1Config),
                    config?.dataSource1Config?.precision || 2
                  )
                }}
              </span>
              <span v-if="config?.dataSource1Config?.unit" class="unit">
                {{ config.dataSource1Config.unit }}
              </span>
            </div>
            <!-- 完整数据 -->
            <pre class="raw-data">{{ formatData(props.dataSource1) }}</pre>
          </div>
          <div v-else class="no-data">等待数据...</div>
        </div>
      </div>

      <!-- 数据源2 -->
      <div class="data-section">
        <h4 :style="{ backgroundColor: themeColor }">
          {{ dataSource2Title }}
          <span v-if="config?.dataSource2Config?.unit" class="unit">({{ config.dataSource2Config.unit }})</span>
        </h4>
        <div class="data-content">
          <div v-if="props.dataSource2" class="data-display">
            <!-- 数值显示 -->
            <div v-if="extractDisplayValue(props.dataSource2, config?.dataSource2Config)" class="value-display">
              <span class="value">
                {{
                  formatNumber(
                    extractDisplayValue(props.dataSource2, config?.dataSource2Config),
                    config?.dataSource2Config?.precision || 2
                  )
                }}
              </span>
              <span v-if="config?.dataSource2Config?.unit" class="unit">
                {{ config.dataSource2Config.unit }}
              </span>
            </div>
            <!-- 完整数据 -->
            <pre class="raw-data">{{ formatData(props.dataSource2) }}</pre>
          </div>
          <div v-else class="no-data">等待数据...</div>
        </div>
      </div>
    </div>

    <!-- 组件信息 -->
    <div class="component-info">
      <small>组件ID: {{ props.componentId || '未设置' }}</small>
      <small v-if="isClickEnabled">| 交互已启用</small>
    </div>
  </div>
</template>

<style scoped>
.dual-data-display {
  padding: var(--padding, 16px);
  background: rgba(var(--card-color), var(--background-opacity, 0.9));
  border-radius: var(--border-radius);
  font-family: monospace;
  font-size: var(--font-size, 14px);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.dual-data-display.bordered {
  border: 1px solid var(--border-color);
}

.dual-data-display.clickable {
  cursor: pointer;
}

.dual-data-display.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dual-data-display.toggled {
  background: rgba(var(--theme-color), 0.1);
}

.header {
  margin-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: calc(var(--font-size, 14px) + 2px);
  font-weight: bold;
}

.status {
  display: flex;
  gap: 12px;
  font-size: calc(var(--font-size, 14px) - 2px);
  color: var(--text-color-2);
  flex-wrap: wrap;
}

.status .status-text {
  color: var(--theme-color, var(--primary-color));
  font-weight: 500;
}

/* 交互控制按钮 */
.interaction-controls {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.interaction-controls button {
  background: var(--theme-color, var(--primary-color));
  color: white;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.interaction-controls button:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.interaction-controls button:active {
  transform: scale(0.95);
}

.data-sections {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  transition: all 0.3s ease;
}

.data-sections.compact {
  grid-template-columns: 1fr;
  gap: 8px;
}

.data-section {
  background: var(--body-color);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.data-section h4 {
  margin: 0;
  padding: 8px 12px;
  background: var(--theme-color, var(--primary-color));
  color: white;
  font-size: calc(var(--font-size, 14px) - 2px);
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.data-section h4 .unit {
  font-size: calc(var(--font-size, 14px) - 4px);
  opacity: 0.8;
}

.data-content {
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.data-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 数值显示 */
.value-display {
  background: var(--theme-color, var(--primary-color));
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  text-align: center;
  font-weight: bold;
}

.value-display .value {
  font-size: calc(var(--font-size, 14px) + 4px);
  margin-right: 4px;
}

.value-display .unit {
  font-size: calc(var(--font-size, 14px) - 2px);
  opacity: 0.9;
}

/* 原始数据 */
.raw-data {
  margin: 0;
  font-size: calc(var(--font-size, 14px) - 3px);
  line-height: 1.4;
  color: var(--text-color);
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--body-color);
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.no-data {
  color: var(--text-color-3);
  font-style: italic;
  text-align: center;
  padding: 20px;
  font-size: calc(var(--font-size, 14px) - 2px);
}

.component-info {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  color: var(--text-color-3);
  font-size: calc(var(--font-size, 14px) - 4px);
  display: flex;
  gap: 8px;
}

/* 动画效果 */
@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}

.dual-data-display.clickable:active {
  transform: scale(0.98);
}

/* 响应式设计 */
@media (max-width: 600px) {
  .data-sections {
    grid-template-columns: 1fr !important;
    gap: 8px;
  }

  .status {
    flex-direction: column;
    gap: 4px;
  }

  .interaction-controls {
    justify-content: center;
  }
}
</style>
