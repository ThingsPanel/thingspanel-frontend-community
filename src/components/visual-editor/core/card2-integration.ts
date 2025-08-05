/**
 * Card 2.1 与 Widget Registry 集成器
 * 负责将 Card 2.1 组件转换为 Widget Definition 并注册到 Widget Registry
 */

import { widgetRegistry, type WidgetDefinition } from './widget-registry'
import { useVisualEditorIntegration } from '@/card2.1/hooks/useVisualEditorIntegration'
import type { ComponentDefinition } from '@/card2.1/core/types'

export interface Card2IntegrationOptions {
  autoInit?: boolean
  enableI18n?: boolean
}

/**
 * 将 Card 2.1 组件定义转换为 Widget Definition
 */
function convertCard2ToWidget(definition: ComponentDefinition): WidgetDefinition {
  // 优先使用 mainCategory，如果没有则使用 category
  const category = definition.mainCategory || definition.category || 'card21'

  return {
    type: definition.type,
    name: definition.name,
    description: definition.description || '',
    icon: definition.icon,
    category: category,
    subCategory: definition.subCategory,
    version: '2.1.0',
    defaultProperties: definition.properties || {},
    defaultLayout: {
      canvas: {
        width: 200,
        height: 150
      },
      gridstack: {
        w: 2,
        h: 2
      }
    },
    metadata: {
      isCard2Component: true,
      card2Definition: definition,
      source: 'card2'
    },
    source: 'card2' // 添加 source 属性到顶层
  }
}

/**
 * Card 2.1 集成器类
 */
class Card2Integration {
  private static instance: Card2Integration
  private isInitialized = false
  private integration: ReturnType<typeof useVisualEditorIntegration>

  private constructor() {
    this.integration = useVisualEditorIntegration({
      autoInit: false,
      enableI18n: true
    })
  }

  public static getInstance(): Card2Integration {
    if (!Card2Integration.instance) {
      Card2Integration.instance = new Card2Integration()
    }
    return Card2Integration.instance
  }

  /**
   * 初始化集成
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔄 [Card2Integration] 已初始化，跳过重复初始化')
      return
    }

    try {
      console.log('🚀 [Card2Integration] 开始初始化...')

      // 初始化 Card 2.1 系统
      await this.integration.initialize()

      // 获取所有 Card 2.1 组件
      const card2Components = this.integration.filteredComponents.value
      console.log('🔍 [Card2Integration] Card 2.1 组件详情:', {
        isArray: Array.isArray(card2Components),
        length: Array.isArray(card2Components) ? card2Components.length : 'N/A',
        components: card2Components
      })

      if (Array.isArray(card2Components) && card2Components.length > 0) {
        // 转换为 Widget Definition 并注册
        const widgets = card2Components.map(convertCard2ToWidget)
        widgetRegistry.register(...widgets)

        console.log(`✅ [Card2Integration] 成功注册 ${widgets.length} 个 Card 2.1 组件`)

        // 打印注册的组件信息
        widgets.forEach(widget => {
          console.log(`  - ${widget.type}: ${widget.name} (${widget.category})`)
        })
      } else {
        console.warn('⚠️ [Card2Integration] 没有找到 Card 2.1 组件')
        console.log('🔍 [Card2Integration] 集成状态:', this.integration.getStatus())
      }

      this.isInitialized = true
      console.log('🎉 [Card2Integration] 初始化完成')
    } catch (error) {
      console.error('❌ [Card2Integration] 初始化失败:', error)
      throw error
    }
  }

  /**
   * 检查是否为 Card 2.1 组件
   */
  isCard2Component(type: string): boolean {
    return this.integration.isCard2Component(type)
  }

  /**
   * 获取 Card 2.1 组件定义
   */
  getCard2Definition(type: string): ComponentDefinition | undefined {
    return this.integration.getComponentDefinition(type)
  }

  /**
   * 获取集成状态
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isLoading: this.integration.isLoading,
      error: this.integration.error,
      componentCount: Array.isArray(this.integration.filteredComponents.value)
        ? this.integration.filteredComponents.value.length
        : 0
    }
  }

  /**
   * 重新初始化
   */
  async reinitialize(): Promise<void> {
    this.isInitialized = false
    await this.initialize()
  }
}

// 导出单例
export const card2Integration = Card2Integration.getInstance()

// 导出工具函数
export { convertCard2ToWidget }
