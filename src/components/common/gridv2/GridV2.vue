<template>
  <!--
    GridV2（基于 GridStack 的最小可用封装）
    - 直接复用 GridLayoutPlus 的 Props/Emits 协议，便于无缝替换
    - 使用 v-for 渲染网格项，并在 onMounted + nextTick 后由 GridStack 接管（makeWidget）
    - 默认插槽透出 { item }，与原调用方写法保持一致
  -->
  <div class="grid-v2-wrapper">
    <!-- GridStack 容器：必须具有 .grid-stack 类名 -->
    <div class="grid-stack" ref="gridEl">
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
 * GridV2
 * - 以官方 ex.html 为基础逻辑（初始化、change 同步、makeWidget 注册、removeWidget 移除）
 * - TS 严格类型 + 中文注释
 * - 不做多余抽象，保证最小可用 + 清晰行为
 */
// 启用原生 HTML5 拖拽/缩放插件（gridstack v9 使用 dd-gridstack 作为 H5 DnD 驱动）
import 'gridstack/dist/dd-gridstack'
// 新增：引入 GridStack 必需的基础样式（避免刷新后无样式导致宽高为 0）
import 'gridstack/dist/gridstack.min.css'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { GridStack, type GridStackNode, type GridItemHTMLElement, type GridStackOptions } from 'gridstack'
import type { GridLayoutPlusProps, GridLayoutPlusEmits, GridLayoutPlusItem } from '@/components/common/grid/gridLayoutPlusTypes'

// 复用 GridLayoutPlus 的 props / emits 协议
const props = defineProps<GridLayoutPlusProps>()
const emit = defineEmits<GridLayoutPlusEmits>()

// Grid 容器与实例（注意：不要用 ref 包装 grid 实例，避免 Proxy 干扰内部比较逻辑）
const gridEl = ref<HTMLDivElement | null>(null)
let grid: GridStack | null = null
// 在列数切换时的内部标志：用于屏蔽 change 事件，避免父级更新造成的循环
let isChangingColumns = false
// 新增：记录是否已完成首次初始化（避免重复 init），以及“可见性观察器”
let hasInitialized = false
let visibilityObserver: ResizeObserver | null = null

/**
 * 将 props.config.margin 转为内容层的 CSS 变量（水平/垂直内间距）：
 * - 仅影响 .grid-stack-item-content 的 padding，避免触碰 GridStack 引擎配置
 * - 好处：不需要重建实例，视觉间距可快速切换
 */
function applyContentGutterFromConfig(): void {
  const el = gridEl.value
  if (!el) return
  const margin = props.config?.margin
  // 支持 [水平, 垂直] 元组；缺省为 [0, 0]
  let h = 0
  let v = 0
  if (Array.isArray(margin) && margin.length >= 2) {
    const [mx, my] = margin
    h = Number(mx) || 0
    v = Number(my) || 0
  }
  // 设置容器级 CSS 变量，供 .grid-stack-item-content 使用
  el.style.setProperty('--h-gap', `${h}px`)
  el.style.setProperty('--v-gap', `${v}px`)
  debugLog('应用外层内容间距变量: hGap=', h, ' vGap=', v)
}

// 新增：当容器可见（非零宽高）时再初始化 GridStack，修复刷新后宽高为 0 必须改配置才显示的问题
function scheduleInitWhenVisible(): void {
  const el = gridEl.value
  if (!el || hasInitialized) return
  const w = el.clientWidth
  const h = el.clientHeight
  if (w > 0 && h > 0) {
    debugLog('容器可见，开始初始化 GridStack，size=', w, h)
    reinitGrid()
    hasInitialized = true
    return
  }
  debugLog('容器当前不可见，等待可见后初始化，size=', w, h)
  try { visibilityObserver?.disconnect() } catch {}
  visibilityObserver = new ResizeObserver((entries: ReadonlyArray<ResizeObserverEntry>) => {
    const entry = entries[0]
    const rect = entry?.contentRect
    const cw = rect?.width ?? el.clientWidth
    const ch = rect?.height ?? el.clientHeight
    if (cw > 0 && ch > 0) {
      debugLog('检测到容器已可见，执行初始化，size=', cw, ch)
      try { visibilityObserver?.disconnect() } catch {}
      visibilityObserver = null
      reinitGrid()
      hasInitialized = true
    }
  })
  visibilityObserver.observe(el)
}

