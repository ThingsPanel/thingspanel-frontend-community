<template>
  <div class="gridstack-renderer">
    <GridstackWrapper
      :items="nodes"
      :readonly="readonly"
      :columns="config.columns"
      :cell-height="config.cellHeight"
      :margin="config.margin"
      @ready="handleReady"
      @error="handleError"
      @item-add="handleItemAdd"
      @item-remove="handleItemRemove"
      @item-update="handleItemUpdate"
      @layout-change="handleLayoutChange"
      @item-select="handleItemSelect"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useEditor } from '../../hooks/useEditor'
import GridstackWrapper from './GridstackWrapper.vue'
import type { GraphData, RendererType } from '../../types'

// Props
interface Props {
  readonly?: boolean
  config?: {
    columns?: number
    cellHeight?: number | string
    margin?: number
  }
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  config: () => ({
    columns: 12,
    cellHeight: 'auto',
    margin: 10
  })
})

// Emits
interface Emits {
  (e: 'ready'): void
  (e: 'error', error: Error): void
  (e: 'node-select', id: string): void
}

const emit = defineEmits<Emits>()

// Editor context - 添加错误处理
let stateManager: any = null
let updateNode: any = null

try {
  const editorContext = useEditor()
  stateManager = editorContext.stateManager
  updateNode = editorContext.updateNode
} catch (error) {
  console.warn('GridstackRenderer: 无法获取编辑器上下文:', error)
}

// Computed - 按照Canvas的方式获取节点
const nodes = computed(() => {
  if (!stateManager?.canvasState?.value) {
    console.log('🚨 GridstackRenderer: stateManager.canvasState为空')
    return []
  }
  const nodeData = stateManager.canvasState.value.nodes
  console.log('📊 GridstackRenderer获取到的节点数据:', nodeData.length, nodeData)
  return nodeData
})

const selectedIds = computed(() => {
  if (!stateManager?.canvasState?.value) {
    return []
  }
  return stateManager.canvasState.value.selectedIds
})

// Event handlers
const handleReady = () => {
  console.log('GridStack renderer ready')
  emit('ready')
}

const handleError = (error: Error) => {
  console.error('GridStack renderer error:', error)
  emit('error', error)
}

const handleItemAdd = (item: GraphData) => {
  console.log('📦 GridstackRenderer收到item-add事件:', item)
  // 注意：此时item可能已经通过useEditor的addWidget添加到stateManager中了
  // 我们不需要重复添加，只需要确保renderer标记正确
  console.log('🔍 检查item是否已在stateManager中...')
  const existsInState = stateManager?.nodes?.value?.find((n: any) => n.id === item.id)
  console.log('🔍 StateManager中的状态:', existsInState ? '已存在' : '不存在')
}

const handleItemRemove = (ids: string[]) => {
  console.log('GridStack items removed:', ids)
  // 从stateManager中移除节点
  if (stateManager) {
    ids.forEach(id => {
      stateManager.removeNode(id)
    })
  }
}

const handleItemUpdate = (id: string, updates: Partial<GraphData>) => {
  console.log('GridStack item updated:', id, updates)
  // 更新stateManager中的节点
  if (updateNode) {
    updateNode(id, updates)
  }
}

const handleLayoutChange = (items: GraphData[]) => {
  console.log('GridStack layout changed:', items.length, 'items')
  // 布局变化时同步到stateManager
  if (stateManager?.canvasState?.value && updateNode) {
    const currentNodes = stateManager.canvasState.value.nodes
    items.forEach(item => {
      const existingNode = currentNodes.find((n: any) => n.id === item.id)
      if (existingNode && (
        existingNode.x !== item.x ||
        existingNode.y !== item.y ||
        existingNode.width !== item.width ||
        existingNode.height !== item.height
      )) {
        updateNode(item.id, {
          x: item.x,
          y: item.y,
          width: item.width,
          height: item.height
        })
      }
    })
  }
}

const handleItemSelect = (ids: string[]) => {
  console.log('GridStack items selected:', ids)
  if (ids.length > 0) {
    if (stateManager) {
      stateManager.selectNodes(ids)
    }
    emit('node-select', ids[0])
  }
}

// Watch for external node changes - 添加安全检查
watch(() => stateManager?.canvasState?.value?.nodes, (newNodes, oldNodes) => {
  if (newNodes) {
    console.log('📊 StateManager节点变化:', {
      新节点数: newNodes.length,
      旧节点数: oldNodes?.length || 0,
      节点列表: newNodes.map((n: any) => ({ id: n.id, type: n.type, x: n.x, y: n.y }))
    })
  }
}, { deep: true, immediate: true })

// Watch for selection changes - 添加安全检查  
watch(() => stateManager?.canvasState?.value?.selectedIds, (selectedNodeIds) => {
  if (selectedNodeIds) {
    console.log('Selection changed in GridStack renderer:', selectedNodeIds)
  }
}, { deep: true })
</script>

<style scoped>
.gridstack-renderer {
  width: 100%;
  height: 100%;
  position: relative;
}
</style>