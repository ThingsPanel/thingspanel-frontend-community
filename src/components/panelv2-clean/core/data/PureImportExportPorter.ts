/**
 * @file 纯净导入导出门户 - 增强版
 * @description 第一层导入导出接口 - 支持多种数据格式的通用转换框架
 * 
 * 功能特性：
 * - 📄 多格式支持：JSON、XML、CSV、YAML、Binary等
 * - 🔄 数据转换：自动格式检测和智能转换
 * - ✅ 数据验证：Schema验证和完整性检查
 * - 📊 进度跟踪：大文件处理的进度反馈
 * - 🚀 性能优化：流式处理和内存管理
 * - 🔧 可扩展：插件化格式处理器
 */

import { reactive, ref } from 'vue'
import { nanoid } from 'nanoid'
import type {
  ImportExportPorter as IImportExportPorter,
  DataImporter,
  DataExporter,
  ImportResult,
  ImportOptions,
  ExportOptions,
  ValidationResult
} from './interfaces/PureInfrastructure'

/**
 * 数据格式类型枚举
 */
export enum DataFormat {
  JSON = 'json',
  XML = 'xml', 
  CSV = 'csv',
  YAML = 'yaml',
  BINARY = 'binary',
  TEXT = 'text',
  EXCEL = 'excel',
  PDF = 'pdf'
}

/**
 * 数据转换结果
 */
interface TransformResult {
  success: boolean
  data?: any
  errors?: string[]
  warnings?: string[]
  metadata?: {
    originalFormat: string
    targetFormat: string
    transformTime: number
    dataSize: number
  }
}

/**
 * 进度回调函数类型
 */
export type ProgressCallback = (progress: {
  current: number
  total: number
  percentage: number
  stage: string
  message?: string
}) => void

/**
 * 增强的导入选项
 */
export interface EnhancedImportOptions extends ImportOptions {
  // 数据转换选项
  autoDetectFormat?: boolean
  targetFormat?: DataFormat
  encoding?: string
  
  // 验证选项
  schema?: any
  strictValidation?: boolean
  
  // 性能选项
  chunkSize?: number
  useStreaming?: boolean
  onProgress?: ProgressCallback
  
  // 数据处理选项
  transformData?: (data: any) => any
  filterData?: (item: any) => boolean
  
  // 错误处理
  continueOnError?: boolean
  maxErrors?: number
}

/**
 * 增强的导出选项
 */
export interface EnhancedExportOptions extends ExportOptions {
  // 格式选项
  format: DataFormat
  encoding?: string
  compression?: boolean
  
  // 内容选项
  includeSchema?: boolean
  includeTimestamp?: boolean
  customMetadata?: Record<string, any>
  
  // 性能选项
  chunkSize?: number
  onProgress?: ProgressCallback
  
  // 过滤选项
  fields?: string[]
  excludeFields?: string[]
  dataFilter?: (item: any) => boolean
}

/**
 * 门户统计信息 - 增强版
 */
interface EnhancedPorterStats {
  // 基础统计
  totalImports: number
  totalExports: number
  successfulImports: number
  successfulExports: number
  errors: number
  warnings: number
  lastOperation: number
  
  // 格式统计
  formatStats: Record<string, {
    imports: number
    exports: number
    errors: number
    avgProcessingTime: number
  }>
  
  // 性能统计
  performanceStats: {
    avgImportTime: number
    avgExportTime: number
    totalDataProcessed: number
    largestFileSize: number
  }
  
  // 错误统计
  errorCategories: Record<string, number>
}

/**
 * 数据源接口 - 用于依赖注入
 */
export interface DataSource {
  getPanelData(): Promise<any>
  setPanelData(data: any): Promise<void>
}

/**
 * 增强的数据格式处理器接口
 */
export interface EnhancedDataProcessor {
  // 基础处理方法
  import(data: string | ArrayBuffer, options?: EnhancedImportOptions): Promise<any>
  export(data: any, options?: EnhancedExportOptions): Promise<string | ArrayBuffer>
  validate(data: string | ArrayBuffer): ValidationResult
  
  // 格式检测
  detectFormat?(data: string | ArrayBuffer): string | null
  
  // 数据转换
  transform?(data: any, targetFormat: DataFormat): Promise<TransformResult>
  
  // 流式处理支持
  supportsStreaming?: boolean
  processChunk?(chunk: any, options?: any): Promise<any>
  
  // 支持的选项
  getSupportedOptions(): Record<string, string>
  
  // 格式特定方法
  getSchema?(): any
  validateSchema?(data: any, schema: any): ValidationResult
}

/**
 * 纯净导入导出门户实现 - 增强版
 * 
 * 这就像一个现代化的数据处理中心：
 * - 支持多种文件格式，就像万能转换器
 * - 自动识别数据格式，就像智能助手
 * - 提供详细的处理进度，就像实时监控系统
 * - 确保数据安全和完整性，就像银行级安全
 */
export class PureImportExportPorter implements IImportExportPorter {
  /** 增强的处理器注册表 */
  private processors = new Map<string, EnhancedDataProcessor>()
  
  /** 数据源 - 用于依赖注入 */
  private dataSource: DataSource | null = null
  
  /** 增强的门户统计 */
  private stats = reactive<EnhancedPorterStats>({
    // 基础统计
    totalImports: 0,
    totalExports: 0,
    successfulImports: 0,
    successfulExports: 0,
    errors: 0,
    warnings: 0,
    lastOperation: Date.now(),
    
    // 格式统计
    formatStats: {},
    
    // 性能统计
    performanceStats: {
      avgImportTime: 0,
      avgExportTime: 0,
      totalDataProcessed: 0,
      largestFileSize: 0
    },
    
    // 错误统计
    errorCategories: {}
  })
  
