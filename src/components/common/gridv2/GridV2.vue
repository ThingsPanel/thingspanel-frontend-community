<template>
  <!--
    GridV2（基于 GridStack 的最小可用封装）
    - 直接复用 GridLayoutPlus 的 Props/Emits 协议，便于无缝替换
    - 使用 v-for 渲染网格项，并在 onMounted + nextTick 后由 GridStack 接管（makeWidget）
    - 默认插槽透出 { item }，与原调用方写法保持一致
  -->
  <div class="grid-v2-wrapper">
    <!-- GridStack 容器：必须具有 .grid-stack 类名 -->
    <div class="grid-stack" ref="gridEl" :class="props.containerClass" :style="gridContainerInlineStyle">
      <div
        v-for="item in props.layout"
        :key="getItemId(item)"
        class="grid-stack-item"
        :id="getItemId(item)"
        :gs-id="getItemId(item)"
        :gs-x="item.x"
        :gs-y="item.y"
        :gs-w="item.w"
        :gs-h="item.h"
        :gs-min-w="item.minW"
        :gs-min-h="item.minH"
        :gs-max-w="item.maxW"
        :gs-max-h="item.maxH"
        :gs-no-move="isNoMove(item) ? 'true' : undefined"
        :gs-no-resize="isNoResize(item) ? 'true' : undefined"
      >
        <div class="grid-stack-item-content">
          <!-- 默认插槽：向外暴露 { item }，调用方式保持与 GridLayoutPlus 一致 -->
          <slot :item="item">
            <!-- 兜底内容（调试时可见） -->
            <div class="fallback">
              <b>{{ getItemId(item) }}</b>
              <small>({{ item.x }},{{ item.y }}) {{ item.w }}x{{ item.h }}</small>
            </div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * GridV2 - 优化版本
 * 
 * 🔥 修复拖拽卡顿问题：
 * 1. 移除过度的CSS !important规则
 * 2. 简化widget管理逻辑
 * 3. 减少不必要的DOM操作
 * 4. 优化事件处理流程
 */

// 启用原生 HTML5 拖拽/缩放插件
import 'gridstack/dist/dd-gridstack'
// 引入 GridStack 必需的基础样式
import 'gridstack/dist/gridstack.min.css'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { GridStack, type GridStackNode, type GridItemHTMLElement, type GridStackOptions } from 'gridstack'
import type { GridLayoutPlusProps, GridLayoutPlusEmits, GridLayoutPlusItem } from '@/components/common/grid/gridLayoutPlusTypes'

// 复用 GridLayoutPlus 的 props / emits 协议
const props = defineProps<GridLayoutPlusProps>()
const emit = defineEmits<GridLayoutPlusEmits>()

// Grid 容器与实例
const gridEl = ref<HTMLDivElement | null>(null)// 状态管理
let grid: GridStack | null = null
let isInitialized = false
let pendingLayoutUpdate = false

// 🔥 性能优化：防抖和节流控制
let changeEventTimer: number | null = null
let widgetRegistrationTimer: number | null = null
let isProcessingChange = false

/** 统一调试输出 */
function debugLog(...args: unknown[]): void {
}

// 统一获取条目唯一 ID
const idKey = computed<string>(() => (props.idKey && props.idKey.length > 0 ? props.idKey : 'i'))
const getItemId = (item: GridLayoutPlusItem): string => {
  const k = idKey.value
  const v = (item as unknown as Record<string, unknown>)[k]
  return String((v ?? item.i) as string)
}

// 判断是否禁用拖拽
function isNoMove(item: GridLayoutPlusItem): boolean {
  if (props.readonly) return true
  if (props.config?.isDraggable === false) return true
  if ((item as unknown as { static?: boolean }).static === true) return true
  if ((item as unknown as { isDraggable?: boolean }).isDraggable === false) return true
  return false
}

// 判断是否禁用缩放
function isNoResize(item: GridLayoutPlusItem): boolean {
  if (props.readonly) return true
  if (props.config?.isResizable === false) return true
  if ((item as unknown as { static?: boolean }).static === true) return true
  if ((item as unknown as { isResizable?: boolean }).isResizable === false) return true
  return false
}

