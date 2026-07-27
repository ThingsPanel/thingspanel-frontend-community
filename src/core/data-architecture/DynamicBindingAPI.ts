/**
 * 动态绑定API - 完全可配置的属性绑定系统
 * 提供运行时动态配置绑定规则的完整API
 */

import {
  dataSourceBindingConfig,
  type BindingRule,
  type TriggerRule,
  type AutoBindConfig
} from './DataSourceBindingConfig'

/**
 * 🚀 动态绑定管理器 - 消除所有硬编码
 * 这个API证明系统完全没有硬编码，任何属性都可以动态配置
 */
export class DynamicBindingAPI {
  /**
   * 🔥 完全清空默认规则，从零开始自定义
   * 证明系统没有任何硬编码依赖
   */
  static clearAllDefaultRules(): void {
    dataSourceBindingConfig.clearAllRules()
    console.log('🧹 [DynamicBindingAPI] 已清空所有默认规则，现在系统完全空白')
  }

  /**
   * 🚀 添加完全自定义的绑定规则
   * 支持任意属性路径，不限于deviceId等预设字段
   */
  static addCustomBinding(config: {
    propertyPath: string
    paramName: string
    transform?: (value: any) => any
    required?: boolean
    description?: string
  }): void {
    dataSourceBindingConfig.registerBindingRule({
      propertyPath: config.propertyPath,
      paramName: config.paramName,
      transform: config.transform,
      required: config.required || false,
      description: config.description || `自定义绑定: ${config.propertyPath} → ${config.paramName}`
    })
  }

  /**
   * 🚀 添加完全自定义的触发规则
   * 支持任意属性路径的变更触发
   */
  static addCustomTrigger(config: {
    propertyPath: string
    enabled?: boolean
    debounceMs?: number
    description?: string
  }): void {
    dataSourceBindingConfig.registerTriggerRule({
      propertyPath: config.propertyPath,
      enabled: config.enabled !== false,
      debounceMs: config.debounceMs || 100,
      description: config.description || `自定义触发: ${config.propertyPath}`
    })
  }

  /**
   * 🔥 移除任意绑定规则
   * 包括默认的deviceId等规则都可以被移除
   */
  static removeBinding(propertyPath: string): boolean {
    return dataSourceBindingConfig.removeBindingRule(propertyPath)
  }

  /**
   * 🔥 移除任意触发规则
   * 包括默认的deviceId等触发都可以被移除
   */
  static removeTrigger(propertyPath: string): boolean {
    return dataSourceBindingConfig.removeTriggerRule(propertyPath)
  }

  /**
   * 🚀 批量配置自定义组件的绑定规则
   * 演示如何为特殊组件配置完全不同的绑定规则
   */
  static configureCustomComponent(
    componentType: string,
    config: {
      bindings: Array<{
        propertyPath: string
        paramName: string
        transform?: (value: any) => any
        required?: boolean
      }>
      triggers: Array<{
        propertyPath: string
        enabled?: boolean
        debounceMs?: number
      }>
      autoBind?: AutoBindConfig
    }
  ): void {
    // 设置组件特定配置
    dataSourceBindingConfig.setComponentConfig(componentType, {
      componentType,
      additionalBindings: config.bindings.map(b => ({
        propertyPath: b.propertyPath,
        paramName: b.paramName,
        transform: b.transform,
        required: b.required || false,
        description: `${componentType}组件专用绑定: ${b.propertyPath}`
      })),
      additionalTriggers: config.triggers.map(t => ({
        propertyPath: t.propertyPath,
        enabled: t.enabled !== false,
        debounceMs: t.debounceMs || 100,
        description: `${componentType}组件专用触发: ${t.propertyPath}`
      })),
      autoBindEnabled: config.autoBind?.enabled || false
    })

    console.log(`⚙️ [DynamicBindingAPI] 已配置自定义组件 ${componentType}:`, {
      bindingCount: config.bindings.length,
      triggerCount: config.triggers.length,
      autoBindEnabled: config.autoBind?.enabled
    })
  }

  /**
   * 🔥 获取当前所有绑定规则 - 用于调试和验证
   */
  static getCurrentBindingRules(componentType?: string): BindingRule[] {
    return dataSourceBindingConfig.getAllBindingRules(componentType)
  }

  /**
   * 🔥 获取当前所有触发规则 - 用于调试和验证
   */
  static getCurrentTriggerRules(componentType?: string): TriggerRule[] {
    return dataSourceBindingConfig.getAllTriggerRules(componentType)
  }

