# Card 2.1 架构设计

## 概述

Card 2.1 采用了现代化的自动注册架构，支持目录扫描、动态加载和自动分类，大大简化了组件的管理和扩展。

## 核心特性

### 🚀 自动注册系统
- **目录扫描**: 自动扫描 `components/` 目录下的所有组件
- **动态加载**: 使用 Vite 的 `import.meta.glob` 进行动态导入
- **自动分类**: 根据组件定义自动生成分类树
- **零配置**: 新增组件无需修改主入口文件

### 📁 目录结构
```
src/card2.1/
├── core/                    # 核心模块
│   ├── registry.ts         # 组件注册表
│   ├── auto-registry.ts    # 自动注册系统
│   ├── component-loader.ts # 组件加载器
│   └── types.ts           # 类型定义
├── hooks/                  # 业务逻辑 Hooks
│   ├── useComponentTree.ts # 组件树管理
│   ├── useVisualEditorIntegration.ts # Visual Editor 集成
│   └── index.ts           # Hooks 入口
├── components/             # 组件目录
│   ├── bar-chart/         # 柱状图组件
│   ├── digit-indicator/   # 数字指示器
│   └── ...               # 其他组件
└── index.ts               # 主入口文件
```

## 组件开发规范

### 1. 目录结构
每个组件都应该遵循以下目录结构：
```
components/component-name/
├── ComponentName.vue      # 主组件
├── ComponentNameConfig.vue # 配置组件
├── icon.ts               # 图标定义
├── index.ts              # 组件定义（必需）
└── README.md             # 组件文档（可选）
```

### 2. 组件定义 (index.ts)
```typescript
import { defineAsyncComponent } from 'vue'
import type { ComponentDefinition } from '../../core/types'
import { ComponentIcon } from './icon'

// 异步加载组件
const ComponentCard = defineAsyncComponent(() => import('./ComponentName.vue'))
const ComponentConfig = defineAsyncComponent(() => import('./ComponentNameConfig.vue'))

// 组件定义
const componentDefinition: ComponentDefinition = {
  type: 'component-name',           // 组件类型（唯一标识）
  name: '组件名称',                 // 显示名称
  description: '组件描述',          // 组件描述
  category: 'chart',               // 基础分类
  mainCategory: '曲线',            // 主分类（自动分类用）
  subCategory: '图表组件',         // 子分类（自动分类用）
  icon: ComponentIcon,             // 图标
  component: ComponentCard,        // 主组件
  configComponent: ComponentConfig, // 配置组件
  dataSourceDefinitions: [],       // 数据源定义
  properties: {}                   // 属性定义
}

export default componentDefinition
```

### 3. 分类规范
- **主分类**: 系统、曲线、其他
- **子分类**: 系统组件、图表组件、未分类组件

## 核心模块

### AutoRegistry (自动注册系统)
负责组件的自动注册和分类管理：
- 自动扫描组件目录
- 验证组件定义
- 生成分类树
- 提供分类查询接口

### ComponentLoader (组件加载器)
负责组件的动态加载：
- 使用 Vite 的动态导入
- 路径解析和组件ID提取
- 组件验证和统计

### useComponentTree (组件树 Hook)
提供组件树的管理功能：
- 组件筛选和搜索
- 分类管理
- 排序和分页

### useVisualEditorIntegration (Visual Editor 集成 Hook)
提供与 Visual Editor 的桥接：
- 组件转换为 Widget
- 国际化支持
- 统计信息

## 使用示例

### 1. 初始化系统
```typescript
import { initializeCard2System } from '@/card2.1'

// 初始化系统（自动扫描并注册所有组件）
await initializeCard2System()
```

### 2. 使用组件树
```typescript
import { useComponentTree } from '@/card2.1'

const { 
  filteredComponents, 
  availableMainCategories,
  searchQuery,
  selectedMainCategory 
} = useComponentTree({
  autoInit: true,
  sortBy: 'name',
  sortOrder: 'asc'
})
```

### 3. Visual Editor 集成
```typescript
import { useVisualEditorIntegration } from '@/card2.1'

const { 
  availableWidgets, 
  isCard2Component,
  getComponentDefinition 
} = useVisualEditorIntegration({
  autoInit: true,
  enableI18n: true
})
```

## 优势

### 1. 开发效率
- **零配置**: 新增组件无需修改主入口文件
- **自动分类**: 分类信息在组件内部定义，自动生成分类树
- **类型安全**: 完整的 TypeScript 支持

### 2. 维护性
- **职责分离**: 每个模块职责明确
- **可扩展**: 易于添加新功能和模块
- **可测试**: 模块化设计便于单元测试

### 3. 性能
- **按需加载**: 组件异步加载，减少初始包大小
- **缓存优化**: 使用 `shallowRef` 避免不必要的深度响应
- **内存管理**: 合理的状态管理，避免内存泄漏

## 迁移指南

### 从旧版本迁移
1. 将组件分类信息移到组件内部的 `index.ts` 文件
2. 删除主入口文件中的手动注册代码
3. 使用新的 Hooks 替代原有的集成逻辑

### 新增组件
1. 在 `components/` 目录下创建组件目录
2. 按照规范创建 `index.ts` 文件
3. 系统会自动扫描并注册新组件

## 注意事项

1. **组件ID唯一性**: 确保每个组件的 `type` 字段唯一
2. **分类一致性**: 使用统一的分类命名规范
3. **异步加载**: 组件文件使用异步导入以提高性能
4. **错误处理**: 组件加载失败时系统会跳过并记录错误 