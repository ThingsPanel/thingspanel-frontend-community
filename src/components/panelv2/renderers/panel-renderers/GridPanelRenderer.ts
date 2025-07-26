import { PanelRenderer } from './PanelRenderer'
import { RenderedCard } from '../card-renderers/CardRenderer'
import type { ConfigSchema } from '../../core/ConfigFormGenerator'

// 网格看板配置接口
interface GridPanelConfig {
  columns: number
  margin: number
  animate: boolean
  float: boolean
  removable: boolean
  acceptWidgets: boolean
}

// 网格看板渲染器实现
export class GridPanelRenderer implements PanelRenderer {
  readonly id = 'grid'
  readonly name = '网格布局'
  readonly description = '基于网格的拖拽布局看板'

  private container: HTMLElement | null = null
  private gridStack: any = null
  private config: GridPanelConfig = this.getDefaultConfig()
  private renderedCards: RenderedCard[] = []

  init(container: HTMLElement, config: GridPanelConfig) {
    this.container = container
    this.config = { ...this.getDefaultConfig(), ...config }

    // 清空容器
    container.innerHTML = ''

    // 设置网格模式的独特容器样式
    container.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      overflow: auto;
      background: linear-gradient(135deg, #f6f8fa 0%, #e9ecef 100%);
      border-left: 4px solid #28a745;
    `
    container.setAttribute('data-renderer', 'grid')

    // 添加网格模式标识
    const rendererLabel = document.createElement('div')
    rendererLabel.innerHTML = '<i class="fa fa-th"></i> 网格布局模式'
    rendererLabel.style.cssText = `
      position: absolute;
      top: 10px;
      right: 10px;
      background: rgba(40, 167, 69, 0.9);
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

    // 创建GridStack容器
    const gridContainer = document.createElement('div')
    gridContainer.className = 'grid-stack'
    gridContainer.style.cssText = `
      width: 100%;
      height: 100%;
      position: relative;
    `
    container.appendChild(gridContainer)

    // 模拟GridStack初始化（实际项目中需要import GridStack）
    console.log('网格看板渲染器初始化', this.config)
    this.gridStack = {
      // 模拟GridStack API
      addWidget: (element: HTMLElement, options: any) => {
        console.log('添加网格项:', options)
        const gridItem = document.createElement('div')
        gridItem.className = 'grid-stack-item'
        gridItem.dataset.gsX = String(options.x || 0)
        gridItem.dataset.gsY = String(options.y || 0)
        gridItem.dataset.gsW = String(options.w || 2)
        gridItem.dataset.gsH = String(options.h || 2)
        gridItem.style.cssText = `
          position: absolute;
          left: ${(options.x || 0) * (100 / this.config.columns)}%;
          top: ${(options.y || 0) * 80}px;
          width: ${(options.w || 2) * (100 / this.config.columns)}%;
          height: ${(options.h || 2) * 80}px;
          padding: ${this.config.margin / 2}px;
          transition: ${this.config.animate ? 'all 0.3s ease' : 'none'};
        `

        const itemContent = document.createElement('div')
        itemContent.className = 'grid-stack-item-content'
        itemContent.style.cssText = `
          width: 100%;
          height: 100%;
          position: relative;
        `
        itemContent.appendChild(element)
        gridItem.appendChild(itemContent)
        gridContainer.appendChild(gridItem)

        return gridItem
      },
      removeWidget: (element: HTMLElement) => {
        if (element.parentNode) {
          element.parentNode.removeChild(element)
        }
      },
      removeAll: () => {
        gridContainer.innerHTML = ''
      }
    }
  }

  destroy() {
    if (this.container) {
      this.container.innerHTML = ''
    }
    this.gridStack = null
    this.container = null
  }

  renderPanel(renderedCards: RenderedCard[]) {
    if (!this.gridStack) return

    this.renderedCards = renderedCards

    // 清空现有内容
    this.gridStack.removeAll()

    // 渲染每个卡片
    renderedCards.forEach(card => {
      const gridItem = this.gridStack.addWidget(card.element, {
        x: card.layout.x || 0,
        y: card.layout.y || 0,
        w: card.layout.w || 2,
        h: card.layout.h || 2,
        id: card.id
      })

      // 添加点击选中事件
      card.element.addEventListener('click', e => {
        e.stopPropagation()
        this.selectCard(card.id)
      })
    })
  }

  addCard(renderedCard: RenderedCard) {
    if (!this.gridStack || !this.container) {
      console.error('GridPanelRenderer not initialized properly')
      return
    }

    this.renderedCards.push(renderedCard)
    const gridItem = this.gridStack.addWidget(renderedCard.element, {
      x: renderedCard.layout.x || 0,
      y: renderedCard.layout.y || 0,
      w: renderedCard.layout.w || 2,
      h: renderedCard.layout.h || 2,
      id: renderedCard.id
    })

    // 添加点击选中事件
    renderedCard.element.addEventListener('click', e => {
      e.stopPropagation()
      this.selectCard(renderedCard.id)
    })
  }

  removeCard(cardId: string) {
    const cardElement = this.container?.querySelector(`[data-card-id="${cardId}"]`)
    if (cardElement && this.gridStack) {
      const gridItem = cardElement.closest('.grid-stack-item')
      if (gridItem) {
        this.gridStack.removeWidget(gridItem)
      }
    }
    this.renderedCards = this.renderedCards.filter(card => card.id !== cardId)
  }

  updateConfig(config: Partial<GridPanelConfig>) {
    this.config = { ...this.config, ...config }
    console.log('网格看板配置更新:', this.config)

    // 更新网格容器样式
    if (this.container) {
      const gridContainer = this.container.querySelector('.grid-stack')
      if (gridContainer) {
        // 重新计算所有网格项的位置
        const gridItems = gridContainer.querySelectorAll('.grid-stack-item')
        gridItems.forEach((item: any) => {
          const x = parseInt(item.dataset.gsX) || 0
          const y = parseInt(item.dataset.gsY) || 0
          const w = parseInt(item.dataset.gsW) || 2
          const h = parseInt(item.dataset.gsH) || 2

          item.style.cssText = `
            position: absolute;
            left: ${x * (100 / this.config.columns)}%;
            top: ${y * 80}px;
            width: ${w * (100 / this.config.columns)}%;
            height: ${h * 80}px;
            padding: ${this.config.margin / 2}px;
            transition: ${this.config.animate ? 'all 0.3s ease' : 'none'};
          `
        })
      }
    }
  }

  getConfig(): GridPanelConfig {
    return { ...this.config }
  }

  getDefaultConfig(): GridPanelConfig {
    return {
      columns: 12,
      margin: 10,
      animate: true,
      float: false,
      removable: false,
      acceptWidgets: false
    }
  }

  getConfigSchema(): ConfigSchema {
    return {
      title: '网格布局配置',
      fields: [
        {
          key: 'columns',
          label: '列数',
          type: 'number',
          defaultValue: 12,
          min: 6,
          max: 24,
          step: 1,
          description: '网格的列数，影响卡片的布局精度'
        },
        {
          key: 'margin',
          label: '间距',
          type: 'range',
          defaultValue: 10,
          min: 0,
          max: 30,
          step: 2,
          description: '卡片之间的间距大小'
        },
        {
          key: 'animate',
          label: '动画效果',
          type: 'boolean',
          defaultValue: true,
          description: '是否启用卡片移动和调整大小的动画效果'
        },
        {
          key: 'float',
          label: '自动浮动',
          type: 'boolean',
          defaultValue: false,
          description: '是否允许卡片自动向上浮动填补空隙'
        }
      ]
    }
  }

  selectCard(cardId: string) {
    // 清除之前的选中状态
    this.clearSelection()

    // 选中指定卡片
    const cardElement = this.container?.querySelector(`[data-card-id="${cardId}"]`)
    if (cardElement) {
      const gridItem = cardElement.closest('.grid-stack-item-content') as HTMLElement
      if (gridItem) {
        gridItem.style.outline = '2px solid #1890ff'
        gridItem.style.outlineOffset = '2px'
      }
    }
  }

  clearSelection() {
    const gridItems = this.container?.querySelectorAll('.grid-stack-item-content') || []
    gridItems.forEach((item: any) => {
      item.style.outline = 'none'
      item.style.outlineOffset = '0'
    })
  }
}
