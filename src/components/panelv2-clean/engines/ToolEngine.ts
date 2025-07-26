/**
 * @file ToolEngine 工具引擎实现
 * @description 基础工具引擎 - 提供保存、清空、撤销重做等基础面板操作
 * 属于专业引擎层，为UI层提供标准化的工具操作接口
 */

import { ref, reactive } from 'vue'
import { nanoid } from 'nanoid'
import { usePanelCleanStore } from '../core/PanelCleanStore'
import { globalDataPipeline } from '../core/PureDataPipeline'
import { globalDataEngine } from './DataEngine'
import { globalLifecycleManager } from '../core/LifecycleManager'
import { LifecyclePhase } from '../core/interfaces/Lifecycle'
import type {
  ToolEngine as IToolEngine,
  SaveResult,
  ExportOptions,
  ImportOptions,
  HistoryEntry,
  ToolEngineStats
} from './interfaces/ToolEngine'
import type { NodeData } from '../types/core'

/**
 * 工具引擎实现类
 */
export class ToolEngine implements IToolEngine {
  /** Store实例 */
  private store = usePanelCleanStore()

  /** 内部状态 */
  private isDirtyState = ref(false)
  private autoSaveInterval: number | null = null
  private saveHistory = ref<SaveResult[]>([])
  private historyStack = ref<HistoryEntry[]>([])
  private historyIndex = ref(-1)
  private stats = reactive<ToolEngineStats>({
    totalSaves: 0,
    totalClears: 0,
    totalUndos: 0,
    totalRedos: 0,
    historySize: 0,
    lastOperationTime: Date.now()
  })

  /** 事件监听器 */
  private eventListeners = new Map<string, Set<(...args: any[]) => void>>()

  constructor() {
    console.log('ToolEngine: 工具引擎已初始化')

    // 确保事件监听器Map正确初始化
    if (!(this.eventListeners instanceof Map)) {
      console.error('ToolEngine: eventListeners不是Map实例，重新初始化')
      this.eventListeners = new Map<string, Set<(...args: any[]) => void>>()
    }

    this.initializeIntegrations()
  }

  // ==================== 保存操作器 ====================

  /** 保存操作器 */
  saver = {
    /**
     * 保存当前面板数据
     */
    save: async (): Promise<SaveResult> => {
      try {
        console.log('ToolEngine: 开始保存操作')

        // 记录操作到生命周期
        await globalLifecycleManager.executePhase(LifecyclePhase.PANEL_SAVE, {
          targetId: 'panel',
          operation: 'save',
          payload: { timestamp: Date.now() }
        })

        // 获取当前面板数据
        const panelData = this.store.panelData
        const saveData = {
          ...panelData,
          savedAt: Date.now(),
          version: this.generateVersion()
        }

        // 模拟保存操作（实际项目中会调用API）
        await this.simulateSaveOperation(saveData)

        const result: SaveResult = {
          success: true,
          version: saveData.version,
          timestamp: saveData.savedAt
        }

        // 更新保存历史
        this.saveHistory.value.unshift(result)
        if (this.saveHistory.value.length > 50) {
          // 保持最近50次保存记录
          this.saveHistory.value = this.saveHistory.value.slice(0, 50)
        }

        // 标记为干净状态
        this.state.markClean()

        // 更新统计
        this.stats.totalSaves++
        this.stats.lastOperationTime = Date.now()

        // 触发事件
        this.emitEvent('save', result)

        console.log('ToolEngine: 保存操作完成', result)
        return result
      } catch (error) {
        console.error('ToolEngine: 保存操作失败', error)
        const result: SaveResult = {
          success: false,
          error: error instanceof Error ? error.message : '保存失败'
        }
        this.emitEvent('save', result)
        return result
      }
    },

    /**
     * 保存为新版本
     */
    saveAs: async (name: string): Promise<SaveResult> => {
      console.log('ToolEngine: 另存为操作', name)
      // 更新面板名称后保存
      this.store.updatePanelInfo({ name })
      return await this.saver.save()
    },

    /**
     * 自动保存（如果启用）
     */
    autoSave: async (): Promise<SaveResult> => {
      if (this.isDirtyState.value) {
        const result = await this.saver.save()
        console.log('ToolEngine: 自动保存执行', result.success)
        return result
      }
      return { success: true, timestamp: Date.now() }
    },

    /**
     * 获取保存历史
     */
    getSaveHistory: (): SaveResult[] => {
      return this.saveHistory.value
    },

    /**
     * 启用自动保存
     */
    enableAutoSave: (intervalMs: number): void => {
      if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval)
      }

