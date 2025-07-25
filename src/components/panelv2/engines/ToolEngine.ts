// 第二层：专业引擎层 - 工具引擎
// 职责：可扩展工具集管理，快捷键系统，工具执行

import { ref, reactive, computed, type Component } from 'vue'

/**
 * 工具类别
 */
export type ToolCategory = 'edit' | 'view' | 'layout' | 'data' | 'export' | 'debug' | 'plugin'

/**
 * 工具结果
 */
export interface ToolResult {
  success: boolean
  message?: string
  data?: any
  error?: Error
}

/**
 * 编辑器上下文（工具执行时的环境）
 */
export interface EditorContext {
  // 数据管道
  dataEngine: any

  // 渲染引擎
  renderEngine: any

  // 布局引擎
  layoutEngine?: any

  // 当前选中的节点
  selectedNodes: any[]

  // 剪贴板
  clipboard: {
    copy(nodes: any[]): void
    paste(): void
    hasContent(): boolean
  }

  // 导出引擎
  exportEngine?: {
    exportAsJSON(): Promise<ToolResult>
    exportAsImage(): Promise<ToolResult>
  }

  // 其他上下文数据
  [key: string]: any
}

/**
 * 快捷键冲突信息
 */
export interface ShortcutConflict {
  key: string
  tools: string[]
}

/**
 * 工具执行记录
 */
export interface ToolExecution {
  toolId: string
  timestamp: number
  context: EditorContext
  result: ToolResult
  duration: number
}

/**
 * 工具定义
 */
export interface ToolDefinition {
  // 基础信息
  id: string
  name: string
  description?: string
  icon: string
  category: ToolCategory
  version: string

  // 快捷键配置
  shortcut?: {
    key: string
    modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[]
    description: string
  }

  // 工具行为
  action: (context: EditorContext) => Promise<ToolResult>

  // 启用条件
  enabled?: (context: EditorContext) => boolean
  visible?: (context: EditorContext) => boolean

  // 工具状态
  hasState?: boolean
  getState?: (context: EditorContext) => any
  setState?: (context: EditorContext, state: any) => void

  // 权限控制
  permissions?: string[]
  roles?: string[]

  // UI配置
  ui: {
    // 工具栏显示配置
    showInToolbar?: boolean
    toolbarGroup?: string
    toolbarOrder?: number
    // 右键菜单显示
    showInContextMenu?: boolean
    contextMenuOrder?: number
    // 自定义UI组件
    customComponent?: Component
  }
}

/**
 * 工具引擎接口
 */
export interface ToolEngine {
  // 工具注册表
  registry: {
    // 预制工具集
    builtInTools: Map<string, ToolDefinition>
    // 自定义工具集
    customTools: Map<string, ToolDefinition>
    // 插件工具集
    pluginTools: Map<string, ToolDefinition>
  }

  // 工具管理
  manager: {
    // 注册工具
    registerTool(tool: ToolDefinition): void
    unregisterTool(toolId: string): void
    // 获取工具
    getTool(toolId: string): ToolDefinition | null
    getToolsByCategory(category: ToolCategory): ToolDefinition[]
    // 工具启用控制（编程时选择）
    enableTool(toolId: string): void
    disableTool(toolId: string): void
    isToolEnabled(toolId: string): boolean
  }

  // 快捷键系统
  shortcuts: {
    // 绑定快捷键
    bindShortcut(key: string, toolId: string): void
    unbindShortcut(key: string): void
    // 快捷键监听
    startListening(): void
    stopListening(): void
    // 快捷键冲突检测
    detectConflicts(): ShortcutConflict[]
  }

  // 工具执行
  executor: {
    // 执行工具
    execute(toolId: string, context: EditorContext): Promise<ToolResult>
    // 批量执行
    executeBatch(toolIds: string[], context: EditorContext): Promise<ToolResult[]>
    // 工具执行历史
    getExecutionHistory(): ToolExecution[]
    clearHistory(): void
  }
}

/**
 * 工具引擎实现
 */
export class PanelToolEngine implements ToolEngine {
  // 工具注册表
  public registry = {
    builtInTools: new Map<string, ToolDefinition>(),
    customTools: new Map<string, ToolDefinition>(),
    pluginTools: new Map<string, ToolDefinition>()
  }

  // 启用/禁用的工具
  private enabledTools = new Set<string>()

  // 快捷键映射
  private shortcutBindings = new Map<string, string>()

  // 快捷键监听状态
  private isListening = false

  // 工具执行历史
  private executionHistory: ToolExecution[] = []
  private maxHistorySize = 100