// 统一获取条目唯一 ID：支持 idKey 自定义（默认 'i'）
const idKey = computed<string>(() => (props.idKey && props.idKey.length > 0 ? props.idKey : 'i'))
const getItemId = (item: GridLayoutPlusItem): string => {
  const k = idKey.value
  const v = (item as unknown as Record<string, unknown>)[k]
  return String((v ?? item.i) as string)
}

// 依据组件只读 / 全局配置 / 条目级别属性判断是否禁用拖拽
function isNoMove(item: GridLayoutPlusItem): boolean {
  // 只读优先：完全禁用拖拽
  if (props.readonly) return true
  // 全局配置禁用拖拽
  if (props.config?.isDraggable === false) return true
  // 条目级别：gridstack 支持 static 表示彻底静态（不可拖拽、不可缩放）
  if ((item as unknown as { static?: boolean }).static === true) return true
  // 条目级别：仅禁用拖拽
  if ((item as unknown as { isDraggable?: boolean }).isDraggable === false) return true
  return false
}

// 依据组件只读 / 全局配置 / 条目级别属性判断是否禁用缩放
function isNoResize(item: GridLayoutPlusItem): boolean {
  // 只读优先：完全禁用缩放
  if (props.readonly) return true
  // 全局配置禁用缩放
  if (props.config?.isResizable === false) return true
  // 条目级别：static=true 或 isResizable=false
  if ((item as unknown as { static?: boolean }).static === true) return true
  if ((item as unknown as { isResizable?: boolean }).isResizable === false) return true
  return false
}

// 维护一份 ID 列表用于增删对比
let lastIds = new Set<string>()

// 将 GridStack 变更同步回 layout，并按协议透出事件
function handleChange(_event: Event, changed: GridStackNode[] | undefined): void {
  // 若正处于列数切换的批处理阶段，临时屏蔽 change 事件，避免外部双向绑定引发“死循环”
  if (isChangingColumns) return
  if (!changed || changed.length === 0) return

  // 基于当前 props.layout 生成新的布局（不可直接修改 props，需拷贝）
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

  // 透出与 GridLayoutPlus 对齐的事件
  emit('layout-change', newLayout)
  emit('update:layout', newLayout)
  emit('layout-updated', newLayout)
}

// ensureAllWidgetsRegistered
// - 新增的 DOM 节点需要调用 grid.makeWidget() 让 GridStack 接管
// - 被移除的节点需要 grid.removeWidget(selector, false) 与引擎同步
function ensureAllWidgetsRegistered(): void {
  if (!grid) return
  const currentIds = new Set<string>(props.layout.map((it) => getItemId(it)))

  // 1) 为新节点注册
  props.layout.forEach((it) => {
    const id = getItemId(it)
    const el = gridEl.value?.querySelector<HTMLElement>(`#${CSS.escape(id)}`) as GridItemHTMLElement | null
    if (el && !el.gridstackNode) {
      grid!.makeWidget(el)
    }
  })

  // 2) 移除已不存在的节点
  lastIds.forEach((id) => {
    if (!currentIds.has(id)) {
      grid!.removeWidget(`#${id}`, false)
    }
  })

  lastIds = currentIds
}

