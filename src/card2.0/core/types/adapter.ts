/**
 * Card 2.0 类型适配器
 * 提供新旧类型系统之间的转换和兼容性
 */

import type { ICardData } from '@/components/panel/card'
import type { IDataNode, IComponentMeta, RendererType } from './index'
import type { IComponentDefinition } from './component'

/**
 * 现有卡片数据到 Card 2.0 数据节点的转换器
 */
export class CardDataAdapter {
  /**
   * 将现有的 ICardData 转换为 Card 2.0 的 IDataNode
   */
  static toDataNode(cardData: ICardData, layout?: { x: number; y: number; w: number; h: number }): IDataNode {
    const id = cardData.cardId || this.generateId()
    const type = cardData.type || 'unknown'

    return {
      id,
      type,
      renderer: ['dom'] as RendererType[], // 默认使用 DOM 渲染器
      layout: {
        x: layout?.x || 0,
        y: layout?.y || 0,
        width: layout?.w || 4,
        height: layout?.h || 3,
        minWidth: cardData.layout?.minW || 2,
        minHeight: cardData.layout?.minH || 2
      },
      dataBinding: {
        sourceId: this.extractSourceId(cardData),
        transform: this.extractTransforms(cardData)
      },
      properties: {
        ...cardData.config,
        title: cardData.title || cardData.basicSettings?.title,
        showTitle: cardData.basicSettings?.showTitle !== false
      },
      basicSettings: cardData.basicSettings
    }
  }

  /**
   * 将 Card 2.0 的 IDataNode 转换为现有的 ICardData
   */
  static fromDataNode(dataNode: IDataNode): ICardData {
    return {
      cardId: dataNode.id,
      type: dataNode.type as any,
      config: {
        ...dataNode.properties,
        // 移除基础设置，避免重复
        title: undefined,
        showTitle: undefined
      },
      title: dataNode.properties.title,
      basicSettings: {
        showTitle: dataNode.properties.showTitle,
        title: dataNode.properties.title,
        ...dataNode.basicSettings
      },
      layout: {
        w: dataNode.layout.width,
        h: dataNode.layout.height,
        minW: dataNode.layout.minWidth,
        minH: dataNode.layout.minHeight
      },
      dataSource: this.extractDataSource(dataNode)
    }
  }

  /**
   * 提取数据源ID
   */
  private static extractSourceId(cardData: ICardData): string {
    if (cardData.dataSource) {
      if (cardData.dataSource.origin === 'device' && cardData.dataSource.deviceSource) {
        return `device:${cardData.dataSource.deviceSource.map(d => d.deviceId).join(',')}`
      }
      if (cardData.dataSource.origin === 'system') {
        return 'system:default'
      }
    }
    return 'default'
  }

  /**
   * 提取数据转换配置
   */
  private static extractTransforms(cardData: ICardData) {
    const transforms = []

    // 如果有时间范围配置，添加过滤器
    if (cardData.dataSource?.timeRange) {
      transforms.push({
        type: 'filter' as const,
        params: {
          timeRange: cardData.dataSource.timeRange
        }
      })
    }

    // 如果有聚合配置，添加聚合器
    if (cardData.dataSource?.aggregate) {
      transforms.push({
        type: 'aggregate' as const,
        params: {
          method: cardData.dataSource.aggregate,
          interval: cardData.dataSource.aggregateInterval
        }
      })
    }

    return transforms.length > 0 ? transforms : undefined
  }

  /**
   * 从数据节点提取数据源配置
   */
  private static extractDataSource(dataNode: IDataNode) {
    const sourceId = dataNode.dataBinding.sourceId

    if (sourceId.startsWith('device:')) {
      const deviceIds = sourceId.replace('device:', '').split(',')
      return {
        origin: 'device' as const,
        deviceSource: deviceIds.map(deviceId => ({ deviceId }))
      }
    }

    if (sourceId.startsWith('system:')) {
      return {
        origin: 'system' as const
      }
    }

    return undefined
  }

