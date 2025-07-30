// 基础工具接口和工具集合定义
// Base tool interfaces and tool collection definitions

import type { BaseItem, RenderMode } from './types'
import type { BaseRenderer } from './interfaces'

/** 工具动作参数 */
export interface ToolActionParams {
  [key: string]: any
}

/** 工具状态 */
export interface ToolState {
  /** 是否启用 */
  enabled: boolean
  /** 是否可见 */
  visible: boolean
  /** 是否激活 */
  active?: boolean
  /** 工具提示 */
  tooltip?: string
  /** 扩展状态 */
  [key: string]: any
}

/** 工具接口 */
export interface BaseTool {
  /** 工具ID */
  readonly id: string
  /** 工具名称 */
  readonly name: string
  /** 工具描述 */
  readonly description: string
  /** 工具图标 */
  readonly icon: string
  /** 工具快捷键 */
  readonly shortcut?: string
  /** 工具分组 */
  readonly group?: string

  /** 获取工具状态 */
  getState(renderer: BaseRenderer): ToolState

  /** 执行工具动作 */
  execute(renderer: BaseRenderer, params?: ToolActionParams): void | Promise<void>

  /** 工具是否可用 */
  isAvailable(renderer: BaseRenderer): boolean
}

/** 工具组接口 */
export interface ToolGroup {
  /** 组ID */
  readonly id: string
  /** 组名称 */
  readonly name: string
  /** 组图标 */
  readonly icon?: string
  /** 工具列表 */
  readonly tools: BaseTool[]
}

/** 历史操作工具 */
export class UndoTool implements BaseTool {
  readonly id = 'undo'
  readonly name = '撤销'
  readonly description = '撤销上一步操作'
  readonly icon = 'i-material-symbols:undo'
  readonly shortcut = 'Ctrl+Z'
  readonly group = 'history'

  getState(renderer: BaseRenderer): ToolState {
    return {
      enabled: renderer.canUndo?.() ?? false,
      visible: true,
      tooltip: `${this.name} (${this.shortcut})`
    }
  }

  execute(renderer: BaseRenderer): void {
    renderer.undo?.()
  }

  isAvailable(renderer: BaseRenderer): boolean {
    return typeof renderer.undo === 'function'
  }
}

export class RedoTool implements BaseTool {
  readonly id = 'redo'
  readonly name = '重做'
  readonly description = '重做下一步操作'
  readonly icon = 'i-material-symbols:redo'
  readonly shortcut = 'Ctrl+Y'
  readonly group = 'history'

  getState(renderer: BaseRenderer): ToolState {
    return {
      enabled: renderer.canRedo?.() ?? false,
      visible: true,
      tooltip: `${this.name} (${this.shortcut})`
    }
  }

  execute(renderer: BaseRenderer): void {
    renderer.redo?.()
  }

  isAvailable(renderer: BaseRenderer): boolean {
    return typeof renderer.redo === 'function'
  }
}

/** 选择操作工具 */
export class SelectAllTool implements BaseTool {
  readonly id = 'select-all'
  readonly name = '全选'
  readonly description = '选择所有项目'
  readonly icon = 'i-material-symbols:select-all'
  readonly shortcut = 'Ctrl+A'
  readonly group = 'selection'

  getState(renderer: BaseRenderer): ToolState {
    const itemCount = renderer.getItemCount?.() ?? 0
    return {
      enabled: itemCount > 0,
      visible: true,
      tooltip: `${this.name} (${this.shortcut})`
    }
  }

  execute(renderer: BaseRenderer): void {
    const items = renderer.getAllItems?.() ?? []
    const itemIds = items.map(item => item.id)
    renderer.selectItems(itemIds)
  }

  isAvailable(renderer: BaseRenderer): boolean {
    return typeof renderer.selectItems === 'function' && typeof renderer.getAllItems === 'function'
  }
}

export class ClearSelectionTool implements BaseTool {
  readonly id = 'clear-selection'
  readonly name = '取消选择'
  readonly description = '清除所有选择'
  readonly icon = 'i-material-symbols:deselect'
  readonly shortcut = 'Esc'
  readonly group = 'selection'

  getState(renderer: BaseRenderer): ToolState {
    const selectedCount = renderer.getSelectedCount?.() ?? 0
    return {
      enabled: selectedCount > 0,
      visible: true,
      tooltip: `${this.name} (${this.shortcut})`
    }
  }

  execute(renderer: BaseRenderer): void {
    renderer.clearSelection()
  }

  isAvailable(renderer: BaseRenderer): boolean {
    return typeof renderer.clearSelection === 'function'
  }
}

