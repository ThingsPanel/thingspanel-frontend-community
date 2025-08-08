<template>
  <div
    ref="containerRef"
    class="grid-plus-container"
    :class="[
      containerClass,
      {
        'grid-plus-readonly': readonly,
        'grid-plus-show-grid': showGrid
      }
    ]"
    :style="containerStyles"
  >
    <!-- GridStack 容器 -->
    <div ref="gridStackRef" class="grid-stack"></div>

    <!-- 网格信息 -->
    <div v-if="showGrid" class="grid-plus-grid-info">
      <span>{{ computedConfig.column }}列 × {{ gridRowCount }}行</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { GridStack } from 'gridstack'
import 'gridstack/dist/gridstack.min.css'
import type { GridItem, GridConfig, GridProps, GridEmits } from './types'
import { DEFAULT_CONFIG, LIGHT_THEME, DARK_THEME } from './types'

// Props 定义
const props = withDefaults(defineProps<GridProps>(), {
  items: () => [],
  readonly: false,
  showGrid: false,
  showTitle: true,
  config: () => ({}),
  containerStyle: () => ({}),
  containerClass: '',
  theme: 'auto',
  enableDragPreview: true,
  enableResizePreview: true,
  enableCollisionDetection: true,
  enableCompactLayout: true
})

// Emits 定义
const emit = defineEmits<GridEmits>()

// 响应式状态
const containerRef = ref<HTMLElement | null>(null)
const gridStackRef = ref<HTMLElement | null>(null)
const gridStack = ref<GridStack | null>(null)
const gridRowCount = ref(0)
const isUpdatingFromEvent = ref(false)
const isRecreating = ref(false)
const retryCount = ref(0)
const maxRetries = 10

// 计算属性
const computedConfig = computed<GridConfig>(() => {
  const config = { ...DEFAULT_CONFIG, ...props.config }

  // 根据 readonly 状态调整配置
  if (props.readonly) {
    config.disableDrag = true
    config.disableResize = true
  } else {
    // 确保在非只读模式下启用拖拽和调整大小
    config.disableDrag = false
    config.disableResize = false
  }

  return config
})

const currentTheme = computed(() => {
  if (props.theme === 'auto') {
    // 检查当前页面的主题
    const isDark =
      document.documentElement.getAttribute('data-theme') === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches
    return isDark ? DARK_THEME : LIGHT_THEME
  }
  return props.theme === 'dark' ? DARK_THEME : LIGHT_THEME
})

const containerStyles = computed(() => ({
  ...props.containerStyle,
  backgroundColor: currentTheme.value.backgroundColor
}))

// 工具函数
const isContainerReady = (): boolean => {
  if (!gridStackRef.value) {
    console.log('Container ref is null')
    return false
  }

  const element = gridStackRef.value
  const rect = element.getBoundingClientRect()

  // 简化检查逻辑，只要容器存在且有基本尺寸即可
  const isReady = rect.width > 0 || element.offsetWidth > 0 || element.clientWidth > 0

  console.log(
    'Container ready:',
    isReady,
    'rect:',
    rect.width,
    'offset:',
    element.offsetWidth,
    'client:',
    element.clientWidth
  )
  return isReady
}

const createItemContent = (item: GridItem): string => {
  const header =
    props.showTitle && item.title
      ? `<div class="grid-plus-item-header">
         <span class="grid-plus-item-title">${item.title}</span>
         <div class="grid-plus-item-actions">
           <span class="grid-plus-item-position">${item.x},${item.y}</span>
         </div>
       </div>`
      : ''

  const content = `<div class="grid-plus-item-content">
    <div class="grid-plus-item-placeholder">
      ${item.title || `项目 ${item.id}`}
    </div>
  </div>`

  return `<div class="grid-plus-item" data-item-id="${item.id}">
    ${header}
    ${content}
  </div>`
}

