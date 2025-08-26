/**
 * 组件运行时数据管理接口
 * 负责管理组件的运行时数据：数据获取、缓存、更新
 */

/**
 * 数据源类型
 */
export type DataSourceType = 'static' | 'http' | 'websocket' | 'script'

/**
 * 数据源配置
 */
export interface DataSourceDefinition {
  id: string
  type: DataSourceType
  config: {
    // HTTP配置
    url?: string
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: Record<string, string>
    params?: Record<string, any>
    body?: any
    timeout?: number
    
    // 静态数据配置
    data?: any
    
    // WebSocket配置
    wsUrl?: string
    reconnect?: boolean
    
    // 脚本配置
    script?: string
    context?: Record<string, any>
    
    [key: string]: any
  }
  // 数据过滤路径（如JSONPath）
  filterPath?: string
  // 数据处理脚本
  processScript?: string
}

/**
 * 组件数据需求
 */
export interface ComponentDataRequirement {
  /** 组件ID */
  componentId: string
  /** 组件类型 */
  componentType: string
  /** 数据源列表 */
  dataSources: DataSourceDefinition[]
  /** 是否启用 */
  enabled: boolean
}

/**
 * 数据执行结果
 */
export interface DataExecutionResult {
  /** 是否成功 */
  success: boolean
  /** 数据内容 */
  data?: any
  /** 错误信息 */
  error?: string
  /** 执行时间（毫秒） */
  executionTime: number
  /** 时间戳 */
  timestamp: number
}

/**
 * 组件数据状态
 */
export interface ComponentDataState {
  /** 组件ID */
  componentId: string
  /** 组件类型 */
  componentType: string
  /** 当前数据 */
  currentData: Record<string, any>
  /** 最后更新时间 */
  lastUpdated: number
  /** 是否正在加载 */
  loading: boolean
  /** 错误信息 */
  error?: string
  /** 数据源状态 */
  dataSourceStates: Record<string, {
    lastExecuted: number
    success: boolean
    error?: string
  }>
}

/**
 * 数据更新事件
 */
export interface DataUpdateEvent {
  componentId: string
  dataSourceId?: string
  oldData?: any
  newData: any
  timestamp: number
}

/**
 * 组件运行时数据管理器接口
 * 职责：
 * 1. 根据配置获取和处理数据
 * 2. 管理数据缓存和更新策略
 * 3. 提供简单的数据转换功能
 * 4. 通知组件数据变更
 * 
 * 设计原则：
 * - 简单直接，不做复杂的状态管理
 * - 无轮询、无WebSocket连接池等重型功能
 * - 只处理基本的HTTP请求和静态数据
 * - 错误容忍，不阻塞界面
 */
export interface IComponentDataManager {
  // --- 数据需求管理 ---

  /**
   * 注册组件数据需求
   */
  registerComponent(requirement: ComponentDataRequirement): void

  /**
   * 注销组件数据需求
   */
  unregisterComponent(componentId: string): void

  /**
   * 更新组件数据需求
   */
  updateComponentRequirement(requirement: ComponentDataRequirement): void

  /**
   * 获取组件数据需求
   */
  getComponentRequirement(componentId: string): ComponentDataRequirement | null

  // --- 数据执行 ---

  /**
   * 执行组件数据获取（手动触发）
   */
  executeComponent(componentId: string): Promise<DataExecutionResult>

  /**
   * 执行特定数据源
   */
  executeDataSource(componentId: string, dataSourceId: string): Promise<DataExecutionResult>

  /**
   * 批量执行多个组件
   */
  executeMultipleComponents(componentIds: string[]): Promise<Record<string, DataExecutionResult>>

  // --- 数据状态查询 ---

  /**
   * 获取组件当前数据
   */
  getComponentData(componentId: string): Record<string, any> | null

  /**
   * 获取组件数据状态
   */
  getComponentState(componentId: string): ComponentDataState | null

  /**
   * 获取所有组件状态
   */
  getAllStates(): Record<string, ComponentDataState>

  // --- 数据缓存管理 ---

  /**
   * 清除组件数据缓存
   */
  clearComponentCache(componentId: string): void

  /**
   * 清除所有缓存
   */
  clearAllCache(): void

  /**
   * 设置缓存过期时间（毫秒）
   */
  setCacheExpiry(milliseconds: number): void

  // --- 事件监听 ---

  /**
   * 监听数据更新
   */
  onDataUpdate(listener: (event: DataUpdateEvent) => void): () => void

  /**
   * 监听特定组件数据更新
   */
  onComponentDataUpdate(componentId: string, listener: (event: DataUpdateEvent) => void): () => void

  // --- 统计信息 ---

  /**
   * 获取简单统计信息
   */
  getStats(): {
    totalComponents: number
    activeComponents: number
    totalExecutions: number
    lastUpdate: number | null
  }

  /**
   * 清理资源
   */
  destroy(): void
}