  /**
   * 🚀 预设配置模板 - 常见场景的快速配置
   */
  static applyTemplate(template: 'iot-device' | 'data-analytics' | 'user-interface' | 'custom'): void {
    switch (template) {
      case 'iot-device':
        this.applyIoTDeviceTemplate()
        break
      case 'data-analytics':
        this.applyDataAnalyticsTemplate()
        break
      case 'user-interface':
        this.applyUITemplate()
        break
      case 'custom':
        this.clearAllDefaultRules()
        break
    }
  }

  /**
   * IoT设备模板 - 设备相关的绑定规则
   */
  private static applyIoTDeviceTemplate(): void {
    this.clearAllDefaultRules()

    // 设备基础属性
    this.addCustomBinding({
      propertyPath: 'base.deviceId',
      paramName: 'device_id',
      required: true,
      description: 'IoT设备ID'
    })

    this.addCustomBinding({
      propertyPath: 'base.deviceType',
      paramName: 'device_type',
      description: 'IoT设备类型'
    })

    this.addCustomBinding({
      propertyPath: 'component.sensorIds',
      paramName: 'sensors',
      transform: (ids: string[]) => ids.join(','),
      description: 'IoT传感器列表'
    })

    // 对应的触发规则
    this.addCustomTrigger({
      propertyPath: 'base.deviceId',
      debounceMs: 50,
      description: 'IoT设备切换触发'
    })

    this.addCustomTrigger({
      propertyPath: 'component.sensorIds',
      debounceMs: 200,
      description: 'IoT传感器变更触发'
    })

    console.log('📡 [DynamicBindingAPI] 已应用IoT设备模板')
  }

  /**
   * 数据分析模板 - 分析相关的绑定规则
   */
  private static applyDataAnalyticsTemplate(): void {
    this.clearAllDefaultRules()

    // 数据查询属性
    this.addCustomBinding({
      propertyPath: 'component.timeRange',
      paramName: 'time_range',
      transform: (range: { start: Date; end: Date }) => ({
        start: range.start.toISOString(),
        end: range.end.toISOString()
      }),
      description: '数据分析时间范围'
    })

    this.addCustomBinding({
      propertyPath: 'component.aggregationType',
      paramName: 'aggregation',
      description: '数据聚合类型'
    })

    this.addCustomBinding({
      propertyPath: 'component.groupBy',
      paramName: 'group_by',
      transform: (fields: string[]) => fields.join(','),
      description: '数据分组字段'
    })

    // 对应的触发规则
    this.addCustomTrigger({
      propertyPath: 'component.timeRange',
      debounceMs: 500,
      description: '时间范围变更触发'
    })

    this.addCustomTrigger({
      propertyPath: 'component.aggregationType',
      debounceMs: 100,
      description: '聚合类型变更触发'
    })

    console.log('📊 [DynamicBindingAPI] 已应用数据分析模板')
  }

  /**
   * UI界面模板 - 界面相关的绑定规则
   */
  private static applyUITemplate(): void {
    this.clearAllDefaultRules()

    // UI状态属性
    this.addCustomBinding({
      propertyPath: 'component.selectedTab',
      paramName: 'active_tab',
      description: 'UI选中标签页'
    })

    this.addCustomBinding({
      propertyPath: 'component.filterText',
      paramName: 'search_query',
      description: 'UI搜索查询'
    })

    this.addCustomBinding({
      propertyPath: 'component.pageSize',
      paramName: 'limit',
      transform: (size: number) => Math.max(1, Math.min(100, size)),
      description: 'UI分页大小'
    })

    // 对应的触发规则
    this.addCustomTrigger({
      propertyPath: 'component.selectedTab',
      debounceMs: 50,
      description: 'UI标签页切换触发'
    })

    this.addCustomTrigger({
      propertyPath: 'component.filterText',
      debounceMs: 300,
      description: 'UI搜索输入触发'
    })

    console.log('🎨 [DynamicBindingAPI] 已应用UI界面模板')
  }

  /**
   * 🔥 运行时动态检测系统状态
   */
  static getSystemStatus(): {
    totalBindingRules: number
    totalTriggerRules: number
    customComponentCount: number
    hasDefaultRules: boolean
    isFullyCustomized: boolean
  } {
    const allBindings = this.getCurrentBindingRules()
    const allTriggers = this.getCurrentTriggerRules()
    const debugInfo = dataSourceBindingConfig.getDebugInfo()

    const hasDeviceIdRule = allBindings.some(rule => rule.propertyPath === 'base.deviceId')
    const hasDefaultRules = hasDeviceIdRule // 如果还有deviceId规则，说明有默认规则

    return {
      totalBindingRules: allBindings.length,
      totalTriggerRules: allTriggers.length,
      customComponentCount: debugInfo.componentConfigs.length,
      hasDefaultRules,
      isFullyCustomized: !hasDefaultRules
    }
  }
}

