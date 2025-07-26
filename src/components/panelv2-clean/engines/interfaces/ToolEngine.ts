/**
 * @file ToolEngine 工具引擎接口定义
 * @description 基础工具引擎接口 - 负责保存、清空、撤销重做等基础面板操作
 * 属于专业引擎层，为UI层提供标准化的工具操作接口
 */

import type { NodeData } from '../../types/core'

/**
 * 保存操作结果
 */
export interface SaveResult {
  /** 保存是否成功 */
  success: boolean
  /** 保存的数据版本 */
  version?: string
  /** 保存时间戳 */
  timestamp?: number
  /** 错误信息 */
  error?: string
}

/**
 * 导出选项
 */
export interface ExportOptions {
  /** 导出格式 */
  format: 'json' | 'yaml' | 'xml'
  /** 是否包含元数据 */
  includeMetadata?: boolean
  /** 是否压缩输出 */
  compress?: boolean
}

/**
 * 导入选项
 */
export interface ImportOptions {
  /** 导入格式 */
  format: 'json' | 'yaml' | 'xml'
  /** 是否覆盖现有数据 */
  overwrite?: boolean
  /** 是否验证数据格式 */
  validate?: boolean
}

/**
 * 历史操作记录
 */
export interface HistoryEntry {
  /** 操作ID */
  id: string
  /** 操作类型 */
  type: 'add' | 'update' | 'remove' | 'clear' | 'batch'
  /** 操作描述 */
  description: string
  /** 操作时间戳 */
  timestamp: number
  /** 操作前的状态快照 */
  beforeSnapshot: any
  /** 操作后的状态快照 */
  afterSnapshot: any
}

/**
 * 工具引擎统计信息
 */
export interface ToolEngineStats {
  /** 总保存次数 */
  totalSaves: number
  /** 总清空次数 */
  totalClears: number
  /** 总撤销次数 */
  totalUndos: number
  /** 总重做次数 */
  totalRedos: number
  /** 历史记录大小 */
  historySize: number
  /** 最后操作时间 */
  lastOperationTime: number
}

/**
 * 工具引擎接口
 */
export interface ToolEngine {
  /**
   * 保存操作器
   */
  saver: {
    /**
     * 保存当前面板数据
     */
    save(): Promise<SaveResult>

    /**
     * 保存为新版本
     */
    saveAs(name: string): Promise<SaveResult>

    /**
     * 自动保存（如果启用）
     */
    autoSave(): Promise<SaveResult>

    /**
     * 获取保存历史
     */
    getSaveHistory(): SaveResult[]

    /**
     * 启用自动保存
     */
    enableAutoSave(intervalMs: number): void

    /**
     * 禁用自动保存
     */
    disableAutoSave(): void
  }

  /**
   * 清空操作器
   */
  cleaner: {
    /**
     * 清空所有节点
     */
    clearAll(): Promise<void>

    /**
     * 清空选中节点
     */
    clearSelected(): Promise<void>

    /**
     * 重置面板到初始状态
     */
    resetPanel(): Promise<void>

    /**
     * 清空历史记录
     */
    clearHistory(): void
  }

  /**
   * 历史操作器
   */
  history: {
    /**
     * 撤销操作
     */
    undo(): Promise<boolean>

    /**
     * 重做操作
     */
    redo(): Promise<boolean>

    /**
     * 记录历史操作
     */
    recordOperation(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void

    /**
     * 获取历史记录
     */
    getHistory(): HistoryEntry[]

    /**
     * 清空历史记录
     */
    clearHistory(): void

    /**
     * 检查是否可以撤销
     */
    canUndo(): boolean

    /**
     * 检查是否可以重做
     */
    canRedo(): boolean
  }

  /**
   * 导出导入器
   */
  porter: {
    /**
     * 导出面板数据
     */
    export(options?: ExportOptions): Promise<string>

    /**
     * 导入面板数据
     */
    import(data: string, options?: ImportOptions): Promise<void>

    /**
     * 导出选中节点
     */
    exportSelected(options?: ExportOptions): Promise<string>

    /**
     * 导入节点数据
     */
    importNodes(data: string, options?: ImportOptions): Promise<NodeData[]>
  }

  /**
   * 状态管理器
   */
  state: {
    /**
     * 获取面板是否有未保存更改
     */
    isDirty(): boolean

    /**
     * 标记面板为脏状态
     */
    markDirty(): void

    /**
     * 标记面板为干净状态
     */
    markClean(): void

    /**
     * 获取当前操作状态
     */
    getOperationState(): {
      canSave: boolean
      canUndo: boolean
      canRedo: boolean
      canClear: boolean
      isAutoSaving: boolean
    }
  }

  /**
   * 事件管理
   */
  events: {
    /**
     * 监听保存事件
     */
    onSave(callback: (result: SaveResult) => void): void

    /**
     * 监听清空事件
     */
    onClear(callback: (type: 'all' | 'selected' | 'reset') => void): void

    /**
     * 监听撤销重做事件
     */
    onHistoryChange(callback: (entry: HistoryEntry, action: 'undo' | 'redo' | 'record') => void): void

    /**
     * 监听状态变更事件
     */
    onStateChange(callback: (state: { isDirty: boolean }) => void): void

    /**
     * 移除事件监听
     */
    off(event: string, callback: (...args: any[]) => void): void
  }

  /**
   * 获取统计信息
   */
  getStats(): ToolEngineStats
}
