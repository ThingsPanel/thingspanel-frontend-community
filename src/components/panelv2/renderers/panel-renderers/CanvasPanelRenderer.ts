import { PanelRenderer } from './PanelRenderer'
import { RenderedCard } from '../card-renderers/CardRenderer'
import type { ConfigSchema } from '../../core/ConfigFormGenerator'

// 画布看板配置接口
interface CanvasPanelConfig {
  width: number
  height: number
  zoom: number
  backgroundColor: string
  gridVisible: boolean
  gridSize: number
  snapToGrid: boolean
}

// 画布看板渲染器实现
export class CanvasPanelRenderer implements PanelRenderer {
  readonly id = 'canvas'
  readonly name = '画布布局'
  readonly description = '自由定位的画布看板'

  private container: HTMLElement | null = null
  private canvas: HTMLElement | null = null
  private config: CanvasPanelConfig = this.getDefaultConfig()
  private renderedCards: RenderedCard[] = []

  init(container: HTMLElement, config: CanvasPanelConfig) {
    this.container = container
    this.config = { ...this.getDefaultConfig(), ...config }

    // 清空容器
    container.innerHTML = ''

    // 设置画布模式的独特容器样式
    container.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      overflow: auto;
      background: linear-gradient(45deg, #f0f8ff 0%, #ffffff 100%);
      border-left: 4px solid #1890ff;
    `
    container.setAttribute('data-renderer', 'canvas')

    // 添加画布模式标识
    const rendererLabel = document.createElement('div')
    rendererLabel.innerHTML = '<i class="fa fa-paint-brush"></i> 画布布局模式'
    rendererLabel.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(24, 144, 255, 0.9);
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 4px;
    `
    container.appendChild(rendererLabel)

    // 创建Canvas容器
    this.canvas = document.createElement('div')
    this.canvas.className = 'canvas-panel-renderer'
    this.canvas.style.cssText = `
      position: relative;
      width: ${this.config.width}px;
      height: ${this.config.height}px;
      background-color: ${this.config.backgroundColor};
      overflow: hidden;
      transform: scale(${this.config.zoom});
      transform-origin: top left;
      border: 1px solid #ddd;
      ${this.config.gridVisible ? this.getGridBackground() : ''}
    `

    container.appendChild(this.canvas)
    console.log('画布看板渲染器初始化', this.config)
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = ''
    }
    this.canvas = null
    this.container = null
  }

  renderPanel(renderedCards: RenderedCard[]) {
    if (!this.canvas) return

    this.renderedCards = renderedCards

    // 清空现有内容
    this.canvas.innerHTML = ''

    // 渲染每个卡片
    renderedCards.forEach(card => {
      this.addCardToCanvas(card)
    })
  }

  addCard(renderedCard: RenderedCard) {
    if (!this.canvas || !this.container) {
      console.error('CanvasPanelRenderer not initialized properly')
      return
    }

    this.renderedCards.push(renderedCard)
    this.addCardToCanvas(renderedCard)
  }

  private addCardToCanvas(card: RenderedCard) {
    if (!this.canvas) return

    const cardWrapper = document.createElement('div')
    cardWrapper.className = 'canvas-card-wrapper'
    cardWrapper.dataset.cardId = card.id

    // 计算位置和大小
    const x = card.layout.x || Math.random() * (this.config.width - 200)
    const y = card.layout.y || Math.random() * (this.config.height - 120)
    const width = card.layout.w ? card.layout.w * 100 : 200
    const height = card.layout.h ? card.layout.h * 80 : 120

    cardWrapper.style.cssText = `
      position: absolute;
      left: ${x}px;
      top: ${y}px;
      width: ${width}px;
      height: ${height}px;
      cursor: move;
      transition: all 0.2s;
      z-index: 1;
    `

    // 将渲染的卡片元素添加到wrapper中
    cardWrapper.appendChild(card.element)
    this.canvas.appendChild(cardWrapper)

    // 添加点击选中事件
    cardWrapper.addEventListener('click', e => {
      e.stopPropagation()
      this.selectCard(card.id)
    })

    // 添加简单的拖拽功能
    this.makeDraggable(cardWrapper)
  }

  removeCard(cardId: string) {
    const cardWrapper = this.canvas?.querySelector(`[data-card-id="${cardId}"]`)
    if (cardWrapper) {
      cardWrapper.remove()
    }
    this.renderedCards = this.renderedCards.filter(card => card.id !== cardId)
  }

