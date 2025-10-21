# ThingsPanel 目标目录结构设计

## 🎯 设计原则

### "先集中，后整合"策略
1. **第一阶段 - 集中**: 将分散的功能模块集中到统一位置
2. **第二阶段 - 整合**: 消除重复，建立统一接口
3. **第三阶段 - 优化**: 性能优化和架构简化

### 核心设计理念
- **先集中**: 所有相关系统都集中到 `src/iot-visualization-platform/` 目录下
- **独立性**: 考虑可视化系统将来可能独立使用的需求
- **单一职责**: 每个模块只负责一个明确的功能领域
- **依赖清晰**: 从下到上的清晰依赖链，避免循环依赖
- **可扩展性**: 支持未来功能扩展和第三方集成

---

## 📂 目标目录结构

将三个核心系统完全集中到统一位置：

```
src/
└── 🎯 iot-visualization-platform/      # 物联网可视化平台 - 所有系统集中入口
    │
    ├── 🏗️ core/                       # 核心基础层 (原 src/core)
    │   ├── types/                      # 统一类型系统
    │   │   ├── index.ts                # 类型统一导出
    │   │   ├── component.ts            # 组件相关类型
    │   │   ├── data-source.ts          # 数据源类型
    │   │   ├── configuration.ts        # 配置相关类型
    │   │   ├── renderer.ts             # 渲染器类型
    │   │   └── integration.ts          # 系统集成类型
    │   │
    │   ├── data-engine/                # 统一数据引擎
    │   │   ├── index.ts                # 数据引擎入口
    │   │   ├── data-source-manager.ts  # 数据源管理器
    │   │   ├── data-binding-manager.ts # 数据绑定管理器
    │   │   ├── data-transform-pipeline.ts # 数据转换管道
    │   │   ├── executors/              # 执行器系统
    │   │   │   ├── index.ts
    │   │   │   ├── http-executor.ts
    │   │   │   ├── script-executor.ts
    │   │   │   ├── device-api-executor.ts
    │   │   │   └── static-data-executor.ts
    │   │   ├── processors/             # 数据处理器
    │   │   │   ├── index.ts
    │   │   │   ├── filter-processor.ts
    │   │   │   ├── transform-processor.ts
    │   │   │   └── merge-processor.ts
    │   │   └── cache/                  # 缓存系统
    │   │       ├── index.ts
    │   │       ├── memory-cache.ts
    │   │       └── persistent-cache.ts
    │   │
    │   ├── config-engine/              # 统一配置引擎
    │   │   ├── index.ts                # 配置引擎入口
    │   │   ├── config-manager.ts       # 配置管理器
    │   │   ├── config-validator.ts     # 配置验证器
    │   │   ├── config-transformer.ts   # 配置转换器
    │   │   ├── templates/              # 配置模板
    │   │   │   ├── index.ts
    │   │   │   ├── component-template.ts
    │   │   │   ├── data-source-template.ts
    │   │   │   └── renderer-template.ts
    │   │   └── persistence/            # 配置持久化
    │   │       ├── index.ts
    │   │       ├── local-storage.ts
    │   │       └── remote-storage.ts
    │   │
    │   ├── event-engine/               # 统一事件引擎
    │   │   ├── index.ts                # 事件引擎入口
    │   │   ├── event-bus.ts            # 事件总线
    │   │   ├── event-manager.ts        # 事件管理器
    │   │   ├── listeners/              # 事件监听器
    │   │   │   ├── index.ts
    │   │   │   ├── component-listener.ts
    │   │   │   ├── data-listener.ts
    │   │   │   └── config-listener.ts
    │   │   └── emitters/               # 事件发射器
    │   │       ├── index.ts
    │   │       ├── component-emitter.ts
    │   │       ├── data-emitter.ts
    │   │       └── lifecycle-emitter.ts
    │   │
    │   ├── registry-engine/            # 统一注册引擎
    │   │   ├── index.ts                # 注册引擎入口
    │   │   ├── component-registry.ts   # 组件注册表
    │   │   ├── data-source-registry.ts # 数据源注册表
    │   │   ├── renderer-registry.ts    # 渲染器注册表
    │   │   ├── template-registry.ts    # 模板注册表
    │   │   └── discovery/              # 自动发现
    │   │       ├── index.ts
    │   │       ├── component-discovery.ts
    │   │       └── auto-loader.ts
    │   │
    │   ├── interaction-engine/         # 统一交互引擎
    │   │   ├── index.ts                # 交互引擎入口
    │   │   ├── interaction-manager.ts  # 交互管理器
    │   │   ├── config-registry.ts      # 配置注册表
    │   │   └── components/             # 交互组件
    │   │       ├── index.ts
    │   │       ├── InteractionCardWizard.vue
    │   │       ├── InteractionPreview.vue
    │   │       └── InteractionTemplateSelector.vue
    │   │
    │   ├── script-engine/              # 统一脚本引擎
    │   │   ├── index.ts                # 脚本引擎入口
    │   │   ├── script-engine.ts        # 脚本引擎核心
    │   │   ├── executor.ts             # 脚本执行器
    │   │   ├── sandbox.ts              # 沙箱环境
    │   │   ├── context-manager.ts      # 上下文管理器
    │   │   ├── template-manager.ts     # 模板管理器
    │   │   ├── components/             # 脚本编辑组件
    │   │   │   ├── index.ts
    │   │   │   ├── ScriptEditor.vue
    │   │   │   └── SimpleScriptEditor.vue
    │   │   └── templates/              # 内置模板
    │   │       └── built-in-templates.ts
    │   │
    │   ├── initialization/             # 统一初始化系统
    │   │   ├── index.ts                # 初始化入口
    │   │   ├── system-initializer.ts   # 系统初始化器
    │   │   ├── dependency-resolver.ts  # 依赖解析器
    │   │   ├── lifecycle-manager.ts    # 生命周期管理器
    │   │   └── health-checker.ts       # 健康检查器
    │   │
    │   └── utils/                      # 统一工具库
    │       ├── index.ts                # 工具库入口
    │       ├── validation.ts           # 验证工具
    │       ├── transformation.ts       # 转换工具
    │       ├── performance.ts          # 性能工具
    │       ├── security.ts             # 安全工具
    │       └── debug.ts                # 调试工具
    │
    ├── 🎨 visual-system/               # 可视化系统层 (原 src/components/visual-editor)
    │   ├── editor/                     # 可视化编辑器
    │   │   ├── index.ts                # 编辑器入口
    │   │   ├── editor-core.ts          # 编辑器核心
    │   │   ├── editor-state.ts         # 编辑器状态管理
    │   │   ├── components/             # 编辑器UI组件
    │   │   │   ├── index.ts
    │   │   │   ├── ToolbarComponent.vue
    │   │   │   ├── PropertyPanel.vue
    │   │   │   ├── ComponentLibrary.vue
    │   │   │   ├── CanvasArea.vue
    │   │   │   └── ConfigPanel.vue
    │   │   ├── modes/                  # 编辑器模式
    │   │   │   ├── index.ts
    │   │   │   ├── design-mode.ts
    │   │   │   ├── preview-mode.ts
    │   │   │   └── debug-mode.ts
    │   │   └── plugins/                # 编辑器插件
    │   │       ├── index.ts
    │   │       ├── grid-plugin.ts
    │   │       ├── snap-plugin.ts
    │   │       └── undo-redo-plugin.ts
    │   │
    │   ├── renderers/                  # 渲染器系统
    │   │   ├── index.ts                # 渲染器入口
    │   │   ├── base/                   # 基础渲染器
    │   │   │   ├── index.ts
    │   │   │   ├── BaseRenderer.ts
    │   │   │   ├── RendererManager.ts
    │   │   │   └── RenderContext.ts
    │   │   ├── canvas/                 # 画布渲染器
    │   │   │   ├── index.ts
    │   │   │   ├── CanvasRenderer.vue
    │   │   │   ├── CanvasWrapper.vue
    │   │   │   └── canvas-utils.ts
    │   │   ├── grid/                   # 网格渲染器
    │   │   │   ├── index.ts
    │   │   │   ├── GridRenderer.vue
    │   │   │   ├── GridWrapper.vue
    │   │   │   ├── grid-layout.ts
    │   │   │   └── grid-utils.ts
    │   │   └── layout/                 # 布局渲染器
    │   │       ├── index.ts
    │   │       ├── FlexRenderer.vue
    │   │       ├── AbsoluteRenderer.vue
    │   │       └── layout-utils.ts
    │   │
    │   ├── layout-engine/              # 布局引擎
    │   │   ├── index.ts                # 布局引擎入口
    │   │   ├── layout-manager.ts       # 布局管理器
    │   │   ├── layout-calculator.ts    # 布局计算器
    │   │   ├── responsive-handler.ts   # 响应式处理
    │   │   ├── algorithms/             # 布局算法
    │   │   │   ├── index.ts
    │   │   │   ├── grid-algorithm.ts
    │   │   │   ├── flex-algorithm.ts
    │   │   │   └── absolute-algorithm.ts
    │   │   └── constraints/            # 布局约束
    │   │       ├── index.ts
    │   │       ├── size-constraints.ts
    │   │       ├── position-constraints.ts
    │   │       └── collision-detection.ts
    │   │
    │   └── visual-interaction/         # 可视化交互系统
    │       ├── index.ts                # 可视化交互入口
    │       ├── drag-drop-manager.ts    # 拖放管理器
    │       ├── selection-manager.ts    # 选择管理器
    │       ├── resize-manager.ts       # 调整大小管理器
    │       ├── gesture-handler.ts      # 手势处理器
    │       ├── keyboard-handler.ts     # 键盘处理器
    │       ├── mouse-handler.ts        # 鼠标处理器
    │       ├── touch-handler.ts        # 触摸处理器
    │       └── commands/               # 可视化交互命令
    │           ├── index.ts
    │           ├── DragCommand.ts
    │           ├── ResizeCommand.ts
    │           ├── SelectCommand.ts
    │           └── DeleteCommand.ts
    │
    ├── 🧩 component-system/            # 组件系统层 (原 src/card2.1)
    │   ├── framework/                  # 组件框架
    │   │   ├── index.ts                # 组件框架入口
    │   │   ├── component-base.ts       # 组件基类
    │   │   ├── component-lifecycle.ts  # 组件生命周期
    │   │   ├── component-props.ts      # 组件属性系统
    │   │   ├── component-events.ts     # 组件事件系统
    │   │   ├── component-slots.ts      # 组件插槽系统
    │   │   └── component-validator.ts  # 组件验证器
    │   │
    │   ├── library/                    # 组件库
    │   │   ├── index.ts                # 组件库入口
    │   │   ├── categories.ts           # 组件分类
    │   │   ├── statistics/             # 统计组件
    │   │   │   ├── index.ts
    │   │   │   ├── AccessCounter/
    │   │   │   │   ├── index.ts
    │   │   │   │   ├── AccessCounter.vue
    │   │   │   │   ├── AccessCounterConfig.vue
    │   │   │   │   └── access-counter.types.ts
    │   │   │   └── AppDownload/
    │   │   │       ├── index.ts
    │   │   │       ├── AppDownload.vue
    │   │   │       ├── AppDownloadConfig.vue
    │   │   │       └── app-download.types.ts
    │   │   ├── dashboard/              # 仪表板组件
    │   │   │   ├── index.ts
    │   │   │   └── GaugeDashboard/
    │   │   │       ├── index.ts
    │   │   │       ├── GaugeDashboard.vue
    │   │   │       ├── GaugeConfig.vue
    │   │   │       └── gauge.types.ts
    │   │   ├── charts/                 # 图表组件
    │   │   │   ├── index.ts
    │   │   │   ├── BarChart/
    │   │   │   ├── LineChart/
    │   │   │   └── PieChart/
    │   │   ├── controls/               # 控制组件
    │   │   │   ├── index.ts
    │   │   │   ├── Switch/
    │   │   │   ├── Slider/
    │   │   │   └── Button/
    │   │   └── displays/               # 显示组件
    │   │       ├── index.ts
    │   │       ├── TextDisplay/
    │   │       ├── ImageDisplay/
    │   │       └── VideoPlayer/
    │   │
    │   ├── loader/                     # 组件加载器
    │   │   ├── index.ts                # 加载器入口
    │   │   ├── component-loader.ts     # 组件加载器
    │   │   ├── lazy-loader.ts          # 懒加载器
    │   │   ├── async-loader.ts         # 异步加载器
    │   │   └── cache-loader.ts         # 缓存加载器
    │   │
    │   ├── builder/                    # 组件构建器
    │   │   ├── index.ts                # 构建器入口
    │   │   ├── component-builder.ts    # 组件构建器
    │   │   ├── template-builder.ts     # 模板构建器
    │   │   ├── config-builder.ts       # 配置构建器
    │   │   └── instance-builder.ts     # 实例构建器
    │   │
    │   └── integration/                # 组件集成
    │       ├── index.ts                # 集成入口
    │       ├── vue-integration.ts      # Vue集成
    │       ├── data-integration.ts     # 数据集成
    │       ├── config-integration.ts   # 配置集成
    │       └── event-integration.ts    # 事件集成
    │
    ├── 🗄️ store/                       # 状态管理层
    │   ├── index.ts                    # 状态管理入口
    │   ├── root-store.ts               # 根状态存储
    │   ├── modules/                    # 状态模块
    │   │   ├── index.ts
    │   │   ├── editor/                 # 编辑器状态
    │   │   │   ├── index.ts
    │   │   │   ├── editor-state.ts
    │   │   │   ├── editor-actions.ts
    │   │   │   ├── editor-getters.ts
    │   │   │   └── editor-mutations.ts
    │   │   ├── components/             # 组件状态
    │   │   │   ├── index.ts
    │   │   │   ├── component-state.ts
    │   │   │   ├── component-actions.ts
    │   │   │   └── component-getters.ts
    │   │   ├── data/                   # 数据状态
    │   │   │   ├── index.ts
    │   │   │   ├── data-state.ts
    │   │   │   ├── data-actions.ts
    │   │   │   └── data-getters.ts
    │   │   └── config/                 # 配置状态
    │   │       ├── index.ts
    │   │       ├── config-state.ts
    │   │       ├── config-actions.ts
    │   │       └── config-getters.ts
    │   ├── persistence/                # 状态持久化
    │   │   ├── index.ts
    │   │   ├── local-persistence.ts
    │   │   ├── session-persistence.ts
    │   │   └── remote-persistence.ts
    │   └── middleware/                 # 状态中间件
    │       ├── index.ts
    │       ├── logger-middleware.ts
    │       ├── persistence-middleware.ts
    │       └── sync-middleware.ts
    │
    ├── 🌐 views/                       # 视图页面层
    │   ├── visualization/              # 可视化页面
    │   │   ├── index.ts
    │   │   ├── editor-page/            # 编辑器页面
    │   │   │   ├── index.vue
    │   │   │   ├── EditorLayout.vue
    │   │   │   └── editor-page.types.ts
    │   │   ├── preview-page/           # 预览页面
    │   │   │   ├── index.vue
    │   │   │   ├── PreviewLayout.vue
    │   │   │   └── preview-page.types.ts
    │   │   └── dashboard-page/         # 仪表板页面
    │   │       ├── index.vue
    │   │       ├── DashboardLayout.vue
    │   │       └── dashboard-page.types.ts
    │   └── management/                 # 管理页面
    │       ├── index.ts
    │       ├── project-management/     # 项目管理
    │       ├── component-management/   # 组件管理
    │       └── template-management/    # 模板管理
    │
    ├── 🔧 services/                    # 服务层
    │   ├── index.ts                    # 服务层入口
    │   ├── api/                        # API服务
    │   │   ├── index.ts
    │   │   ├── project-api.ts
    │   │   ├── component-api.ts
    │   │   ├── data-source-api.ts
    │   │   └── template-api.ts
    │   ├── data/                       # 数据服务
    │   │   ├── index.ts
    │   │   ├── data-fetch-service.ts
    │   │   ├── data-cache-service.ts
    │   │   └── data-sync-service.ts
    │   └── config/                     # 配置服务
    │       ├── index.ts
    │       ├── config-load-service.ts
    │       ├── config-save-service.ts
    │       └── config-sync-service.ts
    │
    ├── 🛠️ utils/                       # 工具层
    │   ├── index.ts                    # 工具层入口
    │   ├── common/                     # 通用工具
    │   │   ├── index.ts
    │   │   ├── object-utils.ts
    │   │   ├── array-utils.ts
    │   │   ├── string-utils.ts
    │   │   └── date-utils.ts
    │   ├── validation/                 # 验证工具
    │   │   ├── index.ts
    │   │   ├── schema-validator.ts
    │   │   ├── type-validator.ts
    │   │   └── format-validator.ts
    │   └── performance/                # 性能工具
    │       ├── index.ts
    │       ├── lazy-loading.ts
    │       ├── debounce.ts
    │       └── throttle.ts
    │
    ├── 🎛️ hooks/                       # Hooks层
    │   ├── index.ts                    # Hooks入口
    │   ├── core/                       # 核心Hooks
    │   │   ├── index.ts
    │   │   ├── useSystemCore.ts
    │   │   ├── useRegistryEngine.ts
    │   │   └── useDataEngine.ts
    │   ├── visual/                     # 可视化Hooks
    │   │   ├── index.ts
    │   │   ├── useVisualEditor.ts
    │   │   ├── useRenderer.ts
    │   │   └── useLayoutEngine.ts
    │   ├── component/                  # 组件Hooks
    │   │   ├── index.ts
    │   │   ├── useComponentSystem.ts
    │   │   ├── useComponentBuilder.ts
    │   │   └── useComponentIntegration.ts
    │   └── data/                       # 数据Hooks
    │       ├── index.ts
    │       ├── useDataBinding.ts
    │       ├── useDataSource.ts
    │       └── useDataTransform.ts
    │
    └── 📝 types/                       # 全局类型层
        ├── index.ts                    # 全局类型入口
        ├── global.d.ts                 # 全局类型声明
        ├── api.d.ts                    # API类型声明
        ├── component.d.ts              # 组件类型声明
        └── integration.d.ts            # 集成类型声明
```