      this.autoSaveInterval = setInterval(() => {
        this.saver.autoSave()
      }, intervalMs) as any

      console.log('ToolEngine: 自动保存已启用', `间隔${intervalMs}ms`)
    },

    /**
     * 禁用自动保存
     */
    disableAutoSave: (): void => {
      if (this.autoSaveInterval) {
        clearInterval(this.autoSaveInterval)
        this.autoSaveInterval = null
        console.log('ToolEngine: 自动保存已禁用')
      }
    }
  }

  // ==================== 清空操作器 ====================

  /** 清空操作器 */
  cleaner = {
    /**
     * 清空所有节点
     */
    clearAll: async (): Promise<void> => {
      console.log('ToolEngine: 清空所有节点')

      // 记录操作历史
      const beforeSnapshot = { ...this.store.panelData }

      try {
        // 执行清空
        this.store.clearAll()

        // 记录到历史
        this.history.recordOperation({
          type: 'clear',
          description: '清空所有节点',
          beforeSnapshot,
          afterSnapshot: { ...this.store.panelData }
        })

        // 标记为脏状态
        this.state.markDirty()

        // 更新统计
        this.stats.totalClears++
        this.stats.lastOperationTime = Date.now()

        // 触发事件
        this.emitEvent('clear', 'all')
      } catch (error) {
        console.error('ToolEngine: 清空所有节点失败', error)
        throw error
      }
    },

    /**
     * 清空选中节点
     */
    clearSelected: async (): Promise<void> => {
      console.log('ToolEngine: 清空选中节点')

      const selectedNodes = this.store.selectedNodes
      if (selectedNodes.length === 0) {
        console.log('ToolEngine: 没有选中的节点')
        return
      }

      const beforeSnapshot = { ...this.store.panelData }

      try {
        // 删除选中的节点
        for (const nodeId of selectedNodes) {
          await this.store.removeNode(nodeId)
        }

        // 记录到历史
        this.history.recordOperation({
          type: 'remove',
          description: `删除${selectedNodes.length}个选中节点`,
          beforeSnapshot,
          afterSnapshot: { ...this.store.panelData }
        })

        // 标记为脏状态
        this.state.markDirty()

        // 触发事件
        this.emitEvent('clear', 'selected')
      } catch (error) {
        console.error('ToolEngine: 清空选中节点失败', error)
        throw error
      }
    },

    /**
     * 重置面板到初始状态
     */
    resetPanel: async (): Promise<void> => {
      console.log('ToolEngine: 重置面板到初始状态')

      const beforeSnapshot = { ...this.store.panelData }

      try {
        // 重新准备面板数据
        const panelData = await globalDataEngine.preparation.preparePanelData()

        // 重置Store状态
        this.store.clearAll()
        this.store.resetToInitialState()

        // 记录到历史
        this.history.recordOperation({
          type: 'clear',
          description: '重置面板到初始状态',
          beforeSnapshot,
          afterSnapshot: { ...this.store.panelData }
        })

        // 标记为脏状态
        this.state.markDirty()

        // 更新统计
        this.stats.totalClears++
        this.stats.lastOperationTime = Date.now()

        // 触发事件
        this.emitEvent('clear', 'reset')
      } catch (error) {
        console.error('ToolEngine: 重置面板失败', error)
        throw error
      }
    },

    /**
     * 清空历史记录
     */
    clearHistory: (): void => {
      this.historyStack.value = []
      this.historyIndex.value = -1
      this.stats.historySize = 0
      console.log('ToolEngine: 历史记录已清空')
    }
  }

  // ==================== 历史操作器 ====================

  /** 历史操作器 */
  history = {
    /**
     * 撤销操作
     */
    undo: async (): Promise<boolean> => {
      if (!this.history.canUndo()) {
        console.log('ToolEngine: 无法撤销，没有历史记录')
        return false
      }

      try {
        const entry = this.historyStack.value[this.historyIndex.value]
        console.log('ToolEngine: 撤销操作', entry.description)

        // 恢复到之前的状态
        await this.restoreSnapshot(entry.beforeSnapshot)

        // 更新历史索引
        this.historyIndex.value--

        // 更新统计
        this.stats.totalUndos++
        this.stats.lastOperationTime = Date.now()

        // 触发事件
        this.emitEvent('history-change', entry, 'undo')

        return true
      } catch (error) {
        console.error('ToolEngine: 撤销操作失败', error)
        return false
      }
    },

    /**
     * 重做操作
     */
    redo: async (): Promise<boolean> => {
      if (!this.history.canRedo()) {
        console.log('ToolEngine: 无法重做，没有可重做的操作')
        return false
      }

      try {
        const entry = this.historyStack.value[this.historyIndex.value + 1]
        console.log('ToolEngine: 重做操作', entry.description)

        // 恢复到之后的状态
        await this.restoreSnapshot(entry.afterSnapshot)

        // 更新历史索引
        this.historyIndex.value++

        // 更新统计
        this.stats.totalRedos++
        this.stats.lastOperationTime = Date.now()

        // 触发事件
        this.emitEvent('history-change', entry, 'redo')

        return true
      } catch (error) {
        console.error('ToolEngine: 重做操作失败', error)
        return false
      }
    },

    /**
     * 记录历史操作
     */
    recordOperation: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void => {
      const historyEntry: HistoryEntry = {
        id: nanoid(),
        timestamp: Date.now(),
        ...entry
      }

      // 如果当前不在历史栈顶，需要截断后续历史
      if (this.historyIndex.value < this.historyStack.value.length - 1) {
        this.historyStack.value = this.historyStack.value.slice(0, this.historyIndex.value + 1)
      }

      // 添加新的历史记录
      this.historyStack.value.push(historyEntry)
      this.historyIndex.value = this.historyStack.value.length - 1

      // 限制历史记录大小
      const maxHistorySize = 100
      if (this.historyStack.value.length > maxHistorySize) {
        this.historyStack.value.shift()
        this.historyIndex.value--
      }

      // 更新统计
      this.stats.historySize = this.historyStack.value.length

      // 触发事件
      this.emitEvent('history-change', historyEntry, 'record')

      console.log('ToolEngine: 记录历史操作', entry.description)
    },

    /**
     * 获取历史记录
     */
    getHistory: (): HistoryEntry[] => {
      return this.historyStack.value
    },

    /**
     * 清空历史记录
     */
    clearHistory: (): void => {
      this.cleaner.clearHistory()
    },

    /**
     * 检查是否可以撤销
     */
    canUndo: (): boolean => {
      return this.historyIndex.value >= 0
    },

    /**
     * 检查是否可以重做
     */
    canRedo: (): boolean => {
      return this.historyIndex.value < this.historyStack.value.length - 1
    }
  }

  // ==================== 导出导入器 ====================

  /** 导出导入器 */
  porter = {
    /**
     * 导出面板数据
     */
    export: async (options: ExportOptions = { format: 'json' }): Promise<string> => {
      console.log('ToolEngine: 导出面板数据', options)

      const exportData = {
        panel: this.store.panelData,
        metadata: options.includeMetadata
          ? {
              exportTime: Date.now(),
              version: this.generateVersion(),
              toolEngineVersion: '1.0.0'
            }
          : undefined
      }

      switch (options.format) {
        case 'json':
          return JSON.stringify(exportData, null, options.compress ? 0 : 2)
        case 'yaml':
          // 这里应该使用yaml库，简化实现
          return `# YAML Export\n${JSON.stringify(exportData, null, 2)}`
        case 'xml':
          // 这里应该使用xml库，简化实现
          return `<?xml version="1.0"?>\n<panel>${JSON.stringify(exportData)}</panel>`
        default:
          throw new Error(`不支持的导出格式: ${options.format}`)
      }
    },

    /**
     * 导入面板数据
     */
    import: async (data: string, options: ImportOptions = { format: 'json' }): Promise<void> => {
      console.log('ToolEngine: 导入面板数据', options)

      try {
        let importData: any

        switch (options.format) {
          case 'json':
            importData = JSON.parse(data)
            break
          case 'yaml':
          case 'xml':
            // 简化实现，实际应该用对应的解析库
            importData = JSON.parse(data)
            break
          default:
            throw new Error(`不支持的导入格式: ${options.format}`)
        }

        // 数据验证
        if (options.validate && !this.validateImportData(importData)) {
          throw new Error('导入数据格式不正确')
        }

        // 记录操作历史
        const beforeSnapshot = { ...this.store.panelData }

        // 导入数据
        if (options.overwrite) {
          this.store.clearAll()
        }

        // 恢复面板数据
        if (importData.panel) {
          await this.restoreSnapshot(importData.panel)
        }

        // 记录到历史
        this.history.recordOperation({
          type: 'batch',
          description: `导入${options.format.toUpperCase()}数据`,
          beforeSnapshot,
          afterSnapshot: { ...this.store.panelData }
        })

        // 标记为脏状态
        this.state.markDirty()
      } catch (error) {
        console.error('ToolEngine: 导入数据失败', error)
        throw error
      }
    },

    /**
     * 导出选中节点
     */
    exportSelected: async (options: ExportOptions = { format: 'json' }): Promise<string> => {
      const selectedNodes = this.store.selectedNodes
      const selectedNodeData = this.store.panelData.nodes.filter(node => selectedNodes.includes(node.id))

      const exportData = {
        nodes: selectedNodeData,
        count: selectedNodeData.length,
        metadata: options.includeMetadata
          ? {
              exportTime: Date.now(),
              selectionType: 'nodes'
            }
          : undefined
      }

      return JSON.stringify(exportData, null, options.compress ? 0 : 2)
    },

    /**
     * 导入节点数据
     */
    importNodes: async (data: string, options: ImportOptions = { format: 'json' }): Promise<NodeData[]> => {
      try {
        const importData = JSON.parse(data)
        const nodes: NodeData[] = importData.nodes || []

        // 为导入的节点生成新ID
        const importedNodes: NodeData[] = []
        for (const node of nodes) {
          const newNode = {
            ...node,
            id: nanoid(), // 生成新ID避免冲突
            meta: {
              ...node.meta,
              createTime: Date.now(),
              updateTime: Date.now()
            }
          }

          await this.store.addNode(newNode)
          importedNodes.push(newNode)
        }

        return importedNodes
      } catch (error) {
        console.error('ToolEngine: 导入节点失败', error)
        throw error
      }
    }
  }

  // ==================== 状态管理器 ====================

  /** 状态管理器 */
  state = {
    /**
     * 获取面板是否有未保存更改
     */
    isDirty: (): boolean => {
      return this.isDirtyState.value
    },

    /**
     * 标记面板为脏状态
     */
    markDirty: (): void => {
      if (!this.isDirtyState.value) {
        this.isDirtyState.value = true
        this.emitEvent('state-change', { isDirty: true })
      }
    },

    /**
     * 标记面板为干净状态
     */
    markClean: (): void => {
      if (this.isDirtyState.value) {
        this.isDirtyState.value = false
        this.emitEvent('state-change', { isDirty: false })
      }
    },

    /**
     * 获取当前操作状态
     */
    getOperationState: () => ({
      canSave: this.isDirtyState.value,
      canUndo: this.history.canUndo(),
      canRedo: this.history.canRedo(),
      canClear: this.store.panelData.nodes.length > 0,
      isAutoSaving: this.autoSaveInterval !== null
    })
  }

  // ==================== 事件管理 ====================

  /** 事件管理 */
  events = {
    /**
     * 监听保存事件
     */
    onSave: (callback: (result: SaveResult) => void): void => {
      this.addEventListener('save', callback)
    },

    /**
     * 监听清空事件
     */
    onClear: (callback: (type: 'all' | 'selected' | 'reset') => void): void => {
      this.addEventListener('clear', callback)
    },

    /**
     * 监听撤销重做事件
     */
    onHistoryChange: (callback: (entry: HistoryEntry, action: 'undo' | 'redo' | 'record') => void): void => {
      this.addEventListener('history-change', callback)
    },

    /**
     * 监听状态变更事件
     */
    onStateChange: (callback: (state: { isDirty: boolean }) => void): void => {
      this.addEventListener('state-change', callback)
    },

    /**
     * 移除事件监听
     */
    off: (event: string, callback: (...args: any[]) => void): void => {
      this.removeEventListener(event, callback)
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): ToolEngineStats {
    return { ...this.stats }
  }

  // ==================== 私有方法 ====================

  /**
   * 初始化与其他系统的集成
   */
  private initializeIntegrations(): void {
    // 监听Store变化来更新脏状态
    this.store.$subscribe((mutation, state) => {
      this.state.markDirty()
    })

    // 监听数据管道变化
    globalDataPipeline.on('data-changed', () => {
      this.state.markDirty()
    })
  }

  /**
   * 生成版本号
   */
  private generateVersion(): string {
    return `v${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 模拟保存操作
   */
  private async simulateSaveOperation(data: any): Promise<void> {
    // 模拟异步保存操作
    return new Promise(resolve => {
      setTimeout(resolve, 100)
    })
  }

  /**
   * 恢复快照状态
   */
  private async restoreSnapshot(snapshot: any): Promise<void> {
    // 清空当前状态
    this.store.clearAll()

    // 恢复节点数据
    if (snapshot.nodes && Array.isArray(snapshot.nodes)) {
      for (const node of snapshot.nodes) {
        await this.store.addNode(node)
      }
    }

    // 恢复面板信息
    if (snapshot.name || snapshot.description) {
      this.store.updatePanelInfo({
        name: snapshot.name,
        description: snapshot.description
      })
    }
  }

  /**
   * 验证导入数据
   */
  private validateImportData(data: any): boolean {
    try {
      // 基础结构验证
      if (!data || typeof data !== 'object') {
        return false
      }

      // 面板数据验证
      if (data.panel) {
        const panel = data.panel
        if (!panel.nodes || !Array.isArray(panel.nodes)) {
          return false
        }
      }

      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 添加事件监听
   */
  private addEventListener(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)
  }

  /**
   * 移除事件监听
   */
  private removeEventListener(event: string, callback: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`ToolEngine: 事件回调错误 [${event}]`, error)
        }
      })
    }
  }
}

/**
 * 创建工具引擎实例
 */
export const createToolEngine = (): ToolEngine => {
  try {
    console.log('createToolEngine: 开始创建实例')
    const instance = new ToolEngine()
    console.log('createToolEngine: 实例创建成功')
    return instance
  } catch (error) {
    console.error('createToolEngine: 创建实例失败', error)
    throw error
  }
}

/**
 * 全局工具引擎实例（延迟初始化）
 */
let _globalToolEngine: ToolEngine | null = null

export const globalToolEngine = new Proxy({} as ToolEngine, {
  get(target, prop) {
    if (!_globalToolEngine) {
      console.log('globalToolEngine Proxy: 延迟初始化')
      _globalToolEngine = createToolEngine()
    }
    return _globalToolEngine[prop as keyof ToolEngine]
  }
})
