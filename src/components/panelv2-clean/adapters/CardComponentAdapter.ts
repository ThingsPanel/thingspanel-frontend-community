/**
 * @file Card组件适配器
 * @description 将现有的ICardDefine组件适配为新架构的ComponentDefinition
 * 实现看板与组件的解耦，直接使用现有的card组件进行测试
 */

import type { ICardDefine } from '@/components/panel/card'
import type { ComponentDefinition } from '../types/core'

/**
 * Card组件适配器类
 * 负责将ICardDefine格式转换为ComponentDefinition格式
 */
export class CardComponentAdapter {
  /**
   * 将ICardDefine转换为ComponentDefinition
   */
  static adaptCard(cardDefine: ICardDefine): ComponentDefinition {
    console.log(`CardComponentAdapter: 适配组件 ${cardDefine.id}`)

    // 确定组件分类
    const category = CardComponentAdapter.mapCardTypeToCategory(cardDefine.type)
    
    // 创建默认配置
    const defaults = CardComponentAdapter.createDefaultConfig(cardDefine)
    
    // 创建配置Schema
    const configSchema = CardComponentAdapter.createConfigSchema(cardDefine)

    const componentDefinition: ComponentDefinition = {
      type: cardDefine.id,
      name: cardDefine.title,
      category: category,
      component: cardDefine.component,
      
      configSchema: configSchema,
      
      defaults: defaults,
      
      meta: {
        title: cardDefine.title,
        description: `来自ThingsPanel的${cardDefine.type}类型组件`,
        icon: CardComponentAdapter.getCardIcon(cardDefine.type),
        poster: cardDefine.poster,
        version: '1.0.0',
        author: 'ThingsPanel',
        keywords: CardComponentAdapter.generateKeywords(cardDefine)
      },

      responsive: {
        autoResize: true,
        maintainAspectRatio: false,
        resizeHandles: ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']
      }
    }

    console.log(`CardComponentAdapter: 组件 ${cardDefine.id} 适配完成`)
    return componentDefinition
  }

  /**
   * 映射card类型到新架构的分类
   */
  private static mapCardTypeToCategory(cardType: ICardDefine['type']): string {
    const typeMapping: Record<string, string> = {
      'builtin': 'basic',
      'device': 'basic', 
      'chart': 'chart',
      'plugin': 'advanced'
    }
    
    return typeMapping[cardType] || 'basic'
  }

  /**
   * 根据卡片类型获取图标
   */
  private static getCardIcon(cardType: ICardDefine['type']): string {
    const iconMapping: Record<string, string> = {
      'builtin': '🏠',
      'device': '📱',
      'chart': '📊',
      'plugin': '🔌'
    }
    
    return iconMapping[cardType] || '🧩'
  }

  /**
   * 生成关键词
   */
  private static generateKeywords(cardDefine: ICardDefine): string[] {
    const keywords = [cardDefine.title, cardDefine.type]
    
    // 根据ID添加更多关键词
    if (cardDefine.id.includes('chart')) {
      keywords.push('图表', '数据可视化', '数据')
    }
    if (cardDefine.id.includes('device')) {
      keywords.push('设备', '物联网', 'IoT')
    }
    if (cardDefine.id.includes('alarm')) {
      keywords.push('告警', '通知', '监控')
    }
    if (cardDefine.id.includes('system')) {
      keywords.push('系统', '监控', '状态')
    }
    
    return keywords
  }

  /**
   * 创建默认配置
   */
  private static createDefaultConfig(cardDefine: ICardDefine) {
    // 从preset中获取默认尺寸
    const defaultSize = cardDefine.preset?.iCardViewDefault || { w: 4, h: 3 }
    
    return {
      layout: {
        x: 0,
        y: 0,
        w: defaultSize.w || 4,
        h: defaultSize.h || 3,
        minW: defaultSize.minW || 2,
        minH: defaultSize.minH || 2
      },
      config: {
        base: {
          layout: {
            x: 0,
            y: 0,
            w: defaultSize.w || 4,
            h: defaultSize.h || 3,
            minW: defaultSize.minW || 2,
            minH: defaultSize.minH || 2
          },
          state: {
            locked: false,
            hidden: false,
            disabled: false
          },
          appearance: {
            border: {
              width: 1,
              style: 'solid' as const,
              color: '#e8e8e8',
              radius: 4
            },
            opacity: 1
          }
        },
        interaction: {
          onClick: { type: 'none' as const },
          onHover: { highlight: false }
        },
        content: CardComponentAdapter.adaptCardConfig(cardDefine)
      },
      style: {
        background: {
          color: '#ffffff'
        },
        shadow: {
          enabled: false,
          color: '#000000',
          blur: 4,
          offsetX: 0,
          offsetY: 2
        }
      }
    }
  }

