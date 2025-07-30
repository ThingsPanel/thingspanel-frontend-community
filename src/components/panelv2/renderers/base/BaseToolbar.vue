<script setup lang="ts">
// 基础工具栏组件
// Base toolbar component for panel operations

import { ref, computed, inject } from 'vue'
import type { BaseRenderer } from './BaseRenderer'
import type { BaseItem } from './types'

// Props定义
interface Props {
  /** 渲染器实例 */
  renderer?: BaseRenderer
  /** 当前渲染器类型 */
  currentRenderer?: string
  /** 当前模式 */
  currentMode?: string
  /** 选中项目数量 */
  selectedCount?: number
  /** 总项目数量 */
  totalCount?: number
  /** 是否显示调试信息 */
  showDebug?: boolean
  /** 是否显示配置按钮 */
  showConfig?: boolean
  /** 是否显示导入导出 */
  showImportExport?: boolean
  /** 是否显示历史操作 */
  showHistory?: boolean
  /** 是否显示选择操作 */
  showSelection?: boolean
  /** 是否显示模式切换 */
  showModeSwitch?: boolean
  /** 是否显示渲染器切换 */
  showRendererSwitch?: boolean
  /** 自定义工具栏项 */
  customTools?: ToolbarItem[]
  /** 工具栏位置 */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** 是否紧凑模式 */
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  currentRenderer: 'grid',
  currentMode: 'view',
  selectedCount: 0,
  totalCount: 0,
  showDebug: false,
  showConfig: true,
  showImportExport: true,
  showHistory: true,
  showSelection: true,
  showModeSwitch: true,
  showRendererSwitch: false,
  customTools: () => [],
  position: 'top',
  compact: false
})

// Events定义
interface Events {
  /** 配置按钮点击 */
  'config-click': []
  /** 配置面板切换 */
  'config-toggle': []
  /** 导入文件 */
  'import': [data: any]
  /** 导出数据 */
  'export': []
  /** 清空数据 */
  'clear': []
  /** 模式切换 */
  'mode-change': [mode: string]
  /** 渲染器切换 */
  'renderer-change': [renderer: string]
  /** 数据导入 */
  'data-import': [data: any]
  /** 数据导出 */
  'data-export': []
  /** 自定义工具点击 */
  'tool-click': [tool: ToolbarItem]
}

const emit = defineEmits<Events>()

// 工具栏项接口
interface ToolbarItem {
  id: string
  label: string
  icon: string
  action: () => void
  disabled?: boolean
  tooltip?: string
  type?: 'button' | 'dropdown' | 'separator'
  children?: ToolbarItem[]
}

// 响应式状态
const fileInput = ref<HTMLInputElement>()
const showDropdown = ref<string | null>(null)

// 计算属性
const canUndo = computed(() => {
  return props.renderer?.canUndo() ?? false
})

const canRedo = computed(() => {
  return props.renderer?.canRedo() ?? false
})

// 使用props中的值或从渲染器获取
const selectedCount = computed(() => {
  if (props.selectedCount !== undefined) return props.selectedCount
  return props.renderer?.getSelectedItems().length ?? 0
})

const totalCount = computed(() => {
  if (props.totalCount !== undefined) return props.totalCount
  return props.renderer?.getAllItems().length ?? 0
})

const currentMode = computed(() => {
  if (props.currentMode) return props.currentMode
  return props.renderer?.getMode() ?? 'view'
})

const toolbarClasses = computed(() => {
  const base = 'base-toolbar flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg'
  const position = {
    'top': 'flex-row',
    'bottom': 'flex-row',
    'left': 'flex-col',
    'right': 'flex-col'
  }[props.position]
  const spacing = props.compact ? 'gap-1 p-2' : 'gap-2 p-3'
  
  return `${base} ${position} ${spacing}`
})

