<template>
  <!--
    GridV2（基于 GridStack 的最小可用封装）
    - 直接复用 GridLayoutPlus 的 Props/Emits 协议，便于无缝替换
    - 使用 v-for 渲染网格项，并在 onMounted + nextTick 后由 GridStack 接管（makeWidget）
    - 默认插槽透出 { item }，与原调用方写法保持一致
  -->
  <div class="grid-v2-wrapper">
    <!-- GridStack 容器：必须具有 .grid-stack 类名 -->
    <div ref="gridEl" class="grid-stack" :class="props.containerClass" :style="gridContainerInlineStyle">
      <div
        v-for="item in props.layout"
        :id="getItemId(item)"
        :key="getItemId(item)"
        class="grid-stack-item"
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
import type {
  GridLayoutPlusProps,
  GridLayoutPlusEmits,
  GridLayoutPlusItem
} from '@/components/common/grid/gridLayoutPlusTypes'

// 复用 GridLayoutPlus 的 props / emits 协议
const props = defineProps<GridLayoutPlusProps>()
const emit = defineEmits<GridLayoutPlusEmits>()

// Grid 容器与实例
const gridEl = ref<HTMLDivElement | null>(null) // 状态管理
let grid: GridStack | null = null
let isInitialized = false
let pendingLayoutUpdate = false

// 🔥 性能优化：防抖和节流控制
let changeEventTimer: number | null = null
let widgetRegistrationTimer: number | null = null
let isProcessingChange = false

// 🔥 记录上一次的layout数量，用于检测删除操作
let previousLayoutCount = 0

// 🔥 记录上一次的 layout hash，用于防止循环更新
let lastLayoutHash = ''

const COLUMN_STYLE_PREFIX = 'gridstack-column-style'

