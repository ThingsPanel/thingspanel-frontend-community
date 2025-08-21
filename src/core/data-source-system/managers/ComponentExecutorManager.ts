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
    console.log(`🔧 [ComponentExecutorManager] 更新组件执行器: ${componentId}`, { componentType, config })

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

    // 更新配置
    state.currentConfig = executorConfig

    // 自动执行数据获取
    return await this.executeComponent(componentId)
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
   * 将配置转换为执行器需要的格式
   */
  private convertConfigToExecutorFormat(componentId: string, config: any): SimpleDataSourceConfig | null {
    console.log(`🔄 [ComponentExecutorManager] 转换配置格式: ${componentId}`, config)

    if (!config) {
      console.warn(`⚠️ [ComponentExecutorManager] 配置为空: ${componentId}`)
      return null
    }

    // 处理 dataSourceBindings 格式 (来自 ConfigurationPanel)
    if (config.dataSourceBindings) {
      console.log(`📋 [ComponentExecutorManager] 检测到 dataSourceBindings 格式`)

      const dataSources: any[] = []

      Object.entries(config.dataSourceBindings).forEach(([key, binding]: [string, any]) => {
        if (binding.rawData) {
          try {
            // 尝试解析 rawData
            const parsedData = JSON.parse(binding.rawData)

            dataSources.push({
              id: key,
              type: 'static',
              config: {
                data: parsedData
              }
            })

            console.log(`✅ [ComponentExecutorManager] 转换数据源: ${key}`, parsedData)
          } catch (error) {
            console.error(`❌ [ComponentExecutorManager] 解析 rawData 失败: ${key}`, error)
          }
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
    if (typeof config === 'object' && !Array.isArray(config)) {
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

    if (!executionData) {
      return {}
    }

    // 如果是多数据源执行结果，需要将每个数据源的数据提取出来
    const adaptedData: Record<string, any> = {}

    Object.entries(executionData).forEach(([dataSourceId, dataSourceResult]: [string, any]) => {
      if (dataSourceResult && dataSourceResult.data !== undefined) {
        adaptedData[dataSourceId] = dataSourceResult.data
        console.log(`✅ [ComponentExecutorManager] 适配数据源 ${dataSourceId}:`, dataSourceResult.data)
      }
    })

    console.log(`✅ [ComponentExecutorManager] 最终适配结果:`, adaptedData)
    return adaptedData
  }

  /**
   * 通知所有数据更新回调
   */
  private notifyDataUpdate(componentId: string, data: any): void {
    console.log(`📡 [ComponentExecutorManager] 通知数据更新: ${componentId}`)

    this.dataUpdateCallbacks.forEach(callback => {
      try {
        callback(componentId, data)
      } catch (error) {
        console.error(`❌ [ComponentExecutorManager] 数据更新回调执行失败:`, error)
      }
    })
  }

  /**
   * 添加数据更新回调
   */
  onDataUpdate(callback: ComponentDataUpdateCallback): () => void {
    this.dataUpdateCallbacks.add(callback)

    // 返回取消监听的函数
    return () => {
      this.dataUpdateCallbacks.delete(callback)
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
