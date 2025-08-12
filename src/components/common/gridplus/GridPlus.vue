<template>
  <div ref="gridPlusContainer" class="grid-plus-container" :class="{ 'grid-plus-readonly': readonly }">
    <!-- GridStack 容器 -->
    <div ref="gridStackContainer" class="grid-stack"></div>

    <!-- 网格信息显示 -->
    <div v-if="showGridInfo" class="grid-plus-grid-info">
      <span>{{ gridInfo }}</span>
    </div>

    <!-- 使用 Teleport 将插槽内容注入到 GridStack 创建的网格项中 -->
    <template v-for="item in items" :key="item.id">
      <teleport v-if="isMounted" :to="`#grid-plus-slot-${item.id}`">
        <slot name="default" :item="item"></slot>
      </teleport>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch, computed, nextTick } from 'vue'
import type { GridStack, GridStackOptions, GridStackWidget } from 'gridstack'
import { useGridStack } from './useGridStack'

// 定义组件的 props
const props = withDefaults(
  defineProps<{
    items: GridStackWidget[]
    config?: GridStackOptions
    readonly?: boolean
    showGridInfo?: boolean
    enableCompactLayout?: boolean
  }>(),
  {
    items: () => [],
    config: () => ({}),
    readonly: false,
    showGridInfo: false,
    enableCompactLayout: true
  }
)

// 定义组件的 emits
const emit = defineEmits(['change', 'added', 'removed', 'dragstop', 'resizestop'])

// 响应式状态
const gridStackContainer = ref<HTMLElement | null>(null)
const isMounted = ref(false)

/**
 * @description 创建一个用作 Teleport 目标的 DOM 元素
 * @param item 网格项数据
 * @returns 一个带有唯一 ID 和类名的 div 元素
 */
const createItemContent = (item: GridStackWidget): HTMLElement => {
  const slotContainer = document.createElement('div')
  slotContainer.id = `grid-plus-slot-${item.id}`
  slotContainer.className = 'grid-plus-slot-container' // 添加一个类名，便于样式控制
  return slotContainer
}

// 使用自定义 Hook
const { gridStack, initGrid, destroyGrid, getItems, compact, addItem, removeItem, updateItem } = useGridStack(
  gridStackContainer,
  props,
  emit,
  createItemContent // 传递创建 Teleport 目标的函数
)

// 计算属性
const gridInfo = computed(() => {
  if (!gridStack.value) return ''
  const column = gridStack.value.getColumn()
  const cellHeight = gridStack.value.getCellHeight()
  return `C: ${column} | H: ${cellHeight}px`
})

// 暴露给父组件的方法
defineExpose({
  getGrid: () => gridStack.value as GridStack,
  getItems,
  compact,
  addItem,
  removeItem,
  updateItem
})

// 监听布局变化并自动紧凑
if (props.enableCompactLayout) {
  watch(
    () => props.items,
    () => {
      nextTick(() => {
        compact()
      })
    },
    { deep: true }
  )
}

// 生命周期钩子
onMounted(() => {
  initGrid()
  // 确保 DOM 准备好后再激活 Teleport
  isMounted.value = true
})

onBeforeUnmount(() => {
  destroyGrid()
})
</script>

<style lang="scss" scoped>
.grid-plus-container {
  position: relative;
  width: 100%;
  min-height: 200px;
  background-color: var(--grid-plus-bg-color, #f8f9fa);
}

.grid-stack {
  width: 100%;
  min-height: 200px;
}

.grid-plus-grid-info {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 1001;
}

/* GridStack 项目样式覆盖 */
:deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #fff);
  border: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  border-radius: 8px;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
  overflow: visible; /* 改为 visible 以显示调整大小的手柄 */
}

:deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.15));
}

:deep(.grid-stack-item.ui-draggable-dragging),
:deep(.grid-stack-item.ui-resizable-resizing) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item-content) {
  padding: 0; /* 移除 GridStack 的默认内边距 */
  height: 100%;
  width: 100%;
  display: flex; /* 确保插槽容器能撑满 */
}

:deep(.grid-plus-slot-container) {
  height: 100%;
  width: 100%;
}

/* 状态类 */
.grid-plus-readonly :deep(.grid-stack-item) {
  cursor: default;
}

.grid-plus-readonly :deep(.grid-stack-item:hover) {
  transform: none;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
}

.grid-plus-readonly :deep(.ui-resizable-handle) {
  display: none;
}

/* 主题变量 */
:root {
  --grid-plus-bg-color: #f8f9fa;
  --grid-plus-item-bg-color: #fff;
  --grid-plus-item-border-color: #e1e5e9;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

[data-theme='dark'] {
  --grid-plus-bg-color: #1a1a1a;
  --grid-plus-item-bg-color: #2d2d2d;
  --grid-plus-item-border-color: #404040;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}
</style>
