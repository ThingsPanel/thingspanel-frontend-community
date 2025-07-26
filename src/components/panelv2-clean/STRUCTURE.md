# PanelV2-Clean 目录结构说明

## 总体架构

PanelV2-Clean 采用革命性两层架构设计，目录结构严格按照架构分层：

```
panelv2-clean/
├── 📖 文档层 (Documentation Layer)
├── 🏗️  第一层：纯净编辑器底座 (Pure Infrastructure Layer)
├── ⚙️  第二层：专业引擎层 (Professional Engine Layer)
├── 🎨 渲染器层 (Renderer Layer)
├── 📋 类型定义层 (Type Definition Layer)
├── 🧪 演示层 (Demo Layer)
└── 🔌 插件层 (Plugin Layer)
```

---

## 📖 文档层 (Documentation Layer)

### 根目录文档文件
```
├── README.md           # 项目概述和快速开始指南
├── PROGRESS.md         # 开发进度记录和任务跟踪
├── STRUCTURE.md        # 目录结构详细说明（当前文档）
└── DECISIONS.md        # 技术决策记录和架构选择
```

**职责说明**：
- README.md：项目整体介绍，技术栈，使用方法
- PROGRESS.md：实时跟踪开发进度，任务状态，下步计划
- STRUCTURE.md：详细解释每个目录和文件的作用
- DECISIONS.md：记录重要的技术决策和原因

---

## 🏗️ 第一层：纯净编辑器底座 (core/)

### 职责：UI布局管理 + 数据传递管道

```
core/
├── PureLayoutManager.vue        # 纯UI布局管理器
├── PureDataPipeline.ts          # 纯净数据传递管道
├── LifecycleManager.ts          # 生命周期管理器
├── EventBus.ts                  # 全局事件总线
└── interfaces/                  # 核心接口定义
    ├── PureLayout.ts            # 布局管理接口
    ├── DataPipeline.ts          # 数据管道接口
    └── Lifecycle.ts             # 生命周期接口
```

**关键特性**：
- ✅ 管理toolbar/sidebar/canvas/inspector四大区域布局
- ✅ 响应式断点和自适应布局
- ✅ 数据总线和事件总线
- ✅ 生命周期管理和状态同步
- ❌ **绝不涉及**：业务逻辑、渲染实现、配置细节、主题样式

### PureLayoutManager.vue 组件结构
```vue
<template>
  <!-- 响应式四区域布局容器 -->
  <div class="pure-layout-manager" :class="layoutClasses">
    <!-- 工具栏区域 -->
    <div v-if="config.toolbar.visible" class="layout-toolbar">
      <slot name="toolbar" :region="regions.toolbar" />
    </div>
    
    <!-- 主内容区域 -->
    <div class="layout-main">
      <!-- 左侧边栏 -->
      <div v-if="config.sidebar.visible" class="layout-sidebar">
        <slot name="sidebar" :region="regions.sidebar" />
      </div>
      
      <!-- 画布区域 -->
      <div class="layout-canvas">
        <slot name="canvas" :region="regions.canvas" />
      </div>
      
      <!-- 右侧检查器 -->
      <div v-if="config.inspector.visible" class="layout-inspector">
        <slot name="inspector" :region="regions.inspector" />
      </div>
    </div>
  </div>
</template>
```

---

## ⚙️ 第二层：专业引擎层 (engines/)

### 职责：各种专业"引擎"的具体实现

```
engines/
├── NodeRegistryEngine.ts        # 节点注册引擎 - 管理组件树形结构
├── RenderEngine.ts              # 渲染引擎 - 当前GridStack布局引擎
├── ConfigEngine.ts              # 配置引擎 - JSON Schema驱动表单生成器
├── ToolEngine.ts                # 工具引擎 - 可扩展工具集和快捷键管理
├── ThemeEngine.ts               # 主题引擎 - 响应外部主题系统适配接口
├── DataEngine.ts                # 数据引擎 - 节点数据管理、状态同步、变更监听
└── interfaces/                  # 引擎接口定义
    ├── NodeRegistry.ts          # 节点注册接口
    ├── Render.ts                # 渲染引擎接口
    ├── Config.ts                # 配置引擎接口
    ├── Tool.ts                  # 工具引擎接口
    ├── Theme.ts                 # 主题引擎接口
    └── Data.ts                  # 数据引擎接口
```

