<template>
  <div class="grid-v2-wrapper">
    <div ref="gridEl" class="grid-stack" :class="props.containerClass" :style="gridStyle">
      <div
        v-for="item in props.layout"
        :id="itemKey(item)"
        :key="itemKey(item)"
        class="grid-stack-item"
        :gs-id="itemKey(item)"
        :gs-x="item.x"
        :gs-y="item.y"
        :gs-w="item.w"
        :gs-h="item.h"
        :gs-min-w="item.minW"
        :gs-min-h="item.minH"
        :gs-max-w="item.maxW"
        :gs-max-h="item.maxH"
      >
        <div class="grid-stack-item-content">
          <slot :item="item">
            <div class="grid-v2-fallback">{{ itemKey(item) }}</div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import 'gridstack/dist/dd-gridstack'
import 'gridstack/dist/gridstack.min.css'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { GridStack, type GridStackNode, type GridStackOptions } from 'gridstack'
import type {
  GridLayoutPlusConfig,
  GridLayoutPlusEmits,
  GridLayoutPlusItem,
  GridLayoutPlusProps
} from '@/components/common/grid/gridLayoutPlusTypes'

const props = defineProps<GridLayoutPlusProps>()
const emit = defineEmits<GridLayoutPlusEmits>()

const gridEl = ref<HTMLDivElement | null>(null)
let grid: GridStack | null = null
let isReady = false
let layoutHashSnapshot = ''

const injectedColumns = new Set<number>()
let isAutoArranging = false

const shouldAutoArrange = computed(() => props.config?.autoArrange === true)

const idKey = computed(() => (props.idKey && props.idKey.length > 0 ? props.idKey : 'i'))

const gridStyle = computed(() => {
  const { cellHeight, verticalGap, horizontalGap } = resolveConfig()
  const minRowsFromConfig = Number(props.config?.minRows) || 0
  const minHeightFromConfig = Number(props.config?.minH) || 0
  const layoutRows = props.layout.length
    ? Math.max(...props.layout.map(item => Number(item.y) + Number(item.h) || 0))
    : 0
  const rows = Math.max(layoutRows, minRowsFromConfig, 1)
  const totalHeight = rows * cellHeight + Math.max(rows - 1, 0) * verticalGap
  const minHeightPx = Math.max(totalHeight, minHeightFromConfig)
  return {
    minHeight: `${minHeightPx}px`,
    '--grid-v-gap': `${verticalGap}px`,
    '--grid-h-gap': `${horizontalGap}px`
  }
})

function itemKey(item: GridLayoutPlusItem): string {
  const raw = (item as Record<string, unknown>)[idKey.value]
  if (raw !== undefined && raw !== null && raw !== '') return String(raw)
  if (item.i !== undefined) return String(item.i)
  return ''
}

function hashLayout(layout: GridLayoutPlusItem[]): string {
  return JSON.stringify(
    layout.map(item => ({
      i: itemKey(item),
      x: Number(item.x) || 0,
      y: Number(item.y) || 0,
      w: Number(item.w) || 0,
      h: Number(item.h) || 0,
      // ✅ 添加锁定状态到hash中，使得锁定变化能触发更新
      locked: (item as any).locked || false,
      static: (item as any).static || false
    }))
  )
}

function resolveConfig(): {
  column: number
  cellHeight: number
  horizontalGap: number
  verticalGap: number
  margin: string
  rawConfig: Partial<GridLayoutPlusConfig>
} {
  const rawConfig = props.config ?? ({} as Partial<GridLayoutPlusConfig>)
  const column = Number.isFinite(Number(rawConfig.colNum)) ? Math.max(1, Number(rawConfig.colNum)) : 12
  const cellHeight = Number.isFinite(Number(rawConfig.rowHeight)) ? Math.max(1, Number(rawConfig.rowHeight)) : 80

  let horizontalGap = 0
  if (rawConfig.horizontalGap !== undefined) horizontalGap = Number(rawConfig.horizontalGap)
  else if (Array.isArray(rawConfig.margin)) horizontalGap = Number(rawConfig.margin[0] ?? 0)

  let verticalGap = 0
  if (rawConfig.verticalGap !== undefined) verticalGap = Number(rawConfig.verticalGap)
  else if (Array.isArray(rawConfig.margin)) verticalGap = Number(rawConfig.margin[1] ?? 0)

  horizontalGap = Math.max(0, horizontalGap)
  verticalGap = Math.max(0, verticalGap)

  const margin = `${verticalGap}px ${horizontalGap}px`

  return { column, cellHeight, horizontalGap, verticalGap, margin, rawConfig }
}

