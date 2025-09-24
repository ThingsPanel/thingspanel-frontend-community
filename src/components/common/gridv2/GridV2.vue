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
    float: false
  }

  // 将 [水平, 垂直] margin 元组映射为 CSS 简写（top/bottom left/right）
  if (props.config?.margin && Array.isArray(props.config.margin) && props.config.margin.length === 2) {
    const [marginX, marginY] = props.config.margin
    options.margin = `${marginY}px ${marginX}px`
  }

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
  console.debug('[GridV2]', ...args)
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

    // 快照 -> 切换列数（不缩放）-> 恢复 -> 提交
    const snaps = snapshotNodes()

    isChangingColumns = true
    grid!.batchUpdate()
    grid!.column(Number(newCol), 'move')
    restoreNodesWithinColumns(snaps, Number(newCol))
    grid!.commit()

    nextTick(() => ensureAllWidgetsRegistered())
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
  const precision = 6
  const rules: string[] = []
  for (let i = 1; i <= colNum; i++) {
    const pct = (i * 100 / colNum).toFixed(precision)
    rules.push(`.grid-stack > .grid-stack-item[gs-w='${i}']{width:${pct}%;}`)
  }
  for (let i = 1; i <= colNum; i++) {
    const pct = (i * 100 / colNum).toFixed(precision)
    rules.push(`.grid-stack > .grid-stack-item[gs-x='${i}']{left:${pct}%;}`)
  }
  for (let i = 1; i <= colNum; i++) {
    const pct = (i * 100 / colNum).toFixed(precision)
    rules.push(`.grid-stack > .grid-stack-item.grid-stack-item[gs-min-w='${i}']{min-width:${pct}%;}`)
  }
  for (let i = 1; i <= colNum; i++) {
    const pct = (i * 100 / colNum).toFixed(precision)
    rules.push(`.grid-stack > .grid-stack-item.grid-stack-item[gs-max-w='${i}']{max-width:${pct}%;}`)
  }

  // 创建或更新单一样式节点，并确保其位于 <head> 末尾，从而拥有最高优先级
  activeColStyleEl = document.createElement('style')
  activeColStyleEl.id = 'gridstack-dynamic-cols-active'
  activeColStyleEl.type = 'text/css'
  activeColStyleEl.textContent = rules.join('\n')
  document.head.appendChild(activeColStyleEl)
  activeColForCss = colNum
  console.debug(`[GridV2] 应用动态列样式: colNum=`, colNum)
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
  console.log(`[GridV2] reinitGrid: 使用列数=`, col)

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

    // 下一帧确保所有节点注册给 GridStack
    nextTick(() => ensureAllWidgetsRegistered())
  }
}

// 初始化 GridStack
onMounted(() => {
  // 调试日志：组件挂载时打印初始列数（若父级未传，则为默认 12）
  console.log(`[GridV2] 初始 colNum=`, props.config?.colNum ?? 12)
  reinitGrid() // 首次挂载按当前 props 初始化
})

// 监听 layout 变化（新增/删除/替换），在 DOM 更新后与 Grid 引擎同步
watch(
  () => props.layout,
  () => nextTick(() => ensureAllWidgetsRegistered()),
  { deep: true }
)

// ---- 新增：监听列数变化，动态调整列并按比例缩放现有项，避免出现“>12列变成窄条”
watch(
  () => props.config?.colNum,
  (newCol, oldCol) => {
    if (!grid) return
    if (typeof newCol !== 'number' || newCol === oldCol) return
    try {
      // 调试日志：打印列数变化
      console.log(`[GridV2] 收到列数变更 colNum:`, oldCol, '->', newCol)

      // 在调用 column API 之前应用对应列数的 CSS，避免 >12 时样式缺失或旧样式残留
      applyColumnCss(Number(newCol))

      // 策略调整：不按比例缩放(w/h)，而是保持每个 item 的格子数不变（用户期望：列数越小，每列越宽，item 越宽）
      // 1) 先快照当前节点的 x/w，后续在新列数下恢复
      const engineNodes = (grid as unknown as { engine?: { nodes?: GridStackNode[] } }).engine?.nodes ?? []
      const prevNodes = engineNodes.map(n => ({
        id: String(n.id),
        x: typeof n.x === 'number' ? n.x : 0,
        w: typeof n.w === 'number' ? n.w : 1,
        el: n.el as GridItemHTMLElement | undefined
      }))

      // 2) 切换列数：使用 'move' 策略（不缩放 w/h），随后我们手动恢复快照以确保行为符合预期
      isChangingColumns = true
      grid.batchUpdate()
      grid.column(Number(newCol), 'move')

      // 3) 在新的列数范围下恢复各节点的 x/w（并进行边界裁剪）
      const maxCol = Number(newCol)
      prevNodes.forEach(p => {
        const el = p.el ?? (gridEl.value?.querySelector(`#${CSS.escape(p.id)}`) as GridItemHTMLElement | null) ?? undefined
        if (!el) return
        const targetW = Math.max(1, Math.min(p.w, maxCol))
        const targetX = Math.max(0, Math.min(p.x, maxCol - targetW))
        grid!.update(el, { x: targetX, w: targetW })
      })

      grid.commit()

      // 下一帧确保新增/变更的节点重新注册
      nextTick(() => ensureAllWidgetsRegistered())
    } catch (err) {
      // 兼容性兜底：若运行时调整失败，回退到重建实例
      console.warn('[GridV2] 列数运行时调整失败，回退重建实例。错误：', err)
      reinitGrid()
    } finally {
      // 结束列数切换批处理，恢复事件派发
      isChangingColumns = false
    }
  }
)

// ---- 新增：监听行高变化，动态更新 cellHeight
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

// ---- 新增：监听间距变化（margin 变更），由于缺少官方运行时 API，采用重建实例以确保样式更新
watch(
  () => props.config?.margin,
  (newMargin, oldMargin) => {
    if (!grid) return
    if (newMargin === oldMargin) return
    reinitGrid()
  },
  { deep: true }
)

// ---- 保留：监听影响交互的开关与只读模式，统一重建实例确保一致性
watch(
  () => ({
    readonly: props.readonly,
    isDraggable: props.config?.isDraggable,
    isResizable: props.config?.isResizable,
    staticGrid: props.config?.staticGrid
  }),
  () => {
    reinitGrid()
  },
  { deep: true }
)

// 卸载：销毁 GridStack 实例
onBeforeUnmount(() => {
  if (grid) {
    grid.destroy(false) // 不销毁 DOM，由 Vue 处理
    grid = null
  }
})
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
  background-color: #18a05822;
  border: 1px solid #18a058;
  height: 100%;
  padding: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.fallback {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>

