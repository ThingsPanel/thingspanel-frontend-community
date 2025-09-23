<template>
  <!--
    GridstackExample
    - 将官方 ex.html 示例改造为 Vue3 <script setup lang="ts"> 组件版本
    - 目的：演示如何在 Vue 中安全地初始化 GridStack，并通过 v-for 渲染网格项
    - 注意：必须在 DOM 渲染完成后再调用 GridStack.init / makeWidget 等 API（通过 onMounted + nextTick）
  -->
  <main class="gridstack-example">
    <h1>How to integrate GridStack.js with Vue.js</h1>

    <!-- 操作按钮区 -->
    <div class="actions">
      <button type="button" @click="addNewWidget2">Add Widget pos [0,0]</button>
      <button type="button" @click="removeLastWidget">Remove Last Widget</button>
      <button type="button" @click="changeFloat">Float: {{ gridFloat }}</button>
    </div>

    <!-- 信息展示区 -->
    <div class="info">{{ info }}</div>
    <div class="grid-info" :style="{ color }"><b>{{ gridInfo }}</b></div>

    <!-- GridStack 容器（必须具有 .grid-stack 类名） -->
    <div class="grid-stack" ref="gridEl">
      <!-- 通过 v-for 渲染网格项，属性使用 gs-* 前缀，这些是 GridStack 识别的 data- 属性映射 -->
      <div
        v-for="w in items"
        :key="w.id"
        class="grid-stack-item"
        :id="w.id"
        :gs-id="w.id"
        :gs-x="w.x"
        :gs-y="w.y"
        :gs-w="w.w"
        :gs-h="w.h"
      >
        <div class="grid-stack-item-content">
          <button type="button" @click="remove(w)">remove</button>
          <pre>{{ w }}</pre>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick, watch } from 'vue'
import { GridStack, type GridStackOptions, type GridStackNode, type GridItemHTMLElement } from 'gridstack'

/**
 * 单个网格项的数据结构（严格类型定义，禁止 any）
 */
interface WidgetItem {
  id: string
  x: number
  y: number
  w: number
  h: number
}

// refs & 局部状态
const gridEl = ref<HTMLDivElement | null>(null)
let grid: GridStack | null = null // 刻意不用 ref()，避免 Proxy 破坏 GridStack 内部比较逻辑（参考官方 issue 2115）

const count = ref<number>(0)
const info = ref<string>('')
const gridFloat = ref<boolean>(false)
const color = ref<string>('black')
const gridInfo = ref<string>('')
const items = ref<WidgetItem[]>([])

// 定时器句柄，用于自动清空 info 提示
let timerId: number | undefined

/**
 * 组件挂载后初始化 GridStack
 * - 在 DOM 渲染完成（onMounted）后调用 GridStack.init
 * - 强烈建议传入具体容器元素（gridEl）而不是依赖默认选择器，以避免多实例冲突
 */
onMounted(() => {
  const options: GridStackOptions = {
    float: false,
    cellHeight: '70px',
    minRow: 1
  }

  // 初始化 GridStack 实例
  grid = GridStack.init(options, gridEl.value as HTMLDivElement)

  // 绑定事件：拖拽停止
  grid.on('dragstop', (event: Event, element: GridItemHTMLElement) => {
    const node = element.gridstackNode
    if (node) {
      info.value = `you just dragged node #${node.id} to ${node.x},${node.y} – good job!`
    }
  })

  // 绑定事件：布局变化（移动/缩放等）
  grid.on('change', onChange)
})

/**
 * 切换 float 模式（true: 元素可浮动，false: 自动紧凑对齐）
 */
function changeFloat(): void {
  gridFloat.value = !gridFloat.value
  grid?.float(gridFloat.value)
}

/**
 * GridStack 的 change 事件处理：同步 items 列表中的坐标尺寸
 */
function onChange(event: Event, changeItems: GridStackNode[] = []): void {
  updateInfo()
  changeItems.forEach((item) => {
    const widget = items.value.find((w) => w.id === String(item.id))
    if (!widget) return
    if (typeof item.x === 'number') widget.x = item.x
    if (typeof item.y === 'number') widget.y = item.y
    if (typeof item.w === 'number') widget.w = item.w
    if (typeof item.h === 'number') widget.h = item.h
  })
}

/**
 * 新增一个网格项：默认位置 [0,0]，尺寸 2x2
 * - 先 push 到 items 以让 Vue 渲染
 * - 再 nextTick 后调用 grid.makeWidget 将其交给 GridStack 管理
 */
function addNewWidget2(): void {
  const node: WidgetItem = {
    id: `w_${count.value}`,
    x: 0,
    y: 0,
    w: 2,
    h: 2
  }
  count.value += 1
  items.value.push(node)

  nextTick(() => {
    if (!grid) return
    // 通过选择器让 GridStack 接管该元素
    grid.makeWidget(`#${node.id}`)
    updateInfo()
  })
}

/**
 * 移除最后一个新增的网格项（按计数规则）
 */
function removeLastWidget(): void {
  if (count.value === 0) return
  const id = `w_${count.value - 1}`
  const index = items.value.findIndex((w) => w.id === id)
  if (index < 0) return
  const removed = items.value[index]
  remove(removed)
}

/**
 * 移除指定网格项
 * - 从 items 中删除
 * - 调用 grid.removeWidget 移除 GridStack 管理
 */
function remove(widget: WidgetItem): void {
  const index = items.value.findIndex((w) => w.id === widget.id)
  if (index >= 0) items.value.splice(index, 1)
  if (grid) {
    const selector = `#${widget.id}`
    // 第二个参数 false：不直接移除 DOM，由 Vue 进行 DOM 更新
    grid.removeWidget(selector, false)
  }
  updateInfo()
}

/**
 * 更新信息显示：当 Grid 引擎节点数量与 items 数量不一致时，标红提示
 */
function updateInfo(): void {
  if (!grid) return
  const engineNodes = grid.engine?.nodes?.length ?? 0
  const widgets = items.value.length
  color.value = engineNodes === widgets ? 'black' : 'red'
  gridInfo.value = `Grid engine: ${engineNodes}, widgets: ${widgets}`
}

/**
 * 监听 info 变化，2 秒后自动清空
 */
watch(
  () => info.value,
  (val) => {
    if (!val || val.length === 0) return
    if (timerId) window.clearTimeout(timerId)
    timerId = window.setTimeout(() => {
      info.value = ''
    }, 2000)
  }
)
</script>

<style scoped>
.gridstack-example {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.info {
  min-height: 20px;
}

.grid-info {
  min-height: 20px;
}

/* gridstack 自身样式已在全局 main.ts 引入（gridstack.css / gridstack-extra.css） */
.grid-stack {
  background: #fafafa;
  border: 1px dashed #e5e5e5;
  min-height: 120px;
}

.grid-stack-item-content {
  background-color: #18a05822;
  border: 1px solid #18a058;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
  padding: 6px;
}
</style>