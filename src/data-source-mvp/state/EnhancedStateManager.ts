import { reactive, readonly } from 'vue'
import type {
  StateConfig,
  StateSnapshot,
  StateValidationResult,
  StateTransitionResult,
  StateMetadata,
  StateHistory,
  StateValidator
} from './types'

export class EnhancedStateManager {
  private stateStore: Map<string, any> = new Map()
  private stateHistory: StateHistory = new Map()
  private stateValidator: StateValidator
  private config: StateConfig
  private metadata = reactive<StateMetadata>({
    lastUpdate: Date.now(),
    version: '1.0.0',
    transitions: [],
    validations: []
  })

  constructor(config: StateConfig) {
    this.config = {
      maxHistorySize: 50,
      validateOnChange: true,
      autoSave: true,
      ...config
    }
    this.stateValidator = new StateValidator()
  }

  // 设置状态
  setState<T>(key: string, value: T): void {
    // 验证状态变更
    if (this.config.validateOnChange) {
      const validationResult = this.validateState(value)
      if (!validationResult.isValid) {
        throw new Error(`状态验证失败: ${validationResult.errors.join(', ')}`)
      }
    }

    // 创建快照
    const oldValue = this.stateStore.get(key)
    const snapshot = this.createSnapshot(key, oldValue)

    // 验证状态转换
    const transitionResult = this.validateTransition(oldValue, value)
    if (!transitionResult.isValid) {
      throw new Error(`状态转换无效: ${transitionResult.errors.join(', ')}`)
    }

    // 更新状态
    this.stateStore.set(key, value)
    this.metadata.lastUpdate = Date.now()
    this.metadata.transitions.push({
      key,
      from: oldValue,
      to: value,
      timestamp: Date.now()
    })

    // 保存历史记录
    this.saveHistory(key, snapshot)

    // 自动保存
    if (this.config.autoSave) {
      this.persistState()
    }
  }

  // 获取状态
  getState<T>(key: string): T | undefined {
    return this.stateStore.get(key)
  }

  // 获取只读状态
  getReadOnlyState<T>(key: string): Readonly<T> | undefined {
    const state = this.stateStore.get(key)
    return state ? readonly(state) : undefined
  }

  // 重置状态
  resetState(key: string): void {
    const snapshot = this.getInitialSnapshot(key)
    if (snapshot) {
      this.setState(key, snapshot.state)
    } else {
      this.stateStore.delete(key)
    }
  }

  // 创建快照
  createSnapshot(key: string, state: any): StateSnapshot {
    return {
      id: this.generateSnapshotId(),
      key,
      state: this.deepClone(state),
      timestamp: Date.now(),
      metadata: {
        version: this.metadata.version,
        transitions: [...this.metadata.transitions]
      }
    }
  }

  // 恢复快照
  restoreSnapshot(snapshotId: string): void {
    for (const [key, history] of this.stateHistory.entries()) {
      const snapshot = history.find(s => s.id === snapshotId)
      if (snapshot) {
        this.setState(key, snapshot.state)
        break
      }
    }
  }

  // 获取状态历史
  getStateHistory(key: string): StateSnapshot[] {
    return this.stateHistory.get(key) || []
  }

  // 验证状态
  validateState(state: any): StateValidationResult {
    const result = this.stateValidator.validate(state)
    this.metadata.validations.push({
      timestamp: Date.now(),
      result
    })
    return result
  }

  // 验证状态转换
  validateTransition(from: any, to: any): StateTransitionResult {
    return this.stateValidator.validateTransition(from, to)
  }

  // 获取元数据
  getMetadata(): Readonly<StateMetadata> {
    return readonly(this.metadata)
  }

  // 持久化状态
  private persistState(): void {
    // 实现状态持久化逻辑
    console.log('持久化状态:', Object.fromEntries(this.stateStore))
  }

  // 保存历史记录
  private saveHistory(key: string, snapshot: StateSnapshot): void {
    const history = this.stateHistory.get(key) || []
    history.push(snapshot)

    // 限制历史记录大小
    if (history.length > this.config.maxHistorySize) {
      history.shift()
    }

    this.stateHistory.set(key, history)
  }

  // 获取初始快照
  private getInitialSnapshot(key: string): StateSnapshot | undefined {
    const history = this.stateHistory.get(key)
    return history ? history[0] : undefined
  }

  // 生成快照ID
  private generateSnapshotId(): string {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 深度克隆
  private deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.deepClone(item)) as unknown as T
    }

    const cloned = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key])
      }
    }
    return cloned
  }
}
