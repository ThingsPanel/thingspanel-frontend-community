/**
 * 数据绑定管理器
 * 负责将数据源与组件进行绑定和同步
 */

import type { StaticDataSource } from './static-data-source'
import type { DeviceApiDataSource } from './device-api-data-source'
import { componentSchemaManager } from './component-schema'

type DataSource = StaticDataSource | DeviceApiDataSource

export interface ComponentDataBinding {
  componentId: string
  componentInstanceId?: string // 同一组件可能有多个实例
  dataSourceId: string
  bindingConfig: {
    [componentField: string]: {
      dataPath: string
      transform?: (value: any) => any // 可选的数据转换函数
      fallbackValue?: any
    }
  }
}

export interface DataBindingStatus {
  [fieldName: string]: {
    isBound: boolean
    isValid: boolean
    currentValue: any
    lastUpdated?: Date
    error?: string
  }
}

/**
 * 数据绑定管理器
 */
export class DataBindingManager {
  private dataSources = new Map<string, DataSource>()
  private bindings = new Map<string, ComponentDataBinding>()
  private bindingStatuses = new Map<string, DataBindingStatus>()
  private updateCallbacks = new Map<string, Array<(data: any) => void>>()

  /**
   * 注册数据源
   */
  registerDataSource(dataSource: DataSource) {
    this.dataSources.set(dataSource.getId(), dataSource)
    console.log(`📊 [DataBindingManager] 注册数据源: ${dataSource.getId()} (${dataSource.getType()})`)
  }

  /**
   * 移除数据源
   */
  removeDataSource(dataSourceId: string) {
    this.dataSources.delete(dataSourceId)

    // 清理相关绑定
    const bindingsToRemove: string[] = []
    for (const [bindingId, binding] of this.bindings.entries()) {
      if (binding.dataSourceId === dataSourceId) {
        bindingsToRemove.push(bindingId)
      }
    }

    bindingsToRemove.forEach(bindingId => {
      this.removeBinding(bindingId)
    })

    console.log(`🗑️ [DataBindingManager] 移除数据源: ${dataSourceId}`)
  }

  /**
   * 创建组件数据绑定
   */
  createBinding(binding: ComponentDataBinding): string {
    const bindingId = `${binding.componentId}-${binding.componentInstanceId || 'default'}`

    this.bindings.set(bindingId, binding)
    this.bindingStatuses.set(bindingId, {})

    console.log(`🔗 [DataBindingManager] 创建绑定: ${bindingId}`, binding)

    // 立即更新绑定状态
    this.updateBinding(bindingId)

    return bindingId
  }

  /**
   * 移除绑定
   */
  removeBinding(bindingId: string) {
    this.bindings.delete(bindingId)
    this.bindingStatuses.delete(bindingId)
    this.updateCallbacks.delete(bindingId)

    console.log(`🗑️ [DataBindingManager] 移除绑定: ${bindingId}`)
  }

  /**
   * 更新绑定配置
   */
  updateBindingConfig(bindingId: string, newConfig: Partial<ComponentDataBinding>) {
    const existingBinding = this.bindings.get(bindingId)
    if (!existingBinding) {
      console.warn(`⚠️ [DataBindingManager] 绑定不存在: ${bindingId}`)
      return
    }

    const updatedBinding = { ...existingBinding, ...newConfig }
    this.bindings.set(bindingId, updatedBinding)

    console.log(`🔄 [DataBindingManager] 更新绑定配置: ${bindingId}`)

    // 立即更新绑定状态
    this.updateBinding(bindingId)
  }

  /**
   * 订阅数据更新
   */
  subscribe(bindingId: string, callback: (data: any) => void) {
    if (!this.updateCallbacks.has(bindingId)) {
      this.updateCallbacks.set(bindingId, [])
    }

    this.updateCallbacks.get(bindingId)!.push(callback)

    // 立即触发一次回调
    const currentData = this.getCurrentData(bindingId)
    if (currentData) {
      callback(currentData)
    }

    console.log(`📺 [DataBindingManager] 订阅绑定更新: ${bindingId}`)
  }