function createOptions(resolved: ReturnType<typeof resolveConfig>): GridStackOptions {
  const rawConfig = resolved.rawConfig
  const isStatic = Boolean(props.readonly || rawConfig.staticGrid)
  const disableDrag = isStatic || rawConfig.isDraggable === false
  const disableResize = isStatic || rawConfig.isResizable === false

  // 🔥 关键调试：输出配置信息
  console.log('🔧🔧🔧 [GridV2] createOptions 配置:', {
    'props.readonly': props.readonly,
    'rawConfig.staticGrid': rawConfig.staticGrid,
    'rawConfig.isDraggable': rawConfig.isDraggable,
    'rawConfig.isResizable': rawConfig.isResizable,
    isStatic: isStatic,
    disableDrag: disableDrag,
    disableResize: disableResize
  })

  return {
    column: resolved.column,
    cellHeight: resolved.cellHeight,
    margin: resolved.margin,
    staticGrid: isStatic,
    disableDrag,
    disableResize,
    float: rawConfig.verticalCompact === false,
    styleInHead: true,
    animate: false,
    resizable: { handles: 'se' },
    // 🔥 最终修复：完全移除 handle 配置，让 GridStack 使用默认拖拽行为
    // GridStack 默认会让整个 grid-stack-item 可拖拽，同时保护内部交互元素
    draggable: { appendTo: 'parent', scroll: false }
  }
}

function ensureColumnStyles(column: number): void {
  if (column <= 12 || injectedColumns.has(column)) return
  let text = ''
  if (!text || !text.trim()) {
    const lines: string[] = []
    for (let i = 1; i <= column; i++) {
      const width = ((i / column) * 100).toFixed(4)
      lines.push(
        `.grid-stack.grid-stack-${column} > .grid-stack-item[gs-w="${i}"], .grid-stack.gs-${column} > .grid-stack-item[gs-w="${i}"] { width: ${width}% }`
      )
    }
    for (let x = 0; x < column; x++) {
      const left = ((x / column) * 100).toFixed(4)
      lines.push(
        `.grid-stack.grid-stack-${column} > .grid-stack-item[gs-x="${x}"], .grid-stack.gs-${column} > .grid-stack-item[gs-x="${x}"] { left: ${left}% }`
      )
    }
    text = lines.join('\n')
  }
  if (!text.trim()) return
  const style = document.createElement('style')
  style.dataset.gridstackColumn = String(column)
  style.textContent = text
  document.head.appendChild(style)
  injectedColumns.add(column)
}

function applyColumnClass(column: number): void {
  const el = gridEl.value
  if (!el) return
  el.classList.remove('grid-stack-12', 'grid-stack-24', 'grid-stack-36')
  el.classList.remove('gs-12', 'gs-24', 'gs-36')
  el.classList.add(`grid-stack-${column}`)
  el.classList.add(`gs-${column}`)
}

function runAutoArrange(): void {
  if (!grid || !shouldAutoArrange.value || isAutoArranging) return
  isAutoArranging = true
  try {
    grid.batchUpdate()
    grid.compact('compact', true)
    grid.batchUpdate(false)
  } finally {
    isAutoArranging = false
  }
}

function normalizeLayout(layout: GridLayoutPlusItem[]): GridStackNode[] {
  return layout.map(item => ({
    x: Number(item.x) || 0,
    y: Number(item.y) || 0,
    w: Math.max(1, Number(item.w) || 1),
    h: Math.max(1, Number(item.h) || 1),
    id: itemKey(item) || undefined,
    minW: item.minW,
    minH: item.minH,
    maxW: item.maxW,
    maxH: item.maxH,
    // ✅ 添加锁定属性支持
    locked: (item as any).locked || false,
    noMove: (item as any).locked || (item as any).static || false,
    noResize: (item as any).locked || (item as any).static || false
  }))
}

function destroyGrid(): void {
  if (grid) {
    grid.destroy(false)
    grid = null
  }
  isReady = false
}