/** 统一调试输出 */
function debugLog(...args: unknown[]): void {}

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
      const newLayout: GridLayoutPlusItem[] = props.layout.map(it => ({ ...it }))

      changed.forEach(node => {
        const id = String(node.id)
        const idx = newLayout.findIndex(it => getItemId(it) === id)
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

  console.log('🔍 [GridV2] ensureNewWidgetsRegistered 被调用')

  // 🔥 防抖处理：避免频繁的widget操作
  if (widgetRegistrationTimer) {
    clearTimeout(widgetRegistrationTimer)
  }

  widgetRegistrationTimer = window.setTimeout(() => {
    if (!grid) return

    console.log('🔍 [GridV2] 开始执行widget管理（防抖后）')

    try {
      // 🔥 第一步：收集当前应该存在的widget ID
      const currentLayoutIds = new Set(props.layout.map(item => getItemId(item)))
      console.log('🔍 [GridV2] 当前layout中的IDs:', Array.from(currentLayoutIds))

      // 🔥 第二步：移除不再需要的widgets
      const existingNodes = grid.getGridItems()
      console.log('🔍 [GridV2] GridStack中现有的节点数:', existingNodes.length)

      let removedWidgetCount = 0
      existingNodes.forEach((el: GridItemHTMLElement) => {
        const node = el.gridstackNode
        const nodeId = String(node?.id)
        console.log(`🔍 [GridV2] 检查节点 [${nodeId}], 是否在layout中: ${currentLayoutIds.has(nodeId)}`)

        if (node && !currentLayoutIds.has(nodeId)) {
          console.log(`🗑️ [GridV2] 移除过时widget: ${nodeId}`)
          grid!.removeWidget(el, false) // false表示不触发change事件
          removedWidgetCount++
        }
      })

      console.log(`🔍 [GridV2] 移除统计: ${removedWidgetCount} 个widget`)

      // 🔥 第三步：检测layout变化中的删除（通过上一次和当前的layout数量对比）
      // 因为DOM被Vue移除时GridStack不触发removed事件，需要通过layout数量变化来检测
      const currentLayoutCount = props.layout.length
      console.log(`🔍 [GridV2] Layout数量对比: 上一次=${previousLayoutCount}, 当前=${currentLayoutCount}`)

      const actuallyRemovedCount = previousLayoutCount - currentLayoutCount

      if (actuallyRemovedCount > 0 && removedWidgetCount === 0) {
        console.log(`🗑️ [GridV2] 检测到 ${actuallyRemovedCount} 个组件被删除（通过layout变化检测）`)
        removedWidgetCount = actuallyRemovedCount
      }

      // 更新记录，用于下次对比
      previousLayoutCount = currentLayoutCount

      // 🔥 第四步：注册新的widgets
      let newWidgetCount = 0
      const newWidgets: HTMLElement[] = []

      props.layout.forEach(item => {
        const id = getItemId(item)
        const el = gridEl.value?.querySelector<HTMLElement>(`#${CSS.escape(id)}`) as GridItemHTMLElement | null

        // 只为未注册的新节点调用makeWidget
        if (el && !el.gridstackNode) {
          debugLog('注册新widget:', id)
          try {
            grid!.makeWidget(el)
            newWidgetCount++
            newWidgets.push(el)
          } catch (err) {
            console.warn('[GridV2] makeWidget失败:', id, err)
          }
        }
      })

      // 🔥 第五步：处理新增或删除后的自动重排
      const needsCompact = removedWidgetCount > 0

      if (needsCompact) {
        debugLog(`删除了 ${removedWidgetCount} 个组件`)

        // ✅ 根据配置决定是否自动填充空隙
        const shouldCompact = props.config?.verticalCompact !== false
        if (shouldCompact) {
          debugLog('触发自动重排（填充删除后的空隙）')
          grid.compact() // ✅ 一行代码搞定，GridStack 内置的优化算法
        }

        // ❌ 已删除 80+ 行自定义重排算法代码
        // ❌ 已删除所有手动设置 left/top 的代码
        // GridStack 的 compact() 方法已经正确处理了布局！
      }

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
function ensureColumnStyles(columnCount: number): void {
  if (columnCount <= 12) return

  const styleId = `${COLUMN_STYLE_PREFIX}-${columnCount}`
  if (document.getElementById(styleId)) return

  const rules: string[] = []
  for (let i = 1; i <= columnCount; i++) {
    const widthPercent = ((i / columnCount) * 100).toFixed(4)
    rules.push(`.grid-stack.grid-stack-${columnCount} > .grid-stack-item[gs-w="${i}"] { width: ${widthPercent}% }`)
    rules.push(`.grid-stack.gs-${columnCount} > .grid-stack-item[gs-w="${i}"] { width: ${widthPercent}% }`)
    rules.push(
      `.grid-stack.grid-stack-${columnCount} > .grid-stack-item[data-gs-width="${i}"] { width: ${widthPercent}% }`
    )
    rules.push(`.grid-stack.gs-${columnCount} > .grid-stack-item[data-gs-width="${i}"] { width: ${widthPercent}% }`)
  }

  for (let x = 0; x < columnCount; x++) {
    const leftPercent = ((x / columnCount) * 100).toFixed(4)
    rules.push(`.grid-stack.grid-stack-${columnCount} > .grid-stack-item[gs-x="${x}"] { left: ${leftPercent}% }`)
    rules.push(`.grid-stack.gs-${columnCount} > .grid-stack-item[gs-x="${x}"] { left: ${leftPercent}% }`)
    rules.push(`.grid-stack.grid-stack-${columnCount} > .grid-stack-item[data-gs-x="${x}"] { left: ${leftPercent}% }`)
    rules.push(`.grid-stack.gs-${columnCount} > .grid-stack-item[data-gs-x="${x}"] { left: ${leftPercent}% }`)
  }

  const style = document.createElement('style')
  style.id = styleId
  style.textContent = rules.join('\n')
  document.head.appendChild(style)
}

function createOptionsFromProps(): GridStackOptions {
  const config = props.config || {}

  debugLog('创建GridStack配置，输入config:', config)

  // 🔥 修复：正确映射配置字段
  const columnCount = Number(config.colNum) || 24 // 统一默认为24列
  const rowHeightValue = Number(config.rowHeight) || 80 // 默认80px行高

  // 🔥 将 horizontalGap / verticalGap 映射到 GridStack 原生 margin
  let horizontalGap = config.horizontalGap
  if (horizontalGap === undefined && Array.isArray(config.margin)) {
    horizontalGap = config.margin[0]
  }
  let verticalGap = config.verticalGap
  if (verticalGap === undefined && Array.isArray(config.margin)) {
    verticalGap = config.margin[1]
  }

  const normalizedHorizontalGap = Number.isFinite(Number(horizontalGap)) ? Number(horizontalGap) : 0
  const normalizedVerticalGap = Number.isFinite(Number(verticalGap)) ? Number(verticalGap) : 0
  const marginValue = `${normalizedVerticalGap}px ${normalizedHorizontalGap}px`

  // ✅ 正确映射 GridLayoutPlus 配置到 GridStack 配置
  //
  // 用户需求：
  // 1. verticalCompact: true  → 允许自动紧凑排列
  // 2. verticalCompact: false → 不自动重排（刷新后保持用户布局）
  //
  // GridStack 的 float 行为：
  // - float: false → 紧凑模式（自动填充空隙）
  // - float: true  → 浮动模式（保持用户布局，不自动填充）
  //
  // 正确映射：
  // - verticalCompact: true  → float: false（允许自动紧凑）
  // - verticalCompact: false → float: true （保持用户布局）
  const shouldFloat = config.verticalCompact === false

  // 基础配置
  const options: GridStackOptions = {
    // 核心布局配置
    column: columnCount,
    cellHeight: rowHeightValue,

    // 🔥 使用 GridStack 原生 margin 管理水平/垂直间距
    margin: marginValue,

    // 交互配置
    disableDrag: props.readonly || config.isDraggable === false,
    disableResize: props.readonly || config.isResizable === false,
    staticGrid: props.readonly || config.staticGrid === true,

    // ✅ 关键：正确映射 float 配置
    float: shouldFloat,

    // ❌ 已删除错误的 preventCollision 映射
    // GridStack 没有 preventCollision 配置项
    // 碰撞检测由 float 配置控制

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

    // 🔥 关键修复：必须启用样式注入，否则列宽计算失效
    // GridStack 需要在 <head> 中动态注入 CSS 来设置每一列的宽度百分比
    // 例如：.grid-stack.grid-stack-24 > .grid-stack-item[gs-w="1"] { width: 4.1667% }
    styleInHead: true, // 必须为 true，否则列数切换时组件宽度变成 0

    // 🔥 移动端优化
    oneColumnSize: 768 // 移动端单列阈值
  }

  console.log('🔧 [GridV2] GridStack初始化配置:', {
    column: options.column,
    cellHeight: options.cellHeight,
    margin: options.margin,
    float: options.float,
    disableDrag: options.disableDrag,
    disableResize: options.disableResize,
    staticGrid: options.staticGrid,
    '来源-verticalCompact': config.verticalCompact,
    horizontalGap: normalizedHorizontalGap,
    verticalGap: normalizedVerticalGap
  })
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
  console.log('🔍 [GridV2] 初始化GridStack，配置:', {
    column: options.column,
    cellHeight: options.cellHeight,
    margin: options.margin,
    styleInHead: options.styleInHead
  })
  ensureColumnStyles(typeof options.column === 'number' ? options.column : 12)
  grid = GridStack.init(options, gridEl.value)
  console.log('🔍 [GridV2] GridStack实例创建完成，当前列数:', grid.getColumn())

  // 绑定事件
  grid.on('change', handleChange)

  // 🔥 新增：拖拽开始事件监控
  grid.on('dragstart', (_e: Event, el: GridItemHTMLElement) => {
    const node = el.gridstackNode
    if (!node) return

    // 检查所有组件的位置，看碰撞检测基于什么
    const allItems = grid?.getGridItems() ?? []

    console.log(`🎯 [GridV2] 拖拽开始 [${node.id}]:`, {
      初始x: node.x,
      初始y: node.y,
      当前列数: grid?.getColumn(),
      当前float: grid?.opts.float,
      拖拽前inline: el.style.cssText.substring(0, 150)
    })

    // 详细输出每个组件的位置
    console.log('📍 拖拽开始时所有组件位置:')
    allItems.forEach((item: GridItemHTMLElement, index) => {
      const n = item.gridstackNode
      const style = window.getComputedStyle(item)
      console.log(`  组件${index} [${n?.id}]:`, {
        'data-x': n?.x,
        'data-y': n?.y,
        'computed-left': style.left,
        'computed-position': style.position,
        'inline-left': item.style.left,
        'inline-position': item.style.position
      })
    })
  })

  // 🔥 新增：拖拽中事件监控（节流，避免日志过多）
  let dragLogTimer: number | null = null
  grid.on('drag', (_e: Event, el: GridItemHTMLElement) => {
    const node = el.gridstackNode
    if (!node || dragLogTimer) return

    dragLogTimer = window.setTimeout(() => {
      console.log(`🎯 [GridV2] 拖拽中 [${node.id}]:`, {
        当前x: node.x,
        当前y: node.y,
        拖拽中inline: el.style.cssText.substring(0, 100)
      })
      dragLogTimer = null
    }, 200) // 200ms节流
  })

  // 拖拽结束事件
  grid.on('dragstop', (_e: Event, el: GridItemHTMLElement) => {
    const node = el.gridstackNode
    if (!node) return

    // ✅ 只需 emit 事件，GridStack 已经处理了定位
    debugLog('拖拽结束:', node.id, node.x, node.y)
    emit('item-moved', String(node.id), node.x ?? 0, node.y ?? 0)

    // ❌ 已删除所有手动设置 left/top 的代码
    // GridStack 内部已经正确设置了位置！
  })

  // 缩放结束事件
  grid.on('resizestop', (_e: Event, el: GridItemHTMLElement) => {
    const node = el.gridstackNode
    if (!node) return

    // ✅ 只需 emit 事件，GridStack 已经处理了定位和尺寸
    debugLog('缩放结束:', node.id, node.w, node.h)
    emit('item-resized', String(node.id), node.h ?? 0, node.w ?? 0, 0, 0)

    // ❌ 已删除所有手动设置 left/top 的代码
    // GridStack 内部已经正确设置了位置和尺寸！
  })

  // 🔥 监听组件删除事件，触发自动重排
  grid.on('removed', (_e, items) => {
    debugLog(`组件被删除，数量: ${items.length}`)

    if (!grid) return

    // ✅ 根据配置决定是否自动填充空隙
    const shouldCompact = props.config?.verticalCompact !== false
    if (shouldCompact) {
      debugLog('触发自动重排（填充删除后的空隙）')
      grid.compact()
    }

    // ❌ 已删除所有手动设置 left/top 的代码
    // GridStack 的 compact() 方法已经正确处理了布局！
  })

  isInitialized = true

  // 下一帧注册widgets
  nextTick(() => {
    ensureNewWidgetsRegistered()

    // 🔥 初始化记录：设置初始layout数量
    previousLayoutCount = props.layout.length
    debugLog('初始化 previousLayoutCount =', previousLayoutCount)

    // ✅ GridStack 已经正确处理了初始化定位
    // ❌ 已删除所有手动设置 left/top 的代码
    // ❌ 已删除所有强制 resize 事件和重复 update() 调用

    debugLog('GridStack初始化完成')
  })
}

/**
 * ✅ 优化后的列数切换函数
 * 信任 GridStack 的 column() 方法，不手动干预定位
 */
async function updateColumns(newCol: number): Promise<void> {
  if (!Number.isFinite(newCol) || !grid || !gridEl.value) return

  const currentCol = grid.getColumn()
  if (currentCol === newCol) {
    debugLog('列数未变化，跳过更新')
    return
  }

  try {
    debugLog('列数切换:', currentCol, '→', newCol)

    // 步骤1: 确保样式可用
    ensureColumnStyles(newCol)

    // 步骤2: 使用 GridStack 官方 API 切换列数
    // ✅ 使用 'moveScale' 策略，自动缩放组件宽度和位置
    grid.column(newCol, 'moveScale')

    // 步骤3: 等待 GridStack 完成更新
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))
    if (grid) {
      grid.compact('compact', true)
    }
    debugLog('列数切换完成')
  } catch (err) {
    console.error('❌ [GridV2] 列数切换失败:', err)
    // 出错时强制重新初始化
    if (grid) {
      grid.destroy(false)
      grid = null
    }
    isInitialized = false
    nextTick(() => {
      initGrid()
    })
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

// 🔥 监听布局变化（带循环防护）
watch(
  () => props.layout,
  newLayout => {
    if (!isInitialized) return

    // 🔥 关键修复：计算 layout 的 hash，避免相同数据重复处理
    const newHash = JSON.stringify(newLayout)
    if (newHash === lastLayoutHash) {
      debugLog('Layout 数据未变化，跳过更新')
      return
    }
    lastLayoutHash = newHash

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

// 🔥 新增：监听横向/纵向间距（新配置字段）
watch(
  () => [props.config?.horizontalGap, props.config?.verticalGap],
  (newGap, oldGap) => {
    if (!isInitialized) return
    if (!oldGap || newGap[0] !== oldGap[0] || newGap[1] !== oldGap[1]) {
      debugLog('间距(Gap)变更，从', oldGap, '到', newGap)
      updateGridConfig()
    }
  }
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
