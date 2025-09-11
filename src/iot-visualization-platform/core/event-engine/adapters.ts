/**
 * 事件引擎适配器
 * 
 * 为现有系统提供无缝的事件集成，确保：
 * 1. Card2.1 系统的 InteractionManager 可以无缝使用新事件引擎
 * 2. Visual Editor 的 ConfigurationIntegrationBridge 可以平滑迁移
 * 3. Core 系统的 ConfigEventBus 保持完全兼容
 * 4. 所有现有事件处理逻辑零修改迁移
 */

import { eventEngine } from './index'
import type { 
  ConfigChangeEvent, 
  ConfigEventType, 
  ExtendedEventData,
  ExtendedEventHandler 
} from './index'

/**
 * Card2.1 InteractionManager 适配器
 * 为 InteractionManager 提供与新事件引擎的集成接口
 */
export class Card21EventAdapter {
  /** 组件事件监听器映射 */
  private componentListeners = new Map<string, Set<(data: any) => void>>()
  
  /** 事件清理函数存储 */
  private cleanupFunctions: (() => void)[] = []

  /**
   * 为组件注册交互事件监听器（兼容原 InteractionManager 接口）
   */
  registerComponentEventListener(
    componentId: string, 
    eventType: string, 
    listener: (data: any) => void
  ): () => void {
    // 如果是配置相关事件，使用 ConfigEventBus
    if (this.isConfigRelatedEvent(eventType)) {
      const cleanup = eventEngine.onConfigChange(
        eventType as ConfigEventType, 
        (event: ConfigChangeEvent) => {
          if (event.componentId === componentId) {
            listener(event)
          }
        }
      )
      this.cleanupFunctions.push(cleanup)
      return cleanup
    }

    // 其他事件使用扩展事件系统
    // 验证事件类型是否为有效的扩展事件类型
    if (!this.isValidExtendedEventType(eventType)) {
      console.warn(`[Card21EventAdapter] 未知事件类型: ${eventType}`)
      return () => {} // 返回空的清理函数
    }

    const cleanup = eventEngine.on(eventType as any, (event: ExtendedEventData) => {
      if (event.componentId === componentId) {
        listener(event.payload)
      }
    })

    this.cleanupFunctions.push(cleanup)
    
    // 存储监听器（兼容原有接口）
    if (!this.componentListeners.has(componentId)) {
      this.componentListeners.set(componentId, new Set())
    }
    this.componentListeners.get(componentId)!.add(listener)

    return () => {
      cleanup()
      const listeners = this.componentListeners.get(componentId)
      if (listeners) {
        listeners.delete(listener)
        if (listeners.size === 0) {
          this.componentListeners.delete(componentId)
        }
      }
    }
  }

  /**
   * 发出组件交互事件（兼容原 InteractionManager 接口）
   */
  async emitComponentEvent(
    componentId: string,
    eventType: string,
    data: any
  ): Promise<void> {
    // 如果是配置相关事件，使用 ConfigEventBus
    if (this.isConfigRelatedEvent(eventType) && this.isConfigChangeEvent(data)) {
      await eventEngine.emitConfigChange(data)
      return
    }

    // 其他事件使用扩展事件系统
    // 验证事件类型
    if (!this.isValidExtendedEventType(eventType)) {
      console.warn(`[Card21EventAdapter] 尝试发出未知事件类型: ${eventType}`)
      return
    }

    await eventEngine.emit(eventType as any, data, `card21-component-${componentId}`)
  }

  /**
   * 获取组件的事件监听器数量（调试用）
   */
  getComponentListenerCount(componentId: string): number {
    return this.componentListeners.get(componentId)?.size || 0
  }

  /**
   * 清理所有事件监听器
   */
  cleanup(): void {
    this.cleanupFunctions.forEach(cleanup => cleanup())
    this.cleanupFunctions = []
    this.componentListeners.clear()
  }

  /**
   * 检查是否是配置相关事件
   */
  private isConfigRelatedEvent(eventType: string): boolean {
    const configEvents = [
      'config-changed',
      'data-source-changed',
      'component-props-changed', 
      'base-config-changed',
      'interaction-changed',
      'before-config-change',
      'after-config-change'
    ]
    return configEvents.includes(eventType)
  }

  /**
   * 检查是否是有效的扩展事件类型
   */
  private isValidExtendedEventType(eventType: string): boolean {
    const extendedEventTypes = [
      // 配置事件类型
      'config-changed',
      'data-source-changed',
      'component-props-changed', 
      'base-config-changed',
      'interaction-changed',
      'before-config-change',
      'after-config-change',
      // 扩展事件类型
      'component-lifecycle',
      'data-update',
      'ui-interaction',
      'system-ready',
      'error-occurred'
    ]
    return extendedEventTypes.includes(eventType)
  }

  /**
   * 检查数据是否是配置变更事件格式
   */
  private isConfigChangeEvent(data: any): data is ConfigChangeEvent {
    return data && 
           typeof data.componentId === 'string' &&
           typeof data.componentType === 'string' &&
           typeof data.section === 'string' &&
           typeof data.timestamp === 'number'
  }
}

/**
 * Visual Editor 适配器
 * 为 Visual Editor 系统提供事件集成
 */
export class VisualEditorEventAdapter {
  /** 编辑器事件监听器存储 */
  private editorListeners: (() => void)[] = []