export class DeleteSelectedTool implements BaseTool {
  readonly id = 'delete-selected'
  readonly name = '删除选中'
  readonly description = '删除选中的项目'
  readonly icon = 'i-material-symbols:delete'
  readonly shortcut = 'Delete'
  readonly group = 'selection'

  getState(renderer: BaseRenderer): ToolState {
    const selectedCount = renderer.getSelectedCount?.() ?? 0
    return {
      enabled: selectedCount > 0,
      visible: true,
      tooltip: `${this.name} (${this.shortcut})`
    }
  }

  execute(renderer: BaseRenderer, params?: ToolActionParams): void {
    const selectedItems = renderer.getSelectedItems?.() ?? []
    if (selectedItems.length === 0) return

    const confirm = params?.skipConfirm || window.confirm(`确定要删除 ${selectedItems.length} 个选中的项目吗？`)

    if (confirm) {
      selectedItems.forEach(item => {
        renderer.removeItem(item.id)
      })
    }
  }

  isAvailable(renderer: BaseRenderer): boolean {
    return typeof renderer.removeItem === 'function' && typeof renderer.getSelectedItems === 'function'
  }
}

/** 数据操作工具 */
export class ImportDataTool implements BaseTool {
  readonly id = 'import-data'
  readonly name = '导入数据'
  readonly description = '从文件导入数据'
  readonly icon = 'i-material-symbols:upload-file'
  readonly group = 'data'

  getState(renderer: BaseRenderer): ToolState {
    return {
      enabled: true,
      visible: true,
      tooltip: this.name
    }
  }

  async execute(renderer: BaseRenderer, params?: ToolActionParams): Promise<void> {
    if (params?.data) {
      // 直接导入数据
      renderer.importData?.(params.data)
    } else {
      // 触发文件选择
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json'

      return new Promise((resolve, reject) => {
        input.onchange = event => {
          const file = (event.target as HTMLInputElement).files?.[0]
          if (file) {
            const reader = new FileReader()
            reader.onload = e => {
              try {
                const data = JSON.parse(e.target?.result as string)
                renderer.importData?.(data)
                resolve()
              } catch (error) {
                console.error('导入文件格式错误:', error)
                reject(error)
              }
            }
            reader.readAsText(file)
          } else {
            resolve()
          }
        }
        input.click()
      })
    }
  }

  isAvailable(renderer: BaseRenderer): boolean {
    return typeof renderer.importData === 'function'
  }
}

export class ExportDataTool implements BaseTool {
  readonly id = 'export-data'
  readonly name = '导出数据'
  readonly description = '导出当前数据到文件'
  readonly icon = 'i-material-symbols:download'
  readonly group = 'data'

  getState(renderer: BaseRenderer): ToolState {
    const itemCount = renderer.getItemCount?.() ?? 0
    return {
      enabled: itemCount > 0,
      visible: true,
      tooltip: this.name
    }
  }

  execute(renderer: BaseRenderer, params?: ToolActionParams): void {
    const data = renderer.exportData?.()
    if (!data) return

    const filename = params?.filename || `panel-config-${new Date().toISOString().slice(0, 10)}.json`

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  isAvailable(renderer: BaseRenderer): boolean {
    return typeof renderer.exportData === 'function'
  }
}

export class ClearAllTool implements BaseTool {
  readonly id = 'clear-all'
  readonly name = '清空所有'
  readonly description = '清空所有数据'
  readonly icon = 'i-material-symbols:clear-all'
  readonly group = 'data'

  getState(renderer: BaseRenderer): ToolState {
    const itemCount = renderer.getItemCount?.() ?? 0
    return {
      enabled: itemCount > 0,
      visible: true,
      tooltip: this.name
    }
  }

  execute(renderer: BaseRenderer, params?: ToolActionParams): void {
    const confirm = params?.skipConfirm || window.confirm('确定要清空所有数据吗？此操作不可撤销。')
    if (confirm) {
      renderer.clearAll?.()
    }
  }

  isAvailable(renderer: BaseRenderer): boolean {
    return typeof renderer.clearAll === 'function'
  }
}

/** 模式切换工具 */
export class ToggleModeTool implements BaseTool {
  readonly id = 'toggle-mode'
  readonly name = '切换模式'
  readonly description = '在编辑模式和预览模式之间切换'
  readonly icon = 'i-material-symbols:swap-horiz'
  readonly group = 'mode'

  getState(renderer: BaseRenderer): ToolState {
    const currentMode = renderer.getMode?.() ?? 'edit'
    return {
      enabled: true,
      visible: true,
      active: currentMode === 'edit',
      tooltip: currentMode === 'edit' ? '切换到预览模式' : '切换到编辑模式'
    }
  }

