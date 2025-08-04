# Visual Editor 组件注册机制指南

本指南详细介绍 Visual Editor 的组件注册系统，包括组件定义、注册流程、Card 2.1 集成和最佳实践。

## 📋 目录

- [系统概述](#系统概述)
- [组件定义规范](#组件定义规范)
- [注册机制详解](#注册机制详解)
- [Card 2.1 集成](#card-21-集成)
- [开发指南](#开发指南)
- [最佳实践](#最佳实践)
- [故障排除](#故障排除)

## 🏗️ 系统概述

Visual Editor 使用双重组件注册系统：

1. **传统组件注册**: 基于 `widgetRegistry` 的单例模式管理
2. **Card 2.1 集成**: 通过 `useCard2Integration` 钩子动态加载

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                   WidgetLibrary                         │
│  ┌─────────────────┐     ┌─────────────────────────────┐ │
│  │ Legacy Widgets  │     │      Card 2.1 Widgets      │ │
│  │                 │     │                             │ │
│  │ WidgetRegistry  │────▶│  useCard2Integration Hook   │ │
│  │   (单例模式)     │     │       (动态加载)             │ │
│  └─────────────────┘     └─────────────────────────────┘ │
│                 │                       │                │
│                 ▼                       ▼                │
│            组件树合并 (combinedWidgetTree)                │
│                            │                             │
│                            ▼                             │
│                    分类展示界面                            │
└─────────────────────────────────────────────────────────┘
```

## 📝 组件定义规范

### WidgetDefinition 接口

```typescript
interface WidgetDefinition {
  type: string                    // 唯一标识符
  name: string                    // 显示名称
  description?: string            // 组件描述
  icon: Component | string        // 图标 (Vue组件或SVG名称)
  category: string                // 分类名称
  version: string                 // 版本号 (语义化版本)
  defaultProperties: Record<string, any>  // 默认属性
  defaultLayout: {                // 默认布局
    canvas: { width: number, height: number }
    gridstack: { w: number, h: number }
  }
  metadata?: Record<string, any>  // 扩展元数据
}
```

### 组件分类规范

内置分类映射：
```typescript
const categoryNameMap: Record<string, string> = {
  base: '基础组件',
  chart: '📊 Card 2.0 图表',
  control: '🎛️ Card 2.0 控制', 
  display: '📱 Card 2.0 显示',
  media: '🎥 Card 2.0 媒体',
  other: '🔧 Card 2.0 其他'
}
```

Card 2.1 分类映射：
```typescript
const card2CategoryMap: Record<string, string> = {
  'chart': '📊 Card 2.1 图表',
  'control': '🎛️ Card 2.1 控制',
  'display': '📱 Card 2.1 显示', 
  'media': '🎥 Card 2.1 媒体',
  'other': '🔧 Card 2.1 其他'
}
```

## 🔧 注册机制详解

### 1. WidgetRegistry 单例

**核心功能**:
- 组件注册和管理
- 组件查询和检索
- 树形结构生成

**主要方法**:
```typescript
class WidgetRegistry {
  // 注册组件
  register(...widgets: WidgetDefinition[]): void
  
  // 获取单个组件
  getWidget(type: string): WidgetDefinition | undefined
  
  // 获取所有组件
  getAllWidgets(): WidgetDefinition[]
  
  // 获取组件树
  getWidgetTree(): WidgetTreeNode[]
}
```

**使用示例**:
```typescript
import { widgetRegistry } from '@/components/visual-editor/core/widget-registry'

// 获取单例实例
const registry = widgetRegistry

// 注册组件
registry.register(textWidget, imageWidget)

// 查询组件
const widget = registry.getWidget('text')

// 获取组件树
const tree = registry.getWidgetTree()
```

### 2. 组件注册流程

#### 步骤 1: 定义组件

```typescript
// widgets/my-widgets.ts
import { MyIconOutline } from '@vicons/ionicons5'
import type { WidgetDefinition } from '../core/widget-registry'

const myWidget: WidgetDefinition = {
  type: 'my-widget',
  name: '我的组件',
  description: '这是一个自定义组件',
  icon: MyIconOutline,
  category: 'custom',
  version: '1.0.0',
  defaultProperties: {
    title: '默认标题',
    content: '默认内容'
  },
  defaultLayout: {
    canvas: { width: 300, height: 200 },
    gridstack: { w: 3, h: 2 }
  },
  metadata: {
    author: 'Developer Name',
    tags: ['custom', 'example']
  }
}
```

#### 步骤 2: 注册函数

```typescript
import { widgetRegistry } from '../core/widget-registry'

export function registerMyWidgets() {
  widgetRegistry.register(myWidget)
  console.log('✅ 自定义组件注册完成')
}
```

#### 步骤 3: 应用初始化

```typescript
// main.ts 或应用入口文件
import { registerMyWidgets } from '@/components/visual-editor/widgets/my-widgets'

// 在应用启动时注册
registerMyWidgets()
```

### 3. 组件树结构

**数据结构**:
```typescript
interface WidgetTreeNode {
  name: string                    // 分类名称
  children: WidgetDefinition[]    // 该分类下的组件列表
}
```

**生成逻辑**:
1. 按 `category` 字段分组组件
2. 使用 `categoryNameMap` 映射显示名称
3. 未知分类自动生成格式化名称

## 🎯 Card 2.1 集成

### 集成架构

Card 2.1 集成通过 `useCard2Integration` 钩子实现，提供与传统组件无缝融合的能力。

### 核心特性

1. **动态加载**: 运行时从 Card 2.1 系统加载组件
2. **国际化支持**: 自动适配多语言显示
3. **统一接口**: 与传统组件使用相同的接口
4. **单例模式**: 全局共享状态，避免重复初始化

### 使用方式

```typescript
// 在组件中使用
import { useCard2Integration } from '../hooks/useCard2Integration'

const card2Integration = useCard2Integration({
  autoInit: true,  // 自动初始化
  componentFilter: (definition) => {
    // 可选：过滤特定组件
    return definition.meta?.enabled !== false
  }
})

// 获取可用组件
const components = card2Integration.availableComponents.value

// 检查是否为 Card 2.1 组件
const isCard2 = card2Integration.isCard2Component('chart-bar')

// 获取组件定义
const definition = card2Integration.getComponentDefinition('chart-bar')
```

### 国际化映射

Card 2.1 组件支持动态国际化：

```typescript
const COMPONENT_I18N_KEYS: Record<string, string> = {
  'version-info': 'card.version',
  'access-num': 'card.deviceTotal',
  'alarm-count': 'card.alarmCount',
  // ... 更多映射
}
```

### 组件合并机制

WidgetLibrary 组件负责合并两套组件系统：

```typescript
const combinedWidgetTree = computed(() => {
  const allCategories: { [key: string]: WidgetTreeNode } = {}

  // 添加传统组件
  legacyWidgetTree.value.forEach(category => {
    allCategories[category.name] = { 
      name: category.name, 
      children: [...category.children] 
    }
  })

  // 添加 Card 2.1 组件
  card2WidgetTree.value.forEach(category => {
    if (allCategories[category.name]) {
      // 合并到现有分类
      allCategories[category.name].children.push(...category.children)
    } else {
      // 添加新分类
      allCategories[category.name] = category
    }
  })

  return Object.values(allCategories)
})
```

## 🚀 开发指南

### 创建新组件

#### 1. 基础组件开发

```typescript
// 1. 创建组件文件
// widgets/MyCustomWidget.vue
<template>
  <div class="my-custom-widget">
    <h3>{{ title }}</h3>
    <p>{{ content }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  content?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '默认标题',
  content: '默认内容'
})
</script>

// 2. 注册组件定义
// widgets/my-custom-widgets.ts
const myCustomWidget: WidgetDefinition = {
  type: 'my-custom-widget',
  name: '自定义组件',
  description: '演示自定义组件的创建',
  icon: CustomIconOutline,
  category: 'custom',
  version: '1.0.0',
  defaultProperties: {
    title: '自定义标题',
    content: '这是自定义内容'
  },
  defaultLayout: {
    canvas: { width: 280, height: 160 },
    gridstack: { w: 3, h: 2 }
  }
}

export function registerMyCustomWidgets() {
  widgetRegistry.register(myCustomWidget)
}
```

#### 2. 组件映射配置

在渲染器中配置组件映射：

```typescript
// renderers/canvas/CanvasRenderer.vue 或其他渲染器
import MyCustomWidget from '../../widgets/MyCustomWidget.vue'

const widgetComponents = {
  text: TextWidget,
  image: ImageWidget,
  'my-custom-widget': MyCustomWidget  // 添加映射
}

const getWidgetComponent = (type: string) => {
  return widgetComponents[type as keyof typeof widgetComponents]
}
```

### 批量注册组件

```typescript
// widgets/index.ts
import { widgetRegistry } from '../core/widget-registry'
import { registerBaseWidgets } from './base-widgets'
import { registerChartWidgets } from './chart-widgets'
import { registerMyCustomWidgets } from './my-custom-widgets'

export function registerAllWidgets() {
  console.log('🚀 开始注册所有组件...')
  
  registerBaseWidgets()
  registerChartWidgets()
  registerMyCustomWidgets()
  
  console.log(`✅ 完成注册 ${widgetRegistry.getAllWidgets().length} 个组件`)
}
```

### 动态组件注册

```typescript
// 支持运行时动态添加组件
export async function loadAndRegisterPlugin(pluginUrl: string) {
  try {
    // 动态导入插件
    const plugin = await import(pluginUrl)
    
    // 注册插件提供的组件
    if (plugin.widgets && Array.isArray(plugin.widgets)) {
      widgetRegistry.register(...plugin.widgets)
      console.log(`✅ 成功加载插件: ${plugin.name}`)
    }
  } catch (error) {
    console.error('❌ 加载插件失败:', error)
  }
}
```

## 🎯 最佳实践

### 1. 组件设计原则

**单一职责**: 每个组件专注于一个功能
```typescript
// ✅ 推荐：专注的组件
const textWidget = { type: 'text', name: '文本', ... }
const imageWidget = { type: 'image', name: '图片', ... }

// ❌ 避免：功能过于复杂的组件
const megaWidget = { type: 'mega', name: '超级组件', ... }
```

**一致性命名**: 使用清晰的命名规范
```typescript
// ✅ 推荐：一致的命名
const barChartWidget = { type: 'chart-bar', name: '柱状图', category: 'chart' }
const lineChartWidget = { type: 'chart-line', name: '折线图', category: 'chart' }

// ❌ 避免：不一致的命名
const widget1 = { type: 'bar_chart', name: 'Bar', category: 'charts' }
const widget2 = { type: 'LineChart', name: '线图', category: 'chart' }
```

### 2. 版本管理

**语义化版本**: 遵循 semver 规范
```typescript
// 正确的版本号格式
const widget = {
  version: '1.2.3',  // MAJOR.MINOR.PATCH
  // 1.x.x - 主要版本，破坏性变更
  // x.2.x - 次要版本，新功能
  // x.x.3 - 补丁版本，bug修复
}
```

**向后兼容**: 保持 API 兼容性
```typescript
// ✅ 推荐：向后兼容的属性扩展
const widgetV2 = {
  defaultProperties: {
    // 保留旧属性
    content: '默认内容',
    fontSize: 14,
    // 添加新属性
    fontWeight: 'normal',
    lineHeight: 1.5
  }
}

// ❌ 避免：破坏性变更
const badWidgetV2 = {
  defaultProperties: {
    // 移除了原有属性
    text: '内容',      // 原来是 content
    size: 14          // 原来是 fontSize
  }
}
```

### 3. 性能优化

**懒加载**: 大型组件按需加载
```typescript
// 使用动态导入
const heavyWidget: WidgetDefinition = {
  type: 'heavy-chart',
  name: '复杂图表',
  // ... 其他配置
  metadata: {
    lazyLoad: true,
    component: () => import('./HeavyChartWidget.vue')
  }
}
```

**属性优化**: 避免复杂的默认属性
```typescript
// ✅ 推荐：简单的默认属性
const goodWidget = {
  defaultProperties: {
    title: '标题',
    visible: true,
    theme: 'default'
  }
}

// ❌ 避免：复杂的默认属性
const badWidget = {
  defaultProperties: {
    config: {
      chart: {
        series: [{ data: [...hugeArray] }],
        options: { /* 巨大的配置对象 */ }
      }
    }
  }
}
```

### 4. 错误处理

**注册错误处理**:
```typescript
export function safeRegisterWidget(widget: WidgetDefinition) {
  try {
    // 验证组件定义
    validateWidgetDefinition(widget)
    
    // 注册组件
    widgetRegistry.register(widget)
    
    console.log(`✅ 成功注册组件: ${widget.name}`)
  } catch (error) {
    console.error(`❌ 注册组件失败: ${widget.type}`, error)
    
    // 可选：注册降级版本
    registerFallbackWidget(widget.type)
  }
}

function validateWidgetDefinition(widget: WidgetDefinition) {
  if (!widget.type) throw new Error('组件类型不能为空')
  if (!widget.name) throw new Error('组件名称不能为空')
  if (!widget.icon) throw new Error('组件图标不能为空')
  // ... 更多验证
}
```

### 5. 测试策略

**单元测试**:
```typescript
// tests/widget-registry.test.ts
import { widgetRegistry } from '../core/widget-registry'

describe('WidgetRegistry', () => {
  beforeEach(() => {
    // 清空注册表
    widgetRegistry.clear()
  })

  it('should register widget correctly', () => {
    const testWidget = { /* 测试组件定义 */ }
    widgetRegistry.register(testWidget)
    
    const registered = widgetRegistry.getWidget('test-widget')
    expect(registered).toBeDefined()
    expect(registered.name).toBe('测试组件')
  })

  it('should handle duplicate registration', () => {
    const widget1 = { type: 'test', name: 'v1' }
    const widget2 = { type: 'test', name: 'v2' }
    
    widgetRegistry.register(widget1)
    widgetRegistry.register(widget2)  // 应该覆盖
    
    const result = widgetRegistry.getWidget('test')
    expect(result.name).toBe('v2')
  })
})
```

## 🔍 故障排除

### 常见问题

#### Q1: 组件注册后不显示在组件库中

**可能原因**:
1. 组件定义不完整
2. 分类映射缺失
3. 图标加载失败

**解决方案**:
```typescript
// 检查组件定义完整性
const validateWidget = (widget: WidgetDefinition) => {
  const required = ['type', 'name', 'icon', 'category', 'version']
  const missing = required.filter(field => !widget[field])
  
  if (missing.length > 0) {
    console.error(`组件 ${widget.type} 缺少必要字段:`, missing)
    return false
  }
  return true
}

// 检查注册状态
console.log('已注册组件:', widgetRegistry.getAllWidgets().map(w => w.type))
console.log('组件树:', widgetRegistry.getWidgetTree())
```

#### Q2: Card 2.1 组件加载失败

**可能原因**:
1. Card 2.1 系统未正确初始化
2. 组件定义格式不兼容
3. 国际化键值缺失

**解决方案**:
```typescript
// 调试 Card 2.1 集成
const debugCard2Integration = () => {
  const integration = useCard2Integration()
  
  console.log('初始化状态:', integration.isInitialized.value)
  console.log('加载状态:', integration.isLoading.value)
  console.log('错误信息:', integration.error.value)
  console.log('可用组件:', integration.availableComponents.value.length)
}

// 手动初始化
const integration = useCard2Integration({ autoInit: false })
await integration.initialize()
```

#### Q3: 组件拖拽数据异常

**可能原因**:
1. 拖拽数据格式错误
2. source 字段缺失
3. 事件处理器异常

**解决方案**:
```typescript
// 验证拖拽数据
const handleDragStart = (widget: WidgetDefinition, event: DragEvent) => {
  const dragData = {
    type: widget.type,
    source: widget.source || 'legacy'
  }
  
  // 验证数据完整性
  if (!dragData.type) {
    console.error('拖拽数据缺少 type 字段:', widget)
    return
  }
  
  console.log('设置拖拽数据:', dragData)
  event.dataTransfer?.setData('application/json', JSON.stringify(dragData))
}
```

### 调试工具

```typescript
// 开发环境调试工具
if (import.meta.env.DEV) {
  window.__debugWidgetRegistry = {
    getAll: () => widgetRegistry.getAllWidgets(),
    getTree: () => widgetRegistry.getWidgetTree(),
    getWidget: (type: string) => widgetRegistry.getWidget(type),
    register: (widget: WidgetDefinition) => widgetRegistry.register(widget),
    
    // Card 2.1 调试
    card2: {
      getComponents: () => useCard2Integration().availableComponents.value,
      getDefinition: (type: string) => useCard2Integration().getComponentDefinition(type)
    }
  }
}
```

---

## 📚 相关文档

- [渲染器开发指南](./renderers/RENDERER_DEVELOPMENT_GUIDE.md)
- [组件开发最佳实践](./renderers/BEST_PRACTICES.md)
- [Card 2.1 集成文档](./CARD2_INTEGRATION.md)

**组件注册系统是 Visual Editor 的核心基础设施，正确的使用和扩展将为编辑器带来强大的功能和良好的用户体验！** 🎨