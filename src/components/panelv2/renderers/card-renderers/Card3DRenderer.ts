import { CardRenderer, CardData } from './CardRenderer'
import type { ConfigSchema } from '../../core/ConfigFormGenerator'

// 3D卡片渲染器配置
interface Card3DConfig {
  backgroundColor: string
  accentColor: string
  textColor: string
  rotateX: number
  rotateY: number
  perspective: number
}

// 3D卡片渲染器实现
export class Card3DRenderer implements CardRenderer {
  readonly id = '3d'
  readonly name = '3D渲染'
  readonly description = '带3D效果的立体卡片'

  private config: Card3DConfig = {
    backgroundColor: '#2c3e50',
    accentColor: '#3498db',
    textColor: '#ffffff',
    rotateX: -10,
    rotateY: 5,
    perspective: 1000
  }

  renderCard(cardData: CardData, cardSpecificConfig?: Card3DConfig): HTMLElement {
    // 使用卡片特定配置，如果没有则使用默认配置
    const config = cardSpecificConfig || this.getDefaultConfig()
    const container = document.createElement('div')
    container.className = '3d-card-container'
    container.dataset.cardId = cardData.id

    // 设置3D容器样式
    container.style.cssText = `
      width: 100%;
      height: 100%;
      perspective: ${config.perspective}px;
      cursor: pointer;
    `

    // 创建3D卡片主体
    const cardBody = document.createElement('div')
    cardBody.className = '3d-card-body'
    cardBody.style.cssText = `
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, ${config.backgroundColor} 0%, ${config.accentColor} 100%);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 12px;
      box-shadow: 
        0 10px 30px rgba(0,0,0,0.3),
        inset 0 1px 0 rgba(255,255,255,0.1);
      transform: rotateX(${config.rotateX}deg) rotateY(${config.rotateY}deg);
      transform-style: preserve-3d;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    `

    // 创建光泽效果
    const gloss = document.createElement('div')
    gloss.className = 'card-gloss'
    gloss.style.cssText = `
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.6s ease;
    `

    // 创建标题元素
    const titleElement = document.createElement('div')
    titleElement.className = 'card-3d-title'
    titleElement.textContent = cardData.title
    titleElement.style.cssText = `
      font-size: 12px;
      color: ${config.textColor};
      opacity: 0.9;
      font-weight: 500;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    `

    // 创建值元素
    const valueElement = document.createElement('div')
    valueElement.className = 'card-3d-value'
    valueElement.textContent = String(cardData.value)
    valueElement.style.cssText = `
      font-size: 28px;
      color: ${config.textColor};
      font-weight: bold;
      text-align: center;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      transform: translateZ(10px);
    `

    // 创建类型指示器
    const typeIndicator = document.createElement('div')
    typeIndicator.className = 'card-3d-type'
    typeIndicator.textContent = `${cardData.type} • 3D`
    typeIndicator.style.cssText = `
      position: absolute;
      bottom: 8px;
      right: 8px;
      font-size: 8px;
      color: ${config.textColor};
      opacity: 0.6;
      background: rgba(0,0,0,0.2);
      padding: 2px 6px;
      border-radius: 2px;
      font-family: monospace;
      text-transform: uppercase;
    `

    // 创建装饰性几何图形
    const decoration = document.createElement('div')
    decoration.className = 'card-3d-decoration'
    decoration.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      width: 20px;
      height: 20px;
      border: 2px solid ${config.textColor};
      border-radius: 50%;
      opacity: 0.3;
      transform: translateZ(5px);
    `

    // 组装元素
    cardBody.appendChild(gloss)
    cardBody.appendChild(decoration)
    cardBody.appendChild(titleElement)
    cardBody.appendChild(valueElement)
    cardBody.appendChild(typeIndicator)
    container.appendChild(cardBody)

    // 添加交互效果
    container.addEventListener('mouseenter', () => {
      cardBody.style.transform = `rotateX(0deg) rotateY(0deg) translateZ(10px)`
      cardBody.style.boxShadow = `
        0 20px 40px rgba(0,0,0,0.4),
        inset 0 1px 0 rgba(255,255,255,0.2)
      `
      gloss.style.left = '100%'
    })

    container.addEventListener('mouseleave', () => {
      cardBody.style.transform = `rotateX(${config.rotateX}deg) rotateY(${config.rotateY}deg)`
      cardBody.style.boxShadow = `
        0 10px 30px rgba(0,0,0,0.3),
        inset 0 1px 0 rgba(255,255,255,0.1)
      `
      gloss.style.left = '-100%'
    })

    return container
  }

  getDefaultConfig(): Card3DConfig {
    return {
      backgroundColor: '#2c3e50',
      accentColor: '#3498db',
      textColor: '#ffffff',
      rotateX: -10,
      rotateY: 5,
      perspective: 1000
    }
  }

  getConfigSchema(cardData?: CardData): ConfigSchema {
    return {
      title: `3D卡片配置${cardData ? ` - ${cardData.title}` : ''}`,
      fields: [
        {
          key: 'backgroundColor',
          label: '背景颜色',
          type: 'color',
          defaultValue: '#2c3e50',
          description: '卡片的背景颜色'
        },
        {
          key: 'accentColor',
          label: '强调色',
          type: 'color',
          defaultValue: '#3498db',
          description: '卡片的强调颜色（用于渐变）'
        },
        {
          key: 'textColor',
          label: '文字颜色',
          type: 'color',
          defaultValue: '#ffffff',
          description: '卡片文字的颜色'
        },
        {
          key: 'rotateX',
          label: 'X轴旋转',
          type: 'range',
          defaultValue: -10,
          min: -30,
          max: 30,
          step: 1,
          description: '卡片绕X轴的旋转角度'
        },
        {
          key: 'rotateY',
          label: 'Y轴旋转',
          type: 'range',
          defaultValue: 5,
          min: -30,
          max: 30,
          step: 1,
          description: '卡片绕Y轴的旋转角度'
        },
        {
          key: 'perspective',
          label: '透视距离',
          type: 'number',
          defaultValue: 1000,
          min: 500,
          max: 2000,
          step: 100,
          description: '3D透视效果的距离'
        }
      ]
    }
  }
}
