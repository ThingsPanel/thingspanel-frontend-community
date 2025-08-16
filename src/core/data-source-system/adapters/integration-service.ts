/**
 * 数据源系统集成服务
 * 提供完整的组件数据管理解决方案，支持所有组件类型的无缝集成
 */

import type {
  ComponentDataRequirement,
  UserDataSourceInput,
  SimpleDataSourceConfig,
  ComponentData,
  ComponentType,
  ExecutionResult
} from '../types/simple-types'

import { SimpleConfigGenerator } from '../core/simple-config-generator'
import { SimpleDataExecutor } from '../core/simple-data-executor'
import { componentDataAdapter } from './component-data-adapter'

/**
 * 组件数据绑定信息
 */
interface ComponentBinding {
  componentId: string
  componentType: ComponentType
  config: SimpleDataSourceConfig
  pollingId?: string
  isActive: boolean
  lastUpdated: number
  onDataChange?: (adaptedData: any) => void
}

/**
 * 集成服务配置
 */
interface IntegrationServiceConfig {
  /** 是否启用自动清理 */
  enableAutoCleanup: boolean
  /** 默认轮询间隔（毫秒） */
  defaultPollingInterval: number
  /** 是否启用调试日志 */
  enableDebugLogs: boolean
}

/**
 * 数据源系统集成服务
 * 这是使用简化数据源系统的统一入口
 */
export class DataSourceIntegrationService {
  private configGenerator: SimpleConfigGenerator
  private dataExecutor: SimpleDataExecutor
  private componentBindings = new Map<string, ComponentBinding>()
  private config: IntegrationServiceConfig

  constructor(config: Partial<IntegrationServiceConfig> = {}) {
    this.configGenerator = new SimpleConfigGenerator()
    this.dataExecutor = new SimpleDataExecutor()

    this.config = {
      enableAutoCleanup: true,
      defaultPollingInterval: 30000,
      enableDebugLogs: true,
      ...config
    }

    // 启用自动清理
    if (this.config.enableAutoCleanup) {
      this.setupAutoCleanup()
    }

    this.log('🎯 数据源集成服务已初始化')
  }

  /**
   * 为组件配置数据源
   * 完整流程：需求声明 → 用户配置 → 生成配置 → 保存绑定
   */
  async configureComponent(
    componentId: string,
    requirement: ComponentDataRequirement,
    userInputs: UserDataSourceInput[]
  ): Promise<SimpleDataSourceConfig> {
    this.log(`🔧 配置组件数据源: ${componentId}`)

    try {
      // 1. 生成配置
      const config = this.configGenerator.generateConfig(requirement, userInputs)

      // 2. 验证配置
      const validation = this.configGenerator.validateConfig(config)
      if (!validation.valid) {
        throw new Error(`配置验证失败: ${validation.errors.join(', ')}`)
      }

      // 3. 检测组件类型
      const componentType = componentDataAdapter.detectComponentType(componentId)

      // 4. 保存组件绑定信息
      const binding: ComponentBinding = {
        componentId,
        componentType,
        config,
        isActive: false,
        lastUpdated: Date.now()
      }

      this.componentBindings.set(componentId, binding)

      this.log(`✅ 组件配置完成: ${componentId} (${componentType})`)
      return config
    } catch (error) {
      this.log(`❌ 组件配置失败: ${componentId}`, error)
      throw error
    }
  }

  /**
   * 启动组件数据绑定
   * 开始响应式数据更新，适配数据格式并通知组件
   */
  startComponentDataBinding(componentId: string, onDataChange: (adaptedData: any) => void): string {
    this.log(`🚀 启动组件数据绑定: ${componentId}`)

    const binding = this.componentBindings.get(componentId)
    if (!binding) {
      throw new Error(`组件未配置: ${componentId}`)
    }

    // 如果已经激活，先停止之前的绑定
    if (binding.isActive && binding.pollingId) {
      this.dataExecutor.stopPolling(binding.pollingId)
    }

    // 启动数据轮询，包装数据适配逻辑
    const pollingId = this.dataExecutor.startPolling(binding.config, (componentData: ComponentData) => {
      try {
        // 适配数据格式
        const adaptedData = componentDataAdapter.adaptForComponent(componentData, binding.componentType)

        // 更新绑定信息
        binding.lastUpdated = Date.now()

        // 通知组件
        onDataChange(adaptedData)

        this.log(`📊 组件数据已更新: ${componentId}`)
      } catch (error) {
        this.log(`❌ 数据适配失败: ${componentId}`, error)
      }
    })

    // 更新绑定状态
    binding.pollingId = pollingId
    binding.isActive = true
    binding.onDataChange = onDataChange

    this.log(`✅ 数据绑定已启动: ${componentId} (${pollingId})`)
    return pollingId
  }

  /**
   * 停止组件数据绑定
   */
  stopComponentDataBinding(componentId: string): void {
    this.log(`⏹️ 停止组件数据绑定: ${componentId}`)

    const binding = this.componentBindings.get(componentId)
    if (binding && binding.pollingId) {
      this.dataExecutor.stopPolling(binding.pollingId)
      binding.isActive = false
      binding.pollingId = undefined
      binding.onDataChange = undefined

      this.log(`✅ 数据绑定已停止: ${componentId}`)
    }
  }

