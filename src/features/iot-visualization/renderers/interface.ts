/**
 * 渲染器接口定义（契约）
 * 定义所有渲染器必须实现的接口，实现依赖倒置
 */

import type { RenderTree, ICanvasNode } from '../noyau/types'

/**
 * 渲染器类型
 */
export type RendererType = 'vue' | 'canvas' | 'webgl'

/**
 * 渲染器接口
 * 所有渲染器都必须实现此接口
 */
export interface IRenderer {
  /**
   * 获取渲染器类型
   */
  getType(): RendererType

  /**
   * 挂载渲染器到容器
   * @param container 容器元素
   * @param renderTree 渲染树
   */
  mount(container: HTMLElement, renderTree: RenderTree): Promise<void>

  /**
   * 更新渲染树
   * @param renderTree 新的渲染树
   */
  update(renderTree: RenderTree): Promise<void>

  /**
   * 更新单个节点
   * @param node 要更新的节点
   */
  updateNode(node: ICanvasNode): Promise<void>

  /**
   * 卸载渲染器
   */
  unmount(): Promise<void>

  /**
   * 获取渲染器元数据
   */
  getMetadata(): RendererMetadata
}

/**
 * 渲染器元数据
 */
export interface RendererMetadata {
  /** 渲染器类型 */
  type: RendererType

  /** 显示名称 */
  name: string

  /** 描述 */
  description: string

  /** 图标 */
  icon?: string

  /** 版本 */
  version: string

  /** 支持的特性 */
  features: {
    /** 是否支持拖拽 */
    draggable: boolean
    /** 是否支持缩放 */
    resizable: boolean
    /** 是否支持旋转 */
    rotatable: boolean
    /** 是否支持选择 */
    selectable: boolean
    /** 是否支持多选 */
    multiSelect: boolean
  }

  /** 性能特征 */
  performance: {
    /** 最佳节点数量 */
    optimalNodeCount: number
    /** 最大节点数量 */
    maxNodeCount: number
  }
}

/**
 * 渲染器配置
 */
export interface RendererConfig {
  /** 是否启用网格 */
  showGrid?: boolean

  /** 网格大小 */
  gridSize?: number

  /** 是否吸附网格 */
  snapToGrid?: boolean

  /** 是否启用辅助线 */
  showGuides?: boolean

  /** 是否启用标尺 */
  showRuler?: boolean

  /** 缩放级别 */
  zoom?: number

  /** 是否启用性能模式 */
  performanceMode?: boolean
}

/**
 * 渲染器事件
 */
export interface RendererEvents {
  /** 节点被点击 */
  onNodeClick?: (nodeId: string, event: MouseEvent) => void

  /** 节点被双击 */
  onNodeDoubleClick?: (nodeId: string, event: MouseEvent) => void

  /** 节点被拖拽 */
  onNodeDrag?: (nodeId: string, position: { x: number; y: number }) => void

  /** 节点拖拽结束 */
  onNodeDragEnd?: (nodeId: string, position: { x: number; y: number }) => void

  /** 节点被调整大小 */
  onNodeResize?: (nodeId: string, size: { width: number; height: number }) => void

  /** 节点调整大小结束 */
  onNodeResizeEnd?: (nodeId: string, size: { width: number; height: number }) => void

  /** 节点被选中 */
  onNodeSelect?: (nodeIds: string[]) => void

  /** 画布被点击 */
  onCanvasClick?: (event: MouseEvent) => void

  /** 视口变化 */
  onViewportChange?: (viewport: { x: number; y: number; zoom: number }) => void
}

/**
 * 抽象渲染器基类
 */
export abstract class BaseRenderer implements IRenderer {
  protected container: HTMLElement | null = null
  protected renderTree: RenderTree = []
  protected config: RendererConfig = {}
  protected events: RendererEvents = {}

  abstract getType(): RendererType
  abstract mount(container: HTMLElement, renderTree: RenderTree): Promise<void>
  abstract update(renderTree: RenderTree): Promise<void>
  abstract updateNode(node: ICanvasNode): Promise<void>
  abstract unmount(): Promise<void>
  abstract getMetadata(): RendererMetadata

  /**
   * 设置配置
   */
  setConfig(config: RendererConfig): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 设置事件处理器
   */
  setEvents(events: RendererEvents): void {
    this.events = { ...this.events, ...events }
  }

  /**
   * 检查是否已挂载
   */
  protected checkMounted(): void {
    if (!this.container) {
      throw new Error('渲染器尚未挂载')
    }
  }
}
