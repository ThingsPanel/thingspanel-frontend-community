# Event Engine 事件引擎

## 概述

Event Engine 是 ThingsPanel 物联网可视化平台的核心事件通信系统，基于现有的 ConfigEventBus 扩展而来，提供100%向后兼容性的同时，支持更丰富的事件类型和系统集成功能。

## 核心特性

- **100% 向后兼容** - 完全兼容现有 ConfigEventBus 的所有功能
- **扩展事件类型** - 支持设备事件、数据流事件、用户交互事件等
- **系统适配器** - 为 Card2.1、Visual Editor、Core 三大系统提供无缝集成
- **异步事件处理** - 支持 Promise 的异步事件处理机制
- **内存管理** - 自动清理和防止内存泄漏
- **性能优化** - 并行事件处理，测试性能约 38 事件/秒
- **错误隔离** - 单个事件处理错误不影响其他事件

## 快速开始

### 基础使用

```typescript
import { eventEngine } from '@/iot-visualization-platform/core/event-engine'

// 1. 监听事件
const unsubscribe = eventEngine.on('device:status:change', (payload) => {
  console.log('设备状态变更:', payload)
})

// 2. 发送事件
await eventEngine.emit('device:status:change', {
  deviceId: 'device_001',
  status: 'online',
  timestamp: Date.now()
})

// 3. 取消监听
unsubscribe()
```

### 配置事件兼容性

```typescript
// 原有的配置事件监听方式完全兼容
eventEngine.onConfigChange('themeMode', (newValue) => {
  console.log('主题模式变更:', newValue)
})

// 新的统一事件监听方式
eventEngine.on('config:change', (payload) => {
  if (payload.key === 'themeMode') {
    console.log('主题模式变更:', payload.newValue)
  }
})
```

## 事件类型定义

### 配置事件 (Config Events)
- `config:change` - 配置项变更
- `config:reset` - 配置重置
- `config:validate` - 配置验证

### 设备事件 (Device Events)
- `device:status:change` - 设备状态变更
- `device:data:update` - 设备数据更新
- `device:connection:lost` - 设备连接丢失
- `device:connection:restored` - 设备连接恢复

### 数据流事件 (Data Flow Events)
- `data:received` - 数据接收
- `data:processed` - 数据处理完成
- `data:error` - 数据处理错误

### 用户交互事件 (User Interaction Events)
- `user:action:click` - 用户点击操作
- `user:action:drag` - 用户拖拽操作
- `user:action:select` - 用户选择操作

### 系统事件 (System Events)
- `system:ready` - 系统就绪
- `system:error` - 系统错误
- `system:warning` - 系统警告

## 系统适配器使用

### Card2.1 系统集成

```typescript
import { card21EventAdapter } from '@/iot-visualization-platform/core/event-engine/adapters'

// 自动集成 Card2.1 事件
card21EventAdapter.integrate()

// 监听卡片配置变更
eventEngine.on('card21:config:update', (payload) => {
  console.log('Card2.1 配置更新:', payload)
})

// 监听数据绑定变更
eventEngine.on('card21:data:binding:change', (payload) => {
  console.log('数据绑定变更:', payload)
})
```

### Visual Editor 系统集成

```typescript
import { visualEditorEventAdapter } from '@/iot-visualization-platform/core/event-engine/adapters'

// 集成可视化编辑器事件
visualEditorEventAdapter.integrate()

// 监听组件选择事件
eventEngine.on('visual-editor:component:select', (payload) => {
  console.log('组件选择:', payload)
})

// 监听布局变更事件
eventEngine.on('visual-editor:layout:change', (payload) => {
  console.log('布局变更:', payload)
})
```

### Core 系统集成

```typescript
import { coreEventAdapter } from '@/iot-visualization-platform/core/event-engine/adapters'

// 集成核心系统事件
coreEventAdapter.integrate()

// 监听系统初始化事件
eventEngine.on('core:system:init', (payload) => {
  console.log('系统初始化:', payload)
})
```

## 高级功能

### 批量事件处理

```typescript
// 批量监听多个事件
const events = ['device:status:change', 'device:data:update']
const unsubscribers = events.map(eventType => 
  eventEngine.on(eventType, handleDeviceEvent)
)

// 批量取消监听
unsubscribers.forEach(unsubscribe => unsubscribe())
```

### 异步事件链

