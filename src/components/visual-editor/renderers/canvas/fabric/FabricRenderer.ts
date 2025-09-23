/**
 * Fabric.js 6.7.1 核心渲染器
 * 基于最新 Fabric.js API 实现的画布渲染引擎
 */

import { Canvas, FabricObject, Rect, Circle, FabricText, Group, type TPointerEvent } from 'fabric'
import type { VisualEditorWidget } from '@/components/visual-editor/types'
import type { NodeData } from '@/components/visual-editor/renderers/base/BaseRenderer'

// HTML 元素容器，用于渲染 Vue 组件
class HtmlContainer extends FabricObject {
  htmlElement: HTMLElement | null = null

  constructor(element: HTMLElement, options: any = {}) {
    super(options)
    this.htmlElement = element
    this.set({
      selectable: true,
      evented: true,
      ...options
    })
  }

  // 渲染方法 - 将 HTML 元素定位到 Fabric 坐标
  render(ctx: CanvasRenderingContext2D) {
    if (!this.htmlElement) return

    // 获取画布的变换矩阵
    const zoom = this.canvas?.getZoom() || 1
    const vpt = this.canvas?.viewportTransform || [1, 0, 0, 1, 0, 0]

    // 计算实际位置
    const left = ((this.left || 0) + vpt[4]) * zoom
    const top = ((this.top || 0) + vpt[5]) * zoom
    const width = (this.width || 0) * zoom
    const height = (this.height || 0) * zoom

    // 设置 HTML 元素的位置和大小
    Object.assign(this.htmlElement.style, {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      zIndex: '1000',
      pointerEvents: 'auto'
    })

    // 绘制占位符边框
    ctx.save()
    ctx.strokeStyle = this.stroke || '#007bff'
    ctx.lineWidth = this.strokeWidth || 1
    ctx.setLineDash(this.strokeDashArray || [5, 5])
    ctx.strokeRect(
      -this.width! / 2,
      -this.height! / 2,
      this.width!,
      this.height!
    )
    ctx.restore()
  }
}

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
  nodeData?: NodeData
  visualEditorWidget?: VisualEditorWidget // 兼容原有数据结构
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
   * 添加节点到画布 - 支持 NodeData 和 VisualEditorWidget 两种格式
   */
  async addNode(node: NodeData | VisualEditorWidget): Promise<void> {
    if (!this.isInitialized || !this.canvas) {
      console.error('❌ Fabric 渲染器未初始化')
      throw new Error('Fabric 渲染器未初始化')
    }

    console.log(`🎯 开始添加节点到 Fabric 画布:`, node.id, node.type)

    try {
      const fabricObj = await this.createFabricObject(node)
      if (fabricObj) {
        // 设置节点元数据
        fabricObj.nodeId = node.id
        fabricObj.componentType = node.type

        // 根据数据类型设置相应的数据引用
        if (this.isNodeData(node)) {
          fabricObj.nodeData = node
        } else {
          fabricObj.visualEditorWidget = node
          // 为兼容性，也转换为 NodeData 格式
          fabricObj.nodeData = this.convertToNodeData(node)
        }

        // 添加到画布
        this.canvas.add(fabricObj)
        this.nodes.set(node.id, fabricObj)

        // 强制重新渲染
        this.canvas.renderAll()

        console.log(`✅ 节点 ${node.id} 已添加到 Fabric 画布, 当前对象总数: ${this.canvas.getObjects().length}`)
      } else {
        console.warn(`⚠️ 节点 ${node.id} 创建的 Fabric 对象为空`)
      }
    } catch (error) {
      console.error(`❌ 添加节点 ${node.id} 失败:`, error)
      throw error
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
   * 更新节点 - 支持 NodeData 和 VisualEditorWidget 两种格式
   */
  updateNode(node: NodeData | VisualEditorWidget): void {
    const fabricObj = this.nodes.get(node.id)
    if (fabricObj) {
      // 更新位置信息
      if (this.isNodeData(node)) {
        // NodeData 格式：直接使用 x, y, width, height
        fabricObj.set({
          left: node.x || 0,
          top: node.y || 0,
          width: node.width || fabricObj.width,
          height: node.height || fabricObj.height
        })
        fabricObj.nodeData = node
      } else {
        // VisualEditorWidget 格式：从 layout 中获取位置信息
        if (node.layout?.canvas) {
          fabricObj.set({
            left: node.layout.canvas.x || 0,
            top: node.layout.canvas.y || 0,
            width: node.layout.canvas.width || fabricObj.width,
            height: node.layout.canvas.height || fabricObj.height
          })
        }
        fabricObj.visualEditorWidget = node
        fabricObj.nodeData = this.convertToNodeData(node)
      }

      this.canvas?.renderAll()
    }
  }

  /**
   * 检查是否为 NodeData 格式
   */
  private isNodeData(node: NodeData | VisualEditorWidget): node is NodeData {
    return 'x' in node && 'y' in node && 'width' in node && 'height' in node
  }

  /**
   * 将 VisualEditorWidget 转换为 NodeData 格式
   */
  private convertToNodeData(widget: VisualEditorWidget): NodeData {
    const layout = widget.layout?.canvas || widget.layout?.gridstack || {}
    return {
      id: widget.id,
      type: widget.type,
      x: layout.x || 0,
      y: layout.y || 0,
      width: layout.width || 200,
      height: layout.height || 100,
      properties: widget.properties || {}
    }
  }

  /**
   * 根据节点类型创建 Fabric 对象 - 支持 NodeData 和 VisualEditorWidget 两种格式
   */
  private async createFabricObject(node: NodeData | VisualEditorWidget): Promise<FabricNode | null> {
    console.log('🎯 创建 Fabric 对象:', node.id, node.type)

    // 获取位置信息
    let x: number, y: number, width: number, height: number

    if (this.isNodeData(node)) {
      // NodeData 格式：直接使用坐标
      x = node.x || 0
      y = node.y || 0
      width = node.width || 200
      height = node.height || 100
      console.log('📐 NodeData 布局信息:', { x, y, width, height })
    } else {
      // VisualEditorWidget 格式：从 layout 中获取
      const canvasLayout = node.layout?.canvas || {}
      const gridstackLayout = node.layout?.gridstack || {}

      // 优先使用 canvas 布局，回退到 gridstack 布局，最后使用默认值
      x = canvasLayout.x ?? (gridstackLayout.x ? gridstackLayout.x * 100 : Math.random() * 400)
      y = canvasLayout.y ?? (gridstackLayout.y ? gridstackLayout.y * 80 : Math.random() * 300)
      width = canvasLayout.width ?? (gridstackLayout.w ? gridstackLayout.w * 100 : 200)
      height = canvasLayout.height ?? (gridstackLayout.h ? gridstackLayout.h * 80 : 100)
      console.log('📐 VisualEditorWidget 布局信息:', { x, y, width, height, canvasLayout, gridstackLayout })
    }

    // 根据组件类型创建不同的 Fabric 对象
    let fabricObj: FabricNode | null = null

    // 获取节点属性
    const properties = node.properties || {}

    switch (node.type) {
      case 'text':
      case 'digit-indicator':
        fabricObj = new FabricText(properties?.text || `文本-${node.id}`, {
          left: x,
          top: y,
          fontSize: properties?.fontSize || 16,
          fill: properties?.color || '#333333',
          fontFamily: properties?.fontFamily || 'Arial'
        }) as FabricNode
        break

      case 'rect':
      case 'card':
        fabricObj = new Rect({
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
        break

      case 'circle':
        fabricObj = new Circle({
          left: x,
          top: y,
          radius: Math.min(width, height) / 2,
          fill: '#e0e0e0',
          stroke: '#cccccc',
          strokeWidth: 1
        }) as FabricNode
        break

      default:
        // 默认创建有标签的矩形占位符
        fabricObj = new Rect({
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
        break
    }

    if (fabricObj) {
      console.log('✅ Fabric 对象创建成功:', {
        type: node.type,
        position: { x, y },
        size: { width, height }
      })
    } else {
      console.error('❌ Fabric 对象创建失败:', node.type)
    }

    return fabricObj
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