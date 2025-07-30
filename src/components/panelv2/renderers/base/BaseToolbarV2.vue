<script setup lang="ts">
// 基础工具栏组件V2 - 使用BaseToolManager的轻量级工具栏
// Base toolbar component V2 - Lightweight toolbar using BaseToolManager

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { BaseRenderer } from './interfaces'
import { 
  BaseToolManager, 
  createToolManager,
  type ToolbarConfig,
  type ToolbarItem,
  type ToolbarStatus 
} from './BaseToolManager'
import type { ToolActionParams } from './BaseTool'

// Props定义
interface Props {
  /** 渲染器实例 */
  renderer?: BaseRenderer
  /** 工具栏配置 */
  config?: ToolbarConfig
  /** 是否自动设置键盘监听 */
  enableKeyboard?: boolean
  /** 自定义CSS类 */
  customClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  enableKeyboard: true,
  customClass: ''
})

// Events定义
interface Events {
  /** 工具执行事件 */
  'tool-execute': [toolId: string, params?: ToolActionParams]
  /** 工具执行完成事件 */
  'tool-executed': [toolId: string, success: boolean, result?: any]
  /** 配置变更事件 */
  'config-change': [config: ToolbarConfig]
}

const emit = defineEmits<Events>()

// 响应式状态
const toolManager = ref<BaseToolManager>()
const toolbarItems = ref<ToolbarItem[]>([])
const toolbarStatus = ref<ToolbarStatus | null>(null)
const isExecuting = ref<Set<string>>(new Set())

// 计算属性
const toolbarClasses = computed(() => {
  const config = toolManager.value?.getConfig()
  const base = 'base-toolbar-v2 flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm'
  
  const position = {
    'top': 'flex-row',
    'bottom': 'flex-row',
    'left': 'flex-col',
    'right': 'flex-col'
  }[config?.position || 'top']
  
  const spacing = config?.compact ? 'gap-1 p-2' : 'gap-2 p-3'
  
  return `${base} ${position} ${spacing} ${props.customClass}`
})

const statusText = computed(() => {
  if (!toolbarStatus.value) return ''
  
  const { selectedCount, totalCount, currentMode } = toolbarStatus.value
  const parts = []
  
  if (selectedCount > 0) {
    parts.push(`已选择: ${selectedCount}`)
  }
  
  parts.push(`总计: ${totalCount}`)
  parts.push(`${currentMode === 'edit' ? '编辑' : '预览'}模式`)
  
  return parts.join(' | ')
})

// 方法
const initializeToolManager = () => {
  toolManager.value = createToolManager(props.config)
  
  // 设置事件监听
  toolManager.value.on('tool-executed', handleToolExecuted)
  toolManager.value.on('config-changed', handleConfigChanged)
  
  // 设置渲染器
  if (props.renderer) {
    toolManager.value.setRenderer(props.renderer)
  }
  
  updateToolbarData()
}

const updateToolbarData = () => {
  if (!toolManager.value) return
  
  toolbarItems.value = toolManager.value.getToolbarItems()
  toolbarStatus.value = toolManager.value.getToolbarStatus()
}

const handleToolClick = async (item: ToolbarItem) => {
  if (!toolManager.value || item.isSeparator || !item.state.enabled || isExecuting.value.has(item.id)) {
    return
  }
  
  try {
    isExecuting.value.add(item.id)
    emit('tool-execute', item.id)
    
    const result = await toolManager.value.executeTool(item.id)
    
    emit('tool-executed', item.id, result.success, result.data)
    
    // 更新工具栏数据
    updateToolbarData()
    
  } catch (error) {
    console.error(`Failed to execute tool ${item.id}:`, error)
    emit('tool-executed', item.id, false, error)
  } finally {
    isExecuting.value.delete(item.id)
  }
}

const handleToolExecuted = (data: any) => {
  // 工具执行后的处理
  updateToolbarData()
}

const handleConfigChanged = (config: ToolbarConfig) => {
  emit('config-change', config)
  updateToolbarData()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!props.enableKeyboard || !toolManager.value) return
  
  const handled = toolManager.value.handleKeyboard(event)
  if (handled) {
    updateToolbarData()
  }
}

const getToolIcon = (icon: string): string => {
  // 处理UnoCSS图标类
  if (icon.startsWith('i-')) {
    return icon
  }
  
  // 处理emoji图标
  return icon
}