  constructor() {
    this.initializeBuiltInTools()
  }

  /**
   * 初始化内置工具
   */
  private initializeBuiltInTools() {
    const builtInTools: ToolDefinition[] = [
      // === 编辑类工具 ===
      {
        id: 'undo',
        name: '撤销',
        icon: 'undo',
        category: 'edit',
        version: '1.0.0',
        shortcut: { key: 'z', modifiers: ['ctrl'], description: '撤销上一步操作' },
        action: async ctx => {
          if (ctx.dataEngine?.undo) {
            const result = ctx.dataEngine.undo()
            return { success: !!result, message: result ? '撤销成功' : '没有可撤销的操作' }
          }
          return { success: false, message: '撤销功能不可用' }
        },
        enabled: ctx => ctx.dataEngine?.canUndo?.() || false,
        ui: { showInToolbar: true, toolbarGroup: 'edit', toolbarOrder: 1 }
      },

      {
        id: 'redo',
        name: '重做',
        icon: 'redo',
        category: 'edit',
        version: '1.0.0',
        shortcut: { key: 'y', modifiers: ['ctrl'], description: '重做上一步操作' },
        action: async ctx => {
          if (ctx.dataEngine?.redo) {
            const result = ctx.dataEngine.redo()
            return { success: !!result, message: result ? '重做成功' : '没有可重做的操作' }
          }
          return { success: false, message: '重做功能不可用' }
        },
        enabled: ctx => ctx.dataEngine?.canRedo?.() || false,
        ui: { showInToolbar: true, toolbarGroup: 'edit', toolbarOrder: 2 }
      },

      {
        id: 'copy',
        name: '复制',
        icon: 'copy',
        category: 'edit',
        version: '1.0.0',
        shortcut: { key: 'c', modifiers: ['ctrl'], description: '复制选中的节点' },
        action: async ctx => {
          if (ctx.selectedNodes.length > 0 && ctx.clipboard) {
            ctx.clipboard.copy(ctx.selectedNodes)
            return { success: true, message: `已复制 ${ctx.selectedNodes.length} 个节点` }
          }
          return { success: false, message: '没有选中的节点' }
        },
        enabled: ctx => ctx.selectedNodes.length > 0,
        ui: { showInToolbar: true, showInContextMenu: true }
      },

      {
        id: 'paste',
        name: '粘贴',
        icon: 'paste',
        category: 'edit',
        version: '1.0.0',
        shortcut: { key: 'v', modifiers: ['ctrl'], description: '粘贴复制的节点' },
        action: async ctx => {
          if (ctx.clipboard?.hasContent?.()) {
            ctx.clipboard.paste()
            return { success: true, message: '粘贴成功' }
          }
          return { success: false, message: '剪贴板为空' }
        },
        enabled: ctx => ctx.clipboard?.hasContent?.() || false,
        ui: { showInToolbar: true, showInContextMenu: true }
      },

      {
        id: 'delete',
        name: '删除',
        icon: 'delete',
        category: 'edit',
        version: '1.0.0',
        shortcut: { key: 'Delete', description: '删除选中的节点' },
        action: async ctx => {
          if (ctx.selectedNodes.length > 0 && ctx.renderEngine?.removeNodes) {
            const nodeIds = ctx.selectedNodes.map(n => n.id)
            await ctx.renderEngine.removeNodes(nodeIds)
            return { success: true, message: `已删除 ${nodeIds.length} 个节点` }
          }
          return { success: false, message: '没有选中的节点' }
        },
        enabled: ctx => ctx.selectedNodes.length > 0,
        ui: { showInContextMenu: true }
      },

      // === 布局类工具 ===
      {
        id: 'align-left',
        name: '左对齐',
        icon: 'align-left',
        category: 'layout',
        version: '1.0.0',
        action: async ctx => {
          if (ctx.selectedNodes.length > 1 && ctx.layoutEngine?.alignNodes) {
            await ctx.layoutEngine.alignNodes(ctx.selectedNodes, 'left')
            return { success: true, message: '左对齐完成' }
          }
          return { success: false, message: '需要选中至少2个节点' }
        },
        enabled: ctx => ctx.selectedNodes.length > 1,
        ui: { showInToolbar: true, toolbarGroup: 'layout' }
      },

      {
        id: 'align-center',
        name: '居中对齐',
        icon: 'align-center',
        category: 'layout',
        version: '1.0.0',
        action: async ctx => {
          if (ctx.selectedNodes.length > 1 && ctx.layoutEngine?.alignNodes) {
            await ctx.layoutEngine.alignNodes(ctx.selectedNodes, 'center')
            return { success: true, message: '居中对齐完成' }
          }
          return { success: false, message: '需要选中至少2个节点' }
        },
        enabled: ctx => ctx.selectedNodes.length > 1,
        ui: { showInToolbar: true, toolbarGroup: 'layout' }
      },

      // === 视图类工具 ===
      {
        id: 'zoom-in',
        name: '放大',
        icon: 'zoom-in',
        category: 'view',
        version: '1.0.0',
        shortcut: { key: '=', modifiers: ['ctrl'], description: '放大视图' },
        action: async ctx => {
          if (ctx.renderEngine?.zoomIn) {
            await ctx.renderEngine.zoomIn()
            return { success: true, message: '视图已放大' }
          }
          return { success: false, message: '放大功能不可用' }
        },
        ui: { showInToolbar: true, toolbarGroup: 'view' }
      },

      {
        id: 'zoom-out',
        name: '缩小',
        icon: 'zoom-out',
        category: 'view',
        version: '1.0.0',
        shortcut: { key: '-', modifiers: ['ctrl'], description: '缩小视图' },
        action: async ctx => {
          if (ctx.renderEngine?.zoomOut) {
            await ctx.renderEngine.zoomOut()
            return { success: true, message: '视图已缩小' }
          }
          return { success: false, message: '缩小功能不可用' }
        },
        ui: { showInToolbar: true, toolbarGroup: 'view' }
      },

      {
        id: 'zoom-fit',
        name: '适应画布',
        icon: 'zoom-fit',
        category: 'view',
        version: '1.0.0',
        shortcut: { key: '0', modifiers: ['ctrl'], description: '缩放以适应画布' },
        action: async ctx => {
          if (ctx.renderEngine?.zoomToFit) {
            await ctx.renderEngine.zoomToFit()
            return { success: true, message: '视图已适应画布' }
          }
          return { success: false, message: '适应画布功能不可用' }
        },
        ui: { showInToolbar: true, toolbarGroup: 'view' }
      },

      // === 数据类工具 ===
      {
        id: 'save',
        name: '保存',
        icon: 'save',
        category: 'data',
        version: '1.0.0',
        shortcut: { key: 's', modifiers: ['ctrl'], description: '保存面板配置' },
        action: async ctx => {
          if (ctx.dataEngine?.save) {
            await ctx.dataEngine.save()
            return { success: true, message: '保存成功' }
          }
          return { success: false, message: '保存功能不可用' }
        },
        enabled: ctx => ctx.dataEngine?.isDirty?.() || false,
        ui: { showInToolbar: true, toolbarGroup: 'data', toolbarOrder: 1 }
      },

      {
        id: 'refresh',
        name: '刷新',
        icon: 'refresh',
        category: 'data',
        version: '1.0.0',
        shortcut: { key: 'F5', description: '刷新面板数据' },
        action: async ctx => {
          if (ctx.dataEngine?.reload) {
            await ctx.dataEngine.reload()
            return { success: true, message: '刷新成功' }
          }
          return { success: false, message: '刷新功能不可用' }
        },
        ui: { showInToolbar: true, toolbarGroup: 'data' }
      },

      // === 导出类工具 ===
      {
        id: 'export-json',
        name: '导出JSON',
        icon: 'file-json',
        category: 'export',
        version: '1.0.0',
        action: async ctx => {
          if (ctx.exportEngine?.exportAsJSON) {
            return await ctx.exportEngine.exportAsJSON()
          }
          return { success: false, message: 'JSON导出功能不可用' }
        },
        ui: { showInContextMenu: true }
      },

      {
        id: 'export-image',
        name: '导出图片',
        icon: 'image',
        category: 'export',
        version: '1.0.0',
        action: async ctx => {
          if (ctx.exportEngine?.exportAsImage) {
            return await ctx.exportEngine.exportAsImage()
          }
          return { success: false, message: '图片导出功能不可用' }
        },
        ui: { showInContextMenu: true }
      }
    ]

    // 注册内置工具
    builtInTools.forEach(tool => {
      this.registry.builtInTools.set(tool.id, tool)
      this.enabledTools.add(tool.id)

      // 绑定快捷键
      if (tool.shortcut) {
        const shortcutKey = this.formatShortcutKey(tool.shortcut.key, tool.shortcut.modifiers)
        this.shortcutBindings.set(shortcutKey, tool.id)
      }
    })
  }

