/**
 * Fabric.js 6.7.1 核心渲染器
 * 基于最新 Fabric.js API 实现的画布渲染引擎
 */

import { Canvas, FabricObject, Rect, Circle, FabricText, Group, type TPointerEvent } from 'fabric'
import type { VisualEditorWidget } from '@/components/visual-editor/types'

export interface FabricRendererConfig {
  width?: number
  height?: number
  backgroundColor?: string
  selection?: boolean
  preserveObjectStacking?: boolean
  renderOnAddRemove?: boolean
  skipTargetFind?: boolean
  interactive?: boolean
}

export interface FabricNode extends FabricObject {
  nodeId?: string
  componentType?: string
  nodeData?: VisualEditorWidget
}

export class FabricRenderer {
  private canvas: Canvas | null = null
  private container: HTMLElement | null = null
  private config: FabricRendererConfig
  private nodes: Map<string, FabricNode> = new Map()
  private isInitialized = false

  constructor(config: FabricRendererConfig = {}) {
    this.config = {
      width: 1200,
      height: 800,
      backgroundColor: '#f5f5f5',
      selection: true,
      preserveObjectStacking: true,
      renderOnAddRemove: true,
      skipTargetFind: false,
      interactive: true,
      ...config
    }
  }

  /**
   * 初始化 Fabric 画布
   */
  async init(container: HTMLElement): Promise<void> {
    try {
      this.container = container

      // 创建 canvas 元素
      const canvasElement = document.createElement('canvas')
      canvasElement.id = 'fabric-canvas'
      canvasElement.width = this.config.width!
      canvasElement.height = this.config.height!

      // 清空容器并添加 canvas
      container.innerHTML = ''
      container.appendChild(canvasElement)

      // 初始化 Fabric Canvas (6.7.1 语法)
      this.canvas = new Canvas(canvasElement, {
        width: this.config.width,
        height: this.config.height,
        backgroundColor: this.config.backgroundColor,
        selection: this.config.selection,
        preserveObjectStacking: this.config.preserveObjectStacking,
        renderOnAddRemove: this.config.renderOnAddRemove,
        skipTargetFind: this.config.skipTargetFind,
        interactive: this.config.interactive
      })

      // 绑定事件
      this.bindEvents()

      this.isInitialized = true
      console.log('🎨 Fabric.js 6.7.1 渲染器初始化完成')

    } catch (error) {
      console.error('❌ Fabric 渲染器初始化失败:', error)
      throw new Error(`Fabric 渲染器初始化失败: ${error}`)
    }
  }

  /**
   * 绑定 Fabric 事件
   */
  private bindEvents(): void {
    if (!this.canvas) return

    // 对象选择事件
    this.canvas.on('selection:created', (e) => {
      const selected = e.selected?.[0] as FabricNode
      if (selected?.nodeId) {
        this.onNodeSelect?.(selected.nodeId)
      }
    })

    this.canvas.on('selection:updated', (e) => {
      const selected = e.selected?.[0] as FabricNode
      if (selected?.nodeId) {
        this.onNodeSelect?.(selected.nodeId)
      }
    })

    this.canvas.on('selection:cleared', () => {
      this.onNodeSelect?.('')
    })

    // 对象移动事件
    this.canvas.on('object:moving', (e) => {
      const obj = e.target as FabricNode
      if (obj?.nodeId) {
        this.onNodeMove?.(obj.nodeId, obj.left || 0, obj.top || 0)
      }
    })

    // 画布点击事件
    this.canvas.on('mouse:down', (e: TPointerEvent) => {
      if (!e.target) {
        this.onCanvasClick?.(e.e as MouseEvent)
      }
    })

    // 右键菜单事件
    this.canvas.on('mouse:down', (e: TPointerEvent) => {
      if (e.e.button === 2) { // 右键
        const obj = e.target as FabricNode
        if (obj?.nodeId) {
          this.onNodeContextMenu?.(obj.nodeId, e.e as MouseEvent)
        }
      }
    })
  }