  /**
   * 取消订阅
   */
  unsubscribe(bindingId: string, callback: (data: any) => void) {
    const callbacks = this.updateCallbacks.get(bindingId)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  /**
   * 手动刷新绑定数据
   */
  async refreshBinding(bindingId: string) {
    await this.updateBinding(bindingId)
  }

  /**
   * 获取绑定状态
   */
  getBindingStatus(bindingId: string): DataBindingStatus | undefined {
    return this.bindingStatuses.get(bindingId)
  }

  /**
   * 获取当前绑定数据
   */
  getCurrentData(bindingId: string): any {
    const status = this.bindingStatuses.get(bindingId)
    if (!status) return null

    const data: any = {}
    for (const [field, fieldStatus] of Object.entries(status)) {
      if (fieldStatus.isValid) {
        data[field] = fieldStatus.currentValue
      }
    }

    return data
  }

  /**
   * 更新绑定状态（核心方法）
   */
  private async updateBinding(bindingId: string) {
    const binding = this.bindings.get(bindingId)
    if (!binding) return

    const dataSource = this.dataSources.get(binding.dataSourceId)
    if (!dataSource) {
      console.warn(`⚠️ [DataBindingManager] 数据源不存在: ${binding.dataSourceId}`)
      return
    }

    try {
      // 获取组件数据需求
      const componentSchema = componentSchemaManager.getSchema(binding.componentId)
      if (!componentSchema) {
        console.warn(`⚠️ [DataBindingManager] 组件数据需求未注册: ${binding.componentId}`)
        return
      }

      // 从数据源获取原始数据
      const sourceData = await dataSource.getValue()
      const newStatus: DataBindingStatus = {}
      const componentData: any = {}

      // 处理每个组件字段
      for (const [componentField, fieldDef] of Object.entries(componentSchema)) {
        const bindingConfig = binding.bindingConfig[componentField]

        if (bindingConfig) {
          // 有绑定配置，从数据源提取值
          const rawValue = sourceData[componentField]
          let finalValue = rawValue

          // 应用数据转换
          if (bindingConfig.transform && rawValue !== undefined) {
            try {
              finalValue = bindingConfig.transform(rawValue)
            } catch (error) {
              console.warn(`⚠️ [DataBindingManager] 数据转换失败:`, error)
              finalValue = bindingConfig.fallbackValue ?? fieldDef.defaultValue
            }
          }

          // 如果值为undefined，使用fallback或默认值
          if (finalValue === undefined) {
            finalValue = bindingConfig.fallbackValue ?? fieldDef.defaultValue
          }

          newStatus[componentField] = {
            isBound: true,
            isValid: finalValue !== undefined,
            currentValue: finalValue,
            lastUpdated: new Date()
          }

          componentData[componentField] = finalValue
        } else {
          // 没有绑定配置，使用默认值
          const defaultValue = fieldDef.defaultValue

          newStatus[componentField] = {
            isBound: false,
            isValid: true,
            currentValue: defaultValue,
            lastUpdated: new Date()
          }

          componentData[componentField] = defaultValue
        }
      }

      // 更新绑定状态
      this.bindingStatuses.set(bindingId, newStatus)

      // 验证数据
      const validation = componentSchemaManager.validateComponentData(binding.componentId, componentData)
      if (!validation.isValid) {
        console.warn(`⚠️ [DataBindingManager] 数据验证失败:`, validation.errors)
      }

      // 通知订阅者
      const callbacks = this.updateCallbacks.get(bindingId)
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(componentData)
          } catch (error) {
            console.error(`❌ [DataBindingManager] 回调执行失败:`, error)
          }
        })
      }

      console.log(`✅ [DataBindingManager] 绑定更新成功: ${bindingId}`, componentData)
    } catch (error) {
      console.error(`❌ [DataBindingManager] 绑定更新失败: ${bindingId}`, error)
    }
  }

  /**
   * 获取所有绑定
   */
  getAllBindings(): Array<{ id: string; binding: ComponentDataBinding; status: DataBindingStatus }> {
    const result: Array<{ id: string; binding: ComponentDataBinding; status: DataBindingStatus }> = []

    for (const [bindingId, binding] of this.bindings.entries()) {
      const status = this.bindingStatuses.get(bindingId) || {}
      result.push({ id: bindingId, binding, status })
    }

    return result
  }

  /**
   * 获取数据源列表
   */
  getDataSourceList(): Array<{ id: string; type: string; name?: string }> {
    return Array.from(this.dataSources.values()).map(ds => ({
      id: ds.getId(),
      type: ds.getType(),
      name: ds.exportConfig().name
    }))
  }
}

// 导出单例
export const dataBindingManager = new DataBindingManager()
export default dataBindingManager
