/**
 * @file 纯净数据传递管道接口定义
 * @description 定义第一层纯净编辑器底座的数据传递接口
 * 只负责数据传递，绝不涉及业务逻辑处理
 */

/**
 * 数据操作类型枚举
 */
export enum DataOperationType {
  /** 添加数据 */
  ADD = 'add',
  /** 更新数据 */
  UPDATE = 'update',
  /** 删除数据 */
  DELETE = 'delete',
  /** 移动数据 */
  MOVE = 'move',
  /** 批量操作 */
  BATCH = 'batch'
}

/**
 * 数据变更记录接口
 */
export interface DataChangeRecord {
  /** 变更ID */
  id: string
  /** 时间戳 */
  timestamp: number
  /** 操作类型 */
  type: DataOperationType
  /** 目标对象类型 */
  targetType: 'panel' | 'node' | 'config'
  /** 目标对象ID */
  targetId: string
  /** 变更前的数据 */
  beforeData: any
  /** 变更后的数据 */
  afterData: any
  /** 变更路径 */
  path?: string
  /** 变更源 */
  source: 'user' | 'system' | 'plugin' | 'api'
}

/**
 * 数据操作接口
 */
export interface DataOperation {
  /** 操作ID */
  id: string
  /** 操作类型 */
  type: DataOperationType
  /** 操作数据 */
  payload: any
  /** 操作目标 */
  target: {
    type: 'panel' | 'node' | 'config'
    id: string
    path?: string
  }
}

/**
 * 数据管道事件接口
 */
export interface DataPipelineEvents {
  /** 数据变更事件 */
  'data-changed': DataChangeRecord

  /** 批量数据变更开始 */
  'batch-start': { batchId: string }

  /** 批量数据变更结束 */
  'batch-end': { batchId: string; changes: DataChangeRecord[] }

  /** 数据同步事件 */
  'data-sync': { type: 'save' | 'load'; status: 'start' | 'success' | 'error'; data?: any }

  /** 数据验证事件 */
  'data-validation': { valid: boolean; errors: Array<{ path: string; message: string }> }
}

/**
 * 数据持久化接口
 */
export interface DataPersistence {
  /** 保存数据到持久化存储 */
  save?(data: any): Promise<void>

  /** 从持久化存储加载数据 */
  load?(id: string): Promise<any>

  /** 是否启用自动保存 */
  autosave?: boolean

  /** 自动保存间隔（毫秒） */
  autosaveInterval?: number
}

/**
 * 纯净数据传递管道接口
 * @description 只负责数据传递和通知，不处理具体的业务逻辑
 */
export interface IPureDataPipeline {
  /**
   * 执行数据操作
   * @param operation 数据操作对象
   * @returns 操作结果
   */
  execute(operation: DataOperation): Promise<any>

  /**
   * 批量执行数据操作
   * @param operations 数据操作数组
   * @returns 批量操作结果
   */
  executeBatch(operations: DataOperation[]): Promise<any[]>

  /**
   * 获取数据变更历史
   * @param targetId 目标ID（可选）
   * @param limit 返回记录数限制
   * @returns 变更记录数组
   */
  getChangeHistory(targetId?: string, limit?: number): DataChangeRecord[]

  /**
   * 清空变更历史
   */
  clearHistory(): void

  /**
   * 监听数据事件
   * @param event 事件名称
   * @param handler 事件处理器
   */
  on<K extends keyof DataPipelineEvents>(event: K, handler: (payload: DataPipelineEvents[K]) => void): void

  /**
   * 移除事件监听器
   * @param event 事件名称
   * @param handler 事件处理器
   */
  off<K extends keyof DataPipelineEvents>(event: K, handler: (payload: DataPipelineEvents[K]) => void): void

  /**
   * 发射数据事件
   * @param event 事件名称
   * @param payload 事件数据
   */
  emit<K extends keyof DataPipelineEvents>(event: K, payload: DataPipelineEvents[K]): void

  /**
   * 设置数据持久化处理器
   * @param persistence 持久化处理器
   */
  setPersistence(persistence: DataPersistence): void

  /**
   * 销毁数据管道
   */
  destroy(): void
}

/**
 * 数据管道创建选项
 */
export interface DataPipelineOptions {
  /** 是否启用变更历史记录 */
  enableHistory?: boolean
  /** 历史记录最大数量 */
  maxHistorySize?: number
  /** 是否启用数据验证 */
  enableValidation?: boolean
  /** 持久化处理器 */
  persistence?: DataPersistence
}

/**
 * 数据验证器接口
 */
export interface DataValidator {
  /**
   * 验证数据
   * @param data 要验证的数据
   * @param context 验证上下文
   * @returns 验证结果
   */
  validate(
    data: any,
    context?: any
  ): {
    valid: boolean
    errors: Array<{
      path: string
      message: string
      code?: string
    }>
  }
}

/**
 * 数据转换器接口
 */
export interface DataTransformer {
  /**
   * 转换数据
   * @param data 原始数据
   * @param context 转换上下文
   * @returns 转换后的数据
   */
  transform(data: any, context?: any): any

  /**
   * 反向转换数据
   * @param data 转换后的数据
   * @param context 转换上下文
   * @returns 原始数据
   */
  reverse(data: any, context?: any): any
}
