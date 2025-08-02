# Visual Editor 与 Card 2.0 集成指南

## 概述

本文档说明了 Visual Editor 如何与 Card 2.0 系统进行深度集成，实现统一的组件编辑和渲染体验。

## 集成架构

### 1. 类型系统集成

- **扩展 WidgetType**: 支持所有 Card 2.0 组件类型
- **类型重导出**: 直接导出 Card 2.0 的核心类型
- **向后兼容**: 保持传统组件类型的兼容性

```typescript
// 支持的组件类型现在包括：
export type WidgetType = 
  // 传统组件
  | 'text' | 'image'
  // Card 2.0 图表组件
  | 'bar-chart' | 'curve-chart' | 'gauge' | 'table'
  // Card 2.0 控制组件
  | 'digit-setter' | 'dispatch-data' | 'enum-control' | 'switch'
  // Card 2.0 显示组件
  | 'digit-indicator' | 'state-display' | 'text-info'
  // Card 2.0 媒体组件
  | 'video-player'
```

### 2. Hook 集成

#### useCard2Integration Hook

提供 Card 2.0 系统的完整集成功能：

```typescript
const card2Integration = useCard2Integration({
  autoInit: true,    // 自动初始化
  devMode: false,    // 开发模式
  componentFilter: (def) => true  // 组件过滤器
})
```

**主要功能：**
- 自动初始化 Card 2.0 系统
- 动态加载可用组件
- 组件实例管理
- 错误处理和重试机制

#### useEditor Hook 增强

增加了 Card 2.0 支持：

```typescript
const {
  // 原有功能
  stateManager, addWidget, selectNode, updateNode,
  // Card 2.0 集成
  card2Integration, isCard2Component, createCard2Widget
} = useEditor()
```

### 3. 组件库集成

#### WidgetLibrary 组件更新

- **动态组件加载**: 自动展示所有可用的 Card 2.0 组件
- **分类展示**: 按 Card 2.0 的组件分类进行组织
- **组件信息**: 显示组件版本、描述等元信息
- **状态指示**: 显示加载状态和错误信息

#### 组件分类映射

```typescript
const categoryMap = {
  'chart': '📊 Card 2.0 图表',
  'control': '🎛️ Card 2.0 控制', 
  'display': '📱 Card 2.0 显示',
  'media': '🎥 Card 2.0 媒体'
}
```

### 4. 渲染器集成

#### Card2Wrapper 组件

专门用于在 Visual Editor 中渲染 Card 2.0 组件：

```vue
<Card2Wrapper
  :component-type="node.type"
  :config="node.properties"
  :data="node.metadata?.card2Data"
  :node-id="node.id"
  @error="handleCard2Error"
  @rendered="handleCard2Rendered"
/>
```

**特性：**
- 异步组件加载
- 错误处理和重试
- 生命周期管理
- 配置和数据响应式更新

#### Canvas 渲染器更新

- **智能组件检测**: 自动识别 Card 2.0 组件
- **混合渲染**: 支持传统组件和 Card 2.0 组件并存
- **统一事件处理**: 一致的选择、拖拽、调整大小体验

### 5. 编辑器集成

#### PanelEditor 更新

- **异步组件添加**: 支持 Card 2.0 组件的异步创建
- **错误提示**: 友好的错误信息显示
- **状态管理**: 正确处理 Card 2.0 组件的状态

## 使用方法

### 1. 基本集成

```typescript
import { PanelEditor, useCard2Integration } from '@/components/visual-editor'

// 在组件中使用
const card2Integration = useCard2Integration()

// 检查初始化状态
if (card2Integration.isInitialized.value) {
  // 可以安全使用 Card 2.0 功能
}
```

### 2. 添加 Card 2.0 组件

```typescript
// 检查是否为 Card 2.0 组件
if (isCard2Component('bar-chart')) {
  // 创建 Card 2.0 组件
  await createCard2Widget('bar-chart', { x: 100, y: 100 })
}
```

### 3. 自定义组件过滤

```typescript
const card2Integration = useCard2Integration({
  componentFilter: (definition) => {
    // 只显示图表类组件
    return definition.meta.category === 'chart'
  }
})
```

## 数据结构

### Card 2.0 组件节点结构

```typescript
interface Card2Node extends GraphData {
  metadata: {
    isCard2Component: true
    card2ComponentId: string
    card2Definition: IComponentDefinition
    card2Data?: any
  }
}
```

### 组件配置映射

Card 2.0 组件的配置存储在 `node.properties` 中，数据存储在 `node.metadata.card2Data` 中。

## 错误处理

### 1. 初始化错误

```typescript
if (card2Integration.error.value) {
  // 显示错误信息
  console.error('Card 2.0 初始化失败:', card2Integration.error.value)
  
  // 重试初始化
  await card2Integration.initialize()
}
```

### 2. 组件渲染错误

```typescript
const handleCard2Error = (error: Error) => {
  console.error('Card 2.0 组件渲染错误:', error)
  // 显示用户友好的错误信息
  message.error(`组件渲染失败: ${error.message}`)
}
```

## 性能优化

### 1. 懒加载

- Card 2.0 组件在需要时才加载
- 支持组件预加载机制
- 智能缓存管理

### 2. 实例管理

- 自动清理不使用的组件实例
- 防止内存泄漏
- 生命周期自动管理

## 兼容性

### 1. 向后兼容

- 现有的传统组件继续正常工作
- 配置格式保持兼容
- API 接口不破坏性变更

### 2. 新旧组件混用

- 在同一画布中支持传统组件和 Card 2.0 组件
- 统一的操作体验
- 一致的配置管理

## 调试支持

### 1. 开发模式

```typescript
const card2Integration = useCard2Integration({
  devMode: true  // 启用调试功能
})
```

在开发模式下，可以通过 `window.Card2Debug` 访问调试API。

### 2. 日志记录

所有关键操作都有详细的控制台日志，便于开发调试。

## 示例

参见 `demo/Card2IntegrationDemo.vue` 文件，包含完整的集成演示和测试用例。

## 注意事项

1. **初始化顺序**: 确保 Card 2.0 在使用前已正确初始化
2. **错误处理**: 始终处理异步操作可能的错误
3. **资源清理**: 组件销毁时正确清理 Card 2.0 实例
4. **类型检查**: 使用 `isCard2Component` 检查组件类型

## 故障排除

### 常见问题

1. **组件不显示**: 检查 Card 2.0 是否已初始化
2. **渲染错误**: 查看浏览器控制台的错误信息
3. **配置不生效**: 确认配置格式符合 Card 2.0 规范

### 调试步骤

1. 检查 `card2Integration.isInitialized.value`
2. 查看 `card2Integration.error.value`
3. 检查浏览器控制台日志
4. 使用 `window.Card2Debug` 查看系统状态