const updateGridRowCount = () => {
  if (gridStack.value) {
    const nodes = gridStack.value.getGridItems()
    const maxY = Math.max(
      ...nodes.map(node => {
        const nodeAny = node as any
        const element = nodeAny.el || nodeAny
        const y = parseInt(element.getAttribute('gs-y') || '0', 10)
        const h = parseInt(element.getAttribute('gs-h') || '1', 10)
        return y + h
      })
    )
    gridRowCount.value = maxY
  }
}

const getCurrentItems = (): GridItem[] => {
  if (!gridStack.value) return []

  const nodes = gridStack.value.getGridItems()
  console.log('GridPlus getCurrentItems: GridStack has', nodes.length, 'nodes')
  console.log(
    'Props items:',
    props.items.map(i => ({ id: i.id, title: i.title }))
  )

  const items = nodes
    .map(node => {
      const nodeAny = node as any
      console.log('Processing node:', nodeAny)

      // 直接获取 DOM 元素
      const element = nodeAny.el || nodeAny

      // 从 DOM 元素的 gs-id 属性获取 ID
      const itemId = element.getAttribute('gs-id')

      if (!itemId) {
        console.log('Node has no gs-id, skipping')
        return null
      }

      // 获取位置和大小信息 - 从 DOM 元素的属性获取
      const x = parseInt(element.getAttribute('gs-x') || '0', 10)
      const y = parseInt(element.getAttribute('gs-y') || '0', 10)
      const w = parseInt(element.getAttribute('gs-w') || '1', 10)
      const h = parseInt(element.getAttribute('gs-h') || '1', 10)

      // 直接使用 GridStack 的数据，不依赖 props.items
      const result = {
        id: itemId,
        x: x,
        y: y,
        w: w,
        h: h,
        title: `项目 ${itemId}`,
        // 尝试从 props.items 中获取其他属性
        ...props.items.find(i => i.id === itemId)
      }

      console.log('Returning item:', result.id, result.title, 'at', result.x, result.y)
      return result
    })
    .filter(Boolean) as GridItem[]

  console.log('GridPlus getCurrentItems: returning', items.length, 'items')
  return items
}

const updateLayout = (newItems: GridItem[]) => {
  console.log('GridPlus updateLayout:', newItems.length, 'items')

  // 如果正在重新创建实例，跳过事件触发
  if (isRecreating.value) {
    console.log('Skipping updateLayout during recreation')
    return
  }

  isUpdatingFromEvent.value = true
  emit('layout-change', newItems)
  emit('update:items', newItems)
  nextTick(() => {
    isUpdatingFromEvent.value = false
  })
}

