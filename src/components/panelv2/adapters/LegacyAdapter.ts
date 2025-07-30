/**
 * Legacy Panel Data Adapter
 * 现有面板数据格式适配器，用于兼容旧版本数据
 */

import type { 
  DataAdapter, 
  AdapterInfo, 
  LegacyCardView, 
  ConversionResult,
  MigrationConfig
} from '../types/adapters'
import type { 
  BaseCanvasItem, 
  ValidationResult, 
  ValidationError,
  ValidationWarning,
  CardData
} from '../types/core'

export class LegacyPanelAdapter implements DataAdapter<LegacyCardView[], BaseCanvasItem[]> {
  private readonly GRID_UNIT_SIZE = 100  // 网格单位转像素比例
  private readonly DEFAULT_Z_INDEX = 0
  private readonly VERSION = '2.0.0'

  getInfo(): AdapterInfo {
    return {
      id: 'legacy-panel-adapter',
      name: 'Legacy Panel Data Adapter',
      version: '1.0.0',
      supportedVersions: ['1.0.0', '1.1.0', '1.2.0'],
      description: '兼容现有面板系统数据格式的适配器'
    }
  }

  /**
   * 从现有数据格式转换为新的BaseCanvasItem格式
   */
  fromExternal(legacyData: LegacyCardView[]): BaseCanvasItem[] {
    if (!Array.isArray(legacyData)) {
      throw new Error('Legacy data must be an array of LegacyCardView items')
    }

    return legacyData.map((item, index) => this.convertLegacyItem(item, index))
  }

  /**
   * 从新格式转换为现有数据格式
   */
  toExternal(items: BaseCanvasItem[]): LegacyCardView[] {
    if (!Array.isArray(items)) {
      throw new Error('Items must be an array of BaseCanvasItem')
    }

    return items.map((item, index) => this.convertToLegacyItem(item, index))
  }

  /**
   * 验证现有数据格式
   */
  validate(data: LegacyCardView[]): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    if (!Array.isArray(data)) {
      errors.push({
        path: 'root',
        message: 'Data must be an array',
        code: 'INVALID_TYPE'
      })
      return { valid: false, errors, warnings }
    }