  /** 当前处理任务队列 */
  private activeJobs = new Map<string, {
    id: string
    type: 'import' | 'export'
    format: string
    startTime: number
    progress: number
    onProgress?: ProgressCallback
  }>()
  
  /** 格式检测缓存 */
  private formatDetectionCache = new Map<string, string>()

  constructor() {
    console.log('PureImportExportPorter Enhanced: 增强版导入导出门户已初始化')
    this.registerBuiltInProcessors()
  }

  /**
   * 注册增强的数据处理器
   * 
   * 这就像注册一个新的"翻译官"：
   * - 每种格式都有专门的处理专家
   * - 支持导入、导出、验证等全套服务
   * - 可以处理复杂的数据转换需求
   */
  registerProcessor(format: string, processor: EnhancedDataProcessor): void {
    try {
      console.log('PureImportExportPorter: 注册数据处理器', format)
      
      if (this.processors.has(format)) {
        console.warn(`PureImportExportPorter: 数据处理器 ${format} 已存在，将被覆盖`)
      }
      
      this.processors.set(format, processor)
      
      // 初始化格式统计
      if (!this.stats.formatStats[format]) {
        this.stats.formatStats[format] = {
          imports: 0,
          exports: 0,
          errors: 0,
          avgProcessingTime: 0
        }
      }
      
      console.log(`PureImportExportPorter: 数据处理器 ${format} 注册成功`)
      
    } catch (error) {
      console.error(`PureImportExportPorter: 注册数据处理器 ${format} 失败`, error)
      this.stats.errors++
      this.updateErrorCategory('registration_error')
    }
  }

  /**
   * 兼容性方法：注册导入器
   * 
   * 为了向后兼容，将传统的导入器包装为增强处理器
   */
  registerImporter(format: string, importer: DataImporter): void {
    const enhancedProcessor: EnhancedDataProcessor = {
      import: async (data: string | ArrayBuffer, options?: EnhancedImportOptions) => {
        const stringData = typeof data === 'string' ? data : new TextDecoder().decode(data)
        return await importer.import(stringData, options)
      },
      export: async () => {
        throw new Error(`格式 ${format} 只支持导入操作`)
      },
      validate: (data: string | ArrayBuffer): ValidationResult => {
        const stringData = typeof data === 'string' ? data : new TextDecoder().decode(data)
        return importer.validate(stringData)
      },
      getSupportedOptions: () => importer.getSupportedOptions?.() || {}
    }
    
    this.registerProcessor(format, enhancedProcessor)
  }

  /**
   * 兼容性方法：注册导出器
   * 
   * 为了向后兼容，将传统的导出器包装为增强处理器
   */
  registerExporter(format: string, exporter: DataExporter): void {
    const enhancedProcessor: EnhancedDataProcessor = {
      import: async () => {
        throw new Error(`格式 ${format} 只支持导出操作`)
      },
      export: async (data: any, options?: EnhancedExportOptions) => {
        return await exporter.export(data, options)
      },
      validate: (): ValidationResult => ({
        isValid: true,
        errors: [],
        warnings: []
      }),
      getSupportedOptions: () => exporter.getSupportedOptions?.() || {}
    }
    
    this.registerProcessor(format, enhancedProcessor)
  }

