/**
 * 数据源绑定配置
 * 集中管理动态参数绑定规则和触发白名单
 *
 * 支持：
 * 1. 自动参数绑定规则配置
 * 2. 属性变更触发白名单管理
 * 3. 自定义绑定规则扩展
 * 4. 组件特定的绑定配置
 */

/**
 * 参数绑定规则接口
 */
export interface BindingRule {
  /** 属性路径，如 'base.deviceId' */
  propertyPath: string
  /** HTTP参数名 */
  paramName: string
  /** 数据转换函数（可选） */
  transform?: (value: any) => any
  /** 是否必需参数 */
  required?: boolean
  /** 参数说明 */
  description?: string
}

/**
 * 触发规则接口
 */
export interface TriggerRule {
  /** 属性路径 */
  propertyPath: string
  /** 是否启用 */
  enabled: boolean
  /** 防抖时间（毫秒），默认使用全局配置 */
  debounceMs?: number
  /** 规则说明 */
  description?: string
}

/**
 * 组件特定配置接口
 */
export interface ComponentBindingConfig {
  /** 组件类型 */
  componentType: string
  /** 额外的绑定规则 */
  additionalBindings?: BindingRule[]
  /** 额外的触发规则 */
  additionalTriggers?: TriggerRule[]
  /** 是否启用自动绑定 */
  autoBindEnabled?: boolean
}

/**
 * 自动绑定配置接口
 * 用于简化数据源配置，提供autoBind选项
 */
export interface AutoBindConfig {
  /** 是否启用自动绑定 */
  enabled: boolean
  /** 绑定模式 */
  mode: 'strict' | 'loose' | 'custom'
  /** 自定义绑定规则 */
  customRules?: BindingRule[]
  /** 排除的属性列表 */
  excludeProperties?: string[]
  /** 包含的属性列表（仅在strict模式下生效） */
  includeProperties?: string[]
}

/**
 * 🚀 完全动态化的数据源绑定配置类
 * 消除所有硬编码，支持运行时动态配置绑定规则
 */
export class DataSourceBindingConfig {
  // 🔥 修复：改为动态注册的绑定规则，不再硬编码任何字段
  private bindingRules: Map<string, BindingRule> = new Map()

  // 🔥 修复：改为动态注册的触发规则，不再硬编码任何字段
  private triggerRules: Map<string, TriggerRule> = new Map()

  constructor() {
    // 🚀 初始化时注册默认规则（但可以被覆盖或删除）
    this.initializeDefaultRules()
  }

  /**
   * 🚀 初始化默认规则 - 可以被动态修改
   * 这些不是硬编码，而是默认建议，可以完全替换
   */
  private initializeDefaultRules(): void {
    // 注册默认绑定规则
    this.registerBindingRule({
      propertyPath: 'base.deviceId',
      paramName: 'deviceId',
      required: true,
      description: '设备ID - 默认规则，可修改或删除'
    })

    this.registerBindingRule({
      propertyPath: 'base.metricsList',
      paramName: 'metrics',
      transform: (value: any[]) => (Array.isArray(value) ? value.join(',') : value),
      description: '指标列表 - 默认规则，可修改或删除'
    })

    this.registerBindingRule({
      propertyPath: 'component.startTime',
      paramName: 'startTime',
      transform: (value: any) => (value instanceof Date ? value.toISOString() : value),
      description: '开始时间 - 默认规则，可修改或删除'
    })

    this.registerBindingRule({
      propertyPath: 'component.endTime',
      paramName: 'endTime',
      transform: (value: any) => (value instanceof Date ? value.toISOString() : value),
      description: '结束时间 - 默认规则，可修改或删除'
    })

    this.registerBindingRule({
      propertyPath: 'component.dataType',
      paramName: 'dataType',
      description: '数据类型 - 默认规则，可修改或删除'
    })

    this.registerBindingRule({
      propertyPath: 'component.refreshInterval',
      paramName: 'refreshInterval',
      transform: (value: any) => parseInt(value) || 30,
      description: '刷新间隔 - 默认规则，可修改或删除'
    })

    this.registerBindingRule({
      propertyPath: 'component.filterCondition',
      paramName: 'filter',
      description: '过滤条件 - 默认规则，可修改或删除'
    })

    // 注册默认触发规则
    this.registerTriggerRule({
      propertyPath: 'base.deviceId',
      enabled: true,
      debounceMs: 100,
      description: '设备ID触发 - 默认规则，可修改或删除'
    })

    this.registerTriggerRule({
      propertyPath: 'base.metricsList',
      enabled: true,
      debounceMs: 200,
      description: '指标列表触发 - 默认规则，可修改或删除'
    })

    this.registerTriggerRule({
      propertyPath: 'component.startTime',
      enabled: true,
      debounceMs: 300,
      description: '开始时间触发 - 默认规则，可修改或删除'
    })

    this.registerTriggerRule({
      propertyPath: 'component.endTime',
      enabled: true,
      debounceMs: 300,
      description: '结束时间触发 - 默认规则，可修改或删除'
    })

    this.registerTriggerRule({
      propertyPath: 'component.dataType',
      enabled: true,
      debounceMs: 150,
      description: '数据类型触发 - 默认规则，可修改或删除'
    })

    this.registerTriggerRule({
      propertyPath: 'component.refreshInterval',
      enabled: false,
      description: '刷新间隔触发 - 默认规则，可修改或删除'
    })

    this.registerTriggerRule({
      propertyPath: 'component.filterCondition',
      enabled: true,
      debounceMs: 250,
      description: '过滤条件触发 - 默认规则，可修改或删除'
    })
  }