---

## 🔄 迁移路径规划

### 阶段一：集中迁移 (2-3周)

#### 1.1 核心系统集中
```bash
# 将现有三大系统迁移到新结构
src/card2.1/ → src/iot-visualization-platform/component-system/
src/components/visual-editor/ → src/iot-visualization-platform/visual-system/
src/core/ → src/iot-visualization-platform/core/
```

#### 1.2 相关文件集中
```bash
# 将所有相关文件也集中到 iot-visualization-platform 下
相关store模块 → src/iot-visualization-platform/store/
相关views → src/iot-visualization-platform/views/
相关services → src/iot-visualization-platform/services/
相关utils → src/iot-visualization-platform/utils/
相关hooks → src/iot-visualization-platform/hooks/
```

### 阶段二：接口整合 (3-4周)

#### 2.1 创建统一入口
- **物联网可视化平台入口**: `src/iot-visualization-platform/index.ts`
- **核心系统入口**: `src/iot-visualization-platform/core/index.ts`
- **可视化系统入口**: `src/iot-visualization-platform/visual-system/index.ts`
- **组件系统入口**: `src/iot-visualization-platform/component-system/index.ts`

#### 2.2 建立统一引擎
- **数据引擎**: 整合所有数据相关功能
- **配置引擎**: 整合所有配置管理功能
- **注册引擎**: 整合所有组件注册功能
- **事件引擎**: 整合所有事件处理功能
- **交互引擎**: 整合所有交互相关功能
- **脚本引擎**: 整合所有脚本执行功能

