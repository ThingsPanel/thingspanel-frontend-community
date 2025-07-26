import type { ConfigSchema } from '../../core/ConfigFormGenerator'

// 卡片数据接口
export interface CardData {
  id: string
  type: string
  value: string | number
  title: string
  layout: {
    x: number
    y: number
    w: number
    h: number
  }
  // 每个卡片独立的配置
  cardConfig?: any
}

// 渲染后的卡片接口
export interface RenderedCard extends CardData {
  element: HTMLElement
}

// 卡片渲染器接口
export interface CardRenderer {
  readonly id: string
  readonly name: string
  readonly description: string

  // 渲染单个卡片（使用卡片自己的配置）
  renderCard(cardData: CardData, cardSpecificConfig?: any): HTMLElement

  // 获取默认配置
  getDefaultConfig(): any

  // 获取配置表单schema（针对单个卡片）
  getConfigSchema(cardData?: CardData): ConfigSchema
}

// 卡片渲染器管理器
export class CardRendererManager {
  private renderers = new Map<string, CardRenderer>()
  private currentRenderer: CardRenderer | null = null

  // 注册渲染器
  register(renderer: CardRenderer) {
    this.renderers.set(renderer.id, renderer)
  }

  // 获取所有渲染器
  getRenderers(): CardRenderer[] {
    return Array.from(this.renderers.values())
  }

  // 切换渲染器
  switchRenderer(rendererId: string): CardRenderer {
    const renderer = this.renderers.get(rendererId)
    if (!renderer) {
      throw new Error(`Card renderer ${rendererId} not found`)
    }

    this.currentRenderer = renderer
    return renderer
  }

  // 获取当前渲染器
  getCurrentRenderer(): CardRenderer | null {
    return this.currentRenderer
  }

  // 渲染卡片（使用卡片特定配置）
  renderCard(cardData: CardData): HTMLElement | null {
    if (!this.currentRenderer) {
      console.warn('No card renderer selected')
      return null
    }

    // 使用卡片自己的配置，如果没有则使用默认配置
    const cardConfig = cardData.cardConfig || this.currentRenderer.getDefaultConfig()
    return this.currentRenderer.renderCard(cardData, cardConfig)
  }
}
