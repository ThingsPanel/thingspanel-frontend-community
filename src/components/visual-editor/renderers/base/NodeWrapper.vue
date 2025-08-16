<template>
  <div
    v-show="baseConfig?.visible !== false"
    ref="nodeElement"
    class="node-wrapper"
    :class="wrapperClasses"
    :style="wrapperStyles"
    @mousedown.stop="$emit('node-mousedown', nodeId, $event)"
    @click.stop="$emit('node-click', nodeId, $event)"
    @contextmenu.stop.prevent="$emit('node-contextmenu', nodeId, $event)"
  >
    <!-- 标题栏 -->
    <div v-if="shouldShowTitle" class="node-title-bar" :style="titleBarStyles" @dblclick="startTitleEdit">
      <!-- 编辑模式 -->
      <n-input
        v-if="isEditingTitle"
        ref="titleInputRef"
        v-model:value="editingTitleValue"
        size="small"
        :bordered="false"
        class="title-input"
        @blur="finishTitleEdit"
        @keyup.enter="finishTitleEdit"
        @keyup.escape="cancelTitleEdit"
      />
      <!-- 显示模式 -->
      <span v-else class="title-text">{{ displayTitle }}</span>
    </div>

    <!-- 内容区域 -->
    <div class="node-content" :style="contentStyles">
      <Card2Wrapper
        v-if="node.metadata?.isCard2Component"
        :component-type="node.type"
        :config="getNodeComponentConfig(nodeId) || node.properties"
        :data="node.metadata?.card2Data"
        :metadata="node.metadata"
        :data-source="node.dataSource"
        :data-sources="multiDataSourceData"
        :data-sources-config="multiDataSourceConfig"
        :node-id="nodeId"
        @error="$emit('component-error', $event)"
      />
      <component :is="getWidgetComponent?.(node.type)" v-else v-bind="node.properties" />
    </div>

    <!-- 调整大小控制句柄 -->
    <div v-if="showResizeHandles" class="resize-handles">
      <div
        v-for="handle in resizeHandles"
        :key="handle.position"
        :class="`resize-handle resize-handle-${handle.position}`"
        @mousedown.stop="$emit('resize-start', nodeId, handle.position, $event)"
      />
    </div>

    <!-- 选中状态指示器 -->
    <div v-if="isSelected && !readonly" class="selection-indicator" />
  </div>
</template>

<script setup lang="ts">
/**
 * 统一的节点外框组件
 * 为Canvas和GridLayoutPlus渲染器提供一致的节点包装
 * 负责标题显示/编辑、基础配置应用、选中状态等
 */

import { ref, computed, nextTick, watch, onMounted, onUnmounted, h } from 'vue'
import { NInput, NModal, NSpace, NButton, NDropdown, NIcon } from 'naive-ui'
import { SettingsOutline, CopyOutline, TrashOutline } from '@vicons/ionicons5'
import { configurationManager } from '../../configuration'
import { useEditor } from '../../hooks/useEditor'
import Card2Wrapper from '../canvas/Card2Wrapper.vue'
import type { BaseConfiguration, WidgetConfiguration } from '../../configuration/types'
import type { VisualEditorWidget } from '../../types'

interface Props {
  /** 节点数据 */
  node: VisualEditorWidget
  /** 节点ID */
  nodeId: string
  /** 是否只读模式 */
  readonly?: boolean
  /** 是否显示调整大小句柄 */
  showResizeHandles?: boolean
  /** 是否选中 */
  isSelected?: boolean
  /** 强制显示标题（忽略配置） */
  forceShowTitle?: boolean
  /** 获取组件的方法（用于非Card2组件） */
  getWidgetComponent?: (type: string) => any
  /** 多数据源数据 */
  multiDataSourceData?: Record<string, any>
  /** 多数据源配置 */
  multiDataSourceConfig?: any
}

interface Emits {
  (e: 'node-click', nodeId: string, event: MouseEvent): void
  (e: 'node-mousedown', nodeId: string, event: MouseEvent): void
  (e: 'node-contextmenu', nodeId: string, event: MouseEvent): void
  (e: 'resize-start', nodeId: string, direction: string, event: MouseEvent): void
  (e: 'title-update', nodeId: string, newTitle: string): void
  (e: 'component-error', error: Error): void
}

