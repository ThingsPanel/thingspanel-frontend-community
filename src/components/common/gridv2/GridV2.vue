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
 * 🔥 关键修复：手动注入列数样式
 * GridStack 默认只支持 1-12 列，超过 12 列需要手动注入 CSS
 *
 * 注意：组件间距由 .grid-stack-item-content 的 padding 实现（见 <style> 部分）
 */
function injectColumnStyles(columnCount: number): void {
  // 检查是否已经注入过该列数的样式
  const styleId = `gridstack-column-${columnCount}`
  if (document.getElementById(styleId)) {
    console.log(`🔍 [GridV2] 样式 ${styleId} 已存在，跳过注入`)
    return
  }

  // 生成样式规则
  const rules: string[] = []

  // 生成各宽度的样式（间距由 .grid-stack-item-content 的 padding 实现）
  for (let i = 1; i <= columnCount; i++) {
    const widthPercent = ((i / columnCount) * 100).toFixed(4)
    rules.push(`.gs-${columnCount} > .grid-stack-item[gs-w="${i}"] { width: ${widthPercent}% }`)
  }

  // 注入到 <head>
  const style = document.createElement('style')
  style.id = styleId
  style.textContent = rules.join('\n')
  document.head.appendChild(style)

  console.log(`✅ [GridV2] 已注入 ${columnCount} 列宽度样式，共 ${rules.length} 条规则`)
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

  // 🔥 强制 GridStack 的 margin 为 0
  // 我们使用 CSS 变量 + .grid-stack-item-content 的 padding 来实现间距
  // 不再使用 GridStack 内置的 margin 机制，避免冲突和布局问题
  const marginValue = 0

  // 🔥 关键修复：正确映射 GridLayoutPlus 配置到 GridStack 配置
  //
  // 用户需求：
  // 1. verticalCompact: false → 不自动重排（刷新后保持用户布局）
  // 2. 阻止组件重叠（拖拽时不能重叠到其他组件上）
  //
  // GridStack的float行为：
  // - float: false → 拖拽时自动推开其他组件（阻止重叠）✅，但compact()会自动填充空隙❌
  // - float: true  → 允许自由放置（允许重叠）❌
  //
  // 解决方案：
  // - 使用 float: false（阻止重叠）
  // - 不调用 compact() 方法（避免自动填充空隙）
  // - 这样既能阻止重叠，又不会自动重排
  const shouldVerticalCompact = config.verticalCompact !== false // 默认true
  const shouldFloat = false // 🔥 始终使用 false 以阻止组件重叠

  // 基础配置
  const options: GridStackOptions = {
    // 核心布局配置
    column: columnCount,
    cellHeight: rowHeightValue,

    // 🔥 关键：GridStack margin 固定为 0，间距由 CSS padding 实现
    margin: marginValue,

    // 交互配置
    disableDrag: props.readonly || config.isDraggable === false,
    disableResize: props.readonly || config.isResizable === false,
    staticGrid: props.readonly || config.staticGrid === true,

    // 🔥 关键：布局行为配置
    // 根据verticalCompact正确映射float值
    // float: true = 保持用户布局，不自动填充空隙（对应verticalCompact:false）
    // float: false = 自动填充空隙（对应verticalCompact:true）
    float: shouldFloat,

    // 🔥 关键：碰撞检测配置 - 解决组件重叠问题
    // preventCollision 从外部配置传入，默认为 true
    // true = 阻止组件重叠（即使float:true也不允许重叠）
    // 这样可以同时满足：不自动重排(float:true) + 阻止重叠(preventCollision:true)
    ...(config.preventCollision !== undefined ? { disableOneColumnMode: false } : {}),

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
    '🔥 float始终为false': '阻止组件重叠',
    '🔥 不调用compact()': '避免自动重排'
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

  // 🔥 关键修复：手动清理 GridStack 遗留的列数类名
  if (gridEl.value) {
    // 移除所有 gs-XX 格式的列数类名
    const classList = Array.from(gridEl.value.classList)
    classList.forEach(className => {
      if (/^gs-\d+$/.test(className)) {
        gridEl.value!.classList.remove(className)
        console.log('🔍 [GridV2] 清理旧列数类名:', className)
      }
    })
  }

  // 创建新实例
  const options = createOptionsFromProps()
  console.log('🔍 [GridV2] 初始化GridStack，配置:', {
    column: options.column,
    cellHeight: options.cellHeight,
    margin: options.margin,
    styleInHead: options.styleInHead
  })
  grid = GridStack.init(options, gridEl.value)
  console.log('🔍 [GridV2] GridStack实例创建完成，当前列数:', grid.getColumn())

  // 🔥 关键修复：GridStack 默认只支持 1-12 列，超过12列需要手动注入宽度样式
  const targetColumn = options.column || 12
  console.log(`🔍 [GridV2] 注入 ${targetColumn} 列宽度样式`)
  injectColumnStyles(targetColumn)

  // 🔍 检查 GridStack 是否在 <head> 中注入了样式
  setTimeout(() => {
    const currentCol = grid?.getColumn()
    const styleElements = document.head.querySelectorAll('style')
    let foundGridStackStyle = false
    let foundColumnStyle = false

    console.log(`🔍 [GridV2] 检查样式，当前列数: ${currentCol}，样式标签数量: ${styleElements.length}`)

    styleElements.forEach((style, index) => {
      const content = style.textContent || ''
      if (content.includes('grid-stack') || content.includes('.gs-')) {
        foundGridStackStyle = true

        // 检查是否有当前列数的样式
        if (content.includes(`.gs-${currentCol} >`)) {
          console.log(`🔍 [GridV2] 找到 .gs-${currentCol} > 列数样式 (#${index})`)
          foundColumnStyle = true
        }
      }
    })

    if (!foundGridStackStyle) {
      console.error('❌ [GridV2] 未找到GridStack注入的样式！')
    } else if (!foundColumnStyle) {
      console.error(`❌ [GridV2] 找到GridStack样式，但缺少 .gs-${currentCol} > 选择器样式！`)
      console.log('🔍 [GridV2] 尝试查找其他可能的样式格式...')

      // 检查是否有其他格式的列数样式
      styleElements.forEach((style, index) => {
        const content = style.textContent || ''
        if (content.includes(`${currentCol}`) && content.includes('grid-stack-item')) {
          console.log(`🔍 [GridV2] 在 <style> #${index} 中找到包含 ${currentCol} 的内容:`, content.substring(0, 500))
        }
      })
    } else {
      console.log(`✅ [GridV2] GridStack样式检查通过，包含 .gs-${currentCol} 列数样式`)
    }
  }, 100) // 增加延迟到100ms

  // 绑定事件
  grid.on('change', handleChange)

  // 🔥 新增：拖拽开始事件监控
  grid.on('dragstart', (_e: Event, el: GridItemHTMLElement) => {
    const node = el.gridstackNode
    if (!node) return

    // 检查所有组件的位置，看碰撞检测基于什么
    const allItems = grid.getGridItems()

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
    debugLog('拖拽结束:', node.id, node.x, node.y)

    console.log(`✅ [GridV2] 拖拽结束 [${node.id}]:`, {
      x: node.x,
      y: node.y
    })

    // 🔥 检查拖拽结束后所有组件的位置，验证碰撞检测
    console.log('📍 拖拽结束后所有组件位置:')
    const allItems = grid.getGridItems()
    let hasOverlap = false
    const positions: any[] = []

    allItems.forEach((item: GridItemHTMLElement, index) => {
      const n = item.gridstackNode
      positions.push({ id: n?.id, x: n?.x, y: n?.y })
      console.log(`  组件${index} [${n?.id}]:`, {
        'final-x': n?.x,
        'final-y': n?.y
      })
    })

    // 检测是否有组件重叠（同x同y）
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        if (positions[i].x === positions[j].x && positions[i].y === positions[j].y) {
          hasOverlap = true
          console.error(`❌ [GridV2] 数据层重叠！组件 ${positions[i].id} 和 ${positions[j].id} 都在 (${positions[i].x}, ${positions[i].y})`)
        }
      }
    }

    if (!hasOverlap) {
      console.log('✅ [GridV2] 数据层无重叠，开始同步视觉层...')
    }

    // 🔥 关键修复：拖拽结束后，GridStack更新了数据但不一定更新inline style
    // 必须手动重新设置所有组件的left/top，确保视觉与数据一致
    const currentColumn = grid.getColumn()
    const cellHeight = grid.getCellHeight()

    console.log('🔧 [GridV2] 拖拽后同步所有组件的视觉位置:')
    allItems.forEach((item: GridItemHTMLElement) => {
      if (item.gridstackNode) {
        const n = item.gridstackNode
        const leftPercent = ((n.x ?? 0) / currentColumn) * 100
        const topPx = (n.y ?? 0) * cellHeight

        console.log(`  同步 [${n.id}]: x=${n.x} → left=${leftPercent.toFixed(2)}%`)

        item.style.left = `${leftPercent}%`
        item.style.top = `${topPx}px`
        item.style.position = 'absolute'
      }
    })

    console.log('✅ [GridV2] 视觉位置同步完成')

    emit('item-moved', String(node.id), node.x ?? 0, node.y ?? 0)
  })

  // 缩放结束事件
  grid.on('resizestop', (_e: Event, el: GridItemHTMLElement) => {
    const node = el.gridstackNode
    if (!node) return
    debugLog('缩放结束:', node.id, node.w, node.h)

    console.log(`✅ [GridV2] 缩放结束 [${node.id}]:`, {
      x: node.x,
      y: node.y,
      w: node.w,
      h: node.h
    })

    // 🔥 关键修复：缩放可能改变位置，也需要同步视觉层
    const currentColumn = grid.getColumn()
    const cellHeight = grid.getCellHeight()

    console.log('🔧 [GridV2] 缩放后同步所有组件的视觉位置:')
    const allItems = grid.getGridItems()
    allItems.forEach((item: GridItemHTMLElement) => {
      if (item.gridstackNode) {
        const n = item.gridstackNode
        const leftPercent = ((n.x ?? 0) / currentColumn) * 100
        const topPx = (n.y ?? 0) * cellHeight

        item.style.left = `${leftPercent}%`
        item.style.top = `${topPx}px`
        item.style.position = 'absolute'
      }
    })

    console.log('✅ [GridV2] 视觉位置同步完成')

    emit('item-resized', String(node.id), node.h ?? 0, node.w ?? 0, 0, 0)
  })

  isInitialized = true

  // 下一帧注册widgets
  nextTick(() => {
    ensureNewWidgetsRegistered()

    // 🔥 关键修复：初始化时手动设置left/top
    // GridStack初始化后不会自动设置inline style（特别是>12列时）
    setTimeout(() => {
      if (grid) {
        const currentColumn = grid.getColumn()
        const cellHeight = grid.getCellHeight()
        console.log('🔍 [GridV2] 初始化定位设置，当前列数:', currentColumn)

        // 手动设置所有组件的left/top
        const allItems = grid.getGridItems()
        allItems.forEach((el: GridItemHTMLElement) => {
          if (el.gridstackNode) {
            const node = el.gridstackNode
            const leftPercent = ((node.x ?? 0) / currentColumn) * 100
            const topPx = (node.y ?? 0) * cellHeight

            console.log(`🔧 [GridV2] 初始化 [${node.id}] 定位: x=${node.x}, left=${leftPercent.toFixed(2)}%`)

            el.style.left = `${leftPercent}%`
            el.style.top = `${topPx}px`
            el.style.position = 'absolute'

            // 同时调用update()确保GridStack内部状态一致
            grid!.update(el, {
              x: node.x,
              y: node.y,
              w: node.w,
              h: node.h
            })
          }
        })

        console.log('🔍 [GridV2] 强制布局更新，当前列数:', currentColumn)

        // 检查grid容器的CSS类名
        const gridContainer = gridEl.value
        if (gridContainer) {
          console.log('🔍 [GridV2] Grid容器类名:', gridContainer.className)
        }

        // 方法1：触发resize事件强制重新计算
        grid.batchUpdate(false) // 暂停批量更新
        // 🔥 移除 compact() 调用，避免自动重排破坏用户布局
        // grid.compact() // 重新排列
        grid.batchUpdate(true) // 恢复批量更新

        // 方法2：强制触发窗口resize事件
        window.dispatchEvent(new Event('resize'))

        // 方法3：强制重新计算所有组件的CSS尺寸
        const itemsForUpdate = grid.getGridItems()
        itemsForUpdate.forEach((el: GridItemHTMLElement) => {
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

        // 检查grid-stack容器的CSS（使用已声明的gridContainer变量）
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
        itemsForUpdate.forEach((el: GridItemHTMLElement, index: number) => {
          const computedStyle = window.getComputedStyle(el)
          const node = el.gridstackNode
          console.log(`🔍 [GridV2] 组件${index} [${node?.id}]:`, {
            gridPosition: `w:${node?.w}`,
            cssWidth: computedStyle.width,
            gsWAttr: el.getAttribute('gs-w')
          })
        })

        debugLog('GridStack重新布局完成，更新了', itemsForUpdate.length, '个组件')
      }
    }, 100) // 100ms延迟确保DOM完全渲染

    debugLog('GridStack初始化完成')
  })
}

/**
 * 🔥 关键修复：动态float策略的列数切换
 * 解决：
 * 1. 列数切换时组件重叠问题
 * 2. 刷新后布局重排问题（竖排变横排）
 * 3. GridStack容器类名不更新问题
 */
async function updateColumns(newCol: number): Promise<void> {
  if (!Number.isFinite(newCol) || !grid || !gridEl.value) return

  const currentCol = grid.getColumn()
  console.log('🔍 [GridV2] updateColumns 调用:', {
    newCol,
    currentCol,
    layoutItemsCount: props.layout.length,
    currentFloat: grid.opts.float
  })

  // 如果列数没有实际变化，直接返回
  if (currentCol === newCol) {
    console.log('🔍 [GridV2] 列数未变化，跳过更新')
    return
  }

  try {
    // === 步骤1: 准备阶段 ===
    console.log('🔧 [GridV2] 步骤1: 准备列数切换')

    // 🔥 修复：始终使用 float: false 以阻止组件重叠
    // 不需要动态切换float，保持false状态
    const currentFloat = grid.opts.float

    console.log('🔧 [GridV2] Float配置:', {
      currentFloat,
      verticalCompact: props.config?.verticalCompact,
      说明: 'float始终为false以阻止重叠'
    })

    // === 步骤2: 确保float=false ===
    if (currentFloat === true) {
      console.log('🔧 [GridV2] 步骤2: 确保float=false（阻止重叠）')
      grid.float(false)
    }

    // === 步骤3: 注入新列数样式 ===
    console.log('🔧 [GridV2] 步骤3: 注入列宽样式')
    injectColumnStyles(newCol)

    // === 🔍 分析：column()前的容器状态 ===
    console.log('🔍 [分析] ===== column()执行前 =====')
    console.log('🔍 [分析] 容器className:', gridEl.value.className)
    console.log('🔍 [分析] 容器inline style:', gridEl.value.style.cssText)
    const beforeComputedStyle = window.getComputedStyle(gridEl.value)
    console.log('🔍 [分析] 容器computed width:', beforeComputedStyle.width)
    console.log('🔍 [分析] 容器computed maxWidth:', beforeComputedStyle.maxWidth)
    console.log('🔍 [分析] 容器computed minWidth:', beforeComputedStyle.minWidth)
    console.log('🔍 [分析] 容器computed display:', beforeComputedStyle.display)
    console.log('🔍 [分析] 容器computed position:', beforeComputedStyle.position)

    // 检查父容器
    const parentEl = gridEl.value.parentElement
    if (parentEl) {
      const parentStyle = window.getComputedStyle(parentEl)
      console.log('🔍 [分析] 父容器className:', parentEl.className)
      console.log('🔍 [分析] 父容器computed width:', parentStyle.width)
    }

    // === 步骤4: 执行列数切换 ===
    console.log('🔧 [GridV2] 步骤4: 执行column()切换')
    // 🔥 关键修复：使用'none'模式，保持w值不变
    // 'moveScale'会缩放w值，导致组件相对宽度不变（错误）
    // 'none'保持w不变，让CSS百分比自动调整宽度（正确）
    // 例如：12列w=6占50% → 24列w=6占25% → 一行能放2倍组件
    grid.column(newCol, 'none')

    // === 🔍 分析：column()后的容器状态 ===
    console.log('🔍 [分析] ===== column()执行后 =====')
    console.log('🔍 [分析] 容器className:', gridEl.value.className)
    console.log('🔍 [分析] 容器inline style:', gridEl.value.style.cssText)
    const afterComputedStyle = window.getComputedStyle(gridEl.value)
    console.log('🔍 [分析] 容器computed width:', afterComputedStyle.width)
    console.log('🔍 [分析] 容器computed maxWidth:', afterComputedStyle.maxWidth)
    console.log('🔍 [分析] 容器computed minWidth:', afterComputedStyle.minWidth)
    console.log('🔍 [分析] 容器computed display:', afterComputedStyle.display)
    console.log('🔍 [分析] 容器computed position:', afterComputedStyle.position)

    // 对比变化
    console.log('🔍 [分析] 宽度变化:', beforeComputedStyle.width, '→', afterComputedStyle.width)

    // === 🔍 分析：检查所有相关的CSS样式 ===
    console.log('🔍 [分析] ===== 检查CSS样式 =====')
    const allStyles = document.head.querySelectorAll('style')
    let foundGridStackStyles = []
    allStyles.forEach((style, index) => {
      const content = style.textContent || ''
      // 查找包含gs-24或grid-stack的样式
      if (content.includes(`.gs-${newCol}`) || content.includes('grid-stack')) {
        foundGridStackStyles.push({
          index,
          id: style.id,
          hasContainerRule: content.includes(`.gs-${newCol} {`) || content.includes(`.grid-stack {`),
          preview: content.substring(0, 200) + (content.length > 200 ? '...' : '')
        })
      }
    })
    console.log('🔍 [分析] 找到相关样式:', foundGridStackStyles)

    // 检查所有组件的实际位置和宽度
    const allItems = grid.getGridItems()
    console.log('🔍 [分析] ===== 所有组件详细状态 =====')
    allItems.forEach((item, index) => {
      const itemStyle = window.getComputedStyle(item)
      const itemNode = item.gridstackNode

      // 🔥 关键：检查inline style
      const inlineStyle = item.style.cssText

      console.log(`🔍 [分析] 组件${index} [${itemNode?.id}]:`, {
        'x位置': itemNode?.x,
        'y位置': itemNode?.y,
        'w宽度': itemNode?.w,
        'h高度': itemNode?.h,
        'gs-x属性': item.getAttribute('gs-x'),
        'gs-y属性': item.getAttribute('gs-y'),
        'gs-w属性': item.getAttribute('gs-w'),
        '🔥 inline style': inlineStyle,
        'computed width': itemStyle.width,
        'computed left': itemStyle.left,
        'computed top': itemStyle.top,
        'computed position': itemStyle.position
      })
    })

    // 检查是否有组件重叠
    if (allItems.length >= 2) {
      const item0Style = window.getComputedStyle(allItems[0])
      const item1Style = window.getComputedStyle(allItems[1])
      const item0Left = parseFloat(item0Style.left)
      const item1Left = parseFloat(item1Style.left)
      const item0Width = parseFloat(item0Style.width)

      console.log('🔍 [分析] 重叠检测:', {
        '组件0 left': item0Left,
        '组件0 right': item0Left + item0Width,
        '组件1 left': item1Left,
        '是否重叠': item1Left < (item0Left + item0Width)
      })
    }

    // === 步骤5: 检查并修复容器类名 ===
    console.log('🔧 [GridV2] 步骤5: 检查容器类名')
    const expectedClass = `gs-${newCol}`

    // 清理所有旧的gs-XX类名
    const classList = Array.from(gridEl.value.classList)
    classList.forEach(className => {
      if (/^gs-\d+$/.test(className) && className !== expectedClass) {
        gridEl.value!.classList.remove(className)
        console.log('🔧 [GridV2] 移除旧类名:', className)
      }
    })

    // 添加新类名（如果不存在）
    if (!gridEl.value.classList.contains(expectedClass)) {
      gridEl.value.classList.add(expectedClass)
      console.log('🔧 [GridV2] 添加新类名:', expectedClass)
    }

    // === 步骤6: 等待GridStack完成更新 ===
    console.log('🔧 [GridV2] 步骤6: 等待GridStack更新完成')
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 50))

    // === 🔥 步骤6.5: 手动设置left/top（column('none')不会设置）===
    // 关键发现：column(newCol, 'none')模式下GridStack不设置inline style
    // 导致：1. 组件left都是0（错误） 2. 碰撞检测失效
    // 解决：手动设置left/top，GridStack基于正确位置进行碰撞检测
    console.log('🔧 [GridV2] 步骤6.5: 手动设置组件left/top（column不会设置）')

    const itemsToUpdate = grid.getGridItems()
    const cellHeight = grid.getCellHeight()

    itemsToUpdate.forEach((el: GridItemHTMLElement) => {
      if (el.gridstackNode) {
        const node = el.gridstackNode

        // 🔥 关键：手动计算并设置正确的left/top
        // 这样GridStack的碰撞检测才能基于正确位置工作
        const leftPercent = ((node.x ?? 0) / newCol) * 100
        const topPx = (node.y ?? 0) * cellHeight

        console.log(`🔧 [GridV2] 设置 [${node.id}] 定位:`, {
          x: node.x,
          w: node.w,
          leftPercent: leftPercent.toFixed(4) + '%',
          topPx: topPx + 'px'
        })

        // 设置inline style
        el.style.left = `${leftPercent}%`
        el.style.top = `${topPx}px`
        el.style.position = 'absolute'

        // 同时调用update()确保GridStack内部状态一致
        grid!.update(el, {
          x: node.x,
          y: node.y,
          w: node.w,
          h: node.h
        })
      }
    })

    console.log('✅ [GridV2] 定位设置完成，共处理', itemsToUpdate.length, '个组件')

    // 再次等待确保update()完成
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 30))

    // === 🔍 分析：检查组件位置 ===
    console.log('🔍 [分析] ===== 列数切换后组件状态 =====')
    const finalItems = grid.getGridItems()
    finalItems.forEach((item, index) => {
      const node = item.gridstackNode
      console.log(`🔍 [分析] 组件${index}:`, {
        id: node?.id,
        x: node?.x,
        y: node?.y,
        w: node?.w,
        float: grid.opts.float
      })
    })

    // === 步骤7: 保持float=false ===
    // 🔥 不再恢复float=true，始终保持false以阻止组件重叠
    console.log('🔧 [GridV2] 步骤7: 保持float=false（阻止重叠）')

    // === 步骤8: 读取并发射新布局 ===
    console.log('🔧 [GridV2] 步骤8: 读取并发射新布局')
    const updatedLayout = Array.from(grid.getGridItems()).map((el: GridItemHTMLElement) => {
      const node = el.gridstackNode
      if (!node) return null
      return {
        i: String(node.id),
        x: node.x ?? 0,
        y: node.y ?? 0,
        w: node.w ?? 1,
        h: node.h ?? 1
      }
    }).filter(Boolean) as any[]

    console.log('✅ [GridV2] 列数切换完成:', {
      newCol,
      componentsCount: updatedLayout.length,
      finalFloat: grid.opts.float
    })

    emit('layout-change', updatedLayout)
    emit('update:layout', updatedLayout)
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

  // 🔥 组件间距：优先使用 horizontalGap/verticalGap，兼容旧的 margin 配置
  let horizontalGap = 0 // 默认 0px
  let verticalGap = 0

  // 新配置优先
  if (config.horizontalGap !== undefined) {
    horizontalGap = config.horizontalGap
  } else if (Array.isArray(config.margin)) {
    horizontalGap = config.margin[0] ?? 0
  }

  if (config.verticalGap !== undefined) {
    verticalGap = config.verticalGap
  } else if (Array.isArray(config.margin)) {
    verticalGap = config.margin[1] ?? 0
  }

  styles['--h-gap'] = `${horizontalGap}px`
  styles['--v-gap'] = `${verticalGap}px`

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
  /* 🔥 关键：在content层设置padding产生组件间距 */
  /* content 会比 item 小，从而产生视觉上的间距效果 */
  /* 使用 CSS 变量支持动态调整，默认 0px */
  /* 注意顺序：padding-top/bottom (垂直), padding-left/right (水平) */
  padding-top: var(--v-gap, 0px);
  padding-bottom: var(--v-gap, 0px);
  padding-left: var(--h-gap, 0px);
  padding-right: var(--h-gap, 0px);
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


