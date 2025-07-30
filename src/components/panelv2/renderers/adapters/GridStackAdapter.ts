// GridStack数据适配器 - 外部数据格式转换
// GridStack data adapter - External data format conversion

import type { BaseItem } from '../base/types'
import type { GridStackItem, GridPosition } from '../gridstack/types'

/** 外部看板配置数据结构 */
export interface ExternalPanelData {
  id: string
  name: string
  config: string // JSON字符串
  tenant_id: string
  created_at: string
  updated_at: string
  home_flag: string
  description?: string
  remark?: string
  menu_flag?: string
}

/** 外部网格项目数据结构 */
export interface ExternalGridItem {
  /** 网格位置信息 */
  x: number
  y: number
  w: number
  h: number
  /** 最小尺寸 */
  minW?: number
  minH?: number
  /** 最大尺寸 */
  maxW?: number
  maxH?: number
  /** 项目唯一标识 */
  i: number | string
  /** 是否被移动过 */
  moved?: boolean
  /** 是否为静态项目 */
  static?: boolean
  /** 卡片数据 */
  data: {
    /** 卡片ID */
    cardId: string
    /** 卡片类型 */
    type: 'builtin' | 'custom'
    /** 卡片标题 */
    title: string
    /** 卡片配置 */
    config: Record<string, any>
    /** 布局配置 */
    layout: {
      w: number
      h: number
      minW?: number
      minH?: number
      maxW?: number
      maxH?: number
    }
    /** 基础设置 */
    basicSettings: Record<string, any>
    /** 数据源配置 */
    dataSource: {
      origin: 'system' | 'device'
      isSupportTimeRange?: boolean
      dataTimeRange?: string
      isSupportAggregate?: boolean
      dataAggregateRange?: string
      systemSource: any[]
      deviceSource: any[]
      deviceCount?: number
    }
  }
}

/** GridStack数据适配器 */
export class GridStackAdapter {
  /**
   * 解析外部面板配置数据
   * @param externalData 外部数据
   * @returns 解析后的网格项目数组
   */
  static parsePanelData(externalData: ExternalPanelData): ExternalGridItem[] {
    try {
      // 检查externalData是否存在
      if (!externalData) {
        console.warn('External data is null or undefined')
        return []
      }

      // 检查config字段是否存在且不为空
      if (!externalData.config || externalData.config === 'undefined' || externalData.config === 'null') {
        console.warn('Panel config is empty, null, or undefined:', externalData.config)
        return []
      }

      const configData = JSON.parse(externalData.config)

      if (!Array.isArray(configData)) {
        console.warn('Panel config is not an array:', configData)
        return []
      }

      return configData as ExternalGridItem[]
    } catch (error) {
      console.error('Failed to parse panel config:', error)
      console.error('Config value was:', externalData?.config)
      return []
    }
  }

  /**
   * 转换外部网格项目为内部GridStackItem格式
   * @param externalItem 外部网格项目
   * @param panelInfo 面板基础信息
   * @returns 内部GridStackItem
   */
  static convertToGridStackItem(
    externalItem: ExternalGridItem,
    panelInfo?: Pick<ExternalPanelData, 'id' | 'name'>
  ): GridStackItem {
    // 生成内部唯一ID
    const internalId = `${panelInfo?.id || 'panel'}_${externalItem.i}`

    // 转换网格位置
    const gridPosition: GridPosition = {
      x: externalItem.x,
      y: externalItem.y,
      w: externalItem.w,
      h: externalItem.h
    }

    // 计算像素位置和尺寸（基于标准网格配置）
    const cellWidth = 100 // 假设每个网格单元100px宽
    const cellHeight = 60 // 假设每个网格单元60px高
    const margin = 10 // 网格间距

    const pixelPosition = {
      x: externalItem.x * (cellWidth + margin),
      y: externalItem.y * (cellHeight + margin)
    }

    const pixelSize = {
      width: externalItem.w * cellWidth + (externalItem.w - 1) * margin,
      height: externalItem.h * cellHeight + (externalItem.h - 1) * margin
    }

    // 构造内部配置数据
    const internalConfig = {
      // 保留原始卡片配置
      ...externalItem.data.config,
      // 添加元数据
      cardId: externalItem.data.cardId,
      cardType: externalItem.data.type,
      dataSource: externalItem.data.dataSource,
      basicSettings: externalItem.data.basicSettings,
      // 添加原始数据引用（用于调试和回溯）
      _originalData: externalItem
    }

    const gridStackItem: GridStackItem = {
      id: internalId,
      type: externalItem.data.cardId,
      position: pixelPosition,
      size: pixelSize,
      config: internalConfig,
      title: externalItem.data.title,

      // GridStack特有属性
      gridPosition,
      minGridSize: {
        w: externalItem.minW || externalItem.data.layout.minW || 2,
        h: externalItem.minH || externalItem.data.layout.minH || 2
      },
      maxGridSize:
        externalItem.maxW || externalItem.maxH
          ? {
              w: externalItem.maxW || 12,
              h: externalItem.maxH || 12
            }
          : undefined,

      // 行为控制
      resizable: !externalItem.static,
      draggable: !externalItem.static,
      static: externalItem.static || false,
      locked: externalItem.static || false
    }

    return gridStackItem
  }