// ---- 新增：根据 props 构建 GridStack 初始化参数（集中一处，便于重用与对比）
// 说明：GridStack v9 支持 margin 传入 number 或 CSS 字符串；此处将 [水平, 垂直] 转为 CSS 简写，符合 top/bottom 与 left/right 语义
function createOptionsFromProps(): (GridStackOptions & { margin?: number | string }) {
  const colNum = props.config?.colNum ?? 12
  const rowHeight = props.config?.rowHeight ?? 100
  const readonly = !!props.readonly
  const staticGridConfig = props.config?.staticGrid === true // 显式支持静态网格开关

  const options: GridStackOptions & { margin?: number | string } = {
    // 列数：与 GridLayoutPlus 的 colNum 对齐
    column: typeof colNum === 'number' ? colNum : Number(colNum),
    // 行高：与 GridLayoutPlus 的 rowHeight 对齐
    cellHeight: typeof rowHeight === 'number' ? rowHeight : Number(rowHeight),
    // readonly 或 config.staticGrid => staticGrid：完全禁用拖拽与缩放
    staticGrid: readonly || staticGridConfig,
    // 拖拽/缩放开关（在非只读/非静态下受 config 控制）
    disableDrag: readonly || staticGridConfig || props.config?.isDraggable === false,
    disableResize: readonly || staticGridConfig || props.config?.isResizable === false,
    // 设置拖拽把手为整张卡片元素（grid-stack-item），覆盖 gridstack 默认的 .grid-stack-item-content
    draggable: {
      handle: '.grid-stack-item',
      // 允许常见表单控件内的交互不触发拖拽；如需屏蔽更多元素可在此追加选择器
      cancel: 'input,textarea,button,select,option,[draggable="false"]'
    },
    // 是否允许元素“浮动”（不压缩），GridLayoutPlus 默认 verticalCompact=true，这里默认关闭浮动
    float: false,
    // 外层处理“视觉间距”，引擎层统一设为 0，避免影响绝对定位计算
    margin: 0
  }

  // （变更）不再使用引擎 margin 做间距，统一交由内容层 CSS 变量控制
  // if (props.config?.margin && Array.isArray(props.config.margin) && props.config.margin.length === 2) {
  //   const [marginX, marginY] = props.config.margin
  //   options.margin = `${marginY}px ${marginX}px`
  // }

  return options
}

// ---- 工具与封装：日志、节点快照与列切换（替代旧的按需注入CSS实现）
interface NodeSnapshot {
  id: string
  x: number
  w: number
  el?: GridItemHTMLElement
}

/** 统一调试输出，便于控制台筛选 */
function debugLog(...args: unknown[]): void {
  console.log('[GridV2]', ...args)
}

/**
 * 运行时切换全局“可拖拽”开关（不重建实例）：
 * - 优先考虑 readonly 与 staticGrid，若二者为真则始终禁用拖拽
 * - 调用引擎的 enableMove（若存在），并逐个节点设置 noMove，确保与条目级别 static / isDraggable=false 一致
 */
function setGlobalDragEnabled(enable: boolean): void {
  if (!grid) return
  const effectiveEnable = enable && !props.readonly && props.config?.staticGrid !== true
  debugLog('切换全局可拖拽:', effectiveEnable)
  // 某些 GridStack 类型定义可能未暴露 enableMove，这里做兼容调用
  // @ts-expect-error runtime API 兼容调用
  grid.enableMove?.(effectiveEnable)

  const nodes = (grid as unknown as { engine?: { nodes?: GridStackNode[] } }).engine?.nodes ?? []
  grid.batchUpdate()
  nodes.forEach((n) => {
    const id = String(n.id)
    const item = props.layout.find((it) => getItemId(it) === id)
    const itemStatic = (item as unknown as { static?: boolean })?.static === true
    const itemNoDrag = (item as unknown as { isDraggable?: boolean })?.isDraggable === false
    const nodeNoMove = !effectiveEnable || itemStatic || itemNoDrag
    const el = n.el as GridItemHTMLElement | undefined
    if (el) {
      grid!.update(el, { noMove: nodeNoMove })
    }
  })
  grid.commit()
  nextTick(() => ensureAllWidgetsRegistered())
}

/**
 * 运行时切换全局“可缩放”开关（不重建实例）：
 * - 优先考虑 readonly 与 staticGrid，若二者为真则始终禁用缩放
 * - 调用引擎的 enableResize（若存在），并逐个节点设置 noResize，确保与条目级别 static / isResizable=false 一致
 */
