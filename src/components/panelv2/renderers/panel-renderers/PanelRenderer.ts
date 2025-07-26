import { RenderedCard } from '../card-renderers/CardRenderer'
import type { ConfigSchema } from '../../core/ConfigFormGenerator'

// 看板渲染器接口
export interface PanelRenderer {
  readonly id: string
  readonly name: string
  readonly description: string

  // 初始化看板渲染器
  init(container: HTMLElement, config: any): void

  // 销毁看板渲染器
  destroy(): void

  // 渲染已渲染的卡片到看板
  renderPanel(renderedCards: RenderedCard[]): void

  // 更新配置
  updateConfig(config: any): void

  // 获取当前配置
  getConfig(): any

  // 获取默认配置
  getDefaultConfig(): any

  // 获取配置表单schema
  getConfigSchema(): ConfigSchema

  // 选中卡片
  selectCard(cardId: string): void

  // 清除选中
  clearSelection(): void

  // 添加卡片
  addCard(renderedCard: RenderedCard): void

  // 移除卡片
  removeCard(cardId: string): void
}

// 看板渲染器管理器
export class PanelRendererManager {
  private renderers = new Map<string, PanelRenderer>()
  private currentRenderer: PanelRenderer | null = null
  private container: HTMLElement | null = null
  private renderedCards: RenderedCard[] = []
  private onSelectionChange?: (cardId: string | null) => void

  // 注册渲染器
  register(renderer: PanelRenderer) {
    this.renderers.set(renderer.id, renderer)
  }

  // 获取所有渲染器
  getRenderers(): PanelRenderer[] {
    return Array.from(this.renderers.values())
  }

  // 切换渲染器
  switchRenderer(rendererId: string, container: HTMLElement): PanelRenderer {
    const renderer = this.renderers.get(rendererId)
    if (!renderer) {
      throw new Error(`Panel renderer ${rendererId} not found`)
    }

    // 销毁当前渲染器
    if (this.currentRenderer) {
      this.currentRenderer.destroy()
    }

    // 初始化新渲染器
    this.currentRenderer = renderer
    this.container = container
    renderer.init(container, renderer.getDefaultConfig())

    // 渲染当前卡片
    if (this.renderedCards.length > 0) {
      renderer.renderPanel(this.renderedCards)
    }

    return renderer
  }

  // 渲染卡片到看板
  renderPanel(renderedCards: RenderedCard[]) {
    this.renderedCards = renderedCards
    if (this.currentRenderer) {
      this.currentRenderer.renderPanel(renderedCards)
    }
  }

  // 更新配置
  updateConfig(config: any) {
    if (this.currentRenderer) {
      this.currentRenderer.updateConfig(config)
    }
  }

  // 获取当前渲染器
  getCurrentRenderer(): PanelRenderer | null {
    return this.currentRenderer
  }

  // 获取当前配置
  getCurrentConfig(): any {
    return this.currentRenderer?.getConfig() || {}
  }

  // 选中卡片
  selectCard(cardId: string) {
    if (this.currentRenderer) {
      this.currentRenderer.selectCard(cardId)
    }
    this.onSelectionChange?.(cardId)
  }

  // 添加卡片
  addCard(renderedCard: RenderedCard) {
    this.renderedCards.push(renderedCard)
    if (this.currentRenderer) {
      this.currentRenderer.addCard(renderedCard)
    }
  }

  // 移除卡片
  removeCard(cardId: string) {
    this.renderedCards = this.renderedCards.filter(card => card.id !== cardId)
    if (this.currentRenderer) {
      this.currentRenderer.removeCard(cardId)
    }
  }

  // 设置选中回调
  setSelectionChangeCallback(callback: (cardId: string | null) => void) {
    this.onSelectionChange = callback
  }
}
