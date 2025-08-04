<template>
  <div ref="gridWrapperEl" class="grid-layout-plus-wrapper-editor">


    <GridLayoutPlus
      v-model:layout="layout"
      :config="gridConfig"
      :readonly="isReadOnly"
      @layout-change="onLayoutChange"
      @item-resized="onResizeStop"
      @item-moved="onDragStop"
    >
      <template #default="{ item }">
        <div
          class="editor-widget-container"
          @mousedown.stop
          @click.stop="handleNodeSelect(item.i)"
          @contextmenu.prevent="e => handleContextMenu(e, item.i)"
        >
          <div v-if="item.raw.showLabel" class="widget-title-bar">
            {{ item.raw.label }}
          </div>
          <div class="widget-content" @click="handleInteraction(item.raw)">
            <Card2Wrapper
              v-if="isCard2Component(item.type) || item.raw.metadata?.isCard2Component"
              :component-type="item.type"
              :config="item.raw.properties"
              :data="item.raw.metadata?.card2Data"
              :data-source="item.raw.dataSource"
              :node-id="item.raw.id"
            />
            <div v-else class="placeholder">
              组件: {{ item.type }}
              <br>
              <small>isCard2Component: {{ isCard2Component(item.type) }}</small>
              <br>
              <small>metadata.isCard2Component: {{ item.raw.metadata?.isCard2Component }}</small>
            </div>
          </div>
        </div>
      </template>
    </GridLayoutPlus>
    
    <ContextMenu
      :show="contextMenu.show"
      :x="contextMenu.x"
      :y="contextMenu.y"
      :selected-widgets="contextMenu.selectedWidgets"
      @select="handleContextMenuSelect"
      @close="closeContextMenu"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { nanoid } from 'nanoid'
import { GridLayoutPlus, type GridLayoutPlusItem, type GridLayoutPlusConfig } from '@/components/common/grid'
import { useEditor } from '@/components/visual-editor/hooks/useEditor'
import type { VisualEditorWidget, GraphData } from '@/components/visual-editor/types'
import Card2Wrapper from '../canvas/Card2Wrapper.vue'
import ContextMenu from '../canvas/ContextMenu.vue'

const props = defineProps<{ 
  graphData: GraphData; 
  readonly?: boolean;
  staticGrid?: boolean;
  gridConfig?: Partial<GridLayoutPlusConfig>;
}>()
const emit = defineEmits(['node-select', 'request-settings'])

const router = useRouter()
const { 
  selectNode, 
  isCard2Component, 
  getNodeById, 
  updateNode,
  addNode,
  removeNode
} = useEditor()

const gridWrapperEl = ref<HTMLElement | null>(null)
const layout = shallowRef<ExtendedGridLayoutPlusItem[]>([])
const isReadOnly = computed(() => props.readonly)

const contextMenu = ref<{
  show: boolean;
  x: number;
  y: number;
  selectedWidgets: VisualEditorWidget[];
}>({ show: false, x: 0, y: 0, selectedWidgets: [] });

const gridConfig = computed<GridLayoutPlusConfig>(() => {
  const config = {
    colNum: 12,
    rowHeight: 80,
    margin: [10, 10] as [number, number],
    isDraggable: !isReadOnly.value && !props.staticGrid,
    isResizable: !isReadOnly.value && !props.staticGrid,
    responsive: false,
    preventCollision: false, // 改为 false，允许碰撞和替换
    verticalCompact: true,
    isMirrored: false,
    autoSize: true,
    useCssTransforms: true,
    breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
    useStyleCursor: true,
    restoreOnDrag: false,
    ...props.gridConfig
  }
  
  // 确保开关配置正确应用
  if (props.gridConfig) {
    if (props.gridConfig.isDraggable !== undefined) {
      config.isDraggable = !isReadOnly.value && !props.staticGrid && props.gridConfig.isDraggable
    }
    if (props.gridConfig.isResizable !== undefined) {
      config.isResizable = !isReadOnly.value && !props.staticGrid && props.gridConfig.isResizable
    }
    if (props.gridConfig.staticGrid !== undefined) {
      config.isDraggable = !isReadOnly.value && !props.gridConfig.staticGrid && config.isDraggable
      config.isResizable = !isReadOnly.value && !props.gridConfig.staticGrid && config.isResizable
    }
  }
  
  // 调试日志
  console.log('🔧 GridLayoutPlusWrapper - 当前配置:', {
    propsGridConfig: props.gridConfig,
    finalConfig: config,
    isReadOnly: isReadOnly.value,
    staticGrid: props.staticGrid
  })
  
  return config
})

interface ExtendedGridLayoutPlusItem extends GridLayoutPlusItem {
  raw: VisualEditorWidget;
}

