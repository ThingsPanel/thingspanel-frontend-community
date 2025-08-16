# 新统一架构集成指南

## 🔥 概述

全新的统一Visual Editor架构已完成开发，提供了完整的解决方案来解决原有分散架构的数据管理混乱问题。本指南将帮助你理解和使用新架构。

## 🏗️ 核心架构组件

### 1. 统一状态管理 (`unified-editor.ts`)
- **作用**: 替代原有的双重状态存储，提供唯一数据源
- **解决问题**: 状态不一致、数据同步困难
- **关键特性**: 
  - 分层配置管理
  - Card2.1组件集成
  - 运行时数据管理

### 2. 配置服务类 (`configuration-service.ts`) 
- **作用**: 统一的配置管理API
- **解决问题**: 分散的ConfigurationManager、缺乏类型安全
- **关键特性**:
  - 类型安全的配置操作
  - 配置验证和迁移
  - 事件驱动的配置变更

### 3. 数据流管理器 (`data-flow-manager.ts`)
- **作用**: 基于action的单向数据流
- **解决问题**: 复杂的数据流、缺乏副作用管理
- **关键特性**:
  - 统一的用户操作处理
  - 副作用管理
  - 错误处理和恢复

### 4. Card2.1集成适配器 (`card2-adapter.ts`)
- **作用**: 标准化的Card2.1组件集成
- **解决问题**: 复杂的转换逻辑、集成不稳定
- **关键特性**:
  - 自动组件定义转换
  - 数据绑定管理
  - 生命周期处理

## 🚀 快速开始

### 基本使用

```typescript
import { useVisualEditor } from '@/store/modules/visual-editor'

// 获取统一编辑器系统
const editor = useVisualEditor()

// 初始化系统
await editor.initialize()

// 添加节点
await editor.addNode({
  id: 'my-node',
  type: 'MyComponent',
  position: { x: 100, y: 100 },
  data: { title: 'My Component' }
})

// 配置组件
await editor.updateConfiguration('my-node', 'component', {
  properties: { text: 'Hello World' },
  style: { width: 300, height: 200 }
})

// 设置数据源
await editor.updateConfiguration('my-node', 'dataSource', {
  type: 'static',
  config: { data: { message: 'Hello' } },
  bindings: { message: { rawData: 'Hello' } }
})
```

### Card2.1组件集成

```typescript
// 注册Card2.1组件
const componentDefinition = {
  type: 'MyCard2Component',
  name: '我的组件',
  // ... 其他定义
}

editor.card2Adapter.registerCard2Component(componentDefinition)

// 组件会自动转换并注册到编辑器
// 数据绑定会自动创建和管理
```

### 监听配置变更

```typescript
// 监听配置变更
const unsubscribe = editor.configService.onConfigurationChange((event) => {
  console.log('配置变更:', event.widgetId, event.section)
})

// 监听数据流更新
const unsubscribeDataFlow = editor.dataFlowManager.onDataFlowUpdate((action) => {
  console.log('数据流更新:', action.type)
})
```

## 🔧 迁移指南

### 从旧架构迁移

```typescript
import { performQuickMigration } from '@/store/modules/visual-editor/migration-helper'

// 自动检查和迁移
const migrationResult = await performQuickMigration()

if (migrationResult.status === 'completed') {
  console.log('迁移成功完成')
} else {
  console.log('迁移结果:', migrationResult.message)
}
```

### 手动迁移步骤

1. **停止使用旧的store**:
   ```typescript
   // ❌ 旧方式
   import { useVisualEditorStore } from '@/store/modules/visual-editor/legacy'
   
   // ✅ 新方式
   import { useVisualEditor } from '@/store/modules/visual-editor'
   ```

2. **更新配置管理**:
   ```typescript
   // ❌ 旧方式
   configurationManager.setConfiguration(id, config)
   
   // ✅ 新方式
   editor.configService.setConfiguration(id, config)
   ```

3. **更新数据操作**:
   ```typescript
   // ❌ 旧方式 - 直接修改状态
   store.nodes.push(newNode)
   
   // ✅ 新方式 - 通过action
   await editor.addNode(newNode)
   ```

## 📋 API 参考

### useVisualEditor()

主要的hook函数，返回统一编辑器系统的实例。

#### 方法