const isToolExecuting = (toolId: string): boolean => {
  return isExecuting.value.has(toolId)
}

// 监听器
watch(() => props.renderer, (newRenderer) => {
  if (toolManager.value && newRenderer) {
    toolManager.value.setRenderer(newRenderer)
    updateToolbarData()
  }
}, { immediate: false })

watch(() => props.config, (newConfig) => {
  if (toolManager.value && newConfig) {
    toolManager.value.updateConfig(newConfig)
  }
}, { deep: true })

// 生命周期
onMounted(() => {
  initializeToolManager()
  
  if (props.enableKeyboard) {
    document.addEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  if (props.enableKeyboard) {
    document.removeEventListener('keydown', handleKeydown)
  }
  
  toolManager.value?.destroy()
})

// 暴露方法给父组件
defineExpose({
  toolManager: () => toolManager.value,
  executeTool: (toolId: string, params?: ToolActionParams) => toolManager.value?.executeTool(toolId, params),
  updateConfig: (config: Partial<ToolbarConfig>) => toolManager.value?.updateConfig(config),
  refresh: updateToolbarData
})
</script>

<template>
  <div :class="toolbarClasses">
    <!-- 工具按钮 -->
    <template v-for="item in toolbarItems" :key="item.id">
      <!-- 分隔符 -->
      <div 
        v-if="item.isSeparator"
        class="toolbar-separator"
        :class="{
          'w-px h-6 bg-gray-300 dark:bg-gray-600': true
        }"
      />
      
      <!-- 工具按钮 -->
      <button
        v-else
        :disabled="!item.state.enabled || isToolExecuting(item.id)"
        :title="item.state.tooltip || item.name"
        class="toolbar-button relative flex items-center justify-center bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded transition-all duration-200"
        :class="{
          'px-3 py-2 text-sm min-w-8': !toolManager?.getConfig().compact,
          'px-2 py-1 text-xs min-w-6': toolManager?.getConfig().compact,
          'opacity-50 cursor-not-allowed': !item.state.enabled,
          'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300': item.state.active,
          'animate-pulse': isToolExecuting(item.id)
        }"
        @click="handleToolClick(item)"
      >
        <!-- 图标 -->
        <span 
          v-if="item.icon.startsWith('i-')"
          :class="[item.icon, 'text-base']"
        />
        <span 
          v-else
          class="tool-icon text-base"
        >
          {{ item.icon }}
        </span>
        
        <!-- 文本标签 -->
        <span 
          v-if="!toolManager?.getConfig().compact" 
          class="tool-label ml-1 font-medium"
        >
          {{ item.name }}
        </span>
        
        <!-- 执行中指示器 -->
        <div
          v-if="isToolExecuting(item.id)"
          class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-800/50 rounded"
        >
          <div class="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </button>
    </template>
    
    <!-- 状态信息 -->
    <div 
      v-if="toolManager?.getConfig().showStatus && statusText"
      class="toolbar-status ml-auto flex items-center text-xs text-gray-500 dark:text-gray-400"
    >
      <div class="status-text px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
        {{ statusText }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.base-toolbar-v2 {
  user-select: none;
  min-height: 40px;
}

.toolbar-button {
  white-space: nowrap;
  position: relative;
  overflow: hidden;
}

.toolbar-button:disabled {
  pointer-events: none;
}

.toolbar-button:not(:disabled):hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-button:not(:disabled):active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.tool-icon {
  display: inline-block;
  font-style: normal;
  line-height: 1;
}

.tool-label {
  font-weight: 500;
  white-space: nowrap;
}

.toolbar-separator {
  flex-shrink: 0;
}

.status-text {
  font-family: var(--font-mono, 'Monaco', 'Menlo', 'Ubuntu Mono', monospace);
  font-size: 0.75rem;
  letter-spacing: 0.025em;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .base-toolbar-v2 {
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .toolbar-status {
    width: 100%;
    margin-left: 0;
    margin-top: 0.5rem;
    justify-content: center;
  }
  
  .tool-label {
    display: none;
  }
}

/* 深色模式优化 */
.dark .toolbar-button:hover {
  box-shadow: 0 2px 4px rgba(255, 255, 255, 0.1);
}
</style>