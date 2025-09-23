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
        <NodeWrapper
          :node="item.raw"
          :node-id="item.raw.id"
          :readonly="isReadOnly"
          :is-selected="false"
          :show-resize-handles="false"
          :get-widget-component="() => null"
          :multi-data-source-data="props.multiDataSourceStore?.[item.raw.id]"
          :multi-data-source-config="props.multiDataSourceConfigStore?.[item.raw.id]"
          class="grid-node-wrapper"
          @node-click="() => handleNodeSelect(item.i)"
          @node-contextmenu="(nodeId, event) => handleContextMenu(event, nodeId)"
          @title-update="handleTitleUpdate"
        />
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
import { useEditorStore } from '@/store/modules/editor'
import { useWidgetStore } from '@/store/modules/widget'
import NodeWrapper from '@/components/visual-editor/renderers/base/NodeWrapper.vue'
import ContextMenu from '@/components/visual-editor/renderers/canvas/ContextMenu.vue'
import type { VisualEditorWidget, GraphData } from '@/components/visual-editor/types'
import { smartDeepClone } from '@/utils/deep-clone'
const props = defineProps<{
  graphData: GraphData
  readonly?: boolean
  staticGrid?: boolean
  gridConfig?: Partial<GridLayoutPlusConfig>
  multiDataSourceStore?: Record<string, Record<string, any>>
  multiDataSourceConfigStore?: Record<string, any>
}>()
const emit = defineEmits(['node-select', 'request-settings'])

const router = useRouter()

// 使用原始 store
const editorStore = useEditorStore()
const widgetStore = useWidgetStore()

// 适配旧接口方法
const selectNode = (nodeId: string) => {
  if (nodeId) {
    widgetStore.selectNodes([nodeId])
  } else {
    widgetStore.selectNodes([])
  }
}

const isCard2Component = (nodeId: string) => {
  // 简单的Card2组件检测
  const node = editorStore.nodes.find(n => n.id === nodeId)
  return node?.type.includes('card2') || node?.type.includes('Card2') || false
}

const getNodeById = (nodeId: string) => {
  return editorStore.nodes.find(n => n.id === nodeId)
}

const updateNode = async (nodeId: string, updates: any) => {
  editorStore.updateNode(nodeId, updates)
}

const addNode = async (node: any) => {
  editorStore.addNode(node)
}

const removeNode = async (nodeId: string) => {
  editorStore.removeNode(nodeId)
}

const gridWrapperEl = ref<HTMLElement | null>(null)
const layout = shallowRef<ExtendedGridLayoutPlusItem[]>([])
const isReadOnly = computed(() => props.readonly)

const contextMenu = ref<{
  show: boolean
  x: number
  y: number
  selectedWidgets: VisualEditorWidget[]
}>({ show: false, x: 0, y: 0, selectedWidgets: [] })

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
    autoSize: false, // 🔥 禁用自动调整大小，让父容器处理滚动
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
  return config
})

interface ExtendedGridLayoutPlusItem extends GridLayoutPlusItem {
  raw: VisualEditorWidget
}

const nodesToLayout = (nodes: VisualEditorWidget[]): ExtendedGridLayoutPlusItem[] => {
  return nodes.map(node => ({
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
    raw: node
  }))
    if (newNodes) {
      newNodes.forEach(node => {})
    }
    layout.value = nodesToLayout(newNodes || [])
  },
  { immediate: true, deep: true }
)

// 监听配置变更
watch(
  () => props.gridConfig,
  newConfig => {
    // 重新计算布局以应用新配置
    layout.value = nodesToLayout(props.graphData.nodes || [])
  },
  { deep: true }
)

// 🔥 监听 staticGrid 变更 - 修复预览模式切换问题
watch(
  () => props.staticGrid,
  (newStaticGrid, oldStaticGrid) => {
    // 只更新布局项的static属性，不重新计算位置，避免预览模式位置偏移
    layout.value = layout.value.map(item => ({
      ...item,
      static: newStaticGrid || (props.gridConfig?.staticGrid ?? false),
      isDraggable: !props.readonly && !newStaticGrid && (props.gridConfig?.isDraggable ?? true),
      isResizable: !props.readonly && !newStaticGrid && (props.gridConfig?.isResizable ?? true)
    }))
  }
)

const onLayoutChange = (newLayout: ExtendedGridLayoutPlusItem[]) => {
  // 🔥 在预览模式下不更新布局信息，避免意外的位置变化
  if (props.readonly || props.staticGrid) {
    return
  }
      layout: { ...node.layout, gridstack: { x: item.x, y: item.y, w: item.w, h: item.h } }
    })
  }
}


  // 更新所有节点的布局信息
  newLayout.forEach(item => {
    updateNodeLayout(item)
  })
}

const updateNodeLayout = (item: ExtendedGridLayoutPlusItem) => {
  const node = getNodeById(item.i)
  if (node) {
    updateNode(node.id, {
      layout: { ...node.layout, gridstack: { x: item.x, y: item.y, w: item.w, h: item.h } }
    })
  }
  if (item) {
    item.x = newX
    item.y = newY
    updateNodeLayout(item)
  }
}

    updateNodeLayout(item)
  if (item) {
    item.h = newH
    item.w = newW
    updateNodeLayout(item)
  }
}
const handleNodeSelect = (nodeId: string) => {
  selectNode(nodeId)
    updateNodeLayout(item)

const handleInteraction = (widget: VisualEditorWidget) => {
  if (props.readonly) {
    // 只在预览模式下触发交互
    const { onClick } = widget.interaction || {}
    if (!onClick) return

    if (onClick.type === 'link' && onClick.payload?.url) {
      window.open(onClick.payload.url, onClick.payload.newTab ? '_blank' : '_self')
    } else if (onClick.type === 'internal_route' && onClick.payload?.route) {
      router.push(onClick.payload.route)
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
      selectedWidgets: [node]
    }
  })
}

const handleContextMenuSelect = (action: string) => {
  const widget = contextMenu.value.selectedWidgets[0]
  if (!widget) return

  switch (action) {
    case 'copy': {
      // 🔥 使用智能深拷贝，自动处理Vue响应式对象
      const newNode = smartDeepClone(widget)
      newNode.id = `${newNode.type}_${nanoid()}`
      if (newNode.layout?.gridstack) {
        newNode.layout.gridstack.y += 1
      }
      addNode(newNode)
      break
    }
      if (newNode.layout?.gridstack) {
        newNode.layout.gridstack.y += 1

const closeContextMenu = () => {
  contextMenu.value.show = false
}

/**
 * 处理标题更新
 * 当NodeWrapper中的标题被编辑时调用
 */
const handleTitleUpdate = (nodeId: string, newTitle: string) => {
  // NodeWrapper已经处理了配置更新，这里只需要记录日志
}
</script>

<style scoped>
.grid-layout-plus-wrapper-editor {
  width: 100%;
}

.grid-node-wrapper {
  width: 100%;
  height: 100%;
}
</style>
