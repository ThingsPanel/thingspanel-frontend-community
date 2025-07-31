<!--
  GridPro 渲染器主组件
  整合所有 GridPro 功能，提供统一的渲染器接口
-->

<template>
  <div class="gridpro-renderer" :class="rendererClasses">
    <!-- 主要内容区域 - 移除内置工具栏，遵循架构分离原则 -->
    <div class="gridpro-main">
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

    <!-- 高级性能监控组件 -->
    <PerformanceMonitor
      v-if="config.debug || config.performance?.enableMonitoring"
      :config="config"
      :item-count="items.length"
      :enabled="enableAdvancedMonitoring"
      @config-update="handlePerformanceConfigUpdate"
    />

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

import GridProContainer from './components/GridProContainer.vue'
import PerformanceMonitor from './performance/PerformanceMonitor.vue'
import type { BaseCanvasItem } from '../../types/core'
import type { GridProConfig } from './types/gridpro'
import { createDefaultGridProConfig } from './types/gridpro'
import { createAdaptivePerformanceConfig } from './performance'

interface Props {
  items: BaseCanvasItem[]
  config?: Partial<GridProConfig>
  selectedItemIds?: Set<string>
  readonly?: boolean
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
  readonly: false
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
const showHelpTips = ref(false)
const enableAdvancedMonitoring = ref(false)

// 计算属性
const rendererClasses = computed(() => ({
  'gridpro-renderer--readonly': props.readonly,
  'gridpro-renderer--debug': config.debug,
  'gridpro-renderer--compact': config.layoutMode === 'compact'
}))

// 计算属性 - 移除工具栏相关逻辑

// 生命周期
onMounted(() => {
  // 检查是否是首次使用
  const hasShownTips = localStorage.getItem('gridpro-help-tips-dismissed')
  if (!hasShownTips && props.items.length === 0) {
    showHelpTips.value = true
  }

  // 应用自适应性能配置
  const adaptiveConfig = createAdaptivePerformanceConfig(config)
  Object.assign(config, adaptiveConfig)

  // 启用高级性能监控
  if (config.debug || config.performance?.enableMonitoring) {
    enableAdvancedMonitoring.value = true
  }
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

const handlePerformanceConfigUpdate = (configUpdate: Partial<GridProConfig>) => {
  Object.assign(config, configUpdate)
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

// 暴露方法给父组件 - 移除工具栏相关方法
defineExpose({
  addItem,
  removeItem,
  updateItem,
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

/* 移除工具栏样式 - 工具栏应由独立的工具栏组件实现 */

.gridpro-main {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
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

/* 响应式设计 - 移除工具栏相关样式 */
@media (max-width: 768px) {
  .gridpro-help-tips {
    width: calc(100% - 24px);
    left: 12px;
    bottom: 12px;
  }
}
</style>