#### 2.3 路径重定向
- 建立从原路径到新路径的重定向
- 逐步更新所有引用
- 保持向后兼容性

### 阶段三：优化简化 (2-3周)

#### 3.1 移除冗余代码
- 删除重复的工具函数
- 合并相似的处理逻辑
- 清理无用的适配器

#### 3.2 独立性准备
- 确保 `iot-visualization-platform` 内部依赖清晰
- 建立标准的对外接口
- 为将来可能的独立使用做准备

---

## 📋 关键设计决策

### 1. 完全集中原则
- **所有内容集中**: 将三个系统的所有相关内容都集中到 `src/iot-visualization-platform/` 下
- **独立性考虑**: 整个 `iot-visualization-platform` 目录可以作为独立模块使用
- **清晰边界**: 与 src 下其他模块有明确的边界划分

### 2. 内部分层架构
```
应用层 (views, services) 
    ↓ 
系统层 (visual-system, component-system)
    ↓ 
核心层 (core)
    ↓ 
基础层 (utils, types, hooks)
```

### 3. 统一入口设计
- **单一入口**: `src/iot-visualization-platform/index.ts` 作为唯一对外接口
- **内部模块化**: 各子系统保持独立的入口文件
- **按需导出**: 支持按需导入和全量导入

### 4. 迁移兼容性
- **渐进式迁移**: 分阶段迁移，保证系统稳定
- **路径兼容**: 提供旧路径的重定向机制
- **功能连续性**: 确保迁移过程中功能不中断

---

## ⚠️ 风险控制

### 集中化风险
1. **模块过大**: 通过清晰的内部结构和接口设计避免
2. **依赖复杂**: 严格控制依赖方向，禁止循环依赖
3. **维护困难**: 建立完善的文档和测试体系

### 迁移风险
1. **功能中断**: 分阶段迁移，保持功能连续性
2. **路径错误**: 建立自动化测试验证所有路径
3. **依赖缺失**: 详细检查所有依赖关系

### 独立性风险
1. **耦合过紧**: 设计清晰的对外接口
2. **依赖外部**: 尽量减少对 src 外部模块的依赖
3. **配置复杂**: 提供简单的初始化和配置机制

---

*文档创建时间: 2025-01-11*
*设计者: Claude Code Assistant*
*版本: 集中化设计v2.0*