### 各引擎详细职责

#### 🎯 NodeRegistryEngine（节点注册引擎）
```typescript
interface NodeRegistryEngine {
  // 组件注册表管理
  registry: Map<string, ComponentDefinition>
  // 分类映射和搜索索引
  categories: Map<string, CategoryDefinition>
  // 树形结构生成（用于左侧面板显示）
  generateTree(): CategoryTreeNode[]
}
```

#### 🎯 RenderEngine（渲染引擎）
```typescript
interface RenderEngine {
  // 当前激活的渲染器（GridStack/ThreeJS/SVG等）
  currentRenderer: CanvasRenderer
  // 渲染器切换和管理
  switchRenderer(type: string): Promise<void>
  // 节点操作（添加、更新、删除）
  addNode(node: NodeData): Promise<void>
}
```

#### 🎯 ConfigEngine（配置引擎）
```typescript
interface ConfigEngine {
  // 根据Schema渲染动态表单
  renderForm(schema: ConfigSchemaDefinition): VNode
  // 表单数据双向绑定
  bindData(schema: ConfigSchemaDefinition, data: Ref<any>): FormBinding
  // 实时验证系统
  validate(schema: ConfigSchemaDefinition, data: any): ValidationResult
}
```

---

## 🎨 渲染器层 (renderers/)

### 职责：具体渲染器的实现

```
renderers/
├── GridStackRenderer.ts         # GridStack渲染器实现
├── ThreeJSRenderer.ts          # 3D渲染器实现（预留）
├── SVGRenderer.ts              # SVG渲染器实现（预留）
└── interfaces/                 # 渲染器接口
    ├── CanvasRenderer.ts       # 通用渲染器接口
    ├── GridStackTypes.ts       # GridStack特有类型
    └── RendererFactory.ts      # 渲染器工厂
```

### GridStackRenderer 核心实现
```typescript
class GridStackRenderer implements CanvasRenderer {
  readonly type = 'gridstack'
  private gridstack: GridStack
  
  // GridStack特有配置
  updateGridConfig(config: {
    columns?: number
    cellHeight?: number | 'auto'
    margin?: number
    animate?: boolean
  }): void
  
  // 响应式支持
  setResponsiveMode(enabled: boolean): void
  updateBreakpoints(breakpoints: ResponsiveBreakpoints): void
}
```

---

## 📋 类型定义层 (types/)

### 职责：完整的TypeScript类型系统

```
types/
├── core.ts                     # 核心数据结构类型
├── engines.ts                  # 引擎相关类型
├── data.ts                     # 数据模型类型
├── config.ts                   # 配置系统类型
├── events.ts                   # 事件系统类型
└── plugins.ts                  # 插件系统类型
```

### 核心数据结构示例
```typescript
// 整体看板数据结构
interface PanelV2Data {
  meta: PanelMeta                    // 看板元信息
  config: PanelConfig               // 看板级配置
  nodes: NodeData[]                 // 节点数据集合
  runtime: RuntimeState             // 运行时状态（不持久化）
  extensions?: Record<string, any>   // 扩展数据
}

// 节点数据结构
interface NodeData {
  id: string                        // 基础标识
  type: string                      // 对应ComponentDefinition的type
  layout: NodeLayout               // 布局信息（由渲染引擎管理）
  config: {                        // 节点配置（分层设计）
    base: NodeBaseConfig           // 基础配置
    interaction: NodeInteractionConfig // 交互配置
    content: NodeContentConfig     // 内容配置
  }
  style: NodeStyleConfig           // 样式配置
  dataBind?: DataBinding           // 数据绑定
  meta: NodeMeta                   // 元数据
}
```