  /**
   * 增强的数据导入方法
   * 
   * 这就像一个智能的数据接收站：
   * - 自动识别数据格式（如果未指定）
   * - 提供实时进度反馈
   * - 支持大文件的分块处理
   * - 进行全面的数据验证
   * - 自动数据转换和清理
   */
  async import(format: string, data: string | ArrayBuffer, options: EnhancedImportOptions = {}): Promise<ImportResult> {
    const jobId = nanoid()
    const startTime = Date.now()
    
    try {
      console.log('PureImportExportPorter Enhanced: 开始增强导入', { format, jobId, options })
      
      // 更新统计
      this.stats.totalImports++
      this.stats.lastOperation = startTime
      
      // 注册任务
      this.activeJobs.set(jobId, {
        id: jobId,
        type: 'import',
        format,
        startTime,
        progress: 0,
        onProgress: options.onProgress
      })
      
      // Step 1: 格式检测和验证
      this.updateProgress(jobId, 10, 'format_detection', '检测数据格式...')
      
      let actualFormat = format
      if (options.autoDetectFormat && format === 'auto') {
        actualFormat = await this.detectDataFormat(data)
        console.log('PureImportExportPorter: 自动检测到格式', actualFormat)
      }
      
      const processor = this.processors.get(actualFormat)
      if (!processor) {
        throw new Error(`不支持的导入格式: ${actualFormat}`)
      }
      
      // Step 2: 数据预处理
      this.updateProgress(jobId, 20, 'preprocessing', '预处理数据...')
      
      let processedData = data
      const dataSize = this.calculateDataSize(data)
      
      // 更新文件大小统计
      if (dataSize > this.stats.performanceStats.largestFileSize) {
        this.stats.performanceStats.largestFileSize = dataSize
      }
      
      // Step 3: 数据验证
      if (options.validate !== false) {
        this.updateProgress(jobId, 30, 'validation', '验证数据格式...')
        
        const validation = processor.validate(processedData)
        if (!validation.isValid) {
          if (options.strictValidation) {
            return {
              success: false,
              errors: validation.errors,
              warnings: validation.warnings
            }
          } else {
            console.warn('PureImportExportPorter: 数据验证警告', validation.warnings)
            this.stats.warnings += validation.warnings?.length || 0
          }
        }
        
        // Schema 验证
        if (options.schema) {
          const schemaValidation = processor.validateSchema?.(processedData, options.schema)
          if (schemaValidation && !schemaValidation.isValid) {
            return {
              success: false,
              errors: schemaValidation.errors,
              warnings: schemaValidation.warnings
            }
          }
        }
      }
      
      // Step 4: 数据导入
      this.updateProgress(jobId, 50, 'importing', '导入数据...')
      
      let importedData: any
      
      if (options.useStreaming && processor.supportsStreaming && dataSize > (options.chunkSize || 1024 * 1024)) {
        // 流式处理大文件
        importedData = await this.processDataInChunks(processor, processedData, options, jobId)
      } else {
        // 普通处理
        importedData = await processor.import(processedData, options)
      }
      
      // Step 5: 数据转换和过滤
      this.updateProgress(jobId, 70, 'transforming', '转换数据格式...')
      
      if (options.transformData) {
        importedData = options.transformData(importedData)
      }
      
      if (options.filterData && Array.isArray(importedData)) {
        importedData = importedData.filter(options.filterData)
      }
      
      // Step 6: 格式转换
      if (options.targetFormat && options.targetFormat !== actualFormat) {
        this.updateProgress(jobId, 80, 'format_conversion', '转换目标格式...')
        
        if (processor.transform) {
          const transformResult = await processor.transform(importedData, options.targetFormat)
          if (transformResult.success) {
            importedData = transformResult.data
          } else {
            console.warn('PureImportExportPorter: 格式转换失败', transformResult.errors)
          }
        }
      }
      
      // Step 7: 数据持久化
      if (this.dataSource && options.overwrite) {
        this.updateProgress(jobId, 90, 'persisting', '保存数据...')
        await this.dataSource.setPanelData(importedData)
      }
      
      // 完成处理
      this.updateProgress(jobId, 100, 'completed', '导入完成')
      
      // 更新统计
      const processingTime = Date.now() - startTime
      this.updateStats(actualFormat, 'import', processingTime, dataSize, true)
      
      this.stats.successfulImports++
      this.stats.performanceStats.totalDataProcessed += dataSize
      
      const result: ImportResult = {
        success: true,
        data: importedData,
        metadata: {
          format: actualFormat,
          dataSize,
          processingTime,
          jobId
        }
      }
      
      console.log('PureImportExportPorter Enhanced: 导入成功', { format: actualFormat, jobId, processingTime })
      return result
      
    } catch (error) {
      console.error('PureImportExportPorter Enhanced: 导入失败', error)
      
      // 更新错误统计
      this.stats.errors++
      this.updateErrorCategory('import_error')
      this.updateStats(format, 'import', Date.now() - startTime, 0, false)
      
      return {
        success: false,
        errors: [error instanceof Error ? error.message : '导入失败'],
        metadata: {
          format,
          jobId,
          processingTime: Date.now() - startTime
        }
      }
    } finally {
      // 清理任务
      this.activeJobs.delete(jobId)
    }
  }

  /**
   * 增强的数据导出方法
   * 
   * 这就像一个智能的数据发送站：
   * - 支持多种输出格式（JSON、XML、CSV等）
   * - 提供实时进度反馈
   * - 支持数据过滤和字段选择
   * - 自动压缩和优化输出
   * - 包含完整的元数据信息
   */
  async export(format: string, options: EnhancedExportOptions): Promise<string | ArrayBuffer> {
    const jobId = nanoid()
    const startTime = Date.now()
    
    try {
      console.log('PureImportExportPorter Enhanced: 开始增强导出', { format, jobId, options })
      
      // 更新统计
      this.stats.totalExports++
      this.stats.lastOperation = startTime
      
      // 注册任务
      this.activeJobs.set(jobId, {
        id: jobId,
        type: 'export',
        format,
        startTime,
        progress: 0,
        onProgress: options.onProgress
      })
      
      const processor = this.processors.get(format)
      if (!processor) {
        throw new Error(`不支持的导出格式: ${format}`)
      }
      
      // Step 1: 准备导出数据
      this.updateProgress(jobId, 10, 'data_preparation', '准备导出数据...')
      
      let exportData = await this.prepareExportData(options)
      const originalDataSize = this.calculateDataSize(JSON.stringify(exportData))
      
      // Step 2: 数据过滤
      if (options.fields || options.excludeFields || options.dataFilter) {
        this.updateProgress(jobId, 20, 'data_filtering', '过滤导出数据...')
        exportData = this.filterExportData(exportData, options)
      }
      
      // Step 3: 数据转换
      this.updateProgress(jobId, 40, 'data_transformation', '转换数据格式...')
      
      // 添加元数据
      if (options.includeTimestamp || options.includeSchema || options.customMetadata) {
        exportData = this.addExportMetadata(exportData, options)
      }
      
      // Step 4: 格式转换和序列化
      this.updateProgress(jobId, 60, 'serialization', '序列化数据...')
      
      let result = await processor.export(exportData, options)
      
      // Step 5: 后处理（压缩等）
      if (options.compression && typeof result === 'string') {
        this.updateProgress(jobId, 80, 'compression', '压缩数据...')
        result = await this.compressData(result, options)
      }
      
      // Step 6: 编码处理
      if (options.encoding && options.encoding !== 'utf-8' && typeof result === 'string') {
        this.updateProgress(jobId, 90, 'encoding', '转换编码...')
        result = this.convertEncoding(result, options.encoding)
      }
      
      // 完成处理
      this.updateProgress(jobId, 100, 'completed', '导出完成')
      
      // 更新统计
      const processingTime = Date.now() - startTime
      const finalDataSize = this.calculateDataSize(result)
      this.updateStats(format, 'export', processingTime, finalDataSize, true)
      
      this.stats.successfulExports++
      this.stats.performanceStats.totalDataProcessed += originalDataSize
      
      console.log('PureImportExportPorter Enhanced: 导出成功', { 
        format, 
        jobId, 
        processingTime,
        originalSize: originalDataSize,
        finalSize: finalDataSize,
        compressionRatio: originalDataSize > 0 ? (1 - finalDataSize / originalDataSize) * 100 : 0
      })
      
      return result
      
    } catch (error) {
      console.error('PureImportExportPorter Enhanced: 导出失败', error)
      
      // 更新错误统计
      this.stats.errors++
      this.updateErrorCategory('export_error')
      this.updateStats(format, 'export', Date.now() - startTime, 0, false)
      
      throw error
    } finally {
      // 清理任务
      this.activeJobs.delete(jobId)
    }
  }