// GridStack 事件处理
const setupGridStackEvents = () => {
  if (!gridStack.value) return

  // 拖拽开始
  gridStack.value.on('dragstart', (event: Event) => {
    const target = event.target as HTMLElement
    const itemId = target.getAttribute('gs-id')
    if (itemId) {
      emit('drag-start', itemId)
    }
  })

  // 拖拽结束
  gridStack.value.on('dragstop', (event: Event, ui: any) => {
    const target = event.target as HTMLElement
    const itemId = target.getAttribute('gs-id')
    if (itemId) {
      emit('drag-end', itemId)
      updateGridRowCount()
      updateLayout(getCurrentItems())
    }
  })

  // 调整大小开始
  gridStack.value.on('resizestart', (event: Event) => {
    const target = event.target as HTMLElement
    const itemId = target.getAttribute('gs-id')
    if (itemId) {
      emit('resize-start', itemId)
    }
  })

  // 调整大小结束
  gridStack.value.on('resizestop', (event: Event, ui: any) => {
    const target = event.target as HTMLElement
    const itemId = target.getAttribute('gs-id')
    if (itemId) {
      const node = gridStack.value?.getGridItems().find(n => {
        const nodeAny = n as any
        const element = nodeAny.el || nodeAny
        const nodeId = element?.getAttribute('gs-id')
        return nodeId === itemId
      })
      if (node) {
        const nodeAny = node as any
        const element = nodeAny.el || nodeAny
        const h = parseInt(element.getAttribute('gs-h') || '1', 10)
        const w = parseInt(element.getAttribute('gs-w') || '1', 10)
        emit('resize-end', itemId)
        emit('item-resized', itemId, h, w, 0, 0)
        updateGridRowCount()
        updateLayout(getCurrentItems())
      }
    }
  })

  // 项目移动中
  gridStack.value.on('drag', (event: Event) => {
    const target = event.target as HTMLElement
    const itemId = target.getAttribute('gs-id')
    if (itemId) {
      const node = gridStack.value?.getGridItems().find(n => {
        const nodeAny = n as any
        const element = nodeAny.el || nodeAny
        const nodeId = element?.getAttribute('gs-id')
        return nodeId === itemId
      })
      if (node) {
        const nodeAny = node as any
        const element = nodeAny.el || nodeAny
        const x = parseInt(element.getAttribute('gs-x') || '0', 10)
        const y = parseInt(element.getAttribute('gs-y') || '0', 10)
        emit('item-move', itemId, x, y)
      }
    }
  })

  // 项目调整大小中
  gridStack.value.on('resize', (event: Event) => {
    const target = event.target as HTMLElement
    const itemId = target.getAttribute('gs-id')
    if (itemId) {
      const node = gridStack.value?.getGridItems().find(n => {
        const nodeAny = n as any
        const element = nodeAny.el || nodeAny
        const nodeId = element?.getAttribute('gs-id')
        return nodeId === itemId
      })
      if (node) {
        const nodeAny = node as any
        const element = nodeAny.el || nodeAny
        const h = parseInt(element.getAttribute('gs-h') || '1', 10)
        const w = parseInt(element.getAttribute('gs-w') || '1', 10)
        emit('item-resize', itemId, h, w, 0, 0)
      }
    }
  })

  // 布局变化
  gridStack.value.on('change', (event: Event, items: any[]) => {
    console.log('GridStack change event:', items?.length || 0, 'items')
    updateGridRowCount()
    updateLayout(getCurrentItems())
  })

  // 项目添加
  gridStack.value.on('added', (event: Event, items: any[]) => {
    items.forEach(node => {
      const item = props.items.find(i => i.id === node.id)
      if (item) {
        emit('item-add', item)
      }
    })
  })

  // 项目删除
  gridStack.value.on('removed', (event: Event, items: any[]) => {
    items.forEach(node => {
      emit('item-delete', node.id || '')
    })
  })
}

// 初始化 GridStack
const initGridStack = () => {
  if (!gridStackRef.value) {
    console.log('GridStack container not ready, retrying...')
    retryCount.value++

    if (retryCount.value <= maxRetries) {
      setTimeout(() => {
        initGridStack()
      }, 100 * retryCount.value)
    } else {
      console.error('Max retries reached for initialization')
      retryCount.value = 0
    }
    return
  }

  // 清理现有实例
  if (gridStack.value) {
    gridStack.value.destroy()
  }

  try {
    console.log('Initializing GridStack with config:', computedConfig.value)

    // 创建新实例 - 使用官方推荐的方式
    gridStack.value = GridStack.init(computedConfig.value, gridStackRef.value)

    // 设置事件监听
    setupGridStackEvents()

    // 添加项目
    if (props.items.length > 0) {
      const nodes = props.items.map(item => ({
        id: item.id,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        autoPosition: item.autoPosition,
        minW: item.minW,
        maxW: item.maxW,
        minH: item.minH,
        maxH: item.maxH,
        locked: item.locked,
        noResize: item.noResize,
        noMove: item.noMove,
        static: item.static,
        content: createItemContent(item)
      }))

      console.log('Loading', nodes.length, 'items')
      gridStack.value.load(nodes)
    }

    // 更新状态
    updateGridRowCount()

    emit('layout-mounted', props.items)
    console.log('GridStack initialized successfully')
  } catch (error) {
    console.error('Failed to initialize GridStack:', error)
  }
}

// 生命周期钩子
onMounted(() => {
  console.log('GridPlus mounted, initializing...')
  // 直接初始化，让重试机制处理容器未准备好的情况
  initGridStack()
})

onBeforeUnmount(() => {
  if (gridStack.value) {
    gridStack.value.destroy()
  }
})