function setGlobalResizeEnabled(enable: boolean): void {
  if (!grid) return
  const effectiveEnable = enable && !props.readonly && props.config?.staticGrid !== true
  debugLog('切换全局可缩放:', effectiveEnable)
  // 某些 GridStack 类型定义可能未暴露 enableResize，这里做兼容调用
  // @ts-expect-error runtime API 兼容调用
  grid.enableResize?.(effectiveEnable)

  const nodes = (grid as unknown as { engine?: { nodes?: GridStackNode[] } }).engine?.nodes ?? []
  grid.batchUpdate()
  nodes.forEach((n) => {
    const id = String(n.id)
    const item = props.layout.find((it) => getItemId(it) === id)
    const itemStatic = (item as unknown as { static?: boolean })?.static === true
    const itemNoResize = (item as unknown as { isResizable?: boolean })?.isResizable === false
    const nodeNoResize = !effectiveEnable || itemStatic || itemNoResize
    const el = n.el as GridItemHTMLElement | undefined
    if (el) {
      grid!.update(el, { noResize: nodeNoResize })
    }
  })
  grid.commit()
  nextTick(() => ensureAllWidgetsRegistered())
}
/** 从 Grid 引擎快照当前所有节点的 x/w（保留 el 引用） */
function snapshotNodes(): NodeSnapshot[] {
  if (!grid) return []
  const engineNodes = (grid as unknown as { engine?: { nodes?: GridStackNode[] } }).engine?.nodes ?? []
  return engineNodes.map(n => ({
    id: String(n.id),
    x: typeof n.x === 'number' ? n.x : 0,
    w: typeof n.w === 'number' ? n.w : 1,
    el: n.el as GridItemHTMLElement | undefined
  }))
}

/** 在给定列数范围内恢复节点位置与宽度（自动裁剪边界） */
function restoreNodesWithinColumns(snapshots: NodeSnapshot[], maxCol: number): void {
  if (!grid) return
  snapshots.forEach(p => {
    const el = p.el ?? (gridEl.value?.querySelector(`#${CSS.escape(p.id)}`) as GridItemHTMLElement | null) ?? undefined
    if (!el) return
    const targetW = Math.max(1, Math.min(p.w, maxCol))
    const targetX = Math.max(0, Math.min(p.x, maxCol - targetW))
    grid!.update(el, { x: targetX, w: targetW })
  })
}

/**
 * 基于列数变更按比例缩放并恢复节点：
 * - 保持相对占比：w' = round(w * newCol / oldCol)，x' = round(x * newCol / oldCol)
 * - 同时裁剪到合法范围，防止溢出
 */
function restoreNodesScaled(snapshots: NodeSnapshot[], oldCol: number, newCol: number): void {
  if (!grid) return
  if (!Number.isFinite(oldCol) || !Number.isFinite(newCol) || oldCol <= 0 || newCol <= 0) return
  const ratio = newCol / oldCol
  snapshots.forEach(p => {
    const el = p.el ?? (gridEl.value?.querySelector(`#${CSS.escape(p.id)}`) as GridItemHTMLElement | null) ?? undefined
    if (!el) return
    // 计算缩放后的 w/x，并进行边界裁剪
    let nextW = Math.max(1, Math.round(p.w * ratio))
    if (nextW > newCol) nextW = newCol
    let nextX = Math.round(p.x * ratio)
    if (nextX < 0) nextX = 0
    if (nextX > newCol - nextW) nextX = Math.max(0, newCol - nextW)
    debugLog('scale node:', p.id, 'old {x=', p.x, ', w=', p.w, '} -> new {x=', nextX, ', w=', nextW, '}', 'ratio=', ratio)
    grid!.update(el, { x: nextX, w: nextW })
  })
}

/**
 * 封装列切换逻辑：
 * - 应用列 CSS
 * - 快照节点
 * - 批处理内调用 grid.column(newCol, 'move')
 * - 恢复快照并裁剪
 * - 提交与重新注册
 */
function setColumns(newCol: number, oldCol?: number): void {
  if (!grid) return
  if (!Number.isFinite(newCol)) return
  if (typeof oldCol === 'number' && oldCol === newCol) return
  try {
    debugLog('收到列数变更 colNum:', oldCol, '->', newCol)
    // 先应用对应列数的 CSS，避免 >12 时样式缺失或旧样式残留
    applyColumnCss(newCol)

    // 快照 -> 切换列数 -> 恢复(保持 w/x 数值，仅裁剪边界) -> 提交
    const snaps = snapshotNodes()

    isChangingColumns = true
    grid!.batchUpdate()
    grid!.column(Number(newCol), 'move')
    // 保持原有 w/x 数值，不进行缩放，仅在新列数范围内做边界裁剪
    restoreNodesWithinColumns(snaps, Number(newCol))
    grid!.commit()

    nextTick(() => {
      ensureAllWidgetsRegistered()
      auditGridNodes('[setColumns]')
      measureAndLogItemSizes('[setColumns]')
      window.dispatchEvent(new Event('resize'))
    })
  } catch (err) {
    console.warn('[GridV2] 列数运行时调整失败，回退重建实例。错误：', err)
    reinitGrid()
  } finally {
    isChangingColumns = false
  }
}