function applyLayoutInternal(layout: GridLayoutPlusItem[]): void {
  if (!grid) return
  console.log('🔥🔥🔥 [GridV2] applyLayoutInternal 开始执行，组件数:', layout.length)

  try {
    // 🔥 终极修复：完全销毁并重新初始化 GridStack
    // 这是热更新能正常工作的原因 - 它会完全重新初始化
    console.log('🔥🔥🔥 [GridV2] 销毁并重新初始化 GridStack')
    const resolved = resolveConfig()
    const currentColumn = resolved.column

    // 保存当前的事件监听器
    const changeHandler = handleGridChange

    // 销毁旧的 grid
    destroyGrid()

    // 重新初始化
    ensureColumnStyles(currentColumn)
    grid = GridStack.init(createOptions(resolved), gridEl.value!)
    grid.on('change', changeHandler)
    applyColumnClass(currentColumn)

    // 加载布局
    grid.batchUpdate()
    grid.load(normalizeLayout(layout), true)
    grid.batchUpdate(false)
    layoutHashSnapshot = hashLayout(layout)

    // 同步交互性
    syncInteractivity()

    console.log('🔥🔥🔥 [GridV2] GridStack 重新初始化完成')

    // 🔥 深度调试：检查每个元素的拖拽状态
    console.log('🔍🔍🔍 [GridV2] 检查所有元素的拖拽状态:')
    const items = grid.getGridItems()
    items.forEach((el, index) => {
      const node = el.gridstackNode
      const hasDraggable = el.classList.contains('ui-draggable')
      const hasResizable = el.classList.contains('ui-resizable')
      const hasGridStackItem = el.classList.contains('grid-stack-item')

      console.log(`  元素 ${index} [${node?.id}]:`, {
        hasDraggable,
        hasResizable,
        hasGridStackItem,
        noMove: node?.noMove,
        noResize: node?.noResize,
        locked: node?.locked,
        所有class: el.className
      })
    })

    isReady = true
  } catch (error) {
    console.error('❌❌❌ [GridV2] applyLayoutInternal 执行出错:', error)
    throw error
  }

  console.log('🔥🔥🔥 [GridV2] applyLayoutInternal 执行完成')
}

function initializeGrid(): void {
  if (!gridEl.value) return

  const resolved = resolveConfig()
  ensureColumnStyles(resolved.column)
  destroyGrid()
  grid = GridStack.init(createOptions(resolved), gridEl.value)
  grid.on('change', handleGridChange)
  applyColumnClass(resolved.column)

  applyLayoutInternal(props.layout ?? [])
  syncInteractivity()

  // 🔥 初始化后检查拖拽状态
  console.log('🔍🔍🔍 [GridV2] 初始化完成后检查拖拽状态:')
  const items = grid.getGridItems()
  items.forEach((el, index) => {
    const node = el.gridstackNode
    const hasDraggable = el.classList.contains('ui-draggable')
    const hasResizable = el.classList.contains('ui-resizable')
    const hasGridStackItem = el.classList.contains('grid-stack-item')

    console.log(`  初始元素 ${index} [${node?.id}]:`, {
      hasDraggable,
      hasResizable,
      hasGridStackItem,
      noMove: node?.noMove,
      noResize: node?.noResize,
      locked: node?.locked,
      所有class: el.className
    })
  })

  isReady = true
}

function collectLayoutFromGrid(): GridLayoutPlusItem[] {
  if (!grid) return []
  return grid
    .getGridItems()
    .map(el => {
      const node = el.gridstackNode
      if (!node) return null
      const id = String(node.id ?? el.getAttribute('gs-id') ?? el.id)
      const item: GridLayoutPlusItem = {
        i: id,
        x: node.x ?? 0,
        y: node.y ?? 0,
        w: node.w ?? 1,
        h: node.h ?? 1
      }
      if (idKey.value !== 'i') (item as Record<string, unknown>)[idKey.value] = id
      if (node.minW) item.minW = node.minW
      if (node.minH) item.minH = node.minH
      if (node.maxW) item.maxW = node.maxW
      if (node.maxH) item.maxH = node.maxH
      return item
    })
    .filter(Boolean) as GridLayoutPlusItem[]
}

function handleGridChange(_event: Event, _nodes?: GridStackNode[]): void {
  if (!grid) return
  const snapshot = collectLayoutFromGrid()
  layoutHashSnapshot = hashLayout(snapshot)
  emit('layout-change', snapshot)
  emit('update:layout', snapshot)
  emit('layout-updated', snapshot)
}

