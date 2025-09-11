/**
 * 交互配置同步桥梁
 * 解决 InteractionManager 临时状态与 ConfigurationManager 持久化存储之间的数据流断层问题
 *
 * 核心功能：
 * - 监听 InteractionManager 的状态变化
 * - 将交互状态同步到 ConfigurationManager
 * - 确保配置面板能读取到最新的交互修改
 * - 避免循环更新和性能问题
 */

import { configurationIntegrationBridge as configurationManager } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import type { ComponentInteractionState } from '@/card2.1/core/interaction-types'
import type { WidgetConfiguration, ComponentConfiguration } from '@/components/visual-editor/configuration/types'

/**
 * 状态同步配置
 */
interface SyncConfig {
  /** 防抖延迟（毫秒） */
  debounceDelay: number
  /** 是否启用批量同步 */
  enableBatch: boolean
  /** 最大批量大小 */
  maxBatchSize: number
}

/**
 * 状态同步记录
 */
interface SyncRecord {
  componentId: string
  updates: Partial<ComponentInteractionState>
  timestamp: number
  synced: boolean
}

/**
 * 交互配置同步桥梁类
 */
export class InteractionConfigBridge {
  private syncConfig: SyncConfig = {
    debounceDelay: 200,
    enableBatch: true,
    maxBatchSize: 10
  }

  // 防抖定时器
  private debounceTimers = new Map<string, NodeJS.Timeout>()

  // 批量同步队列
  private syncQueue = new Map<string, SyncRecord>()

  // 循环更新保护
  private isUpdating = new Set<string>()

  // 同步版本号（用于去重）
  private versionMap = new Map<string, number>()

