/**
 * 画布状态原子操作
 * 定义所有可对画布执行的原子操作，遵循 Redux Action 模式
 */

import type {
  ICanvasNode,
  CreateNodeOptions,
  UpdateNodeOptions,
  Position,
  Size,
  Transform,
  NodeStyle,
  Viewport,
  CanvasConfig
} from '../types'
import { nanoid } from 'nanoid'

/**
 * 创建节点默认配置
 */
const DEFAULT_NODE_SIZE: Size = { width: 200, height: 150 }
const DEFAULT_NODE_TRANSFORM: Transform = { rotate: 0, scale: 1 }
const DEFAULT_NODE_STYLE: NodeStyle = {}

/**
 * 创建新节点
 */
export function createNode(options: CreateNodeOptions): ICanvasNode {
  const now = Date.now()

  return {
    id: nanoid(),
    type: options.type,
    position: options.position,
    size: options.size ? { ...DEFAULT_NODE_SIZE, ...options.size } : { ...DEFAULT_NODE_SIZE },
    transform: { ...DEFAULT_NODE_TRANSFORM },
    style: { ...DEFAULT_NODE_STYLE },
    data: options.data || {},
    config: options.config || {},
    interactions: [],
    metadata: {
      createdAt: now,
      updatedAt: now,
      locked: false,
      visible: true
    }
  }
}

/**
 * 更新节点
 */
export function updateNode(node: ICanvasNode, updates: UpdateNodeOptions): ICanvasNode {
  return {
    ...node,
    ...updates,
    metadata: {
      ...node.metadata,
      updatedAt: Date.now()
    }
  }
}

/**
 * 移动节点
 */
export function moveNode(node: ICanvasNode, position: Position): ICanvasNode {
  return updateNode(node, { position })
}

/**
 * 调整节点大小
 */
export function resizeNode(node: ICanvasNode, size: Size): ICanvasNode {
  return updateNode(node, { size })
}

/**
 * 变换节点
 */
export function transformNode(node: ICanvasNode, transform: Partial<Transform>): ICanvasNode {
  return updateNode(node, {
    transform: { ...node.transform, ...transform }
  })
}

/**
 * 更新节点样式
 */
export function updateNodeStyle(node: ICanvasNode, style: Partial<NodeStyle>): ICanvasNode {
  return updateNode(node, {
    style: { ...node.style, ...style }
  })
}

/**
 * 更新节点数据
 */
export function updateNodeData(
  node: ICanvasNode,
  dataKey: string,
  value: any
): ICanvasNode {
  return updateNode(node, {
    data: { ...node.data, [dataKey]: value }
  })
}

/**
 * 批量更新节点数据
 */
export function batchUpdateNodeData(
  node: ICanvasNode,
  data: Record<string, any>
): ICanvasNode {
  return updateNode(node, {
    data: { ...node.data, ...data }
  })
}

/**
 * 更新节点配置
 */
export function updateNodeConfig(
  node: ICanvasNode,
  config: Record<string, any>
): ICanvasNode {
  return updateNode(node, {
    config: { ...node.config, ...config }
  })
}

/**
 * 锁定/解锁节点
 */
export function toggleNodeLock(node: ICanvasNode): ICanvasNode {
  return {
    ...node,
    metadata: {
      ...node.metadata,
      locked: !node.metadata.locked,
      updatedAt: Date.now()
    }
  }
}

/**
 * 显示/隐藏节点
 */
export function toggleNodeVisibility(node: ICanvasNode): ICanvasNode {
  return {
    ...node,
    metadata: {
      ...node.metadata,
      visible: !node.metadata.visible,
      updatedAt: Date.now()
    }
  }
}

/**
 * 克隆节点
 */
export function cloneNode(node: ICanvasNode, positionOffset: Position = { x: 20, y: 20 }): ICanvasNode {
  const now = Date.now()

  return {
    ...node,
    id: nanoid(),
    position: {
      x: node.position.x + positionOffset.x,
      y: node.position.y + positionOffset.y
    },
    metadata: {
      ...node.metadata,
      createdAt: now,
      updatedAt: now
    }
  }
}