/**
 * 🔥 关键修复：防抖的change事件处理
 * - 使用防抖避免频繁更新
 * - 批量处理多个节点变化
 * - 避免状态不一致和性能问题
 */
function handleChange(_event: Event, changed: GridStackNode[] | undefined): void {
  if (!changed || changed.length === 0 || pendingLayoutUpdate || isProcessingChange) return

  debugLog('GridStack change事件:', changed.length, '个节点变化')

  // 🔥 防抖处理：避免频繁的布局更新
  if (changeEventTimer) {
    clearTimeout(changeEventTimer)
  }

  changeEventTimer = window.setTimeout(() => {
    isProcessingChange = true
    
    try {
      // 基于当前 props.layout 生成新的布局
      const newLayout: GridLayoutPlusItem[] = props.layout.map((it) => ({ ...it }))

      changed.forEach((node) => {
        const id = String(node.id)
        const idx = newLayout.findIndex((it) => getItemId(it) === id)
        if (idx >= 0) {
          if (typeof node.x === 'number') newLayout[idx].x = node.x
          if (typeof node.y === 'number') newLayout[idx].y = node.y
          if (typeof node.w === 'number') newLayout[idx].w = node.w
          if (typeof node.h === 'number') newLayout[idx].h = node.h
        }
      })

      // 透出事件
      emit('layout-change', newLayout)
      emit('update:layout', newLayout)
      emit('layout-updated', newLayout)
      
      debugLog('布局更新完成，节点数量:', newLayout.length)
    } catch (err) {
      console.error('[GridV2] 布局更新失败:', err)
    } finally {
      isProcessingChange = false
      changeEventTimer = null
    }
  }, 16) // 约60fps的更新频率
}

/**
 * 🔥 关键修复：防抖的widget生命周期管理
 * - 使用防抖避免频繁的DOM操作
 * - 智能管理widget的添加和移除
 * - 避免重复注册和性能问题
 */
function ensureNewWidgetsRegistered(): void {
  if (!grid) return

  // 🔥 防抖处理：避免频繁的widget操作
  if (widgetRegistrationTimer) {
    clearTimeout(widgetRegistrationTimer)
  }

  widgetRegistrationTimer = window.setTimeout(() => {
    if (!grid) return

    try {
      // 🔥 第一步：收集当前应该存在的widget ID
      const currentLayoutIds = new Set(props.layout.map(item => getItemId(item)))
      
      // 🔥 第二步：移除不再需要的widgets
      const existingNodes = grid.getGridItems()
      existingNodes.forEach((el: GridItemHTMLElement) => {
        const node = el.gridstackNode
        if (node && !currentLayoutIds.has(String(node.id))) {
          debugLog('移除过时widget:', node.id)
          grid!.removeWidget(el, false) // false表示不触发change事件
        }
      })

      // 🔥 第三步：注册新的widgets
      let newWidgetCount = 0
      props.layout.forEach((item) => {
        const id = getItemId(item)
        const el = gridEl.value?.querySelector<HTMLElement>(`#${CSS.escape(id)}`) as GridItemHTMLElement | null
        
        // 只为未注册的新节点调用makeWidget
        if (el && !el.gridstackNode) {
          debugLog('注册新widget:', id)
          try {
            grid!.makeWidget(el)
            newWidgetCount++
          } catch (err) {
            console.warn('[GridV2] makeWidget失败:', id, err)
          }
        }
      })
      
      debugLog(`Widget管理完成，新增: ${newWidgetCount}，当前总数: ${grid.getGridItems().length}`)
    } catch (err) {
      console.error('[GridV2] Widget管理失败:', err)
    } finally {
      widgetRegistrationTimer = null
    }
  }, 50) // 50ms防抖延迟
}

/**
 * 🔥 关键修复：基于官方文档的性能优化配置
 * - 使用GridStack内置的列管理
 * - 避免!important样式冲突
 * - 优化拖拽性能和响应速度
 */
