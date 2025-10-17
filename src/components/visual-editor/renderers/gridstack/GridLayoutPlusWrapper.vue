<template>
  <div ref="gridWrapperEl" class="grid-layout-plus-wrapper-editor">
    <!--
      将原先的 GridLayoutPlus 替换为 GridV2
      - GridV2 保持与 GridLayoutPlus 完全一致的 Props 接口
      - 支持默认插槽并传出 { item }，现有模板可无缝复用
      - 用于 props/idKey 链路调试，不触发原网格事件
    -->
    <GridV2
      v-model:layout="layout"
      :config="gridConfig"
      :readonly="isReadOnly"
      :show-title="props.showWidgetTitles"
      :id-key="props.idKey"
      @layout-change="onLayoutChange"
      @item-resized="onResizeStop"
      @item-moved="onDragStop"
    >
      <template #default="{ item }">
        <!-- 关键：允许事件冒泡到 GridStack（整卡片 mousedown 触发拖拽） -->
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
          :event-stop-propagation="false"

          @node-click="() => handleNodeSelect(item.i)"
          @node-contextmenu="(nodeId, event) => handleContextMenu(event, nodeId)"
          @title-update="handleTitleUpdate"
        />
      </template>
    </GridV2>

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
// 替换导入：从 common/gridv2 引入 GridV2；类型仍从 common/grid 复用
import { GridV2 } from '@/components/common/gridv2'
import type { GridLayoutPlusItem, GridLayoutPlusConfig } from '@/components/common/grid'
import { useEditorStore } from '@/store/modules/editor'
import { useWidgetStore } from '@/store/modules/widget'
import NodeWrapper from '@/components/visual-editor/renderers/base/NodeWrapper.vue'
import { ContextMenu } from '@/components/visual-editor/renderers/base'
import type { VisualEditorWidget, GraphData } from '@/components/visual-editor/types'
import { smartDeepClone } from '@/utils/deep-clone'

const props = withDefaults(defineProps<{
  graphData: any
  readonly?: boolean
  staticGrid?: boolean
  // 将 any 改为 Partial<GridLayoutPlusConfig>，避免不必要的 any
  gridConfig?: Partial<GridLayoutPlusConfig>
  // 新增：控制是否显示标题
  showWidgetTitles?: boolean
  // 新增：可配置主键字段名，默认 'i'
  idKey?: string
}>(), {
  readonly: false,
  staticGrid: false,
  gridConfig: () => ({}),
  showWidgetTitles: false,
  idKey: 'i'
})
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
    colNum: 24, // 🔥 修复：统一默认为24列
    rowHeight: 80,
    // 🔥 使用新的 gap 配置，更直接清晰
    horizontalGap: 0, // 水平间距默认 0px
    verticalGap: 0, // 垂直间距默认 0px
    // 保留 margin 以保持向后兼容
    margin: [0, 0] as [number, number],
    isDraggable: !isReadOnly.value && !props.staticGrid,
    isResizable: !isReadOnly.value && !props.staticGrid,
    responsive: false,
    preventCollision: true, // 🔥 阻止组件重叠（关键配置）
    verticalCompact: false, // 🔥 禁用垂直压缩，保持用户拖拽的布局不变
    isMirrored: false,
    autoSize: false, // 🔥 禁用自动调整大小，让父容器处理滚动
    useCssTransforms: true,
    breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    cols: { lg: 24, md: 20, sm: 12, xs: 8, xxs: 4 }, // 🔥 修复：调整断点列数以匹配24列基准
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
  const key = props.idKey || 'i'
  return nodes.map(node => {
    const item = {
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
    } as ExtendedGridLayoutPlusItem
    // 写回自定义主键，保证双字段一致
    if (key !== 'i') {
      ;(item as any)[key] = item.i
    }
    return item
  })
}

watch(
  () => props.graphData.nodes,
  newNodes => {
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
    case 'delete':
      removeNode(widget.id)
      break
    case 'settings':
      emit('request-settings', widget.id)
      break
  }
  closeContextMenu()
}

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