/**
 * 视口操作
 */

/**
 * 平移视口
 */
export function panViewport(viewport: Viewport, deltaX: number, deltaY: number): Viewport {
  return {
    ...viewport,
    x: viewport.x + deltaX,
    y: viewport.y + deltaY
  }
}

/**
 * 缩放视口
 */
export function zoomViewport(
  viewport: Viewport,
  scale: number,
  centerX?: number,
  centerY?: number
): Viewport {
  const newZoom = Math.max(0.1, Math.min(10, viewport.zoom * scale))

  // 如果提供了中心点，围绕中心点缩放
  if (centerX !== undefined && centerY !== undefined) {
    const scaleRatio = newZoom / viewport.zoom
    return {
      x: viewport.x * scaleRatio + centerX * (1 - scaleRatio),
      y: viewport.y * scaleRatio + centerY * (1 - scaleRatio),
      zoom: newZoom
    }
  }

  return {
    ...viewport,
    zoom: newZoom
  }
}

/**
 * 重置视口
 */
export function resetViewport(): Viewport {
  return { x: 0, y: 0, zoom: 1 }
}

/**
 * 工具函数
 */

/**
 * 根据 ID 查找节点
 */
export function findNodeById(nodes: ICanvasNode[], id: string): ICanvasNode | undefined {
  return nodes.find(node => node.id === id)
}

/**
 * 根据类型查找节点
 */
export function findNodesByType(nodes: ICanvasNode[], type: string): ICanvasNode[] {
  return nodes.filter(node => node.type === type)
}

/**
 * 根据 ID 列表查找节点
 */
export function findNodesByIds(nodes: ICanvasNode[], ids: string[]): ICanvasNode[] {
  const idSet = new Set(ids)
  return nodes.filter(node => idSet.has(node.id))
}

/**
 * 删除节点
 */
export function removeNodeById(nodes: ICanvasNode[], id: string): ICanvasNode[] {
  return nodes.filter(node => node.id !== id)
}

/**
 * 批量删除节点
 */
export function removeNodesByIds(nodes: ICanvasNode[], ids: string[]): ICanvasNode[] {
  const idSet = new Set(ids)
  return nodes.filter(node => !idSet.has(node.id))
}

/**
 * 替换节点
 */
export function replaceNode(nodes: ICanvasNode[], updatedNode: ICanvasNode): ICanvasNode[] {
  return nodes.map(node => (node.id === updatedNode.id ? updatedNode : node))
}

/**
 * 批量替换节点
 */
export function replaceNodes(nodes: ICanvasNode[], updatedNodes: ICanvasNode[]): ICanvasNode[] {
  const nodeMap = new Map(updatedNodes.map(node => [node.id, node]))
  return nodes.map(node => nodeMap.get(node.id) || node)
}

/**
 * 对节点排序（按 z-index）
 */
export function sortNodesByZIndex(nodes: ICanvasNode[]): ICanvasNode[] {
  return [...nodes].sort((a, b) => {
    const zIndexA = a.style.zIndex || 0
    const zIndexB = b.style.zIndex || 0
    return zIndexA - zIndexB
  })
}

/**
 * 将节点移至最顶层
 */
export function bringNodeToFront(nodes: ICanvasNode[], id: string): ICanvasNode[] {
  const node = findNodeById(nodes, id)
  if (!node) return nodes

  const maxZIndex = Math.max(...nodes.map(n => n.style.zIndex || 0), 0)
  const updatedNode = updateNodeStyle(node, { zIndex: maxZIndex + 1 })

  return replaceNode(nodes, updatedNode)
}

/**
 * 将节点移至最底层
 */
export function sendNodeToBack(nodes: ICanvasNode[], id: string): ICanvasNode[] {
  const node = findNodeById(nodes, id)
  if (!node) return nodes

  const minZIndex = Math.min(...nodes.map(n => n.style.zIndex || 0), 0)
  const updatedNode = updateNodeStyle(node, { zIndex: minZIndex - 1 })

  return replaceNode(nodes, updatedNode)
}