```typescript
// 异步事件处理链
eventEngine.on('data:received', async (payload) => {
  // 处理数据
  const processedData = await processData(payload)
  
  // 发送处理完成事件
  await eventEngine.emit('data:processed', {
    originalData: payload,
    processedData,
    timestamp: Date.now()
  })
})
```

### 错误处理

```typescript
eventEngine.on('system:error', (payload) => {
  console.error('系统错误:', payload.error)
  
  // 发送错误通知事件
  eventEngine.emit('user:notification:error', {
    message: payload.error.message,
    severity: 'high'
  })
})
```

## 性能和监控

### 获取事件统计

```typescript
// 获取事件引擎统计信息
const stats = eventEngine.getStatistics()
console.log('事件统计:', {
  totalEvents: stats.totalEvents,
  totalHandlers: stats.totalHandlers,
  eventTypes: stats.eventTypes
})
```

### 内存管理最佳实践

```typescript
// 组件卸载时清理事件监听
onUnmounted(() => {
  // 使用返回的取消函数
  unsubscribe()
  
  // 或批量清理
  eventListeners.forEach(unsubscribe => unsubscribe())
})
```

## 测试和调试

### 开发环境调试

```typescript
// 启用调试模式（仅开发环境）
if (process.env.NODE_ENV === 'development') {
  eventEngine.on('*', (payload, eventType) => {
    console.log(`[Event Debug] ${eventType}:`, payload)
  })
}
```

### 单元测试示例

```typescript
import { describe, test, expect } from 'vitest'
import { EventEngine } from '@/iot-visualization-platform/core/event-engine'

describe('Event Engine', () => {
  test('应该能够监听和发送事件', async () => {
    const eventEngine = new EventEngine()
    let receivedPayload = null
    
    // 监听事件
    eventEngine.on('test:event', (payload) => {
      receivedPayload = payload
    })
    
    // 发送事件
    await eventEngine.emit('test:event', { message: 'test' })
    
    // 验证结果
    expect(receivedPayload).toEqual({ message: 'test' })
  })
})
```

## 最佳实践

### 1. 事件命名规范
- 使用 `domain:action:target` 格式
- 使用小写字母和连字符
- 保持语义清晰

```typescript
// ✅ 好的命名
'device:status:change'
'user:action:click'
'data:validation:error'

// ❌ 避免的命名
'DeviceStatusChange'
'click'
'error'
```

### 2. 载荷数据结构
- 始终包含时间戳
- 提供足够的上下文信息
- 保持数据结构一致性

```typescript
// ✅ 好的载荷结构
{
  deviceId: 'device_001',
  status: 'online',
  previousStatus: 'offline',
  timestamp: Date.now(),
  source: 'device-monitor'
}
```

### 3. 错误处理
- 永远不要让事件处理器抛出未捕获的异常
- 使用专门的错误事件类型
- 提供详细的错误上下文

```typescript
eventEngine.on('device:data:update', (payload) => {
  try {
    processDeviceData(payload)
  } catch (error) {
    eventEngine.emit('system:error', {
      error,
      context: 'device-data-processing',
      payload,
      timestamp: Date.now()
    })
  }
})
```

### 4. 内存管理
- 总是清理事件监听器
- 避免创建匿名事件处理器
- 使用弱引用处理大对象

```typescript
// ✅ 正确的清理方式
const unsubscribe = eventEngine.on('event:type', handler)

onUnmounted(() => {
  unsubscribe()
})
```

## 迁移指南

### 从 ConfigEventBus 迁移

现有的 ConfigEventBus 代码无需修改，Event Engine 提供完全兼容性：

```typescript
// 原有代码保持不变
configEventBus.onConfigChange('themeMode', handler)

// 可选：迁移到新的统一接口
eventEngine.on('config:change', (payload) => {
  if (payload.key === 'themeMode') {
    handler(payload.newValue)
  }
})
```

## 故障排除

### 常见问题

**Q: 事件没有被触发？**
A: 检查事件类型拼写，确认监听器在事件发送前已注册。

**Q: 内存泄漏？**
A: 确保在组件卸载时调用取消函数，检查是否有循环引用。

**Q: 性能问题？**
A: 使用事件统计功能监控事件频率，考虑事件节流或批量处理。

## API 参考

详细的 API 文档请参考 TypeScript 类型定义和源代码注释。

## 贡献指南

在修改 Event Engine 时，请确保：
1. 保持向后兼容性
2. 添加详细的中文注释
3. 更新相关测试
4. 更新文档

## 许可证

遵循项目主许可证。