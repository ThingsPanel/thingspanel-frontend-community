/**
 * 编辑器大数据管理接口
 * 负责管理整个编辑器的数据：组件树、画布配置、全局设置
 */

import type { VisualEditorWidget } from '@/components/visual-editor/types'

/**
 * 编辑器数据结构
 */
export interface EditorData {
  /** 组件树数据 */
  widgets: VisualEditorWidget[]
  /** 画布配置 */
  canvasConfig: {
    width: number
    height: number
    background?: string
    gridSize?: number
    snapToGrid?: boolean
  }
  /** 全局设置 */
  globalSettings: {
    showWidgetTitles: boolean
    renderer: 'canvas' | 'gridstack' | 'grid-layout-plus'
    [key: string]: any
  }
  /** 元数据 */
  metadata: {
    version: string
    createdAt: number
    updatedAt: number
    name?: string
    description?: string
  }
}

/**
 * 编辑器数据变更事件
 */
export interface EditorDataChangeEvent {
  type: 'widget-add' | 'widget-remove' | 'widget-update' | 'canvas-update' | 'settings-update'
  widgetId?: string
  data?: any
  timestamp: number
}

/**
 * 编辑器大数据管理器接口
 * 职责：
 * 1. 管理组件树的增删改查
 * 2. 管理画布配置和全局设置
 * 3. 提供数据持久化（保存/加载）
 * 4. 发出数据变更事件，但不直接操作组件配置或运行时数据
 */
export interface IEditorDataManager {
  /**
   * 获取当前编辑器数据
   */
  getCurrentData(): EditorData

  /**
   * 加载编辑器数据
   */
  loadData(data: EditorData): Promise<void>

  /**
   * 保存编辑器数据
   */
  saveData(): Promise<EditorData>

  // --- 组件树管理 ---

  /**
   * 添加组件
   */
  addWidget(widget: VisualEditorWidget): void

  /**
   * 移除组件
   */
  removeWidget(widgetId: string): void

  /**
   * 更新组件基础信息（位置、大小等，不包括配置）
   */
  updateWidget(widgetId: string, updates: Partial<VisualEditorWidget>): void

  /**
   * 获取组件
   */
  getWidget(widgetId: string): VisualEditorWidget | null

  /**
   * 获取所有组件
   */
  getAllWidgets(): VisualEditorWidget[]

  // --- 画布和全局设置管理 ---

  /**
   * 更新画布配置
   */
  updateCanvasConfig(config: Partial<EditorData['canvasConfig']>): void

  /**
   * 更新全局设置
   */
  updateGlobalSettings(settings: Partial<EditorData['globalSettings']>): void

  // --- 事件监听 ---

  /**
   * 监听数据变更
   */
  onDataChange(listener: (event: EditorDataChangeEvent) => void): () => void

  /**
   * 清理资源
   */
  destroy(): void
}