// ---- 新增：在配置变化时，安全地重建 GridStack 实例并重新注册所有节点
// ---- 新增（修复）：仅维护一个“当前列数”的动态样式节点，避免旧列样式残留覆盖，确保可在大/小列数间自由切换
// 说明：gridstack-extra.css 内置的是小列数规则（2-11），当列数 > 12 时需要我们动态生成 CSS 以实现百分比宽度/left
let activeColStyleEl: HTMLStyleElement | null = null
let activeColForCss: number | null = null
function applyColumnCss(colNum: number): void {
  // 非数字直接忽略
  if (!Number.isFinite(colNum)) return

  // 清理历史上注入过的动态样式（包括旧版本的 gridstack-dynamic-cols-*）以避免覆盖顺序问题
  document
    .querySelectorAll('style#gridstack-dynamic-cols-active, style[id^="gridstack-dynamic-cols-"]')
    .forEach((el) => el.parentElement?.removeChild(el))
  activeColStyleEl = null
  activeColForCss = null

  // 统一为任意列数生成规则（不再依赖 gridstack-extra.css 的 data-gs-* 选择器）
  // 说明：为避免被引擎的内联样式覆盖，关键属性 width/left 增加 !important
  const precision = 6
  const rules: string[] = []
  for (let i = 1; i <= colNum; i++) {
    const pct = (i * 100 / colNum).toFixed(precision)
    rules.push(`.grid-stack > .grid-stack-item[gs-w='${i}']{width:${pct}% !important;}`)
  }
  for (let i = 1; i <= colNum; i++) {
    const pct = (i * 100 / colNum).toFixed(precision)
    rules.push(`.grid-stack > .grid-stack-item[gs-x='${i}']{left:${pct}% !important;}`)
  }
  for (let i = 1; i <= colNum; i++) {
    const pct = (i * 100 / colNum).toFixed(precision)
    rules.push(`.grid-stack > .grid-stack-item.grid-stack-item[gs-min-w='${i}']{min-width:${pct}% !important;}`)
  }
  for (let i = 1; i <= colNum; i++) {
    const pct = (i * 100 / colNum).toFixed(precision)
    rules.push(`.grid-stack > .grid-stack-item.grid-stack-item[gs-max-w='${i}']{max-width:${pct}% !important;}`)
  }

  // 创建或更新单一样式节点，并确保其位于 <head> 末尾，从而拥有最高优先级
  activeColStyleEl = document.createElement('style')
  activeColStyleEl.id = 'gridstack-dynamic-cols-active'
  activeColStyleEl.type = 'text/css'
  activeColStyleEl.textContent = rules.join('\n')
  document.head.appendChild(activeColStyleEl)
  activeColForCss = colNum
  debugLog('应用动态列样式: colNum=', colNum)
 }

/**
 * 审计当前所有节点的列属性与实际宽度（调试用）：
 * - 输出 id、w（引擎）、元素 gs-w 属性、内联样式 width/left、计算后的宽度（px）、容器宽度
 * - 帮你定位“列数切了但宽度不变”的具体原因
 */
