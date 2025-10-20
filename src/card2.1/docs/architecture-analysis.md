# Card2.1 架构分析文档

## 目录结构总览

```
src/card2.1/
├── index.ts                    # 系统主入口
├── components/                 # 组件目录
│   ├── index.ts               # 组件统一导出
│   ├── category-mapping.ts    # 分类映射
│   ├── chart/                 # 图表组件
│   │   ├── alarm/            # 告警相关
│   │   ├── data/             # 数据展示
│   │   └── ...               # 其他图表
│   ├── common/               # 通用组件
│   │   └── generic-card/     # 通用卡片组件
│   └── system/               # 系统组件
│       ├── alarm-management/ # 告警管理
│       ├── device-status/    # 设备状态
│       ├── system-monitoring/# 系统监控
│       └── ...               # 其他系统组件
├── core/                      # 核心模块
│   ├── index.ts              # 核心模块导出
│   ├── auto-registry.ts      # 自动注册系统
│   ├── component-registry.ts # 组件注册表
│   ├── types.ts              # 核心类型定义
│   ├── PropertyExposureManager.ts # 属性暴露管理
│   ├── permission-utils.ts   # 权限工具
│   ├── data-source/          # 数据源系统
│   │   ├── data-binding-manager.ts
│   │   ├── reactive-data-manager.ts
│   │   └── ...
│   └── interaction-*.ts      # 交互系统
├── hooks/                     # React Hooks
│   ├── index.ts
│   ├── useComponentTree.ts   # 组件树管理
│   └── useCard2Props.ts      # 属性管理
├── types/                     # 类型定义
│   ├── index.ts              # 统一类型导出
│   ├── setting-config.ts     # 设置配置类型
│   └── interaction-*.ts     # 交互类型
├── integration/              # 集成模块
│   └── visual-editor-config.ts
└── docs/                      # 文档目录
```

## 模块依赖关系分析

### 1. 核心入口模块 (`index.ts`)
**功能**: 系统主入口，负责初始化整个 Card2.1 系统
**依赖关系**:
- `@/card2.1/core/component-registry` - 组件注册表
- `@/card2.1/core/auto-registry` - 自动注册系统
- `@/card2.1/core/permission-watcher` - 权限监听

**对外提供**:
- `initializeCard2System()` - 系统初始化
- `getComponentTree()` - 获取组件树
- `componentRegistry` - 组件注册表实例

### 2. 组件模块 (`components/`)
**功能**: 存放所有可视化组件
**组件结构模式**:
```
组件目录/
├── index.ts          # 组件导出文件
├── definition.ts     # 组件定义
├── component.vue    # Vue组件实现
├── setting.vue      # 设置界面
└── settingConfig.ts # 设置配置
```

**关键组件示例**:
- `digit-indicator` (数字指示器)
- `alarm-count` (告警计数)
- `cpu-usage` (CPU使用率)
- `generic-card` (通用卡片)

### 3. 核心模块 (`core/`)
**功能**: 提供核心系统功能

#### 3.1 组件注册系统
- `component-registry.ts` - 组件注册管理
- `auto-registry.ts` - 自动扫描注册
- `PropertyExposureManager.ts` - 属性暴露管理

#### 3.2 数据源系统
- `data-binding-manager.ts` - 数据绑定管理
- `reactive-data-manager.ts` - 响应式数据管理
- `static-data-source.ts` - 静态数据源

#### 3.3 交互系统
- `interaction-manager.ts` - 交互管理
- `interaction-adapter.ts` - 交互适配器
- `interaction-types.ts` - 交互类型定义

### 4. Hooks 模块 (`hooks/`)
**功能**: 提供 React/Vue 集成接口
- `useComponentTree.ts` - 组件树管理 Hook
- `useCard2Props.ts` - 属性管理 Hook

### 5. 类型模块 (`types/`)
**功能**: 统一类型定义系统
- 组件定义类型
- 设置配置类型
- 交互系统类型
- 数据源类型

## 引用关系分析

### 内部引用关系

1. **组件 → 核心类型**
   - 所有组件定义文件都引用 `@/card2.1/core/types`
   - 示例: `import type { ComponentDefinition } from '@/card2.1/core/types'`

2. **核心模块间引用**
   - `component-registry.ts` → `PropertyExposureManager.ts` (动态导入)
   - `auto-registry.ts` → `component-registry.ts`
   - `data-binding-manager.ts` → `component-registry.ts`

3. **Hooks → 核心功能**
   - `useComponentTree.ts` → `@/card2.1/index` (系统入口)
   - `useCard2Props.ts` → `PropertyExposureManager.ts`

### 外部引用关系

1. **主应用引用**
   - `src/main.ts` - 应用启动时初始化 Card2.1 系统
   - `src/store/modules/visual-editor/card2-adapter.ts` - 可视化编辑器适配

2. **可视化编辑器集成**
   - `src/components/visual-editor/` - 多个文件引用 Card2.1 系统
   - `src/features/iot-visualization/` - IoT可视化功能集成

3. **交互系统集成**
   - `src/core/interaction-system/` - 交互系统组件引用

## 架构特点分析

### 1. 模块化设计
- **清晰的层次结构**: 入口 → 核心 → 组件 → 集成
- **职责分离**: 注册、数据、交互、UI 分离
- **插件化架构**: 支持动态组件注册

### 2. 类型安全
- **完整的 TypeScript 支持**
- **泛型组件配置**
- **严格的类型约束**

### 3. 自动注册系统
- **目录扫描**: 自动发现组件
- **分类管理**: 基于路径的自动分类
- **权限过滤**: 基于用户角色的组件过滤

### 4. 属性暴露系统
- **白名单机制**: 安全的属性访问控制
- **权限分级**: public/protected/private 三级权限
- **审计日志**: 属性访问和修改记录

### 5. 数据绑定系统
- **多数据源支持**: static/api/websocket/mqtt
- **响应式更新**: 实时数据同步
- **字段映射**: 灵活的数据字段映射

## 存在的问题和改进建议

### 已修复的问题
1. ✅ 路径解析错误 - 相对路径改为绝对路径
2. ✅ 类型定义不完整 - 添加缺失的属性定义
3. ✅ 导入错误 - 移除不存在的导入
4. ✅ 调试代码清理 - 生产环境优化

### 待优化问题
1. ⚠️ 循环依赖风险 - 需要进一步优化模块间引用
2. ⚠️ 权限检查逻辑 - 支持动态权限变化
3. ⚠️ 端口隔离复杂性 - 简化多环境支持

### 架构改进建议
1. **依赖注入**: 引入依赖注入容器管理模块依赖
2. **事件总线**: 使用事件驱动架构解耦模块
3. **配置中心**: 统一管理系统配置
4. **性能监控**: 添加系统性能监控指标

## 总结

Card2.1 是一个设计良好的组件化架构系统，具备完整的组件管理、数据绑定、权限控制和交互能力。系统采用模块化设计，类型安全，支持自动注册和动态扩展。通过持续的架构优化，可以进一步提升系统的稳定性和可维护性。