  execute(renderer: BaseRenderer): void {
    const currentMode = renderer.getMode?.() ?? 'edit'
    const newMode: RenderMode = currentMode === 'edit' ? 'preview' : 'edit'
    renderer.setMode(newMode)
  }

  isAvailable(renderer: BaseRenderer): boolean {
    return typeof renderer.setMode === 'function'
  }
}

/** 刷新工具 */
export class RefreshTool implements BaseTool {
  readonly id = 'refresh'
  readonly name = '刷新'
  readonly description = '刷新渲染器'
  readonly icon = 'i-material-symbols:refresh'
  readonly shortcut = 'F5'
  readonly group = 'view'

  getState(renderer: BaseRenderer): ToolState {
    return {
      enabled: true,
      visible: true,
      tooltip: `${this.name} (${this.shortcut})`
    }
  }

  execute(renderer: BaseRenderer): void {
    renderer.refresh()
  }

  isAvailable(renderer: BaseRenderer): boolean {
    return typeof renderer.refresh === 'function'
  }
}

/** 默认工具集合 */
export const DEFAULT_TOOL_GROUPS: ToolGroup[] = [
  {
    id: 'history',
    name: '历史操作',
    icon: 'i-material-symbols:history',
    tools: [new UndoTool(), new RedoTool()]
  },
  {
    id: 'selection',
    name: '选择操作',
    icon: 'i-material-symbols:select',
    tools: [new SelectAllTool(), new ClearSelectionTool(), new DeleteSelectedTool()]
  },
  {
    id: 'data',
    name: '数据操作',
    icon: 'i-material-symbols:data-object',
    tools: [new ImportDataTool(), new ExportDataTool(), new ClearAllTool()]
  },
  {
    id: 'mode',
    name: '模式切换',
    icon: 'i-material-symbols:toggle-on',
    tools: [new ToggleModeTool()]
  },
  {
    id: 'view',
    name: '视图操作',
    icon: 'i-material-symbols:visibility',
    tools: [new RefreshTool()]
  }
]

/** 工具注册表 */
export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map()
  private groups: Map<string, ToolGroup> = new Map()

  constructor() {
    // 注册默认工具
    this.registerDefaultTools()
  }

  private registerDefaultTools(): void {
    DEFAULT_TOOL_GROUPS.forEach(group => {
      this.groups.set(group.id, group)
      group.tools.forEach(tool => {
        this.tools.set(tool.id, tool)
      })
    })
  }

  /** 注册工具 */
  registerTool(tool: BaseTool): void {
    this.tools.set(tool.id, tool)
  }

  /** 注册工具组 */
  registerGroup(group: ToolGroup): void {
    this.groups.set(group.id, group)
    group.tools.forEach(tool => {
      this.tools.set(tool.id, tool)
    })
  }

  /** 获取工具 */
  getTool(id: string): BaseTool | undefined {
    return this.tools.get(id)
  }

  /** 获取工具组 */
  getGroup(id: string): ToolGroup | undefined {
    return this.groups.get(id)
  }

  /** 获取所有工具 */
  getAllTools(): BaseTool[] {
    return Array.from(this.tools.values())
  }

  /** 获取所有工具组 */
  getAllGroups(): ToolGroup[] {
    return Array.from(this.groups.values())
  }

  /** 获取可用工具 */
  getAvailableTools(renderer: BaseRenderer): BaseTool[] {
    return this.getAllTools().filter(tool => tool.isAvailable(renderer))
  }

  /** 按组获取可用工具 */
  getAvailableToolsByGroup(renderer: BaseRenderer): Map<string, BaseTool[]> {
    const result = new Map<string, BaseTool[]>()

    this.getAllGroups().forEach(group => {
      const availableTools = group.tools.filter(tool => tool.isAvailable(renderer))
      if (availableTools.length > 0) {
        result.set(group.id, availableTools)
      }
    })

    return result
  }

  /** 执行工具 */
  async executeTool(toolId: string, renderer: BaseRenderer, params?: ToolActionParams): Promise<void> {
    const tool = this.getTool(toolId)
    if (!tool) {
      console.warn(`Tool not found: ${toolId}`)
      return
    }

    if (!tool.isAvailable(renderer)) {
      console.warn(`Tool not available: ${toolId}`)
      return
    }

    try {
      await tool.execute(renderer, params)
    } catch (error) {
      console.error(`Failed to execute tool ${toolId}:`, error)
      throw error
    }
  }
}

/** 全局工具注册表实例 */
export const toolRegistry = new ToolRegistry()
