# 渲染器自动注册系统使用指南

## 概述

新的渲染器自动注册系统解决了手动注册渲染器的维护问题。现在添加、移除或管理渲染器变得非常简单，只需要在配置文件中进行修改即可。

## 主要优势

1. **零维护成本**：添加新渲染器无需修改多个文件
2. **动态加载**：渲染器按需加载，提高性能
3. **热重载**：支持渲染器的热重载和更新
4. **类型安全**：完整的 TypeScript 支持
5. **向后兼容**：保持现有 API 不变

## 快速开始

### 1. 添加新渲染器

只需要在 `renderers.config.ts` 中添加配置：

```typescript
// src/components/panelv2/renderers/renderers.config.ts
export const renderersConfig: RendererConfig[] = [
  {
    id: 'kanban',
    module: () => import('./kanban'),
    enabled: true
  },
  {
    id: 'visualization',
    module: () => import('./visualization'),
    enabled: true
  },
  // 添加新渲染器
  {
    id: 'chart',
    module: () => import('./chart'),
    enabled: true
  }
]
```

### 2. 创建渲染器模块

在 `renderers/chart/` 目录下创建以下文件：

#### `ChartRendererFactory.ts`
```typescript
import type { BaseRenderer, RendererCapabilities } from '../../types/renderer'

export class ChartRenderer implements BaseRenderer {
  readonly id = 'chart'
  readonly name = '图表渲染器'
  readonly version = '1.0.0'
  
  readonly capabilities: RendererCapabilities = {
    supportsDragDrop: true,
    supportsResize: true,
    supportsZoom: false,
    supportsGrid: false,
    supportsLayers: false,
    supportsAnimation: true
  }

  // 实现 BaseRenderer 接口的其他方法...
}
```

#### `index.ts`
```typescript
import { ChartRenderer } from './ChartRendererFactory'
import type { RendererInfo } from '../../types/renderer'
import type { RendererModule } from '../../core/RendererAutoRegistry'

// 自动注册所需的导出
export const RendererClass = ChartRenderer

export const RendererInfo: RendererInfo = {
  id: 'chart',
  name: '图表渲染器',
  version: '1.0.0',
  description: '专业的图表渲染器，支持多种图表类型',
  icon: 'bar-chart',
  author: 'Your Team',
  capabilities: {
    supportsDragDrop: true,
    supportsResize: true,
    supportsZoom: false,
    supportsGrid: false,
    supportsLayers: false,
    supportsAnimation: true
  }
}

export const enabled = true

// 默认导出
const rendererModule: RendererModule = {
  RendererClass,
  RendererInfo,
  enabled
}

export default rendererModule
```

### 3. 禁用渲染器

只需要在配置中设置 `enabled: false`：

```typescript
{
  id: 'chart',
  module: () => import('./chart'),
  enabled: false // 禁用渲染器
}
```

### 4. 移除渲染器

从配置数组中删除对应的配置项即可。

## 高级用法

### 条件加载

```typescript
{
  id: 'advanced-chart',
  module: () => {
    // 只在生产环境加载
    if (process.env.NODE_ENV === 'production') {
      return import('./advanced-chart')
    }
    throw new Error('Advanced chart only available in production')
  },
  enabled: process.env.NODE_ENV === 'production'
}
```

### 动态配置

```typescript
{
  id: 'feature-chart',
  module: () => import('./feature-chart'),
  enabled: window.featureFlags?.chartRenderer ?? false
}
```

### 版本控制

```typescript
{
  id: 'chart-v2',
  module: () => {
    const version = localStorage.getItem('chart-version') || 'v1'
    return import(`./chart-${version}`)
  },
  enabled: true
}
```

## API 参考

### RendererConfig

```typescript
interface RendererConfig {
  /** 渲染器唯一标识 */
  id: string
  /** 动态导入函数 */
  module: () => Promise<RendererModule>
  /** 是否启用 */
  enabled?: boolean
}
```

### RendererModule

```typescript
interface RendererModule {
  /** 渲染器类 */
  RendererClass: RendererConstructor
  /** 渲染器信息 */
  RendererInfo: RendererInfo
  /** 是否启用 */
  enabled?: boolean
}
```

### RendererAutoRegistry 方法

```typescript
// 添加渲染器配置
rendererAutoRegistry.addRenderer(config)

// 批量添加
rendererAutoRegistry.addRenderers(configs)

// 移除渲染器
rendererAutoRegistry.removeRenderer(id)

// 加载渲染器
await rendererAutoRegistry.loadRenderer(id)

// 注册渲染器到工厂
await rendererAutoRegistry.registerRenderer(id)

// 注册所有启用的渲染器
await rendererAutoRegistry.registerAll()
```

### RendererManager 新方法

```typescript
// 手动注册渲染器
await rendererManager.registerRenderer(id)

// 重新加载渲染器
await rendererManager.reloadRenderer(id)

// 获取已加载的渲染器
const loadedRenderers = rendererManager.getLoadedRenderers()
```

## 事件系统

自动注册系统会发射以下事件：

```typescript
// 注册完成
eventBus.on('renderer-manager:auto-register-complete', (result) => {
  console.log('注册结果:', result)
})

// 注册失败
eventBus.on('renderer-manager:auto-register-failed', ({ error }) => {
  console.error('注册失败:', error)
})

// 渲染器注册
eventBus.on('renderer-manager:renderer-registered', ({ id }) => {
  console.log('渲染器已注册:', id)
})

// 渲染器重载
eventBus.on('renderer-manager:renderer-reloaded', ({ id }) => {
  console.log('渲染器已重载:', id)
})
```

## 最佳实践

1. **命名约定**：渲染器 ID 使用 kebab-case，如 `chart-renderer`
2. **目录结构**：每个渲染器独立目录，包含所有相关文件
3. **类型定义**：为渲染器配置和能力提供完整的类型定义
4. **错误处理**：在模块加载函数中添加适当的错误处理
5. **性能优化**：使用动态导入实现按需加载
6. **测试**：为每个渲染器编写单元测试

## 迁移指南

### 从手动注册迁移

1. 移除 `PanelV2.vue` 中的手动注册代码
2. 在 `renderers.config.ts` 中添加渲染器配置
3. 更新渲染器模块的 `index.ts` 文件
4. 测试渲染器是否正常工作

### 兼容性

- 现有的渲染器 API 保持不变
- 现有的组件引用方式继续有效
- 渐进式迁移，可以逐步更新

## 故障排除

### 常见问题

1. **渲染器未注册**：检查配置文件中的 `enabled` 字段
2. **模块加载失败**：检查动态导入路径是否正确
3. **类型错误**：确保渲染器模块导出了必需的接口
4. **性能问题**：使用浏览器开发工具检查模块加载时机

### 调试技巧

```typescript
// 启用调试模式
const rendererManager = new RendererManager(eventBus, factory, true)

// 检查注册状态
console.log('可用渲染器:', rendererManager.getAvailableRenderers())
console.log('已加载渲染器:', rendererManager.getLoadedRenderers())

// 监听注册事件
eventBus.on('renderer-manager:auto-register-complete', (result) => {
  console.log('注册完成:', result)
})
```

## 总结

新的自动注册系统大大简化了渲染器的管理：

- **添加渲染器**：只需在配置文件中添加一行
- **移除渲染器**：删除配置或设置 `enabled: false`
- **维护成本**：几乎为零，无需修改多个文件
- **性能优化**：按需加载，提高应用启动速度
- **开发体验**：完整的类型支持和错误提示

这种架构使得渲染器系统更加灵活、可维护和可扩展。