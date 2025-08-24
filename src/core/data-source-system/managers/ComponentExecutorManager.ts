/**
 * 组件执行器管理器
 * 负责管理所有组件的数据源执行器实例，实现配置变化到数据执行的桥梁
 */

import { ref, reactive, computed } from 'vue'
import { simpleDataExecutor } from '../core/simple-data-executor'
import type { SimpleDataSourceConfig, ExecutionResult } from '../types/simple-types'

/**
 * 组件执行器状态
 */
interface ComponentExecutorState {
  /** 组件ID */
  componentId: string
  /** 组件类型 */
  componentType: string
  /** 当前配置 */
  currentConfig: SimpleDataSourceConfig | null
  /** 最后执行结果 */
  lastResult: ExecutionResult | null
  /** 是否正在执行 */
  isExecuting: boolean
  /** 执行次数 */
  executionCount: number
  /** 最后执行时间 */
  lastExecutionTime: Date | null
  /** 最后错误信息 */
  lastError: string | null
}

/**
 * 组件数据更新回调类型
 */
type ComponentDataUpdateCallback = (componentId: string, data: any) => void

/**
 * 组件执行器管理器类
 */
export class ComponentExecutorManager {
  /** 组件执行器状态映射 */
  private componentStates = reactive(new Map<string, ComponentExecutorState>())

  /** 数据更新回调列表 */
  private dataUpdateCallbacks = new Set<ComponentDataUpdateCallback>()

  /** 全局执行状态 */
  private globalState = reactive({
    totalComponents: 0,
    activeComponents: 0,
    totalExecutions: 0,
    lastGlobalUpdate: null as Date | null
  })

  /**
   * 为组件创建或更新执行器配置
   */
  async updateComponentExecutor(
    componentId: string,
    componentType: string,
    config: any
  ): Promise<ExecutionResult | null> {
    console.log(`🔄 [ComponentExecutorManager] updateComponentExecutor 方法被调用 - 入口参数:`, {
      参数1_componentId: componentId,
      参数2_componentType: componentType,
      参数3_config: config,
      'config详细结构': JSON.stringify(config, null, 2),
      'config.metadata': config?.metadata,
      'config.dataSourceBindings': config?.dataSourceBindings,
      hasForceUpdate: config?.metadata?.forceUpdate
    });

    // 获取或创建组件状态
    let state = this.componentStates.get(componentId)
    if (!state) {
      state = {
        componentId,
        componentType,
        currentConfig: null,
        lastResult: null,
        isExecuting: false,
        executionCount: 0,
        lastExecutionTime: null,
        lastError: null
      }
      this.componentStates.set(componentId, state)
      this.globalState.totalComponents++
      console.log(`✅ [ComponentExecutorManager] 创建新组件状态: ${componentId}`)
    }

    // 转换配置为执行器需要的格式
    const executorConfig = this.convertConfigToExecutorFormat(componentId, config)

    if (!executorConfig) {
      console.warn(`⚠️ [ComponentExecutorManager] 无法转换配置为执行器格式: ${componentId}`)
      state.lastError = '配置格式无效'
      return null
    }

    // 🔥 修复：检查是否有强制更新标记
    const hasForceUpdate = config.metadata?.forceUpdate
    const lastChangedField = config.metadata?.lastChangedField
    
    console.log(`🔍 [ComponentExecutorManager] 强制更新检查详情: ${componentId}`, {
      hasForceUpdate,
      lastChangedField,
      'config.metadata': config.metadata,
      'metadata完整结构': JSON.stringify(config.metadata, null, 2)
    })
    
    // 🔥 修复：检查配置是否真正发生变化，避免不必要的重复执行
    const configChanged = this.isConfigChanged(state.currentConfig, executorConfig)
    
    console.log(`🔍 [ComponentExecutorManager] 配置变化检查结果: ${componentId}`, {
      configChanged,
      hasForceUpdate,
      '旧配置存在': !!state.currentConfig,
      '新配置存在': !!executorConfig
    })
    
    // 更新配置
    state.currentConfig = executorConfig

    // 🔥 修复：强制更新或配置真正变化时才重新执行
    if (hasForceUpdate || configChanged) {
      console.log(`🔄 [ComponentExecutorManager] 触发数据重新执行: ${componentId}`, {
        configChanged,
        forceUpdate: hasForceUpdate,
        lastChangedField,
        reason: hasForceUpdate ? '强制更新' : '配置变更'
      })
      
      // 🔥 修复：如果是强制更新，添加额外的日志信息
      if (hasForceUpdate) {
        console.log(`🔥 [ComponentExecutorManager] 强制更新模式，忽略配置比较结果，直接执行: ${componentId}`)
        console.log(`🔍 [ComponentExecutorManager] 变更字段: ${lastChangedField}`)
      }
      
      // 清除强制更新标记
      if (config.metadata?.forceUpdate) {
        delete config.metadata.forceUpdate
      }
      
      console.log(`🚀 [ComponentExecutorManager] 即将调用executeComponent: ${componentId}`)
      const result = await this.executeComponent(componentId)
      console.log(`✅ [ComponentExecutorManager] executeComponent执行完成: ${componentId}`, result)
      return result
    } else {
      console.log(`⏸️ [ComponentExecutorManager] 配置未变化且无强制更新，跳过执行: ${componentId}`)
      console.log(`⏸️ [ComponentExecutorManager] 跳过执行详情: ${componentId}`, {
        configChanged,
        hasForceUpdate,
        '原因': '配置未变化且无强制更新标记'
      })
      return state.lastResult
    }
  }