  /**
   * 批量转换外部数据为内部GridStackItem数组
   * @param externalData 外部面板数据
   * @returns 内部GridStackItem数组
   */
  static convertPanelToGridStackItems(externalData: ExternalPanelData): GridStackItem[] {
    const externalItems = this.parsePanelData(externalData)

    return externalItems.map(item => {
      // 直接使用数据中的坐标，不进行复杂转换
      const gridStackItem: GridStackItem = {
        id: String(item.i), // 使用原始ID
        type: item.data.cardId,
        title: item.data.title,
        config: item.data.config,

        // 直接使用数据中的网格位置
        gridPosition: {
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h
        },

        // 设置最小最大尺寸
        minGridSize: {
          w: item.minW || item.data.layout.minW || 1,
          h: item.minH || item.data.layout.minH || 1
        },
        maxGridSize:
          item.maxW || item.maxH
            ? {
                w: item.maxW || 12,
                h: item.maxH || 12
              }
            : undefined,

        // 计算像素位置（仅用于兼容性）
        position: {
          x: item.x * 70, // cellHeight(60) + margin(10)
          y: item.y * 70
        },
        size: {
          width: item.w * 70,
          height: item.h * 70
        },

        // 交互设置
        resizable: !item.static,
        draggable: !item.static,
        static: item.static || false,
        locked: item.static || false
      }

      return gridStackItem
    })
  }

  /**
   * 反向转换：将内部GridStackItem转换为外部格式
   * @param gridStackItem 内部GridStackItem
   * @returns 外部网格项目格式
   */
  static convertFromGridStackItem(gridStackItem: GridStackItem): ExternalGridItem {
    // 从config中提取原始数据
    const originalData = gridStackItem.config._originalData as ExternalGridItem

    // 构造外部格式
    const externalItem: ExternalGridItem = {
      x: gridStackItem.gridPosition.x,
      y: gridStackItem.gridPosition.y,
      w: gridStackItem.gridPosition.w,
      h: gridStackItem.gridPosition.h,
      minW: gridStackItem.minGridSize?.w,
      minH: gridStackItem.minGridSize?.h,
      maxW: gridStackItem.maxGridSize?.w,
      maxH: gridStackItem.maxGridSize?.h,
      i: originalData?.i || gridStackItem.id,
      moved: true, // 如果被转换说明可能被修改过
      static: gridStackItem.static,

      data: {
        cardId: gridStackItem.config.cardId || gridStackItem.type,
        type: gridStackItem.config.cardType || 'builtin',
        title: gridStackItem.title || gridStackItem.type,
        config: {
          // 过滤掉内部元数据
          ...Object.fromEntries(
            Object.entries(gridStackItem.config).filter(
              ([key]) => !key.startsWith('_') && !['cardId', 'cardType', 'dataSource', 'basicSettings'].includes(key)
            )
          )
        },
        layout: {
          w: gridStackItem.gridPosition.w,
          h: gridStackItem.gridPosition.h,
          minW: gridStackItem.minGridSize?.w,
          minH: gridStackItem.minGridSize?.h,
          maxW: gridStackItem.maxGridSize?.w,
          maxH: gridStackItem.maxGridSize?.h
        },
        basicSettings: gridStackItem.config.basicSettings || {},
        dataSource: gridStackItem.config.dataSource || {
          origin: 'system',
          systemSource: [{}],
          deviceSource: [{}]
        }
      }
    }

    return externalItem
  }

  /**
   * 将GridStackItem数组转换为外部面板配置格式
   * @param items GridStackItem数组
   * @param panelInfo 面板基础信息
   * @returns 外部面板数据
   */
  static convertToExternalPanelData(
    items: GridStackItem[],
    panelInfo: Partial<ExternalPanelData>
  ): Partial<ExternalPanelData> {
    const externalItems = items.map(item => this.convertFromGridStackItem(item))

    return {
      ...panelInfo,
      config: JSON.stringify(externalItems)
    }
  }

  /**
   * 验证外部数据格式是否正确
   * @param data 待验证的数据
   * @returns 验证结果
   */
  static validateExternalData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data || typeof data !== 'object') {
      errors.push('Data must be an object')
      return { isValid: false, errors }
    }

    // 验证必需字段
    const requiredFields = ['id', 'name', 'config']
    for (const field of requiredFields) {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`)
      }
    }

    // 验证config字段
    if (data.config) {
      try {
        const configData = JSON.parse(data.config)
        if (!Array.isArray(configData)) {
          errors.push('Config must be a JSON array')
        }
      } catch (error) {
        errors.push('Config must be valid JSON')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 数据统计信息
   * @param externalData 外部面板数据
   * @returns 统计信息
   */
  static getDataStatistics(externalData: ExternalPanelData) {
    const items = this.parsePanelData(externalData)

    // 初始化统计信息
    const statistics = {
      totalItems: items.length,
      cardTypes: {} as Record<string, number>,
      dataSourceTypes: {} as Record<string, number>,
      gridBounds: {
        minX: 0,
        maxX: 0,
        minY: 0,
        maxY: 0
      },
      staticItems: items.filter(item => item.static).length,
      movedItems: items.filter(item => item.moved).length
    }

    // 只有当有项目时才计算网格边界
    if (items.length > 0) {
      statistics.gridBounds = {
        minX: Math.min(...items.map(item => item.x)),
        maxX: Math.max(...items.map(item => item.x + item.w - 1)),
        minY: Math.min(...items.map(item => item.y)),
        maxY: Math.max(...items.map(item => item.y + item.h - 1))
      }
    }

    // 统计卡片类型
    items.forEach(item => {
      const cardId = item.data.cardId
      statistics.cardTypes[cardId] = (statistics.cardTypes[cardId] || 0) + 1

      const dataOrigin = item.data.dataSource.origin
      statistics.dataSourceTypes[dataOrigin] = (statistics.dataSourceTypes[dataOrigin] || 0) + 1
    })

    return statistics
  }
}