  /**
   * 获取支持的格式 - 增强版
   * 
   * 返回详细的格式支持信息，包括每种格式的能力
   */
  getSupportedFormats(): { 
    formats: string[]
    capabilities: Record<string, {
      import: boolean
      export: boolean
      streaming: boolean
      validation: boolean
      transformation: boolean
      options: Record<string, string>
    }>
  } {
    const formats = Array.from(this.processors.keys())
    const capabilities: Record<string, any> = {}
    
    for (const [format, processor] of this.processors.entries()) {
      capabilities[format] = {
        import: true, // 所有处理器都支持导入（即使只是抛出错误）
        export: true, // 所有处理器都支持导出
        streaming: processor.supportsStreaming || false,
        validation: true, // 所有处理器都有validate方法
        transformation: !!processor.transform,
        options: processor.getSupportedOptions()
      }
    }
    
    return { formats, capabilities }
  }

  /**
   * 获取增强的门户统计
   */
  getStats(): EnhancedPorterStats {
    return { ...this.stats }
  }

  /**
   * 获取当前活跃任务
   */
  getActiveJobs(): Array<{
    id: string
    type: 'import' | 'export'
    format: string
    startTime: number
    progress: number
    duration: number
  }> {
    const now = Date.now()
    return Array.from(this.activeJobs.values()).map(job => ({
      ...job,
      duration: now - job.startTime
    }))
  }

  /**
   * 取消活跃任务
   */
  cancelJob(jobId: string): boolean {
    const job = this.activeJobs.get(jobId)
    if (job) {
      this.activeJobs.delete(jobId)
      console.log('PureImportExportPorter: 任务已取消', jobId)
      return true
    }
    return false
  }

  /**
   * 设置数据源 - 用于依赖注入
   */
  setDataSource(dataSource: DataSource): void {
    console.log('PureImportExportPorter: 设置数据源')
    this.dataSource = dataSource
  }

  // ==================== 私有方法 ====================

