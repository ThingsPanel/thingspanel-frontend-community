// Grid数据适配器 - 外部数据格式转换
// Grid data adapter - External data format conversion

import type { BaseItem } from '../base/types'
import type { GridItem, GridPosition } from '../grid/types'

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

/** Grid数据适配器 */
export class GridAdapter {
  /**
   * 解析外部面板配置数据
   * @param externalData 外部数据
   * @returns 解析后的网格项目数组
   */
  static parsePanelData(externalData: ExternalPanelData): ExternalGridItem[] {
    try {
      if (!externalData?.config) {
        console.warn('GridAdapter: 外部数据配置为空')
        return []
      }

      const config = JSON.parse(externalData.config)
      
      // 如果config直接是数组，返回数组
      if (Array.isArray(config)) {
        return config
      }
      
      // 如果config有layout属性，返回layout
      if (config.layout && Array.isArray(config.layout)) {
        return config.layout
      }
      
      console.warn('GridAdapter: 配置格式不正确，期望数组或包含layout的对象')
      return []
    } catch (error) {
      console.error('GridAdapter: 解析面板配置失败', error)
      return []
    }
  }

  /**
   * 转换外部网格项目为Grid项目
   * @param externalItem 外部网格项目
   * @param panelInfo 面板信息
   * @returns Grid项目
   */
  static convertToGridItem(
    externalItem: ExternalGridItem,
    panelInfo?: Pick<ExternalPanelData, 'id' | 'name'>
  ): GridItem {
    const baseItem: BaseItem = {
      id: String(externalItem.i),
      type: externalItem.data?.type || 'custom',
      title: externalItem.data?.title || `项目 ${externalItem.i}`,
      position: {
        x: externalItem.x,
        y: externalItem.y
      },
      size: {
        width: externalItem.w,
        height: externalItem.h
      },
      zIndex: 1,
      visible: true,
      locked: externalItem.static || false,
      data: externalItem.data || {},
      metadata: {
        panelId: panelInfo?.id,
        panelName: panelInfo?.name,
        cardId: externalItem.data?.cardId,
        originalData: externalItem
      }
    }

    const gridItem: GridItem = {
      ...baseItem,
      gridPosition: {
        col: externalItem.x,
        row: externalItem.y,
        colSpan: externalItem.w,
        rowSpan: externalItem.h
      },
      constraints: {
        minWidth: externalItem.minW || externalItem.data?.layout?.minW || 1,
        minHeight: externalItem.minH || externalItem.data?.layout?.minH || 1,
        maxWidth: externalItem.maxW || externalItem.data?.layout?.maxW,
        maxHeight: externalItem.maxH || externalItem.data?.layout?.maxH
      },
      resizable: !externalItem.static,
      draggable: !externalItem.static,
      content: {
        type: externalItem.data?.type || 'custom',
        config: externalItem.data?.config || {},
        dataSource: externalItem.data?.dataSource
      }
    }

    return gridItem
  }

  /**
   * 转换外部面板数据为Grid项目数组
   * @param externalData 外部面板数据
   * @returns Grid项目数组
   */
  static convertPanelToGridItems(externalData: ExternalPanelData): GridItem[] {
    try {
      const externalItems = this.parsePanelData(externalData)
      const panelInfo = {
        id: externalData.id,
        name: externalData.name
      }

      return externalItems.map(item => this.convertToGridItem(item, panelInfo))
    } catch (error) {
      console.error('GridAdapter: 转换面板数据失败', error)
      return []
    }
  }

  /**
   * 转换面板数据为vue-grid-layout格式
   * @param externalData 外部面板数据
   * @returns vue-grid-layout项目数组
   */
  static convertPanelToVueGridLayout(externalData: ExternalPanelData): Array<{
    i: string
    x: number
    y: number
    w: number
    h: number
    minW?: number
    minH?: number
    maxW?: number
    maxH?: number
    static?: boolean
    data?: any
  }> {
    try {
      const externalItems = this.parsePanelData(externalData)
      
      return externalItems.map(item => ({
        i: String(item.i),
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: item.minW || item.data?.layout?.minW || 1,
        minH: item.minH || item.data?.layout?.minH || 1,
        maxW: item.maxW || item.data?.layout?.maxW,
        maxH: item.maxH || item.data?.layout?.maxH,
        static: item.static || false,
        data: {
          cardId: item.data?.cardId,
          type: item.data?.type || 'builtin',
          title: item.data?.title || `Card ${item.i}`,
          config: item.data?.config || {},
          dataSource: item.data?.dataSource || {},
          originalData: item
        }
      }))
    } catch (error) {
      console.error('GridAdapter: 转换为vue-grid-layout格式失败', error)
      return []
    }
  }