  /**
   * 格式化快捷键
   */
  private formatShortcutKey(key: string, modifiers?: string[]): string {
    const parts = []
    if (modifiers) {
      if (modifiers.includes('ctrl')) parts.push('ctrl')
      if (modifiers.includes('alt')) parts.push('alt')
      if (modifiers.includes('shift')) parts.push('shift')
      if (modifiers.includes('meta')) parts.push('meta')
    }
    parts.push(key.toLowerCase())
    return parts.join('+')
  }

  // 工具管理器实现
  public manager = {
    registerTool: (tool: ToolDefinition) => {
      // 根据工具来源确定注册位置
      if (tool.category === 'plugin') {
        this.registry.pluginTools.set(tool.id, tool)
      } else {
        this.registry.customTools.set(tool.id, tool)
      }

      // 默认启用
      this.enabledTools.add(tool.id)

      // 绑定快捷键
      if (tool.shortcut) {
        const shortcutKey = this.formatShortcutKey(tool.shortcut.key, tool.shortcut.modifiers)
        this.shortcuts.bindShortcut(shortcutKey, tool.id)
      }

      console.debug(`工具已注册: ${tool.id}`)
    },

    unregisterTool: (toolId: string) => {
      // 从所有注册表中移除
      this.registry.builtInTools.delete(toolId)
      this.registry.customTools.delete(toolId)
      this.registry.pluginTools.delete(toolId)

      // 从启用列表中移除
      this.enabledTools.delete(toolId)

      // 移除快捷键绑定
      for (const [shortcut, boundToolId] of this.shortcutBindings.entries()) {
        if (boundToolId === toolId) {
          this.shortcutBindings.delete(shortcut)
          break
        }
      }

      console.debug(`工具已注销: ${toolId}`)
    },

    getTool: (toolId: string): ToolDefinition | null => {
      return (
        this.registry.builtInTools.get(toolId) ||
        this.registry.customTools.get(toolId) ||
        this.registry.pluginTools.get(toolId) ||
        null
      )
    },

    getToolsByCategory: (category: ToolCategory): ToolDefinition[] => {
      const tools: ToolDefinition[] = []

      // 收集所有注册表中的工具
      const allTools = [
        ...this.registry.builtInTools.values(),
        ...this.registry.customTools.values(),
        ...this.registry.pluginTools.values()
      ]

      return allTools.filter(tool => tool.category === category && this.enabledTools.has(tool.id))
    },

    enableTool: (toolId: string) => {
      this.enabledTools.add(toolId)
    },

    disableTool: (toolId: string) => {
      this.enabledTools.delete(toolId)
    },

    isToolEnabled: (toolId: string): boolean => {
      return this.enabledTools.has(toolId)
    }
  }

