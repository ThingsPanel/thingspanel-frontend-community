/**
 * Canvas节点渲染器
 *
 * 功能概述：
 * 1. 负责将不同类型的节点渲染到Fabric.js Canvas上
 * 2. 支持多种节点类型：图表、表格、指示器等
 * 3. 提供节点模板和自定义渲染能力
 * 4. 实现节点的实时预览和配置更新
 * 5. 集成主题系统和样式定制
 *
 * 设计原则：
 * - 可扩展的节点类型系统
 * - 高性能的渲染和更新
 * - 与Fabric.js对象模型深度集成
 * - 支持复杂的节点内容和交互
 * - 类型安全的渲染接口
 *
 * @author Claude
 * @version 1.0.0
 * @date 2024-12-17
 */

import { fabric } from 'fabric'
import type {
  EditorNodeConfiguration,
  CanvasNode,
  FabricCanvasConfig
} from './fabric-canvas-engine'
import type { WidgetConfiguration } from '../config-engine/types'

/**
 * 节点渲染器接口
 */
export interface NodeRenderer {
  type: string                                    // 节点类型
  render(config: EditorNodeConfiguration): Promise<CanvasNode>  // 渲染方法
  update(node: CanvasNode, config: EditorNodeConfiguration): Promise<void>  // 更新方法
  getPreview?(): fabric.Object                   // 预览方法（可选）
}

/**
 * 节点样式配置
 */
export interface NodeStyle {
  backgroundColor: string
  borderColor: string
  borderWidth: number
  borderRadius: number
  shadowColor?: string
  shadowBlur?: number
  shadowOffset?: { x: number; y: number }
  opacity: number
}

/**
 * 文本样式配置
 */
export interface TextStyle {
  fontFamily: string
  fontSize: number
  fontWeight: 'normal' | 'bold' | number
  color: string
  textAlign: 'left' | 'center' | 'right'
  lineHeight: number
}

/**
 * 节点主题配置
 */
export interface NodeTheme {
  primary: string
  secondary: string
  success: string
  warning: string
  error: string
  info: string
  text: string
  background: string
  border: string
  shadow: string
}

/**
 * 基础节点渲染器
 * 提供通用的节点渲染功能和样式处理
 */
export abstract class BaseNodeRenderer implements NodeRenderer {
  abstract type: string

  protected defaultStyle: NodeStyle = {
    backgroundColor: '#ffffff',
    borderColor: '#e1e5e9',
    borderWidth: 1,
    borderRadius: 4,
    opacity: 1
  }

  protected defaultTextStyle: TextStyle = {
    fontFamily: 'Arial, sans-serif',
    fontSize: 14,
    fontWeight: 'normal',
    color: '#333333',
    textAlign: 'left',
    lineHeight: 1.4
  }

  protected theme: NodeTheme = {
    primary: '#1890ff',
    secondary: '#f0f0f0',
    success: '#52c41a',
    warning: '#faad14',
    error: '#ff4d4f',
    info: '#1890ff',
    text: '#333333',
    background: '#ffffff',
    border: '#e1e5e9',
    shadow: 'rgba(0, 0, 0, 0.1)'
  }

  /**
   * 渲染节点
   */
  async render(config: EditorNodeConfiguration): Promise<CanvasNode> {
    const { size, position, metadata } = config

    // 创建节点容器
    const elements = await this.createNodeElements(config)

    // 创建节点组
    const nodeGroup = new fabric.Group(elements, {
      left: position.x,
      top: position.y,
      width: size.width,
      height: size.height,
      subTargetCheck: true
    }) as CanvasNode

    // 设置节点属性
    this.setupNodeProperties(nodeGroup, config)

    return nodeGroup
  }

  /**
   * 更新节点
   */
  async update(node: CanvasNode, config: EditorNodeConfiguration): Promise<void> {
    // 更新位置和尺寸
    node.set({
      left: config.position.x,
      top: config.position.y,
      width: config.size.width,
      height: config.size.height
    })

    // 更新配置
    node.nodeConfig = config

    // 重新渲染内容（如果需要）
    await this.updateNodeContent(node, config)
  }

  /**
   * 创建节点元素（抽象方法）
   */
  protected abstract createNodeElements(config: EditorNodeConfiguration): Promise<fabric.Object[]>

  /**
   * 更新节点内容（抽象方法）
   */
  protected abstract updateNodeContent(node: CanvasNode, config: EditorNodeConfiguration): Promise<void>

  /**
   * 设置节点属性
   */
  protected setupNodeProperties(node: CanvasNode, config: EditorNodeConfiguration): void {
    node.nodeId = config.id
    node.nodeType = config.type
    node.nodeConfig = config
    node.isCanvasNode = true

    // 设置交互属性
    node.set({
      hasControls: true,
      hasBorders: true,
      lockRotation: false,
      lockScalingFlip: true,
      cornerSize: 8,
      cornerColor: this.theme.primary,
      borderColor: this.theme.primary,
      transparentCorners: false,
      cornerStyle: 'circle'
    })
  }

