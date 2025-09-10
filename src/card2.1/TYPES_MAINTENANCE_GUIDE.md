# Card2.1 类型系统维护指南

## 📋 概述

Card2.1 采用统一的TypeScript类型系统，确保组件开发的类型安全和一致性。本文档提供类型系统的维护指南和最佳实践。

## 📁 类型文件结构

```
src/card2.1/
├── types/
│   ├── index.ts              # 统一类型导出
│   ├── setting-config.ts     # 设置配置相关类型
│   └── interaction-component.ts # 交互组件类型
├── core/
│   ├── types.ts             # 核心类型定义
│   ├── config-types.ts      # 配置相关类型
│   ├── interaction-types.ts # 交互系统类型
│   └── data-binding/
│       └── types.ts         # 数据绑定类型
```

## 🔥 关键类型接口

### 1. ComponentDefinition

组件定义的核心接口，支持泛型配置：

```typescript
export interface ComponentDefinition<TConfig = Record<string, any>> {
  type: string
  name: string
  description: string
  category?: string // 可选，由自动注册系统设置
  icon: string
  component: Component
  configComponent?: Component
  
  // 🔥 新增标准化字段
  defaultConfig?: TConfig      // 默认配置对象
  defaultLayout?: LayoutConfig // 默认布局配置
  layout?: LayoutOptions       // 布局选项
  features?: FeatureFlags      // 特性标记
  performance?: PerformanceConfig // 性能配置
  
  // 数据源需求
  dataSources?: DataSourceRequirement[]
  staticParams?: StaticParamRequirement[]
  
  // 交互能力
  interaction?: ComponentInteractionDefinition
  settingConfig?: any[] // 设置配置
}
```

### 2. DataSourceRequirement

数据源需求定义，统一示例数据字段：

```typescript
export interface DataSourceRequirement {
  key: string
  name: string
  description: string
  supportedTypes: Array<'static' | 'api' | 'websocket' | 'mqtt' | 'database'>
  
  // 🔥 统一标准：只使用 example 字段
  example?: Record<string, any>
  
  fieldMappings?: Record<string, FieldMapping>
  required?: boolean
  updateInterval?: number
  errorHandling?: ErrorHandlingConfig
}
```

### 3. CustomConfig

组件配置对象，支持泛型：

```typescript
export interface CustomConfig<T = Record<string, any>> {
  type: string
  root: {
    transform: {
      rotate: number
      scale: number
    }
  }
  customize: T // 组件特有的配置
}
```

## 🎯 类型使用规范

### 1. 组件定义标准

每个组件的 `definition.ts` 文件应该：

```typescript
import type { ComponentDefinition } from '../../../types'
import type { MyComponentConfig } from './settingConfig'

export const myComponentDefinition: ComponentDefinition<MyComponentConfig> = {
  type: 'my-component',
  name: '我的组件',
  // ... 其他配置
  dataSources: [{
    key: 'primaryData',
    name: '主数据源',
    example: { // 🔥 统一使用 example 字段
      value: 42,
      label: '示例数据'
    }
  }]
}
```

### 2. 设置配置标准

每个组件的 `settingConfig.ts` 文件应该：

```typescript
import type { Setting, CustomConfig } from '@/card2.1/types/setting-config'
import { createSetting, createCustomConfig, SettingControlType } from '@/card2.1/types/setting-config'

// 组件特有的 customize 类型
export interface MyComponentCustomize {
  title: string
  color: string
  size: number
}

// 设置配置
export const myComponentSettingConfig: Setting[] = [
  createSetting(SettingControlType.INPUT, '标题', 'customize.title'),
  createSetting(SettingControlType.COLOR_PICKER, '颜色', 'customize.color'),
  createSetting(SettingControlType.INPUT_NUMBER, '大小', 'customize.size')
]

// 默认配置
export const customConfig = createCustomConfig<MyComponentCustomize>('my-component', {
  title: '默认标题',
  color: '#1890ff',
  size: 16
})

// 导出类型
export type MyComponentConfig = CustomConfig<MyComponentCustomize>
```

### 3. 类型导入标准

统一使用 `types` 目录进行导入：

```typescript
// ✅ 正确
import type { ComponentDefinition, DataSourceRequirement } from '../../../types'

// ❌ 错误 - 不要直接从 core/types 导入
import type { ComponentDefinition } from '../../../core/types'
```

## 🔧 维护任务清单

### ✅ 已完成的标准化任务

1. **统一示例数据字段标准**
   - 所有组件统一使用 `example` 字段
   - 移除重复的 `exampleData` 和 `examples` 字段
   - 更新 ConfigurationPanel 和相关组件

2. **类型定义增强**
   - 扩展 ComponentDefinition 支持泛型
   - 添加布局和渲染系统类型
   - 完善数据绑定和交互类型

3. **类型引用统一**
   - 创建统一的 `types/index.ts` 导出
   - 更新所有组件定义中的类型引用
   - 确保导入路径一致性

### 🔄 持续维护任务

1. **类型验证**
   - 定期运行 `pnpm typecheck` 确保类型正确
   - 检查新组件是否遵循类型标准
   - 验证示例数据字段统一性

2. **文档更新**
   - 保持类型文档与代码同步
   - 更新组件开发指南
   - 维护类型变更记录

3. **向后兼容**
   - 保留必要的遗留字段以支持现有组件
   - 提供迁移指南帮助旧组件升级
   - 渐进式类型增强

## 📊 类型系统特性

### 支持的特性

- ✅ TypeScript 严格模式
- ✅ 泛型组件配置
- ✅ 多渲染器支持
- ✅ 交互系统集成
- ✅ 数据绑定机制
- ✅ 生命周期钩子
- ✅ 性能优化配置
- ✅ 布局系统集成

### 版本信息

- **当前版本**: 2.1.0
- **类型系统版本**: 2.1.0
- **兼容性**: 向后兼容 Card2.0

## 🚨 注意事项

1. **示例数据标准**
   - 必须使用 `example` 字段，不使用其他变体
   - 示例数据应该反映真实的数据结构
   - 提供清晰、有意义的示例值

2. **类型安全**
   - 避免使用 `any` 类型
   - 充分利用泛型提供类型推断
   - 确保所有组件配置都有明确的类型定义

3. **导入规范**
   - 统一从 `types` 目录导入类型
   - 使用 `import type` 进行仅类型导入
   - 避免循环依赖

4. **向后兼容**
   - 新增字段使用可选类型
   - 保留必要的遗留字段
   - 提供清晰的迁移路径

## 📝 开发建议

1. **新组件开发**
   - 使用最新的类型定义模板
   - 确保示例数据完整性
   - 遵循三文件结构标准

2. **现有组件维护**
   - 渐进式迁移到新类型系统
   - 优先修复类型错误
   - 更新示例数据格式

3. **类型定义扩展**
   - 新增类型应在 `core/types.ts` 中定义
   - 更新统一导出文件
   - 提供完整的 JSDoc 文档

---

**维护者**: ThingsPanel 开发团队  
**最后更新**: 2024-09-10  
**下次检查**: 2024-10-10