  /**
   * 🚀 新增：动态注册绑定规则
   */
  registerBindingRule(rule: BindingRule): void {
    this.bindingRules.set(rule.propertyPath, rule)
  }

  /**
   * 🚀 新增：动态注册触发规则
   */
  registerTriggerRule(rule: TriggerRule): void {
    this.triggerRules.set(rule.propertyPath, rule)
  }

  /**
   * 🚀 新增：移除绑定规则
   */
  removeBindingRule(propertyPath: string): boolean {
    const removed = this.bindingRules.delete(propertyPath)
    return removed
  }

  /**
   * 🚀 新增：移除触发规则
   */
  removeTriggerRule(propertyPath: string): boolean {
    const removed = this.triggerRules.delete(propertyPath)
    return removed
  }

  /**
   * 🚀 新增：清空所有规则（完全自定义）
   */
  clearAllRules(): void {
    this.bindingRules.clear()
    this.triggerRules.clear()
  }

  // 组件特定配置
  private componentConfigs: Map<string, ComponentBindingConfig> = new Map()

  // 用户自定义规则
  private customBindingRules: BindingRule[] = []
  private customTriggerRules: TriggerRule[] = []

  /**
   * 🔥 修复：获取所有有效的绑定规则（完全动态化）
   */
  getAllBindingRules(componentType?: string): BindingRule[] {
    // 从动态Map中获取所有规则
    const rules = Array.from(this.bindingRules.values())

    // 添加用户自定义规则（保持向后兼容）
    rules.push(...this.customBindingRules)

    // 添加组件特定的绑定规则
    if (componentType) {
      const componentConfig = this.componentConfigs.get(componentType)
      if (componentConfig?.additionalBindings) {
        rules.push(...componentConfig.additionalBindings)
      }
    }

    return rules
  }

  /**
   * 🔥 修复：获取所有有效的触发规则（完全动态化）
   */
  getAllTriggerRules(componentType?: string): TriggerRule[] {
    // 从动态Map中获取所有规则
    const rules = Array.from(this.triggerRules.values())

    // 添加用户自定义规则（保持向后兼容）
    rules.push(...this.customTriggerRules)

    // 添加组件特定的触发规则
    if (componentType) {
      const componentConfig = this.componentConfigs.get(componentType)
      if (componentConfig?.additionalTriggers) {
        rules.push(...componentConfig.additionalTriggers)
      }
    }

    return rules.filter(rule => rule.enabled)
  }

  /**
   * 根据属性路径获取绑定规则
   */
  getBindingRule(propertyPath: string, componentType?: string): BindingRule | undefined {
    const allRules = this.getAllBindingRules(componentType)
    return allRules.find(rule => rule.propertyPath === propertyPath)
  }