  /**
   * 执行指定组件的数据获取
   */
  async executeComponent(componentId: string): Promise<ExecutionResult | null> {
    const state = this.componentStates.get(componentId)
    if (!state || !state.currentConfig) {
      console.warn(`⚠️ [ComponentExecutorManager] 组件未配置或不存在: ${componentId}`)
      return null
    }

    if (state.isExecuting) {
      console.log(`⏳ [ComponentExecutorManager] 组件正在执行中，跳过: ${componentId}`)
      return state.lastResult
    }

    console.log(`🚀 [ComponentExecutorManager] 开始执行组件数据获取: ${componentId}`)

    state.isExecuting = true
    state.lastError = null

    try {
      // 使用数据源系统的执行器
      const result = await simpleDataExecutor.execute(state.currentConfig)

      state.lastResult = result
      state.executionCount++
      state.lastExecutionTime = new Date()
      this.globalState.totalExecutions++
      this.globalState.lastGlobalUpdate = new Date()

      if (result.success && result.data) {
        console.log(`✅ [ComponentExecutorManager] 组件数据执行成功: ${componentId}`, result.data)

        // 适配数据格式并通知回调
        const adaptedData = this.adaptDataForComponent(componentId, result.data)
        this.notifyDataUpdate(componentId, adaptedData)

        // 更新活跃组件计数
        if (!this.isComponentActive(componentId)) {
          this.globalState.activeComponents++
        }

        return result
      } else {
        const errorMsg = result.error || '执行失败，未知原因'
        state.lastError = errorMsg
        console.error(`❌ [ComponentExecutorManager] 组件数据执行失败: ${componentId}`, errorMsg)
        return result
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error)
      state.lastError = errorMsg
      console.error(`❌ [ComponentExecutorManager] 组件数据执行异常: ${componentId}`, error)

      return {
        success: false,
        error: errorMsg,
        executionTime: 0,
        timestamp: Date.now()
      }
    } finally {
      state.isExecuting = false
    }
  }

  /**
   * 检查配置是否发生变化
   */
  private isConfigChanged(oldConfig: SimpleDataSourceConfig | null, newConfig: SimpleDataSourceConfig): boolean {
    if (!oldConfig) {
      return true // 没有旧配置，认为是变化
    }

    try {
      // 深度比较配置对象
      const oldConfigStr = JSON.stringify(oldConfig, null, 0)
      const newConfigStr = JSON.stringify(newConfig, null, 0)
      
      const changed = oldConfigStr !== newConfigStr
      
      if (changed) {
        console.log('🔍 [ComponentExecutorManager] 配置变化详情:', {
          oldConfig: oldConfigStr.substring(0, 200) + '...',
          newConfig: newConfigStr.substring(0, 200) + '...'
        })
      }
      
      return changed
    } catch (error) {
      console.warn('⚠️ [ComponentExecutorManager] 配置比较失败，默认认为已变化:', error)
      return true // 比较失败时，保守地认为配置已变化
    }
  }

