/**
 * Fabric 渲染器工具函数
 * 为 Fabric.js 6.7.1 渲染器提供实用工具
 */

import type { FabricObject } from 'fabric'
import type { FabricLayout, FabricWidgetNode } from './types'

/**
 * 将 VisualEditorWidget 转换为 FabricLayout
 */
export function widgetToFabricLayout(node: FabricWidgetNode): FabricLayout {
  const layout = node.layout?.canvas || {}
  return {
    x: layout.x || 0,
    y: layout.y || 0,
    width: layout.width || 200,
    height: layout.height || 100,
    rotation: layout.rotation || 0,
    scaleX: layout.scaleX || 1,
    scaleY: layout.scaleY || 1
  }
}

/**
 * 将 FabricObject 转换为 FabricLayout
 */
export function fabricObjectToLayout(obj: FabricObject): FabricLayout {
  return {
    x: obj.left || 0,
    y: obj.top || 0,
    width: obj.width || 0,
    height: obj.height || 0,
    rotation: obj.angle || 0,
    scaleX: obj.scaleX || 1,
    scaleY: obj.scaleY || 1
  }
}

/**
 * 检查 Fabric.js 是否可用
 */
export async function checkFabricAvailability(): Promise<boolean> {
  try {
    const { Canvas } = await import('fabric')
    return !!Canvas
  } catch {
    return false
  }
}

/**
 * 动态导入 Fabric.js
 */
export async function importFabric() {
  try {
    return await import('fabric')
  } catch (error) {
    throw new Error(`无法导入 Fabric.js: ${error}`)
  }
}

/**
 * 创建默认的 Fabric 对象样式
 */
export function getDefaultFabricStyle(nodeType: string): Record<string, any> {
  const baseStyle = {
    stroke: '#cccccc',
    strokeWidth: 1,
    fill: '#f0f0f0',
    cornerStyle: 'circle',
    cornerSize: 8,
    transparentCorners: false,
    cornerColor: '#007bff'
  }

  switch (nodeType) {
    case 'text':
    case 'digit-indicator':
      return {
        ...baseStyle,
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        fill: '#333333',
        stroke: 'transparent',
        strokeWidth: 0
      }

    case 'button':
      return {
        ...baseStyle,
        fill: '#007bff',
        stroke: '#0056b3',
        rx: 4,
        ry: 4
      }

    case 'card':
      return {
        ...baseStyle,
        fill: '#ffffff',
        stroke: '#e0e0e0',
        rx: 8,
        ry: 8,
        shadow: 'rgba(0,0,0,0.1) 0px 2px 4px'
      }

    default:
      return baseStyle
  }
}

/**
 * 计算对象边界框
 */
