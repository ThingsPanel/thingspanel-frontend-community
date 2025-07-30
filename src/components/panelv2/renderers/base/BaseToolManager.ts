// 基础工具管理器 - 统一管理工具和提供工具栏接口
// Base tool manager - Unified tool management and toolbar interface

import type { BaseRenderer } from './interfaces'
import type { RenderMode } from './types'
import {
  type BaseTool,
  type ToolGroup,
  type ToolState,
  type ToolActionParams,
  toolRegistry,
  ToolRegistry
} from './BaseTool'

/** 工具栏配置 */
export interface ToolbarConfig {
  /** 显示的工具组 */
  groups?: string[]
  /** 显示的工具ID */
  tools?: string[]
  /** 隐藏的工具ID */
  hiddenTools?: string[]
  /** 是否紧凑模式 */
  compact?: boolean
  /** 工具栏位置 */
  position?: 'top' | 'bottom' | 'left' | 'right'
  /** 是否显示分组分隔符 */
  showGroupSeparator?: boolean
  /** 是否显示状态信息 */
  showStatus?: boolean
}

/** 工具栏项目数据 */
export interface ToolbarItem {
  /** 工具ID */
  id: string
  /** 显示名称 */
  name: string
  /** 图标 */
  icon: string
  /** 工具状态 */
  state: ToolState
  /** 工具组ID */
  group?: string
  /** 快捷键 */
  shortcut?: string
  /** 是否为分隔符 */
  isSeparator?: boolean
}

/** 工具栏状态信息 */
export interface ToolbarStatus {
  /** 选中项目数量 */
  selectedCount: number
  /** 总项目数量 */
  totalCount: number
  /** 当前模式 */
  currentMode: RenderMode
  /** 是否可撤销 */
  canUndo: boolean
  /** 是否可重做 */
  canRedo: boolean
  /** 渲染器名称 */
  rendererName: string
}

/** 工具执行结果 */
export interface ToolExecutionResult {
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  error?: string
  /** 返回数据 */
  data?: any
}

/** 基础工具管理器 */
export class BaseToolManager {
  private renderer: BaseRenderer | null = null
  private toolRegistry: ToolRegistry
  private config: ToolbarConfig
  private eventCallbacks: Map<string, (() => void)[]> = new Map()

  constructor(config: ToolbarConfig = {}, customRegistry?: ToolRegistry) {
    this.config = {
      groups: ['history', 'selection', 'data', 'mode', 'view'],
      compact: false,
      position: 'top',
      showGroupSeparator: true,
      showStatus: true,
      ...config
    }
    this.toolRegistry = customRegistry || toolRegistry
  }

  /** 设置渲染器 */
  setRenderer(renderer: BaseRenderer): void {
    this.renderer = renderer
    this.emit('renderer-changed', renderer)
  }

  /** 获取当前渲染器 */
  getRenderer(): BaseRenderer | null {
    return this.renderer
  }

  /** 更新配置 */
  updateConfig(config: Partial<ToolbarConfig>): void {
    this.config = { ...this.config, ...config }
    this.emit('config-changed', this.config)
  }

  /** 获取配置 */
  getConfig(): ToolbarConfig {
    return { ...this.config }
  }

  /** 获取工具栏项目列表 */
  getToolbarItems(): ToolbarItem[] {
    if (!this.renderer) {
      return []
    }

    const items: ToolbarItem[] = []
    const processedGroups = new Set<string>()

    // 按配置的组顺序处理
    if (this.config.groups) {
      this.config.groups.forEach(groupId => {
        const group = this.toolRegistry.getGroup(groupId)
        if (group && !processedGroups.has(groupId)) {
          this.addGroupItems(items, group, processedGroups)
        }
      })
    }

    // 处理单独指定的工具
    if (this.config.tools) {
      if (items.length > 0 && this.config.showGroupSeparator) {
        items.push(this.createSeparator('custom-tools'))
      }

      this.config.tools.forEach(toolId => {
        const tool = this.toolRegistry.getTool(toolId)
        if (tool && tool.isAvailable(this.renderer!) && !this.isToolHidden(toolId)) {
          const item = this.createToolbarItem(tool)
          if (item) {
            items.push(item)
          }
        }
      })
    }

    return items
  }

  private addGroupItems(items: ToolbarItem[], group: ToolGroup, processedGroups: Set<string>): void {
    if (!this.renderer) return

    const availableTools = group.tools.filter(tool => tool.isAvailable(this.renderer!) && !this.isToolHidden(tool.id))

    if (availableTools.length === 0) return

    // 添加分组分隔符
    if (items.length > 0 && this.config.showGroupSeparator) {
      items.push(this.createSeparator(group.id))
    }

    // 添加工具项目
    availableTools.forEach(tool => {
      const item = this.createToolbarItem(tool)
      if (item) {
        items.push(item)
      }
    })

    processedGroups.add(group.id)
  }

  private createToolbarItem(tool: BaseTool): ToolbarItem | null {
    if (!this.renderer) return null

    const state = tool.getState(this.renderer)
    return {
      id: tool.id,
      name: tool.name,
      icon: tool.icon,
      state,
      group: tool.group,
      shortcut: tool.shortcut,
      isSeparator: false
    }
  }

