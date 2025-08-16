# Card2.1 触发器系统设计

## 📋 核心文件分析

**主要文件**: `/src/card2.1/core/data-binding/reactive-binding.ts`

## 🎯 触发器系统架构

### 1. 统一触发器接口
所有触发器实现统一的接口规范：

```typescript
interface UpdateTrigger {
  type: UpdateTriggerType
  config: any
  
  start(callback: () => void): void
  stop(): void
  isActive(): boolean
}

type UpdateTriggerType = 'timer' | 'websocket' | 'event' | 'manual'
```

### 2. 定时器触发器
最常用的触发器类型，支持定时和立即执行：

```typescript
class TimerTrigger implements UpdateTrigger {
  type: UpdateTriggerType = 'timer'
  config: {
    interval: number      // 触发间隔（毫秒）
    immediate?: boolean   // 是否立即执行一次
  }

  constructor(interval: number, immediate = false) {
    this.config = { interval, immediate }
  }

  start(callback: () => void): void {
    // 立即执行一次（如果配置了）
    if (this.config.immediate) {
      setTimeout(callback, 0)
    }
    
    // 启动定时器
    this.timer = setInterval(callback, this.config.interval)
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }
}
```

### 3. WebSocket触发器
支持WebSocket消息触发，带有自动重连机制：

```typescript
class WebSocketTrigger implements UpdateTrigger {
  type: UpdateTriggerType = 'websocket'
  config: {
    url: string
    protocols?: string[]
    reconnectInterval?: number  // 重连间隔，默认5秒
  }

  start(callback: () => void): void {
    this.callback = callback
    this.connect()
  }

  private connect(): void {
    this.ws = new WebSocket(this.config.url, this.config.protocols)
    
    this.ws.onopen = () => {
      console.log('✅ WebSocket连接成功')
    }
    
    // 每次收到消息都触发回调
    this.ws.onmessage = () => {
      console.log('📨 收到WebSocket消息，触发数据更新')
      if (this.callback) {
        this.callback()
      }
    }
    
    // 连接关闭时自动重连
    this.ws.onclose = () => {
      console.warn('🔌 WebSocket连接关闭，尝试重连')
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, this.config.reconnectInterval || 5000)
  }
}
```

### 4. 事件触发器
监听DOM事件或自定义事件：

```typescript
class EventTrigger implements UpdateTrigger {
  type: UpdateTriggerType = 'event'
  config: {
    eventName: string
    target?: EventTarget  // 默认为window
  }

  constructor(eventName: string, target: EventTarget = window) {
    this.config = { eventName, target }
  }

  start(callback: () => void): void {
    this.eventHandler = () => {
      console.log(`📡 收到事件 ${this.config.eventName}，触发数据更新`)
      callback()
    }
    
    this.config.target?.addEventListener(this.config.eventName, this.eventHandler)
  }

  stop(): void {
    if (this.eventHandler) {
      this.config.target?.removeEventListener(this.config.eventName, this.eventHandler)
      this.eventHandler = null
    }
  }
}
```

### 5. 手动触发器
提供程序化的触发控制：

```typescript
class ManualTrigger implements UpdateTrigger {
  type: UpdateTriggerType = 'manual'
  config: any = {}

  start(callback: () => void): void {
    this.callback = callback
    this.active = true
  }

  stop(): void {
    this.callback = null
    this.active = false
  }

  /** 手动触发更新 */
  trigger(): void {
    if (this.callback && this.active) {
      console.log('👆 手动触发数据更新')
      this.callback()
    }
  }
}
```

## 🔧 触发器工厂模式

### 1. 工厂类设计
```typescript
class UpdateTriggerFactory {
  /** 创建定时器触发器 */
  static createTimerTrigger(interval: number, immediate = false): TimerTrigger {
    return new TimerTrigger(interval, immediate)
  }

  /** 创建WebSocket触发器 */
  static createWebSocketTrigger(url: string, protocols?: string[]): WebSocketTrigger {
    return new WebSocketTrigger(url, protocols)
  }

  /** 创建事件触发器 */
  static createEventTrigger(eventName: string, target?: EventTarget): EventTrigger {
    return new EventTrigger(eventName, target)
  }

  /** 创建手动触发器 */
  static createManualTrigger(): ManualTrigger {
    return new ManualTrigger()
  }

  /** 根据配置创建触发器 */
  static createFromConfig(config: TriggerConfig): UpdateTrigger {
    switch (config.type) {
      case 'timer':
        return new TimerTrigger(config.interval, config.immediate)
      case 'websocket':
        return new WebSocketTrigger(config.url, config.protocols)
      case 'event':
        return new EventTrigger(config.eventName, config.target)
      case 'manual':
        return new ManualTrigger()
      default:
        throw new Error(`不支持的触发器类型: ${config.type}`)
    }
  }
}
```