    data.forEach((item, index) => {
      const itemPath = `items[${index}]`
      
      // 验证必要字段
      if (typeof item.x !== 'number') {
        errors.push({
          path: `${itemPath}.x`,
          message: 'x coordinate must be a number',
          code: 'MISSING_REQUIRED_FIELD'
        })
      }

      if (typeof item.y !== 'number') {
        errors.push({
          path: `${itemPath}.y`,
          message: 'y coordinate must be a number',
          code: 'MISSING_REQUIRED_FIELD'
        })
      }

      if (typeof item.w !== 'number' || item.w <= 0) {
        errors.push({
          path: `${itemPath}.w`,
          message: 'width must be a positive number',
          code: 'INVALID_VALUE'
        })
      }

      if (typeof item.h !== 'number' || item.h <= 0) {
        errors.push({
          path: `${itemPath}.h`,
          message: 'height must be a positive number',
          code: 'INVALID_VALUE'
        })
      }

      // 验证可选字段
      if (item.minW !== undefined && (typeof item.minW !== 'number' || item.minW < 0)) {
        warnings.push({
          path: `${itemPath}.minW`,
          message: 'minWidth should be a non-negative number',
          code: 'INVALID_OPTIONAL_VALUE'
        })
      }

      if (item.minH !== undefined && (typeof item.minH !== 'number' || item.minH < 0)) {
        warnings.push({
          path: `${itemPath}.minH`,
          message: 'minHeight should be a non-negative number',
          code: 'INVALID_OPTIONAL_VALUE'
        })
      }

      // 验证卡片数据
      if (item.data) {
        if (!item.data.cardId) {
          warnings.push({
            path: `${itemPath}.data.cardId`,
            message: 'cardId is recommended for proper card rendering',
            code: 'MISSING_RECOMMENDED_FIELD'
          })
        }
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 数据版本迁移
   */
  migrate(data: any, fromVersion: string, toVersion: string): LegacyCardView[] {
    if (fromVersion === toVersion) {
      return data
    }

    // 实现版本迁移逻辑
    switch (`${fromVersion}->${toVersion}`) {
      case '1.0.0->1.1.0':
        return this.migrateFrom1_0_0To1_1_0(data)
      case '1.1.0->1.2.0':
        return this.migrateFrom1_1_0To1_2_0(data)
      default:
        throw new Error(`Unsupported migration path: ${fromVersion} -> ${toVersion}`)
    }
  }

  /**
   * 批量转换并提供详细结果
   */
  convertBatch(legacyData: LegacyCardView[]): ConversionResult<BaseCanvasItem[]> {
    const result: ConversionResult<BaseCanvasItem[]> = {
      success: false,
      data: [],
      errors: [],
      warnings: [],
      statistics: {
        total: legacyData.length,
        converted: 0,
        failed: 0,
        skipped: 0
      }
    }

    try {
      const validationResult = this.validate(legacyData)
      
      if (!validationResult.valid) {
        result.errors.push(...validationResult.errors.map(e => e.message))
        return result
      }

      if (validationResult.warnings.length > 0) {
        result.warnings.push(...validationResult.warnings.map(w => w.message))
      }

      const converted = this.fromExternal(legacyData)
      result.data = converted
      result.statistics.converted = converted.length
      result.success = true

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown conversion error')
      result.statistics.failed = legacyData.length
    }

    return result
  }

  /**
   * 转换单个旧版本项目
   */
  private convertLegacyItem(legacyItem: LegacyCardView, index: number): BaseCanvasItem {
    const now = Date.now()
    const id = legacyItem.i?.toString() || `item_${index}_${now}`

    // 转换位置和尺寸（网格单位转像素）
    const position = {
      x: legacyItem.x * this.GRID_UNIT_SIZE,
      y: legacyItem.y * this.GRID_UNIT_SIZE
    }

    const size = {
      width: legacyItem.w * this.GRID_UNIT_SIZE,
      height: legacyItem.h * this.GRID_UNIT_SIZE
    }

    // 转换约束条件
    const constraints = {
      minWidth: legacyItem.minW ? legacyItem.minW * this.GRID_UNIT_SIZE : undefined,
      minHeight: legacyItem.minH ? legacyItem.minH * this.GRID_UNIT_SIZE : undefined,
    }

    // 转换卡片数据
    const cardData: CardData = {
      cardId: legacyItem.data?.cardId || '',
      title: legacyItem.data?.title,
      config: legacyItem.data?.config || {},
      dataSource: legacyItem.data?.dataSource,
      basicSettings: legacyItem.data?.basicSettings,
      type: legacyItem.data?.type || 'builtin'
    }

    return {
      id,
      type: 'component',
      position,
      size,
      constraints,
      zIndex: this.DEFAULT_Z_INDEX,
      visible: true,
      locked: false,
      cardData,
      rendererData: {
        legacy: {
          originalI: legacyItem.i,
          gridPosition: { x: legacyItem.x, y: legacyItem.y },
          gridSize: { w: legacyItem.w, h: legacyItem.h }
        }
      },
      metadata: {
        createdAt: now,
        updatedAt: now,
        version: this.VERSION
      }
    }
  }

  /**
   * 转换为旧版本格式
   */
  private convertToLegacyItem(item: BaseCanvasItem, index: number): LegacyCardView {
    // 像素转网格单位
    const x = Math.round(item.position.x / this.GRID_UNIT_SIZE)
    const y = Math.round(item.position.y / this.GRID_UNIT_SIZE)
    const w = Math.round(item.size.width / this.GRID_UNIT_SIZE)
    const h = Math.round(item.size.height / this.GRID_UNIT_SIZE)

    const legacyItem: LegacyCardView = {
      x,
      y,
      w,
      h,
      i: parseInt(item.id) || index,
      data: {
        cardId: item.cardData.cardId,
        title: item.cardData.title,
        config: item.cardData.config,
        dataSource: item.cardData.dataSource,
        basicSettings: item.cardData.basicSettings,
        type: item.cardData.type
      }
    }

    // 添加约束条件
    if (item.constraints.minWidth) {
      legacyItem.minW = Math.round(item.constraints.minWidth / this.GRID_UNIT_SIZE)
    }
    if (item.constraints.minHeight) {
      legacyItem.minH = Math.round(item.constraints.minHeight / this.GRID_UNIT_SIZE)
    }

    return legacyItem
  }

  /**
   * 版本迁移：1.0.0 -> 1.1.0
   */
  private migrateFrom1_0_0To1_1_0(data: any[]): LegacyCardView[] {
    return data.map(item => ({
      ...item,
      // 1.1.0新增的字段和修改
      minW: item.minW || 1,
      minH: item.minH || 1
    }))
  }

  /**
   * 版本迁移：1.1.0 -> 1.2.0  
   */
  private migrateFrom1_1_0To1_2_0(data: any[]): LegacyCardView[] {
    return data.map(item => ({
      ...item,
      // 1.2.0的新增和修改
      data: {
        ...item.data,
        type: item.data?.type || 'builtin'
      }
    }))
  }
}