<!--
  自定义网格渲染器模板
  适用于固定网格布局的需求
  支持自定义行列数和网格样式
-->
<template>
  <BaseRendererComponent
    :readonly="readonly"
    @ready="onRendererReady"
    @error="onRendererError"
    @node-select="onNodeSelect"
    @canvas-click="onCanvasClick"
  >
    <div
      class="custom-grid-renderer grid-background-base"
      :class="{
        'show-grid': config.showGrid && !readonly,
        'preview-mode': isPreviewMode.value,
        readonly: readonly
      }"
      :style="getGridStyle()"
      @click="handleCanvasClick"
    >
      <!-- 网格项 -->
      <div
        v-for="gridItem in gridItems"
        :key="gridItem.node?.id || `empty-${gridItem.row}-${gridItem.col}`"
        class="grid-cell"
        :class="{
          occupied: !!gridItem.node,
          selected: gridItem.node && selectedIds.includes(gridItem.node.id) && !isPreviewMode.value,
          readonly: readonly || isPreviewMode.value
        }"
        :style="getGridCellStyle(gridItem)"
        @click.stop="handleGridCellClick(gridItem)"
      >
        <!-- 有节点的单元格 -->
        <template v-if="gridItem.node">
          <!-- 节点标题 -->
          <div v-if="showWidgetTitles && !readonly" class="node-title">
            {{ gridItem.node.label || gridItem.node.type }}
          </div>

          <!-- 节点内容 -->
          <div class="node-content">
            <Card2Wrapper
              v-if="isCard2Component(gridItem.node.type)"
              :component-type="gridItem.node.type"
              :config="gridItem.node.properties"
              :data="gridItem.node.metadata?.card2Data"
              :node-id="gridItem.node.id"
              @error="handleComponentError"
            />
            <component :is="getWidgetComponent(gridItem.node.type)" v-else v-bind="gridItem.node.properties" />
          </div>
        </template>

        <!-- 空单元格 -->
        <div v-else-if="!readonly" class="empty-cell">
          <div class="empty-placeholder">
            <n-icon :size="24" class="empty-icon">
              <AddOutline />
            </n-icon>
            <span class="empty-text">点击添加</span>
          </div>
        </div>
      </div>
    </div>
  </BaseRendererComponent>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NIcon } from 'naive-ui'
import { AddOutline } from '@vicons/ionicons5'
import { useEditorStore } from '@/store/modules/editor'
import { useWidgetStore } from '@/store/modules/widget'
import { globalPreviewMode } from '../../hooks/usePreviewMode'
import BaseRendererComponent from '../base/BaseRendererComponent.vue'
import Card2Wrapper from '../canvas/Card2Wrapper.vue'

// 网格配置
interface GridConfig {
  showGrid?: boolean
  rows?: number
  columns?: number
  gap?: number
  padding?: number
  cellAspectRatio?: number
  autoResize?: boolean
}

// 网格项接口
interface GridItem {
  row: number
  col: number
  node?: any
  span?: { rowSpan: number; colSpan: number }
}

// 组件 Props
interface Props {
  readonly?: boolean
  config?: GridConfig
  showWidgetTitles?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  config: () => ({
    showGrid: true,
    rows: 6,
    columns: 4,
    gap: 16,
    padding: 20,
    cellAspectRatio: 1.5,
    autoResize: true
  }),
  showWidgetTitles: false
})

// 组件 Emits
interface Emits {
  (e: 'ready'): void
  (e: 'error', error: Error): void
  (e: 'node-select', nodeId: string): void
  (e: 'canvas-click', event?: MouseEvent): void
  (e: 'cell-click', row: number, col: number): void
}

const emit = defineEmits<Emits>()

// 使用原始 store
const editorStore = useEditorStore()
const widgetStore = useWidgetStore()

// 适配旧接口
const selectNode = (nodeId: string) => {
  if (nodeId) {
    widgetStore.selectNodes([nodeId])
  } else {
    widgetStore.selectNodes([])
  }
}

const isCard2Component = (type: string) => {
  // 简单的Card2组件检测
  return type.includes('card2') || type.includes('Card2')
}

const addNode = async (node: any) => {
  editorStore.addNode(node)
}
const { isPreviewMode } = globalPreviewMode

// 计算属性
const nodes = computed(() => editorStore.nodes || [])
const selectedIds = computed(() => widgetStore.selectedNodeIds || [])

// 网格布局计算
const gridItems = computed<GridItem[]>(() => {
  const config = props.config!
  const items: GridItem[] = []

  // 创建网格矩阵
  for (let row = 0; row < config.rows!; row++) {
    for (let col = 0; col < config.columns!; col++) {
      // 查找是否有节点占据这个位置
      const node = nodes.value.find(n => {
        const gridPos = n.metadata?.gridPosition
        return gridPos && gridPos.row === row && gridPos.col === col
      })

      items.push({
        row,
        col,
        node,
        span: node?.metadata?.gridSpan || { rowSpan: 1, colSpan: 1 }
      })
    }
  }

  return items
})

