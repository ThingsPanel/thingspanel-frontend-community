// 一致性配置接口
export interface ConsistencyConfig {
  validationInterval: number // 验证间隔（毫秒）
  snapshotLimit: number // 快照数量限制
  autoResolveConflicts: boolean // 是否自动解决冲突
}

// 一致性状态接口
export interface ConsistencyState {
  isValid: boolean // 当前数据是否有效
  lastValidation: number // 最后验证时间
  conflicts: ConflictResolution[] // 当前冲突列表
  snapshots: Map<string, DataSnapshot> // 数据快照
}

// 验证结果接口
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// 验证错误接口
export interface ValidationError {
  field: string
  message: string
  code: string
}

// 数据快照接口
export interface DataSnapshot {
  id: string
  data: any
  timestamp: number
  metadata: {
    version: string
    source: string
    [key: string]: any
  }
}

// 冲突解决接口
export interface ConflictResolution {
  path: string // 冲突路径
  sourceValue: any // 源数据值
  targetValue: any // 目标数据值
  type: ConflictType // 冲突类型
  resolution: ResolutionType // 解决方式
}

// 冲突类型
export type ConflictType =
  | 'type_mismatch' // 类型不匹配
  | 'value_mismatch' // 值不匹配
  | 'missing_in_source' // 源数据缺失
  | 'missing_in_target' // 目标数据缺失

// 解决方式
export type ResolutionType =
  | 'auto' // 自动解决
  | 'manual' // 手动解决