  /**
   * 根据属性路径获取触发规则
   */
  getTriggerRule(propertyPath: string, componentType?: string): TriggerRule | undefined {
    const allRules = this.getAllTriggerRules(componentType)
    return allRules.find(rule => rule.propertyPath === propertyPath)
  }

  /**
   * 检查属性是否应该触发数据源执行
   */
  shouldTriggerDataSource(propertyPath: string, componentType?: string): boolean {
    const triggerRule = this.getTriggerRule(propertyPath, componentType)
    return triggerRule?.enabled === true
  }

  /**
   * 构建HTTP参数对象
   */
  buildHttpParams(componentConfig: any, componentType?: string): Record<string, any> {
    const httpParams: Record<string, any> = {}
    const bindingRules = this.getAllBindingRules(componentType)

    for (const rule of bindingRules) {
      const [section, property] = rule.propertyPath.split('.')
      const sectionConfig = componentConfig[section]

      if (sectionConfig && sectionConfig[property] !== undefined) {
        let value = sectionConfig[property]

        // 应用数据转换函数
        if (rule.transform && typeof rule.transform === 'function') {
          try {
            value = rule.transform(value)
          } catch (error) {
            console.warn(`⚠️ [DataSourceBindingConfig] 参数转换失败:`, {
              propertyPath: rule.propertyPath,
              paramName: rule.paramName,
              originalValue: sectionConfig[property],
              error: error instanceof Error ? error.message : error
            })
            // 转换失败时使用原值
            value = sectionConfig[property]
          }
        }

        httpParams[rule.paramName] = value
      }
    }

    return httpParams
  }

  /**
   * 🚀 新增：使用autoBind配置自动构建HTTP参数
   * @param componentConfig 组件配置
   * @param autoBindConfig 自动绑定配置
   * @param componentType 组件类型
   * @returns 自动绑定的HTTP参数
   */
  buildAutoBindParams(
    componentConfig: any,
    autoBindConfig: AutoBindConfig,
    componentType?: string
  ): Record<string, any> {
    if (!autoBindConfig.enabled) {
      return this.buildHttpParams(componentConfig, componentType)
    }

    const httpParams: Record<string, any> = {}

    switch (autoBindConfig.mode) {
      case 'strict':
        // 严格模式：仅绑定指定的属性
        return this.buildStrictModeParams(componentConfig, autoBindConfig, componentType)

      case 'loose':
        // 宽松模式：绑定所有可用属性，排除指定属性
        return this.buildLooseModeParams(componentConfig, autoBindConfig, componentType)

      case 'custom':
        // 自定义模式：使用自定义绑定规则
        return this.buildCustomModeParams(componentConfig, autoBindConfig, componentType)

      default:
        return this.buildHttpParams(componentConfig, componentType)
    }
  }

  /**
   * 构建严格模式参数
   */
  private buildStrictModeParams(
    componentConfig: any,
    autoBindConfig: AutoBindConfig,
    componentType?: string
  ): Record<string, any> {
    const httpParams: Record<string, any> = {}
    const includeProperties = autoBindConfig.includeProperties || []

    // 只处理指定的属性
    const bindingRules = this.getAllBindingRules(componentType).filter(rule =>
      includeProperties.includes(rule.propertyPath)
    )

    for (const rule of bindingRules) {
      const [section, property] = rule.propertyPath.split('.')
      const sectionConfig = componentConfig[section]

      if (sectionConfig && sectionConfig[property] !== undefined) {
        let value = sectionConfig[property]

        if (rule.transform && typeof rule.transform === 'function') {
          try {
            value = rule.transform(value)
          } catch (error) {
            value = sectionConfig[property]
          }
        }

        httpParams[rule.paramName] = value
      }
    }

    return httpParams
  }