const nodesToLayout = (nodes: VisualEditorWidget[]): ExtendedGridLayoutPlusItem[] => {
  return nodes.map(node => ({
    i: node.id,
    x: node.layout?.gridstack?.x ?? 0,
    y: node.layout?.gridstack?.y ?? 0,
    w: node.layout?.gridstack?.w ?? 4,
    h: node.layout?.gridstack?.h ?? 2,
    static: props.staticGrid || (props.gridConfig?.staticGrid ?? false),
    isDraggable: !isReadOnly.value && !props.staticGrid && (props.gridConfig?.isDraggable ?? true),
    isResizable: !isReadOnly.value && !props.staticGrid && (props.gridConfig?.isResizable ?? true),
    type: node.type,
    raw: node,
  }))
}

watch(() => props.graphData.nodes, (newNodes) => {
  layout.value = nodesToLayout(newNodes || [])
}, { immediate: true, deep: true })

// 监听配置变更
watch(() => props.gridConfig, (newConfig) => {
  console.log('🔧 GridLayoutPlusWrapper - 配置变更:', {
    newConfig,
    isReadOnly: isReadOnly.value,
    staticGrid: props.staticGrid
  })
  // 重新计算布局以应用新配置
  layout.value = nodesToLayout(props.graphData.nodes || [])
}, { deep: true })

const onLayoutChange = (newLayout: ExtendedGridLayoutPlusItem[]) => {
  // 更新所有节点的布局信息
  newLayout.forEach(item => {
    updateNodeLayout(item)
  })
};

const updateNodeLayout = (item: ExtendedGridLayoutPlusItem) => {
  const node = getNodeById(item.i)
  if (node) {
    updateNode(node.id, {
      layout: { ...node.layout, gridstack: { x: item.x, y: item.y, w: item.w, h: item.h } }
    })
  }
}

const onDragStop = (itemId: string, newX: number, newY: number) => {
  const item = layout.value.find(item => item.i === itemId)
  if (item) {
    item.x = newX
    item.y = newY
    updateNodeLayout(item)
  }
}

const onResizeStop = (itemId: string, newH: number, newW: number, newHPx: number, newWPx: number) => {
  const item = layout.value.find(item => item.i === itemId)
  if (item) {
    item.h = newH
    item.w = newW
    updateNodeLayout(item)
  }
}
const handleNodeSelect = (nodeId: string) => {
  selectNode(nodeId)
  emit('node-select', nodeId)
}

const handleInteraction = (widget: VisualEditorWidget) => {
  if (props.readonly) { // 只在预览模式下触发交互
    const { onClick } = widget.interaction || {};
    if (!onClick) return;

    if (onClick.type === 'link' && onClick.payload?.url) {
      window.open(onClick.payload.url, onClick.payload.newTab ? '_blank' : '_self');
    } else if (onClick.type === 'internal_route' && onClick.payload?.route) {
      router.push(onClick.payload.route);
    }
  }
}

const handleContextMenu = (event: MouseEvent, nodeId: string) => {
  if (isReadOnly.value || props.staticGrid) return
  event.preventDefault()
  
  const node = getNodeById(nodeId)
  if (!node) return

  contextMenu.value.show = false
  nextTick().then(() => {
    contextMenu.value = {
      show: true,
      x: event.clientX,
      y: event.clientY,
      selectedWidgets: [node],
    }
  })
}

const handleContextMenuSelect = (action: string) => {
  const widget = contextMenu.value.selectedWidgets[0]
  if (!widget) return

  switch (action) {
    case 'copy': {
      const newNode = JSON.parse(JSON.stringify(widget))
      newNode.id = `${newNode.type}_${nanoid()}`
      if (newNode.layout?.gridstack) {
        newNode.layout.gridstack.y += 1 
      }
      addNode(newNode)
      break
    }
    case 'delete':
      removeNode(widget.id)
      break
    case 'settings':
      emit('request-settings', widget.id)
      break
  }
  closeContextMenu()
}

const closeContextMenu = () => { contextMenu.value.show = false }

</script>

<style scoped>
.grid-layout-plus-wrapper-editor { width: 100%; height: 100%; }
.editor-widget-container { 
  width: 100%; 
  height: 100%; 
  box-sizing: border-box; 
  overflow: hidden; 
  cursor: pointer; 
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
}
.widget-title-bar {
  flex-shrink: 0;
  padding: 4px 8px;
  background-color: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.widget-content {
  flex-grow: 1;
  position: relative;
  overflow: hidden;
}
.placeholder { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  height: 100%; 
  color: #999; 
  background-color: #f0f0f0; 
  border-radius: 4px; 
}
</style>