  /**
   * 将配置转换为执行器需要的格式
   */
  private convertConfigToExecutorFormat(componentId: string, config: any): SimpleDataSourceConfig | null {
    console.log('🔄 [ComponentExecutorManager] convertConfigToExecutorFormat 开始转换 - 详细分析:', {
      '输入config': config,
      'config完整结构': JSON.stringify(config, null, 2),
      'config类型': typeof config,
      'config是否为null': config === null,
      'config是否为undefined': config === undefined,
      'config.metadata': config?.metadata,
      'config.dataSourceBindings': config?.dataSourceBindings,
      'dataSourceBindings类型': typeof config?.dataSourceBindings,
      'dataSourceBindings是否存在': !!config?.dataSourceBindings,
      hasForceUpdate: config?.metadata?.forceUpdate
    });
    console.log(`🔄 [ComponentExecutorManager] 转换配置格式: ${componentId}`, config)
    console.log(`🔍 [ComponentExecutorManager] 原始配置详细信息:`, JSON.stringify(config, null, 2))

    if (!config) {
      console.warn(`⚠️ [ComponentExecutorManager] 配置为空: ${componentId}`)
      return null
    }

    // 处理 dataSourceBindings 格式 (来自 ConfigurationPanel)
    if (config.dataSourceBindings) {
      console.log(`📋 [ComponentExecutorManager] 检测到 dataSourceBindings 格式 - 开始处理:`, {
        'dataSourceBindings': config.dataSourceBindings,
        'dataSourceBindings完整结构': JSON.stringify(config.dataSourceBindings, null, 2)
      })
      console.log(
        `🔍 [ComponentExecutorManager] dataSourceBindings 详细信息:`,
        JSON.stringify(config.dataSourceBindings, null, 2)
      )

      // 🔥 修复：检查是否有强制更新标记
      const hasForceUpdate = config.metadata?.forceUpdate
      console.log('🔍 [ComponentExecutorManager] 强制更新检查:', { hasForceUpdate, metadata: config.metadata })
      if (hasForceUpdate) {
        console.log(`🔄 [ComponentExecutorManager] 检测到强制更新标记，确保数据刷新`)
      }

      const dataSources: any[] = []

      Object.entries(config.dataSourceBindings).forEach(([key, binding]: [string, any]) => {
        console.log(`🔍 [ComponentExecutorManager] 处理数据源绑定 ${key} - 详细信息:`, {
          key,
          binding,
          'binding完整结构': JSON.stringify(binding, null, 2),
          'binding.rawData': binding?.rawData,
          'rawData类型': typeof binding?.rawData,
          'rawData长度': typeof binding?.rawData === 'string' ? binding.rawData.length : 'N/A'
        })
        
        if (binding.rawData) {
          console.log(`📝 [ComponentExecutorManager] 开始解析 rawData for ${key}:`, {
            'rawData原始值': binding.rawData,
            'rawData类型': typeof binding.rawData,
            hasForceUpdate
          })
          
          try {
            // 🔥 修复：确保获取最新的 rawData
            let rawDataToProcess = binding.rawData
            
            // 如果是强制更新，确保使用最新数据
            if (hasForceUpdate) {
              console.log(`🔄 [ComponentExecutorManager] 强制更新模式，使用最新 rawData: ${key}`, rawDataToProcess)
            }
            
            // 尝试解析 rawData
            const parsedData = JSON.parse(rawDataToProcess)

            dataSources.push({
              id: key,
              type: 'static',
              config: {
                data: parsedData
              }
            })

            console.log(`✅ [ComponentExecutorManager] 转换数据源: ${key}`, {
              '解析前': rawDataToProcess,
              '解析后': parsedData,
              '解析后完整结构': JSON.stringify(parsedData, null, 2)
            })
            console.log(`🔍 [ComponentExecutorManager] 数据源 ${key} 详细数据:`, JSON.stringify(parsedData, null, 2))
          } catch (error) {
            console.error(`❌ [ComponentExecutorManager] 解析 rawData 失败: ${key}`, {
              error,
              '原始rawData': binding.rawData
            })
            console.error(`❌ [ComponentExecutorManager] 原始 rawData:`, binding.rawData)
          }
        } else {
          console.log(`ℹ️ [ComponentExecutorManager] ${key} 没有 rawData`)
        }
      })

      if (dataSources.length > 0) {
        return {
          id: `${componentId}-executor`,
          componentId,
          dataSources,
          triggers: [],
          enabled: true
        }
      }
    }

    // 处理直接的 dataSources 格式
    if (config.dataSources && Array.isArray(config.dataSources)) {
      console.log(`📋 [ComponentExecutorManager] 检测到 dataSources 数组格式`)

      return {
        id: `${componentId}-executor`,
        componentId,
        dataSources: config.dataSources,
        triggers: config.triggers || [],
        enabled: config.enabled !== false
      }
    }

    // 处理简单的 JSON 数据格式 (兼容性)
    // 🔥 修复：排除配置对象格式，只处理真正的数据对象
    if (typeof config === 'object' && !Array.isArray(config) && 
        !config.type && !config.enabled && !config.metadata && !config.activeDataSourceKey) {
      console.log(`📋 [ComponentExecutorManager] 检测到简单对象格式，转换为静态数据源`)

      return {
        id: `${componentId}-executor`,
        componentId,
        dataSources: [
          {
            id: 'main',
            type: 'static',
            config: {
              data: config
            }
          }
        ],
        triggers: [],
        enabled: true
      }
    }

    console.warn(`⚠️ [ComponentExecutorManager] 无法识别的配置格式: ${componentId}`, config)
    return null
  }