// 监听 props 变化
watch(
  () => [props.items, props.config, props.readonly],
  () => {
    // 如果是从事件更新触发的，跳过处理
    if (isUpdatingFromEvent.value) {
      console.log('Skipping watch due to event update')
      return
    }

    // 如果 GridStack 不存在，跳过处理
    if (!gridStack.value) {
      console.log('GridStack not ready, skipping watch')
      return
    }

    nextTick(() => {
      try {
        // 更新配置
        const column = typeof computedConfig.value.column === 'number' ? computedConfig.value.column : 12
        const cellHeight = typeof computedConfig.value.cellHeight === 'number' ? computedConfig.value.cellHeight : 100

        console.log('Updating GridStack config:', { column, cellHeight })
        gridStack.value.column(column)
        gridStack.value.cellHeight(cellHeight)

        // 暂时跳过 margin 更新，避免重新创建问题
        const currentMargin = gridStack.value?.opts?.margin
        if (computedConfig.value.margin && currentMargin !== computedConfig.value.margin) {
          console.log('Margin config changed to:', computedConfig.value.margin)
          console.log('Margin update temporarily disabled to avoid recreation issues')
        }

        // 更新项目 - 只在项目数量或ID发生变化时才重新加载
        const currentNodes = gridStack.value.getGridItems()
        const currentIds = currentNodes
          .map(n => {
            const nodeAny = n as any
            const element = nodeAny.el || nodeAny
            return element?.getAttribute('gs-id')
          })
          .filter(Boolean)
          .sort()

        const newIds = props.items.map(item => item.id).sort()

        console.log('Current IDs:', currentIds)
        console.log('New IDs:', newIds)

        // 检查是否需要重新加载
        const needsReload = currentIds.length !== newIds.length || JSON.stringify(currentIds) !== JSON.stringify(newIds)

        if (needsReload) {
          console.log('Reloading items due to ID changes')
          const nodes = props.items.map(item => ({
            id: item.id,
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
            autoPosition: item.autoPosition,
            minW: item.minW,
            maxW: item.maxW,
            minH: item.minH,
            maxH: item.maxH,
            locked: item.locked,
            noResize: item.noResize,
            noMove: item.noMove,
            static: item.static,
            content: createItemContent(item)
          }))

          gridStack.value.removeAll()
          gridStack.value.load(nodes)
        } else {
          console.log('Skipping reload, only config changed')
        }

        updateGridRowCount()
      } catch (error) {
        console.error('Failed to update GridStack:', error)
      }
    })
  },
  { deep: true }
)

// 暴露方法
defineExpose({
  addItem: (item: GridItem) => {
    if (gridStack.value) {
      const node = {
        id: item.id,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        autoPosition: item.autoPosition,
        minW: item.minW,
        maxW: item.maxW,
        minH: item.minH,
        maxH: item.maxH,
        locked: item.locked,
        noResize: item.noResize,
        noMove: item.noMove,
        static: item.static,
        content: createItemContent(item)
      }
      gridStack.value.addWidget(node)
      emit('item-add', item)
    }
  },
  removeItem: (itemId: string) => {
    if (gridStack.value) {
      const widget = gridStack.value.getGridItems().find(n => (n as any).id === itemId)
      if (widget) {
        gridStack.value.removeWidget(widget)
        emit('item-delete', itemId)
      }
    }
  },
  updateItem: (itemId: string, updates: Partial<GridItem>) => {
    if (gridStack.value) {
      const widget = gridStack.value.getGridItems().find(n => (n as any).id === itemId)
      if (widget) {
        const widgetAny = widget as any
        if (updates.x !== undefined) widgetAny.x = updates.x
        if (updates.y !== undefined) widgetAny.y = updates.y
        if (updates.w !== undefined) widgetAny.w = updates.w
        if (updates.h !== undefined)
          widgetAny.h = updates.h

          // 使用 GridStack 的 update 方法
        ;(gridStack.value as any).update(widget, true)
        emit('item-update', itemId, updates)
      }
    }
  },
  getItems: () => getCurrentItems(),
  compact: () => {
    if (gridStack.value) {
      gridStack.value.compact()
      updateLayout(getCurrentItems())
    }
  },
  enable: () => {
    if (gridStack.value) {
      gridStack.value.enable()
    }
  },
  disable: () => {
    if (gridStack.value) {
      gridStack.value.disable()
    }
  }
})
</script>