  /**
   * 将 InteractionManager 状态同步到 ConfigurationManager
   */
  syncInteractionStateToConfig(componentId: string, updates: Partial<ComponentInteractionState>): void {
    // 防止循环更新
    if (this.isUpdating.has(componentId)) {
      return
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 [InteractionConfigBridge] 开始同步状态到配置`, {
      componentId,
      updates,
      当前版本: this.versionMap.get(componentId) || 0
    })
    }

    // 记录同步请求
    const syncRecord: SyncRecord = {
      componentId,
      updates,
      timestamp: Date.now(),
      synced: false
    }

    this.syncQueue.set(componentId, syncRecord)

    // 防抖处理
    this.debouncedSync(componentId)
  }

  /**
   * 防抖同步处理
   */
  private debouncedSync(componentId: string): void {
    // 清除之前的定时器
    const existingTimer = this.debounceTimers.get(componentId)
    if (existingTimer) {
      clearTimeout(existingTimer)
    }

    // 设置新的防抖定时器
    const timer = setTimeout(() => {
      this.executSync(componentId)
      this.debounceTimers.delete(componentId)
    }, this.syncConfig.debounceDelay)

    this.debounceTimers.set(componentId, timer)
  }

  /**
   * 执行实际的同步操作
   */
  private executSync(componentId: string): void {
    const syncRecord = this.syncQueue.get(componentId)
    if (!syncRecord || syncRecord.synced) {
      return
    }

    // 设置更新保护锁
    this.isUpdating.add(componentId)

    try {
      // 转换状态更新为组件配置格式
      const componentConfig = this.convertStateToComponentConfig(syncRecord.updates)

      // 获取当前配置
      let currentConfig = configurationManager.getConfiguration(componentId)
      if (!currentConfig) {
        // 如果配置不存在，初始化默认配置
        configurationManager.initializeConfiguration(componentId)
        currentConfig = configurationManager.getConfiguration(componentId)
      }

      if (currentConfig) {
        // 更新版本号
        const currentVersion = this.versionMap.get(componentId) || 0
        const newVersion = currentVersion + 1
        this.versionMap.set(componentId, newVersion)

        // 合并到现有的组件配置
        const mergedComponentConfig: ComponentConfiguration = {
          properties: {
            ...currentConfig.component.properties,
            ...componentConfig.properties
          },
          styles: {
            ...currentConfig.component.styles,
            ...componentConfig.styles
          },
          behavior: {
            ...currentConfig.component.behavior,
            ...componentConfig.behavior
          },
          validation: currentConfig.component.validation || {
            required: [],
            rules: {}
          }
        }

        // 更新到 ConfigurationManager
        configurationManager.updateConfiguration(componentId, 'component', mergedComponentConfig)

        // 标记为已同步
        syncRecord.synced = true

        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ [InteractionConfigBridge] 同步完成`, {
          componentId,
          newVersion,
          mergedConfig: mergedComponentConfig,
          originalUpdates: syncRecord.updates
        })
        }
      }
    } catch (error) {
      console.error(`❌ [InteractionConfigBridge] 同步失败`, {
        componentId,
        error: error instanceof Error ? error.message : error,
        syncRecord
      })
    } finally {
      // 释放更新保护锁
      setTimeout(() => {
        this.isUpdating.delete(componentId)
      }, 100) // 100ms延迟确保所有响应式更新完成
    }
  }

  /**
   * 将交互状态转换为组件配置格式
   */
  private convertStateToComponentConfig(updates: Partial<ComponentInteractionState>): ComponentConfiguration {
    const properties: Record<string, any> = {}
    const styles: Record<string, any> = {}
    const behavior: Record<string, any> = {}

    // 转换状态字段到配置字段
    for (const [key, value] of Object.entries(updates)) {
      switch (key) {
        // 🔥 关键属性映射
        case 'deviceId':
          properties.deviceId = value
          break
        case 'metricsList':
          properties.metricsList = value
          break

        // 自定义属性（Card2.1 组件特有）
        case 'title':
          if (!properties.customize) properties.customize = {}
          properties.customize.title = value
          break
        case 'content':
          if (!properties.customize) properties.customize = {}
          properties.customize.content = value
          break
        case 'themeColor':
          if (!properties.customize) properties.customize = {}
          properties.customize.themeColor = value
          break

        // 样式相关属性
        case 'backgroundColor':
          styles.backgroundColor = value
          break
        case 'textColor':
          styles.color = value
          break
        case 'borderColor':
          styles.borderColor = value
          break
        case 'fontSize':
          if (!properties.customize) properties.customize = {}
          properties.customize.fontSize = value
          break
        case 'opacity':
          styles.opacity = value
          break
        case 'visibility':
          styles.visibility = value
          styles.display = value === 'visible' ? 'block' : 'none'
          break

        // 尺寸相关
        case 'width':
          styles.width = typeof value === 'number' ? `${value}px` : value
          break
        case 'height':
          styles.height = typeof value === 'number' ? `${value}px` : value
          break

        // 变换相关
        case 'transform':
          styles.transform = value
          break

        // 行为相关
        case 'disabled':
          behavior.disabled = value
          break
        case 'readonly':
          behavior.readonly = value
          break

        // 默认情况：作为通用属性处理
        default:
          properties[key] = value
          break
      }
    }

    return {
      properties,
      styles,
      behavior,
      validation: {
        required: [],
        rules: {}
      }
    }
  }

  /**
   * 从配置管理器读取最新的交互相关配置
   */
  getLatestInteractionConfig(componentId: string): Partial<ComponentInteractionState> | null {
    const config = configurationManager.getConfiguration(componentId)
    if (!config || !config.component) {
      return null
    }

    // 将配置转换回交互状态格式
    return this.convertComponentConfigToState(config.component)
  }

  /**
   * 将组件配置转换回交互状态格式
   */
  private convertComponentConfigToState(componentConfig: ComponentConfiguration): Partial<ComponentInteractionState> {
    const state: Partial<ComponentInteractionState> = {}

    // 从 properties 提取
    if (componentConfig.properties) {
      const { properties } = componentConfig

      // 设备相关属性
      if (properties.deviceId !== undefined) {
        state.deviceId = properties.deviceId
      }
      if (properties.metricsList !== undefined) {
        state.metricsList = properties.metricsList
      }

      // 自定义属性
      if (properties.customize) {
        if (properties.customize.title !== undefined) {
          state.title = properties.customize.title
        }
        if (properties.customize.content !== undefined) {
          state.content = properties.customize.content
        }
        if (properties.customize.themeColor !== undefined) {
          state.themeColor = properties.customize.themeColor
        }
        if (properties.customize.fontSize !== undefined) {
          state.fontSize = properties.customize.fontSize
        }
      }

      // 其他通用属性
      Object.keys(properties).forEach(key => {
        if (!['deviceId', 'metricsList', 'customize'].includes(key)) {
          state[key] = properties[key]
        }
      })
    }

    // 从 styles 提取
    if (componentConfig.styles) {
      const { styles } = componentConfig

      if (styles.backgroundColor !== undefined) {
        state.backgroundColor = styles.backgroundColor
      }
      if (styles.color !== undefined) {
        state.textColor = styles.color
      }
      if (styles.borderColor !== undefined) {
        state.borderColor = styles.borderColor
      }
      if (styles.opacity !== undefined) {
        state.opacity = styles.opacity
      }
      if (styles.visibility !== undefined) {
        state.visibility = styles.visibility
      }
      if (styles.width !== undefined) {
        state.width = styles.width
      }
      if (styles.height !== undefined) {
        state.height = styles.height
      }
      if (styles.transform !== undefined) {
        state.transform = styles.transform
      }
    }

    // 从 behavior 提取
    if (componentConfig.behavior) {
      const { behavior } = componentConfig

      if (behavior.disabled !== undefined) {
        state.disabled = behavior.disabled
      }
      if (behavior.readonly !== undefined) {
        state.readonly = behavior.readonly
      }
    }

    return state
  }

  /**
   * 清理指定组件的同步状态
   */
  cleanup(componentId: string): void {
    // 清除防抖定时器
    const timer = this.debounceTimers.get(componentId)
    if (timer) {
      clearTimeout(timer)
      this.debounceTimers.delete(componentId)
    }

    // 清除同步队列
    this.syncQueue.delete(componentId)

    // 清除保护锁和版本记录
    this.isUpdating.delete(componentId)
    this.versionMap.delete(componentId)
  }

  /**
   * 批量同步多个组件（性能优化）
   */
  batchSync(updates: Array<{ componentId: string; updates: Partial<ComponentInteractionState> }>): void {
    if (!this.syncConfig.enableBatch) {
      // 如果未启用批量同步，逐一处理
      updates.forEach(({ componentId, updates: componentUpdates }) => {
        this.syncInteractionStateToConfig(componentId, componentUpdates)
      })
      return
    }

    // 批量处理逻辑
    const batches = this.createBatches(updates, this.syncConfig.maxBatchSize)
    batches.forEach((batch, index) => {
      setTimeout(() => {
        batch.forEach(({ componentId, updates: componentUpdates }) => {
          this.syncInteractionStateToConfig(componentId, componentUpdates)
        })
      }, index * 50) // 50ms间隔避免阻塞
    })
  }

  /**
   * 创建批量处理分组
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }
    return batches
  }

  /**
   * 获取同步状态统计
   */
  getSyncStats(): {
    pendingSyncs: number
    totalSyncs: number
    lastSyncTime: number | null
  } {
    const pendingSyncs = Array.from(this.syncQueue.values()).filter(record => !record.synced).length
    const totalSyncs = this.syncQueue.size
    const timestamps = Array.from(this.syncQueue.values()).map(record => record.timestamp)
    const lastSyncTime = timestamps.length > 0 ? Math.max(...timestamps) : null

    return {
      pendingSyncs,
      totalSyncs,
      lastSyncTime
    }
  }
}

// 导出单例实例
export const interactionConfigBridge = new InteractionConfigBridge()

export default interactionConfigBridge
