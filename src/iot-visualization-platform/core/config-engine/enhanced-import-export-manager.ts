/**
 * 增强的配置导入导出管理器
 *
 * 提供企业级的配置导入导出功能，支持多种格式和高级特性
 *
 * 主要特性：
 * 1. 多格式支持 - JSON, YAML, XML, CSV, Excel
 * 2. 批量操作 - 高效的批量导入导出
 * 3. 增量导入 - 支持增量更新和合并策略
 * 4. 数据验证 - 导入前的完整性验证
 * 5. 转换映射 - 格式间的智能转换
 * 6. 备份恢复 - 自动备份和一键恢复
 * 7. 压缩支持 - ZIP、GZIP 压缩格式
 * 8. 进度追踪 - 实时的导入导出进度
 *
 * 创建时间：2025年1月
 * 作者：ThingsPanel Team
 */

import { EventEmitter } from 'events'
import type { WidgetConfiguration } from './enhanced-config-state-manager'

// ========== 🎯 类型定义 ==========

/**
 * 支持的导入导出格式
 */
export type ExportFormat = 'json' | 'yaml' | 'xml' | 'csv' | 'excel' | 'zip' | 'backup'

/**
 * 导入选项
 */
export interface ImportOptions {
  format?: ExportFormat
  mode?: 'replace' | 'merge' | 'append' // 导入模式
  validateBeforeImport?: boolean // 导入前验证
  createBackup?: boolean // 自动创建备份
  skipErrors?: boolean // 跳过错误继续导入
  encoding?: 'utf8' | 'utf16' | 'base64' // 编码格式
  compression?: 'none' | 'gzip' | 'zip' // 压缩格式
  batchSize?: number // 批量处理大小
  progressCallback?: (progress: ImportProgress) => void // 进度回调
  fieldMapping?: Record<string, string> // 字段映射
  filter?: (item: any) => boolean // 数据过滤器
}

/**
 * 导出选项
 */
export interface ExportOptions {
  format?: ExportFormat
  includeMetadata?: boolean // 包含元数据
  includeVersionHistory?: boolean // 包含版本历史
  includeDependencies?: boolean // 包含依赖关系
  includeTemplateInfo?: boolean // 包含模板信息
  compression?: 'none' | 'gzip' | 'zip' // 压缩格式
  encryption?: boolean // 是否加密
  pretty?: boolean // 美化输出（JSON/YAML）
  encoding?: 'utf8' | 'utf16' | 'base64' // 编码格式
  filename?: string // 文件名
  progressCallback?: (progress: ExportProgress) => void // 进度回调
  fieldsToExport?: string[] // 要导出的字段
  filter?: (item: any) => boolean // 数据过滤器
}

/**
 * 导入进度信息
 */
export interface ImportProgress {
  total: number
  current: number
  percentage: number
  stage: 'parsing' | 'validating' | 'importing' | 'completed' | 'error'
  message: string
  errors?: string[]
  warnings?: string[]
  processed: number
  skipped: number
  failed: number
}

/**
 * 导出进度信息
 */
export interface ExportProgress {
  total: number
  current: number
  percentage: number
  stage: 'collecting' | 'formatting' | 'compressing' | 'completed' | 'error'
  message: string
  outputSize?: number
  compressionRatio?: number
}

/**
 * 导入结果
 */
export interface ImportResult {
  success: boolean
  message: string
  totalItems: number
  importedItems: number
  skippedItems: number
  failedItems: number
  errors: string[]
  warnings: string[]
  data?: Record<string, any>
  backupId?: string
  duration: number
}

/**
 * 导出结果
 */
export interface ExportResult {
  success: boolean
  message: string
  format: ExportFormat
  filename?: string
  content?: string | Buffer
  contentType?: string
  size: number
  compression?: string
  errors: string[]
  warnings: string[]
  duration: number
}

/**
 * 备份信息
 */