---

## 🧪 演示层 (demo/)

### 职责：功能演示和测试验证

```
demo/
├── CleanDemo.vue               # 主演示页面
├── components/                 # 演示用组件
│   ├── LayoutDemo.vue         # 布局管理器演示
│   ├── EngineDemo.vue         # 引擎功能演示
│   └── RendererDemo.vue       # 渲染器演示
└── data/                      # 演示数据
    ├── sampleNodes.ts         # 示例节点数据
    └── sampleConfigs.ts       # 示例配置数据
```

### CleanDemo.vue 组件结构
```vue
<template>
  <PureLayoutManager 
    :config="layoutConfig"
    @region-resize="handleRegionResize"
  >
    <template #toolbar>
      <ToolEngine :tools="enabledTools" />
    </template>
    
    <template #sidebar>
      <NodeRegistryEngine :categories="nodeCategories" />
    </template>
    
    <template #canvas>
      <RenderEngine 
        :renderer="currentRenderer"
        :nodes="panelNodes"
        @node-select="handleNodeSelect"
      />
    </template>
    
    <template #inspector>
      <ConfigEngine 
        :schema="currentConfigSchema"
        :data="selectedNodeConfig"
        @config-change="handleConfigChange"
      />
    </template>
  </PureLayoutManager>
</template>
```

---

## 🔌 插件层 (plugins/)

### 职责：插件系统和扩展机制

```
plugins/
├── interfaces/                 # 插件接口定义
│   ├── Plugin.ts              # 插件基础接口
│   ├── PluginContext.ts       # 插件上下文
│   └── PluginManager.ts       # 插件管理器
├── builtin/                   # 内置插件
│   ├── BasicComponents.ts     # 基础组件插件
│   └── StandardTools.ts       # 标准工具插件
└── examples/                  # 插件示例
    ├── CustomRenderer.ts      # 自定义渲染器插件示例
    └── BusinessComponents.ts  # 业务组件插件示例
```

### 插件接口示例
```typescript
interface PanelV2Plugin {
  meta: PluginMeta              // 插件元信息
  components?: ComponentDefinition[]  // 提供的组件
  tools?: ToolDefinition[]      // 提供的工具
  renderers?: CanvasRenderer[]  // 提供的渲染器
  
  // 生命周期钩子
  install?(context: PluginContext): Promise<void>
  activate?(context: PluginContext): Promise<void>
}
```

---

## 文件命名规范

### Vue组件
- **PascalCase**: `PureLayoutManager.vue`, `CleanDemo.vue`
- **前缀规则**: Pure* (纯净层), *Engine (引擎层), *Renderer (渲染器)

### TypeScript文件
- **PascalCase**: `NodeRegistryEngine.ts`, `GridStackRenderer.ts`
- **Interface目录**: 所有接口定义放在 `interfaces/` 目录

### 文档文件
- **UPPERCASE**: `README.md`, `PROGRESS.md`, `STRUCTURE.md`
- **中文注释**: 所有TypeScript文件必须有中文注释

---

## 依赖关系图

```
📖 Documentation Layer
    ↓
🏗️  Pure Infrastructure Layer (core/)
    ↓
⚙️  Professional Engine Layer (engines/)
    ↓
🎨 Renderer Layer (renderers/)
    ↓
🧪 Demo Layer (demo/)
    ↓
🔌 Plugin Layer (plugins/)
    ↑
📋 Type Definition Layer (types/) ← 所有层都依赖
```

**核心原则**：
- 上层可以依赖下层，下层不能依赖上层
- 所有层都可以依赖类型定义层
- 插件层通过接口与其他层交互

---

**更新时间**: 2025-07-25  
**维护者**: PanelV2开发团队