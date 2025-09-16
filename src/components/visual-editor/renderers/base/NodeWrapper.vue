<template>
  <div
    ref="nodeElement"
    class="node-wrapper"
    :class="wrapperClasses"
    :style="wrapperStyles"
    @mousedown.stop="$emit('node-mousedown', nodeId, $event)"
    @click.stop="$emit('node-click', nodeId, $event)"
    @contextmenu.stop.prevent="$emit('node-contextmenu', nodeId, $event)"
  >
    <!-- 内容包装器 - 控制可见性但保持事件响应 -->
    <div v-show="baseConfig?.visible !== false" class="node-content-wrapper">
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
          :config="nodeComponentConfig || node.properties"
          :data="node.metadata?.card2Data"
          :metadata="node.metadata"
          :data-source="node.dataSource"
          :data-sources="multiDataSourceData"
          :data-sources-config="multiDataSourceConfig"
          :node-id="nodeId"
          :interaction-configs="nodeInteractionConfigs"
          :allow-external-control="nodeInteractionPermissions?.allowExternalControl"
          :interaction-permissions="nodeInteractionPermissions"
          :preview-mode="readonly"
          @error="$emit('component-error', $event)"
        />
        <component :is="getWidgetComponent?.(node.type)" v-else v-bind="node.properties" />
      </div>
    </div>

    <!-- 调整大小控制句柄 - 始终响应事件，便于编辑隐藏组件 -->
    <div v-if="showResizeHandles" class="resize-handles">
      <div
        v-for="handle in resizeHandles"
        :key="handle.position"
        :class="`resize-handle resize-handle-${handle.position}`"
        @mousedown.stop="$emit('resize-start', nodeId, handle.position, $event)"
      />
    </div>

    <!-- 选中状态指示器 - 始终响应，便于编辑隐藏组件 -->
    <div v-if="isSelected && !readonly" class="selection-indicator" />
  </div>
</template>

<script setup lang="ts">
/**
 * 统一的节点外框组件
 * 为Canvas和GridLayoutPlus渲染器提供一致的节点包装
 * 负责标题显示/编辑、基础配置应用、选中状态等
 */