  /**
   * 添加节点到画布
   */
  async addNode(node: VisualEditorWidget): Promise<void> {
    if (!this.isInitialized || !this.canvas) {
      throw new Error('Fabric 渲染器未初始化')
    }

    try {
      const fabricObj = await this.createFabricObject(node)
      if (fabricObj) {
        fabricObj.nodeId = node.id
        fabricObj.componentType = node.type
        fabricObj.nodeData = node

        this.canvas.add(fabricObj)
        this.nodes.set(node.id, fabricObj)

        console.log(`✅ 节点 ${node.id} 已添加到 Fabric 画布`)
      }
    } catch (error) {
      console.error(`❌ 添加节点 ${node.id} 失败:`, error)
    }
  }

  /**
   * 移除节点
   */
  removeNode(nodeId: string): void {
    const fabricObj = this.nodes.get(nodeId)
    if (fabricObj && this.canvas) {
      this.canvas.remove(fabricObj)
      this.nodes.delete(nodeId)
      console.log(`✅ 节点 ${nodeId} 已从 Fabric 画布移除`)
    }
  }

  /**
   * 更新节点
   */
  updateNode(node: VisualEditorWidget): void {
    const fabricObj = this.nodes.get(node.id)
    if (fabricObj) {
      // 更新位置
      if (node.layout?.canvas) {
        fabricObj.set({
          left: node.layout.canvas.x || 0,
          top: node.layout.canvas.y || 0,
          width: node.layout.canvas.width || fabricObj.width,
          height: node.layout.canvas.height || fabricObj.height
        })
      }

      // 更新其他属性
      fabricObj.nodeData = node
      this.canvas?.renderAll()
    }
  }

  /**
   * 根据节点类型创建 Fabric 对象
   */
  private async createFabricObject(node: VisualEditorWidget): Promise<FabricNode | null> {
    const { x = 0, y = 0, width = 200, height = 100 } = node.layout?.canvas || {}

    // 根据组件类型创建不同的 Fabric 对象
    switch (node.type) {
      case 'text':
      case 'digit-indicator':
        return new FabricText(node.properties?.text || '文本', {
          left: x,
          top: y,
          fontSize: 16,
          fill: '#333333',
          fontFamily: 'Arial'
        }) as FabricNode

      case 'rect':
      case 'card':
        return new Rect({
          left: x,
          top: y,
          width: width,
          height: height,
          fill: '#e0e0e0',
          stroke: '#cccccc',
          strokeWidth: 1,
          rx: 4,
          ry: 4
        }) as FabricNode

      case 'circle':
        return new Circle({
          left: x,
          top: y,
          radius: Math.min(width, height) / 2,
          fill: '#e0e0e0',
          stroke: '#cccccc',
          strokeWidth: 1
        }) as FabricNode

      default:
        // 默认创建矩形占位符
        return new Rect({
          left: x,
          top: y,
          width: width,
          height: height,
          fill: 'rgba(0, 123, 255, 0.1)',
          stroke: '#007bff',
          strokeWidth: 2,
          strokeDashArray: [5, 5],
          rx: 4,
          ry: 4
        }) as FabricNode
    }
  }

  /**
   * 清空画布
   */
  clear(): void {
    if (this.canvas) {
      this.canvas.clear()
      this.nodes.clear()
    }
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    if (this.canvas) {
      this.canvas.dispose()
      this.canvas = null
    }
    this.nodes.clear()
    this.isInitialized = false

    if (this.container) {
      this.container.innerHTML = ''
    }
  }

  /**
   * 获取画布尺寸
   */
  getSize(): { width: number; height: number } {
    return {
      width: this.canvas?.width || 0,
      height: this.canvas?.height || 0
    }
  }

  /**
   * 设置画布尺寸
   */
  setSize(width: number, height: number): void {
    if (this.canvas) {
      this.canvas.setDimensions({ width, height })
    }
  }

  /**
   * 获取所有节点
   */
  getNodes(): Map<string, FabricNode> {
    return this.nodes
  }

  /**
   * 事件回调函数
   */
  onNodeSelect?: (nodeId: string) => void
  onNodeMove?: (nodeId: string, x: number, y: number) => void
  onCanvasClick?: (event: MouseEvent) => void
  onNodeContextMenu?: (nodeId: string, event: MouseEvent) => void
}

export default FabricRenderer