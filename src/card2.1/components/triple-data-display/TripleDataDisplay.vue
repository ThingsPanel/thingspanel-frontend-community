<script setup lang="ts">
/**
 * 三数据源显示组件
 * 展示三个独立数据源的综合组件
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// 导入交互系统
import { interactionManager } from '@/card2.1/core/interaction-manager'
import type { InteractionConfig, InteractionEventType } from '@/card2.1/core/interaction-types'

// 组件props - 包含三个数据源和配置
interface Props {
  componentId?: string
  dataSource1?: any // 第一个数据源
  dataSource2?: any // 第二个数据源
  dataSource3?: any // 第三个数据源
  config?: {
    title?: string
    themeColor?: string
    fontSize?: number
    showBorder?: boolean
    layout?: 'grid' | 'horizontal' | 'vertical'
  }
  // 标准交互配置
  interactionConfigs?: InteractionConfig[]
}

const props = withDefaults(defineProps<Props>(), {
  componentId: '',
  dataSource1: null,
  dataSource2: null,
  dataSource3: null,
  config: () => ({})
})

// 组件事件定义
interface Emits {
  (e: 'click', data: { componentId: string; dataSource: string; data: any }): void
  (e: 'refresh', componentId: string): void
  (e: 'interaction', data: { type: string; componentId: string; payload: any }): void
}

const emit = defineEmits<Emits>()

// 交互系统状态
const isInteractionEnabled = ref(false)
const registeredEvents = ref<Set<string>>(new Set())

// 响应式数据状态
const lastUpdateTime = ref<Date | null>(null)
const executionCount = ref(0)

// 格式化数据显示
const formatData = (data: any): string => {
  if (!data) return 'null'
  if (typeof data === 'string') return data
  return JSON.stringify(data, null, 2)
}

// 监听数据变化
watch(
  [() => props.dataSource1, () => props.dataSource2, () => props.dataSource3],
  ([newDataSource1, newDataSource2, newDataSource3]) => {
    console.log('👁️ [TripleDataDisplay] 接收到数据更新:', {
      componentId: props.componentId,
      dataSource1: newDataSource1,
      dataSource2: newDataSource2,
      dataSource3: newDataSource3
    })

    // 更新时间戳和计数
    if (newDataSource1 !== null || newDataSource2 !== null || newDataSource3 !== null) {
      lastUpdateTime.value = new Date()
      executionCount.value++
      console.log('✅ [TripleDataDisplay] 数据已更新，时间:', lastUpdateTime.value)
    }
  },
  { deep: true }
)

// 计算属性：配置相关
const currentTitle = computed(() => props.config?.title || '三数据源综合显示')
const themeColor = computed(() => props.config?.themeColor || '#f0a020')
const fontSize = computed(() => props.config?.fontSize || 14)
const showBorder = computed(() => props.config?.showBorder ?? true)
const layout = computed(() => props.config?.layout || 'grid')

// 计算属性：显示状态
const displayStatus = computed(() => {
  const hasData1 = props.dataSource1 !== null && props.dataSource1 !== undefined
  const hasData2 = props.dataSource2 !== null && props.dataSource2 !== undefined
  const hasData3 = props.dataSource3 !== null && props.dataSource3 !== undefined
  const dataCount = [hasData1, hasData2, hasData3].filter(Boolean).length

  if (dataCount === 3) {
    return '三数据源全部就绪'
  } else if (dataCount > 0) {
    return `部分数据源就绪 (${dataCount}/3)`
  } else {
    return '等待数据源...'
  }
})

// 获取数据源状态样式
const getDataSourceStatus = (dataSource: any) => {
  if (dataSource !== null && dataSource !== undefined) {
    return { class: 'status-active', text: '数据已加载' }
  }
  return { class: 'status-waiting', text: '等待数据...' }
}

// 交互方法
const handleComponentClick = (dataSourceName?: string) => {
  console.log('🔍 [TripleDataDisplay] 组件被点击:', props.componentId, dataSourceName)

  // 发送点击事件
  emit('click', {
    componentId: props.componentId || '',
    dataSource: dataSourceName || 'all',
    data: {
      dataSource1: props.dataSource1,
      dataSource2: props.dataSource2,
      dataSource3: props.dataSource3,
      timestamp: new Date().toISOString()
    }
  })

  // 标准交互系统处理
  if (props.componentId && isInteractionEnabled.value) {
    interactionManager.triggerEvent(props.componentId, 'click', {
      dataSource1: props.dataSource1,
      dataSource2: props.dataSource2,
      dataSource3: props.dataSource3,
      clickedDataSource: dataSourceName,
      timestamp: new Date().toISOString()
    })
  }

  // 发送交互事件
  emit('interaction', {
    type: 'click',
    componentId: props.componentId || '',
    payload: {
      dataSource: dataSourceName,
      timestamp: new Date().toISOString()
    }
  })
}

const handleRefresh = () => {
  console.log('🔄 [TripleDataDisplay] 刷新数据请求:', props.componentId)
  emit('refresh', props.componentId || '')

  emit('interaction', {
    type: 'refresh',
    componentId: props.componentId || '',
    payload: { timestamp: new Date().toISOString() }
  })
}

// 标准交互系统初始化
const initializeInteractionSystem = () => {
  if (!props.componentId || !props.interactionConfigs?.length) return

  console.log('🔍 [TripleDataDisplay] 初始化交互系统:', props.componentId)

  interactionManager.registerComponent(props.componentId, props.interactionConfigs)
  isInteractionEnabled.value = true

  props.interactionConfigs.forEach(config => {
    if (config.enabled !== false) {
      registeredEvents.value.add(config.event)
    }
  })
}

// 清理交互系统资源
const cleanupInteractionSystem = () => {
  if (props.componentId && isInteractionEnabled.value) {
    console.log('🔍 [TripleDataDisplay] 清理交互系统资源:', props.componentId)
    interactionManager.unregisterComponent(props.componentId)
    isInteractionEnabled.value = false
    registeredEvents.value.clear()
  }
}

// 处理悬停事件
const handleComponentHover = (isHovering: boolean) => {
  if (props.componentId && isInteractionEnabled.value && registeredEvents.value.has('hover')) {
    interactionManager.triggerEvent(props.componentId, 'hover', {
      isHovering,
      dataSource1: props.dataSource1,
      dataSource2: props.dataSource2,
      dataSource3: props.dataSource3,
      timestamp: new Date().toISOString()
    })
  }
}

// 组件生命周期管理
onMounted(() => {
  console.log('🔍 [TripleDataDisplay] 组件挂载，初始化交互系统')
  initializeInteractionSystem()
})

onUnmounted(() => {
  console.log('🔍 [TripleDataDisplay] 组件卸载，清理交互系统')
  cleanupInteractionSystem()
})

// 监听交互配置变化
watch(
  () => props.interactionConfigs,
  newConfigs => {
    if (newConfigs?.length) {
      console.log('🔍 [TripleDataDisplay] 交互配置变化，重新初始化')
      cleanupInteractionSystem()
      initializeInteractionSystem()
    }
  },
  { deep: true }
)
</script>

<template>
  <div
    class="triple-data-display"
    :class="{
      bordered: showBorder,
      [`layout-${layout}`]: true
    }"
    :style="{
      '--theme-color': themeColor,
      '--font-size': `${fontSize}px`
    }"
    @click="handleComponentClick()"
    @mouseenter="handleComponentHover(true)"
    @mouseleave="handleComponentHover(false)"
  >
    <div class="header">
      <div class="title-section">
        <h3>{{ currentTitle }}</h3>
        <div class="status">
          <span class="status-text">{{ displayStatus }}</span>
          <span class="execution-count">执行次数: {{ executionCount }}</span>
          <span v-if="lastUpdateTime" class="last-update">最后更新: {{ lastUpdateTime.toLocaleTimeString() }}</span>
        </div>
      </div>

      <!-- 控制按钮 -->
      <div class="controls">
        <button class="refresh-btn" title="刷新所有数据" @click.stop="handleRefresh">🔄</button>
      </div>
    </div>

    <div class="data-container" :class="`layout-${layout}`">
      <!-- 数据源1 -->
      <div class="data-source-panel" @click.stop="handleComponentClick('dataSource1')">
        <div class="panel-header">
          <h4 :style="{ color: themeColor }">数据源1</h4>
          <span :class="getDataSourceStatus(props.dataSource1).class">
            {{ getDataSourceStatus(props.dataSource1).text }}
          </span>
        </div>
        <div class="panel-content">
          <div v-if="props.dataSource1" class="data-display">
            <pre class="raw-data">{{ formatData(props.dataSource1) }}</pre>
          </div>
          <div v-else class="no-data">点击加载数据...</div>
        </div>
      </div>

      <!-- 数据源2 -->
      <div class="data-source-panel" @click.stop="handleComponentClick('dataSource2')">
        <div class="panel-header">
          <h4 :style="{ color: themeColor }">数据源2</h4>
          <span :class="getDataSourceStatus(props.dataSource2).class">
            {{ getDataSourceStatus(props.dataSource2).text }}
          </span>
        </div>
        <div class="panel-content">
          <div v-if="props.dataSource2" class="data-display">
            <pre class="raw-data">{{ formatData(props.dataSource2) }}</pre>
          </div>
          <div v-else class="no-data">点击加载数据...</div>
        </div>
      </div>

      <!-- 数据源3 -->
      <div class="data-source-panel" @click.stop="handleComponentClick('dataSource3')">
        <div class="panel-header">
          <h4 :style="{ color: themeColor }">数据源3</h4>
          <span :class="getDataSourceStatus(props.dataSource3).class">
            {{ getDataSourceStatus(props.dataSource3).text }}
          </span>
        </div>
        <div class="panel-content">
          <div v-if="props.dataSource3" class="data-display">
            <pre class="raw-data">{{ formatData(props.dataSource3) }}</pre>
          </div>
          <div v-else class="no-data">点击加载数据...</div>
        </div>
      </div>
    </div>

    <!-- 组件信息 -->
    <div class="component-info">
      <small>组件ID: {{ props.componentId || '未设置' }} | 布局模式: {{ layout }}</small>
    </div>
  </div>
</template>

<style scoped>
.triple-data-display {
  padding: 16px;
  background: var(--card-color);
  border-radius: var(--border-radius);
  font-family: monospace;
  font-size: var(--font-size, 14px);
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s ease;
}

.triple-data-display.bordered {
  border: 1px solid var(--border-color);
}

.triple-data-display:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--theme-color);
}

.title-section h3 {
  margin: 0 0 8px 0;
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

.controls {
  display: flex;
  gap: 8px;
}

.controls button {
  background: var(--theme-color, var(--primary-color));
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.controls button:hover {
  opacity: 0.8;
  transform: scale(1.05);
}

.data-container {
  flex: 1;
  display: grid;
  gap: 12px;
  min-height: 0;
}

/* 网格布局 (默认) */
.data-container.layout-grid {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
}

