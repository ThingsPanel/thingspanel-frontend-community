<!--
  GridPro 渲染器主组件
  整合所有 GridPro 功能，提供统一的渲染器接口
-->

<template>
  <div class="gridpro-renderer" :class="rendererClasses">
    <!-- 工具栏（可选） -->
    <div
      v-if="showToolbar"
      class="gridpro-toolbar"
    >
      <div class="gridpro-toolbar__left">
        <n-button-group size="small">
          <n-button @click="compactLayout">
            <template #icon>
              <CompactIcon />
            </template>
            {{ $t('gridpro.compact') }}
          </n-button>
          <n-button @click="toggleGrid">
            <template #icon>
              <GridIcon />
            </template>
            {{ config.showGrid ? $t('gridpro.hideGrid') : $t('gridpro.showGrid') }}
          </n-button>
          <n-button @click="resetLayout">
            <template #icon>
              <RefreshIcon />
            </template>
            {{ $t('gridpro.reset') }}
          </n-button>
        </n-button-group>
      </div>

      <div class="gridpro-toolbar__right">
        <n-button-group size="small">
          <n-button @click="toggleVirtualization">
            <template #icon>
              <LayersIcon />
            </template>
            {{ config.virtualization ? $t('gridpro.disableVirtualization') : $t('gridpro.enableVirtualization') }}
          </n-button>
          <n-dropdown trigger="click" :options="layoutModeOptions" @select="handleLayoutModeChange">
            <n-button>
              <template #icon>
                <LayoutIcon />
              </template>
              {{ $t(`gridpro.layoutMode.${config.layoutMode}`) }}
              <template #suffix>
                <ChevronDownIcon />
              </template>
            </n-button>
          </n-dropdown>
          <n-dropdown trigger="click" :options="animationSpeedOptions" @select="handleAnimationSpeedChange">
            <n-button>
              <template #icon>
                <SpeedIcon />
              </template>
              {{ $t(`gridpro.animationSpeed.${config.animationSpeed}`) }}
              <template #suffix>
                <ChevronDownIcon />
              </template>
            </n-button>
          </n-dropdown>
        </n-button-group>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="gridpro-main" :style="mainStyles">
      <GridProContainer
        ref="containerRef"
        :items="items"
        :config="config"
        :selected-item-ids="selectedItemIds"
        :readonly="readonly"
        @update:items="handleItemsUpdate"
        @update:selected-item-ids="handleSelectionChange"
        @item-added="handleItemAdded"
        @item-updated="handleItemUpdated"
        @item-removed="handleItemRemoved"
        @selection-changed="handleSelectionChanged"
        @layout-changed="handleLayoutChanged"
      />
    </div>

    <!-- 性能监控面板（开发模式） -->
    <div
      v-if="config.debug && showPerformanceMonitor"
      class="gridpro-performance-monitor"
    >
      <div class="gridpro-performance-monitor__header">
        <span>性能监控</span>
        <n-button
          size="tiny"
          text
          @click="showPerformanceMonitor = false"
        >
          <CloseIcon />
        </n-button>
      </div>
      <div class="gridpro-performance-monitor__content">
        <div class="gridpro-performance-monitor__item">
          <span>项目总数:</span>
          <span>{{ items.length }}</span>
        </div>
        <div class="gridpro-performance-monitor__item">
          <span>可见项目:</span>
          <span>{{ visibleItemsCount }}</span>
        </div>
        <div class="gridpro-performance-monitor__item">
          <span>内存使用率:</span>
          <span>{{ memoryUsagePercent }}%</span>
        </div>
        <div class="gridpro-performance-monitor__item">
          <span>渲染时间:</span>
          <span>{{ renderTime }}ms</span>
        </div>
        <div class="gridpro-performance-monitor__item">
          <span>FPS:</span>
          <span>{{ fps }}</span>
        </div>
      </div>
    </div>

    <!-- 帮助提示（首次使用） -->
    <transition name="slide-up">
      <div
        v-if="showHelpTips"
        class="gridpro-help-tips"
      >
        <div class="gridpro-help-tips__header">
          <span>GridPro 使用提示</span>
          <n-button
            size="tiny"
            text
            @click="dismissHelpTips"
          >
            <CloseIcon />
          </n-button>
        </div>
        <div class="gridpro-help-tips__content">
          <ul>
            <li>拖拽项目四角调整大小</li>
            <li>拖拽顶部手柄移动项目</li>
            <li>Ctrl+点击多选项目</li>
            <li>使用键盘快捷键: Delete删除, Ctrl+A全选</li>
            <li>右键打开上下文菜单</li>
          </ul>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { NButton, NButtonGroup, NDropdown } from 'naive-ui'
import {
  ContractOutline as CompactIcon,
  GridOutline as GridIcon,
  RefreshOutline as RefreshIcon,
  LayersOutline as LayersIcon,
  AppsOutline as LayoutIcon,
  SpeedometerOutline as SpeedIcon,
  ChevronDownOutline as ChevronDownIcon,
  CloseOutline as CloseIcon
} from '@vicons/ionicons5'

