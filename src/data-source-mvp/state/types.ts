// 状态配置
export interface StateConfig {
  maxHistorySize: number // 最大历史记录数量
  validateOnChange: boolean // 是否在状态变更时验证
  autoSave: boolean // 是否自动保存
}

// 状态快照
export interface StateSnapshot {
  id: string
  key: string
  state: any
  timestamp: number
  metadata: {
    version: string
    transitions: StateTransition[]
  }
}

// 状态验证结果
export interface StateValidationResult {
  isValid: boolean
  errors: string[]
  warnings?: string[]
}

// 状态转换结果
export interface StateTransitionResult {
  isValid: boolean
  errors: string[]
  conflicts?: StateConflict[]
}

// 状态冲突
export interface StateConflict {
  path: string
  oldValue: any
  newValue: any
  reason: string
}

// 状态转换记录
export interface StateTransition {
  key: string
  from: any
  to: any
  timestamp: number
}

// 状态验证记录
export interface StateValidation {
  timestamp: number
  result: StateValidationResult
}

// 状态元数据
export interface StateMetadata {
  lastUpdate: number
  version: string
  transitions: StateTransition[]
  validations: StateValidation[]
}

// 状态历史记录
export type StateHistory = Map<string, StateSnapshot[]>

// 状态验证器
export class StateValidator {
  validate(state: any): StateValidationResult {
    // 实现具体的验证逻辑
    return {
      isValid: true,
      errors: []
    }
  }

  validateTransition(from: any, to: any): StateTransitionResult {
    // 实现具体的转换验证逻辑
    return {
      isValid: true,
      errors: []
    }
  }
}
