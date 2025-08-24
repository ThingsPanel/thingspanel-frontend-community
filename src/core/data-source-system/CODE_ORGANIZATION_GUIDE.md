# 数据源系统代码组织指南

## 🎯 重构目标

将混乱的代码结构重新组织，实现：
- 清晰的组件职责分离
- 减少代码重复
- 提高可维护性
- 修复类型错误

## 📁 建议的文件结构

```
src/core/data-source-system/
├── components/
│   ├── DataSourceConfigForm.vue          # 主配置表单（简化版）
│   ├── modals/
│   │   ├── AddRawDataModal.vue          # 添加/编辑数据项弹窗
│   │   ├── FinalDataModal.vue           # 查看最终数据弹窗
│   │   └── RawDataDetailModal.vue       # 查看原始数据详情弹窗
│   └── common/
│       ├── DataItemList.vue             # 数据项列表组件
│       ├── FinalProcessingConfig.vue    # 最终处理配置组件
│       └── HttpConfigPanel.vue          # HTTP配置面板组件
├── composables/
│   ├── useDataSourceConfig.ts           # 数据源配置逻辑
│   ├── useRawDataManagement.ts          # 原始数据管理逻辑
│   ├── useFinalProcessing.ts            # 最终处理逻辑
│   └── useHttpDataSource.ts             # HTTP数据源逻辑
├── types/
│   ├── index.ts                         # 主要类型定义
│   ├── data-source.ts                   # 数据源相关类型
│   └── processing.ts                    # 数据处理相关类型
└── utils/
    ├── data-processor.ts                # 数据处理工具
    ├── http-client.ts                   # HTTP客户端工具
    └── script-engine.ts                 # 脚本引擎工具
```

## 🔧 重构步骤

### 第一步：清理重复代码

1. **删除 `DataSourceConfigForm copy.vue`**
   - 这个文件是重复的，应该删除
   - 保留 `DataSourceConfigForm.vue` 作为主文件

2. **提取公共逻辑到 composables**
   - 将复杂的状态管理逻辑提取到 `useDataSourceConfig.ts`
   - 将数据处理逻辑提取到 `useDataProcessor.ts`

### 第二步：组件职责分离

1. **DataSourceConfigForm.vue** - 主容器组件
   - 负责整体布局和数据源列表
   - 调用子组件处理具体功能
   - 管理全局状态

2. **AddRawDataModal.vue** - 数据项管理弹窗
   - 添加/编辑原始数据项
   - 支持JSON、HTTP、WebSocket类型
   - 独立的数据预览和处理

3. **FinalProcessingConfig.vue** - 最终处理配置
   - 处理方式选择（合并、连接、脚本等）
   - 脚本编辑器
   - 处理结果预览

### 第三步：类型安全改进

1. **修复所有 TypeScript 错误**
   - 添加适当的类型注解
   - 使用类型守卫处理可能为空的值
   - 统一错误处理类型

2. **改进类型定义**
   - 使用联合类型替代字符串字面量
   - 添加泛型支持
   - 完善接口定义

## 🚀 具体重构建议

### 1. 状态管理优化

```typescript
// useDataSourceConfig.ts
export function useDataSourceConfig() {
  const dataValues = reactive<Record<string, DataSourceValue>>({})
  const processingStatus = reactive<Record<string, ProcessingStatus>>({})
  
  // 统一的状态管理方法
  const updateDataSource = (key: string, updates: Partial<DataSourceValue>) => {
    if (!dataValues[key]) {
      dataValues[key] = createDefaultDataSourceValue()
    }
    Object.assign(dataValues[key], updates)
  }
  
  return {
    dataValues,
    processingStatus,
    updateDataSource
  }
}
```

### 2. 组件通信优化

```typescript
// 使用 provide/inject 替代 props drilling
// DataSourceConfigForm.vue
provide('dataSourceContext', {
  dataValues,
  updateDataSource,
  processFinalData
})

// 子组件中
const { dataValues, updateDataSource } = inject('dataSourceContext')
```

### 3. 错误处理统一化

```typescript
// utils/error-handler.ts
export class DataSourceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DataSourceError'
  }
}

export function handleDataSourceError(error: unknown): DataSourceError {
  if (error instanceof DataSourceError) {
    return error
  }
  
  if (error instanceof Error) {
    return new DataSourceError(error.message, 'UNKNOWN_ERROR', error)
  }
  
  return new DataSourceError(String(error), 'UNKNOWN_ERROR', error)
}
```

## 📋 重构检查清单

- [ ] 删除重复文件
- [ ] 修复所有 TypeScript 错误
- [ ] 提取公共逻辑到 composables
- [ ] 重构组件结构
- [ ] 统一错误处理
- [ ] 添加单元测试
- [ ] 更新文档

## 🎨 代码风格规范

1. **命名规范**
   - 组件名：PascalCase
   - 文件名：kebab-case
   - 变量名：camelCase
   - 常量名：UPPER_SNAKE_CASE

2. **注释规范**
   - 复杂逻辑添加中文注释
   - 使用 JSDoc 格式
   - 重要函数说明参数和返回值

3. **错误处理**
   - 使用 try-catch 包装异步操作
   - 提供有意义的错误信息
   - 记录错误日志

## 🔍 性能优化建议

1. **防抖处理**
   - 用户输入操作使用防抖
   - 避免频繁的API调用

2. **虚拟滚动**
   - 大量数据项使用虚拟滚动
   - 减少DOM节点数量

3. **懒加载**
   - 弹窗内容按需加载
   - 减少初始包大小

## 📚 学习资源

- Vue 3 Composition API 最佳实践
- TypeScript 高级类型技巧
- 组件设计模式
- 状态管理架构

---

通过以上重构，代码将变得更加清晰、可维护，同时保持功能的完整性。