// 基础工具定义
const baseTools = computed(() => {
  const tools: ToolbarItem[] = []
  
  // 历史操作
  if (props.showHistory) {
    tools.push(
      {
        id: 'undo',
        label: '撤销',
        icon: '↶',
        action: handleUndo,
        disabled: !canUndo.value,
        tooltip: '撤销上一步操作 (Ctrl+Z)'
      },
      {
        id: 'redo',
        label: '重做',
        icon: '↷',
        action: handleRedo,
        disabled: !canRedo.value,
        tooltip: '重做下一步操作 (Ctrl+Y)'
      }
    )
  }
  
  // 分隔符
  if (tools.length > 0) {
    tools.push({ id: 'sep1', label: '', icon: '', action: () => {}, type: 'separator' })
  }
  
  // 选择操作
  if (props.showSelection) {
    tools.push(
      {
        id: 'select-all',
        label: '全选',
        icon: '☑',
        action: handleSelectAll,
        disabled: totalCount.value === 0,
        tooltip: '选择所有项目 (Ctrl+A)'
      },
      {
        id: 'clear-selection',
        label: '取消选择',
        icon: '☐',
        action: handleClearSelection,
        disabled: selectedCount.value === 0,
        tooltip: '清除所有选择 (Esc)'
      },
      {
        id: 'delete-selected',
        label: '删除选中',
        icon: '🗑',
        action: handleDeleteSelected,
        disabled: selectedCount.value === 0,
        tooltip: '删除选中的项目 (Delete)'
      }
    )
  }
  
  // 分隔符
  if (props.showSelection) {
    tools.push({ id: 'sep2', label: '', icon: '', action: () => {}, type: 'separator' })
  }
  
  // 导入导出
  if (props.showImportExport) {
    tools.push(
      {
        id: 'import',
        label: '导入',
        icon: '📁',
        action: handleImport,
        tooltip: '导入配置文件'
      },
      {
        id: 'export',
        label: '导出',
        icon: '💾',
        action: handleExport,
        disabled: totalCount.value === 0,
        tooltip: '导出当前配置'
      },
      {
        id: 'clear',
        label: '清空',
        icon: '🗑',
        action: handleClear,
        disabled: totalCount.value === 0,
        tooltip: '清空所有数据'
      }
    )
  }
  
  // 分隔符
  if (props.showImportExport) {
    tools.push({ id: 'sep3', label: '', icon: '', action: () => {}, type: 'separator' })
  }
  
  // 渲染器切换
  if (props.showRendererSwitch) {
    tools.push({
      id: 'renderer',
      label: `切换到${props.currentRenderer === 'grid' ? 'Canvas' : 'Grid'}`,
    icon: props.currentRenderer === 'grid' ? '🖼️' : '📊',
    action: () => emit('renderer-change'),
    tooltip: `切换到${props.currentRenderer === 'grid' ? 'Canvas' : 'Grid'}渲染器`
    })
  }
  
  // 模式切换
  if (props.showModeSwitch) {
    tools.push({
      id: 'mode',
      label: currentMode.value === 'edit' ? '预览模式' : '编辑模式',
      icon: currentMode.value === 'edit' ? '👁' : '✏',
      action: handleModeToggle,
      tooltip: `切换到${currentMode.value === 'edit' ? '预览' : '编辑'}模式`
    })
  }
  
  // 调试模式
  if (props.showDebug !== undefined) {
    tools.push({
      id: 'debug',
      label: props.showDebug ? '关闭调试' : '开启调试',
      icon: props.showDebug ? '🐞' : '🔍',
      action: handleDebugToggle,
      tooltip: `${props.showDebug ? '关闭' : '开启'}调试模式`
    })
  }
  
  // 配置按钮
  if (props.showConfig) {
    tools.push({
      id: 'config',
      label: '配置',
      icon: '⚙',
      action: handleConfig,
      tooltip: '打开配置面板'
    })
  }
  
  return tools
})

const allTools = computed(() => {
  return [...baseTools.value, ...props.customTools]
})

// 方法
const handleUndo = () => {
  props.renderer?.undo()
}

const handleRedo = () => {
  props.renderer?.redo()
}

const handleSelectAll = () => {
  const allItems = props.renderer?.getAllItems() ?? []
  const allIds = allItems.map(item => item.id)
  props.renderer?.selectItems(allIds)
}

const handleClearSelection = () => {
  props.renderer?.clearSelection()
}

const handleDeleteSelected = () => {
  const selectedItems = props.renderer?.getSelectedItems() ?? []
  if (selectedItems.length > 0 && confirm(`确定要删除 ${selectedItems.length} 个选中的项目吗？`)) {
    selectedItems.forEach(item => {
      props.renderer?.removeItem(item.id)
    })
  }
}

const handleImport = () => {
  fileInput.value?.click()
}

const handleFileImport = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (props.renderer) {
          props.renderer.importData(data)
        }
        emit('import', data)
        emit('data-import', data)
      } catch (error) {
        console.error('导入文件格式错误:', error)
        alert('导入文件格式错误，请检查文件内容')
      }
    }
    reader.readAsText(file)
    // 清空input值，允许重复选择同一文件
    target.value = ''
  }
}

