# Card 2.1 开发文档

## 概述

Card 2.1 是一个全新的卡片组件系统，旨在提供更简洁、模块化和可维护的组件架构。本系统采用 TypeScript 开发，支持 Vue 3 组件，并提供统一的数据源管理和配置系统。

## 架构设计

### 核心概念

1. **组件定义 (ComponentDefinition)**: 统一的组件描述接口
2. **组件注册表 (ComponentRegistry)**: 全局组件管理
3. **数据源定义 (ComponentDataSourceDefinition)**: 标准化的数据源配置
4. **配置组件 (ConfigComponent)**: 独立的配置界面

### 目录结构

```
card2.1/
├── core/                    # 核心系统
│   ├── types.ts            # 类型定义
│   ├── registry.ts         # 组件注册表
│   └── index.ts           # 核心导出
├── components/             # 组件目录
│   ├── digit-indicator/   # 数字指示器组件
│   └── multi-data-test/   # 多数据测试组件
├── index.ts               # 系统入口
├── MIGRATION_TODO.md      # 迁移进度
└── README.md              # 本文档
```

## 组件定义规范

### ComponentDefinition 接口

```typescript
interface ComponentDefinition {
  type: string                    // 组件类型标识（唯一）
  name: string                    // 组件显示名称
  description: string             // 组件功能描述
  category: string                // 组件分类
  icon: string                    // 组件图标
  component: Component            // 渲染组件（Vue组件）
  configComponent?: Component     // 配置组件（可选）
  dataSourceDefinitions?: ComponentDataSourceDefinition[]  // 数据源定义
  properties?: Record<string, {   // 组件属性配置
    type: string
    default: any
    description: string
  }>
}
```

### 数据源定义规范

```typescript
interface ComponentDataSourceDefinition {
  name: string           // 数据源名称
  type: string           // 数据类型（number|string|boolean|object|array）
  required: boolean      // 是否必需
  description: string    // 数据源描述
  defaultValue: any      // 默认值
  mappingKeys: string[]  // 数据映射键
}
```

## 开发指南

### 1. 创建新组件

#### 步骤1: 创建组件目录
```
components/your-component/
├── YourComponentCard.vue    # 渲染组件
├── YourComponentConfig.vue  # 配置组件
└── index.ts                # 组件定义
```

#### 步骤2: 实现渲染组件
```vue
<!-- YourComponentCard.vue -->
<template>
  <div class="your-component">
    <!-- 组件渲染逻辑 -->
  </div>
</template>

<script setup lang="ts">
interface Props {
  config?: Record<string, any>
  data?: Record<string, any>
}

const props = defineProps<Props>()
</script>
```

#### 步骤3: 实现配置组件
```vue
<!-- YourComponentConfig.vue -->
<template>
  <div class="config-form">
    <!-- 配置表单 -->
  </div>
</template>

<script setup lang="ts">
interface Props {
  config?: Record<string, any>
  dataSourceDefinitions?: ComponentDataSourceDefinition[]
}

const props = defineProps<Props>()
</script>
```

#### 步骤4: 定义组件
```typescript
// index.ts
import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import type { ComponentDataSourceDefinition } from '../../../components/visual-editor/types/data-source'

const YourComponentCard = defineAsyncComponent(() => import('./YourComponentCard.vue'))
const YourComponentConfig = defineAsyncComponent(() => import('./YourComponentConfig.vue'))

const dataSourceDefinitions: ComponentDataSourceDefinition[] = [
  {
    name: 'value',
    type: 'number',
    required: true,
    description: '主要数值',
    defaultValue: 0,
    mappingKeys: ['value']
  }
]

const yourComponentDefinition: ComponentDefinition = {
  type: 'your-component',
  name: '你的组件',
  description: '组件功能描述',
  category: 'card21',
  icon: '📊',
  component: YourComponentCard,
  configComponent: YourComponentConfig,
  dataSourceDefinitions,
  properties: {
    title: {
      type: 'string',
      default: '标题',
      description: '组件标题'
    }
  }
}

export default yourComponentDefinition
```

#### 步骤5: 注册组件
```typescript
// 在 card2.1/index.ts 中注册
import yourComponentDefinition from './components/your-component'
componentRegistry.register('your-component', yourComponentDefinition)
```

### 2. 数据源配置

组件可以通过 `dataSourceDefinitions` 定义所需的数据源：

```typescript
const dataSourceDefinitions: ComponentDataSourceDefinition[] = [
  {
    name: 'primaryValue',
    type: 'number',
    required: true,
    description: '主要显示数值',
    defaultValue: 0,
    mappingKeys: ['value', 'data.value']
  },
  {
    name: 'secondaryValue',
    type: 'string',
    required: false,
    description: '次要显示信息',
    defaultValue: '',
    mappingKeys: ['label', 'data.label']
  }
]
```

### 3. 组件属性配置

通过 `properties` 定义组件的可配置属性：

```typescript
properties: {
  title: {
    type: 'string',
    default: '默认标题',
    description: '组件标题'
  },
  fontSize: {
    type: 'number',
    default: 16,
    description: '字体大小'
  },
  color: {
    type: 'string',
    default: '#1890ff',
    description: '显示颜色'
  }
}
```

## 迁移指南

### 从旧卡片系统迁移

#### 迁移检查清单

1. **功能分析**
   - [ ] 分析原始组件功能
   - [ ] 识别核心渲染逻辑
   - [ ] 理解交互行为

2. **数据源分析**
   - [ ] 检查配置表单
   - [ ] 识别数据源需求
   - [ ] 分析数据映射关系

3. **解耦分析**
   - [ ] 检查与 panel 系统的耦合
   - [ ] 识别硬编码配置
   - [ ] 找出需要解耦的逻辑

4. **迁移实施**
   - [ ] 创建新组件文件
   - [ ] 实现配置组件
   - [ ] 定义数据源
   - [ ] 注册组件

#### 迁移步骤

1. **获取原始组件路径**
2. **分析组件功能**
3. **创建新组件结构**
4. **实现渲染逻辑**
5. **实现配置界面**
6. **定义数据源**
7. **注册组件**
8. **测试验证**

## 最佳实践

### 1. 组件命名规范
- 组件类型使用 kebab-case: `digit-indicator`
- 组件名称使用中文: `数字指示器`
- 文件命名使用 PascalCase: `DigitIndicatorCard.vue`

### 2. 数据源设计
- 提供清晰的描述信息
- 设置合理的默认值
- 使用语义化的映射键

### 3. 配置设计
- 提供直观的配置界面
- 支持实时预览
- 包含必要的验证

### 4. 错误处理
- 处理数据加载失败
- 提供友好的错误提示
- 支持降级显示

## 示例组件

参考 `components/digit-indicator/` 目录下的实现，这是一个完整的组件示例，包含了：
- 渲染组件实现
- 配置组件实现
- 数据源定义
- 组件注册

## 注意事项

1. 所有组件必须实现 `ComponentDefinition` 接口
2. 数据源定义必须包含完整的类型信息
3. 配置组件应该支持实时预览
4. 组件应该处理数据加载状态
5. 保持向后兼容性 