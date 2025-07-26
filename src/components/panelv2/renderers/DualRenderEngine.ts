import { CardRenderer, CardRendererManager, CardData, RenderedCard } from './card-renderers/CardRenderer'
import { PanelRenderer, PanelRendererManager } from './panel-renderers/PanelRenderer'
import { ConfigFormGenerator, type ConfigSchema, type FieldChangeCallback } from '../core/ConfigFormGenerator'

// 双层渲染引擎配置
interface DualRenderEngineConfig {
  cardRendererId: string
  panelRendererId: string
}

// 组件模板定义
export interface ComponentTemplate {
  id: string
  name: string
  icon: string
  type: string
  defaultData: Partial<CardData>
}

// 拖拽事件回调
export interface DragCallbacks {
  onDragStart?: (template: ComponentTemplate) => void
  onDragEnd?: () => void
  onDrop?: (template: ComponentTemplate, position: { x: number; y: number }) => void
}

// 双层渲染引擎
export class DualRenderEngine {
  private cardRendererManager: CardRendererManager
  private panelRendererManager: PanelRendererManager
  private cardDataList: CardData[] = []
  private onSelectionChange?: (cardId: string | null) => void
  private dragCallbacks: DragCallbacks = {}
  private container: HTMLElement | null = null
  private componentTemplates: ComponentTemplate[] = []

  constructor() {
    this.cardRendererManager = new CardRendererManager()
    this.panelRendererManager = new PanelRendererManager()

    // 设置看板渲染器的选中回调
    this.panelRendererManager.setSelectionChangeCallback(cardId => {
      this.onSelectionChange?.(cardId)
    })

    // 初始化默认组件模板
    this.initDefaultTemplates()
  }

  // 注册卡片渲染器
  registerCardRenderer(renderer: CardRenderer) {
    this.cardRendererManager.register(renderer)
  }

  // 注册看板渲染器
  registerPanelRenderer(renderer: PanelRenderer) {
    this.panelRendererManager.register(renderer)
  }

  // 获取所有卡片渲染器
  getCardRenderers(): CardRenderer[] {
    return this.cardRendererManager.getRenderers()
  }

  // 获取所有看板渲染器
  getPanelRenderers(): PanelRenderer[] {
    return this.panelRendererManager.getRenderers()
  }

  // 初始化默认组件模板
  private initDefaultTemplates() {
    this.componentTemplates = [
      {
        id: 'sensor-card',
        name: '传感器卡片',
        icon: 'fa fa-thermometer-half',
        type: 'sensor',
        defaultData: {
          title: '传感器',
          value: 0,
          type: 'sensor',
          layout: { x: 0, y: 0, w: 2, h: 2 }
        }
      },
      {
        id: 'chart-card',
        name: '图表卡片',
        icon: 'fa fa-chart-bar',
        type: 'chart',
        defaultData: {
          title: '图表',
          value: 'Chart',
          type: 'chart',
          layout: { x: 0, y: 0, w: 4, h: 3 }
        }
      },
      {
        id: 'status-card',
        name: '状态卡片',
        icon: 'fa fa-info-circle',
        type: 'status',
        defaultData: {
          title: '状态',
          value: 'Online',
          type: 'status',
          layout: { x: 0, y: 0, w: 2, h: 2 }
        }
      }
    ]
  }

  // 获取组件模板
  getComponentTemplates(): ComponentTemplate[] {
    return [...this.componentTemplates]
  }

  // 初始化双层渲染引擎
  init(container: HTMLElement, config: DualRenderEngineConfig) {
    this.container = container

    console.log(`双层渲染引擎初始化开始: ${config.cardRendererId} + ${config.panelRendererId}`)

    // 切换到指定的卡片渲染器
    this.cardRendererManager.switchRenderer(config.cardRendererId)
    console.log('卡片渲染器切换完成:', this.cardRendererManager.getCurrentRenderer()?.name)

    // 切换到指定的看板渲染器
    this.panelRendererManager.switchRenderer(config.panelRendererId, container)
    console.log('看板渲染器切换完成:', this.panelRendererManager.getCurrentRenderer()?.name)

    // 设置拖拽支持
    this.setupDragAndDrop(container)

    console.log(`双层渲染引擎初始化完成`)
  }

  // 切换卡片渲染器
  switchCardRenderer(rendererId: string) {
    try {
      this.cardRendererManager.switchRenderer(rendererId)
      console.log(`切换卡片渲染器: ${rendererId}`)

      // 重新渲染所有卡片
      this.renderAll()
    } catch (error) {
      console.error('切换卡片渲染器失败:', error)
    }
  }

  // 切换看板渲染器
  switchPanelRenderer(rendererId: string, container: HTMLElement) {
    try {
      this.panelRendererManager.switchRenderer(rendererId, container)
      console.log(`切换看板渲染器: ${rendererId}`)

      // 重新渲染所有卡片
      this.renderAll()
    } catch (error) {
      console.error('切换看板渲染器失败:', error)
    }
  }

  // 设置卡片数据
  setCardData(cardDataList: CardData[]) {
    this.cardDataList = cardDataList
    this.renderAll()
  }