  /**
   * 适配数据格式供组件使用
   */
  private adaptDataForComponent(componentId: string, executionData: any): any {
    console.log(`🔄 [ComponentExecutorManager] 适配组件数据: ${componentId}`, executionData)
    console.log(`🔍 [ComponentExecutorManager] 执行数据详细信息:`, JSON.stringify(executionData, null, 2))

    if (!executionData) {
      console.warn(`⚠️ [ComponentExecutorManager] 执行数据为空: ${componentId}`)
      return {}
    }

    // 如果是多数据源执行结果，需要将每个数据源的数据提取出来
    const adaptedData: Record<string, any> = {}

    Object.entries(executionData).forEach(([dataSourceId, dataSourceResult]: [string, any]) => {
      if (dataSourceResult && dataSourceResult.data !== undefined) {
        adaptedData[dataSourceId] = dataSourceResult.data
        console.log(`✅ [ComponentExecutorManager] 适配数据源 ${dataSourceId}:`, dataSourceResult.data)
        console.log(
          `🔍 [ComponentExecutorManager] 数据源 ${dataSourceId} 详细数据:`,
          JSON.stringify(dataSourceResult.data, null, 2)
        )
      } else {
        console.warn(`⚠️ [ComponentExecutorManager] 数据源 ${dataSourceId} 数据无效:`, dataSourceResult)
      }
    })

    console.log(`✅ [ComponentExecutorManager] 最终适配结果:`, adaptedData)
    console.log(`🎯 [ComponentExecutorManager] 最终适配结果详细信息:`, JSON.stringify(adaptedData, null, 2))
    return adaptedData
  }

