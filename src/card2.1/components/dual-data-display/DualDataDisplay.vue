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
    themeColor?: string
    fontSize?: number
    showBorder?: boolean
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

// 简化的数据格式化函数 - 直接显示数据
const formatData = (data: any): string => {
  // 处理null、undefined
  console.log('🔍 [DualDataDisplay] formatData 被调用 - 详细分析:', {
    '输入data': data,
    'data类型': typeof data,
    'data为null': data === null,
    'data为undefined': data === undefined,
    'data完整结构': JSON.stringify(data, null, 2)
  })
  
  if (data === null || data === undefined) {
    console.log('⚠️ [DualDataDisplay] formatData 返回: 暂无数据')
    return '暂无数据'
  }

  // 直接转换为字符串显示，保持简单
  const result = JSON.stringify(data)
  console.log('✅ [DualDataDisplay] formatData 返回结果:', result)
  return result
}

// 🔥 监听props数据变化 - 纯数据展示逻辑
watch(
  [() => props.dataSource1, () => props.dataSource2],
  ([newDataSource1, newDataSource2], [oldDataSource1, oldDataSource2]) => {
    console.log('👁️ [DualDataDisplay] 数据变化监听器触发 - 详细分析:', {
      componentId: props.componentId,
      '变化前dataSource1': oldDataSource1,
      '变化后dataSource1': newDataSource1,
      '变化前dataSource2': oldDataSource2,
      '变化后dataSource2': newDataSource2,
      'dataSource1是否变化': oldDataSource1 !== newDataSource1,
      'dataSource2是否变化': oldDataSource2 !== newDataSource2,
      'dataSource1类型': typeof newDataSource1,
      'dataSource2类型': typeof newDataSource2,
      'dataSource1为null': newDataSource1 === null,
      'dataSource2为null': newDataSource2 === null,
      'dataSource1为undefined': newDataSource1 === undefined,
      'dataSource2为undefined': newDataSource2 === undefined
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
  // 更严格的数据检查：不仅检查null/undefined，还检查空对象
  const hasData1 = props.dataSource1 !== null &&
                   props.dataSource1 !== undefined &&
                   (typeof props.dataSource1 !== 'object' || Object.keys(props.dataSource1).length > 0)
  const hasData2 = props.dataSource2 !== null &&
                   props.dataSource2 !== undefined &&
                   (typeof props.dataSource2 !== 'object' || Object.keys(props.dataSource2).length > 0)

  console.log('🔍 [DualDataDisplay] 数据状态检查:', {
    dataSource1: props.dataSource1,
    dataSource2: props.dataSource2,
    hasData1,
    hasData2,
    dataSource1Type: typeof props.dataSource1,
    dataSource2Type: typeof props.dataSource2,
    dataSource1Keys: props.dataSource1 ? Object.keys(props.dataSource1) : [],
    dataSource2Keys: props.dataSource2 ? Object.keys(props.dataSource2) : []
  })

  if (hasData1 && hasData2) {
    return '双数据源已加载'
  } else if (hasData1 || hasData2) {
    return '部分数据源已加载'
  } else {
    return '等待数据源...'
  }
})

// 计算属性：配置相关 - 简化版
const currentTitle = computed(() => props.config?.title || '双数据源显示测试组件')
const themeColor = computed(() => props.config?.themeColor || '#18a058')
const fontSize = computed(() => props.config?.fontSize || 14)
const showBorder = computed(() => props.config?.showBorder ?? true)

// 交互方法
const handleComponentClick = () => {
  // 同时支持旧版交互和标准交互系统

  // 简化的点击处理
  console.log('🔍 [DualDataDisplay] 组件被点击:', props.componentId)

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

  // 发送简化的交互事件
  emit('interaction', {
    type: 'click',
    componentId: props.componentId || '',
    payload: { timestamp: new Date().toISOString() }
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
  console.log('🔍 [DualDataDisplay] 检查交互系统初始化条件:', {
    componentId: props.componentId,
    componentIdType: typeof props.componentId,
    componentIdLength: props.componentId?.length,
    interactionConfigs: props.interactionConfigs,
    interactionConfigsLength: props.interactionConfigs?.length,
    hasInteractionConfigs: !!props.interactionConfigs?.length
  })

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
      bordered: showBorder,
      toggled: isToggled
    }"
    :style="{
      '--theme-color': themeColor,
      '--font-size': `${fontSize}px`
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

      <!-- 简化的控制按钮 -->
      <div class="interaction-controls">
        <button class="refresh-btn" title="刷新数据" @click.stop="handleRefresh">🔄</button>
      </div>
    </div>

    <div class="data-sections" :class="{ compact: isToggled }">
      <!-- 数据源1 -->
      <div class="data-section">
        <h4 :style="{ backgroundColor: themeColor }">数据源1</h4>
        <div class="data-content">
          <div v-if="props.dataSource1" class="data-display">
            <pre class="raw-data">{{ formatData(props.dataSource1) }}</pre>
          </div>
          <div v-else class="no-data">等待数据...</div>
        </div>
      </div>

      <!-- 数据源2 -->
      <div class="data-section">
        <h4 :style="{ backgroundColor: themeColor }">数据源2</h4>
        <div class="data-content">
          <div v-if="props.dataSource2" class="data-display">
            <pre class="raw-data">{{ formatData(props.dataSource2) }}</pre>
          </div>
          <div v-else class="no-data">等待数据...</div>
        </div>
      </div>
    </div>

    <!-- 组件信息 -->
    <div class="component-info">
      <small>组件ID: {{ props.componentId || '未设置' }}</small>
    </div>
  </div>
</template>

<style scoped>
.dual-data-display {
  padding: 16px;
  background: var(--card-color);
  border-radius: var(--border-radius);
  font-family: monospace;
  font-size: var(--font-size, 14px);
  height: 100%;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  cursor: pointer;
}

.dual-data-display.bordered {
  border: 1px solid var(--border-color);
}

.dual-data-display:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

/* 数值显示区域已简化 */

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