.data-container.layout-grid .data-source-panel:last-child {
  grid-column: 1 / -1;
}

/* 水平布局 */
.data-container.layout-horizontal {
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: 1fr;
}

/* 垂直布局 */
.data-container.layout-vertical {
  grid-template-columns: 1fr;
  grid-template-rows: 1fr 1fr 1fr;
}

.data-source-panel {
  background: var(--body-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.data-source-panel:hover {
  border-color: var(--theme-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--theme-color);
  color: white;
}

.panel-header h4 {
  margin: 0;
  font-size: calc(var(--font-size, 14px) - 1px);
  font-weight: bold;
  color: white !important;
}

.status-active {
  color: #52c41a !important;
  font-weight: bold;
}

.status-waiting {
  color: #faad14 !important;
  font-style: italic;
}

.panel-content {
  flex: 1;
  padding: 12px;
  overflow: hidden;
}

.data-display {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.raw-data {
  margin: 0;
  font-size: calc(var(--font-size, 14px) - 2px);
  line-height: 1.4;
  color: var(--text-color);
  white-space: pre-wrap;
  word-break: break-word;
  background: var(--card-color);
  padding: 8px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  overflow-y: auto;
  flex: 1;
}

.no-data {
  color: var(--text-color-3);
  font-style: italic;
  text-align: center;
  padding: 20px;
  font-size: calc(var(--font-size, 14px) - 1px);
}

.component-info {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--border-color);
  color: var(--text-color-3);
  font-size: calc(var(--font-size, 14px) - 3px);
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-container.layout-horizontal,
  .data-container.layout-grid {
    grid-template-columns: 1fr !important;
    grid-template-rows: auto auto auto !important;
  }

  .data-container.layout-grid .data-source-panel:last-child {
    grid-column: 1 !important;
  }

  .header {
    flex-direction: column;
    gap: 12px;
  }

  .status {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
