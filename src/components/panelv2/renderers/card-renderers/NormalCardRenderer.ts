import { CardRenderer, CardData } from './CardRenderer'
import type { ConfigSchema } from '../../core/ConfigFormGenerator'

// 普通卡片渲染器配置
interface NormalCardConfig {
  backgroundColor: string
  textColor: string
  borderRadius: number
  fontSize: number
}

// 普通卡片渲染器实现
export class NormalCardRenderer implements CardRenderer {
  readonly id = 'normal'
  readonly name = '普通渲染'
  readonly description = '简单的div+文字显示'

  private config: NormalCardConfig = {
    backgroundColor: '#ffffff',
    textColor: '#333333',
    borderRadius: 6,
    fontSize: 14
  }

  renderCard(cardData: CardData, cardSpecificConfig?: NormalCardConfig): HTMLElement {
    // 使用卡片特定配置，如果没有则使用默认配置
    const config = cardSpecificConfig || this.getDefaultConfig()
    const container = document.createElement('div')
    container.className = 'normal-card-container'
    container.dataset.cardId = cardData.id

    // 设置基本样式
    container.style.cssText = `
      width: 100%;
      height: 100%;
      background: ${config.backgroundColor};
      border: 1px solid #e8e8e8;
      border-radius: ${config.borderRadius}px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: all 0.2s ease;
      cursor: pointer;
    `

    // 创建标题元素
    const titleElement = document.createElement('div')
    titleElement.className = 'card-title'
    titleElement.textContent = cardData.title
    titleElement.style.cssText = `
      font-size: ${config.fontSize - 2}px;
      color: ${config.textColor};
      opacity: 0.8;
      font-weight: 500;
      text-align: center;
      margin-bottom: 4px;
    `

    // 创建值元素
    const valueElement = document.createElement('div')
    valueElement.className = 'card-value'
    valueElement.textContent = String(cardData.value)
    valueElement.style.cssText = `
      font-size: ${config.fontSize + 8}px;
      color: ${config.textColor};
      font-weight: bold;
      text-align: center;
    `

    // 创建类型指示器
    const typeIndicator = document.createElement('div')
    typeIndicator.className = 'card-type-indicator'
    typeIndicator.textContent = cardData.type
    typeIndicator.style.cssText = `
      position: absolute;
      bottom: 4px;
      right: 6px;
      font-size: 10px;
      color: #999;
      background: rgba(0,0,0,0.05);
      padding: 2px 6px;
      border-radius: 2px;
      font-family: monospace;
    `

    // 组装元素
    container.appendChild(titleElement)
    container.appendChild(valueElement)
    container.appendChild(typeIndicator)

    // 添加悬停效果
    container.addEventListener('mouseenter', () => {
      container.style.transform = 'translateY(-2px)'
      container.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
    })

    container.addEventListener('mouseleave', () => {
      container.style.transform = 'translateY(0)'
      container.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'
    })

    return container
  }

  getDefaultConfig(): NormalCardConfig {
    return {
      backgroundColor: '#ffffff',
      textColor: '#333333',
      borderRadius: 6,
      fontSize: 14
    }
  }

  getConfigSchema(cardData?: CardData): ConfigSchema {
    return {
      title: `普通卡片配置${cardData ? ` - ${cardData.title}` : ''}`,
      fields: [
        {
          key: 'backgroundColor',
          label: '背景颜色',
          type: 'color',
          defaultValue: '#ffffff',
          description: '卡片的背景颜色'
        },
        {
          key: 'textColor',
          label: '文字颜色',
          type: 'color',
          defaultValue: '#333333',
          description: '卡片文字的颜色'
        },
        {
          key: 'borderRadius',
          label: '圆角大小',
          type: 'range',
          defaultValue: 6,
          min: 0,
          max: 20,
          step: 1,
          description: '卡片边框的圆角程度'
        },
        {
          key: 'fontSize',
          label: '字体大小',
          type: 'number',
          defaultValue: 14,
          min: 10,
          max: 24,
          step: 1,
          description: '卡片文字的字体大小'
        }
      ]
    }
  }
}