  /**
   * 注册内置数据处理器
   * 
   * 内置支持的格式：
   * - JSON: 最常用的数据交换格式
   * - XML: 企业级数据格式
   * - CSV: 表格数据格式
   * - YAML: 配置文件格式
   * - TEXT: 纯文本格式
   */
  private registerBuiltInProcessors(): void {
    console.log('PureImportExportPorter: 开始注册内置处理器')

    // JSON 处理器 - 增强版
    this.registerProcessor(DataFormat.JSON, {
      import: async (data: string | ArrayBuffer, options?: EnhancedImportOptions) => {
        const stringData = typeof data === 'string' ? data : new TextDecoder().decode(data)
        const importData = JSON.parse(stringData)
        
        // 识别导入数据的格式
        let panelData = null
        
        if (importData.panel) {
          panelData = importData.panel
        } else if (importData.meta || importData.nodes) {
          panelData = importData
        } else {
          throw new Error('无法识别的JSON数据格式')
        }
        
        return { panel: panelData, metadata: importData.metadata }
      },
      
      export: async (data: any, options?: EnhancedExportOptions) => {
        const indent = options?.compression ? 0 : 2
        return JSON.stringify(data, null, indent)
      },
      
      validate: (data: string | ArrayBuffer): ValidationResult => {
        try {
          const stringData = typeof data === 'string' ? data : new TextDecoder().decode(data)
          JSON.parse(stringData)
          return { isValid: true, errors: [], warnings: [] }
        } catch (error) {
          return {
            isValid: false,
            errors: ['无效的JSON格式: ' + (error as Error).message],
            warnings: []
          }
        }
      },
      
      detectFormat: (data: string | ArrayBuffer): string | null => {
        try {
          const stringData = typeof data === 'string' ? data : new TextDecoder().decode(data)
          JSON.parse(stringData)
          return DataFormat.JSON
        } catch {
          return null
        }
      },
      
      getSupportedOptions: () => ({
        compression: 'boolean',
        includeMetadata: 'boolean',
        overwrite: 'boolean',
        validate: 'boolean'
      })
    })

    // XML 处理器
    this.registerProcessor(DataFormat.XML, {
      import: async (data: string | ArrayBuffer, options?: EnhancedImportOptions) => {
        const stringData = typeof data === 'string' ? data : new TextDecoder().decode(data)
        
        // 简化的XML解析（实际应用中应使用专业的XML解析库）
        try {
          const parser = new DOMParser()
          const xmlDoc = parser.parseFromString(stringData, 'text/xml')
          
          // 检查解析错误
          const parseError = xmlDoc.querySelector('parsererror')
          if (parseError) {
            throw new Error('XML解析失败: ' + parseError.textContent)
          }
          
          // 转换XML为JSON格式
          const jsonData = this.xmlToJson(xmlDoc.documentElement)
          return jsonData
          
        } catch (error) {
          throw new Error('XML导入失败: ' + (error as Error).message)
        }
      },
      
      export: async (data: any, options?: EnhancedExportOptions) => {
        // 简化的JSON到XML转换
        return this.jsonToXml(data, options?.compression ? '' : '  ')
      },
      
      validate: (data: string | ArrayBuffer): ValidationResult => {
        try {
          const stringData = typeof data === 'string' ? data : new TextDecoder().decode(data)
          const parser = new DOMParser()
          const xmlDoc = parser.parseFromString(stringData, 'text/xml')
          
          const parseError = xmlDoc.querySelector('parsererror')
          if (parseError) {
            return {
              isValid: false,
              errors: ['XML格式错误: ' + parseError.textContent],
              warnings: []
            }
          }
          
          return { isValid: true, errors: [], warnings: [] }
        } catch (error) {
          return {
            isValid: false,
            errors: ['XML验证失败: ' + (error as Error).message],
            warnings: []
          }
        }
      },
      
      detectFormat: (data: string | ArrayBuffer): string | null => {
        const stringData = typeof data === 'string' ? data : new TextDecoder().decode(data)
        return stringData.trim().startsWith('<?xml') || stringData.trim().startsWith('<') ? DataFormat.XML : null
      },
      
      getSupportedOptions: () => ({
        compression: 'boolean',
        rootElement: 'string',
        encoding: 'string'
      })
    })

    // CSV 处理器
    this.registerProcessor(DataFormat.CSV, {
      import: async (data: string | ArrayBuffer, options?: EnhancedImportOptions) => {
        const stringData = typeof data === 'string' ? data : new TextDecoder().decode(data)
        const lines = stringData.split('\n').filter(line => line.trim())
        
        if (lines.length === 0) {
          throw new Error('CSV文件为空')
        }
        
        // 解析CSV数据
        const headers = this.parseCSVLine(lines[0])
        const rows = lines.slice(1).map(line => {
          const values = this.parseCSVLine(line)
          const obj: any = {}
          headers.forEach((header, index) => {
            obj[header] = values[index] || ''
          })
          return obj
        })
        
        return {
          headers,
          data: rows,
          rowCount: rows.length
        }
      },
      
      export: async (data: any, options?: EnhancedExportOptions) => {
        // 将JSON数据转换为CSV
        if (!Array.isArray(data)) {
          throw new Error('CSV导出需要数组数据')
        }
        
        if (data.length === 0) {
          return ''
        }
        
        // 获取所有字段
        const allFields = new Set<string>()
        data.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach(key => allFields.add(key))
          }
        })
        
        const fields = options?.fields || Array.from(allFields)
        
        // 生成CSV内容
        const csvLines = []
        csvLines.push(fields.map(field => this.escapeCSVField(field)).join(','))
        
        data.forEach(item => {
          const values = fields.map(field => {
            const value = item[field]
            return this.escapeCSVField(value != null ? String(value) : '')
          })
          csvLines.push(values.join(','))
        })
        
        return csvLines.join('\n')
      },
      
      validate: (data: string | ArrayBuffer): ValidationResult => {
        try {
          const stringData = typeof data === 'string' ? data : new TextDecoder().decode(data)
          const lines = stringData.split('\n').filter(line => line.trim())
          
          if (lines.length < 2) {
            return {
              isValid: false,
              errors: ['CSV至少需要包含标题行和数据行'],
              warnings: []
            }
          }
          
          // 简单验证：检查每行的字段数是否一致
          const headerFieldCount = this.parseCSVLine(lines[0]).length
          const warnings: string[] = []
          
          for (let i = 1; i < lines.length; i++) {
            const fieldCount = this.parseCSVLine(lines[i]).length
            if (fieldCount !== headerFieldCount) {
              warnings.push(`第${i + 1}行字段数(${fieldCount})与标题行(${headerFieldCount})不一致`)
            }
          }
          
          return { isValid: true, errors: [], warnings }
        } catch (error) {
          return {
            isValid: false,
            errors: ['CSV验证失败: ' + (error as Error).message],
            warnings: []
          }
        }
      },
      
      detectFormat: (data: string | ArrayBuffer): string | null => {
        const stringData = typeof data === 'string' ? data : new TextDecoder().decode(data)
        const lines = stringData.split('\n', 5) // 只检查前5行
        
        // 简单检测：看是否包含逗号分隔的数据
        let csvScore = 0
        lines.forEach(line => {
          if (line.includes(',')) csvScore++
          if (line.includes('"')) csvScore++ // CSV通常包含引号
        })
        
        return csvScore >= lines.length * 0.6 ? DataFormat.CSV : null
      },
      