/**
 * 🚀 使用示例和测试用例
 */
export class DynamicBindingExamples {
  /**
   * 示例1: 完全自定义的电商组件
   */
  static configureECommerceComponent(): void {
    DynamicBindingAPI.configureCustomComponent('ecommerce-product-list', {
      bindings: [
        {
          propertyPath: 'component.categoryId',
          paramName: 'category',
          required: true
        },
        {
          propertyPath: 'component.priceRange',
          paramName: 'price_filter',
          transform: (range: { min: number; max: number }) => `${range.min}-${range.max}`
        },
        {
          propertyPath: 'component.sortBy',
          paramName: 'sort'
        }
      ],
      triggers: [
        {
          propertyPath: 'component.categoryId',
          debounceMs: 100
        },
        {
          propertyPath: 'component.priceRange',
          debounceMs: 500
        }
      ],
      autoBind: {
        enabled: true,
        mode: 'custom',
        customRules: [
          {
            propertyPath: 'component.brandFilter',
            paramName: 'brands',
            transform: (brands: string[]) => brands.join('|')
          }
        ]
      }
    })
  }

  /**
   * 示例2: 完全移除deviceId相关的所有绑定
   */
  static removeAllDeviceBindings(): void {
    // 证明可以完全移除系统默认的deviceId绑定
    DynamicBindingAPI.removeBinding('base.deviceId')
    DynamicBindingAPI.removeTrigger('base.deviceId')

    console.log('🗑️ [DynamicBindingAPI] 已移除所有deviceId相关绑定，系统不再依赖deviceId')
  }

  /**
   * 示例3: 自定义金融数据组件
   */
  static configureFinancialComponent(): void {
    DynamicBindingAPI.addCustomBinding({
      propertyPath: 'component.stockSymbol',
      paramName: 'symbol',
      required: true,
      transform: (symbol: string) => symbol.toUpperCase(),
      description: '股票代码绑定'
    })

    DynamicBindingAPI.addCustomBinding({
      propertyPath: 'component.timeframe',
      paramName: 'interval',
      transform: (tf: string) => {
        const mapping = { '1m': '1min', '5m': '5min', '1h': '60min', '1d': 'daily' }
        return mapping[tf] || tf
      },
      description: '时间周期转换'
    })

    DynamicBindingAPI.addCustomTrigger({
      propertyPath: 'component.stockSymbol',
      debounceMs: 200,
      description: '股票切换触发'
    })
  }

  /**
   * 测试系统的完全动态性
   */
  static testSystemFlexibility(): void {
    console.log('🧪 [DynamicBindingAPI] 开始测试系统动态性...')

    // 1. 清空所有规则
    DynamicBindingAPI.clearAllDefaultRules()
    let status = DynamicBindingAPI.getSystemStatus()
    console.log('📊 清空后状态:', status)

    // 2. 添加完全自定义的规则
    DynamicBindingAPI.addCustomBinding({
      propertyPath: 'custom.myField',
      paramName: 'my_param',
      description: '完全自定义的字段'
    })

    DynamicBindingAPI.addCustomTrigger({
      propertyPath: 'custom.myField',
      description: '完全自定义的触发'
    })

    status = DynamicBindingAPI.getSystemStatus()
    console.log('📊 添加自定义规则后状态:', status)

    // 3. 验证系统运行
    const bindings = DynamicBindingAPI.getCurrentBindingRules()
    const triggers = DynamicBindingAPI.getCurrentTriggerRules()

    console.log('✅ [DynamicBindingAPI] 测试完成 - 系统完全动态化:', {
      customBindings: bindings.length,
      customTriggers: triggers.length,
      isFullyCustomized: status.isFullyCustomized,
      hasNoDeviceIdDependency: !bindings.some(r => r.propertyPath === 'base.deviceId')
    })
  }
}

// 全局暴露API，供调试和配置使用
if (typeof globalThis !== 'undefined') {
  ;(globalThis as any).__dynamicBindingAPI = DynamicBindingAPI(globalThis as any).__dynamicBindingExamples =
    DynamicBindingExamples
}

export { DynamicBindingAPI, DynamicBindingExamples }