  /**
   * 创建背景元素
   */
  protected createBackground(width: number, height: number, style: Partial<NodeStyle> = {}): fabric.Rect {
    const finalStyle = { ...this.defaultStyle, ...style }

    return new fabric.Rect({
      width,
      height,
      fill: finalStyle.backgroundColor,
      stroke: finalStyle.borderColor,
      strokeWidth: finalStyle.borderWidth,
      rx: finalStyle.borderRadius,
      ry: finalStyle.borderRadius,
      opacity: finalStyle.opacity,
      shadow: finalStyle.shadowColor ? new fabric.Shadow({
        color: finalStyle.shadowColor,
        blur: finalStyle.shadowBlur || 4,
        offsetX: finalStyle.shadowOffset?.x || 0,
        offsetY: finalStyle.shadowOffset?.y || 2
      }) : undefined
    })
  }

  /**
   * 创建文本元素
   */
  protected createText(
    text: string,
    x: number,
    y: number,
    maxWidth?: number,
    style: Partial<TextStyle> = {}
  ): fabric.Text {
    const finalStyle = { ...this.defaultTextStyle, ...style }

    return new fabric.Text(text, {
      left: x,
      top: y,
      fontSize: finalStyle.fontSize,
      fontFamily: finalStyle.fontFamily,
      fontWeight: finalStyle.fontWeight,
      fill: finalStyle.color,
      textAlign: finalStyle.textAlign,
      lineHeight: finalStyle.lineHeight,
      width: maxWidth,
      selectable: false,
      evented: false
    })
  }

  /**
   * 创建图标元素
   */
  protected createIcon(
    iconPath: string,
    x: number,
    y: number,
    size: number,
    color: string = this.theme.text
  ): fabric.Path {
    return new fabric.Path(iconPath, {
      left: x,
      top: y,
      fill: color,
      scaleX: size / 24, // 假设图标原始大小为24x24
      scaleY: size / 24,
      selectable: false,
      evented: false
    })
  }

  /**
   * 创建进度条元素
   */
  protected createProgressBar(
    x: number,
    y: number,
    width: number,
    height: number,
    progress: number,
    color: string = this.theme.primary
  ): fabric.Group {
    const background = new fabric.Rect({
      width,
      height,
      fill: this.theme.secondary,
      rx: height / 2,
      ry: height / 2
    })

    const progressWidth = Math.max(0, Math.min(width, width * (progress / 100)))
    const progressBar = new fabric.Rect({
      width: progressWidth,
      height,
      fill: color,
      rx: height / 2,
      ry: height / 2
    })

    return new fabric.Group([background, progressBar], {
      left: x,
      top: y,
      selectable: false,
      evented: false
    })
  }
}

/**
 * 图表节点渲染器
 */
export class ChartNodeRenderer extends BaseNodeRenderer {
  type = 'chart'

  protected async createNodeElements(config: EditorNodeConfiguration): Promise<fabric.Object[]> {
    const { size, metadata, configuration } = config
    const elements: fabric.Object[] = []

    // 背景
    const background = this.createBackground(size.width, size.height)
    elements.push(background)

    // 标题
    const title = this.createText(
      metadata.title,
      12,
      12,
      size.width - 24,
      { fontSize: 16, fontWeight: 'bold' }
    )
    elements.push(title)

    // 图表类型标签
    const chartType = configuration?.chartType || 'line'
    const typeLabel = this.createText(
      `${chartType}图表`,
      12,
      size.height - 24,
      undefined,
      { fontSize: 10, color: this.theme.text }
    )
    elements.push(typeLabel)

    // 模拟图表内容
    const chartArea = this.createChartPreview(
      12,
      40,
      size.width - 24,
      size.height - 80,
      chartType
    )
    elements.push(...chartArea)

    return elements
  }

  protected async updateNodeContent(node: CanvasNode, config: EditorNodeConfiguration): Promise<void> {
    // 图表节点的内容更新逻辑
    // 这里可以根据配置更新图表显示
  }

  /**
   * 创建图表预览
   */
  private createChartPreview(x: number, y: number, width: number, height: number, type: string): fabric.Object[] {
    const elements: fabric.Object[] = []

    switch (type) {
      case 'line':
        elements.push(...this.createLineChartPreview(x, y, width, height))
        break
      case 'bar':
        elements.push(...this.createBarChartPreview(x, y, width, height))
        break
      case 'pie':
        elements.push(...this.createPieChartPreview(x, y, width, height))
        break
      default:
        elements.push(this.createPlaceholder(x, y, width, height, '图表'))
    }

    return elements
  }