  // 快捷键系统实现
  public shortcuts = {
    bindShortcut: (key: string, toolId: string) => {
      this.shortcutBindings.set(key.toLowerCase(), toolId)
    },

    unbindShortcut: (key: string) => {
      this.shortcutBindings.delete(key.toLowerCase())
    },

    startListening: () => {
      if (this.isListening) return

      this.isListening = true
      document.addEventListener('keydown', this.handleKeyDown)
      console.debug('快捷键监听已启动')
    },

    stopListening: () => {
      if (!this.isListening) return

      this.isListening = false
      document.removeEventListener('keydown', this.handleKeyDown)
      console.debug('快捷键监听已停止')
    },

    detectConflicts: (): ShortcutConflict[] => {
      const conflicts: ShortcutConflict[] = []
      const keyMap = new Map<string, string[]>()

      // 收集所有快捷键绑定
      for (const [key, toolId] of this.shortcutBindings.entries()) {
        if (!keyMap.has(key)) {
          keyMap.set(key, [])
        }
        keyMap.get(key)!.push(toolId)
      }

      // 找出冲突
      for (const [key, toolIds] of keyMap.entries()) {
        if (toolIds.length > 1) {
          conflicts.push({ key, tools: toolIds })
        }
      }

      return conflicts
    }
  }

  // 快捷键处理函数
  private handleKeyDown = async (event: KeyboardEvent) => {
    // 忽略在输入框中的按键
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
      return
    }

    // 构建快捷键字符串
    const parts = []
    if (event.ctrlKey) parts.push('ctrl')
    if (event.altKey) parts.push('alt')
    if (event.shiftKey) parts.push('shift')
    if (event.metaKey) parts.push('meta')
    parts.push(event.key.toLowerCase())

    const shortcutKey = parts.join('+')
    const toolId = this.shortcutBindings.get(shortcutKey)