<style scoped>
.grid-plus-container {
  position: relative;
  width: 100%;
  min-height: 200px;
  overflow: hidden;
  transition: all 0.2s ease;
  user-select: none;
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
  display: flex;
  gap: 8px;
}

/* GridStack 项目样式覆盖 */
:deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #fff);
  border: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  border-radius: 8px;
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
  transition:
    transform 0.1s ease,
    width 0.1s ease,
    height 0.1s ease,
    box-shadow 0.2s ease;
  will-change: transform, width, height;
  overflow: hidden;
}

:deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.15));
  transform: translateY(-1px);
}

:deep(.grid-stack-item.ui-draggable-dragging) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item.ui-resizable-resizing) {
  box-shadow: var(--grid-plus-item-active-shadow, 0 8px 32px rgba(0, 0, 0, 0.3));
  z-index: 1000;
}

:deep(.grid-stack-item-content) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.grid-plus-item-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--grid-plus-item-border-color, #e1e5e9);
  background-color: var(--grid-plus-item-header-bg-color, #f8f9fa);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 20px;
}

.grid-plus-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--grid-plus-item-title-color, #495057);
}

.grid-plus-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.grid-plus-item-position {
  font-size: 11px;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 10px;
}

.grid-plus-item-content {
  flex: 1;
  padding: 12px;
  overflow: auto;
  color: var(--grid-plus-text-color, #495057);
}

.grid-plus-item-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--grid-plus-secondary-text-color, #6c757d);
  font-style: italic;
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

/* 深色主题 */
[data-theme='dark'] .grid-plus-container {
  background-color: var(--grid-plus-bg-color, #1a1a1a);
}

[data-theme='dark'] :deep(.grid-stack-item) {
  background-color: var(--grid-plus-item-bg-color, #2d2d2d);
  border-color: var(--grid-plus-item-border-color, #404040);
  box-shadow: var(--grid-plus-item-shadow, 0 2px 8px rgba(0, 0, 0, 0.3));
}

[data-theme='dark'] :deep(.grid-stack-item:hover) {
  box-shadow: var(--grid-plus-item-hover-shadow, 0 4px 16px rgba(0, 0, 0, 0.4));
}

[data-theme='dark'] .grid-plus-item-header {
  background-color: var(--grid-plus-item-header-bg-color, #333);
  border-color: var(--grid-plus-item-border-color, #404040);
}

[data-theme='dark'] .grid-plus-item-title {
  color: var(--grid-plus-item-title-color, #fff);
}

[data-theme='dark'] .grid-plus-item-content {
  color: var(--grid-plus-item-text-color, #fff);
}

[data-theme='dark'] .grid-plus-item-placeholder {
  color: var(--grid-plus-secondary-text-color, #b0b0b0);
}

/* 主题变量 */
:root {
  --grid-plus-bg-color: #f8f9fa;
  --grid-plus-item-bg-color: #fff;
  --grid-plus-item-border-color: #e1e5e9;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  --grid-plus-item-header-bg-color: #f8f9fa;
  --grid-plus-item-title-color: #495057;
  --grid-plus-text-color: #495057;
  --grid-plus-secondary-text-color: #6c757d;
}

[data-theme='dark'] {
  --grid-plus-bg-color: #1a1a1a;
  --grid-plus-item-bg-color: #2d2d2d;
  --grid-plus-item-border-color: #404040;
  --grid-plus-item-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  --grid-plus-item-hover-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  --grid-plus-item-active-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  --grid-plus-item-header-bg-color: #333;
  --grid-plus-item-title-color: #fff;
  --grid-plus-text-color: #fff;
  --grid-plus-secondary-text-color: #b0b0b0;
}
</style>