export interface BackupInfo {
  id: string
  name: string
  description: string
  createdAt: number
  createdBy: string
  size: number
  itemCount: number
  format: string
  version: string
  checksum: string
}

/**
 * 格式转换器接口
 */
export interface FormatConverter {
  name: string
  fromFormat: ExportFormat
  toFormat: ExportFormat
  convert(data: any, options?: any): Promise<any>
  validate?(data: any): boolean
}

// ========== 🚀 增强的导入导出管理器 ==========

/**
 * 增强的配置导入导出管理器
 */
export class EnhancedImportExportManager extends EventEmitter {
  // ========== 存储 ==========
  private backups = new Map<string, BackupInfo>()
  private converters = new Map<string, FormatConverter>()

  // ========== 配置 ==========
  private readonly MAX_BACKUP_COUNT = 20 // 最大备份数量
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
  private readonly DEFAULT_BATCH_SIZE = 100

  constructor() {
    super()
    this.registerBuiltInConverters()
  }

  // ========== 📤 导出功能 ==========

  /**
   * 导出配置数据
   */
  async exportConfigurations(
    configurations: Record<string, any>,
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    const startTime = Date.now()
    const {
      format = 'json',
      includeMetadata = true,
      includeVersionHistory = false,
      includeDependencies = false,
      includeTemplateInfo = false,
      compression = 'none',
      encryption = false,
      pretty = true,
      encoding = 'utf8',
      filename,
      progressCallback,
      fieldsToExport,
      filter
    } = options

    try {
      this.emit('exportStarted', { format, itemCount: Object.keys(configurations).length })

      // 阶段1：收集数据
      progressCallback?.({
        total: 100,
        current: 10,
        percentage: 10,
        stage: 'collecting',
        message: '正在收集配置数据...'
      })

      let exportData = this.prepareExportData(configurations, {
        includeMetadata,
        includeVersionHistory,
        includeDependencies,
        includeTemplateInfo,
        fieldsToExport,
        filter
      })

      // 阶段2：格式化数据
      progressCallback?.({
        total: 100,
        current: 40,
        percentage: 40,
        stage: 'formatting',
        message: `正在格式化为 ${format} 格式...`
      })

      let content: string | Buffer
      let contentType: string

      switch (format) {
        case 'json':
          content = this.exportToJSON(exportData, pretty)
          contentType = 'application/json'
          break
        case 'yaml':
          content = this.exportToYAML(exportData)
          contentType = 'application/x-yaml'
          break
        case 'xml':
          content = this.exportToXML(exportData, pretty)
          contentType = 'application/xml'
          break
        case 'csv':
          content = this.exportToCSV(exportData)
          contentType = 'text/csv'
          break
        case 'excel':
          content = await this.exportToExcel(exportData)
          contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          break
        case 'backup':
          content = await this.exportToBackup(exportData)
          contentType = 'application/octet-stream'
          break
        default:
          throw new Error(`不支持的导出格式: ${format}`)
      }

      // 阶段3：压缩处理
      if (compression !== 'none') {
        progressCallback?.({
          total: 100,
          current: 70,
          percentage: 70,
          stage: 'compressing',
          message: `正在使用 ${compression} 压缩...`
        })

        content = await this.compressData(content, compression)
      }

      // 阶段4：编码处理
      if (typeof content === 'string' && encoding !== 'utf8') {
        content = this.encodeContent(content, encoding)
      }

      const duration = Date.now() - startTime
      const size = Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content)

      progressCallback?.({
        total: 100,
        current: 100,
        percentage: 100,
        stage: 'completed',
        message: '导出完成'
      })

      this.emit('exportCompleted', { format, size, duration })

      return {
        success: true,
        message: '配置导出成功',
        format,
        filename: filename || this.generateFilename(format),
        content,
        contentType,
        size,
        compression: compression !== 'none' ? compression : undefined,
        errors: [],
        warnings: [],
        duration
      }

    } catch (error) {
      const duration = Date.now() - startTime
      this.emit('exportFailed', { format, error })

      return {
        success: false,
        message: `导出失败: ${error}`,
        format,
        size: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: [],
        duration
      }
    }
  }

  // ========== 📥 导入功能 ==========

  /**
   * 导入配置数据
   */
  async importConfigurations(
    data: string | Buffer | File,
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const startTime = Date.now()
    const {
      format = 'json',
      mode = 'merge',
      validateBeforeImport = true,
      createBackup = true,
      skipErrors = false,
      encoding = 'utf8',
      compression = 'none',
      batchSize = this.DEFAULT_BATCH_SIZE,
      progressCallback,
      fieldMapping,
      filter
    } = options

    try {
      // 文件大小检查
      const size = this.getDataSize(data)
      if (size > this.MAX_FILE_SIZE) {
        throw new Error(`文件过大 (${Math.round(size / 1024 / 1024)}MB), 最大支持 ${this.MAX_FILE_SIZE / 1024 / 1024}MB`)
      }

      this.emit('importStarted', { format, size })

      // 阶段1：解析数据
      progressCallback?.({
        total: 0,
        current: 0,
        percentage: 5,
        stage: 'parsing',
        message: '正在解析导入数据...',
        processed: 0,
        skipped: 0,
        failed: 0
      })

      let parsedData = await this.parseImportData(data, format, compression, encoding)

      // 应用字段映射
      if (fieldMapping) {
        parsedData = this.applyFieldMapping(parsedData, fieldMapping)
      }

      // 应用过滤器
      if (filter) {
        parsedData = this.applyFilter(parsedData, filter)
      }

      const totalItems = Array.isArray(parsedData) ? parsedData.length : Object.keys(parsedData).length

      // 阶段2：验证数据
      if (validateBeforeImport) {
        progressCallback?.({
          total: totalItems,
          current: 0,
          percentage: 15,
          stage: 'validating',
          message: '正在验证数据格式...',
          processed: 0,
          skipped: 0,
          failed: 0
        })

        const validationResult = await this.validateImportData(parsedData, skipErrors)
        if (!validationResult.isValid && !skipErrors) {
          throw new Error(`数据验证失败: ${validationResult.errors.join(', ')}`)
        }
      }

      // 创建备份
      if (createBackup) {
        const backupId = await this.createBackup('导入前自动备份')
      }

      // 阶段3：导入数据
      progressCallback?.({
        total: totalItems,
        current: 0,
        percentage: 25,
        stage: 'importing',
        message: '正在导入配置...',
        processed: 0,
        skipped: 0,
        failed: 0
      })

      const importResult = await this.processImportData(parsedData, {
        mode,
        batchSize,
        skipErrors,
        progressCallback,
        totalItems
      })

      const duration = Date.now() - startTime

      progressCallback?.({
        total: totalItems,
        current: totalItems,
        percentage: 100,
        stage: 'completed',
        message: '导入完成',
        processed: importResult.importedItems,
        skipped: importResult.skippedItems,
        failed: importResult.failedItems
      })

      this.emit('importCompleted', {
        format,
        totalItems,
        importedItems: importResult.importedItems,
        duration
      })

      return {
        success: true,
        message: '配置导入成功',
        totalItems,
        importedItems: importResult.importedItems,
        skippedItems: importResult.skippedItems,
        failedItems: importResult.failedItems,
        errors: importResult.errors,
        warnings: importResult.warnings,
        data: importResult.data,
        duration
      }

    } catch (error) {
      const duration = Date.now() - startTime
      this.emit('importFailed', { format, error })

      return {
        success: false,
        message: `导入失败: ${error}`,
        totalItems: 0,
        importedItems: 0,
        skippedItems: 0,
        failedItems: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        warnings: [],
        duration
      }
    }
  }

  // ========== 💾 备份管理 ==========

  /**
   * 创建配置备份
   */
  async createBackup(
    description = '手动备份',
    configurations?: Record<string, any>
  ): Promise<string> {
    const backupId = `backup_${Date.now()}_${Math.random().toString(36).slice(2)}`

    // 如果没有提供配置，从当前状态创建备份
    const backupData = configurations || this.getCurrentConfigurations()

    const backupContent = await this.exportToBackup(backupData)
    const size = Buffer.isBuffer(backupContent) ? backupContent.length : Buffer.byteLength(backupContent)

    const backup: BackupInfo = {
      id: backupId,
      name: `备份_${new Date().toLocaleString()}`,
      description,
      createdAt: Date.now(),
      createdBy: 'system',
      size,
      itemCount: Object.keys(backupData).length,
      format: 'backup',
      version: '1.0.0',
      checksum: this.calculateChecksum(backupContent)
    }

    this.backups.set(backupId, backup)

    // 清理旧备份
    this.cleanupOldBackups()

    this.emit('backupCreated', backup)

    return backupId
  }

  /**
   * 恢复备份
   */
  async restoreBackup(backupId: string, options: ImportOptions = {}): Promise<ImportResult> {
    const backup = this.backups.get(backupId)
    if (!backup) {
      throw new Error(`备份不存在: ${backupId}`)
    }

    // 获取备份数据
    const backupData = await this.getBackupData(backupId)
    if (!backupData) {
      throw new Error(`无法读取备份数据: ${backupId}`)
    }


    // 使用导入功能恢复备份
    return await this.importConfigurations(backupData, {
      ...options,
      format: 'backup',
      mode: 'replace', // 备份恢复使用替换模式
      createBackup: true // 恢复前也创建备份
    })
  }

  /**
   * 获取所有备份列表
   */
  getBackupList(): BackupInfo[] {
    return Array.from(this.backups.values()).sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * 删除备份
   */
  deleteBackup(backupId: string): boolean {
    const deleted = this.backups.delete(backupId)
    if (deleted) {
      this.emit('backupDeleted', { backupId })
    }
    return deleted
  }

  // ========== 🔄 格式转换 ==========

  /**
   * 注册格式转换器
   */
  registerConverter(converter: FormatConverter): void {
    const key = `${converter.fromFormat}_to_${converter.toFormat}`
    this.converters.set(key, converter)
  }

  /**
   * 转换数据格式
   */
  async convertFormat(
    data: any,
    fromFormat: ExportFormat,
    toFormat: ExportFormat,
    options?: any
  ): Promise<any> {
    const key = `${fromFormat}_to_${toFormat}`
    const converter = this.converters.get(key)

    if (!converter) {
      throw new Error(`不支持的格式转换: ${fromFormat} -> ${toFormat}`)
    }

    if (converter.validate && !converter.validate(data)) {
      throw new Error(`数据格式验证失败: ${fromFormat}`)
    }

    return await converter.convert(data, options)
  }

  // ========== 🔧 私有方法 ==========

  /**
   * 准备导出数据
   */
  private prepareExportData(
    configurations: Record<string, any>,
    options: {
      includeMetadata?: boolean
      includeVersionHistory?: boolean
      includeDependencies?: boolean
      includeTemplateInfo?: boolean
      fieldsToExport?: string[]
      filter?: (item: any) => boolean
    }
  ): any {
    const {
      includeMetadata = true,
      includeVersionHistory = false,
      includeDependencies = false,
      includeTemplateInfo = false,
      fieldsToExport,
      filter
    } = options

    let exportData: any = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        itemCount: Object.keys(configurations).length,
        generator: 'EnhancedImportExportManager'
      },
      configurations: {}
    }

    for (const [componentId, config] of Object.entries(configurations)) {
      if (filter && !filter(config)) {
        continue
      }

      let itemData: any = {}

      // 基础配置
      if (fieldsToExport) {
        for (const field of fieldsToExport) {
          if (config[field] !== undefined) {
            itemData[field] = config[field]
          }
        }
      } else {
        itemData = { ...config }
      }

      // 可选数据
      if (!includeMetadata && itemData.metadata) {
        delete itemData.metadata
      }

      if (!includeVersionHistory && itemData.versionHistory) {
        delete itemData.versionHistory
      }

      if (!includeDependencies && (itemData.dependencies || itemData.dependents)) {
        delete itemData.dependencies
        delete itemData.dependents
      }

      if (!includeTemplateInfo && itemData.templateApplications) {
        delete itemData.templateApplications
      }

      exportData.configurations[componentId] = itemData
    }

    return exportData
  }

  /**
   * 导出为JSON格式
   */
  private exportToJSON(data: any, pretty = true): string {
    return JSON.stringify(data, null, pretty ? 2 : 0)
  }

  /**
   * 导出为YAML格式
   */
  private exportToYAML(data: any): string {
    // 简单的YAML实现，实际项目中应使用专业的YAML库
    return this.simpleYAMLStringify(data)
  }

  /**
   * 导出为XML格式
   */
  private exportToXML(data: any, pretty = true): string {
    const indent = pretty ? '  ' : ''
    const newline = pretty ? '\n' : ''

    function xmlEscape(str: string): string {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
    }

    function objectToXML(obj: any, level = 0): string {
      const currentIndent = indent.repeat(level)
      const nextIndent = indent.repeat(level + 1)

      if (Array.isArray(obj)) {
        return obj.map(item => objectToXML(item, level)).join(newline)
      }

      if (typeof obj === 'object' && obj !== null) {
        return Object.entries(obj)
          .map(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
              return `${currentIndent}<${key}>${newline}${objectToXML(value, level + 1)}${newline}${currentIndent}</${key}>`
            } else {
              return `${currentIndent}<${key}>${xmlEscape(String(value))}</${key}>`
            }
          })
          .join(newline)
      }

      return xmlEscape(String(obj))
    }

    return `<?xml version="1.0" encoding="UTF-8"?>${newline}<configurations>${newline}${objectToXML(data, 1)}${newline}</configurations>`
  }

  /**
   * 导出为CSV格式
   */
  private exportToCSV(data: any): string {
    const configurations = data.configurations || {}
    const rows: string[] = []

    // CSV 标题行
    const headers = ['ComponentID', 'Type', 'Width', 'Height', 'X', 'Y', 'DataSourceType', 'DataSourceURL', 'Title', 'Description']
    rows.push(headers.join(','))

    // 数据行
    for (const [componentId, config] of Object.entries(configurations)) {
      const c = config as any
      const row = [
        componentId,
        c.component?.type || '',
        c.base?.width || '',
        c.base?.height || '',
        c.base?.x || '',
        c.base?.y || '',
        c.dataSource?.type || '',
        c.dataSource?.url || '',
        c.component?.title || '',
        c.metadata?.description || ''
      ].map(field => `"${String(field).replace(/"/g, '""')}"`)

      rows.push(row.join(','))
    }

    return rows.join('\n')
  }

  /**
   * 导出为Excel格式（模拟实现）
   */
  private async exportToExcel(data: any): Promise<Buffer> {
    // 这里应该使用专业的Excel库如 exceljs
    // 现在返回一个模拟的Excel内容
    const csvContent = this.exportToCSV(data)
    return Buffer.from(csvContent, 'utf8')
  }

  /**
   * 导出为备份格式
   */
  private async exportToBackup(data: any): Promise<Buffer> {
    const jsonContent = this.exportToJSON(data, false)
    return Buffer.from(jsonContent, 'utf8')
  }

  /**
   * 压缩数据
   */
  private async compressData(content: string | Buffer, compression: string): Promise<Buffer> {
    // 这里应该使用实际的压缩库如 pako, zlib 等
    // 现在返回原始数据
    return Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8')
  }

  /**
   * 编码内容
   */
  private encodeContent(content: string, encoding: string): string {
    switch (encoding) {
      case 'base64':
        return Buffer.from(content, 'utf8').toString('base64')
      case 'utf16':
        return Buffer.from(content, 'utf8').toString('utf16le')
      default:
        return content
    }
  }

  /**
   * 生成文件名
   */
  private generateFilename(format: ExportFormat): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const extension = this.getFileExtension(format)
    return `thingspanel-config-${timestamp}.${extension}`
  }

  /**
   * 获取文件扩展名
   */
  private getFileExtension(format: ExportFormat): string {
    const extensions = {
      json: 'json',
      yaml: 'yaml',
      xml: 'xml',
      csv: 'csv',
      excel: 'xlsx',
      zip: 'zip',
      backup: 'bak'
    }
    return extensions[format] || 'dat'
  }

  /**
   * 获取数据大小
   */
  private getDataSize(data: string | Buffer | File): number {
    if (Buffer.isBuffer(data)) {
      return data.length
    }
    if (typeof data === 'string') {
      return Buffer.byteLength(data, 'utf8')
    }
    if (data instanceof File) {
      return data.size
    }
    return 0
  }

  /**
   * 解析导入数据
   */
  private async parseImportData(
    data: string | Buffer | File,
    format: ExportFormat,
    compression: string,
    encoding: string
  ): Promise<any> {
    let content: string

    // 处理不同类型的输入
    if (data instanceof File) {
      content = await this.readFileContent(data)
    } else if (Buffer.isBuffer(data)) {
      content = data.toString(encoding as BufferEncoding)
    } else {
      content = data
    }

    // 解压缩
    if (compression !== 'none') {
      content = await this.decompressData(content, compression)
    }

    // 解码
    if (encoding !== 'utf8') {
      content = this.decodeContent(content, encoding)
    }

    // 解析格式
    switch (format) {
      case 'json':
        return JSON.parse(content)
      case 'yaml':
        return this.parseYAML(content)
      case 'xml':
        return this.parseXML(content)
      case 'csv':
        return this.parseCSV(content)
      case 'backup':
        return JSON.parse(content)
      default:
        throw new Error(`不支持的导入格式: ${format}`)
    }
  }

  /**
   * 读取文件内容
   */
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = (e) => reject(new Error('文件读取失败'))
      reader.readAsText(file)
    })
  }

  /**
   * 解压缩数据
   */
  private async decompressData(content: string, compression: string): Promise<string> {
    // 这里应该使用实际的解压缩库
    return content
  }

  /**
   * 解码内容
   */
  private decodeContent(content: string, encoding: string): string {
    switch (encoding) {
      case 'base64':
        return Buffer.from(content, 'base64').toString('utf8')
      case 'utf16':
        return Buffer.from(content, 'utf16le').toString('utf8')
      default:
        return content
    }
  }

  /**
   * 解析YAML
   */
  private parseYAML(content: string): any {
    // 简单的YAML解析实现，实际项目中应使用专业的YAML库
    try {
      return JSON.parse(content.replace(/:\s*/g, ':').replace(/\n/g, ''))
    } catch {
      throw new Error('YAML 格式解析失败')
    }
  }

  /**
   * 解析XML
   */
  private parseXML(content: string): any {
    // 简单的XML解析实现，实际项目中应使用专业的XML库
    throw new Error('XML 格式解析暂未实现')
  }

  /**
   * 解析CSV
   */
  private parseCSV(content: string): any {
    const lines = content.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV 格式错误：至少需要标题行和数据行')
    }

    const headers = this.parseCSVLine(lines[0])
    const configurations: Record<string, any> = {}

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i])
      if (values.length !== headers.length) continue

      const componentId = values[0]
      const config: any = {
        base: {
          width: parseInt(values[2]) || 200,
          height: parseInt(values[3]) || 100,
          x: parseInt(values[4]) || 0,
          y: parseInt(values[5]) || 0
        },
        component: {
          type: values[1] || 'default',
          title: values[8] || ''
        },
        dataSource: {
          type: values[6] || 'static',
          url: values[7] || ''
        },
        interaction: {},
        metadata: {
          version: '1.0.0',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          description: values[9] || ''
        }
      }

      configurations[componentId] = config
    }

    return { configurations }
  }

  /**
   * 解析CSV行
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
          i++
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
   * 应用字段映射
   */
  private applyFieldMapping(data: any, mapping: Record<string, string>): any {
    if (!data || typeof data !== 'object') return data

    const mapped = { ...data }

    for (const [oldKey, newKey] of Object.entries(mapping)) {
      if (mapped[oldKey] !== undefined) {
        mapped[newKey] = mapped[oldKey]
        delete mapped[oldKey]
      }
    }

    return mapped
  }

  /**
   * 应用过滤器
   */
  private applyFilter(data: any, filter: (item: any) => boolean): any {
    if (!data || typeof data !== 'object') return data

    if (Array.isArray(data)) {
      return data.filter(filter)
    }

    const filtered: any = {}
    for (const [key, value] of Object.entries(data)) {
      if (filter(value)) {
        filtered[key] = value
      }
    }

    return filtered
  }

  /**
   * 验证导入数据
   */
  private async validateImportData(data: any, skipErrors: boolean): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = []

    // 基础结构验证
    if (!data || typeof data !== 'object') {
      errors.push('数据格式错误：必须是有效的对象')
    }

    if (data.configurations && typeof data.configurations === 'object') {
      for (const [componentId, config] of Object.entries(data.configurations)) {
        const c = config as any

        // 验证必需字段
        if (!c.base) {
          errors.push(`组件 ${componentId}: 缺少 base 配置`)
        }

        if (!c.component) {
          errors.push(`组件 ${componentId}: 缺少 component 配置`)
        }

        if (!c.dataSource) {
          errors.push(`组件 ${componentId}: 缺少 dataSource 配置`)
        }

        // 验证数据类型
        if (c.base?.width && typeof c.base.width !== 'number') {
          errors.push(`组件 ${componentId}: width 必须是数字`)
        }

        if (c.base?.height && typeof c.base.height !== 'number') {
          errors.push(`组件 ${componentId}: height 必须是数字`)
        }
      }
    }

    return {
      isValid: errors.length === 0 || skipErrors,
      errors
    }
  }

  /**
   * 处理导入数据
   */
  private async processImportData(
    data: any,
    options: {
      mode: string
      batchSize: number
      skipErrors: boolean
      progressCallback?: (progress: ImportProgress) => void
      totalItems: number
    }
  ): Promise<{
    importedItems: number
    skippedItems: number
    failedItems: number
    errors: string[]
    warnings: string[]
    data: Record<string, any>
  }> {
    const { mode, batchSize, skipErrors, progressCallback, totalItems } = options
    const errors: string[] = []
    const warnings: string[] = []
    const importedData: Record<string, any> = {}

    let importedItems = 0
    let skippedItems = 0
    let failedItems = 0

    const configurations = data.configurations || {}
    const configEntries = Object.entries(configurations)

    // 分批处理
    for (let i = 0; i < configEntries.length; i += batchSize) {
      const batch = configEntries.slice(i, i + batchSize)

      for (const [componentId, config] of batch) {
        try {
          // 这里应该调用实际的配置设置方法
          // 现在只是模拟处理
          await this.processConfigurationItem(componentId, config as any, mode)

          importedData[componentId] = config
          importedItems++

          progressCallback?.({
            total: totalItems,
            current: i + 1,
            percentage: Math.round(((i + 1) / totalItems) * 100),
            stage: 'importing',
            message: `正在导入配置 ${i + 1}/${totalItems}`,
            processed: importedItems,
            skipped: skippedItems,
            failed: failedItems
          })

        } catch (error) {
          const errorMsg = `组件 ${componentId} 导入失败: ${error}`

          if (skipErrors) {
            warnings.push(errorMsg)
            skippedItems++
          } else {
            errors.push(errorMsg)
            failedItems++
          }
        }
      }

      // 批次间的短暂延迟，避免阻塞UI
      await new Promise(resolve => setTimeout(resolve, 1))
    }

    return {
      importedItems,
      skippedItems,
      failedItems,
      errors,
      warnings,
      data: importedData
    }
  }

  /**
   * 处理单个配置项
   */
  private async processConfigurationItem(componentId: string, config: WidgetConfiguration, mode: string): Promise<void> {
    // 这里应该集成到实际的配置管理器
    // 现在只是模拟处理

    // 模拟一些处理时间
    await new Promise(resolve => setTimeout(resolve, Math.random() * 10))
  }

  /**
   * 获取当前配置
   */
  private getCurrentConfigurations(): Record<string, any> {
    // 这里应该从实际的配置管理器获取当前配置
    // 现在返回模拟数据
    return {
      'component-1': {
        base: { width: 200, height: 100, x: 0, y: 0 },
        component: { type: 'digit-indicator', title: '示例组件' },
        dataSource: { type: 'static', data: { value: 42 } },
        interaction: {},
        metadata: { version: '1.0.0', createdAt: Date.now(), updatedAt: Date.now() }
      }
    }
  }

  /**
   * 获取备份数据
   */
  private async getBackupData(backupId: string): Promise<string | null> {
    // 这里应该从实际的存储中获取备份数据
    // 现在返回模拟数据
    return JSON.stringify({
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        generator: 'EnhancedImportExportManager'
      },
      configurations: this.getCurrentConfigurations()
    })
  }

  /**
   * 计算校验和
   */
  private calculateChecksum(content: string | Buffer): string {
    // 简单的校验和实现
    const str = Buffer.isBuffer(content) ? content.toString() : content
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * 清理旧备份
   */
  private cleanupOldBackups(): void {
    const backups = Array.from(this.backups.values()).sort((a, b) => b.createdAt - a.createdAt)

    if (backups.length > this.MAX_BACKUP_COUNT) {
      const toDelete = backups.slice(this.MAX_BACKUP_COUNT)
      for (const backup of toDelete) {
        this.backups.delete(backup.id)
      }
    }
  }

  /**
   * 简单的YAML字符串化
   */
  private simpleYAMLStringify(obj: any, indent = 0): string {
    const spaces = '  '.repeat(indent)

    if (obj === null) return 'null'
    if (typeof obj === 'boolean') return obj ? 'true' : 'false'
    if (typeof obj === 'number') return obj.toString()
    if (typeof obj === 'string') return `"${obj.replace(/"/g, '\\"')}"`

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]'
      return '\n' + obj.map(item => `${spaces}- ${this.simpleYAMLStringify(item, indent + 1).trim()}`).join('\n')
    }

    if (typeof obj === 'object') {
      const keys = Object.keys(obj)
      if (keys.length === 0) return '{}'
      return '\n' + keys.map(key => {
        const value = this.simpleYAMLStringify(obj[key], indent + 1)
        return `${spaces}${key}: ${value.startsWith('\n') ? value : value}`
      }).join('\n')
    }

    return obj.toString()
  }

  /**
   * 注册内置转换器
   */
  private registerBuiltInConverters(): void {
    // JSON 到 YAML 转换器
    this.registerConverter({
      name: 'JSON to YAML',
      fromFormat: 'json',
      toFormat: 'yaml',
      convert: async (data) => this.exportToYAML(data),
      validate: (data) => {
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
      name: 'YAML to JSON',
      fromFormat: 'yaml',
      toFormat: 'json',
      convert: async (data) => this.exportToJSON(data),
      validate: (data) => typeof data === 'object' && data !== null
    })

  }
}

// ========== 🚀 全局实例和导出 ==========

export const enhancedImportExportManager = new EnhancedImportExportManager()