// 事件处理器
const onRendererReady = () => {
  console.log('[CustomGridRenderer] Renderer is ready')
  emit('ready')
}

const onRendererError = (error: Error) => {
  console.error('[CustomGridRenderer] Renderer error:', error)
  emit('error', error)
}

const onNodeSelect = (nodeId: string) => {
  emit('node-select', nodeId)
}

const onCanvasClick = (event?: MouseEvent) => {
  emit('canvas-click', event)
}

const handleCanvasClick = () => {
  if (!isPreviewMode.value) {
    stateManager.clearSelection()
  }
}

const handleGridCellClick = (gridItem: GridItem) => {
  if (isPreviewMode.value) return

  if (gridItem.node) {
    // 选择现有节点
    if (!props.readonly) {
      selectNode(gridItem.node.id)
      emit('node-select', gridItem.node.id)
    }
  } else {
    // 空单元格，触发添加事件
    if (!props.readonly) {
      emit('cell-click', gridItem.row, gridItem.col)
      // 可以在这里添加默认组件创建逻辑
    }
  }
}

const handleComponentError = (error: Error) => {
  console.error('[CustomGridRenderer] Component error:', error)
  emit('error', error)
}

// 样式计算
const getGridStyle = () => {
  const config = props.config!
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(${config.columns}, 1fr)`,
    gridTemplateRows: `repeat(${config.rows}, 1fr)`,
    gap: `${config.gap}px`,
    padding: `${config.padding}px`,
    aspectRatio: config.autoResize ? undefined : `${config.columns! * config.cellAspectRatio!} / ${config.rows!}`
  }
}

const getGridCellStyle = (gridItem: GridItem) => {
  const span = gridItem.span || { rowSpan: 1, colSpan: 1 }
  return {
    gridColumn: `${gridItem.col + 1} / span ${span.colSpan}`,
    gridRow: `${gridItem.row + 1} / span ${span.rowSpan}`
  }
}

// 组件获取
const getWidgetComponent = (type: string) => {
  const components: Record<string, any> = {
    // 在这里添加您的组件映射
  }
  return components[type]
}
</script>

<style scoped>
.custom-grid-renderer {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  overflow: auto;
}

.grid-cell {
  border: 2px solid var(--n-border-color);
  border-radius: 8px;
  transition: all 0.2s ease;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--n-card-color);
  min-height: 120px;
}

.grid-cell.occupied {
  cursor: pointer;
  border-color: rgba(24, 160, 88, 0.2);
}

.grid-cell.occupied:hover:not(.readonly) {
  border-color: rgba(24, 160, 88, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.grid-cell.selected {
  border-color: var(--n-primary-color);
  box-shadow: 0 6px 20px rgba(24, 160, 88, 0.25);
}

.grid-cell:not(.occupied) {
  border-style: dashed;
  border-color: var(--n-border-color);
  cursor: pointer;
}

.grid-cell:not(.occupied):hover:not(.readonly) {
  border-color: rgba(24, 160, 88, 0.3);
  background: rgba(24, 160, 88, 0.05);
}

.grid-cell.readonly {
  cursor: default;
}

.grid-cell.readonly:hover {
  border-color: var(--n-border-color);
  box-shadow: none;
  transform: none;
}

.node-title {
  background: var(--n-color-embedded);
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 500;
  border-bottom: 1px solid var(--n-border-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 0;
}

.node-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.empty-cell {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--n-text-color-disabled);
  font-size: 12px;
  transition: all 0.2s ease;
}

.grid-cell:not(.readonly):hover .empty-placeholder {
  color: var(--n-primary-color);
  transform: scale(1.1);
}

.empty-icon {
  opacity: 0.6;
}

.empty-text {
  font-weight: 500;
}

/* 预览模式样式 */
.custom-grid-renderer.preview-mode .grid-cell {
  cursor: default;
}

.custom-grid-renderer.preview-mode .grid-cell:hover {
  border-color: var(--n-border-color);
  transform: none;
}

.custom-grid-renderer.preview-mode .empty-cell {
  display: none;
}

.custom-grid-renderer.preview-mode .grid-cell:not(.occupied) {
  display: none;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .custom-grid-renderer {
    min-height: 400px;
  }

  .grid-cell {
    min-height: 100px;
  }

  .node-title {
    font-size: 11px;
    padding: 4px 8px;
  }

  .empty-placeholder {
    font-size: 11px;
  }
}
</style>