function auditGridNodes(context: string): void {
  try {
    if (!grid) return
    const container = gridEl.value
    const containerW = container?.clientWidth ?? 0
    const engineNodes = (grid as unknown as { engine?: { nodes?: GridStackNode[] } }).engine?.nodes ?? []
    debugLog('audit:', context, 'containerW=', containerW, 'nodes=', engineNodes.length)
    engineNodes.forEach((n) => {
      const el = n.el as GridItemHTMLElement | undefined
      if (!el) return
      const attrW = el.getAttribute('gs-w')
      const attrX = el.getAttribute('gs-x')
      const inlineW = el.style.width
      const inlineL = el.style.left
      const cs = window.getComputedStyle(el)
      const csW = cs.width
      const csL = cs.left
      debugLog('node:', String(n.id), 'w=', n.w, 'x=', n.x, 'attrW=', attrW, 'attrX=', attrX, 'inlineW=', inlineW, 'inlineL=', inlineL, 'computedW=', csW, 'computedL=', csL)
    })
  } catch (err) {
    console.warn('[GridV2] auditGridNodes 异常：', err)
  }
}
function reinitGrid(): void {
  // 若实例已存在，先销毁（不销毁 DOM，由 Vue 管理）
  if (grid) {
    grid.destroy(false)
    grid = null
  }

  // 基于最新 props 生成初始化参数
  const options = createOptionsFromProps()

  // 在初始化前，统一按当前列数生成 [gs-*] 百分比规则，避免小/大列数切换残留
  const col = Number(options.column || 12)
  applyColumnCss(col)

  // 调试日志：重建实例时的列数
 debugLog('reinitGrid: 使用列数=', col)

  // 初始化实例（显式传入容器，避免多实例冲突）
  if (gridEl.value) {
    grid = GridStack.init(options, gridEl.value as HTMLDivElement)

    // 绑定事件：坐标/尺寸变化
    grid.on('change', handleChange)

    // 拖拽结束事件（向上传递）
    grid.on('dragstop', (_e: Event, el: GridItemHTMLElement) => {
      const node = el.gridstackNode
      if (!node) return
      emit('item-moved', String(node.id), node.x ?? 0, node.y ?? 0)
    })

    // 缩放结束事件（向上传递）
    grid.on('resizestop', (_e: Event, el: GridItemHTMLElement) => {
      const n = el.gridstackNode
      if (!n) return
      emit('item-resized', String(n.id), n.h ?? 0, n.w ?? 0, 0, 0)
    })

    // 下一帧确保所有节点注册给 GridStack，并触发一次 resize 便于内部组件自适应
    nextTick(() => {
      ensureAllWidgetsRegistered()
      measureAndLogItemSizes('[reinitGrid]')
      auditGridNodes('[reinitGrid]')
      window.dispatchEvent(new Event('resize'))
    })
  }
}

// （去重）上方监听与卸载、测量函数已下移并统一维护，此处删除重复实现以避免执行两次。

// 初始化入口：mounted 时调度可见性初始化，避免“刷新后无日志、需改配置才触发”
onMounted(() => {
  debugLog('onMounted: 调用 scheduleInitWhenVisible()')
  // 按当前配置应用内容层间距变量（不重建实例）
  applyContentGutterFromConfig()
  scheduleInitWhenVisible()
})

// 监听 layout（异步到达场景）：若尚未初始化，则再次尝试 scheduleInitWhenVisible；否则注册新节点
watch(
  () => props.layout,
  (newLayout, oldLayout) => {
    if (!hasInitialized) {
      debugLog('layout 变更到达但尚未初始化，尝试 scheduleInitWhenVisible()')
      nextTick(() => scheduleInitWhenVisible())
      return
    }
    nextTick(() => ensureAllWidgetsRegistered())
  },
  { deep: true }
)

