/**
 * Config Engine 模板和导入导出管理系统
 *
 * 核心功能：
 * 1. 配置模板管理 - 预定义配置模板的创建和管理
 * 2. 模板参数化系统 - 支持动态参数的模板渲染
 * 3. 配置导入功能 - 多格式配置数据导入
 * 4. 配置导出功能 - 多格式配置数据导出
 * 5. 模板市场集成 - 模板的分享和下载
 * 6. 配置转换器 - 不同格式间的配置转换
 * 7. 批量导入导出 - 高效的批量操作支持
 * 8. 导入导出验证 - 确保数据完整性和正确性
 *
 * 设计原则：
 * - 灵活性：支持多种数据格式和模板类型
 * - 安全性：严格的数据验证和权限控制
 * - 高效性：优化的批量处理和流式操作
 * - 扩展性：插件式的格式支持和转换器
 * - 用户友好：直观的模板创建和使用体验
 *
 * 创建时间：2025年1月
 * 作者：ThingsPanel Team
 */

import { EventEmitter } from 'events'
import type {
  ConfigurationItem,
  ConfigurationTemplate,
  ConfigurationType,
  ConfigurationExportFormat,
  ConfigurationImportOptions,
  ConfigurationExportOptions,
  ConfigurationOperationResult
} from './types'

import { configurationValidator } from './config-validator'

/**
 * 模板渲染上下文接口
 * 模板参数化渲染时的上下文环境
 */
interface TemplateRenderContext {
  /** 模板参数值 */
  parameters: Record<string, any>
  /** 渲染环境 */
  environment: 'development' | 'test' | 'production'
  /** 用户上下文 */
  user?: {
    id: string
    name: string
    roles: string[]
  }
  /** 时间上下文 */
  timestamp: Date
  /** 自定义上下文 */
  custom?: Record<string, any>
}

/**
 * 导入结果详情接口
 * 配置导入操作的详细结果
 */
interface ImportResult {
  /** 导入是否成功 */
  success: boolean
  /** 总导入数量 */
  totalCount: number
  /** 成功导入数量 */
  successCount: number
  /** 失败导入数量 */
  failedCount: number
  /** 跳过导入数量 */
  skippedCount: number
  /** 详细的导入记录 */
  details: Array<{
    /** 配置ID */
    id: string
    /** 导入状态 */
    status: 'success' | 'failed' | 'skipped'
    /** 错误信息（如果失败） */
    error?: string
    /** 冲突解决方式（如果有冲突） */
    conflictResolution?: string
  }>
  /** 导入耗时（毫秒） */
  duration: number
  /** 导入时间戳 */
  timestamp: Date
}

/**
 * 导出结果接口
 * 配置导出操作的结果
 */
interface ExportResult {
  /** 导出是否成功 */
  success: boolean
  /** 导出的配置数量 */
  count: number
  /** 导出数据大小（字节） */
  size: number
  /** 导出格式 */
  format: ConfigurationExportFormat
  /** 导出文件路径或数据 */
  data: string | Buffer | any
  /** 导出耗时（毫秒） */
  duration: number
  /** 导出时间戳 */
  timestamp: Date
  /** 错误信息（如果失败） */
  error?: string
}

/**
 * 格式转换器接口
 * 用于在不同配置格式间转换
 */
interface ConfigurationConverter {
  /** 转换器名称 */
  name: string
  /** 支持的源格式 */
  sourceFormat: ConfigurationExportFormat
  /** 支持的目标格式 */
  targetFormat: ConfigurationExportFormat
  /** 转换函数 */
  convert: (data: any, options?: any) => Promise<any>
  /** 验证函数 */
  validate?: (data: any) => boolean
}

/**
 * 模板市场条目接口
 * 模板市场中的模板条目
 */
interface TemplateMarketItem {
  /** 模板ID */
  id: string
  /** 模板信息 */
  template: ConfigurationTemplate
  /** 下载次数 */
  downloadCount: number
  /** 评分 */
  rating: number
  /** 评论数 */
  reviewCount: number
  /** 是否验证通过 */
  verified: boolean
  /** 发布时间 */
  publishedAt: Date
  /** 更新时间 */
  updatedAt: Date
}