  /**
   * 构建宽松模式参数
   */
  private buildLooseModeParams(
    componentConfig: any,
    autoBindConfig: AutoBindConfig,
    componentType?: string
  ): Record<string, any> {
    const httpParams: Record<string, any> = {}
    const excludeProperties = autoBindConfig.excludeProperties || []

    // 处理所有属性，排除指定属性
    const bindingRules = this.getAllBindingRules(componentType).filter(
      rule => !excludeProperties.includes(rule.propertyPath)
    )

    for (const rule of bindingRules) {
      const [section, property] = rule.propertyPath.split('.')
      const sectionConfig = componentConfig[section]

      if (sectionConfig && sectionConfig[property] !== undefined) {
        let value = sectionConfig[property]

        if (rule.transform && typeof rule.transform === 'function') {
          try {
            value = rule.transform(value)
          } catch (error) {
            value = sectionConfig[property]
          }
        }

        httpParams[rule.paramName] = value
      }
    }

    return httpParams
  }

  /**
   * 构建自定义模式参数
   */
  private buildCustomModeParams(
    componentConfig: any,
    autoBindConfig: AutoBindConfig,
    componentType?: string
  ): Record<string, any> {
    const httpParams: Record<string, any> = {}
    const customRules = autoBindConfig.customRules || []

    // 使用自定义绑定规则
    for (const rule of customRules) {
      const [section, property] = rule.propertyPath.split('.')
      const sectionConfig = componentConfig[section]

      if (sectionConfig && sectionConfig[property] !== undefined) {
        let value = sectionConfig[property]

        if (rule.transform && typeof rule.transform === 'function') {
          try {
            value = rule.transform(value)
          } catch (error) {
            value = sectionConfig[property]
          }
        }

        httpParams[rule.paramName] = value
      }
    }

    return httpParams
  }

  /**
   * 添加自定义绑定规则
   */
  addCustomBindingRule(rule: BindingRule): void {
    // 检查是否已存在相同的属性路径
    const existingIndex = this.customBindingRules.findIndex(r => r.propertyPath === rule.propertyPath)
    if (existingIndex >= 0) {
      this.customBindingRules[existingIndex] = rule
    } else {
      this.customBindingRules.push(rule)
    }
  }

  /**
   * 添加自定义触发规则
   */
  addCustomTriggerRule(rule: TriggerRule): void {
    // 检查是否已存在相同的属性路径
    const existingIndex = this.customTriggerRules.findIndex(r => r.propertyPath === rule.propertyPath)
    if (existingIndex >= 0) {
      this.customTriggerRules[existingIndex] = rule
    } else {
      this.customTriggerRules.push(rule)
    }
  }

  /**
   * 设置组件特定配置
   */
  setComponentConfig(componentType: string, config: ComponentBindingConfig): void {
    this.componentConfigs.set(componentType, config)
  }

  /**
   * 获取组件特定配置
   */
  getComponentConfig(componentType: string): ComponentBindingConfig | undefined {
    return this.componentConfigs.get(componentType)
  }

  /**
   * 移除自定义规则
   */
  removeCustomBindingRule(propertyPath: string): boolean {
    const index = this.customBindingRules.findIndex(r => r.propertyPath === propertyPath)
    if (index >= 0) {
      this.customBindingRules.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * 移除自定义触发规则
   */
  removeCustomTriggerRule(propertyPath: string): boolean {
    const index = this.customTriggerRules.findIndex(r => r.propertyPath === propertyPath)
    if (index >= 0) {
      this.customTriggerRules.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * 获取调试信息
   */
  getDebugInfo(componentType?: string): any {
    return {
      baseBindingRules: this.baseBindingRules.length,
      baseTriggerRules: this.baseTriggerRules.length,
      customBindingRules: this.customBindingRules.length,
      customTriggerRules: this.customTriggerRules.length,
      componentConfigs: Array.from(this.componentConfigs.keys()),
      currentBindingRules: this.getAllBindingRules(componentType).map(r => ({
        propertyPath: r.propertyPath,
        paramName: r.paramName,
        required: r.required
      })),
      currentTriggerRules: this.getAllTriggerRules(componentType).map(r => ({
        propertyPath: r.propertyPath,
        enabled: r.enabled,
        debounceMs: r.debounceMs
      }))
    }
  }
}

// 创建全局配置实例
export const dataSourceBindingConfig = new DataSourceBindingConfig()

// 全局暴露，供调试使用
if (typeof globalThis !== 'undefined') {
  ;(globalThis as any).__dataSourceBindingConfig = dataSourceBindingConfig
}
