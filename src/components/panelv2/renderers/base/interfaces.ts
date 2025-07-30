// 渲染器接口规范定义
// Renderer interface specifications

import type { BaseItem, RenderMode, SelectionState, ItemUpdateData, RendererEvents } from './types'

/** 渲染器基础属性接口 */
export interface BaseRendererProps {
  /** 项目列表 */
  items: BaseItem[]
  /** 渲染模式 */
  mode: RenderMode
  /** 选中的项目ID列表 */
  selectedIds: string[]
  /** 是否允许编辑 */
  editable?: boolean
  /** 是否显示网格 */
  showGrid?: boolean
}

/** 渲染器基础接口 */
export interface BaseRenderer {
  /** 渲染器名称 */
  name: string
  /** 渲染器版本 */
  version: string
  /** 渲染器描述 */
  description: string

  /** 初始化渲染器 */
  init(): void
  /** 销毁渲染器 */
  destroy(): void
  /** 刷新渲染 */
  refresh(): void

  /** 添加项目 */
  addItem(item: BaseItem): void
  /** 更新项目 */
  updateItem(id: string, updates: ItemUpdateData): void
  /** 删除项目 */
  removeItem(id: string): void
  /** 获取项目 */
  getItem(id: string): BaseItem | undefined
  /** 获取所有项目 */
  getAllItems?(): BaseItem[]

  /** 选择项目 */
  selectItems(ids: string[]): void
  /** 清空选择 */
  clearSelection(): void
  /** 获取选中的项目 */
  getSelectedItems?(): BaseItem[]

  /** 设置模式 */
  setMode(mode: RenderMode): void
  /** 获取当前模式 */
  getMode?(): RenderMode

  /** 历史操作 */
  undo?(): boolean
  redo?(): boolean
  canUndo?(): boolean
  canRedo?(): boolean

  /** 导入导出 */
  exportData?(): any
  importData?(data: any): void
  clearAll?(): void

  /** 配置管理 */
  getConfig?(): any
  updateConfig?(config: any): void
  getConfigForm?(): any

  /** 工具管理 */
  getTools?(): any[]
  executeAction?(actionId: string, ...args: any[]): any

  /** 事件管理 */
  on?<K extends keyof RendererEvents>(event: K, callback: RendererEvents[K]): void

  /** 状态查询 */
  isInitialized?(): boolean
  getItemCount?(): number
  getSelectedCount?(): number
  getHistorySize?(): number
}

/** 渲染器工厂接口 */
export interface RendererFactory {
  /** 创建渲染器实例 */
  create(config: any): BaseRenderer
  /** 获取渲染器类型 */
  getType(): string
  /** 获取默认配置 */
  getDefaultConfig(): any
}

/** 渲染器注册表接口 */
export interface RendererRegistry {
  /** 注册渲染器工厂 */
  register(type: string, factory: RendererFactory): void
  /** 获取渲染器工厂 */
  getFactory(type: string): RendererFactory | undefined
  /** 创建渲染器 */
  createRenderer(type: string, config: any): BaseRenderer | undefined
  /** 获取所有注册的渲染器类型 */
  getTypes(): string[]
}