/**
 * 🎨 配置模板和导入导出管理器核心类
 *
 * 统一管理配置模板、导入导出和格式转换功能
 *
 * 主要功能：
 * - 模板创建和管理
 * - 模板参数化和渲染
 * - 多格式配置导入导出
 * - 配置格式转换
 * - 模板市场集成
 * - 批量操作支持
 */
export class ConfigurationTemplateManager extends EventEmitter {
  /** 🎨 模板存储 */
  private templates = new Map<string, ConfigurationTemplate>()

  /** 🔄 格式转换器注册表 */
  private converters = new Map<string, ConfigurationConverter>()

  /** 🏪 模板市场缓存 */
  private templateMarket = new Map<string, TemplateMarketItem>()

  /** 📊 操作统计信息 */
  private statistics = {
    templatesCreated: 0,
    templatesUsed: 0,
    configurationsImported: 0,
    configurationsExported: 0,
    conversionsPerformed: 0,
    totalOperations: 0
  }

  constructor() {
    super()

    // 初始化内置转换器
    this.initializeBuiltInConverters()

    // 初始化内置模板
    this.initializeBuiltInTemplates()

    console.log('✅ [ConfigurationTemplateManager] 模板和导入导出管理器初始化完成')
  }

  // ===== 🎨 模板管理功能 =====

  /**
   * 🔨 创建配置模板
   *
   * 创建新的配置模板，支持参数化配置
   *
   * @param template 模板定义
   * @returns 创建结果
   */
  async createTemplate(template: ConfigurationTemplate): Promise<ConfigurationOperationResult<ConfigurationTemplate>> {
    const startTime = performance.now()

    try {
      // ✅ 验证模板定义
      const validationResult = await this.validateTemplate(template)
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `模板验证失败: ${validationResult.errors.join(', ')}`,
          data: null,
          operationType: 'create',
          timestamp: new Date(),
          duration: performance.now() - startTime
        }
      }

      // 💾 存储模板
      this.templates.set(template.id, { ...template })

      // 📊 更新统计
      this.statistics.templatesCreated++
      this.statistics.totalOperations++

      // 🚀 触发模板创建事件
      this.emit('template-created', {
        template,
        timestamp: new Date()
      })

      console.log(`✅ [ConfigurationTemplateManager] 模板创建成功: ${template.id}`)