  /**
   * 注册编辑器配置变更监听器
   */
  onEditorConfigChange(handler: (event: ConfigChangeEvent) => void): () => void {
    const cleanup = eventEngine.onConfigChange('config-changed', handler)
    this.editorListeners.push(cleanup)
    return cleanup
  }

  /**
   * 注册编辑器数据源变更监听器
   */
  onEditorDataSourceChange(handler: (event: ConfigChangeEvent) => void): () => void {
    const cleanup = eventEngine.onConfigChange('data-source-changed', handler)
    this.editorListeners.push(cleanup)
    return cleanup
  }

  /**
   * 发出编辑器事件
   */
  async emitEditorEvent(eventType: string, payload: any): Promise<void> {
    // 验证事件类型
    if (!this.isValidEventType(eventType)) {
      console.warn(`[VisualEditorEventAdapter] 尝试发出未知事件类型: ${eventType}`)
      return
    }

    await eventEngine.emit(eventType as any, payload, 'visual-editor')
  }

  /**
   * 注册编辑器生命周期事件
   */
  onEditorLifecycle(handler: ExtendedEventHandler): () => void {
    const cleanup = eventEngine.on('component-lifecycle', handler)
    this.editorListeners.push(cleanup)
    return cleanup
  }

  /**
   * 清理所有编辑器事件监听器
   */
  cleanup(): void {
    this.editorListeners.forEach(cleanup => cleanup())
    this.editorListeners = []
  }

  /**
   * 验证事件类型是否有效
   */
  private isValidEventType(eventType: string): boolean {
    const validEventTypes = [
      // 配置事件类型
      'config-changed',
      'data-source-changed',
      'component-props-changed', 
      'base-config-changed',
      'interaction-changed',
      'before-config-change',
      'after-config-change',
      // 扩展事件类型
      'component-lifecycle',
      'data-update',
      'ui-interaction',
      'system-ready',
      'error-occurred'
    ]
    return validEventTypes.includes(eventType)
  }
}

/**
 * 核心数据架构适配器
 * 为 Core 系统提供事件集成，确保与现有 ConfigEventBus 的完全兼容
 */
export class CoreEventAdapter {
  /**
   * 直接暴露 ConfigEventBus 接口（零修改兼容）
   */
  onConfigChange = eventEngine.onConfigChange
  emitConfigChange = eventEngine.emitConfigChange
  addEventFilter = eventEngine.addEventFilter
  removeEventFilter = eventEngine.removeEventFilter
  registerDataExecutionTrigger = eventEngine.registerDataExecutionTrigger

  /**
   * 扩展：支持更多事件类型
   */
  onDataUpdate(handler: ExtendedEventHandler): () => void {
    return eventEngine.on('data-update', handler)
  }

  onSystemReady(handler: ExtendedEventHandler): () => void {
    return eventEngine.on('system-ready', handler)
  }

  onError(handler: ExtendedEventHandler): () => void {
    return eventEngine.on('error-occurred', handler)
  }

  /**
   * 发出系统级事件
   */
  async emitSystemEvent(eventType: string, payload: any): Promise<void> {
    // 验证事件类型
    const validSystemEventTypes = [
      'component-lifecycle',
      'data-update', 
      'ui-interaction',
      'system-ready',
      'error-occurred'
    ]
    
    if (!validSystemEventTypes.includes(eventType)) {
      console.warn(`[CoreEventAdapter] 尝试发出未知系统事件类型: ${eventType}`)
      return
    }

    await eventEngine.emit(eventType as any, payload, 'core-system')
  }
}

// 创建适配器实例
export const card21EventAdapter = new Card21EventAdapter()
export const visualEditorEventAdapter = new VisualEditorEventAdapter()
export const coreEventAdapter = new CoreEventAdapter()

/**
 * 统一的适配器管理器
 * 提供所有系统的统一事件接口
 */
export class UnifiedEventAdapterManager {
  /**
   * 获取指定系统的事件适配器
   */
  getAdapter(system: 'card21' | 'visual-editor' | 'core') {
    switch (system) {
      case 'card21':
        return card21EventAdapter
      case 'visual-editor':
        return visualEditorEventAdapter
      case 'core':
        return coreEventAdapter
      default:
        throw new Error(`未知系统类型: ${system}`)
    }
  }

  /**
   * 清理所有适配器
   */
  cleanup(): void {
    card21EventAdapter.cleanup()
    visualEditorEventAdapter.cleanup()
    // core adapter 不需要清理，因为它直接使用 ConfigEventBus
  }

  /**
   * 获取所有系统的事件统计
   */
  getEventStatistics() {
    return {
      eventEngine: eventEngine.getStatistics(),
      card21: {
        componentListeners: card21EventAdapter['componentListeners'].size
      },
      visualEditor: {
        editorListeners: visualEditorEventAdapter['editorListeners'].length
      }
    }
  }
}

// 导出统一管理器实例
export const unifiedEventAdapterManager = new UnifiedEventAdapterManager()

// 调试支持
if (typeof window !== 'undefined') {
  ;(window as any).eventAdapters = {
    card21: card21EventAdapter,
    visualEditor: visualEditorEventAdapter,
    core: coreEventAdapter,
    unified: unifiedEventAdapterManager
  }
}

if (process.env.NODE_ENV === 'development') {
}