  // 添加卡片
  addCard(cardData: CardData) {
    this.cardDataList.push(cardData)

    // 用卡片渲染器渲染新卡片
    const cardElement = this.cardRendererManager.renderCard(cardData)
    if (cardElement) {
      const renderedCard: RenderedCard = {
        ...cardData,
        element: cardElement
      }

      // 添加到看板渲染器
      this.panelRendererManager.addCard(renderedCard)
    }
  }

  // 移除卡片
  removeCard(cardId: string) {
    this.cardDataList = this.cardDataList.filter(card => card.id !== cardId)
    this.panelRendererManager.removeCard(cardId)
  }

  // 获取卡片数据
  getCardData(): CardData[] {
    return [...this.cardDataList]
  }

  // 选中卡片
  selectCard(cardId: string) {
    this.panelRendererManager.selectCard(cardId)
  }

  // 获取选中的卡片数据
  getSelectedCard(cardId: string): CardData | null {
    return this.cardDataList.find(card => card.id === cardId) || null
  }

  // 双层渲染流程：数据 → 卡片渲染 → 看板布局
  private renderAll() {
    if (this.cardDataList.length === 0) {
      this.panelRendererManager.renderPanel([])
      return
    }

    // 第一层：用卡片渲染器渲染每个卡片
    const renderedCards: RenderedCard[] = this.cardDataList
      .map(cardData => {
        const cardElement = this.cardRendererManager.renderCard(cardData)
        if (!cardElement) {
          throw new Error(`Failed to render card: ${cardData.id}`)
        }

        return {
          ...cardData,
          element: cardElement
        }
      })
      .filter(card => card.element !== null) as RenderedCard[]

    // 第二层：用看板渲染器布局所有卡片
    this.panelRendererManager.renderPanel(renderedCards)

    console.log(`双层渲染完成: ${renderedCards.length} 张卡片`)
  }

  // 获取当前渲染器信息
  getCurrentRenderers() {
    return {
      cardRenderer: this.cardRendererManager.getCurrentRenderer(),
      panelRenderer: this.panelRendererManager.getCurrentRenderer()
    }
  }

  // 获取当前渲染器配置
  getCurrentConfig() {
    return {
      cardConfig: this.cardRendererManager.getCurrentRenderer()?.getDefaultConfig() || {},
      panelConfig: this.panelRendererManager.getCurrentConfig()
    }
  }

  // 更新卡片渲染器配置
  updateCardRendererConfig(config: any) {
    // 注意：新的CardRenderer接口不支持全局配置更新
    // 卡片配置现在是针对每个卡片单独设置的
    console.warn('CardRenderer不再支持全局配置更新，请使用updateSelectedCardConfig更新单个卡片配置')
    // 不执行任何操作，因为CardRenderer现在使用per-card配置
  }

  // 更新看板渲染器配置
  updatePanelRendererConfig(config: any) {
    this.panelRendererManager.updateConfig(config)
  }

  // 清空所有数据
  clearAll() {
    this.cardDataList = []
    this.panelRendererManager.renderPanel([])
  }

  // 设置选中回调
  setSelectionChangeCallback(callback: (cardId: string | null) => void) {
    this.onSelectionChange = callback
  }