const props = defineProps<Props>()

// 计算属性，从props中提取多数据源数据和配置，提供给组件
const multiDataSourceData = computed(() => props.multiDataSourceData || {})
const multiDataSourceConfig = computed(() => props.multiDataSourceConfig || {})
const emit = defineEmits<Emits>()

const { updateNode } = useEditor()

// 调试：监听node.metadata变化
watch(
  () => props.node.metadata,
  newMetadata => {
    if (props.node.type === 'datasource-test') {
      console.log('🔧 [NodeWrapper] metadata变化:', newMetadata)
      console.log('🔧 [NodeWrapper] card2Data:', newMetadata?.card2Data)
    }
  },
  { deep: true, immediate: true }
)

// 调试：监听多数据源数据变化
watch(
  () => props.multiDataSourceData,
  newMultiDataSourceData => {
    if (newMultiDataSourceData) {
      console.log(`🔧 [NodeWrapper] 多数据源数据变化 (${props.nodeId}):`, newMultiDataSourceData)
    }
  },
  { deep: true, immediate: true }
)

// 模板引用
const nodeElement = ref<HTMLElement>()
const titleInputRef = ref<InstanceType<typeof NInput>>()

// 标题编辑状态
const isEditingTitle = ref(false)
const editingTitleValue = ref('')
const originalTitleValue = ref('')

// 调整大小句柄定义
const resizeHandles = [
  { position: 'nw' },
  { position: 'n' },
  { position: 'ne' },
  { position: 'w' },
  { position: 'e' },
  { position: 'sw' },
  { position: 's' },
  { position: 'se' }
]

// 获取基础配置
const baseConfig = computed((): BaseConfiguration => {
  try {
    const widgetConfig = configurationManager.getConfiguration(props.nodeId)

    const defaultConfig = {
      showTitle: false,
      title: '',
      opacity: 1,
      visible: true,
      padding: { top: 0, right: 0, bottom: 0, left: 0 }
    }

    const finalConfig = widgetConfig?.base || defaultConfig

    return finalConfig
  } catch (error) {
    console.warn(`[NodeWrapper] 获取节点 ${props.nodeId} 基础配置失败:`, error)
    return {
      showTitle: false,
      title: '',
      opacity: 1,
      visible: true,
      padding: { top: 0, right: 0, bottom: 0, left: 0 }
    }
  }
})

// 获取节点组件配置
const getNodeComponentConfig = (nodeId: string): any => {
  try {
    const widgetConfig = configurationManager.getConfiguration(nodeId)
    return widgetConfig?.component?.properties
  } catch (error) {
    console.warn(`[NodeWrapper] 获取节点 ${nodeId} 组件配置失败:`, error)
    return undefined
  }
}

// 标题显示逻辑
const shouldShowTitle = computed(() => {
  return props.forceShowTitle || baseConfig.value.showTitle
})

const displayTitle = computed(() => {
  return baseConfig.value.title || props.node.label || props.node.type || '未命名组件'
})

// 样式计算
const wrapperStyles = computed(() => {
  const config = baseConfig.value
  const styles: Record<string, string> = {}

  // 🔧 透明度
  if (config.opacity !== undefined && config.opacity !== 1) {
    styles.opacity = config.opacity.toString()
  }

  // 🔧 背景颜色 - 如果配置了则覆盖默认值
  if (config.backgroundColor) {
    styles.backgroundColor = config.backgroundColor
  }

  // 🔧 边框样式 - 完整的边框配置
  if (config.borderWidth !== undefined) {
    styles.borderWidth = `${config.borderWidth}px`
    styles.borderStyle = config.borderStyle || 'solid'
    styles.borderColor = config.borderColor || 'var(--border-color)'
  }

  // 🔧 圆角 - 如果配置了则覆盖默认值
  if (config.borderRadius !== undefined) {
    styles.borderRadius = `${config.borderRadius}px`
  }

  // 🔧 阴影 - 如果配置了则覆盖默认值
  if (config.boxShadow) {
    styles.boxShadow = config.boxShadow
  }

  console.log('🔧 [NodeWrapper] 应用样式:', styles, '来源配置:', config)
  return styles
})

