/**
 * 浏览器兼容的事件发射器
 *
 * 替代Node.js的EventEmitter，在浏览器环境中使用
 *
 * @author Claude
 * @version 1.0.0
 */

export interface EventListener {
  (...args: any[]): void
}

export class BrowserEventEmitter {
  private events: Map<string, EventListener[]> = new Map()

  /**
   * 添加事件监听器
   */
  on(event: string, listener: EventListener): this {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(listener)
    return this
  }

  /**
   * 添加一次性事件监听器
   */
  once(event: string, listener: EventListener): this {
    const onceWrapper = (...args: any[]) => {
      this.off(event, onceWrapper)
      listener(...args)
    }
    return this.on(event, onceWrapper)
  }

  /**
   * 移除事件监听器
   */
  off(event: string, listener: EventListener): this {
    const listeners = this.events.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
    return this
  }

  /**
   * 发射事件
   */
  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events.get(event)
    if (listeners && listeners.length > 0) {
      listeners.forEach(listener => {
        try {
          listener(...args)
        } catch (error) {
          console.error(`事件监听器错误 (${event}):`, error)
        }
      })
      return true
    }
    return false
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(event?: string): this {
    if (event) {
      this.events.delete(event)
    } else {
      this.events.clear()
    }
    return this
  }

  /**
   * 获取事件的监听器数量
   */
  listenerCount(event: string): number {
    return this.events.get(event)?.length || 0
  }

  /**
   * 获取所有事件名称
   */
  eventNames(): string[] {
    return Array.from(this.events.keys())
  }
}

export default BrowserEventEmitter