  // 设置拖拽和放置功能
  private setupDragAndDrop(container: HTMLElement) {
    // 设置容器为可接受拖放
    container.addEventListener('dragover', e => {
      e.preventDefault()
      e.dataTransfer!.dropEffect = 'copy'
    })

    container.addEventListener('drop', e => {
      e.preventDefault()
      const templateId = e.dataTransfer!.getData('text/plain')
      const template = this.componentTemplates.find(t => t.id === templateId)

      if (template) {
        // 计算放置位置
        const rect = container.getBoundingClientRect()
        const position = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        }

        // 创建新卡片并添加
        this.createCardFromTemplate(template, position)

        // 触发拖拽回调（异步安全）
        this.dragCallbacks.onDrop?.(template, position)
        // 延迟触发dragEnd回调，避免与drop回调冲突
        setTimeout(() => {
          this.dragCallbacks.onDragEnd?.()
        }, 0)
      }
    })
  }

  // 从模板创建卡片
  private createCardFromTemplate(template: ComponentTemplate, position: { x: number; y: number }) {
    const newCard: CardData = {
      id: `${template.type}-${Date.now()}`,
      title: template.defaultData.title || template.name,
      value: template.defaultData.value || 0,
      type: template.defaultData.type || template.type,
      layout: {
        x: Math.floor(position.x / 100), // 简单的网格对齐
        y: Math.floor(position.y / 100),
        w: template.defaultData.layout?.w || 2,
        h: template.defaultData.layout?.h || 2
      }
    }

    this.addCard(newCard)
    console.log('从模板创建卡片:', template.name, '位置:', position)
  }

  // 设置拖拽事件回调
  setDragCallbacks(callbacks: DragCallbacks) {
    this.dragCallbacks = callbacks
  }

  // 启用组件的拖拽功能
  enableComponentDrag(element: HTMLElement, templateId: string) {
    element.draggable = true

    element.addEventListener('dragstart', e => {
      e.dataTransfer!.setData('text/plain', templateId)
      e.dataTransfer!.effectAllowed = 'copy'

      const template = this.componentTemplates.find(t => t.id === templateId)
      if (template) {
        this.dragCallbacks.onDragStart?.(template)
      }
    })

    element.addEventListener('dragend', () => {
      this.dragCallbacks.onDragEnd?.()
    })
  }

  // 销毁引擎
  destroy() {
    const panelRenderer = this.panelRendererManager.getCurrentRenderer()
    if (panelRenderer) {
      panelRenderer.destroy()
    }
    this.container = null
  }

  // 创建选中卡片的配置表单
  createSelectedCardConfigForm(container: HTMLElement, selectedCardId: string): HTMLElement | null {
    const cardRenderer = this.cardRendererManager.getCurrentRenderer()
    const selectedCard = this.cardDataList.find(card => card.id === selectedCardId)

    console.log('创建选中卡片配置表单:', selectedCardId, selectedCard?.title)

    if (!cardRenderer || !selectedCard) {
      console.warn('没有当前卡片渲染器或选中卡片')
      return null
    }

    try {
      const schema = cardRenderer.getConfigSchema(selectedCard)
      console.log('选中卡片配置schema:', schema)

      // 使用卡片自己的配置，如果没有则使用默认配置
      const currentConfig = selectedCard.cardConfig || cardRenderer.getDefaultConfig()
      console.log('选中卡片当前配置:', currentConfig)

      const onChange: FieldChangeCallback = (key, value) => {
        console.log('选中卡片配置变更:', key, '=', value)
        this.updateSelectedCardConfig(selectedCardId, { [key]: value })
      }

      const form = ConfigFormGenerator.createForm(schema, currentConfig, onChange)
      container.innerHTML = ''
      container.appendChild(form)

      return form
    } catch (error) {
      console.error('创建选中卡片配置表单失败:', error)
      return null
    }
  }

  // 更新选中卡片的配置
  updateSelectedCardConfig(cardId: string, config: any) {
    const card = this.cardDataList.find(c => c.id === cardId)
    if (card) {
      // 合并配置到卡片的cardConfig中
      card.cardConfig = { ...(card.cardConfig || {}), ...config }
      console.log('更新卡片配置:', cardId, card.cardConfig)

      // 重新渲染这个卡片
      this.rerenderCard(cardId)
    }
  }

  // 重新渲染指定卡片
  private rerenderCard(cardId: string) {
    const card = this.cardDataList.find(c => c.id === cardId)
    if (!card) return

    // 用卡片渲染器重新渲染
    const newElement = this.cardRendererManager.renderCard(card)
    if (!newElement) return

    // 替换看板中的卡片元素
    const panelRenderer = this.panelRendererManager.getCurrentRenderer()
    if (panelRenderer) {
      panelRenderer.removeCard(cardId)
      panelRenderer.addCard({
        ...card,
        element: newElement
      })
    }
  }

  // 创建看板渲染器配置表单
  createPanelRendererConfigForm(container: HTMLElement): HTMLElement | null {
    const panelRenderer = this.panelRendererManager.getCurrentRenderer()
    console.log('创建看板配置表单 - 当前渲染器:', panelRenderer?.id, panelRenderer?.name)

    if (!panelRenderer) {
      console.warn('没有当前看板渲染器')
      return null
    }

    try {
      const schema = panelRenderer.getConfigSchema()
      console.log('看板配置schema:', schema)

      const currentConfig = panelRenderer.getConfig()
      console.log('看板当前配置:', currentConfig)

      const onChange: FieldChangeCallback = (key, value) => {
        console.log('看板配置变更:', key, '=', value)
        this.updatePanelRendererConfig({ [key]: value })
      }

      const form = ConfigFormGenerator.createForm(schema, currentConfig, onChange)
      container.innerHTML = ''
      container.appendChild(form)

      return form
    } catch (error) {
      console.error('创建看板配置表单失败:', error)
      return null
    }
  }

  // 获取当前渲染器的配置schema
  getCurrentConfigSchemas() {
    const cardRenderer = this.cardRendererManager.getCurrentRenderer()
    const panelRenderer = this.panelRendererManager.getCurrentRenderer()

    return {
      cardSchema: cardRenderer?.getConfigSchema() || null,
      panelSchema: panelRenderer?.getConfigSchema() || null
    }
  }

  // 获取调试信息
  getDebugInfo() {
    const currentRenderers = this.getCurrentRenderers()
    return {
      cardRenderer: {
        id: currentRenderers.cardRenderer?.id || 'none',
        name: currentRenderers.cardRenderer?.name || 'none'
      },
      panelRenderer: {
        id: currentRenderers.panelRenderer?.id || 'none',
        name: currentRenderers.panelRenderer?.name || 'none'
      },
      cardCount: this.cardDataList.length,
      availableRenderers: {
        cards: this.getCardRenderers().length,
        panels: this.getPanelRenderers().length
      }
    }
  }
}