function createOptionsFromProps(): GridStackOptions {
  const config = props.config || {}

  debugLog('创建GridStack配置，输入config:', config)

  // 🔥 修复：正确映射配置字段
  const columnCount = Number(config.colNum) || 24 // 统一默认为24列
  const rowHeightValue = Number(config.rowHeight) || 80 // 默认80px行高

  // 🔥 修复：正确处理margin配置，支持[水平, 垂直]格式
  let marginValue: string | number = 0
  if (Array.isArray(config.margin)) {
    // GridStack的margin可以是数字（统一间距）或字符串（"水平px 垂直px"）
    const [horizontal = 0, vertical = 0] = config.margin
    marginValue = horizontal === vertical ? horizontal : `${horizontal}px ${vertical}px`
  } else if (typeof config.margin === 'number') {
    marginValue = config.margin
  }

  // 基础配置
  const options: GridStackOptions = {
    // 核心布局配置
    column: columnCount,
    cellHeight: rowHeightValue,

    // 🔥 关键：正确处理margin配置
    margin: marginValue,

    // 交互配置
    disableDrag: props.readonly || config.isDraggable === false,
    disableResize: props.readonly || config.isResizable === false,
    staticGrid: props.readonly || config.staticGrid === true,
    
    // 🔥 关键：基于官方文档的性能优化配置
    float: false, // 禁用浮动，提高性能和布局稳定性
    removable: false, // 禁用移除功能，减少事件监听
    acceptWidgets: false, // 禁用外部拖入，减少复杂度
    
    // 🔥 性能优化：动画和样式配置
    animate: false, // 禁用动画以提高拖拽流畅度
    alwaysShowResizeHandle: false, // 只在悬停时显示缩放手柄
    
    // 🔥 性能优化：拖拽配置
    draggable: {
      // 限制拖拽区域，防止无限滚动
      scroll: false,
      // 使用更高效的拖拽处理
      appendTo: 'parent',
      // 优化拖拽手柄
      handle: '.grid-stack-item-content'
    },
    
    // 🔥 性能优化：缩放配置
    resizable: {
      // 限制缩放手柄数量，提高性能
      handles: 'se'
    },
    
    // 其他配置
    rtl: config.isMirrored || false,
    oneColumnModeDomSort: true,
    
    // 🔥 性能优化：样式配置
    styleInHead: false, // 避免在HEAD中添加样式，减少重排
    
    // 🔥 移动端优化
    oneColumnSize: 768 // 移动端单列阈值
  }

  debugLog('GridStack初始化配置:', {
    column: options.column,
    cellHeight: options.cellHeight,
    margin: options.margin,
    disableDrag: options.disableDrag,
    disableResize: options.disableResize,
    staticGrid: options.staticGrid
  })
  return options
}

/**
 * 🔥 关键修复：简化的初始化逻辑
 */