import { ref, computed, nextTick, watch, watchEffect, onMounted, onUnmounted, h } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { NInput, NModal, NSpace, NButton, NDropdown, NIcon } from 'naive-ui'
import { SettingsOutline, CopyOutline, TrashOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'
import { configurationManager } from '@/components/visual-editor/configuration'
import { useEditor } from '@/components/visual-editor/hooks/useEditor'
import Card2Wrapper from '@/components/visual-editor/renderers/canvas/Card2Wrapper.vue'
import type { BaseConfiguration, WidgetConfiguration } from '@/components/visual-editor/configuration/types'
import type { VisualEditorWidget } from '@/components/visual-editor/types'

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
const { t } = useI18n()

// 调试：监听node.metadata变化
watch(
  () => props.node.metadata,
  newMetadata => {
    if (props.node.type === 'datasource-test') {
    }
  },
  { deep: true, immediate: true }
)

// 调试：监听多数据源数据变化
watch(
  () => props.multiDataSourceData,
  newMultiDataSourceData => {
    if (newMultiDataSourceData) {
      if (process.env.NODE_ENV === 'development') {
      }
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

// 🔥 修复：获取基础配置，使用静态默认值避免重复创建对象
const defaultBaseConfig: BaseConfiguration = {
  showTitle: false,
  title: '',
  opacity: 1,
  visible: true,
  padding: { top: 0, right: 0, bottom: 0, left: 0 },
  margin: { top: 0, right: 0, bottom: 0, left: 0 }
}

// 🔥 修复递归更新：使用ref + watchEffect替代computed，避免在计算属性中触发配置系统
const baseConfigRef = ref<BaseConfiguration>(defaultBaseConfig)

// 🔥 修复递归更新：将配置获取逻辑移到watchEffect中，并添加防抖
const updateBaseConfig = useDebounceFn(() => {
  try {
    // 🔥 统一使用配置管理器获取配置，无论是否为Card2组件
    const widgetConfig = configurationManager.getConfiguration(props.nodeId)

    if (!widgetConfig?.base) {
      baseConfigRef.value = defaultBaseConfig
      return
    }

    baseConfigRef.value = {
      ...defaultBaseConfig,
      ...widgetConfig.base
    }
  } catch (error) {
    console.error(`[NodeWrapper] 获取节点 ${props.nodeId} 基础配置失败:`, error)
    baseConfigRef.value = defaultBaseConfig
  }
}, 50) // 50ms防抖，避免频繁更新

// 🔥 简化的Card2配置获取，使用配置管理器避免DOM操作
const getBaseConfigFromCard2 = (): BaseConfiguration | null => {
  try {
    // 🔥 优先使用配置管理器获取配置
    const config = configurationManager.getConfiguration(props.nodeId)
    if (config?.base) {
      return config.base
    }

    // 🔥 回退：发送自定义事件请求配置
    const configRequestEvent = new CustomEvent('card2-config-request', {
      detail: { componentId: props.nodeId, layer: 'base' }
    })

    let receivedConfig: BaseConfiguration | null = null
    const handleConfigResponse = (event: CustomEvent) => {
      if (event.detail.componentId === props.nodeId && event.detail.layer === 'base') {
        receivedConfig = event.detail.config
      }
    }

    window.addEventListener('card2-config-response', handleConfigResponse as EventListener)
    window.dispatchEvent(configRequestEvent)
    window.removeEventListener('card2-config-response', handleConfigResponse as EventListener)

    return receivedConfig
  } catch (error) {
    console.error(`[NodeWrapper] 获取Card2配置失败 ${props.nodeId}:`, error)
    return null
  }
}

// 🔥 修复递归更新：使用计算属性引用ref，避免直接在computed中调用配置系统
const baseConfig = computed(() => baseConfigRef.value)

// 🔥 修复递归更新：使用ref避免在computed中调用配置系统
const nodeComponentConfigRef = ref<any>(undefined)
const nodeInteractionConfigsRef = ref<any[]>([])
const nodeInteractionPermissionsRef = ref<any>({
  allowExternalControl: true,
  allowedEvents: ['click', 'hover', 'focus', 'blur']
})

// 🔥 修复递归更新：统一的配置更新函数，防抖处理
const updateAllConfigs = useDebounceFn(() => {
  try {
    const widgetConfig = configurationManager.getConfiguration(props.nodeId)
    
    // 更新组件配置
    nodeComponentConfigRef.value = widgetConfig?.component?.properties || undefined
    
    // 更新交互配置
    nodeInteractionConfigsRef.value = widgetConfig?.interaction?.configs || []
    
    // 更新交互权限
    nodeInteractionPermissionsRef.value = widgetConfig?.interaction?.permissions || {
      allowExternalControl: true,
      allowedEvents: ['click', 'hover', 'focus', 'blur']
    }
  } catch (error) {
    console.error(`[NodeWrapper] 获取节点 ${props.nodeId} 配置失败:`, error)
    nodeComponentConfigRef.value = undefined
    nodeInteractionConfigsRef.value = []
    nodeInteractionPermissionsRef.value = {
      allowExternalControl: true,
      allowedEvents: ['click', 'hover', 'focus', 'blur']
    }
  }
}, 50)

// 🔥 修复递归更新：使用计算属性引用ref
const nodeComponentConfig = computed(() => nodeComponentConfigRef.value)
const nodeInteractionConfigs = computed(() => nodeInteractionConfigsRef.value)
const nodeInteractionPermissions = computed(() => nodeInteractionPermissionsRef.value)

// 保持向后兼容的函数版本
const getNodeComponentConfig = (nodeId: string): any => {
  if (nodeId === props.nodeId) {
    return nodeComponentConfig.value
  }
  try {
    const widgetConfig = configurationManager.getConfiguration(nodeId)
    return widgetConfig?.component?.properties
  } catch (error) {
    console.error(`[NodeWrapper] 获取节点 ${nodeId} 组件配置失败:`, error)
    return undefined
  }
}

const getNodeInteractionConfigs = (nodeId: string): any[] => {
  if (nodeId === props.nodeId) {
    return nodeInteractionConfigs.value
  }
  try {
    const widgetConfig = configurationManager.getConfiguration(nodeId)
    return widgetConfig?.interaction?.configs || []
  } catch (error) {
    console.error(`[NodeWrapper] 获取节点 ${nodeId} 交互配置失败:`, error)
    return []
  }
}

const getNodeInteractionPermissions = (nodeId: string): any => {
  if (nodeId === props.nodeId) {
    return nodeInteractionPermissions.value
  }
  try {
    const widgetConfig = configurationManager.getConfiguration(nodeId)
    return (
      widgetConfig?.interaction?.permissions || {
        allowExternalControl: true,
        allowedEvents: ['click', 'hover', 'focus', 'blur']
      }
    )
  } catch (error) {
    console.error(`[NodeWrapper] 获取节点 ${nodeId} 交互权限失败:`, error)
    return {
      allowExternalControl: true,
      allowedEvents: ['click', 'hover', 'focus', 'blur']
    }
  }
}

// 🔥 修复递归更新：使用watchEffect来响应配置变化，而不是在computed中调用
watchEffect(() => {
  // 监听props.nodeId变化，触发配置更新
  if (props.nodeId) {
    updateBaseConfig()
    updateAllConfigs()
  }
})

// 标题显示逻辑
const shouldShowTitle = computed(() => {
  return props.forceShowTitle || baseConfig.value.showTitle
})

const displayTitle = computed(() => {
  return baseConfig.value.title || props.node.label || props.node.type || t('config.base.untitledComponent')
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

  // 🔧 外边距配置
  if (config.margin) {
    const { top = 0, right = 0, bottom = 0, left = 0 } = config.margin
    styles.margin = `${top}px ${right}px ${bottom}px ${left}px`
  }

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

  // 添加隐藏状态类，用于样式调整（但不影响事件）
  if (baseConfig.value.visible === false) {
    classes.push('content-hidden')
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
      if (process.env.NODE_ENV === 'development') {
      }
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

// 🔥 修复递归更新：优化Card2配置变更事件处理，避免触发新的计算循环
const handleCard2ConfigChange = (event: CustomEvent) => {
  const { componentId, layer, config } = event.detail
  if (componentId === props.nodeId && layer === 'base') {
    console.log(`🔥 [NodeWrapper] 接收到Card2基础配置变更 ${componentId}:`, config)
    // 🔥 直接更新ref，避免重新调用配置系统
    if (config) {
      baseConfigRef.value = {
        ...defaultBaseConfig,
        ...config
      }
    }
  }
}

// 监听配置管理器的配置变化
onMounted(() => {
  try {
    // 🔥 为Card2组件监听配置变更事件
    if (props.node.metadata?.isCard2Component) {
      window.addEventListener('card2-config-update', handleCard2ConfigChange as EventListener)
      console.log(`🔥 [NodeWrapper] 已为Card2组件 ${props.nodeId} 添加配置监听`)
    }

    // 检查节点是否有配置，如果没有则创建默认配置（仅用于非Card2组件）
    if (!props.node.metadata?.isCard2Component) {
      const existingConfig = configurationManager.getConfiguration(props.nodeId)
      if (!existingConfig) {
        const defaultConfig: WidgetConfiguration = {
          base: {
            showTitle: false,
            title: props.node.label || props.node.type || t('config.base.untitledComponent'),
            opacity: 1,
            visible: true,
            padding: { top: 0, right: 0, bottom: 0, left: 0 },
            margin: { top: 0, right: 0, bottom: 0, left: 0 }
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
    }
  } catch (error) {
    console.error(`[NodeWrapper] 配置监听器添加失败:`, error)
  }
})

onUnmounted(() => {
  // 🔥 清理Card2配置变更事件监听器
  if (props.node.metadata?.isCard2Component) {
    window.removeEventListener('card2-config-update', handleCard2ConfigChange as EventListener)
    console.log(`🔥 [NodeWrapper] 已移除Card2组件 ${props.nodeId} 配置监听`)
  }

  // 清理旧的配置监听器（如果存在）
  if (removeConfigListener) {
    try {
      removeConfigListener()
    } catch (error) {
      console.error(`[NodeWrapper] 移除配置监听器失败:`, error)
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

/* 🔧 内容包装器样式 */
.node-content-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 🔧 隐藏内容时的视觉反馈（编辑模式） */
.node-wrapper.content-hidden:not(.readonly) {
  /* 为编辑模式下的隐藏组件提供视觉提示 */
  background-color: rgba(128, 128, 128, 0.1);
  border: 2px dashed rgba(128, 128, 128, 0.3);
}

.node-wrapper.content-hidden:not(.readonly)::before {
  content: '隐藏';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 10;
  pointer-events: none;
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