  private createLineChartPreview(x: number, y: number, width: number, height: number): fabric.Object[] {
    const elements: fabric.Object[] = []

    // 创建坐标轴
    const xAxis = new fabric.Line([x, y + height, x + width, y + height], {
      stroke: this.theme.border,
      strokeWidth: 1,
      selectable: false,
      evented: false
    })
    elements.push(xAxis)

    const yAxis = new fabric.Line([x, y, x, y + height], {
      stroke: this.theme.border,
      strokeWidth: 1,
      selectable: false,
      evented: false
    })
    elements.push(yAxis)

    // 创建折线
    const points = [
      x + width * 0.1, y + height * 0.8,
      x + width * 0.3, y + height * 0.5,
      x + width * 0.5, y + height * 0.3,
      x + width * 0.7, y + height * 0.6,
      x + width * 0.9, y + height * 0.2
    ]

    const line = new fabric.Polyline(
      points.reduce((acc, val, i) => {
        if (i % 2 === 0) {
          acc.push({ x: val, y: points[i + 1] })
        }
        return acc
      }, [] as fabric.Point[]),
      {
        fill: 'transparent',
        stroke: this.theme.primary,
        strokeWidth: 2,
        selectable: false,
        evented: false
      }
    )
    elements.push(line)

    return elements
  }

  private createBarChartPreview(x: number, y: number, width: number, height: number): fabric.Object[] {
    const elements: fabric.Object[] = []
    const barCount = 5
    const barWidth = (width - 20) / barCount
    const barSpacing = 4

    for (let i = 0; i < barCount; i++) {
      const barHeight = height * (0.3 + Math.random() * 0.6)
      const bar = new fabric.Rect({
        left: x + 10 + i * barWidth + barSpacing / 2,
        top: y + height - barHeight,
        width: barWidth - barSpacing,
        height: barHeight,
        fill: this.theme.primary,
        selectable: false,
        evented: false
      })
      elements.push(bar)
    }

    return elements
  }

  private createPieChartPreview(x: number, y: number, width: number, height: number): fabric.Object[] {
    const elements: fabric.Object[] = []
    const centerX = x + width / 2
    const centerY = y + height / 2
    const radius = Math.min(width, height) / 3

    const colors = [this.theme.primary, this.theme.success, this.theme.warning, this.theme.error]
    const segments = [30, 25, 25, 20] // 百分比

    let startAngle = 0
    segments.forEach((percent, i) => {
      const angle = (percent / 100) * 360
      const slice = new fabric.Circle({
        left: centerX - radius,
        top: centerY - radius,
        radius,
        fill: colors[i % colors.length],
        startAngle: startAngle * Math.PI / 180,
        endAngle: (startAngle + angle) * Math.PI / 180,
        selectable: false,
        evented: false
      })
      elements.push(slice)
      startAngle += angle
    })

    return elements
  }

  private createPlaceholder(x: number, y: number, width: number, height: number, text: string): fabric.Rect {
    const placeholder = new fabric.Rect({
      left: x,
      top: y,
      width,
      height,
      fill: this.theme.secondary,
      stroke: this.theme.border,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false
    })

    return placeholder
  }
}

/**
 * 表格节点渲染器
 */
export class TableNodeRenderer extends BaseNodeRenderer {
  type = 'table'

  protected async createNodeElements(config: EditorNodeConfiguration): Promise<fabric.Object[]> {
    const { size, metadata, configuration } = config
    const elements: fabric.Object[] = []

    // 背景
    const background = this.createBackground(size.width, size.height)
    elements.push(background)

    // 标题
    const title = this.createText(
      metadata.title,
      12,
      12,
      size.width - 24,
      { fontSize: 16, fontWeight: 'bold' }
    )
    elements.push(title)

    // 表格内容
    const tableElements = this.createTablePreview(
      12,
      40,
      size.width - 24,
      size.height - 52
    )
    elements.push(...tableElements)

    return elements
  }

  protected async updateNodeContent(node: CanvasNode, config: EditorNodeConfiguration): Promise<void> {
    // 表格节点的内容更新逻辑
  }