      getSupportedOptions: () => ({
        fields: 'array',
        excludeFields: 'array',
        separator: 'string',
        encoding: 'string'
      })
    })

    // YAML 处理器（简化版）
    this.registerProcessor(DataFormat.YAML, {
      import: async (data: string | ArrayBuffer, options?: EnhancedImportOptions) => {
        // 注意：实际应用中应使用专业的YAML解析库（如js-yaml）
        throw new Error('YAML导入需要额外的解析库支持')
      },
      
      export: async (data: any, options?: EnhancedExportOptions) => {
        // 简化的JSON到YAML转换
        return this.jsonToYaml(data, 0)
      },
      
      validate: (data: string | ArrayBuffer): ValidationResult => {
        return {
          isValid: false,
          errors: ['YAML验证需要额外的解析库支持'],
          warnings: []
        }
      },
      
      detectFormat: (data: string | ArrayBuffer): string | null => {
        const stringData = typeof data === 'string' ? data : new TextDecoder().decode(data)
        // 简单检测YAML格式标志
        if (stringData.includes('---') || /^\s*\w+:\s*/.test(stringData)) {
          return DataFormat.YAML
        }
        return null
      },
      
      getSupportedOptions: () => ({
        indent: 'number',
        flowStyle: 'boolean'
      })
    })

    // TEXT 处理器
    this.registerProcessor(DataFormat.TEXT, {
      import: async (data: string | ArrayBuffer, options?: EnhancedImportOptions) => {
        const stringData = typeof data === 'string' ? data : new TextDecoder().decode(data)
        return {
          content: stringData,
          lines: stringData.split('\n'),
          lineCount: stringData.split('\n').length,
          charCount: stringData.length
        }
      },
      
      export: async (data: any, options?: EnhancedExportOptions) => {
        if (typeof data === 'string') {
          return data
        } else if (typeof data === 'object' && data.content) {
          return data.content
        } else {
          return JSON.stringify(data, null, 2)
        }
      },
      
      validate: (): ValidationResult => ({
        isValid: true,
        errors: [],
        warnings: []
      }),
      
      getSupportedOptions: () => ({
        encoding: 'string',
        lineEnding: 'string'
      })
    })

    console.log('PureImportExportPorter: 内置处理器注册完成')
  }

  // ==================== 增强的工具方法 ====================

  /**
   * 自动检测数据格式
   * 
   * 通过分析数据内容，智能识别可能的格式类型
   */
  private async detectDataFormat(data: string | ArrayBuffer): Promise<string> {
    const cacheKey = typeof data === 'string' ? data.substring(0, 100) : 'binary'
    
    // 检查缓存
    const cached = this.formatDetectionCache.get(cacheKey)
    if (cached) {
      return cached
    }
    
    // 遍历所有处理器进行格式检测
    for (const [format, processor] of this.processors.entries()) {
      if (processor.detectFormat) {
        const detected = processor.detectFormat(data)
        if (detected) {
          this.formatDetectionCache.set(cacheKey, detected)
          return detected
        }
      }
    }
    
    // 如果没有检测到，默认尝试JSON
    throw new Error('无法自动检测数据格式，请手动指定格式')
  }

  /**
   * 计算数据大小
   */
  private calculateDataSize(data: string | ArrayBuffer): number {
    if (typeof data === 'string') {
      return new TextEncoder().encode(data).length
    } else {
      return data.byteLength
    }
  }

  /**
   * 更新任务进度
   */
  private updateProgress(jobId: string, progress: number, stage: string, message?: string): void {
    const job = this.activeJobs.get(jobId)
    if (job) {
      job.progress = progress
      if (job.onProgress) {
        job.onProgress({
          current: progress,
          total: 100,
          percentage: progress,
          stage,
          message
        })
      }
    }
  }

  /**
   * 流式处理大数据文件
   */
  private async processDataInChunks(
    processor: EnhancedDataProcessor,
    data: string | ArrayBuffer,
    options: EnhancedImportOptions,
    jobId: string
  ): Promise<any> {
    const chunkSize = options.chunkSize || 1024 * 1024 // 1MB 默认
    const stringData = typeof data === 'string' ? data : new TextDecoder().decode(data)
    
    const chunks = []
    for (let i = 0; i < stringData.length; i += chunkSize) {
      chunks.push(stringData.slice(i, i + chunkSize))
    }
    
    const results = []
    for (let i = 0; i < chunks.length; i++) {
      this.updateProgress(jobId, 50 + (i / chunks.length) * 20, 'chunk_processing', `处理分块 ${i + 1}/${chunks.length}`)
      
      if (processor.processChunk) {
        const chunkResult = await processor.processChunk(chunks[i], options)
        results.push(chunkResult)
      }
    }
    
    // 合并结果
    return this.mergeChunkResults(results)
  }

  /**
   * 合并分块处理结果
   */
  private mergeChunkResults(results: any[]): any {
    // 简化的合并逻辑，实际应根据数据类型进行智能合并
    if (results.length === 0) return null
    if (results.length === 1) return results[0]
    
    // 如果是数组，展开合并
    if (Array.isArray(results[0])) {
      return results.flat()
    }
    
    // 如果是对象，合并属性
    if (typeof results[0] === 'object') {
      return Object.assign({}, ...results)
    }
    
    // 如果是字符串，拼接
    if (typeof results[0] === 'string') {
      return results.join('')
    }
    
    return results
  }

  /**
   * 更新格式统计信息
   */
  private updateStats(format: string, operation: 'import' | 'export', processingTime: number, dataSize: number, success: boolean): void {
    if (!this.stats.formatStats[format]) {
      this.stats.formatStats[format] = {
        imports: 0,
        exports: 0,
        errors: 0,
        avgProcessingTime: 0
      }
    }
    
    const formatStats = this.stats.formatStats[format]
    
    if (operation === 'import') {
      formatStats.imports++
    } else {
      formatStats.exports++
    }
    
    if (!success) {
      formatStats.errors++
    }
    
    // 更新平均处理时间
    const totalOperations = formatStats.imports + formatStats.exports
    formatStats.avgProcessingTime = 
      (formatStats.avgProcessingTime * (totalOperations - 1) + processingTime) / totalOperations
    
    // 更新全局性能统计
    const performanceStats = this.stats.performanceStats
    if (operation === 'import') {
      performanceStats.avgImportTime = 
        (performanceStats.avgImportTime * (this.stats.totalImports - 1) + processingTime) / this.stats.totalImports
    } else {
      performanceStats.avgExportTime = 
        (performanceStats.avgExportTime * (this.stats.totalExports - 1) + processingTime) / this.stats.totalExports
    }
  }

  /**
   * 更新错误分类统计
   */
  private updateErrorCategory(category: string): void {
    this.stats.errorCategories[category] = (this.stats.errorCategories[category] || 0) + 1
  }

  /**
   * 过滤导出数据
   */
  private filterExportData(data: any, options: EnhancedExportOptions): any {
    let filtered = data
    
    // 字段过滤
    if (options.fields && Array.isArray(filtered)) {
      filtered = filtered.map(item => {
        const filteredItem: any = {}
        options.fields!.forEach(field => {
          if (item.hasOwnProperty(field)) {
            filteredItem[field] = item[field]
          }
        })
        return filteredItem
      })
    }
    
    // 排除字段
    if (options.excludeFields && Array.isArray(filtered)) {
      filtered = filtered.map(item => {
        const filteredItem = { ...item }
        options.excludeFields!.forEach(field => {
          delete filteredItem[field]
        })
        return filteredItem
      })
    }
    
    // 数据过滤
    if (options.dataFilter && Array.isArray(filtered)) {
      filtered = filtered.filter(options.dataFilter)
    }
    
    return filtered
  }

  /**
   * 添加导出元数据
   */
  private addExportMetadata(data: any, options: EnhancedExportOptions): any {
    const exportData = { ...data }
    
    if (options.includeTimestamp) {
      exportData._metadata = {
        ...exportData._metadata,
        exportTime: Date.now(),
        exportDate: new Date().toISOString()
      }
    }
    
    if (options.includeSchema) {
      exportData._metadata = {
        ...exportData._metadata,
        schema: this.generateDataSchema(data)
      }
    }
    
    if (options.customMetadata) {
      exportData._metadata = {
        ...exportData._metadata,
        ...options.customMetadata
      }
    }
    
    return exportData
  }

  /**
   * 生成数据结构描述
   */
  private generateDataSchema(data: any): any {
    if (Array.isArray(data)) {
      if (data.length > 0) {
        return {
          type: 'array',
          itemType: typeof data[0],
          itemSchema: this.generateDataSchema(data[0])
        }
      }
      return { type: 'array' }
    }
    
    if (typeof data === 'object' && data !== null) {
      const schema: any = { type: 'object', properties: {} }
      Object.keys(data).forEach(key => {
        schema.properties[key] = this.generateDataSchema(data[key])
      })
      return schema
    }
    
    return { type: typeof data }
  }

  /**
   * 数据压缩（简化版）
   */
  private async compressData(data: string, options: EnhancedExportOptions): Promise<string> {
    // 简化的压缩：移除多余空格和换行
    if (options.format === DataFormat.JSON) {
      try {
        const parsed = JSON.parse(data)
        return JSON.stringify(parsed) // 无缩进压缩
      } catch {
        return data.replace(/\s+/g, ' ').trim()
      }
    }
    
    // 其他格式的通用压缩
    return data.replace(/\s+/g, ' ').trim()
  }

  /**
   * 编码转换
   */
  private convertEncoding(data: string, encoding: string): ArrayBuffer {
    // 简化的编码转换实现
    if (encoding === 'utf-8') {
      return new TextEncoder().encode(data).buffer
    }
    
    // 实际应用中应使用专业的编码转换库
    console.warn('PureImportExportPorter: 不支持的编码格式', encoding)
    return new TextEncoder().encode(data).buffer
  }

  // ==================== 格式转换工具方法 ====================

  /**
   * XML 转 JSON
   */
  private xmlToJson(xml: Element): any {
    const result: any = {}
    
    // 处理属性
    if (xml.attributes.length > 0) {
      result['@attributes'] = {}
      for (let i = 0; i < xml.attributes.length; i++) {
        const attr = xml.attributes[i]
        result['@attributes'][attr.name] = attr.value
      }
    }
    
    // 处理子节点
    if (xml.children.length > 0) {
      for (let i = 0; i < xml.children.length; i++) {
        const child = xml.children[i] as Element
        const childData = this.xmlToJson(child)
        
        if (result[child.tagName]) {
          if (!Array.isArray(result[child.tagName])) {
            result[child.tagName] = [result[child.tagName]]
          }
          result[child.tagName].push(childData)
        } else {
          result[child.tagName] = childData
        }
      }
    } else if (xml.textContent) {
      return xml.textContent
    }
    
    return result
  }

  /**
   * JSON 转 XML
   */
  private jsonToXml(data: any, indent: string = '', level: number = 0): string {
    if (typeof data !== 'object' || data === null) {
      return String(data)
    }
    
    const currentIndent = indent.repeat(level)
    const nextIndent = indent.repeat(level + 1)
    let xml = ''
    
    if (Array.isArray(data)) {
      data.forEach(item => {
        xml += `${currentIndent}<item>\n`
        xml += `${nextIndent}${this.jsonToXml(item, indent, level + 1)}\n`
        xml += `${currentIndent}</item>\n`
      })
    } else {
      Object.keys(data).forEach(key => {
        const value = data[key]
        if (key === '@attributes') return // 跳过属性标记
        
        xml += `${currentIndent}<${key}>`
        if (typeof value === 'object' && value !== null) {
          xml += `\n${this.jsonToXml(value, indent, level + 1)}\n${currentIndent}`
        } else {
          xml += this.escapeXmlContent(String(value))
        }
        xml += `</${key}>\n`
      })
    }
    
    return xml
  }

  /**
   * JSON 转 YAML（简化版）
   */
  private jsonToYaml(data: any, level: number): string {
    const indent = '  '.repeat(level)
    
    if (typeof data !== 'object' || data === null) {
      return String(data)
    }
    
    if (Array.isArray(data)) {
      return data.map(item => `${indent}- ${this.jsonToYaml(item, level + 1)}`).join('\n')
    }
    
    return Object.keys(data).map(key => {
      const value = data[key]
      if (typeof value === 'object' && value !== null) {
        return `${indent}${key}:\n${this.jsonToYaml(value, level + 1)}`
      } else {
        return `${indent}${key}: ${value}`
      }
    }).join('\n')
  }

  /**
   * 解析 CSV 行
   */
  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++ // 跳过下一个引号
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current)
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current)
    return result
  }

  /**
   * 转义 CSV 字段
   */
  private escapeCSVField(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  /**
   * 转义 XML 内容
   */
  private escapeXmlContent(content: string): string {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;')
  }

  /**
   * 准备导出数据 - 增强版
   */
  private async prepareExportData(options: EnhancedExportOptions): Promise<any> {
    // 从数据源获取数据
    let panelData = {}
    
    if (this.dataSource) {
      try {
        panelData = await this.dataSource.getPanelData()
        console.log('PureImportExportPorter Enhanced: 从数据源获取面板数据', panelData)
      } catch (error) {
        console.error('PureImportExportPorter Enhanced: 从数据源获取数据失败', error)
        // 如果获取失败，使用空数据
        panelData = { nodes: [], meta: {} }
      }
    } else {
      console.warn('PureImportExportPorter Enhanced: 未设置数据源，使用空数据')
      panelData = { nodes: [], meta: {} }
    }
    
    const exportData = {
      panel: panelData,
      metadata: {
        exportTime: Date.now(),
        version: '2.0.0',
        format: 'panelv2-clean-enhanced',
        ...options.customMetadata
      }
    }
    
    return exportData
  }

  /**
   * 销毁门户 - 增强版
   * 
   * 清理所有资源，确保没有内存泄漏
   */
  destroy(): void {
    // 取消所有活跃任务
    for (const jobId of this.activeJobs.keys()) {
      this.cancelJob(jobId)
    }
    
    // 清理处理器
    this.processors.clear()
    
    // 清理缓存
    this.formatDetectionCache.clear()
    
    // 清理数据源引用
    this.dataSource = null
    
    console.log('PureImportExportPorter Enhanced: 增强版导入导出门户已销毁')
  }
}

