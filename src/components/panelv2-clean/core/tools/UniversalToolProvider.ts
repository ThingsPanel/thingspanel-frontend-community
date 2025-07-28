/**
 * @file 通用工具提供者
 * @description 第一层通用工具 - 与渲染器无关的基础工具
 */

import { reactive, ref } from 'vue'
import type {
  ToolProvider,
  ToolDefinition
} from './interfaces/PureInfrastructure'

/**
 * 通用工具类型
 */
export interface UniversalTool extends ToolDefinition {
  category: 'file' | 'edit' | 'view' | 'help'
  handler: (context: ToolActionContext) => Promise<void> | void
}

/**
 * 工具操作上下文
 */
export interface ToolActionContext {
  source: string
  payload?: any
  metadata?: Record<string, any>
}

/**
 * 通用工具提供者实现
 */
export class UniversalToolProvider implements ToolProvider {
  /** 工具注册表 */
  private tools = new Map<string, UniversalTool>()
  
  /** 工具状态 */
  private toolStates = reactive<Record<string, any>>({})
  
  /** 快捷键映射 */
  private shortcuts = new Map<string, string>()

  constructor() {
    console.log('UniversalToolProvider: 通用工具提供者已初始化')
    this.registerBuiltInTools()
    this.setupShortcuts()
  }