function updateColumns(newCol: number | undefined): void {
  if (!grid || !isReady) return
  if (!Number.isFinite(newCol) || !newCol) return

  const target = Math.max(1, Math.floor(newCol))
  const current = grid.getColumn()
  if (current === target) return

  ensureColumnStyles(target)
  grid.column(target, 'none')
  applyColumnClass(target)
  runAutoArrange()

  const snapshot = collectLayoutFromGrid()
  layoutHashSnapshot = hashLayout(snapshot)
  emit('layout-change', snapshot)
  emit('update:layout', snapshot)
  emit('layout-updated', snapshot)
}

function syncInteractivity(): void {
  if (!grid) return
  const config = props.config ?? {}
  const isStatic = Boolean(props.readonly || config.staticGrid)
  const canMove = !isStatic && config.isDraggable !== false
  const canResize = !isStatic && config.isResizable !== false

  grid.setStatic(isStatic)
  grid.enableMove(canMove)
  grid.enableResize(canResize)
}

onMounted(() => {
  nextTick().then(() => initializeGrid())
})

onBeforeUnmount(() => destroyGrid())

watch(
  () => props.layout,
  layout => {
    console.log('👀 [GridV2] props.layout 变化检测到，isReady:', isReady)
    if (!isReady) {
      console.log('❌ [GridV2] GridStack 未就绪，跳过处理')
      return
    }
    const incomingHash = hashLayout(layout ?? [])
    console.log('👀 [GridV2] 布局 hash 对比:', { incomingHash, layoutHashSnapshot })
    if (incomingHash === layoutHashSnapshot) {
      console.log('❌ [GridV2] 布局未变化，跳过处理')
      return
    }
    console.log('✅ [GridV2] 布局已变化，准备调用 applyLayoutInternal')
    // 🔥 关键修复：等待 Vue 的 DOM 更新完成后再调用 GridStack
    // 因为新组件是通过 v-for 添加的，需要等 DOM 真正渲染后 GridStack 才能识别
    nextTick(() => {
      console.log('✅ [GridV2] nextTick 执行，调用 applyLayoutInternal')
      applyLayoutInternal(layout ?? [])
    })
  },
  { deep: true }
)

watch(
  () => props.config?.colNum,
  col => updateColumns(Number(col))
)

watch(
  () => [props.config?.rowHeight, props.config?.horizontalGap, props.config?.verticalGap, props.config?.margin],
  () => {
    if (!isReady) return
    initializeGrid()
  },
  { deep: true }
)

watch(
  () => [props.readonly, props.config?.isDraggable, props.config?.isResizable, props.config?.staticGrid],
  () => syncInteractivity()
)

watch(
  () => props.config?.autoArrange,
  () => runAutoArrange()
)
</script>

<style scoped>
.grid-v2-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.grid-stack {
  width: 100%;
  height: 100%;
  position: relative;
  user-select: none;
  touch-action: none;
  overflow: hidden;
}

.grid-stack-item-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  padding: var(--grid-v-gap, 0px) var(--grid-h-gap, 0px);
}

.grid-v2-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 14px;
  color: #666;
  background: #f5f5f5;
}

:deep(.grid-stack-item.ui-draggable-dragging),
:deep(.grid-stack-item.ui-resizable-resizing) {
  z-index: 1000;
}

/* 🔥 修复：调整 resize handle 位置，确保在元素的最右下角 */
:deep(.grid-stack-item > .ui-resizable-handle) {
  /* 确保句柄不受 padding 影响 */
  box-sizing: border-box;
  position: absolute !important;
}

:deep(.grid-stack-item > .ui-resizable-se) {
  /* 右下角句柄 - 让图标的右下角对齐元素的右下角 */
  right: 14px !important;
  bottom: 0 !important;
  /* GridStack 的 resize handle 默认尺寸约为 20x20，边缘留 2px 视觉效果更好 */
}

:deep(.grid-stack-item > .ui-resizable-s) {
  /* 底部句柄 */
  bottom: 0 !important;
  transform: translateY(-2px) !important;
}

:deep(.grid-stack-item > .ui-resizable-e) {
  /* 右侧句柄 */
  right: 0 !important;
  transform: translateX(-2px) !important;
}
</style>
