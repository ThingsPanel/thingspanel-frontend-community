// 基础渲染器抽象类
// Base renderer abstract class providing common functionality

import type { BaseItem, RenderMode, ItemUpdateData, RendererEvents, Position, Size } from './types'
import type { BaseRenderer as IBaseRenderer } from './interfaces'

/** 历史记录项 */
interface HistoryItem {
  id: string
  timestamp: number
  action: 'add' | 'update' | 'remove' | 'batch'
  data: any
  previousData?: any
}

/** 基础渲染器抽象类 */
export abstract class BaseRenderer implements IBaseRenderer {
  // 基础属性
  abstract readonly name: string
  abstract readonly version: string
  abstract readonly description: string

  // 状态管理
  protected items: Map<string, BaseItem> = new Map()
  protected selectedIds: Set<string> = new Set()
  protected mode: RenderMode = 'edit'
  protected initialized = false

  // 历史记录管理
  protected history: HistoryItem[] = []
  protected historyIndex = -1
  protected maxHistorySize = 50

  // 事件回调
  protected eventCallbacks: Partial<RendererEvents> = {}

  constructor() {
    // 不在构造函数中调用init，由子类或外部调用
  }

  // 抽象方法 - 子类必须实现
  abstract init(): void
  abstract destroy(): void
  abstract refresh(): void
  protected abstract renderItem(item: BaseItem): void
  protected abstract removeItemFromDOM(id: string): void

  // 项目管理方法
  addItem(item: BaseItem): void {
    if (this.items.has(item.id)) {
      console.warn(`Item with id ${item.id} already exists`)
      return
    }

    // 记录历史
    this.recordHistory('add', { item })

    // 添加到状态
    this.items.set(item.id, { ...item })

    // 渲染项目
    this.renderItem(item)

    // 触发事件
    this.emit('item-add', item)

    console.log(`Added item: ${item.id}`)
  }

  updateItem(id: string, updates: ItemUpdateData): void {
    const item = this.items.get(id)
    if (!item) {
      console.warn(`Item with id ${id} not found`)
      return
    }

    // 记录历史
    this.recordHistory('update', { id, updates }, { previousItem: { ...item } })

    // 更新项目
    const updatedItem = {
      ...item,
      ...updates,
      position: { ...item.position, ...updates.position },
      size: { ...item.size, ...updates.size },
      config: { ...item.config, ...updates.config }
    }

    this.items.set(id, updatedItem)

    // 重新渲染项目
    this.renderItem(updatedItem)

    // 触发事件
    this.emit('item-update', id, updates)

    console.log(`Updated item: ${id}`, updates)
  }

  removeItem(id: string): void {
    const item = this.items.get(id)
    if (!item) {
      console.warn(`Item with id ${id} not found`)
      return
    }

    // 记录历史
    this.recordHistory('remove', { id }, { removedItem: { ...item } })

    // 从状态中移除
    this.items.delete(id)
    this.selectedIds.delete(id)

    // 从DOM中移除
    this.removeItemFromDOM(id)

    // 触发事件
    this.emit('item-remove', id)

    console.log(`Removed item: ${id}`)
  }

  getItem(id: string): BaseItem | undefined {
    return this.items.get(id)
  }

  getAllItems(): BaseItem[] {
    return Array.from(this.items.values())
  }

  // 选择管理
  selectItems(ids: string[]): void {
    this.selectedIds.clear()
    ids.forEach(id => {
      if (this.items.has(id)) {
        this.selectedIds.add(id)
      }
    })

    this.emit('item-select', Array.from(this.selectedIds))
    console.log('Selected items:', Array.from(this.selectedIds))
  }

  clearSelection(): void {
    this.selectedIds.clear()
    this.emit('item-select', [])
    console.log('Cleared selection')
  }

  getSelectedItems(): BaseItem[] {
    return Array.from(this.selectedIds)
      .map(id => this.items.get(id))
      .filter(Boolean) as BaseItem[]
  }

  // 模式管理
  setMode(mode: RenderMode): void {
    if (this.mode !== mode) {
      this.mode = mode
      this.refresh()
      console.log(`Mode changed to: ${mode}`)
    }
  }

  getMode(): RenderMode {
    return this.mode
  }