  /**
   * 获取工具列表
   */
  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(tool => ({
      id: tool.id,
      name: tool.name,
      icon: tool.icon,
      type: tool.type,
      action: tool.action,
      enabled: tool.enabled,
      active: tool.active,
      options: tool.options,
      shortcut: tool.shortcut
    }))
  }

  /**
   * 处理工具动作
   */
  async handleAction(action: string, context: ToolActionContext): Promise<void> {
    try {
      const tool = this.findToolByAction(action)
      if (!tool) {
        console.warn(`UniversalToolProvider: 未找到动作 ${action} 对应的工具`)
        return
      }
      
      if (!tool.enabled) {
        console.warn(`UniversalToolProvider: 工具 ${tool.id} 已禁用`)
        return
      }
      
      console.log(`UniversalToolProvider: 执行工具动作 ${action}`)
      await tool.handler(context)
      
    } catch (error) {
      console.error(`UniversalToolProvider: 执行工具动作 ${action} 失败`, error)
    }
  }

  /**
   * 注册工具
   */
  registerTool(tool: UniversalTool): void {
    this.tools.set(tool.id, tool)
    this.toolStates[tool.id] = {
      enabled: tool.enabled,
      active: tool.active || false
    }
    
    if (tool.shortcut) {
      this.shortcuts.set(tool.shortcut, tool.id)
    }
    
    console.log(`UniversalToolProvider: 工具 ${tool.id} 注册成功`)
  }

  /**
   * 启用/禁用工具
   */
  setToolEnabled(toolId: string, enabled: boolean): void {
    const tool = this.tools.get(toolId)
    if (tool) {
      tool.enabled = enabled
      this.toolStates[toolId].enabled = enabled
      console.log(`UniversalToolProvider: 工具 ${toolId} ${enabled ? '已启用' : '已禁用'}`)
    }
  }

  /**
   * 设置工具活跃状态
   */
  setToolActive(toolId: string, active: boolean): void {
    const tool = this.tools.get(toolId)
    if (tool) {
      tool.active = active
      this.toolStates[toolId].active = active
      console.log(`UniversalToolProvider: 工具 ${toolId} ${active ? '已激活' : '已取消激活'}`)
    }
  }

  /**
   * 获取工具状态
   */
  getToolState(toolId: string): any {
    return this.toolStates[toolId]
  }

  // ==================== 私有方法 ====================

  /**
   * 注册内置工具
   */
  private registerBuiltInTools(): void {
    // 文件操作工具
    this.registerTool({
      id: 'file-new',
      name: '新建',
      icon: '📄',
      type: 'button',
      action: 'file.new',
      category: 'file',
      enabled: true,
      shortcut: 'Ctrl+N',
      handler: this.handleFileNew.bind(this)
    })

    this.registerTool({
      id: 'file-open',
      name: '打开',
      icon: '📂',
      type: 'button',
      action: 'file.open',
      category: 'file',
      enabled: true,
      shortcut: 'Ctrl+O',
      handler: this.handleFileOpen.bind(this)
    })

    this.registerTool({
      id: 'file-save',
      name: '保存',
      icon: '💾',
      type: 'button',
      action: 'file.save',
      category: 'file',
      enabled: true,
      shortcut: 'Ctrl+S',
      handler: this.handleFileSave.bind(this)
    })

    this.registerTool({
      id: 'file-export',
      name: '导出',
      icon: '📤',
      type: 'dropdown',
      action: 'file.export',
      category: 'file',
      enabled: true,
      options: ['JSON', 'YAML', 'XML'],
      handler: this.handleFileExport.bind(this)
    })

    this.registerTool({
      id: 'file-import',
      name: '导入',
      icon: '📥',
      type: 'button',
      action: 'file.import',
      category: 'file',
      enabled: true,
      handler: this.handleFileImport.bind(this)
    })

    // 编辑工具
    this.registerTool({
      id: 'edit-undo',
      name: '撤销',
      icon: '↶',
      type: 'button',
      action: 'edit.undo',
      category: 'edit',
      enabled: true,
      shortcut: 'Ctrl+Z',
      handler: this.handleEditUndo.bind(this)
    })

    this.registerTool({
      id: 'edit-redo',
      name: '重做',
      icon: '↷',
      type: 'button',
      action: 'edit.redo',
      category: 'edit',
      enabled: true,
      shortcut: 'Ctrl+Y',
      handler: this.handleEditRedo.bind(this)
    })

    this.registerTool({
      id: 'edit-clear',
      name: '清空',
      icon: '🗑️',
      type: 'button',
      action: 'edit.clear',
      category: 'edit',
      enabled: true,
      handler: this.handleEditClear.bind(this)
    })

    // 视图工具
    this.registerTool({
      id: 'view-fullscreen',
      name: '全屏',
      icon: '⛶',
      type: 'toggle',
      action: 'view.fullscreen',
      category: 'view',
      enabled: true,
      shortcut: 'F11',
      handler: this.handleViewFullscreen.bind(this)
    })

    this.registerTool({
      id: 'view-sidebar',
      name: '侧边栏',
      icon: '☰',
      type: 'toggle',
      action: 'view.sidebar',
      category: 'view',
      enabled: true,
      shortcut: 'Ctrl+1',
      handler: this.handleViewSidebar.bind(this)
    })

    this.registerTool({
      id: 'view-inspector',
      name: '检查器',
      icon: '🔍',
      type: 'toggle',
      action: 'view.inspector',
      category: 'view',
      enabled: true,
      shortcut: 'Ctrl+2',
      handler: this.handleViewInspector.bind(this)
    })

    console.log('UniversalToolProvider: 内置工具注册完成')
  }

  /**
   * 设置快捷键
   */
  private setupShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      const shortcut = this.getShortcutString(e)
      const toolId = this.shortcuts.get(shortcut)
      
      if (toolId) {
        const tool = this.tools.get(toolId)
        if (tool && tool.enabled) {
          e.preventDefault()
          this.handleAction(tool.action, { source: 'keyboard' })
        }
      }
    })
  }

  /**
   * 获取快捷键字符串
   */
  private getShortcutString(e: KeyboardEvent): string {
    const parts: string[] = []
    
    if (e.ctrlKey) parts.push('Ctrl')
    if (e.altKey) parts.push('Alt')
    if (e.shiftKey) parts.push('Shift')
    if (e.metaKey) parts.push('Cmd')
    
    if (e.key && e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && e.key !== 'Meta') {
      parts.push(e.key.length === 1 ? e.key.toUpperCase() : e.key)
    }
    
    return parts.join('+')
  }

  /**
   * 根据动作查找工具
   */
  private findToolByAction(action: string): UniversalTool | undefined {
    for (const tool of this.tools.values()) {
      if (tool.action === action) {
        return tool
      }
    }
    return undefined
  }

  // ==================== 工具处理器 ====================

  private async handleFileNew(context: ToolActionContext): Promise<void> {
    console.log('UniversalToolProvider: 新建文件')
    // 触发新建事件，由数据管道处理
    this.emitToolEvent('file.new', context)
  }

  private async handleFileOpen(context: ToolActionContext): Promise<void> {
    console.log('UniversalToolProvider: 打开文件')
    // 创建文件选择器
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.yaml,.yml,.xml'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        this.emitToolEvent('file.open', { ...context, payload: file })
      }
    }
    input.click()
  }

  private async handleFileSave(context: ToolActionContext): Promise<void> {
    console.log('UniversalToolProvider: 保存文件')
    this.emitToolEvent('file.save', context)
  }

  private async handleFileExport(context: ToolActionContext): Promise<void> {
    console.log('UniversalToolProvider: 导出文件', context.payload)
    this.emitToolEvent('file.export', context)
  }

  private async handleFileImport(context: ToolActionContext): Promise<void> {
    console.log('UniversalToolProvider: 导入文件')
    this.emitToolEvent('file.import', context)
  }

  private async handleEditUndo(context: ToolActionContext): Promise<void> {
    console.log('UniversalToolProvider: 撤销操作')
    this.emitToolEvent('edit.undo', context)
  }

  private async handleEditRedo(context: ToolActionContext): Promise<void> {
    console.log('UniversalToolProvider: 重做操作')
    this.emitToolEvent('edit.redo', context)
  }

  private async handleEditClear(context: ToolActionContext): Promise<void> {
    console.log('UniversalToolProvider: 清空操作')
    this.emitToolEvent('edit.clear', context)
  }

  private async handleViewFullscreen(context: ToolActionContext): Promise<void> {
    console.log('UniversalToolProvider: 切换全屏')
    
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen()
      this.setToolActive('view-fullscreen', true)
    } else {
      await document.exitFullscreen()
      this.setToolActive('view-fullscreen', false)
    }
  }

  private async handleViewSidebar(context: ToolActionContext): Promise<void> {
    console.log('UniversalToolProvider: 切换侧边栏')
    this.emitToolEvent('view.sidebar', context)
  }

  private async handleViewInspector(context: ToolActionContext): Promise<void> {
    console.log('UniversalToolProvider: 切换检查器')
    this.emitToolEvent('view.inspector', context)
  }

  /**
   * 触发工具事件
   */
  private emitToolEvent(action: string, context: ToolActionContext): void {
    // 在纯净架构中，这里应该通过事件总线或数据管道发送事件
    console.log(`UniversalToolProvider: 触发工具事件 ${action}`, context)
    
    // 发送自定义事件
    window.dispatchEvent(new CustomEvent('universal-tool-action', {
      detail: { action, context }
    }))
  }

  /**
   * 销毁工具提供者
   */
  destroy(): void {
    this.tools.clear()
    this.shortcuts.clear()
    console.log('UniversalToolProvider: 通用工具提供者已销毁')
  }
}

/**
 * 创建通用工具提供者实例
 */
export const createUniversalToolProvider = (): UniversalToolProvider => {
  return new UniversalToolProvider()
}