import { reactive } from 'vue'
import type { ConsistencyConfig, ConsistencyState, ValidationResult, DataSnapshot, ConflictResolution } from './types'

export class DataConsistencyManager {
  private config: ConsistencyConfig
  private state = reactive<ConsistencyState>({
    isValid: true,
    lastValidation: Date.now(),
    conflicts: [],
    snapshots: new Map()
  })

  constructor(config: ConsistencyConfig) {
    this.config = {
      validationInterval: 5000,
      snapshotLimit: 10,
      autoResolveConflicts: true,
      ...config
    }
  }

  // 数据验证
  async validateData(data: any, schema: any): Promise<ValidationResult> {
    try {
      // 执行数据验证
      const validationResult = await this.performValidation(data, schema)

      // 更新状态
      this.state.isValid = validationResult.isValid
      this.state.lastValidation = Date.now()

      if (!validationResult.isValid) {
        console.warn('数据验证失败:', validationResult.errors)
      }

      return validationResult
    } catch (error) {
      console.error('数据验证过程出错:', error)
      return {
        isValid: false,
        errors: [
          {
            field: 'validation',
            message: '验证过程失败',
            code: 'VALIDATION_ERROR'
          }
        ]
      }
    }
  }

  // 创建数据快照
  createSnapshot(data: any): string {
    const snapshotId = this.generateSnapshotId()
    const snapshot: DataSnapshot = {
      id: snapshotId,
      data: this.deepClone(data),
      timestamp: Date.now(),
      metadata: {
        version: '1.0',
        source: 'data_consistency_manager'
      }
    }

    // 管理快照数量
    if (this.state.snapshots.size >= this.config.snapshotLimit) {
      const oldestSnapshot = Array.from(this.state.snapshots.entries()).sort(
        ([, a], [, b]) => a.timestamp - b.timestamp
      )[0]
      if (oldestSnapshot) {
        this.state.snapshots.delete(oldestSnapshot[0])
      }
    }

    this.state.snapshots.set(snapshotId, snapshot)
    return snapshotId
  }

  // 恢复到快照
  restoreSnapshot(snapshotId: string): any {
    const snapshot = this.state.snapshots.get(snapshotId)
    if (!snapshot) {
      throw new Error(`快照不存在: ${snapshotId}`)
    }
    return this.deepClone(snapshot.data)
  }

  // 检测数据冲突
  detectConflicts(sourceData: any, targetData: any): ConflictResolution[] {
    const conflicts: ConflictResolution[] = []

    // 递归比较对象
    const compare = (source: any, target: any, path: string[] = []) => {
      if (typeof source !== typeof target) {
        conflicts.push({
          path: path.join('.'),
          sourceValue: source,
          targetValue: target,
          type: 'type_mismatch',
          resolution: 'manual'
        })
        return
      }

      if (typeof source === 'object' && source !== null) {
        const allKeys = new Set([...Object.keys(source), ...Object.keys(target)])

        allKeys.forEach(key => {
          if (!(key in source)) {
            conflicts.push({
              path: [...path, key].join('.'),
              sourceValue: undefined,
              targetValue: target[key],
              type: 'missing_in_source',
              resolution: 'manual'
            })
          } else if (!(key in target)) {
            conflicts.push({
              path: [...path, key].join('.'),
              sourceValue: source[key],
              targetValue: undefined,
              type: 'missing_in_target',
              resolution: 'manual'
            })
          } else {
            compare(source[key], target[key], [...path, key])
          }
        })
      } else if (source !== target) {
        conflicts.push({
          path: path.join('.'),
          sourceValue: source,
          targetValue: target,
          type: 'value_mismatch',
          resolution: this.config.autoResolveConflicts ? 'auto' : 'manual'
        })
      }
    }

    compare(sourceData, targetData)
    return conflicts
  }

  // 解决冲突
  resolveConflicts(conflicts: ConflictResolution[], data: any): any {
    const resolvedData = this.deepClone(data)

    conflicts.forEach(conflict => {
      if (conflict.resolution === 'auto') {
        // 自动解决冲突
        const path = conflict.path.split('.')
        let current = resolvedData

        // 遍历路径直到倒数第二个元素
        for (let i = 0; i < path.length - 1; i++) {
          if (!(path[i] in current)) {
            current[path[i]] = {}
          }
          current = current[path[i]]
        }

        // 设置最终值
        const lastKey = path[path.length - 1]
        switch (conflict.type) {
          case 'missing_in_source':
            current[lastKey] = conflict.targetValue
            break
          case 'missing_in_target':
            delete current[lastKey]
            break
          case 'value_mismatch':
            current[lastKey] = this.resolveValueConflict(conflict.sourceValue, conflict.targetValue)
            break
        }
      }
    })

    return resolvedData
  }

  // 获取当前状态
  getState(): ConsistencyState {
    return this.state
  }

  // 私有方法：执行数据验证
  private async performValidation(data: any, schema: any): Promise<ValidationResult> {
    // 这里可以使用具体的验证库，如 Joi 或 Yup
    // 当前使用简单的类型检查
    const errors = []

    try {
      if (schema.type && typeof data !== schema.type) {
        errors.push({
          field: 'type',
          message: `类型不匹配，期望 ${schema.type}，实际 ${typeof data}`,
          code: 'TYPE_MISMATCH'
        })
      }

      if (schema.required && (data === undefined || data === null)) {
        errors.push({
          field: 'value',
          message: '必填字段缺失',
          code: 'REQUIRED_FIELD_MISSING'
        })
      }

      if (schema.properties && typeof data === 'object') {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          const propResult = await this.performValidation(data[key], propSchema)
          if (!propResult.isValid) {
            errors.push(
              ...propResult.errors.map(error => ({
                ...error,
                field: `${key}.${error.field}`
              }))
            )
          }
        }
      }

      return {
        isValid: errors.length === 0,
        errors
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [
          {
            field: 'validation',
            message: '验证过程出错',
            code: 'VALIDATION_ERROR'
          }
        ]
      }
    }
  }

  // 私有方法：生成快照ID
  private generateSnapshotId(): string {
    return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 私有方法：深度克隆
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

  // 私有方法：解决值冲突
  private resolveValueConflict(sourceValue: any, targetValue: any): any {
    // 根据数据类型选择合适的解决策略
    if (typeof sourceValue === 'number' && typeof targetValue === 'number') {
      // 数字类型：取平均值
      return (sourceValue + targetValue) / 2
    }

    if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
      // 数组类型：合并去重
      return [...new Set([...sourceValue, ...targetValue])]
    }

    if (typeof sourceValue === 'string' && typeof targetValue === 'string') {
      // 字符串类型：保留较长的值
      return sourceValue.length >= targetValue.length ? sourceValue : targetValue
    }

    // 默认保留目标值
    return targetValue
  }
}