  /**
   * 通知所有数据更新回调
   */
  private notifyDataUpdate(componentId: string, data: any): void {
    console.log(`📡 [ComponentExecutorManager] 通知数据更新: ${componentId}`)
    console.log(`📡 [ComponentExecutorManager] 通知数据详情:`, JSON.stringify(data, null, 2))
    console.log(`📡 [ComponentExecutorManager] 当前回调数量: ${this.dataUpdateCallbacks.size}`)

    this.dataUpdateCallbacks.forEach((callback, index) => {
      try {
        console.log(`📡 [ComponentExecutorManager] 执行回调 #${index}: ${componentId}`)
        callback(componentId, data)
        console.log(`✅ [ComponentExecutorManager] 回调 #${index} 执行成功`)
      } catch (error) {
        console.error(`❌ [ComponentExecutorManager] 数据更新回调执行失败:`, error)
      }
    })
  }

  /**
   * 添加数据更新回调
   */
  onDataUpdate(callback: ComponentDataUpdateCallback): () => void {
    console.log(`📝 [ComponentExecutorManager] 注册数据更新回调，当前回调数量: ${this.dataUpdateCallbacks.size}`)
    this.dataUpdateCallbacks.add(callback)
    console.log(`📝 [ComponentExecutorManager] 回调注册完成，新的回调数量: ${this.dataUpdateCallbacks.size}`)

    // 返回取消监听的函数
    return () => {
      console.log(`🗑️ [ComponentExecutorManager] 移除数据更新回调，当前回调数量: ${this.dataUpdateCallbacks.size}`)
      this.dataUpdateCallbacks.delete(callback)
      console.log(`🗑️ [ComponentExecutorManager] 回调移除完成，新的回调数量: ${this.dataUpdateCallbacks.size}`)
    }
  }

  /**
   * 获取组件状态
   */
  getComponentState(componentId: string): ComponentExecutorState | null {
    return this.componentStates.get(componentId) || null
  }

  /**
   * 获取所有组件状态
   */
  getAllStates(): ComponentExecutorState[] {
    return Array.from(this.componentStates.values())
  }

  /**
   * 清理组件执行器
   */
  cleanupExecutor(componentId: string): boolean {
    const state = this.componentStates.get(componentId)
    if (state) {
      // 如果组件是活跃的，减少活跃计数
      if (this.isComponentActive(componentId)) {
        this.globalState.activeComponents--
      }

      this.componentStates.delete(componentId)
      this.globalState.totalComponents--

      console.log(`🗑️ [ComponentExecutorManager] 清理组件执行器: ${componentId}`)
      return true
    }
    return false
  }

  /**
   * 检查组件是否活跃（有有效数据）
   */
  private isComponentActive(componentId: string): boolean {
    const state = this.componentStates.get(componentId)
    return !!(state?.lastResult?.success && state.lastResult.data)
  }

  /**
   * 获取全局统计信息
   */
  getGlobalStats() {
    return {
      ...this.globalState,
      states: this.getAllStates()
    }
  }

  /**
   * 暂停组件执行器
   */
  pauseExecutor(componentId: string): boolean {
    const state = this.componentStates.get(componentId)
    if (state && state.currentConfig) {
      state.currentConfig.enabled = false
      console.log(`⏸️ [ComponentExecutorManager] 暂停组件执行器: ${componentId}`)
      return true
    }
    return false
  }

  /**
   * 恢复组件执行器
   */
  resumeExecutor(componentId: string): boolean {
    const state = this.componentStates.get(componentId)
    if (state && state.currentConfig) {
      state.currentConfig.enabled = true
      console.log(`▶️ [ComponentExecutorManager] 恢复组件执行器: ${componentId}`)
      return true
    }
    return false
  }

  /**
   * 批量执行所有组件
   */
  async executeAllComponents(): Promise<Map<string, ExecutionResult | null>> {
    console.log(`🚀 [ComponentExecutorManager] 批量执行所有组件`)

    const results = new Map<string, ExecutionResult | null>()
    const promises: Promise<void>[] = []

    for (const [componentId] of this.componentStates) {
      const promise = this.executeComponent(componentId).then(result => {
        results.set(componentId, result)
      })
      promises.push(promise)
    }

    await Promise.all(promises)
    console.log(`✅ [ComponentExecutorManager] 批量执行完成，共 ${results.size} 个组件`)

    return results
  }
}

// 导出全局单例
export const componentExecutorManager = new ComponentExecutorManager()

export default componentExecutorManager