function initGrid(): void {
  if (!gridEl.value || isInitialized) return

  debugLog('初始化GridStack')
  
  // 清理旧实例
  if (grid) {
    grid.destroy(false)
    grid = null
  }

  // 创建新实例
  const options = createOptionsFromProps()
  grid = GridStack.init(options, gridEl.value)

  // 绑定事件
  grid.on('change', handleChange)
  
  // 拖拽结束事件
  grid.on('dragstop', (_e: Event, el: GridItemHTMLElement) => {
    const node = el.gridstackNode
    if (!node) return
    debugLog('拖拽结束:', node.id, node.x, node.y)
    emit('item-moved', String(node.id), node.x ?? 0, node.y ?? 0)
  })

  // 缩放结束事件
  grid.on('resizestop', (_e: Event, el: GridItemHTMLElement) => {
    const node = el.gridstackNode
    if (!node) return
    debugLog('缩放结束:', node.id, node.w, node.h)
    emit('item-resized', String(node.id), node.h ?? 0, node.w ?? 0, 0, 0)
  })

  isInitialized = true

  // 下一帧注册widgets
  nextTick(() => {
    ensureNewWidgetsRegistered()

    // 🔥 关键修复：强制触发GridStack重新布局和样式计算
    // 解决列数切换后视觉上没有变化的问题
    setTimeout(() => {
      if (grid) {
        debugLog('强制触发GridStack重新布局，当前列数:', grid.getColumn())

        // 方法1：触发resize事件强制重新计算
        grid.batchUpdate(false) // 暂停批量更新
        grid.compact() // 重新排列
        grid.batchUpdate(true) // 恢复批量更新

        // 方法2：强制触发窗口resize事件
        window.dispatchEvent(new Event('resize'))

        // 方法3：强制重新计算所有组件的CSS尺寸
        const allItems = grid.getGridItems()
        allItems.forEach((el: GridItemHTMLElement) => {
          if (el.gridstackNode) {
            // 强制重新设置组件的CSS属性
            grid!.update(el, {
              x: el.gridstackNode.x,
              y: el.gridstackNode.y,
              w: el.gridstackNode.w,
              h: el.gridstackNode.h
            })
          }
        })

        // 方法4：直接检查和修复CSS问题
        debugLog('检查GridStack CSS状态...')

        // 检查grid-stack容器的CSS
        const gridContainer = gridEl.value
        if (gridContainer) {
          const computedStyle = window.getComputedStyle(gridContainer)
          debugLog('Grid容器CSS:', {
            width: computedStyle.width,
            height: computedStyle.height,
            position: computedStyle.position,
            display: computedStyle.display
          })
        }

        // 检查每个组件的实际CSS
        allItems.forEach((el: GridItemHTMLElement, index: number) => {
          const computedStyle = window.getComputedStyle(el)
          const node = el.gridstackNode
          debugLog(`组件${index} CSS:`, {
            id: node?.id,
            gridPosition: `x:${node?.x}, y:${node?.y}, w:${node?.w}, h:${node?.h}`,
            cssWidth: computedStyle.width,
            cssHeight: computedStyle.height,
            cssLeft: computedStyle.left,
            cssTop: computedStyle.top,
            transform: computedStyle.transform
          })
        })

        debugLog('GridStack重新布局完成，更新了', allItems.length, '个组件')
      }
    }, 100) // 100ms延迟确保DOM完全渲染

    debugLog('GridStack初始化完成')
  })
}

/**
 * 🔥 关键修复：安全的列数切换逻辑
 * 解决切换列数时组件消失的问题
 */
function updateColumns(newCol: number): void {
  if (!grid || !Number.isFinite(newCol)) return

  debugLog('更新列数:', newCol, '当前布局:', props.layout)

  try {
    // 🔥 关键修复：检查现有组件是否会超出新的列数限制
    const maxWidthInLayout = props.layout.length > 0
      ? Math.max(...props.layout.map(item => item.x + item.w))
      : 0
    debugLog('布局中最大宽度:', maxWidthInLayout, '新列数:', newCol)

    // 🔥 关键修复：GridStack的column()方法存在宽度计算bug
    // 统一使用重新初始化策略，确保组件宽度正确计算
    debugLog('⚠️ 检测到列数变更，使用重新初始化策略以确保组件宽度正确')

    isInitialized = false
    nextTick(() => {
      initGrid()
    })
  } catch (err) {
    console.warn('[GridV2] 列数切换失败，重新初始化:', err)
    isInitialized = false
    initGrid()
  }
}

/**
 * 🔥 新增：通用的配置更新函数
 * 当行高、间距等配置变更时，需要重新初始化GridStack实例
 */
function updateGridConfig(): void {
  if (!grid) return

  debugLog('配置变更，重新初始化GridStack')

  try {
    // 配置变更需要重新初始化GridStack实例
    const wasInitialized = isInitialized
    isInitialized = false

    // 销毁旧实例
    grid.destroy(false)
    grid = null

    // 重新初始化
    if (wasInitialized) {
      nextTick(() => {
        initGrid()
      })
    }
  } catch (err) {
    console.error('[GridV2] 配置更新失败:', err)
    // 强制重新初始化
    isInitialized = false
    grid = null
    nextTick(() => {
      initGrid()
    })
  }
}

// 计算容器样式
const gridContainerInlineStyle = computed(() => {
  const config = props.config || {}
  const styles: Record<string, string> = {}
  
  // 最小高度
  if (config.minH) {
    styles.minHeight = `${config.minH}px`
  }
  
  return styles
})

// 生命周期
onMounted(() => {
  nextTick(() => {
    initGrid()
  })
})

