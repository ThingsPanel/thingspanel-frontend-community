# Card 2.1 子分类功能更新

## 更新概述

本次更新为Card 2.1系统添加了子分类功能，实现了更细粒度的组件分组，提升了WidgetLibrary的用户体验。

## 主要修改

### 1. 类型定义更新

**文件**: `src/card2.1/core/types.ts`
- 在`ComponentDefinition`接口中添加了`subCategory?: string`属性
- 用于支持更细粒度的组件分组

### 2. WidgetRegistry更新

**文件**: `src/components/visual-editor/core/widget-registry.ts`
- 移除了分类名称中的emoji表情符号
- 更新了`WidgetDefinition`接口，添加`subCategory`属性支持

### 3. WidgetLibrary组件更新

**文件**: `src/components/visual-editor/components/WidgetLibrary/WidgetLibrary.vue`
- 实现了智能子分类逻辑
- 支持两个主要标签页：系统和曲线
- 每行显示3个组件
- 正确显示Card 2.1组件的SVG图标

### 4. Card 2.1组件更新

为现有Card 2.1组件设置了正确的分类：

#### 系统组件 (category: 'card21')
- `access` - 设备总数
- `alarm-count` - 告警统计
- `alarm-info` - 告警信息

#### 图表组件 (category: 'chart')
- `digit-indicator` - 数字指示器
- `multi-data-test` - 多数据测试
- `dispatch-data` - 数据发送

## 子分类逻辑

### 智能分组规则

1. **顶层分类**：系统和曲线两个固定标签页
2. **Card 2.1组件分组**：
   - `category: 'card21'` → 系统标签页下的"Card 2.1 组件"子分类
   - `category: 'chart'` → 曲线标签页下的"图表组件"子分类

3. **传统组件分组**：
   - `chart`分类 → 曲线标签页
   - 其他分类 → 系统标签页
   - 根据原始分类名称进行子分组



### 分类映射

| 原始分类 | 主分类 | 子分类 |
|---------|--------|--------|
| card21 | 系统 | Card 2.1 组件 |
| chart | 曲线 | 图表组件 |
| builtin | 系统 | 内置组件 |

| 其他 | 系统 | 其他组件 |

## 文档更新

### 1. AI_MIGRATION_PROMPT.md
- 添加了子分类设置要求
- 更新了ComponentDefinition接口说明
- 添加了子分类检查清单

### 2. AI_PROMPT_TEMPLATE.md  
- 更新了组件定义结构
- 添加了子分类设置说明
- 更新了重要提醒事项

## 使用指南

### 为新组件设置子分类

```typescript
const componentDefinition: ComponentDefinition = {
  type: 'your-component',
  name: '组件名称',
  description: '组件描述',
  category: 'card21',
  subCategory: '系统组件', // 根据功能设置：系统组件、图表组件等
  icon: YourComponentIcon,
  component: YourComponentCard,
  // ... 其他配置
}
```

### 子分类建议

- **系统组件**: 设备管理、告警统计、系统监控等
- **图表组件**: 数据可视化、图表展示、指标显示等
- **控制组件**: 设备控制、开关操作等
- **显示组件**: 信息展示、状态显示等

## 效果展示

更新后的WidgetLibrary将显示：

```
系统
├── Card 2.1 组件
│   ├── 设备总数
│   ├── 告警统计
│   └── 告警信息
├── 内置组件
│   └── ...
└── 其他组件
    └── ...

曲线
├── 图表组件
│   ├── 数字指示器 (Card 2.1)
│   ├── 多数据测试 (Card 2.1)
│   └── 数据发送 (Card 2.1)
└── 内置图表
    └── ...
```

## 注意事项

1. **向后兼容**: 现有组件如果没有设置`subCategory`，系统会自动进行智能分组
2. **图标显示**: Card 2.1组件的SVG图标现在可以正确显示
3. **布局优化**: 每行固定显示3个组件，提升视觉体验
4. **搜索功能**: 搜索功能支持按组件名称和类型进行过滤 