const wrapperClasses = computed(() => {
  const classes: string[] = []

  if (props.isSelected && !props.readonly) {
    classes.push('selected')
  }

  if (props.readonly) {
    classes.push('readonly')
  }

  return classes
})

const titleBarStyles = computed(() => ({
  padding: '6px 8px',
  fontSize: '12px',
  fontWeight: '500',
  color: 'var(--text-color)',
  backgroundColor: 'var(--body-color)',
  borderBottom: '1px solid var(--border-color)',
  userSelect: 'none' as const,
  cursor: props.readonly ? 'default' : 'pointer'
}))

const contentStyles = computed(() => {
  const config = baseConfig.value
  const styles: Record<string, string> = {
    flex: '1',
    position: 'relative' as const,
    overflow: 'hidden' as const
  }

  // 内边距 - 应用到内容区域
  if (config.padding) {
    const { top = 0, right = 0, bottom = 0, left = 0 } = config.padding
    styles.padding = `${top}px ${right}px ${bottom}px ${left}px`
  }

  return styles
})

// 标题编辑方法
const startTitleEdit = () => {
  if (props.readonly) return

  isEditingTitle.value = true
  editingTitleValue.value = baseConfig.value.title || props.node.label || ''
  originalTitleValue.value = editingTitleValue.value

  nextTick(() => {
    titleInputRef.value?.focus()
    titleInputRef.value?.select()
  })
}

const finishTitleEdit = () => {
  if (!isEditingTitle.value) return

  const newTitle = editingTitleValue.value.trim()
  isEditingTitle.value = false

  if (newTitle !== originalTitleValue.value) {
    // 更新到配置管理器
    try {
      const currentConfig = configurationManager.getConfiguration(props.nodeId) || {
        base: {},
        component: { properties: {} },
        dataSource: null,
        interaction: {}
      }

      configurationManager.updateConfiguration(props.nodeId, 'base', {
        ...currentConfig.base,
        title: newTitle,
        showTitle: true
      })

      // 同时更新节点的label属性以保持兼容性
      updateNode(props.nodeId, { label: newTitle })

      emit('title-update', props.nodeId, newTitle)
      console.log(`[NodeWrapper] 标题已更新: ${props.nodeId} -> "${newTitle}"`)
    } catch (error) {
      console.error(`[NodeWrapper] 更新标题失败:`, error)
    }
  }
}

const cancelTitleEdit = () => {
  isEditingTitle.value = false
  editingTitleValue.value = originalTitleValue.value
}

// 配置变化监听器取消函数
let removeConfigListener: (() => void) | null = null