  private createSeparator(groupId: string): ToolbarItem {
    return {
      id: `separator-${groupId}`,
      name: '',
      icon: '',
      state: { enabled: false, visible: true },
      isSeparator: true
    }
  }

  private isToolHidden(toolId: string): boolean {
    return this.config.hiddenTools?.includes(toolId) ?? false
  }

  /** 获取工具栏状态信息 */
  getToolbarStatus(): ToolbarStatus | null {
    if (!this.renderer) return null

    return {
      selectedCount: this.renderer.getSelectedCount?.() ?? 0,
      totalCount: this.renderer.getItemCount?.() ?? 0,
      currentMode: this.renderer.getMode?.() ?? 'edit',
      canUndo: this.renderer.canUndo?.() ?? false,
      canRedo: this.renderer.canRedo?.() ?? false,
      rendererName: this.renderer.name
    }
  }

  /** 执行工具 */
  async executeTool(toolId: string, params?: ToolActionParams): Promise<ToolExecutionResult> {
    if (!this.renderer) {
      return {
        success: false,
        error: 'No renderer available'
      }
    }

    try {
      const result = await this.toolRegistry.executeTool(toolId, this.renderer, params)

      this.emit('tool-executed', { toolId, params, result })

      return {
        success: true,
        data: result
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)

      this.emit('tool-execution-failed', { toolId, params, error: errorMessage })

      return {
        success: false,
        error: errorMessage
      }
    }
  }

  /** 批量执行工具 */
  async executeTools(commands: Array<{ toolId: string; params?: ToolActionParams }>): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = []

    for (const command of commands) {
      const result = await this.executeTool(command.toolId, command.params)
      results.push(result)

      // 如果执行失败，停止后续执行
      if (!result.success) {
        break
      }
    }

    return results
  }

  /** 检查工具是否可用 */
  isToolAvailable(toolId: string): boolean {
    if (!this.renderer) return false

    const tool = this.toolRegistry.getTool(toolId)
    return tool ? tool.isAvailable(this.renderer) : false
  }

  /** 获取工具状态 */
  getToolState(toolId: string): ToolState | null {
    if (!this.renderer) return null

    const tool = this.toolRegistry.getTool(toolId)
    return tool ? tool.getState(this.renderer) : null
  }

  /** 注册自定义工具 */
  registerTool(tool: BaseTool): void {
    this.toolRegistry.registerTool(tool)
    this.emit('tool-registered', tool)
  }

  /** 注册工具组 */
  registerToolGroup(group: ToolGroup): void {
    this.toolRegistry.registerGroup(group)
    this.emit('group-registered', group)
  }

  /** 处理键盘快捷键 */
  handleKeyboard(event: KeyboardEvent): boolean {
    if (!this.renderer) return false

    const shortcut = this.getShortcutString(event)
    const tools = this.toolRegistry.getAllTools()

    for (const tool of tools) {
      if (tool.shortcut === shortcut && tool.isAvailable(this.renderer)) {
        event.preventDefault()
        this.executeTool(tool.id)
        return true
      }
    }

    return false
  }

  private getShortcutString(event: KeyboardEvent): string {
    const parts: string[] = []

    if (event.ctrlKey || event.metaKey) parts.push('Ctrl')
    if (event.shiftKey) parts.push('Shift')
    if (event.altKey) parts.push('Alt')

    if (event.key !== 'Control' && event.key !== 'Shift' && event.key !== 'Alt' && event.key !== 'Meta') {
      parts.push(event.key.toUpperCase())
    }

    return parts.join('+')
  }

  /** 事件管理 */
  on(event: string, callback: () => void): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, [])
    }
    this.eventCallbacks.get(event)!.push(callback)
  }

  off(event: string, callback?: () => void): void {
    if (!callback) {
      this.eventCallbacks.delete(event)
      return
    }

    const callbacks = this.eventCallbacks.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.eventCallbacks.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error)
        }
      })
    }
  }

  /** 获取可用的工具组 */
  getAvailableGroups(): ToolGroup[] {
    if (!this.renderer) return []

    return this.toolRegistry.getAllGroups().filter(group => group.tools.some(tool => tool.isAvailable(this.renderer!)))
  }

  /** 导出工具栏配置 */
  exportConfig(): any {
    return {
      config: this.config,
      toolStates: this.getToolStates()
    }
  }

  /** 导入工具栏配置 */
  importConfig(configData: any): void {
    if (configData.config) {
      this.updateConfig(configData.config)
    }

    this.emit('config-imported', configData)
  }

  private getToolStates(): Record<string, ToolState> {
    if (!this.renderer) return {}

    const states: Record<string, ToolState> = {}
    const tools = this.toolRegistry.getAllTools()

    tools.forEach(tool => {
      if (tool.isAvailable(this.renderer!)) {
        states[tool.id] = tool.getState(this.renderer!)
      }
    })

    return states
  }

  /** 清理资源 */
  destroy(): void {
    this.renderer = null
    this.eventCallbacks.clear()
    this.emit('destroyed')
  }
}

/** 创建默认工具管理器 */
export function createToolManager(config?: ToolbarConfig): BaseToolManager {
  return new BaseToolManager(config)
}

/** 全局工具管理器实例 */
export const defaultToolManager = createToolManager()