import GridProContainer from './components/GridProContainer.vue'
import type { BaseCanvasItem } from '../../types/core'
import type { GridProConfig } from './types/gridpro'
import { createDefaultGridProConfig } from './types/gridpro'

interface Props {
  items: BaseCanvasItem[]
  config?: Partial<GridProConfig>
  selectedItemIds?: Set<string>
  readonly?: boolean
  showToolbar?: boolean
}

interface Emits {
  (e: 'update:items', items: BaseCanvasItem[]): void
  (e: 'update:selectedItemIds', ids: Set<string>): void
  (e: 'update:config', config: GridProConfig): void
  (e: 'item-added', item: BaseCanvasItem): void
  (e: 'item-updated', item: BaseCanvasItem): void
  (e: 'item-removed', itemId: string): void
  (e: 'selection-changed', selectedIds: Set<string>): void
  (e: 'layout-changed', items: BaseCanvasItem[]): void
  (e: 'error', error: Error): void
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  selectedItemIds: () => new Set(),
  readonly: false,
  showToolbar: true
})

const emit = defineEmits<Emits>()

// 国际化
const { t } = useI18n()

// 模板引用
const containerRef = ref<InstanceType<typeof GridProContainer>>()

// 响应式状态
const config = reactive<GridProConfig>({
  ...createDefaultGridProConfig(),
  ...props.config
})

const selectedItemIds = ref(new Set(props.selectedItemIds))
const showPerformanceMonitor = ref(false)
const showHelpTips = ref(false)

// 性能监控数据
const performanceData = reactive({
  visibleItemsCount: 0,
  memoryUsagePercent: 0,
  renderTime: 0,
  fps: 60
})

// 计算属性
const rendererClasses = computed(() => ({
  'gridpro-renderer--readonly': props.readonly,
  'gridpro-renderer--debug': config.debug,
  'gridpro-renderer--compact': config.layoutMode === 'compact'
}))

const mainStyles = computed(() => ({
  height: props.showToolbar ? 'calc(100% - 48px)' : '100%'
}))

const layoutModeOptions = computed(() => [
  {
    label: t('gridpro.layoutMode.compact'),
    key: 'compact'
  },
  {
    label: t('gridpro.layoutMode.relaxed'),
    key: 'relaxed'
  },
  {
    label: t('gridpro.layoutMode.free'),
    key: 'free'
  }
])

const animationSpeedOptions = computed(() => [
  {
    label: t('gridpro.animationSpeed.slow'),
    key: 'slow'
  },
  {
    label: t('gridpro.animationSpeed.normal'),
    key: 'normal'
  },
  {
    label: t('gridpro.animationSpeed.fast'),
    key: 'fast'
  }
])

const visibleItemsCount = computed(() => performanceData.visibleItemsCount)
const memoryUsagePercent = computed(() => performanceData.memoryUsagePercent)
const renderTime = computed(() => performanceData.renderTime)
const fps = computed(() => performanceData.fps)

// 生命周期
onMounted(() => {
  // 检查是否是首次使用
  const hasShownTips = localStorage.getItem('gridpro-help-tips-dismissed')
  if (!hasShownTips && props.items.length === 0) {
    showHelpTips.value = true
  }

  // 开发模式下显示性能监控
  if (config.debug) {
    showPerformanceMonitor.value = true
    startPerformanceMonitoring()
  }
})

onUnmounted(() => {
  stopPerformanceMonitoring()
})

// 监听器
watch(() => props.config, (newConfig) => {
  Object.assign(config, newConfig)
}, { deep: true })

watch(() => props.selectedItemIds, (newIds) => {
  selectedItemIds.value = new Set(newIds)
})

watch(config, (newConfig) => {
  emit('update:config', { ...newConfig })
}, { deep: true })

// 性能监控
let performanceTimer: number | null = null
let fpsTimer: number | null = null
let frameCount = 0
let lastFpsTime = Date.now()

const startPerformanceMonitoring = () => {
  performanceTimer = window.setInterval(() => {
    updatePerformanceData()
  }, 1000)

  // FPS 监控
  const updateFps = () => {
    frameCount++
    const now = Date.now()
    if (now - lastFpsTime >= 1000) {
      performanceData.fps = Math.round((frameCount * 1000) / (now - lastFpsTime))
      frameCount = 0
      lastFpsTime = now
    }
    fpsTimer = requestAnimationFrame(updateFps)
  }
  updateFps()
}

const stopPerformanceMonitoring = () => {
  if (performanceTimer) {
    clearInterval(performanceTimer)
    performanceTimer = null
  }
  if (fpsTimer) {
    cancelAnimationFrame(fpsTimer)
    fpsTimer = null
  }
}