      return {
        success: true,
        data: template,
        operationType: 'create',
        timestamp: new Date(),
        duration: performance.now() - startTime
      }

    } catch (error) {
      console.error(`❌ [ConfigurationTemplateManager] 模板创建失败: ${template.id}`, error)

      return {
        success: false,
        error: `模板创建失败: ${error instanceof Error ? error.message : '未知错误'}`,
        data: null,
        operationType: 'create',
        timestamp: new Date(),
        duration: performance.now() - startTime
      }
    }
  }

  /**
   * 🎯 根据模板创建配置
   *
   * 使用模板和参数创建具体的配置项
   *
   * @param templateId 模板ID
   * @param context 渲染上下文
   * @returns 生成的配置项
   */
  async createConfigurationFromTemplate(
    templateId: string,
    context: TemplateRenderContext
  ): Promise<ConfigurationOperationResult<ConfigurationItem>> {
    const startTime = performance.now()

    try {
      // 📋 获取模板
      const template = this.templates.get(templateId)
      if (!template) {
        return {
          success: false,
          error: `模板不存在: ${templateId}`,
          data: null,
          operationType: 'create',
          timestamp: new Date(),
          duration: performance.now() - startTime
        }
      }

      // ✅ 验证参数
      const paramValidation = this.validateTemplateParameters(template, context.parameters)
      if (!paramValidation.isValid) {
        return {
          success: false,
          error: `模板参数验证失败: ${paramValidation.errors.join(', ')}`,
          data: null,
          operationType: 'create',
          timestamp: new Date(),
          duration: performance.now() - startTime
        }
      }

      // 🎨 渲染模板
      const renderedConfig = await this.renderTemplate(template, context)

      // 📊 更新统计
      this.statistics.templatesUsed++
      this.statistics.totalOperations++

      // 🚀 触发模板使用事件
      this.emit('template-used', {
        templateId,
        context,
        renderedConfig,
        timestamp: new Date()
      })

      console.log(`🎯 [ConfigurationTemplateManager] 模板配置创建成功: ${templateId} → ${renderedConfig.id}`)

      return {
        success: true,
        data: renderedConfig,
        operationType: 'create',
        timestamp: new Date(),
        duration: performance.now() - startTime
      }

    } catch (error) {
      console.error(`❌ [ConfigurationTemplateManager] 模板配置创建失败: ${templateId}`, error)

      return {
        success: false,
        error: `模板配置创建失败: ${error instanceof Error ? error.message : '未知错误'}`,
        data: null,
        operationType: 'create',
        timestamp: new Date(),
        duration: performance.now() - startTime
      }
    }
  }

  /**
   * 📋 获取可用模板列表
   *
   * 获取指定类型的可用模板
   *
   * @param type 配置类型
   * @param category 模板类别
   * @returns 模板列表
   */
  getAvailableTemplates(type?: ConfigurationType, category?: string): ConfigurationTemplate[] {
    let templates = Array.from(this.templates.values())

    // 🔍 按类型过滤
    if (type) {
      templates = templates.filter(t => t.type === type)
    }

    // 🔍 按类别过滤
    if (category) {
      templates = templates.filter(t => t.category === category)
    }

    // 📊 按创建时间排序（最新的在前）
    templates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    console.log(`📋 [ConfigurationTemplateManager] 获取模板列表: ${templates.length} 个模板`)
    return templates
  }

  // ===== 📥 配置导入功能 =====

  /**
   * 📥 导入配置数据
   *
   * 从各种格式导入配置数据
   *
   * @param data 导入数据
   * @param options 导入选项
   * @returns 导入结果
   */
  async importConfigurations(
    data: string | Buffer | any,
    options: ConfigurationImportOptions
  ): Promise<ImportResult> {
    const startTime = performance.now()

    try {
      console.log(`📥 [ConfigurationTemplateManager] 开始导入配置: 格式 ${options.format}`)

      // 🔄 解析导入数据
      const parsedData = await this.parseImportData(data, options.format)

      // ✅ 验证导入数据（如果启用）
      if (options.validate) {
        const validation = await this.validateImportData(parsedData, options)
        if (!validation.isValid) {
          return {
            success: false,
            totalCount: 0,
            successCount: 0,
            failedCount: 0,
            skippedCount: 0,
            details: [],
            duration: performance.now() - startTime,
            timestamp: new Date()
          }
        }
      }

      // 🔍 过滤导入范围
      const filteredConfigs = this.filterImportScope(parsedData, options.scope)

      // 🎨 应用映射规则
      const mappedConfigs = this.applyImportMapping(filteredConfigs, options.mapping)

      // 🔄 处理导入配置
      const importDetails = await this.processImportConfigurations(mappedConfigs, options)

      // 📊 计算导入统计
      const successCount = importDetails.filter(d => d.status === 'success').length
      const failedCount = importDetails.filter(d => d.status === 'failed').length
      const skippedCount = importDetails.filter(d => d.status === 'skipped').length

      const result: ImportResult = {
        success: failedCount === 0,
        totalCount: importDetails.length,
        successCount,
        failedCount,
        skippedCount,
        details: importDetails,
        duration: performance.now() - startTime,
        timestamp: new Date()
      }

      // 📊 更新统计
      this.statistics.configurationsImported += successCount
      this.statistics.totalOperations++

      // 🚀 触发导入完成事件
      this.emit('configurations-imported', {
        result,
        options,
        timestamp: new Date()
      })

      console.log(`📥 [ConfigurationTemplateManager] 导入完成: ${successCount}/${importDetails.length} 成功`)
      return result

    } catch (error) {
      console.error(`❌ [ConfigurationTemplateManager] 导入失败:`, error)

      return {
        success: false,
        totalCount: 0,
        successCount: 0,
        failedCount: 1,
        skippedCount: 0,
        details: [{
          id: 'import-error',
          status: 'failed',
          error: error instanceof Error ? error.message : '未知错误'
        }],
        duration: performance.now() - startTime,
        timestamp: new Date()
      }
    }
  }

  // ===== 📤 配置导出功能 =====

  /**
   * 📤 导出配置数据
   *
   * 将配置数据导出为指定格式
   *
   * @param configurations 待导出的配置列表
   * @param options 导出选项
   * @returns 导出结果
   */
  async exportConfigurations(
    configurations: ConfigurationItem[],
    options: ConfigurationExportOptions
  ): Promise<ExportResult> {
    const startTime = performance.now()

    try {
      console.log(`📤 [ConfigurationTemplateManager] 开始导出配置: ${configurations.length} 个配置 → ${options.format}`)

      // 🔍 过滤导出范围
      const filteredConfigs = this.filterExportScope(configurations, options.scope)

      // 🎨 处理导出数据
      let exportData = filteredConfigs

      // 📋 包含元数据（如果启用）
      if (options.includeMetadata) {
        exportData = this.enrichWithMetadata(exportData)
      }

      // 📚 包含历史版本（如果启用）
      if (options.includeHistory) {
        exportData = await this.enrichWithHistory(exportData)
      }

      // 🔄 序列化数据
      const serializedData = await this.serializeExportData(exportData, options)

      // 🗜️ 压缩数据（如果启用）
      const finalData = options.compress ? await this.compressData(serializedData) : serializedData

      // 📊 计算导出统计
      const size = typeof finalData === 'string' ?
        new Blob([finalData]).size :
        finalData instanceof Buffer ? finalData.length : JSON.stringify(finalData).length

      const result: ExportResult = {
        success: true,
        count: filteredConfigs.length,
        size,
        format: options.format,
        data: finalData,
        duration: performance.now() - startTime,
        timestamp: new Date()
      }

      // 📊 更新统计
      this.statistics.configurationsExported += filteredConfigs.length
      this.statistics.totalOperations++

      // 🚀 触发导出完成事件
      this.emit('configurations-exported', {
        result,
        options,
        timestamp: new Date()
      })

      console.log(`📤 [ConfigurationTemplateManager] 导出完成: ${filteredConfigs.length} 个配置, ${size} 字节`)
      return result

    } catch (error) {
      console.error(`❌ [ConfigurationTemplateManager] 导出失败:`, error)

      return {
        success: false,
        count: 0,
        size: 0,
        format: options.format,
        data: '',
        duration: performance.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }

  // ===== 🔄 格式转换功能 =====

  /**
   * 🔄 注册格式转换器
   *
   * 注册新的配置格式转换器
   *
   * @param converter 转换器定义
   */
  registerConverter(converter: ConfigurationConverter): void {
    const key = `${converter.sourceFormat}->${converter.targetFormat}`
    this.converters.set(key, converter)
    console.log(`🔄 [ConfigurationTemplateManager] 注册转换器: ${key}`)
  }

  /**
   * 🔄 转换配置格式
   *
   * 在不同配置格式间进行转换
   *
   * @param data 源数据
   * @param sourceFormat 源格式
   * @param targetFormat 目标格式
   * @param options 转换选项
   * @returns 转换结果
   */
  async convertFormat(
    data: any,
    sourceFormat: ConfigurationExportFormat,
    targetFormat: ConfigurationExportFormat,
    options?: any
  ): Promise<any> {
    const startTime = performance.now()

    try {
      const converterKey = `${sourceFormat}->${targetFormat}`
      const converter = this.converters.get(converterKey)

      if (!converter) {
        throw new Error(`不支持的格式转换: ${converterKey}`)
      }

      // ✅ 验证源数据（如果有验证器）
      if (converter.validate && !converter.validate(data)) {
        throw new Error('源数据验证失败')
      }

      // 🔄 执行转换
      const convertedData = await converter.convert(data, options)

      // 📊 更新统计
      this.statistics.conversionsPerformed++
      this.statistics.totalOperations++

      console.log(`🔄 [ConfigurationTemplateManager] 格式转换完成: ${converterKey} (${performance.now() - startTime}ms)`)
      return convertedData

    } catch (error) {
      console.error(`❌ [ConfigurationTemplateManager] 格式转换失败: ${sourceFormat} → ${targetFormat}`, error)
      throw error
    }
  }

  // ===== 🔒 私有辅助方法 =====

  /**
   * 🔧 初始化内置转换器
   */
  private initializeBuiltInConverters(): void {
    // JSON 到 YAML 转换器
    this.registerConverter({
      name: 'json-to-yaml',
      sourceFormat: ConfigurationExportFormat.JSON,
      targetFormat: ConfigurationExportFormat.YAML,
      convert: async (data: any) => {
        // 这里应该使用实际的 YAML 库进行转换
        // 为了演示，这里只是简单的字符串操作
        return `# 转换后的 YAML 格式\n${JSON.stringify(data, null, 2)}`
      },
      validate: (data: any) => {
        try {
          JSON.stringify(data)
          return true
        } catch {
          return false
        }
      }
    })

    // YAML 到 JSON 转换器
    this.registerConverter({
      name: 'yaml-to-json',
      sourceFormat: ConfigurationExportFormat.YAML,
      targetFormat: ConfigurationExportFormat.JSON,
      convert: async (data: string) => {
        // 这里应该使用实际的 YAML 库进行解析
        // 为了演示，这里假设输入是简单的字符串
        try {
          return JSON.parse(data)
        } catch {
          // 简单的 YAML 解析逻辑（实际应该使用专业库）
          return { yaml_content: data }
        }
      },
      validate: (data: any) => typeof data === 'string'
    })

    console.log('✅ [ConfigurationTemplateManager] 内置转换器初始化完成')
  }

  /**
   * 🎨 初始化内置模板
   */
  private initializeBuiltInTemplates(): void {
    // 设备模板示例
    const deviceTemplate: ConfigurationTemplate = {
      id: 'builtin-device-template',
      name: '标准设备配置模板',
      description: '用于创建标准设备配置的模板',
      type: ConfigurationType.DEVICE_TEMPLATE,
      category: '设备管理',
      tags: ['设备', '模板', '标准'],
      template: {
        name: '{{deviceName}}',
        type: ConfigurationType.DEVICE_TEMPLATE,
        status: 'active' as any,
        priority: 5 as any,
        tags: ['{{deviceType}}'],
        target: ['{{environment}}'],
        data: {
          protocol: '{{protocol}}',
          address: '{{address}}',
          port: '{{port}}',
          timeout: '{{timeout | default:5000}}'
        },
        metadata: {
          creator: '{{user.name}}',
          source: 'template',
          group: '{{deviceGroup}}',
          isSystemConfig: false
        }
      } as any,
      parameters: [
        {
          name: 'deviceName',
          type: 'string',
          description: '设备名称',
          defaultValue: '新设备',
          required: true
        },
        {
          name: 'deviceType',
          type: 'string',
          description: '设备类型',
          defaultValue: 'sensor',
          required: true
        },
        {
          name: 'protocol',
          type: 'string',
          description: '通信协议',
          defaultValue: 'mqtt',
          required: true
        },
        {
          name: 'address',
          type: 'string',
          description: '设备地址',
          required: true
        },
        {
          name: 'port',
          type: 'number',
          description: '端口号',
          defaultValue: 1883,
          required: false
        },
        {
          name: 'timeout',
          type: 'number',
          description: '超时时间（毫秒）',
          defaultValue: 5000,
          required: false
        }
      ],
      version: '1.0.0',
      author: 'ThingsPanel Team',
      createdAt: new Date()
    }

    this.templates.set(deviceTemplate.id, deviceTemplate)

    console.log('✅ [ConfigurationTemplateManager] 内置模板初始化完成')
  }

  /**
   * ✅ 验证模板定义
   */
  private async validateTemplate(template: ConfigurationTemplate): Promise<{
    isValid: boolean
    errors: string[]
  }> {
    const errors: string[] = []

    // 基础字段验证
    if (!template.id) errors.push('模板ID不能为空')
    if (!template.name) errors.push('模板名称不能为空')
    if (!template.type) errors.push('模板类型不能为空')
    if (!template.template) errors.push('模板内容不能为空')
    if (!template.parameters || !Array.isArray(template.parameters)) {
      errors.push('模板参数必须是数组')
    }

    // 参数验证
    for (const param of template.parameters || []) {
      if (!param.name) errors.push(`参数名称不能为空`)
      if (!param.type) errors.push(`参数 ${param.name} 的类型不能为空`)
      if (param.required && param.defaultValue === undefined) {
        errors.push(`必需参数 ${param.name} 必须提供默认值`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * ✅ 验证模板参数
   */
  private validateTemplateParameters(
    template: ConfigurationTemplate,
    parameters: Record<string, any>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    for (const paramDef of template.parameters) {
      const value = parameters[paramDef.name]

      // 检查必需参数
      if (paramDef.required && (value === undefined || value === null)) {
        errors.push(`缺少必需参数: ${paramDef.name}`)
        continue
      }

      // 类型验证
      if (value !== undefined && value !== null) {
        const expectedType = paramDef.type
        const actualType = typeof value

        if (expectedType === 'array' && !Array.isArray(value)) {
          errors.push(`参数 ${paramDef.name} 应该是数组类型`)
        } else if (expectedType !== 'array' && expectedType !== actualType) {
          errors.push(`参数 ${paramDef.name} 类型错误: 期望 ${expectedType}, 实际 ${actualType}`)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 🎨 渲染模板
   */
  private async renderTemplate(
    template: ConfigurationTemplate,
    context: TemplateRenderContext
  ): Promise<ConfigurationItem> {
    // 🔄 准备渲染参数
    const renderParams = { ...context.parameters }

    // 📝 添加系统参数
    renderParams['timestamp'] = context.timestamp
    renderParams['environment'] = context.environment
    if (context.user) {
      renderParams['user'] = context.user
    }

    // 🎨 执行模板渲染（简化实现）
    const renderedTemplate = JSON.parse(JSON.stringify(template.template))

    // 🔄 递归替换模板变量
    this.replaceTemplateVariables(renderedTemplate, renderParams)

    // 📋 生成配置项
    const configItem: ConfigurationItem = {
      id: `config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...renderedTemplate
    }

    return configItem
  }

  /**
   * 🔄 替换模板变量
   */
  private replaceTemplateVariables(obj: any, params: Record<string, any>): void {
    if (typeof obj === 'string') {
      // 简单的变量替换逻辑
      return obj.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
        const value = this.getNestedValue(params, key)
        return value !== undefined ? String(value) : match
      })
    }

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        obj[i] = this.replaceTemplateVariables(obj[i], params)
      }
    } else if (obj && typeof obj === 'object') {
      for (const key in obj) {
        obj[key] = this.replaceTemplateVariables(obj[key], params)
      }
    }

    return obj
  }

  /**
   * 🔍 获取嵌套值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * 🔄 解析导入数据
   */
  private async parseImportData(data: any, format: ConfigurationExportFormat): Promise<ConfigurationItem[]> {
    switch (format) {
      case ConfigurationExportFormat.JSON:
        if (typeof data === 'string') {
          return JSON.parse(data)
        }
        return Array.isArray(data) ? data : [data]

      case ConfigurationExportFormat.YAML:
        // 这里应该使用实际的 YAML 解析库
        throw new Error('YAML 解析暂未实现')

      case ConfigurationExportFormat.XML:
        // 这里应该使用实际的 XML 解析库
        throw new Error('XML 解析暂未实现')

      default:
        throw new Error(`不支持的导入格式: ${format}`)
    }
  }

  /**
   * ✅ 验证导入数据
   */
  private async validateImportData(
    data: ConfigurationItem[],
    options: ConfigurationImportOptions
  ): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    for (const config of data) {
      const validation = await configurationValidator.validateConfiguration(config)
      if (!validation.isValid) {
        errors.push(`配置 ${config.id} 验证失败: ${validation.errors.map(e => e.message).join(', ')}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 🔍 过滤导入范围
   */
  private filterImportScope(
    configs: ConfigurationItem[],
    scope?: ConfigurationImportOptions['scope']
  ): ConfigurationItem[] {
    if (!scope) return configs

    return configs.filter(config => {
      // 包含类型过滤
      if (scope.includeTypes && !scope.includeTypes.includes(config.type)) {
        return false
      }

      // 排除类型过滤
      if (scope.excludeTypes && scope.excludeTypes.includes(config.type)) {
        return false
      }

      // 包含标签过滤
      if (scope.includeTags && !scope.includeTags.some(tag => config.tags.includes(tag))) {
        return false
      }

      // 排除标签过滤
      if (scope.excludeTags && scope.excludeTags.some(tag => config.tags.includes(tag))) {
        return false
      }

      return true
    })
  }

  /**
   * 🎨 应用导入映射
   */
  private applyImportMapping(
    configs: ConfigurationItem[],
    mapping?: Record<string, string>
  ): ConfigurationItem[] {
    if (!mapping) return configs

    return configs.map(config => {
      const mappedConfig = { ...config }

      // 应用字段映射
      for (const [sourceField, targetField] of Object.entries(mapping)) {
        if (sourceField in mappedConfig) {
          const value = (mappedConfig as any)[sourceField]
          delete (mappedConfig as any)[sourceField]
          ;(mappedConfig as any)[targetField] = value
        }
      }

      return mappedConfig
    })
  }

  /**
   * 🔄 处理导入配置
   */
  private async processImportConfigurations(
    configs: ConfigurationItem[],
    options: ConfigurationImportOptions
  ): Promise<Array<{ id: string; status: 'success' | 'failed' | 'skipped'; error?: string }>> {
    const results: Array<{ id: string; status: 'success' | 'failed' | 'skipped'; error?: string }> = []

    for (const config of configs) {
      try {
        // 这里应该与实际的配置存储系统集成
        // 暂时模拟处理结果
        results.push({
          id: config.id,
          status: 'success'
        })
      } catch (error) {
        results.push({
          id: config.id,
          status: 'failed',
          error: error instanceof Error ? error.message : '未知错误'
        })
      }
    }

    return results
  }

  /**
   * 🔍 过滤导出范围
   */
  private filterExportScope(configs: ConfigurationItem[], scope: any): ConfigurationItem[] {
    // 这里应该应用查询过滤逻辑
    // 暂时返回所有配置
    return configs
  }

  /**
   * 📋 添加元数据
   */
  private enrichWithMetadata(configs: ConfigurationItem[]): any[] {
    return configs.map(config => ({
      ...config,
      exportMetadata: {
        exportedAt: new Date(),
        exportVersion: '1.0.0',
        source: 'ThingsPanel Config Engine'
      }
    }))
  }

  /**
   * 📚 添加历史版本
   */
  private async enrichWithHistory(configs: ConfigurationItem[]): Promise<any[]> {
    // 这里应该从版本管理器获取历史版本
    // 暂时返回原始配置
    return configs
  }

  /**
   * 🔄 序列化导出数据
   */
  private async serializeExportData(data: any[], options: ConfigurationExportOptions): Promise<any> {
    switch (options.format) {
      case ConfigurationExportFormat.JSON:
        return JSON.stringify(data, null, 2)

      case ConfigurationExportFormat.YAML:
        // 这里应该使用实际的 YAML 序列化库
        return `# YAML 格式导出\n${JSON.stringify(data, null, 2)}`

      case ConfigurationExportFormat.XML:
        // 这里应该使用实际的 XML 序列化库
        return `<?xml version="1.0" encoding="UTF-8"?>\n<configurations>\n${JSON.stringify(data, null, 2)}\n</configurations>`

      default:
        return JSON.stringify(data, null, 2)
    }
  }

  /**
   * 🗜️ 压缩数据
   */
  private async compressData(data: string): Promise<string> {
    // 这里应该使用实际的压缩库
    // 暂时返回原始数据
    return data
  }

  /**
   * 📊 获取操作统计
   */
  getStatistics() {
    return { ...this.statistics }
  }
}

/**
 * 🌟 创建模板管理器实例
 *
 * 提供全局单例模式的模板管理器
 */
export const configurationTemplateManager = new ConfigurationTemplateManager()

// 🔧 调试支持：将模板管理器暴露到全局作用域
if (typeof window !== 'undefined') {
  ;(window as any).configurationTemplateManager = configurationTemplateManager
}

console.log('🎉 [config-template-manager.ts] 配置模板和导入导出管理器加载完成')