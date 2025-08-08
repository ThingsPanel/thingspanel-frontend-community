/**
 * Card 2.1 数据绑定系统适配器
 * 实现Visual Editor与Card 2.1数据绑定系统的集成
 */

import { reactive, ref, computed, type Ref } from 'vue'
import type {
  ComponentDataRequirement,
  DataFieldRequirement,
  ReactiveDataBinding,
  DataBindingConfig,
  DataSource,
  DataTransformPipeline
} from '@/card2.1/core/data-binding/types'
import type { DataSourceConfiguration, EnhancedDataSourceConfig, ValidationResult } from '../configuration/types'
import type {
  DataSourceConfig as UnifiedDataSourceConfig,
  EnhancedDataSourceConfiguration,
  DataSourceValue,
  DataMappingConfig
} from './data-source-types'

/**
 * 适配器状态接口
 */
interface AdapterState {
  /** 是否已初始化 */
  initialized: boolean
  /** 注册的组件需求 */
  componentRequirements: Map<string, ComponentDataRequirement>
  /** 活跃的数据绑定 */
  activeBindings: Map<string, ReactiveDataBinding>
  /** 数据源配置缓存 */
  dataSourceConfigs: Map<string, EnhancedDataSourceConfig>
  /** 错误信息 */
  errors: string[]
}

/**
 * 数据源配置转换器
 */
class DataSourceConfigTransformer {
  /**
   * 将Visual Editor配置转换为Card 2.1格式
   */
  static toCard2Format(config: DataSourceConfiguration): any {
    if (!config.type) return null

    const card2Config = {
      type: config.type,
      config: { ...config.config }
    }

    // 添加刷新间隔配置
    if (config.refreshInterval) {
      card2Config.config.refreshInterval = config.refreshInterval
    }

    // 转换数据映射配置
    if (config.dataMapping) {
      card2Config.config.dataMapping = this.transformDataMapping(config.dataMapping)
    }

    console.log('🔄 [Card2DataBindingAdapter] 转换配置到Card 2.1格式:', card2Config)
    return card2Config
  }

  /**
   * 将统一数据源配置转换为Card 2.1格式
   */
  static fromUnifiedConfig(config: UnifiedDataSourceConfig): any {
    const card2Config = {
      type: config.type,
      name: config.name,
      description: config.description,
      config: { ...config }
    }

    console.log('🔄 [Card2DataBindingAdapter] 从统一配置转换:', card2Config)
    return card2Config
  }

  /**
   * 转换数据映射配置
   */
  private static transformDataMapping(mapping: Record<string, string | ((data: any) => any)>): DataMappingConfig {
    const paths = Object.entries(mapping).map(([target, source]) => {
      if (typeof source === 'string') {
        return {
          key: source,
          target,
          type: 'direct' as const,
          defaultValue: undefined
        }
      } else {
        // 函数类型的映射暂时转换为字符串
        return {
          key: 'calculated',
          target,
          type: 'calculated' as const,
          transformer: source as any,
          defaultValue: undefined
        }
      }
    })

    return {
      paths,
      defaultArrayMode: 'auto',
      defaultArrayIndex: 0,
      enableAutoDetection: true
    }
  }
}

/**
 * 组件需求分析器
 */