// 初始化 GridStack
// ---- 新增：仅切换“可拖拽（isDraggable）”时，运行时更新，不重建实例
watch(
  () => props.config?.isDraggable,
  (newVal, oldVal) => {
    if (!grid) return
    // 调试：打印传入的 isDraggable 新旧值，确认是否正常传递
    debugLog('isDraggable 变更:', oldVal, '->', newVal)
    if (newVal === oldVal) return
    try {
      setGlobalDragEnabled(newVal !== false)
    } catch (err) {
      console.warn('[GridV2] 运行时切换可拖拽失败，重建实例。错误：', err)
      reinitGrid()
    }
  }
)
// ---- 新增：仅切换“可调整大小（isResizable）”时，运行时更新，不重建实例
watch(
  () => props.config?.isResizable,
  (newVal, oldVal) => {
    if (!grid) return
    // 调试：打印传入的 isResizable 新旧值，确认是否正常传递
    debugLog('isResizable 变更:', oldVal, '->', newVal)
    if (newVal === oldVal) return
    try {
      setGlobalResizeEnabled(newVal !== false)
    } catch (err) {
      console.warn('[GridV2] 运行时切换可缩放失败，重建实例。错误：', err)
      reinitGrid()
    }
  }
)
// ---- 监听列数变化，动态更新列并按比例缩放现有项，避免出现“>12列变成窄条”
watch(
  () => props.config?.colNum,
  (newCol, oldCol) => {
    const next = Number(newCol)
    const prev = Number(oldCol)
    if (!Number.isFinite(next)) return
    // 若 grid 尚未初始化：先应用对应列数的动态样式，初始化后会按 options.column 生效
    if (!grid) {
      applyColumnCss(next)
      return
    }
    setColumns(next, Number.isFinite(prev) ? prev : undefined)
  }
)
// ---- 监听行高变化，动态更新 cellHeight
watch(
  () => props.config?.rowHeight,
  (newHeight, oldHeight) => {
    if (!grid) return
    if (typeof newHeight !== 'number' || newHeight === oldHeight) return
    try {
      grid.cellHeight(Number(newHeight))
      nextTick(() => ensureAllWidgetsRegistered())
    } catch (err) {
      reinitGrid()
    }
  }
)

// ---- 监听间距变化（margin 变更）：改为通过 CSS 变量更新内容层内间距，避免重建实例
watch(
  () => props.config?.margin,
  (newMargin, oldMargin) => {
    if (newMargin === oldMargin) return
    // 1) 更新 CSS 变量，驱动视觉间距
    applyContentGutterFromConfig()
    // 2) 下一帧：测量与广播 resize，促使内部组件根据新可用高度自适应
    nextTick(() => {
      measureAndLogItemSizes('[margin change via CSS vars]')
      window.dispatchEvent(new Event('resize'))
    })
  },
  { deep: true }
)

// ---- 保留：监听影响交互的开关与只读模式，统一重建实例确保一致性（移除 isDraggable / isResizable，改为运行时切换）
watch(
  () => ({
    readonly: props.readonly,
    staticGrid: props.config?.staticGrid
  }),
  () => {
    reinitGrid()
 },
 { deep: true }
)

// 卸载：销毁 GridStack 实例
onBeforeUnmount(() => {
  try { visibilityObserver?.disconnect() } catch {}
  visibilityObserver = null
  if (grid) {
    grid.destroy(false) // 不销毁 DOM，由 Vue 管理
    grid = null
  }
})

/**
 * 调试测量：输出首个 grid item 与其内容容器的尺寸，便于定位“容器变小但内容未收缩”的问题
 */
function measureAndLogItemSizes(context?: string): void {
  try {
    const container = gridEl.value
    if (!container) return
    const item = container.querySelector<HTMLElement>('.grid-stack-item')
    const content = container.querySelector<HTMLElement>('.grid-stack-item-content')
    if (!item || !content) return
    const itemRect = item.getBoundingClientRect()
    const contentRect = content.getBoundingClientRect()
    debugLog(
      '尺寸检查', context ?? '',
      'item: {h=', itemRect.height, ', w=', itemRect.width, '}',
      'content: {h=', contentRect.height, ', w=', contentRect.width, '}',
      'scrollH=', content.scrollHeight, 'clientH=', content.clientHeight
    )
  } catch (err) {
    console.warn('[GridV2] measureAndLogItemSizes 异常：', err)
  }
}
</script>

<style scoped>
.grid-v2-wrapper {
  /* 包裹层：便于外部追加样式 */
}

/* GridStack 容器样式（可按需调整） */
.grid-stack {
  background: #fafafa;
  border: 1px dashed #e5e5e5;
  min-height: 120px;
}

/* 将整卡片区域表现为可拖拽（视觉提示） */
.grid-stack-item {
  cursor: move;
}

.grid-stack-item-content {
  border: none;
  height: 100%;
  /* 使用 CSS 变量控制内容层的水平/垂直内间距，默认 0 */
  padding: var(--v-gap, 0px) var(--h-gap, 0px);
  display: flex;
  align-items: center;

}

.fallback {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

</style>