  private makeDraggable(element: HTMLElement) {
    let isDragging = false
    let startX = 0
    let startY = 0
    let initialX = 0
    let initialY = 0

    element.addEventListener('mousedown', e => {
      isDragging = true
      startX = e.clientX
      startY = e.clientY
      initialX = parseInt(element.style.left) || 0
      initialY = parseInt(element.style.top) || 0

      element.style.zIndex = '1000'
      element.style.transform = 'scale(1.05)'
      e.preventDefault()
    })

    document.addEventListener('mousemove', e => {
      if (!isDragging) return

      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      let newX = initialX + deltaX / this.config.zoom
      let newY = initialY + deltaY / this.config.zoom

      // 网格对齐
      if (this.config.snapToGrid) {
        newX = Math.round(newX / this.config.gridSize) * this.config.gridSize
        newY = Math.round(newY / this.config.gridSize) * this.config.gridSize
      }

      // 边界限制
      newX = Math.max(0, Math.min(newX, this.config.width - parseInt(element.style.width)))
      newY = Math.max(0, Math.min(newY, this.config.height - parseInt(element.style.height)))

      element.style.left = `${newX}px`
      element.style.top = `${newY}px`
    })

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false
        element.style.zIndex = '1'
        element.style.transform = 'scale(1)'
      }
    })
  }

  private getGridBackground(): string {
    const size = this.config.gridSize
    return `
      background-image: 
        linear-gradient(to right, #f0f0f0 1px, transparent 1px),
        linear-gradient(to bottom, #f0f0f0 1px, transparent 1px);
      background-size: ${size}px ${size}px;
    `
  }

  updateConfig(config: Partial<CanvasPanelConfig>) {
    this.config = { ...this.config, ...config }
    console.log('画布看板配置更新:', this.config)

    if (this.canvas) {
      this.canvas.style.width = `${this.config.width}px`
      this.canvas.style.height = `${this.config.height}px`
      this.canvas.style.backgroundColor = this.config.backgroundColor
      this.canvas.style.transform = `scale(${this.config.zoom})`
      this.canvas.style.backgroundImage = this.config.gridVisible ? this.getGridBackground() : 'none'
    }
  }

  getConfig(): CanvasPanelConfig {
    return { ...this.config }
  }

  getDefaultConfig(): CanvasPanelConfig {
    return {
      width: 1200,
      height: 800,
      zoom: 1,
      backgroundColor: '#fafafa',
      gridVisible: true,
      gridSize: 20,
      snapToGrid: false
    }
  }

  getConfigSchema(): ConfigSchema {
    return {
      title: '画布布局配置',
      fields: [
        {
          key: 'width',
          label: '画布宽度',
          type: 'number',
          defaultValue: 1200,
          min: 800,
          max: 2400,
          step: 100,
          description: '画布的宽度像素值'
        },
        {
          key: 'height',
          label: '画布高度',
          type: 'number',
          defaultValue: 800,
          min: 600,
          max: 1600,
          step: 100,
          description: '画布的高度像素值'
        },
        {
          key: 'zoom',
          label: '缩放比例',
          type: 'range',
          defaultValue: 1,
          min: 0.5,
          max: 2,
          step: 0.1,
          description: '画布的缩放比例'
        },
        {
          key: 'backgroundColor',
          label: '背景颜色',
          type: 'color',
          defaultValue: '#fafafa',
          description: '画布的背景颜色'
        },
        {
          key: 'gridVisible',
          label: '显示网格',
          type: 'boolean',
          defaultValue: true,
          description: '是否显示辅助网格线'
        },
        {
          key: 'gridSize',
          label: '网格大小',
          type: 'number',
          defaultValue: 20,
          min: 10,
          max: 50,
          step: 5,
          description: '网格的像素大小'
        },
        {
          key: 'snapToGrid',
          label: '网格对齐',
          type: 'boolean',
          defaultValue: false,
          description: '是否启用网格对齐功能'
        }
      ]
    }
  }

  selectCard(cardId: string) {
    // 清除之前的选中状态
    this.clearSelection()

    // 选中指定卡片
    const cardWrapper = this.canvas?.querySelector(`[data-card-id="${cardId}"]`) as HTMLElement
    if (cardWrapper) {
      cardWrapper.style.outline = '2px solid #1890ff'
      cardWrapper.style.outlineOffset = '2px'
      cardWrapper.style.zIndex = '100'
    }
  }

  clearSelection() {
    const cardWrappers = this.canvas?.querySelectorAll('.canvas-card-wrapper') || []
    cardWrappers.forEach((wrapper: any) => {
      wrapper.style.outline = 'none'
      wrapper.style.outlineOffset = '0'
      wrapper.style.zIndex = '1'
    })
  }
}