  private createTablePreview(x: number, y: number, width: number, height: number): fabric.Object[] {
    const elements: fabric.Object[] = []
    const rowHeight = 24
    const colCount = 3
    const rowCount = Math.floor(height / rowHeight)

    // 表头
    const headerBg = new fabric.Rect({
      left: x,
      top: y,
      width,
      height: rowHeight,
      fill: this.theme.secondary,
      stroke: this.theme.border,
      strokeWidth: 1,
      selectable: false,
      evented: false
    })
    elements.push(headerBg)

    // 表头文本
    const headers = ['列1', '列2', '列3']
    headers.forEach((header, i) => {
      const headerText = this.createText(
        header,
        x + (width / colCount) * i + 8,
        y + 6,
        width / colCount - 16,
        { fontSize: 12, fontWeight: 'bold' }
      )
      elements.push(headerText)
    })

    // 表格行
    for (let row = 1; row < rowCount; row++) {
      const rowY = y + row * rowHeight

      // 行背景
      const rowBg = new fabric.Rect({
        left: x,
        top: rowY,
        width,
        height: rowHeight,
        fill: row % 2 === 0 ? this.theme.background : 'transparent',
        stroke: this.theme.border,
        strokeWidth: 1,
        selectable: false,
        evented: false
      })
      elements.push(rowBg)

      // 单元格文本
      for (let col = 0; col < colCount; col++) {
        const cellText = this.createText(
          `数据${row}-${col + 1}`,
          x + (width / colCount) * col + 8,
          rowY + 6,
          width / colCount - 16,
          { fontSize: 11 }
        )
        elements.push(cellText)
      }
    }

    return elements
  }
}

/**
 * 指示器节点渲染器
 */
export class IndicatorNodeRenderer extends BaseNodeRenderer {
  type = 'indicator'

  protected async createNodeElements(config: EditorNodeConfiguration): Promise<fabric.Object[]> {
    const { size, metadata, configuration } = config
    const elements: fabric.Object[] = []

    // 背景
    const background = this.createBackground(size.width, size.height)
    elements.push(background)

    // 标题
    const title = this.createText(
      metadata.title,
      12,
      12,
      size.width - 24,
      { fontSize: 14, fontWeight: 'bold' }
    )
    elements.push(title)

    // 数值显示
    const value = configuration?.value || '0'
    const unit = configuration?.unit || ''
    const valueText = this.createText(
      `${value}${unit}`,
      12,
      size.height / 2 - 10,
      size.width - 24,
      { fontSize: 24, fontWeight: 'bold', color: this.theme.primary, textAlign: 'center' }
    )
    elements.push(valueText)

    // 状态指示器
    const status = configuration?.status || 'normal'
    const statusColor = this.getStatusColor(status)
    const statusIndicator = new fabric.Circle({
      left: size.width - 24,
      top: 12,
      radius: 6,
      fill: statusColor,
      selectable: false,
      evented: false
    })
    elements.push(statusIndicator)

    return elements
  }

  protected async updateNodeContent(node: CanvasNode, config: EditorNodeConfiguration): Promise<void> {
    // 指示器节点的内容更新逻辑
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'success':
        return this.theme.success
      case 'warning':
        return this.theme.warning
      case 'error':
        return this.theme.error
      case 'info':
        return this.theme.info
      default:
        return this.theme.text
    }
  }
}

/**
 * 节点渲染器管理器
 */
export class NodeRendererManager {
  private renderers: Map<string, NodeRenderer> = new Map()

  constructor() {
    // 注册默认渲染器
    this.registerRenderer(new ChartNodeRenderer())
    this.registerRenderer(new TableNodeRenderer())
    this.registerRenderer(new IndicatorNodeRenderer())
  }

  /**
   * 注册节点渲染器
   */
  registerRenderer(renderer: NodeRenderer): void {
    this.renderers.set(renderer.type, renderer)
  }

  /**
   * 获取节点渲染器
   */
  getRenderer(type: string): NodeRenderer | undefined {
    return this.renderers.get(type)
  }

  /**
   * 渲染节点
   */
  async renderNode(config: EditorNodeConfiguration): Promise<CanvasNode> {
    const renderer = this.getRenderer(config.type)
    if (!renderer) {
      throw new Error(`未找到类型为 ${config.type} 的节点渲染器`)
    }

    return await renderer.render(config)
  }

  /**
   * 更新节点
   */
  async updateNode(node: CanvasNode, config: EditorNodeConfiguration): Promise<void> {
    const renderer = this.getRenderer(config.type)
    if (!renderer) {
      throw new Error(`未找到类型为 ${config.type} 的节点渲染器`)
    }

    await renderer.update(node, config)
  }

  /**
   * 获取所有支持的节点类型
   */
  getSupportedTypes(): string[] {
    return Array.from(this.renderers.keys())
  }

  /**
   * 获取节点预览
   */
  getNodePreview(type: string): fabric.Object | null {
    const renderer = this.getRenderer(type)
    return renderer?.getPreview?.() || null
  }
}

// 导出
export type {
  NodeRenderer,
  NodeStyle,
  TextStyle,
  NodeTheme
}

export {
  BaseNodeRenderer,
  ChartNodeRenderer,
  TableNodeRenderer,
  IndicatorNodeRenderer,
  NodeRendererManager
}