- `initialize()` - 初始化系统
- `addNode(node)` - 添加节点
- `updateConfiguration(id, section, config)` - 更新配置
- `getConfiguration(id)` - 获取配置
- `getRuntimeData(id)` - 获取运行时数据
- `saveAll()` - 保存所有配置
- `getStatus()` - 获取系统状态

#### 属性

- `store` - 统一状态管理实例
- `configService` - 配置服务实例
- `dataFlowManager` - 数据流管理器实例
- `card2Adapter` - Card2.1适配器实例

### 配置类型

```typescript
interface WidgetConfiguration {
  base: BaseConfiguration        // 基础配置
  component: ComponentConfiguration  // 组件配置
  dataSource: DataSourceConfiguration | null  // 数据源配置
  interaction: InteractionConfiguration  // 交互配置
  metadata: Record<string, any>  // 元数据
}
```

## 🧪 测试和验证

### 运行测试

访问 `/test/unified-architecture` 页面可以：

1. **基本功能测试** - 测试系统初始化、节点管理等
2. **Card2.1集成测试** - 测试组件注册和数据绑定
3. **数据流管理测试** - 测试action处理和副作用
4. **配置管理测试** - 测试配置CRUD和持久化
5. **错误处理测试** - 测试错误捕获和恢复
6. **架构迁移测试** - 测试从旧架构迁移

### 集成示例

可以运行 `integration-example.ts` 中的示例：

```typescript
import { IntegrationExamples } from '@/store/modules/visual-editor/integration-example'

// 运行所有示例
await IntegrationExamples.runAll()

// 或者运行单个示例
await IntegrationExamples.basic()
await IntegrationExamples.card2()
```

## ⚠️ 注意事项

### 最佳实践

1. **始终通过editor实例操作** - 不要直接访问底层store
2. **使用TypeScript类型** - 利用类型安全避免错误
3. **监听配置变更** - 及时响应配置变化
4. **处理异步操作** - 所有操作都是异步的
5. **清理事件监听器** - 避免内存泄漏

### 性能优化

1. **批量操作** - 使用 `handleBatchActions` 进行批量更新
2. **副作用管理** - 合理使用副作用处理器
3. **配置缓存** - 配置会自动缓存，避免重复获取
4. **事件节流** - 大量事件时考虑节流处理

### 调试技巧

1. **开启控制台日志** - 系统会输出详细的调试信息
2. **使用Vue DevTools** - 查看Pinia状态变化
3. **监听事件** - 通过事件监听器了解系统状态
4. **系统状态检查** - 使用 `getStatus()` 获取系统状态

## 🔗 相关文件

- [`/src/store/modules/visual-editor/index.ts`](./index.ts) - 主入口文件
- [`/src/store/modules/visual-editor/unified-editor.ts`](./unified-editor.ts) - 统一状态管理
- [`/src/store/modules/visual-editor/configuration-service.ts`](./configuration-service.ts) - 配置服务
- [`/src/store/modules/visual-editor/data-flow-manager.ts`](./data-flow-manager.ts) - 数据流管理
- [`/src/store/modules/visual-editor/card2-adapter.ts`](./card2-adapter.ts) - Card2.1适配器
- [`/src/store/modules/visual-editor/integration-example.ts`](./integration-example.ts) - 集成示例
- [`/src/store/modules/visual-editor/migration-helper.ts`](./migration-helper.ts) - 迁移助手
- [`/src/views/test/UnifiedArchitectureTest.vue`](../../views/test/UnifiedArchitectureTest.vue) - 测试页面

## 🆘 常见问题

### Q: 如何从旧架构迁移？
A: 使用迁移助手自动检查和迁移，或参考迁移指南手动迁移。

### Q: 配置不生效怎么办？
A: 检查配置格式是否正确，使用配置验证功能确保数据完整性。

### Q: Card2.1组件集成失败？
A: 确保组件定义完整，检查数据源配置，使用适配器测试功能。

### Q: 性能问题如何优化？
A: 使用批量操作，合理管理副作用，避免频繁的配置更新。

### Q: 如何调试问题？
A: 开启控制台日志，使用测试页面，监听系统事件了解状态变化。

---

**🔥 重要提示**: 新架构完全向后兼容，可以安全地逐步迁移现有代码。建议先在测试环境验证功能，再在生产环境使用。