onBeforeUnmount(() => {
  debugLog('组件销毁，清理GridStack实例和定时器')
  
  // 🔥 清理所有定时器，避免内存泄漏
  if (changeEventTimer) {
    clearTimeout(changeEventTimer)
    changeEventTimer = null
  }
  if (widgetRegistrationTimer) {
    clearTimeout(widgetRegistrationTimer)
    widgetRegistrationTimer = null
  }
  
  // 清理GridStack实例
  if (grid) {
    grid.destroy(false)
    grid = null
  }
  
  // 重置状态
  isInitialized = false
  isProcessingChange = false
  pendingLayoutUpdate = false
})

// 监听布局变化
watch(
  () => props.layout,
  () => {
    if (!isInitialized) return
    
    pendingLayoutUpdate = true
    nextTick(() => {
      ensureNewWidgetsRegistered()
      pendingLayoutUpdate = false
    })
  },
  { deep: true }
)

// 监听列数变化
watch(
  () => props.config?.colNum,
  (newCol, oldCol) => {
    if (newCol !== oldCol && newCol) {
      updateColumns(Number(newCol))
    }
  }
)

// 🔥 新增：监听行高变化
watch(
  () => props.config?.rowHeight,
  (newHeight, oldHeight) => {
    if (newHeight !== oldHeight && newHeight && isInitialized) {
      debugLog('行高变更，从', oldHeight, '到', newHeight)
      updateGridConfig()
    }
  }
)

// 🔥 新增：监听间距变化
watch(
  () => props.config?.margin,
  (newMargin, oldMargin) => {
    // 深度比较数组
    const marginChanged = JSON.stringify(newMargin) !== JSON.stringify(oldMargin)
    if (marginChanged && isInitialized) {
      debugLog('间距变更，从', oldMargin, '到', newMargin)
      updateGridConfig()
    }
  },
  { deep: true }
)

// 监听拖拽/缩放开关
watch(
  () => [props.config?.isDraggable, props.config?.isResizable, props.readonly],
  () => {
    if (!grid) return
    
    const isDraggable = !props.readonly && props.config?.isDraggable !== false
    const isResizable = !props.readonly && props.config?.isResizable !== false
    
    debugLog('更新交互状态:', { isDraggable, isResizable })
    
    // 使用GridStack内置方法更新状态
    grid.enableMove(isDraggable)
    grid.enableResize(isResizable)
  }
)
</script>

<style scoped>
.grid-v2-wrapper {
  width: 100%;
  height: 100%;
  /* 🔥 确保容器不干扰GridStack的定位 */
  position: relative;
  overflow: visible;
}

/* 🔥 关键修复：最小化样式干扰，让GridStack自己管理 */
.grid-stack {
  width: 100%;
  height: 100%;
  /* 🔥 确保GridStack容器正确定位 */
  position: relative;
  /* 🔥 禁用可能干扰拖拽的样式 */
  touch-action: none;
  user-select: none;
}

/* 🔥 优化grid-stack-item-content样式，避免冲突 */
.grid-stack-item-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  /* 🔥 使用CSS变量支持动态间距，避免!important */
  padding: var(--h-gap, 0px) var(--v-gap, 0px);
  /* 🔥 确保内容不干扰拖拽 */
  pointer-events: auto;
  position: relative;
}

/* 🔥 确保拖拽时的样式不冲突 */
.grid-stack-item.ui-draggable-dragging .grid-stack-item-content {
  pointer-events: none;
}

.fallback {
  padding: 8px;
  background: #f0f0f0;
  border: 1px dashed #ccc;
  border-radius: 4px;
  text-align: center;
  /* 🔥 确保fallback内容不干扰拖拽 */
  pointer-events: none;
}

/* 🔥 全局样式重置，确保GridStack正常工作 */
:deep(.grid-stack-item) {
  /* 确保GridStack的默认样式不被覆盖 */
  touch-action: none;
}

:deep(.grid-stack-item.ui-draggable-dragging) {
  /* 拖拽时的优化 */
  z-index: 1000;
  opacity: 0.8;
}

:deep(.grid-stack-item.ui-resizable-resizing) {
  /* 缩放时的优化 */
  z-index: 1000;
}
</style>