    if (toolId && this.enabledTools.has(toolId)) {
      event.preventDefault()
      event.stopPropagation()

      // 这里需要获取当前的编辑器上下文，暂时用空对象占位
      const context: EditorContext = this.getCurrentContext()
      await this.executor.execute(toolId, context)
    }
  }

  // 获取当前编辑器上下文（需要从外部注入）
  private contextProvider?: () => EditorContext

  public setContextProvider(provider: () => EditorContext) {
    this.contextProvider = provider
  }

  private getCurrentContext(): EditorContext {
    if (this.contextProvider) {
      return this.contextProvider()
    }

    // 返回默认上下文
    return {
      dataEngine: null,
      renderEngine: null,
      selectedNodes: [],
      clipboard: {
        copy: () => {},
        paste: () => {},
        hasContent: () => false
      }
    }
  }

  // 工具执行器实现
  public executor = {
    execute: async (toolId: string, context: EditorContext): Promise<ToolResult> => {
      const tool = this.manager.getTool(toolId)
      if (!tool) {
        return { success: false, message: `工具不存在: ${toolId}` }
      }

      if (!this.manager.isToolEnabled(toolId)) {
        return { success: false, message: `工具已禁用: ${toolId}` }
      }

      // 检查工具是否可用
      if (tool.enabled && !tool.enabled(context)) {
        return { success: false, message: `工具当前不可用: ${tool.name}` }
      }

      const startTime = performance.now()

      try {
        const result = await tool.action(context)
        const endTime = performance.now()

        // 记录执行历史
        const execution: ToolExecution = {
          toolId,
          timestamp: Date.now(),
          context,
          result,
          duration: endTime - startTime
        }

        this.executionHistory.push(execution)

        // 限制历史记录数量
        if (this.executionHistory.length > this.maxHistorySize) {
          this.executionHistory.shift()
        }

        console.debug(`工具执行完成: ${toolId}`, result)
        return result
      } catch (error) {
        const endTime = performance.now()

        const failureResult: ToolResult = {
          success: false,
          message: `工具执行失败: ${error instanceof Error ? error.message : String(error)}`,
          error: error instanceof Error ? error : new Error(String(error))
        }

        // 记录失败的执行
        const execution: ToolExecution = {
          toolId,
          timestamp: Date.now(),
          context,
          result: failureResult,
          duration: endTime - startTime
        }

        this.executionHistory.push(execution)

        console.error(`工具执行失败: ${toolId}`, error)
        return failureResult
      }
    },

    executeBatch: async (toolIds: string[], context: EditorContext): Promise<ToolResult[]> => {
      const results: ToolResult[] = []

      for (const toolId of toolIds) {
        const result = await this.executor.execute(toolId, context)
        results.push(result)

        // 如果有工具执行失败，可以选择是否继续
        if (!result.success) {
          console.warn(`批量执行中断，工具 ${toolId} 执行失败`)
          // break // 可选择是否中断
        }
      }

      return results
    },

    getExecutionHistory: (): ToolExecution[] => {
      return [...this.executionHistory]
    },

    clearHistory: () => {
      this.executionHistory.length = 0
    }
  }

  /**
   * 获取所有工具
   */
  public getAllTools(): ToolDefinition[] {
    return [
      ...this.registry.builtInTools.values(),
      ...this.registry.customTools.values(),
      ...this.registry.pluginTools.values()
    ].filter(tool => this.enabledTools.has(tool.id))
  }

  /**
   * 获取工具栏工具
   */
  public getToolbarTools(): ToolDefinition[] {
    return this.getAllTools()
      .filter(tool => tool.ui.showInToolbar)
      .sort((a, b) => {
        // 按组和顺序排序
        const groupA = a.ui.toolbarGroup || 'default'
        const groupB = b.ui.toolbarGroup || 'default'
        if (groupA !== groupB) {
          return groupA.localeCompare(groupB)
        }
        return (a.ui.toolbarOrder || 999) - (b.ui.toolbarOrder || 999)
      })
  }

  /**
   * 获取右键菜单工具
   */
  public getContextMenuTools(): ToolDefinition[] {
    return this.getAllTools()
      .filter(tool => tool.ui.showInContextMenu)
      .sort((a, b) => (a.ui.contextMenuOrder || 999) - (b.ui.contextMenuOrder || 999))
  }

  /**
   * 销毁工具引擎
   */
  public destroy() {
    this.shortcuts.stopListening()
    this.registry.builtInTools.clear()
    this.registry.customTools.clear()
    this.registry.pluginTools.clear()
    this.enabledTools.clear()
    this.shortcutBindings.clear()
    this.executionHistory.length = 0
  }
}

/**
 * 创建工具引擎实例
 */
export function createToolEngine(): PanelToolEngine {
  return new PanelToolEngine()
}