### 2. 配置接口
```typescript
interface TriggerConfig {
  type: UpdateTriggerType
  // 定时器配置
  interval?: number
  immediate?: boolean
  // WebSocket配置
  url?: string
  protocols?: string[]
  // 事件配置
  eventName?: string
  target?: EventTarget
}
```

## 🔄 响应式绑定集成

### 1. 多触发器支持
单个数据绑定可以有多个触发器：

```typescript
class ReactiveDataBindingImpl {
  triggers: UpdateTrigger[]

  start(): void {
    // 启动所有触发器
    this.triggers.forEach((trigger, index) => {
      console.log(`🔧 启动触发器 ${index + 1}: ${trigger.type}`)
      trigger.start(() => this.handleTrigger(trigger))
    })
  }

  stop(): void {
    // 停止所有触发器
    this.triggers.forEach((trigger, index) => {
      console.log(`🛑 停止触发器 ${index + 1}: ${trigger.type}`)
      trigger.stop()
    })
  }

  private async handleTrigger(trigger: UpdateTrigger): Promise<void> {
    console.log(`📡 触发器激活: ${this.id} (${trigger.type})`)
    await this.updateData(trigger.type)
  }
}
```

### 2. 触发器状态管理
```typescript
// 获取绑定统计信息
getStats(): {
  id: string
  componentId: string
  active: boolean
  updateCount: number
  lastUpdateTime: Date | null
  triggerCount: number
  activeTriggers: number
} {
  return {
    id: this.id,
    componentId: this.componentId,
    active: this.active,
    updateCount: this.updateCount,
    lastUpdateTime: this.lastUpdateTime,
    triggerCount: this.triggers.length,
    activeTriggers: this.triggers.filter(t => t.isActive()).length
  }
}
```

## 🔑 关键设计原则

### 1. 接口统一性
- 所有触发器实现相同的接口
- 统一的生命周期管理（start/stop）
- 一致的状态查询机制（isActive）

### 2. 可扩展性
- 通过工厂模式支持新触发器类型
- 配置驱动的触发器创建
- 支持自定义触发器实现

### 3. 容错机制
- WebSocket自动重连
- 事件监听器的正确清理
- 触发器异常不影响其他触发器

### 4. 调试友好
- 丰富的日志输出
- 触发器状态可查询
- 详细的统计信息

## 🔍 使用示例

### 1. 组合使用多个触发器
```typescript
const triggers = [
  UpdateTriggerFactory.createTimerTrigger(30000, true),  // 30秒定时+立即执行
  UpdateTriggerFactory.createEventTrigger('dataRefresh'), // 监听自定义事件
  UpdateTriggerFactory.createManualTrigger()              // 手动触发支持
]

const binding = new ReactiveDataBindingImpl(
  'binding-1',
  'component-1', 
  pipeline,
  triggers,
  (newData) => console.log('数据更新:', newData)
)

binding.start()
```

### 2. 配置化触发器创建
```typescript
const triggerConfigs: TriggerConfig[] = [
  {
    type: 'timer',
    interval: 60000,
    immediate: true
  },
  {
    type: 'websocket',
    url: 'wss://api.example.com/realtime'
  }
]

const triggers = triggerConfigs.map(config => 
  UpdateTriggerFactory.createFromConfig(config)
)
```

## 🚀 在新系统中的应用

### 1. 完全复用触发器系统
这部分设计非常优秀，在新系统中完全保留：
- 所有触发器类型和实现
- 工厂模式和配置化创建
- 多触发器组合机制
- 生命周期管理

### 2. 简化集成接口
```typescript
// 新系统中的简化使用
interface SimpleDataSourceConfig {
  id: string
  type: 'static' | 'api' | 'websocket' | 'script'
  config: any
  triggers: TriggerConfig[] // 直接复用触发器配置
}
```

触发器系统是Card2.1架构中设计最完善的部分，提供了灵活、可靠的数据更新机制，完全值得在新系统中保留和复用。