  /**
   * 立即执行组件数据获取
   * 用于手动触发或一次性数据获取
   */
  async executeComponentData(componentId: string): Promise<any> {
    this.log(`⚡ 立即执行组件数据: ${componentId}`)

    const binding = this.componentBindings.get(componentId)
    if (!binding) {
      throw new Error(`组件未配置: ${componentId}`)
    }

    try {
      // 执行数据源
      const result = await this.dataExecutor.execute(binding.config)

      if (!result.success) {
        throw new Error(result.error || '数据执行失败')
      }

      // 适配数据格式
      const adaptedData = componentDataAdapter.adaptForComponent(result.data!, binding.componentType)

      // 更新绑定信息
      binding.lastUpdated = Date.now()

      this.log(`✅ 组件数据执行完成: ${componentId}`)
      return adaptedData
    } catch (error) {
      this.log(`❌ 组件数据执行失败: ${componentId}`, error)
      throw error
    }
  }

  /**
   * 获取组件绑定状态
   */
  getComponentBindingStatus(componentId: string): ComponentBinding | null {
    return this.componentBindings.get(componentId) || null
  }

  /**
   * 获取所有组件绑定状态
   */
  getAllBindingStatus(): ComponentBinding[] {
    return Array.from(this.componentBindings.values())
  }

  /**
   * 移除组件配置
   */
  removeComponent(componentId: string): void {
    this.log(`🗑️ 移除组件配置: ${componentId}`)

    // 先停止数据绑定
    this.stopComponentDataBinding(componentId)

    // 移除绑定信息
    this.componentBindings.delete(componentId)

    this.log(`✅ 组件已移除: ${componentId}`)
  }

  /**
   * 清理所有组件绑定
   */
  cleanup(): void {
    this.log('🧹 清理所有组件绑定')

    // 停止所有数据绑定
    for (const [componentId] of this.componentBindings) {
      this.stopComponentDataBinding(componentId)
    }

    // 清理执行器资源
    this.dataExecutor.cleanup()

    // 清空绑定信息
    this.componentBindings.clear()

    this.log('✅ 清理完成')
  }

  /**
   * 获取系统状态概览
   */
  getSystemStatus(): {
    totalComponents: number
    activeBindings: number
    executorStatus: any
    memoryUsage: {
      bindingsCount: number
      pollingTasks: number
      webSocketConnections: number
    }
  } {
    const totalComponents = this.componentBindings.size
    const activeBindings = Array.from(this.componentBindings.values()).filter(binding => binding.isActive).length

    const executorStatus = this.dataExecutor.getExecutionStatus()

    return {
      totalComponents,
      activeBindings,
      executorStatus,
      memoryUsage: {
        bindingsCount: totalComponents,
        pollingTasks: executorStatus.activePolling,
        webSocketConnections: executorStatus.activeWebSockets
      }
    }
  }

  /**
   * 便捷方法：一键配置并启动组件
   */
  async setupComponent(
    componentId: string,
    requirement: ComponentDataRequirement,
    userInputs: UserDataSourceInput[],
    onDataChange: (adaptedData: any) => void
  ): Promise<string> {
    // 1. 配置组件
    await this.configureComponent(componentId, requirement, userInputs)

    // 2. 启动数据绑定
    const pollingId = this.startComponentDataBinding(componentId, onDataChange)

    this.log(`🎯 组件一键设置完成: ${componentId}`)
    return pollingId
  }

  /**
   * 设置自动清理
   */
  private setupAutoCleanup(): void {
    // 页面卸载时自动清理
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup()
      })
    }
  }

  /**
   * 日志输出
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.enableDebugLogs) {
      console.log(`[DataSourceIntegration] ${message}`, ...args)
    }
  }
}

/**
 * 导出默认集成服务实例
 */
export const dataSourceIntegration = new DataSourceIntegrationService()

/**
 * 导出便捷使用的函数接口
 */
export const dataSourceAPI = {
  /**
   * 配置组件数据源
   */
  configure: (componentId: string, requirement: ComponentDataRequirement, userInputs: UserDataSourceInput[]) =>
    dataSourceIntegration.configureComponent(componentId, requirement, userInputs),

  /**
   * 启动组件数据绑定
   */
  start: (componentId: string, onDataChange: (data: any) => void) =>
    dataSourceIntegration.startComponentDataBinding(componentId, onDataChange),

  /**
   * 停止组件数据绑定
   */
  stop: (componentId: string) => dataSourceIntegration.stopComponentDataBinding(componentId),

  /**
   * 立即执行数据获取
   */
  execute: (componentId: string) => dataSourceIntegration.executeComponentData(componentId),

  /**
   * 一键设置组件
   */
  setup: (
    componentId: string,
    requirement: ComponentDataRequirement,
    userInputs: UserDataSourceInput[],
    onDataChange: (data: any) => void
  ) => dataSourceIntegration.setupComponent(componentId, requirement, userInputs, onDataChange),

  /**
   * 获取系统状态
   */
  status: () => dataSourceIntegration.getSystemStatus(),

  /**
   * 清理资源
   */
  cleanup: () => dataSourceIntegration.cleanup()
}