  // 历史记录管理
  protected recordHistory(action: HistoryItem['action'], data: any, previousData?: any): void {
    // 清除当前位置之后的历史记录
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1)
    }

    // 添加新的历史记录
    const historyItem: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      action,
      data,
      previousData
    }

    this.history.push(historyItem)
    this.historyIndex = this.history.length - 1

    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize)
      this.historyIndex = this.history.length - 1
    }
  }

  // 撤销操作
  undo(): boolean {
    if (this.historyIndex < 0) {
      console.log('No more actions to undo')
      return false
    }

    const historyItem = this.history[this.historyIndex]
    this.historyIndex--

    this.executeUndoAction(historyItem)
    console.log(`Undid action: ${historyItem.action}`)
    return true
  }

  // 重做操作
  redo(): boolean {
    if (this.historyIndex >= this.history.length - 1) {
      console.log('No more actions to redo')
      return false
    }

    this.historyIndex++
    const historyItem = this.history[this.historyIndex]

    this.executeRedoAction(historyItem)
    console.log(`Redid action: ${historyItem.action}`)
    return true
  }

  protected executeUndoAction(historyItem: HistoryItem): void {
    switch (historyItem.action) {
      case 'add':
        // 撤销添加 = 删除项目（不记录历史）
        this.removeItemSilently(historyItem.data.item.id)
        break
      case 'remove':
        // 撤销删除 = 添加项目（不记录历史）
        this.addItemSilently(historyItem.previousData.removedItem)
        break
      case 'update':
        // 撤销更新 = 恢复之前的状态（不记录历史）
        this.updateItemSilently(historyItem.data.id, historyItem.previousData.previousItem)
        break
    }
  }

  protected executeRedoAction(historyItem: HistoryItem): void {
    switch (historyItem.action) {
      case 'add':
        this.addItemSilently(historyItem.data.item)
        break
      case 'remove':
        this.removeItemSilently(historyItem.data.id)
        break
      case 'update':
        this.updateItemSilently(historyItem.data.id, historyItem.data.updates)
        break
    }
  }

  // 静默操作（不记录历史）
  protected addItemSilently(item: BaseItem): void {
    this.items.set(item.id, { ...item })
    this.renderItem(item)
    this.emit('item-add', item)
  }

  protected removeItemSilently(id: string): void {
    this.items.delete(id)
    this.selectedIds.delete(id)
    this.removeItemFromDOM(id)
    this.emit('item-remove', id)
  }

  protected updateItemSilently(id: string, updates: any): void {
    const item = this.items.get(id)
    if (item) {
      const updatedItem = { ...item, ...updates }
      this.items.set(id, updatedItem)
      this.renderItem(updatedItem)
      this.emit('item-update', id, updates)
    }
  }

  // 批量操作
  batchUpdate(
    operations: Array<{ type: 'add' | 'update' | 'remove'; id?: string; item?: BaseItem; updates?: ItemUpdateData }>
  ): void {
    // 记录批量操作历史
    this.recordHistory('batch', { operations })

    operations.forEach(op => {
      switch (op.type) {
        case 'add':
          if (op.item) this.addItemSilently(op.item)
          break
        case 'update':
          if (op.id && op.updates) this.updateItemSilently(op.id, op.updates)
          break
        case 'remove':
          if (op.id) this.removeItemSilently(op.id)
          break
      }
    })

    this.refresh()
    console.log(`Executed batch operation with ${operations.length} operations`)
  }

  // 导入导出
  exportData(): { items: BaseItem[]; metadata: any } {
    return {
      items: this.getAllItems(),
      metadata: {
        rendererName: this.name,
        rendererVersion: this.version,
        exportTime: new Date().toISOString(),
        itemCount: this.items.size
      }
    }
  }

  importData(data: { items: BaseItem[]; metadata?: any }): void {
    // 清空当前数据
    this.clearAll()

    // 批量添加项目
    const operations = data.items.map(item => ({
      type: 'add' as const,
      item
    }))

    this.batchUpdate(operations)
    console.log(`Imported ${data.items.length} items`)
  }

  // 清空所有数据
  clearAll(): void {
    const allIds = Array.from(this.items.keys())
    const operations = allIds.map(id => ({
      type: 'remove' as const,
      id
    }))

    this.batchUpdate(operations)
    console.log('Cleared all items')
  }

  // 事件管理
  on<K extends keyof RendererEvents>(event: K, callback: RendererEvents[K]): void {
    this.eventCallbacks[event] = callback
  }

  protected emit<K extends keyof RendererEvents>(event: K, ...args: Parameters<RendererEvents[K]>): void {
    const callback = this.eventCallbacks[event]
    if (callback) {
      // @ts-expect-error - Dynamic callback with variable arguments
      callback(...args)
    }
  }

  // 工具方法
  canUndo(): boolean {
    return this.historyIndex >= 0
  }

  canRedo(): boolean {
    return this.historyIndex < this.history.length - 1
  }

  getHistorySize(): number {
    return this.history.length
  }

  isInitialized(): boolean {
    return this.initialized
  }

  getItemCount(): number {
    return this.items.size
  }

  getSelectedCount(): number {
    return this.selectedIds.size
  }

  // 配置管理 - 默认实现，子类可重写
  getConfig(): any {
    return {
      mode: this.mode,
      itemCount: this.items.size,
      selectedCount: this.selectedIds.size
    }
  }

  updateConfig(config: any): void {
    if (config.mode && config.mode !== this.mode) {
      this.setMode(config.mode)
    }
    console.log('Config updated:', config)
  }

  getConfigForm(): any {
    return null // 子类应该重写此方法提供配置表单
  }

  // 工具管理 - 默认实现，子类可重写
  getTools(): any[] {
    return [] // 子类应该重写此方法提供工具列表
  }

  executeAction(actionId: string, ...args: any[]): any {
    console.warn(`Action ${actionId} not implemented in ${this.name}`)
    return null
  }
}