  /**
   * 转换Grid项目为外部网格项目
   * @param gridItem Grid项目
   * @returns 外部网格项目
   */
  static convertFromGridItem(gridItem: GridItem): ExternalGridItem {
    const externalItem: ExternalGridItem = {
      i: gridItem.id,
      x: gridItem.gridPosition.x,
      y: gridItem.gridPosition.y,
      w: gridItem.gridPosition.width,
      h: gridItem.gridPosition.height,
      minW: gridItem.constraints?.minWidth,
      minH: gridItem.constraints?.minHeight,
      maxW: gridItem.constraints?.maxWidth,
      maxH: gridItem.constraints?.maxHeight,
      static: gridItem.locked,
      moved: false,
      data: {
        cardId: gridItem.metadata?.cardId || gridItem.id,
        type: gridItem.content?.type || gridItem.type,
        title: gridItem.title,
        config: gridItem.content?.config || {},
        layout: {
          w: gridItem.gridPosition.width,
          h: gridItem.gridPosition.height,
          minW: gridItem.constraints?.minWidth,
          minH: gridItem.constraints?.minHeight,
          maxW: gridItem.constraints?.maxWidth,
          maxH: gridItem.constraints?.maxHeight
        },
        basicSettings: gridItem.data?.basicSettings || {},
        dataSource: gridItem.content?.dataSource || {
          origin: 'system',
          systemSource: [],
          deviceSource: []
        }
      }
    }

    return externalItem
  }

  /**
   * 转换Grid项目数组为外部面板数据
   * @param items Grid项目数组
   * @param panelInfo 面板信息
   * @returns 外部面板数据
   */
  static convertToExternalPanelData(
    items: GridItem[],
    panelInfo: Partial<ExternalPanelData>
  ): Partial<ExternalPanelData> {
    const externalItems = items.map(item => this.convertFromGridItem(item))

    const config = {
      layout: externalItems
    }

    return {
      ...panelInfo,
      config: JSON.stringify(config)
    }
  }

  /**
   * 验证外部数据格式
   * @param data 待验证数据
   * @returns 验证结果
   */
  static validateExternalData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data) {
      errors.push('数据不能为空')
      return { isValid: false, errors }
    }

    if (!data.id) {
      errors.push('缺少面板ID')
    }

    if (!data.config) {
      errors.push('缺少面板配置')
    } else {
      try {
        const config = JSON.parse(data.config)
        if (!Array.isArray(config.layout)) {
          errors.push('配置中的layout必须是数组')
        }
      } catch (error) {
        errors.push('配置格式不正确，必须是有效的JSON')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 获取数据统计信息
   * @param externalData 外部数据
   * @returns 统计信息
   */
  static getDataStatistics(externalData: ExternalPanelData) {
    const items = this.parsePanelData(externalData)

    const statistics = {
      totalItems: items.length,
      staticItems: items.filter(item => item.static).length,
      dynamicItems: items.filter(item => !item.static).length,
      cardTypes: {} as Record<string, number>,
      dataSourceTypes: {} as Record<string, number>,
      gridBounds: {
        maxX: 0,
        maxY: 0,
        maxW: 0,
        maxH: 0
      }
    }

    items.forEach(item => {
      // 统计卡片类型
      const cardType = item.data?.type || 'unknown'
      statistics.cardTypes[cardType] = (statistics.cardTypes[cardType] || 0) + 1

      // 统计数据源类型
      const dataSourceType = item.data?.dataSource?.origin || 'unknown'
      statistics.dataSourceTypes[dataSourceType] = (statistics.dataSourceTypes[dataSourceType] || 0) + 1

      // 计算网格边界
      statistics.gridBounds.maxX = Math.max(statistics.gridBounds.maxX, item.x + item.w)
      statistics.gridBounds.maxY = Math.max(statistics.gridBounds.maxY, item.y + item.h)
      statistics.gridBounds.maxW = Math.max(statistics.gridBounds.maxW, item.w)
      statistics.gridBounds.maxH = Math.max(statistics.gridBounds.maxH, item.h)
    })

    return statistics
  }

  /**
   * 创建默认的外部网格项目
   * @param id 项目ID
   * @param position 位置信息
   * @returns 默认外部网格项目
   */
  static createDefaultExternalItem(
    id: string | number,
    position: { x: number; y: number; w: number; h: number }
  ): ExternalGridItem {
    return {
      i: id,
      x: position.x,
      y: position.y,
      w: position.w,
      h: position.h,
      minW: 1,
      minH: 1,
      static: false,
      moved: false,
      data: {
        cardId: String(id),
        type: 'custom',
        title: `项目 ${id}`,
        config: {},
        layout: {
          w: position.w,
          h: position.h,
          minW: 1,
          minH: 1
        },
        basicSettings: {},
        dataSource: {
          origin: 'system',
          systemSource: [],
          deviceSource: []
        }
      }
    }
  }
}

// 导出类型
export type { ExternalPanelData, ExternalGridItem }