export function calculateBoundingBox(objects: FabricObject[]): FabricLayout {
  if (objects.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  objects.forEach(obj => {
    const bounds = obj.getBoundingRect()
    minX = Math.min(minX, bounds.left)
    minY = Math.min(minY, bounds.top)
    maxX = Math.max(maxX, bounds.left + bounds.width)
    maxY = Math.max(maxY, bounds.top + bounds.height)
  })

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

/**
 * 生成唯一的 Fabric 对象 ID
 */
export function generateFabricObjectId(prefix = 'fabric-obj'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 对齐辅助函数
 */
export const AlignmentHelpers = {
  /**
   * 左对齐
   */
  alignLeft(objects: FabricObject[]): void {
    if (objects.length < 2) return
    const leftmost = Math.min(...objects.map(obj => obj.left || 0))
    objects.forEach(obj => obj.set({ left: leftmost }))
  },

  /**
   * 右对齐
   */
  alignRight(objects: FabricObject[]): void {
    if (objects.length < 2) return
    const rightmost = Math.max(...objects.map(obj => (obj.left || 0) + (obj.width || 0)))
    objects.forEach(obj => obj.set({ left: rightmost - (obj.width || 0) }))
  },

  /**
   * 顶部对齐
   */
  alignTop(objects: FabricObject[]): void {
    if (objects.length < 2) return
    const topmost = Math.min(...objects.map(obj => obj.top || 0))
    objects.forEach(obj => obj.set({ top: topmost }))
  },

  /**
   * 底部对齐
   */
  alignBottom(objects: FabricObject[]): void {
    if (objects.length < 2) return
    const bottommost = Math.max(...objects.map(obj => (obj.top || 0) + (obj.height || 0)))
    objects.forEach(obj => obj.set({ top: bottommost - (obj.height || 0) }))
  },

  /**
   * 水平居中对齐
   */
  alignCenterHorizontal(objects: FabricObject[]): void {
    if (objects.length < 2) return
    const bounds = calculateBoundingBox(objects)
    const centerX = bounds.x + bounds.width / 2
    objects.forEach(obj => {
      const objCenterX = centerX - (obj.width || 0) / 2
      obj.set({ left: objCenterX })
    })
  },

  /**
   * 垂直居中对齐
   */
  alignCenterVertical(objects: FabricObject[]): void {
    if (objects.length < 2) return
    const bounds = calculateBoundingBox(objects)
    const centerY = bounds.y + bounds.height / 2
    objects.forEach(obj => {
      const objCenterY = centerY - (obj.height || 0) / 2
      obj.set({ top: objCenterY })
    })
  }
}

/**
 * 分布辅助函数
 */
export const DistributionHelpers = {
  /**
   * 水平等距分布
   */
  distributeHorizontally(objects: FabricObject[]): void {
    if (objects.length < 3) return
    objects.sort((a, b) => (a.left || 0) - (b.left || 0))

    const first = objects[0]
    const last = objects[objects.length - 1]
    const totalWidth = (last.left || 0) - (first.left || 0)
    const gap = totalWidth / (objects.length - 1)

    objects.forEach((obj, index) => {
      if (index > 0 && index < objects.length - 1) {
        obj.set({ left: (first.left || 0) + gap * index })
      }
    })
  },

  /**
   * 垂直等距分布
   */
  distributeVertically(objects: FabricObject[]): void {
    if (objects.length < 3) return
    objects.sort((a, b) => (a.top || 0) - (b.top || 0))

    const first = objects[0]
    const last = objects[objects.length - 1]
    const totalHeight = (last.top || 0) - (first.top || 0)
    const gap = totalHeight / (objects.length - 1)

    objects.forEach((obj, index) => {
      if (index > 0 && index < objects.length - 1) {
        obj.set({ top: (first.top || 0) + gap * index })
      }
    })
  }
}

/**
 * 缩放辅助函数
 */
export function scaleToFit(obj: FabricObject, maxWidth: number, maxHeight: number): void {
  const objWidth = obj.width || 1
  const objHeight = obj.height || 1

  const scaleX = maxWidth / objWidth
  const scaleY = maxHeight / objHeight
  const scale = Math.min(scaleX, scaleY)

  obj.set({
    scaleX: scale,
    scaleY: scale
  })
}

/**
 * 错误处理工具
 */
export class FabricError extends Error {
  constructor(message: string, public code?: string) {
    super(message)
    this.name = 'FabricError'
  }
}

/**
 * 性能监控工具
 */
export class FabricPerformanceMonitor {
  private timers: Map<string, number> = new Map()

  start(label: string): void {
    this.timers.set(label, performance.now())
  }

  end(label: string): number {
    const startTime = this.timers.get(label)
    if (!startTime) return 0

    const duration = performance.now() - startTime
    this.timers.delete(label)

    console.log(`🎯 Fabric Performance [${label}]: ${duration.toFixed(2)}ms`)
    return duration
  }
}

export default {
  widgetToFabricLayout,
  fabricObjectToLayout,
  checkFabricAvailability,
  importFabric,
  getDefaultFabricStyle,
  calculateBoundingBox,
  generateFabricObjectId,
  AlignmentHelpers,
  DistributionHelpers,
  scaleToFit,
  FabricError,
  FabricPerformanceMonitor
}