class ComponentRequirementAnalyzer {
  /**
   * 从组件定义推断数据需求
   */
  static inferRequirement(componentType: string, componentProps?: any): ComponentDataRequirement {
    console.log('🔍 [Card2DataBindingAdapter] 推断组件数据需求:', componentType, componentProps)

    // 基础需求模板
    const baseRequirement: ComponentDataRequirement = {
      fields: {
        value: {
          type: 'value',
          valueType: 'any',
          required: false,
          description: '组件显示值',
          defaultValue: null,
          example: '示例数据'
        }
      },
      version: '1.0.0',
      description: `${componentType} 组件的数据需求`
    }

    // 根据组件类型定制需求
    switch (componentType) {
      case 'TextWidget':
      case 'text':
        return {
          ...baseRequirement,
          fields: {
            text: {
              type: 'value',
              valueType: 'string',
              required: true,
              description: '文本内容',
              defaultValue: '默认文本',
              example: 'Hello World'
            }
          },
          description: '文本组件数据需求'
        }

      case 'DigitIndicatorWidget':
      case 'digit-indicator':
        return {
          ...baseRequirement,
          fields: {
            value: {
              type: 'value',
              valueType: 'number',
              required: true,
              description: '数值指示器的数值',
              defaultValue: 0,
              example: 42.5
            },
            unit: {
              type: 'value',
              valueType: 'string',
              required: false,
              description: '数值单位',
              defaultValue: '',
              example: '°C'
            }
          },
          description: '数字指示器组件数据需求'
        }

      case 'DataSourceTestWidget':
      case 'datasource-test':
        return {
          ...baseRequirement,
          fields: {
            data: {
              type: 'object',
              required: false,
              description: '从数据源获取的原始数据',
              defaultValue: null,
              example: { temperature: 25.5, humidity: 60, timestamp: Date.now() }
            },
            status: {
              type: 'value',
              valueType: 'string',
              required: false,
              description: '数据源连接状态',
              defaultValue: 'disconnected',
              example: 'connected'
            },
            timestamp: {
              type: 'value',
              valueType: 'number',
              required: false,
              description: '最后更新时间戳',
              defaultValue: null,
              example: Date.now()
            },
            error: {
              type: 'value',
              valueType: 'string',
              required: false,
              description: '错误信息',
              defaultValue: null,
              example: null
            }
          },
          description: '数据源测试组件数据需求 - 用于测试和验证数据源系统功能'
        }

      case 'BarChartWidget':
      case 'bar-chart':
        return {
          ...baseRequirement,
          fields: {
            data: {
              type: 'array',
              required: true,
              description: '柱状图数据数组',
              defaultValue: [],
              example: [
                { name: 'A', value: 10 },
                { name: 'B', value: 20 }
              ]
            },
            xField: {
              type: 'value',
              valueType: 'string',
              required: false,
              description: 'X轴字段名',
              defaultValue: 'name',
              example: 'category'
            },
            yField: {
              type: 'value',
              valueType: 'string',
              required: false,
              description: 'Y轴字段名',
              defaultValue: 'value',
              example: 'amount'
            }
          },
          description: '柱状图组件数据需求'
        }

      case 'ImageWidget':
      case 'image':
        return {
          ...baseRequirement,
          fields: {
            src: {
              type: 'value',
              valueType: 'string',
              required: true,
              description: '图片URL',
              defaultValue: '',
              example: 'https://example.com/image.jpg'
            },
            alt: {
              type: 'value',
              valueType: 'string',
              required: false,
              description: '图片替代文本',
              defaultValue: '',
              example: '图片描述'
            }
          },
          description: '图片组件数据需求'
        }

      default:
        console.log('🔍 [Card2DataBindingAdapter] 使用默认数据需求模板')
        return baseRequirement
    }
  }

  /**
   * 验证组件需求完整性
   */
  static validateRequirement(requirement: ComponentDataRequirement): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 验证必填字段
    if (!requirement.fields || Object.keys(requirement.fields).length === 0) {
      errors.push('组件数据需求必须至少包含一个字段')
    }

    // 验证字段定义
    Object.entries(requirement.fields).forEach(([fieldName, fieldDef]) => {
      if (!fieldDef.type) {
        errors.push(`字段 ${fieldName} 缺少类型定义`)
      }

      if (fieldDef.type === 'value' && !fieldDef.valueType) {
        warnings.push(`字段 ${fieldName} 建议指定具体的值类型`)
      }

      if (fieldDef.required && fieldDef.defaultValue === undefined) {
        warnings.push(`必填字段 ${fieldName} 建议设置默认值`)
      }
    })

    return {
      valid: errors.length === 0,
      errors: errors.map(msg => ({ field: 'requirement', message: msg })),
      warnings: warnings.map(msg => ({ field: 'requirement', message: msg }))
    }
  }
}

/**
 * Card 2.1数据绑定适配器主类
 */
export class Card2DataBindingAdapter {
  private state: AdapterState = reactive({
    initialized: false,
    componentRequirements: new Map(),
    activeBindings: new Map(),
    dataSourceConfigs: new Map(),
    errors: []
  })

  private initializationPromise: Promise<void> | null = null

  /**
   * 初始化适配器
   */
  async initialize(): Promise<void> {
    if (this.state.initialized) {
      console.log('✅ [Card2DataBindingAdapter] 适配器已初始化')
      return
    }

    if (this.initializationPromise) {
      return this.initializationPromise
    }

    console.log('🚀 [Card2DataBindingAdapter] 开始初始化适配器...')

    this.initializationPromise = this.performInitialization()
    await this.initializationPromise

    console.log('✅ [Card2DataBindingAdapter] 适配器初始化完成')
  }