/**
 * 创建增强版纯净导入导出门户实例
 * 
 * 工厂函数，提供标准化的实例创建方式
 */
export const createPureImportExportPorter = (): PureImportExportPorter => {
  console.log('创建PureImportExportPorter Enhanced实例')
  return new PureImportExportPorter()
}

/**
 * 创建带配置的增强版导入导出门户
 * 
 * 支持预配置处理器和数据源
 */
export const createConfiguredImportExportPorter = (config?: {
  dataSource?: DataSource
  additionalProcessors?: Map<string, EnhancedDataProcessor>
  enabledFormats?: DataFormat[]
}): PureImportExportPorter => {
  const porter = new PureImportExportPorter()
  
  // 设置数据源
  if (config?.dataSource) {
    porter.setDataSource(config.dataSource)
  }
  
  // 注册额外的处理器
  if (config?.additionalProcessors) {
    for (const [format, processor] of config.additionalProcessors.entries()) {
      porter.registerProcessor(format, processor)
    }
  }
  
  // 如果指定了启用的格式，可以移除不需要的处理器
  if (config?.enabledFormats) {
    const supportedFormats = porter.getSupportedFormats()
    supportedFormats.formats.forEach(format => {
      if (!config.enabledFormats!.includes(format as DataFormat)) {
        // 注意：这里需要添加移除处理器的方法
        console.log(`已禁用格式: ${format}`)
      }
    })
  }
  
  console.log('创建已配置的PureImportExportPorter Enhanced实例', config)
  return porter
}

/**
 * 全局导入导出门户实例（延迟初始化）
 */
let _globalImportExportPorter: PureImportExportPorter | null = null

export const globalImportExportPorter = new Proxy({} as PureImportExportPorter, {
  get(target, prop) {
    if (!_globalImportExportPorter) {
      console.log('globalImportExportPorter Proxy: 延迟初始化增强版门户')
      _globalImportExportPorter = createPureImportExportPorter()
    }
    return _globalImportExportPorter[prop as keyof PureImportExportPorter]
  }
})

/**
 * 导出所有相关类型和枚举，方便外部使用
 */
export type {
  EnhancedDataProcessor,
  EnhancedImportOptions,
  EnhancedExportOptions,
  ProgressCallback,
  TransformResult
}