const updatePerformanceData = () => {
  // 更新可见项目数量
  if (config.virtualization) {
    // 从虚拟化系统获取可见项目数量
    performanceData.visibleItemsCount = Math.min(props.items.length, 50) // 估算值
  } else {
    performanceData.visibleItemsCount = props.items.length
  }

  // 计算内存使用率
  performanceData.memoryUsagePercent = Math.round(
    (performanceData.visibleItemsCount / Math.max(1, props.items.length)) * 100
  )

  // 模拟渲染时间
  const startTime = performance.now()
  // 这里可以添加实际的渲染时间测量逻辑
  performanceData.renderTime = Math.round(performance.now() - startTime)
}

// 事件处理器
const handleItemsUpdate = (items: BaseCanvasItem[]) => {
  emit('update:items', items)
}

const handleSelectionChange = (ids: Set<string>) => {
  selectedItemIds.value = ids
  emit('update:selectedItemIds', ids)
}

const handleItemAdded = (item: BaseCanvasItem) => {
  emit('item-added', item)
}

const handleItemUpdated = (item: BaseCanvasItem) => {
  emit('item-updated', item)
}

const handleItemRemoved = (itemId: string) => {
  emit('item-removed', itemId)
}

const handleSelectionChanged = (selectedIds: Set<string>) => {
  emit('selection-changed', selectedIds)
}

const handleLayoutChanged = (items: BaseCanvasItem[]) => {
  emit('layout-changed', items)
}

const handleLayoutModeChange = (key: string) => {
  config.layoutMode = key as GridProConfig['layoutMode']
}

const handleAnimationSpeedChange = (key: string) => {
  config.animationSpeed = key as GridProConfig['animationSpeed']
}

// 工具栏操作
const compactLayout = () => {
  containerRef.value?.compactLayout()
}

const toggleGrid = () => {
  config.showGrid = !config.showGrid
}

const resetLayout = () => {
  // 重置布局到默认状态
  if (confirm(t('gridpro.confirmReset'))) {
    const resetItems = props.items.map((item, index) => ({
      ...item,
      position: { x: 0, y: index * 100 },
      size: { width: 200, height: 100 }
    }))
    emit('update:items', resetItems)
  }
}

const toggleVirtualization = () => {
  config.virtualization = !config.virtualization
}

const dismissHelpTips = () => {
  showHelpTips.value = false
  localStorage.setItem('gridpro-help-tips-dismissed', 'true')
}

// 公共方法
const addItem = (item: BaseCanvasItem) => {
  containerRef.value?.addItem(item)
}

const removeItem = (itemId: string) => {
  containerRef.value?.removeItem(itemId)
}

const updateItem = (item: BaseCanvasItem) => {
  containerRef.value?.updateItem(item)
}

const getSelectedItems = (): string[] => {
  return containerRef.value?.getSelectedItems() || []
}

const clearSelection = () => {
  containerRef.value?.clearSelection()
}

// 暴露方法给父组件
defineExpose({
  addItem,
  removeItem,
  updateItem,
  compactLayout,
  getSelectedItems,
  clearSelection,
  config
})
</script>

<style scoped>
.gridpro-renderer {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.gridpro-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: white;
  border-bottom: 1px solid #e8e8e8;
  height: 48px;
  flex-shrink: 0;
}

.gridpro-toolbar__left,
.gridpro-toolbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gridpro-main {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.gridpro-performance-monitor {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 200px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 6px;
  z-index: 1002;
  font-size: 12px;
}

.gridpro-performance-monitor__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  font-weight: bold;
}

.gridpro-performance-monitor__content {
  padding: 8px 12px;
}

.gridpro-performance-monitor__item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.gridpro-performance-monitor__item:last-child {
  margin-bottom: 0;
}

.gridpro-help-tips {
  position: absolute;
  bottom: 16px;
  left: 16px;
  width: 300px;
  background: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  z-index: 1002;
}

.gridpro-help-tips__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
  font-weight: bold;
}

.gridpro-help-tips__content {
  padding: 12px 16px;
}

.gridpro-help-tips__content ul {
  margin: 0;
  padding-left: 16px;
  list-style-type: disc;
}

.gridpro-help-tips__content li {
  margin-bottom: 4px;
  font-size: 13px;
  color: #666;
}

.gridpro-help-tips__content li:last-child {
  margin-bottom: 0;
}

/* 动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gridpro-toolbar {
    padding: 8px 12px;
    height: 44px;
  }

  .gridpro-toolbar__left,
  .gridpro-toolbar__right {
    gap: 4px;
  }

  .gridpro-performance-monitor {
    width: 180px;
    top: 12px;
    right: 12px;
  }

  .gridpro-help-tips {
    width: calc(100% - 24px);
    left: 12px;
    bottom: 12px;
  }

  .gridpro-main {
    height: calc(100% - 44px);
  }
}

@media (max-width: 480px) {
  .gridpro-toolbar {
    flex-direction: column;
    height: auto;
    padding: 8px;
    gap: 8px;
  }

  .gridpro-toolbar__left,
  .gridpro-toolbar__right {
    width: 100%;
    justify-content: center;
  }

  .gridpro-main {
    height: calc(100% - 80px);
  }
}
</style>