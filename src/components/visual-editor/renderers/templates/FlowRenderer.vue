<!--
  流式布局渲染器模板
  适用于自动排列的流式布局需求
  组件会自动从上到下、从左到右排列
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
      class="flow-renderer grid-background-base"
      :class="{
        'show-grid': config.showGrid && !readonly,
        'preview-mode': isPreviewMode.value,
        readonly: readonly
      }"
      @click="handleCanvasClick"
    >
      <!-- 流式布局容器 -->
      <div class="flow-container" :style="getContainerStyle()">
        <div
          v-for="(node, index) in layoutNodes"
          :key="node.id"
          class="flow-item"
          :class="{
            selected: selectedIds.includes(node.id) && !isPreviewMode.value,
            readonly: readonly || isPreviewMode.value
          }"
          :style="getFlowItemStyle(node, index)"
          @click.stop="handleNodeClick(node.id)"
        >
          <!-- 节点标题 -->
          <div v-if="showWidgetTitles && !readonly" class="node-title">
            {{ node.label || node.type }}
          </div>

          <!-- 节点内容 -->
          <div class="node-content">
            <Card2Wrapper
              v-if="isCard2Component(node.type)"
              :component-type="node.type"
              :config="node.properties"
              :data="node.metadata?.card2Data"
              :node-id="node.id"
              @error="handleComponentError"
            />
            <component :is="getWidgetComponent(node.type)" v-else v-bind="node.properties" />
          </div>
        </div>
      </div>
    </div>
  </BaseRendererComponent>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditorStore } from '@/store/modules/editor'
import { useWidgetStore } from '@/store/modules/widget'
import { globalPreviewMode } from '../../hooks/usePreviewMode'
import BaseRendererComponent from '../base/BaseRendererComponent.vue'
import Card2Wrapper from '../canvas/Card2Wrapper.vue'

// 流式布局配置
interface FlowConfig {
  showGrid?: boolean
  direction?: 'row' | 'column'
  wrap?: boolean
  gap?: number
  padding?: number
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch'
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around'
  itemWidth?: number | 'auto'
  itemHeight?: number | 'auto'
}

// 组件 Props
interface Props {
  readonly?: boolean
  config?: FlowConfig
  showWidgetTitles?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  config: () => ({
    showGrid: true,
    direction: 'row',
    wrap: true,
    gap: 16,
    padding: 20,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    itemWidth: 300,
    itemHeight: 200
  }),
  showWidgetTitles: false
})

// 组件 Emits
interface Emits {
  (e: 'ready'): void
  (e: 'error', error: Error): void
  (e: 'node-select', nodeId: string): void
  (e: 'canvas-click', event?: MouseEvent): void
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
const { isPreviewMode } = globalPreviewMode

// 计算属性
const nodes = computed(() => editorStore.nodes || [])
const selectedIds = computed(() => widgetStore.selectedNodeIds || [])

// 布局计算
const layoutNodes = computed(() => {
  // 可以根据需要对节点进行排序或筛选
  return nodes.value.sort((a, b) => {
    // 按创建时间或其他逻辑排序
    return (a.metadata?.createdAt || 0) - (b.metadata?.createdAt || 0)
  })
})

// 事件处理器
const onRendererReady = () => {
  emit('ready')
}

const onRendererError = (error: Error) => {
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

const handleNodeClick = (nodeId: string) => {
  if (!isPreviewMode.value && !props.readonly) {
    selectNode(nodeId)
    emit('node-select', nodeId)
  }
}

const handleComponentError = (error: Error) => {
  console.error('[FlowRenderer] Component error:', error)
  emit('error', error)
}

// 样式计算
const getContainerStyle = () => {
  const config = props.config!
  return {
    display: 'flex',
    flexDirection: config.direction,
    flexWrap: config.wrap ? 'wrap' : 'nowrap',
    gap: `${config.gap}px`,
    padding: `${config.padding}px`,
    alignItems: config.alignItems,
    justifyContent: config.justifyContent,
    minHeight: '100%'
  }
}

const getFlowItemStyle = (node: any, index: number) => {
  const config = props.config!
  const style: Record<string, any> = {
    flexShrink: 0
  }

  // 设置项目尺寸
  if (config.itemWidth !== 'auto') {
    style.width = typeof config.itemWidth === 'number' ? `${config.itemWidth}px` : config.itemWidth
  }

  if (config.itemHeight !== 'auto') {
    style.height = typeof config.itemHeight === 'number' ? `${config.itemHeight}px` : config.itemHeight
  }

  // 如果节点有自定义尺寸，优先使用
  if (node.width && node.width !== config.itemWidth) {
    style.width = `${node.width}px`
  }
  if (node.height && node.height !== config.itemHeight) {
    style.height = `${node.height}px`
  }

  return style
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
.flow-renderer {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  overflow: auto;
}

.flow-container {
  min-height: 100%;
  width: 100%;
}

.flow-item {
  border: 2px solid transparent;
  border-radius: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--n-card-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.flow-item:hover:not(.readonly) {
  border-color: rgba(24, 160, 88, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.flow-item.selected {
  border-color: var(--n-primary-color);
  box-shadow: 0 6px 20px rgba(24, 160, 88, 0.25);
}

.flow-item.readonly {
  cursor: default;
}

.flow-item.readonly:hover {
  border-color: transparent;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transform: none;
}

.node-title {
  background: var(--n-color-embedded);
  padding: 8px 12px;
  font-size: 13px;
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

/* 预览模式样式 */
.flow-renderer.preview-mode .flow-item {
  cursor: default;
}

.flow-renderer.preview-mode .flow-item:hover {
  border-color: transparent;
  transform: none;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .flow-renderer {
    min-height: 400px;
  }

  .flow-container {
    padding: 10px !important;
    gap: 10px !important;
  }

  .flow-item {
    min-width: 280px;
  }

  .node-title {
    font-size: 12px;
    padding: 6px 10px;
  }
}
</style>