  /**
   * 生成唯一ID
   */
  private static generateId(): string {
    return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 组件定义适配器
 */
export class ComponentDefinitionAdapter {
  /**
   * 从现有卡片配置创建 Card 2.0 组件定义
   */
  static createDefinition(cardConfig: {
    type: string
    name: string
    component: any
    poster?: string
    preset?: any
    configForm?: any
  }): IComponentDefinition {
    const meta: IComponentMeta = {
      id: cardConfig.type,
      name: cardConfig.name,
      type: this.extractComponentType(cardConfig.type),
      version: '1.0.0',
      supportedRenderers: ['dom'] as RendererType[],
      description: `${cardConfig.name} 组件`,
      poster: cardConfig.poster,
      defaultProps: cardConfig.preset || {},
      configSchema: cardConfig.configForm
    }

    return {
      meta,
      logic: {
        // 数据处理逻辑
        processData: (data: any) => data,

        // 生命周期钩子
        onInit: async () => {
          console.log(`[${meta.id}] 组件初始化`)
        },

        onMount: async () => {
          console.log(`[${meta.id}] 组件挂载`)
        },

        onUpdate: async (data: any) => {
          console.log(`[${meta.id}] 组件更新`, data)
        },

        onDestroy: async () => {
          console.log(`[${meta.id}] 组件销毁`)
        },

        // 事件处理
        onEvent: (event: string, data: any) => {
          console.log(`[${meta.id}] 事件处理`, event, data)
        }
      },

      view: {
        vue: cardConfig.component
      },

      config: {
        schema: cardConfig.configForm,
        default: cardConfig.preset || {}
      },

      dataSource: {
        supported: ['device', 'system', 'api'],
        default: {
          type: 'device',
          config: {}
        }
      },

      layout: {
        defaultSize: { width: 4, height: 3 },
        minSize: { width: 2, height: 2 },
        maxSize: { width: 12, height: 8 },
        resizable: true,
        draggable: true
      }
    }
  }

  /**
   * 从卡片类型提取组件类型
   */
  private static extractComponentType(cardType: string): string {
    if (cardType.includes('chart')) return 'chart'
    if (cardType.includes('builtin')) return 'builtin'
    if (cardType.includes('device')) return 'device'
    if (cardType.includes('system')) return 'system'
    return 'custom'
  }
}

/**
 * 布局适配器
 */
export class LayoutAdapter {
  /**
   * 将 GridLayout 布局转换为 Card 2.0 布局
   */
  static fromGridLayout(gridItem: any): IDataNode['layout'] {
    return {
      x: gridItem.x || 0,
      y: gridItem.y || 0,
      width: gridItem.w || 4,
      height: gridItem.h || 3,
      minWidth: gridItem.minW || 2,
      minHeight: gridItem.minH || 2
    }
  }

  /**
   * 将 Card 2.0 布局转换为 GridLayout 布局
   */
  static toGridLayout(layout: IDataNode['layout'], id: string) {
    return {
      i: id,
      x: layout.x,
      y: layout.y,
      w: layout.width,
      h: layout.height,
      minW: layout.minWidth || 2,
      minH: layout.minHeight || 2
    }
  }
}

/**
 * 配置适配器
 */
export class ConfigAdapter {
  /**
   * 将现有面板配置转换为 Card 2.0 配置
   */
  static fromPanelConfig(panelConfig: any): {
    dataNodes: IDataNode[]
    theme?: string
    layout?: any
  } {
    const dataNodes: IDataNode[] = []

    if (Array.isArray(panelConfig)) {
      // 旧格式：直接是卡片数组
      panelConfig.forEach((item, index) => {
        if (item.data) {
          const dataNode = CardDataAdapter.toDataNode(item.data, {
            x: item.x || 0,
            y: item.y || 0,
            w: item.w || 4,
            h: item.h || 3
          })
          dataNodes.push(dataNode)
        }
      })
    } else if (panelConfig.layout) {
      // 新格式：包含 layout 和 theme
      panelConfig.layout.forEach((item: any) => {
        if (item.data) {
          const dataNode = CardDataAdapter.toDataNode(item.data, {
            x: item.x || 0,
            y: item.y || 0,
            w: item.w || 4,
            h: item.h || 3
          })
          dataNodes.push(dataNode)
        }
      })
    }

    return {
      dataNodes,
      theme: panelConfig.theme,
      layout: panelConfig.layout
    }
  }

  /**
   * 将 Card 2.0 配置转换为现有面板配置
   */
  static toPanelConfig(dataNodes: IDataNode[], theme?: string) {
    const layout = dataNodes.map(dataNode => {
      const cardData = CardDataAdapter.fromDataNode(dataNode)
      return {
        i: dataNode.id,
        x: dataNode.layout.x,
        y: dataNode.layout.y,
        w: dataNode.layout.width,
        h: dataNode.layout.height,
        minW: dataNode.layout.minWidth || 2,
        minH: dataNode.layout.minHeight || 2,
        data: cardData
      }
    })

    return {
      layout,
      theme: theme || '--no--theme--'
    }
  }
}

/**
 * 统一的适配器管理器
 */
export class Card2Adapter {
  static cardData = CardDataAdapter
  static componentDefinition = ComponentDefinitionAdapter
  static layout = LayoutAdapter
  static config = ConfigAdapter

  /**
   * 批量转换现有卡片到 Card 2.0
   */
  static migrateCards(cards: any[]): IDataNode[] {
    return cards.map(card => {
      if (card.data) {
        return CardDataAdapter.toDataNode(card.data, {
          x: card.x || 0,
          y: card.y || 0,
          w: card.w || 4,
          h: card.h || 3
        })
      }
      return CardDataAdapter.toDataNode(card)
    })
  }

  /**
   * 批量转换 Card 2.0 到现有格式
   */
  static exportCards(dataNodes: IDataNode[]) {
    return dataNodes.map(dataNode => {
      const cardData = CardDataAdapter.fromDataNode(dataNode)
      return {
        i: dataNode.id,
        x: dataNode.layout.x,
        y: dataNode.layout.y,
        w: dataNode.layout.width,
        h: dataNode.layout.height,
        minW: dataNode.layout.minWidth || 2,
        minH: dataNode.layout.minHeight || 2,
        data: cardData
      }
    })
  }
}