  /**
   * 适配卡片的配置数据
   */
  private static adaptCardConfig(cardDefine: ICardDefine): any {
    // 合并preset中的配置和默认配置
    const baseConfig = {
      cardId: cardDefine.id,
      cardType: cardDefine.type,
      title: cardDefine.title
    }

    // 如果有preset配置，合并进来
    if (cardDefine.preset?.config) {
      Object.assign(baseConfig, cardDefine.preset.config)
    }

    // 如果有数据源配置，也合并进来
    if (cardDefine.preset?.dataSource) {
      baseConfig.dataSource = cardDefine.preset.dataSource
    }

    // 如果有基础设置，也合并进来
    if (cardDefine.preset?.basicSettings) {
      baseConfig.basicSettings = cardDefine.preset.basicSettings
    }

    return baseConfig
  }

  /**
   * 创建配置Schema
   */
  private static createConfigSchema(cardDefine: ICardDefine) {
    return {
      base: {
        type: 'object',
        properties: {
          layout: {
            type: 'object',
            title: '布局配置',
            properties: {
              w: { type: 'number', title: '宽度', minimum: cardDefine.preset?.iCardViewDefault?.minW || 2 },
              h: { type: 'number', title: '高度', minimum: cardDefine.preset?.iCardViewDefault?.minH || 2 }
            }
          },
          state: {
            type: 'object',
            title: '状态配置',
            properties: {
              locked: { type: 'boolean', title: '锁定位置' },
              hidden: { type: 'boolean', title: '隐藏组件' },
              disabled: { type: 'boolean', title: '禁用交互' }
            }
          },
          appearance: {
            type: 'object',
            title: '外观配置',
            properties: {
              border: {
                type: 'object',
                title: '边框',
                properties: {
                  width: { type: 'number', title: '边框宽度' },
                  color: { type: 'string', title: '边框颜色' },
                  radius: { type: 'number', title: '圆角半径' }
                }
              },
              opacity: { type: 'number', title: '透明度', minimum: 0, maximum: 1 }
            }
          }
        }
      },
      interaction: {
        type: 'object',
        title: '交互配置',
        properties: {
          onClick: {
            type: 'object',
            title: '点击行为',
            properties: {
              type: { type: 'string', enum: ['none', 'link', 'modal', 'custom'], title: '行为类型' }
            }
          },
          onHover: {
            type: 'object',
            title: '悬停行为',
            properties: {
              highlight: { type: 'boolean', title: '高亮显示' }
            }
          }
        }
      },
      content: CardComponentAdapter.createContentSchema(cardDefine)
    }
  }

  /**
   * 创建内容配置Schema
   */
  private static createContentSchema(cardDefine: ICardDefine) {
    // 基础内容配置
    const baseProperties = {
      title: { type: 'string', title: '组件标题' },
      cardType: { type: 'string', title: '卡片类型', readOnly: true },
      cardId: { type: 'string', title: '卡片ID', readOnly: true }
    }

    // 根据卡片类型添加特定配置
    if (cardDefine.type === 'chart') {
      Object.assign(baseProperties, {
        dataSource: {
          type: 'object',
          title: '数据源配置',
          properties: {
            origin: { type: 'string', enum: ['system', 'device'], title: '数据来源' },
            sourceNum: { type: 'number', title: '数据源数量' },
            isSupportTimeRange: { type: 'boolean', title: '支持时间范围' },
            dataTimeRange: { type: 'string', title: '时间范围' }
          }
        }
      })
    }

    // 如果有配置表单组件，添加自定义配置
    if (cardDefine.configForm) {
      baseProperties.customConfig = {
        type: 'object',
        title: '自定义配置',
        description: '此组件支持自定义配置面板'
      }
    }

    return {
      type: 'object',
      title: '内容配置',
      properties: baseProperties
    }
  }

  /**
   * 批量适配多个card组件
   */
  static adaptCards(cardDefines: ICardDefine[]): ComponentDefinition[] {
    console.log(`CardComponentAdapter: 开始批量适配 ${cardDefines.length} 个组件`)
    
    const adaptedComponents: ComponentDefinition[] = []
    
    for (const cardDefine of cardDefines) {
      try {
        const adapted = CardComponentAdapter.adaptCard(cardDefine)
        adaptedComponents.push(adapted)
      } catch (error) {
        console.error(`CardComponentAdapter: 适配组件 ${cardDefine.id} 失败`, error)
      }
    }
    
    console.log(`CardComponentAdapter: 批量适配完成，成功 ${adaptedComponents.length} 个`)
    return adaptedComponents
  }
}

/**
 * 便捷的适配函数
 */
export const adaptCardToComponent = CardComponentAdapter.adaptCard
export const adaptCardsToComponents = CardComponentAdapter.adaptCards