  /**
   * 执行初始化过程
   */
  private async performInitialization(): Promise<void> {
    try {
      // 清理错误信息
      this.state.errors = []

      // 加载默认组件需求配置
      await this.loadDefaultComponentRequirements()

      // 标记为已初始化
      this.state.initialized = true

      console.log('📊 [Card2DataBindingAdapter] 初始化状态:', {
        componentRequirements: this.state.componentRequirements.size,
        activeBindings: this.state.activeBindings.size,
        dataSourceConfigs: this.state.dataSourceConfigs.size
      })
    } catch (error) {
      const errorMsg = `适配器初始化失败: ${error instanceof Error ? error.message : '未知错误'}`
      console.error('❌ [Card2DataBindingAdapter] 初始化错误:', error)
      this.state.errors.push(errorMsg)
      throw new Error(errorMsg)
    }
  }

  /**
   * 加载默认组件需求配置
   */
  private async loadDefaultComponentRequirements(): Promise<void> {
    console.log('📋 [Card2DataBindingAdapter] 加载默认组件需求...')

    // 常用组件类型的默认需求
    const commonComponents = ['TextWidget', 'DigitIndicatorWidget', 'BarChartWidget', 'ImageWidget']

    for (const componentType of commonComponents) {
      const requirement = ComponentRequirementAnalyzer.inferRequirement(componentType)
      this.registerComponentRequirement(componentType, requirement)
    }

    console.log('✅ [Card2DataBindingAdapter] 默认组件需求加载完成')
  }

  /**
   * 注册组件数据需求
   */
  registerComponentRequirement(componentId: string, requirement: ComponentDataRequirement): void {
    console.log('📝 [Card2DataBindingAdapter] 注册组件数据需求:', componentId)

    // 验证需求
    const validation = ComponentRequirementAnalyzer.validateRequirement(requirement)
    if (!validation.valid) {
      const errorMsg = `组件需求验证失败: ${validation.errors?.map(e => e.message).join(', ')}`
      console.error('❌ [Card2DataBindingAdapter] 需求验证失败:', errorMsg)
      throw new Error(errorMsg)
    }

    // 如果有警告，记录日志
    if (validation.warnings?.length) {
      console.warn('⚠️ [Card2DataBindingAdapter] 组件需求警告:', validation.warnings.map(w => w.message).join(', '))
    }

    // 注册需求
    this.state.componentRequirements.set(componentId, requirement)

    console.log('✅ [Card2DataBindingAdapter] 组件需求注册成功:', componentId)
  }

  /**
   * 获取组件数据需求
   */
  getComponentRequirement(componentId: string): ComponentDataRequirement | null {
    const requirement = this.state.componentRequirements.get(componentId)
    if (!requirement) {
      console.log('🔍 [Card2DataBindingAdapter] 组件需求不存在，尝试推断:', componentId)
      // 尝试推断需求
      const inferred = ComponentRequirementAnalyzer.inferRequirement(componentId)
      this.registerComponentRequirement(componentId, inferred)
      return inferred
    }
    return requirement
  }

