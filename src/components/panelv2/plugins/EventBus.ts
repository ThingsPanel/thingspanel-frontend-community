// src/components/panelv2/plugins/EventBus.ts

type EventHandler = (...args: any[]) => void

/**
 * 插件事件总线
 * 用于插件间通信和事件分发
 */
export class EventBus {
  private events: Map<string, Set<EventHandler>> = new Map()
  private onceEvents: Map<string, Set<EventHandler>> = new Map()

  /**
   * 监听事件
   */
  on(event: string, handler: EventHandler): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(handler)
  }

  /**
   * 监听一次性事件
   */
  once(event: string, handler: EventHandler): void {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, new Set())
    }
    this.onceEvents.get(event)!.add(handler)
  }

  /**
   * 取消监听
   */
  off(event: string, handler?: EventHandler): void {
    if (handler) {
      // 移除特定处理器
      this.events.get(event)?.delete(handler)
      this.onceEvents.get(event)?.delete(handler)
    } else {
      // 移除所有处理器
      this.events.delete(event)
      this.onceEvents.delete(event)
    }
  }

  /**
   * 发射事件
   */
  emit(event: string, ...args: any[]): void {
    // 触发普通事件处理器
    const handlers = this.events.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      })
    }

    // 触发一次性事件处理器
    const onceHandlers = this.onceEvents.get(event)
    if (onceHandlers) {
      onceHandlers.forEach(handler => {
        try {
          handler(...args)
        } catch (error) {
          console.error(`Error in once event handler for ${event}:`, error)
        }
      })
      // 清除一次性事件
      this.onceEvents.delete(event)
    }
  }

  /**
   * 等待事件（返回Promise）
   */
  waitFor(event: string, timeout?: number): Promise<any> {
    return new Promise((resolve, reject) => {
      const timer = timeout
        ? setTimeout(() => {
            this.off(event, handler)
            reject(new Error(`Timeout waiting for event: ${event}`))
          }, timeout)
        : null

      const handler = (...args: any[]) => {
        if (timer) clearTimeout(timer)
        resolve(args.length === 1 ? args[0] : args)
      }

      this.once(event, handler)
    })
  }

  /**
   * 清除所有事件监听器
   */
  clear(): void {
    this.events.clear()
    this.onceEvents.clear()
  }

  /**
   * 获取事件监听器数量
   */
  listenerCount(event: string): number {
    const normalCount = this.events.get(event)?.size || 0
    const onceCount = this.onceEvents.get(event)?.size || 0
    return normalCount + onceCount
  }

  /**
   * 获取所有已注册的事件名
   */
  eventNames(): string[] {
    const names = new Set<string>()
    this.events.forEach((_, key) => names.add(key))
    this.onceEvents.forEach((_, key) => names.add(key))
    return Array.from(names)
  }
}

// 创建全局事件总线实例
export const globalEventBus = new EventBus()

/**
 * 创建命名空间事件总线
 */
export function createNamespacedEventBus(namespace: string): EventBus {
  const bus = new EventBus()
  const originalEmit = bus.emit.bind(bus)
  const originalOn = bus.on.bind(bus)
  const originalOnce = bus.once.bind(bus)
  const originalOff = bus.off.bind(bus)

  // 重写方法以添加命名空间
  bus.emit = (event: string, ...args: any[]) => {
    originalEmit(`${namespace}:${event}`, ...args)
    // 同时发射到全局总线
    globalEventBus.emit(`${namespace}:${event}`, ...args)
  }

  bus.on = (event: string, handler: EventHandler) => {
    originalOn(`${namespace}:${event}`, handler)
  }

  bus.once = (event: string, handler: EventHandler) => {
    originalOnce(`${namespace}:${event}`, handler)
  }

  bus.off = (event: string, handler?: EventHandler) => {
    originalOff(`${namespace}:${event}`, handler)
  }

  return bus
}