const handleExport = () => {
  let data
  if (props.renderer) {
    data = props.renderer.exportData()
  } else {
    // 如果没有渲染器实例，发出事件让父组件处理
    emit('export')
    emit('data-export')
    return
  }
  
  if (data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `panel-config-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    emit('export')
    emit('data-export')
  }
}

const handleClear = () => {
  if (confirm('确定要清空所有数据吗？此操作不可撤销。')) {
    props.renderer?.clear()
    emit('clear')
  }
}

const handleModeToggle = () => {
  const newMode = currentMode.value === 'edit' ? 'view' : 'edit'
  props.renderer?.setMode(newMode)
  emit('mode-change', newMode)
}

const handleConfig = () => {
  emit('config-click')
  emit('config-toggle')
}

const handleRendererToggle = () => {
  const newRenderer = props.currentRenderer === 'grid' ? 'canvas' : 'grid'
  emit('renderer-change', newRenderer)
}

const handleDebugToggle = () => {
  emit('debug-toggle', !props.showDebug)
}

const handleToolClick = (tool: ToolbarItem) => {
  if (!tool.disabled) {
    tool.action()
    emit('tool-click', tool)
  }
}

const toggleDropdown = (toolId: string) => {
  showDropdown.value = showDropdown.value === toolId ? null : toolId
}

const closeDropdown = () => {
  showDropdown.value = null
}

// 键盘快捷键
const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'z':
        if (event.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
        event.preventDefault()
        break
      case 'y':
        handleRedo()
        event.preventDefault()
        break
      case 'a':
        handleSelectAll()
        event.preventDefault()
        break
    }
  } else if (event.key === 'Escape') {
    handleClearSelection()
    closeDropdown()
  } else if (event.key === 'Delete') {
    handleDeleteSelected()
  }
}

// 生命周期
import { onMounted, onUnmounted } from 'vue'

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('click', closeDropdown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('click', closeDropdown)
})
</script>

<template>
  <div :class="toolbarClasses">
    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInput"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileImport"
    />
    
    <!-- 工具栏项目 -->
    <template v-for="tool in allTools" :key="tool.id">
      <!-- 分隔符 -->
      <div 
        v-if="tool.type === 'separator'"
        class="separator"
        :class="{
          'w-px h-6 bg-gray-300 dark:bg-gray-600': position === 'top' || position === 'bottom',
          'h-px w-6 bg-gray-300 dark:bg-gray-600': position === 'left' || position === 'right'
        }"
      ></div>
      
      <!-- 下拉菜单工具 -->
      <div 
        v-else-if="tool.type === 'dropdown'"
        class="relative"
      >
        <button
          :disabled="tool.disabled"
          :title="tool.tooltip"
          class="toolbar-button"
          :class="{
            'px-3 py-2': !compact,
            'px-2 py-1': compact,
            'opacity-50 cursor-not-allowed': tool.disabled,
            'bg-blue-100 dark:bg-blue-800': showDropdown === tool.id
          }"
          @click="toggleDropdown(tool.id)"
        >
          <span class="tool-icon">{{ tool.icon }}</span>
          <span v-if="!compact" class="tool-label ml-1">{{ tool.label }}</span>
          <span class="dropdown-arrow ml-1">▼</span>
        </button>
        
        <!-- 下拉菜单内容 -->
        <div
          v-if="showDropdown === tool.id"
          class="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 min-w-32"
        >
          <button
            v-for="child in tool.children"
            :key="child.id"
            :disabled="child.disabled"
            class="w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
            :class="{
              'opacity-50 cursor-not-allowed': child.disabled
            }"
            @click="handleToolClick(child)"
          >
            <span class="tool-icon mr-2">{{ child.icon }}</span>
            <span class="tool-label">{{ child.label }}</span>
          </button>
        </div>
      </div>
      
      <!-- 普通按钮工具 -->
      <button
        v-else
        :disabled="tool.disabled"
        :title="tool.tooltip"
        class="toolbar-button flex items-center justify-center bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded transition-colors"
        :class="{
          'px-3 py-2 text-sm': !compact,
          'px-2 py-1 text-xs': compact,
          'opacity-50 cursor-not-allowed': tool.disabled,
          'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300': tool.id === 'mode' && currentMode === 'edit'
        }"
        @click="handleToolClick(tool)"
      >
        <span class="tool-icon">{{ tool.icon }}</span>
        <span v-if="!compact" class="tool-label ml-1">{{ tool.label }}</span>
      </button>
    </template>
    
    <!-- 状态信息 -->
    <div class="toolbar-status ml-auto flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
      <span v-if="selectedCount > 0" class="status-item">
        已选择: {{ selectedCount }}
      </span>
      <span class="status-item">
        总计: {{ totalCount }}
      </span>
      <span class="status-item capitalize">
        {{ currentMode === 'edit' ? '编辑' : '预览' }}模式
      </span>
    </div>
  </div>
</template>

<style scoped>
.base-toolbar {
  user-select: none;
}

.toolbar-button {
  white-space: nowrap;
  min-width: fit-content;
}

.toolbar-button:disabled {
  pointer-events: none;
}

.tool-icon {
  display: inline-block;
  font-style: normal;
  line-height: 1;
}

.tool-label {
  font-weight: 500;
}

.dropdown-arrow {
  font-size: 0.7em;
  transition: transform 0.2s;
}

.status-item {
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0.25rem;
}

.dark .status-item {
  background: rgba(255, 255, 255, 0.05);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .base-toolbar {
    flex-wrap: wrap;
  }
  
  .toolbar-status {
    width: 100%;
    margin-left: 0;
    margin-top: 0.5rem;
    justify-content: center;
  }
}
</style>