  /**
   * 创建数据源配置
   */
  createDataSourceConfig(componentId: string, sourceConfig: DataSourceConfiguration): EnhancedDataSourceConfig {
    console.log('🔧 [Card2DataBindingAdapter] 创建数据源配置:', componentId, sourceConfig)

    if (!sourceConfig.type) {
      throw new Error('数据源类型不能为空')
    }

    const enhancedConfig: EnhancedDataSourceConfig = {
      id: `${componentId}_${Date.now()}`,
      name: `${componentId} 数据源`,
      description: `组件 ${componentId} 的数据源配置`,
      source: DataSourceConfigTransformer.toCard2Format(sourceConfig),
      dataMapping: sourceConfig.dataMapping
        ? DataSourceConfigTransformer.transformDataMapping(sourceConfig.dataMapping)
        : undefined,
      refreshInterval: sourceConfig.refreshInterval,
      enableCache: sourceConfig.enableCache,
      cacheTimeout: sourceConfig.cacheTimeout,
      retry: {
        maxAttempts: sourceConfig.retryAttempts || 3,
        delay: 1000,
        exponentialBackoff: true
      },
      validation: {
        validateResponse: true,
        errorThreshold: 0.1
      },
      monitoring: {
        enabled: true,
        metrics: ['response_time', 'error_rate', 'success_rate'],
        alertThresholds: {
          error_rate: 0.1,
          response_time: 5000
        }
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDefault: false
    }

    // 缓存配置
    this.state.dataSourceConfigs.set(enhancedConfig.id!, enhancedConfig)

    console.log('✅ [Card2DataBindingAdapter] 数据源配置创建成功:', enhancedConfig.id)
    return enhancedConfig
  }

  /**
   * 创建数据绑定
   */
  createDataBinding(componentId: string, config: EnhancedDataSourceConfig): string {
    console.log('🔗 [Card2DataBindingAdapter] 创建数据绑定:', componentId)

    const requirement = this.getComponentRequirement(componentId)
    if (!requirement) {
      throw new Error(`组件 ${componentId} 的数据需求未找到`)
    }

    const bindingId = `binding_${componentId}_${Date.now()}`

    // 创建Card 2.1格式的绑定配置
    const bindingConfig: DataBindingConfig = {
      id: bindingId,
      componentId,
      requirement,
      pipelineConfig: {
        source: {
          type: config.source.type as any,
          config: config.source.config
        },
        processors: [],
        mappingRules: config.dataMapping?.paths || []
      },
      triggerConfigs: [
        {
          type: 'timer',
          config: {
            interval: (config.refreshInterval || 30) * 1000
          }
        }
      ],
      autoStart: true
    }

    console.log('📊 [Card2DataBindingAdapter] 绑定配置:', bindingConfig)

    // 这里应该调用Card 2.1的DataBindingManager来创建实际的绑定
    // 由于当前是MVP阶段，暂时模拟绑定创建
    const mockBinding: ReactiveDataBinding = {
      id: bindingId,
      componentId,
      pipeline: null as any, // 实际实现时需要创建真正的Pipeline
      triggers: [],
      onDataChange: (newData, oldData) => {
        console.log('📡 [Card2DataBindingAdapter] 数据更新:', { newData, oldData })
      },
      onError: error => {
        console.error('❌ [Card2DataBindingAdapter] 数据绑定错误:', error)
      },
      start: async () => {
        console.log('▶️ [Card2DataBindingAdapter] 启动数据绑定:', bindingId)
      },
      stop: async () => {
        console.log('⏹️ [Card2DataBindingAdapter] 停止数据绑定:', bindingId)
      },
      refresh: async () => {
        console.log('🔄 [Card2DataBindingAdapter] 刷新数据绑定:', bindingId)
      },
      getCurrentData: () => {
        console.log('📊 [Card2DataBindingAdapter] 获取当前数据:', bindingId)
        return {}
      },
      isActive: () => true
    }

    this.state.activeBindings.set(bindingId, mockBinding)

    console.log('✅ [Card2DataBindingAdapter] 数据绑定创建成功:', bindingId)
    return bindingId
  }

  /**
   * 获取数据绑定
   */
  getDataBinding(bindingId: string): ReactiveDataBinding | null {
    return this.state.activeBindings.get(bindingId) || null
  }

  /**
   * 移除数据绑定
   */
  removeDataBinding(bindingId: string): boolean {
    const binding = this.state.activeBindings.get(bindingId)
    if (binding) {
      binding.stop()
      this.state.activeBindings.delete(bindingId)
      console.log('🗑️ [Card2DataBindingAdapter] 数据绑定已移除:', bindingId)
      return true
    }
    return false
  }

  /**
   * 获取组件的所有绑定
   */
  getComponentBindings(componentId: string): ReactiveDataBinding[] {
    return Array.from(this.state.activeBindings.values()).filter(binding => binding.componentId === componentId)
  }

  /**
   * 获取适配器状态
   */
  getState() {
    return {
      initialized: this.state.initialized,
      componentRequirements: this.state.componentRequirements.size,
      activeBindings: this.state.activeBindings.size,
      dataSourceConfigs: this.state.dataSourceConfigs.size,
      errors: [...this.state.errors]
    }
  }

  /**
   * 清理资源
   */
  destroy(): void {
    console.log('🧹 [Card2DataBindingAdapter] 清理适配器资源...')

    // 停止所有活跃的绑定
    this.state.activeBindings.forEach(binding => {
      binding.stop()
    })

    // 清理状态
    this.state.componentRequirements.clear()
    this.state.activeBindings.clear()
    this.state.dataSourceConfigs.clear()
    this.state.errors = []
    this.state.initialized = false

    console.log('✅ [Card2DataBindingAdapter] 适配器资源清理完成')
  }
}

// 导出单例实例
export const card2DataBindingAdapter = new Card2DataBindingAdapter()

// 导出工厂函数
export function useCard2DataBindingAdapter() {
  return card2DataBindingAdapter
}

export default card2DataBindingAdapter