// 监听配置管理器的配置变化
onMounted(() => {
  try {
    // 检查节点是否有配置，如果没有则创建默认配置
    const existingConfig = configurationManager.getConfiguration(props.nodeId)
    if (!existingConfig) {
      const defaultConfig: WidgetConfiguration = {
        base: {
          showTitle: false,
          title: props.node.label || props.node.type || '未命名组件',
          opacity: 1,
          visible: true,
          padding: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        component: { properties: props.node.properties || {} },
        dataSource: null,
        interaction: {},
        metadata: {
          version: '1.0.0',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      }
      configurationManager.setConfiguration(props.nodeId, defaultConfig)
    }

    removeConfigListener = configurationManager.onConfigurationChange(props.nodeId, newConfig => {
      // baseConfig是computed，会自动响应configurationManager的变化
    })
  } catch (error) {
    console.warn(`[NodeWrapper] 添加配置监听器失败:`, error)
  }
})

onUnmounted(() => {
  if (removeConfigListener) {
    try {
      removeConfigListener()
    } catch (error) {
      console.warn(`[NodeWrapper] 移除配置监听器失败:`, error)
    }
  }
})

// 监听节点变化，同步标题
watch(
  () => props.node.label,
  newLabel => {
    if (!isEditingTitle.value && newLabel && !baseConfig.value.title) {
      // 如果配置中没有标题但节点有label，尝试同步
      try {
        const currentConfig = configurationManager.getConfiguration(props.nodeId)
        if (currentConfig && !currentConfig.base?.title) {
          configurationManager.updateConfiguration(props.nodeId, 'base', {
            ...currentConfig.base,
            title: newLabel
          })
        }
      } catch (error) {
        // 忽略同步错误
      }
    }
  }
)
</script>

<style scoped>
.node-wrapper {
  /* 🔧 基本布局样式，不干扰base配置 */
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: column;

  /* 🔧 移除默认样式，由base配置控制 */
  /* background-color: var(--card-color); */
  /* border-radius: var(--border-radius, 6px); */
  /* border: 2px solid transparent; */
  /* box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); */

  /* 保留必要的交互样式 */
  transition:
    opacity 0.3s ease,
    border-color 0.2s ease;
  overflow: hidden;

  /* 🔧 最小的默认样式，保证可见性 */
  border: 1px solid transparent; /* 最小边框，用于选中状态 */

  /* 🔧 确保在grid-item-body透明化后有基本可见样式 */
  background-color: var(--card-color);
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.node-wrapper:hover:not(.readonly) {
  /* 🔧 简化hover效果，不覆盖base配置 */
  border-color: rgba(24, 160, 88, 0.3);
}

.node-wrapper.selected {
  /* 🔧 简化选中效果，不覆盖base配置 */
  border-color: var(--primary-color) !important; /* !important保证选中效果 */
  z-index: 1;
}

.node-wrapper.readonly {
  cursor: default;
}

.node-wrapper.readonly:hover {
  border-color: transparent;
}

.node-title-bar {
  flex-shrink: 0;
  border-bottom: 1px solid var(--border-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
  position: relative;
}

.title-text {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.title-input {
  --n-border: none !important;
  --n-border-hover: none !important;
  --n-border-focus: none !important;
  --n-box-shadow-focus: none !important;
}

.title-input :deep(.n-input__input-el) {
  padding: 0 !important;
  font-size: 12px;
  font-weight: 500;
}

.node-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.resize-handles {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  pointer-events: none;
}

.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--primary-color);
  border: 1px solid #fff;
  border-radius: 50%;
  pointer-events: all;
  z-index: 10;
}

.resize-handle-nw {
  top: 0;
  left: 0;
  cursor: nw-resize;
  transform: translate(-50%, -50%);
}
.resize-handle-n {
  top: 0;
  left: 50%;
  cursor: n-resize;
  transform: translate(-50%, -50%);
}
.resize-handle-ne {
  top: 0;
  right: 0;
  cursor: ne-resize;
  transform: translate(50%, -50%);
}
.resize-handle-w {
  top: 50%;
  left: 0;
  cursor: w-resize;
  transform: translate(-50%, -50%);
}
.resize-handle-e {
  top: 50%;
  right: 0;
  cursor: e-resize;
  transform: translate(50%, -50%);
}
.resize-handle-sw {
  bottom: 0;
  left: 0;
  cursor: sw-resize;
  transform: translate(-50%, 50%);
}
.resize-handle-s {
  bottom: 0;
  left: 50%;
  cursor: s-resize;
  transform: translate(-50%, 50%);
}
.resize-handle-se {
  bottom: 0;
  right: 0;
  cursor: se-resize;
  transform: translate(50%, 50%);
}

.selection-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  border: 2px solid var(--primary-color);
  border-radius: inherit;
  box-shadow: 0 0 0 1px rgba(24, 160, 88, 0.1);
}

/* 主题适配 */
[data-theme='dark'] .node-wrapper {
  background-color: var(--card-color);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

[data-theme='dark'] .node-wrapper:hover:not(.readonly) {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

[data-theme='dark'] .node-title-bar {
  background-color: var(--body-color);
  color: var(--text-color);
  border-bottom-color: var(--border-color);
}

/* 自定义类支持 */
.node-wrapper.minimal {
  border: none;
  box-shadow: none;
  background: transparent;
}

.node-wrapper.dashboard-widget {
  background: var(--card-color);
  border-radius: 8px;
  box-shadow: var(--box-shadow);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .node-title-bar {
    padding: 4px 6px;
    font-size: 11px;
  }

  .resize-handle {
    width: 10px;
    height: 10px;
  }
}
</style>
