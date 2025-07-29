# PanelV2 架构设计文档

## 1. 整体架构概述

### 1.1 设计理念

PanelV2 采用分层解耦的架构设计，基于现有 PanelLayout 组件的成功实践，构建一个高度可扩展、易维护的看板系统。

**核心设计原则：**
- **分层解耦**: 清晰的职责分离，降低组件间耦合度
- **插槽驱动**: 基于 PanelLayout 的插槽机制实现 UI 组合
- **事件总线**: 标准化组件间通信，避免复杂的 props 传递
- **状态集中**: 统一的状态管理，确保数据流的可预测性
- **插件化**: 完善的插件系统，支持卡片的热插拔和扩展
- **类型安全**: 完整的 TypeScript 支持，提供开发时类型检查

### 1.2 架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                    PanelV2.vue (主入口)                     │
│                     集成层 - 统一对外接口                    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                 PanelLayout (布局组件)                      │
│                  UI层 - 插槽布局管理                        │
│   #toolbar │    #left     │     #main     │    #right      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│    Toolbar   │ComponentLib │   Canvas    │  Inspector     │
│              │             │             │                │
│    工具栏     │   组件库     │    画布      │   属性面板      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Core Layer (核心层)                      │
│  PanelStore │ EventBus │ CanvasManager │ LifecycleManager │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  Service Layer (服务层)                     │
│  CardService │ DataService │ ApiService │ ConfigService   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                  Plugin Layer (插件层)                      │
│  PluginManager │ CardRegistry │ CardPlugin │ ThemePlugin  │
└─────────────────────────────────────────────────────────────┘
```

## 2. 详细目录结构设计

### 2.1 根目录结构

```
src/components/panelv2/
├── index.ts                    # 主入口导出
├── PanelV2.vue                 # 主组件入口
├── ARCHITECTURE_DESIGN.md     # 架构设计文档
├── IMPLEMENTATION_TASKS.md    # 实施任务列表
├── README.md                   # 使用文档
│
├── layout/                     # 布局组件 (已存在)
│   ├── PanelLayout.vue         # 主布局组件
│   └── README.md               # 布局组件文档
│
├── types/                      # 类型定义
│   ├── index.ts                # 统一类型导出
│   ├── core.ts                 # 核心类型定义
│   ├── plugin.ts               # 插件相关类型
│   ├── canvas.ts               # 画布相关类型
│   ├── events.ts               # 事件相关类型
│   └── api.ts                  # API 相关类型
│
├── core/                       # 核心层
│   ├── index.ts                # 核心服务导出
│   ├── PanelStore.ts           # 状态管理中心
│   ├── EventBus.ts             # 事件总线系统
│   ├── CanvasManager.ts        # 画布管理器
│   ├── LifecycleManager.ts     # 生命周期管理
│   └── ErrorBoundary.ts        # 错误边界处理
│
├── services/                   # 服务层
│   ├── index.ts                # 服务导出
│   ├── CardService.ts          # 卡片服务
│   ├── DataService.ts          # 数据服务
│   ├── ApiService.ts           # API 服务
│   ├── ConfigService.ts        # 配置服务
│   ├── StorageService.ts       # 存储服务
│   └── ValidationService.ts    # 验证服务
│
├── plugins/                    # 插件系统
│   ├── index.ts                # 插件系统导出
│   ├── PluginManager.ts        # 插件管理器
│   ├── CardRegistry.ts         # 卡片注册中心
│   ├── CardPlugin.ts           # 卡片插件基类
│   ├── ThemePlugin.ts          # 主题插件基类
│   └── PluginLoader.ts         # 插件加载器
│
├── components/                 # UI 组件层
│   ├── index.ts                # 组件导出
│   │
│   ├── toolbar/                # 工具栏组件
│   │   ├── Toolbar.vue         # 主工具栏组件
│   │   ├── ToolbarButton.vue   # 工具栏按钮
│   │   ├── ModeToggle.vue      # 模式切换
│   │   ├── ThemeSelector.vue   # 主题选择器
│   │   └── ActionButtons.vue   # 操作按钮组
│   │
│   ├── library/                # 组件库
│   │   ├── ComponentLibrary.vue# 主组件库
│   │   ├── CategoryFilter.vue  # 分类过滤器
│   │   ├── ComponentItem.vue   # 组件项
│   │   ├── ComponentCard.vue   # 组件卡片
│   │   └── SearchBox.vue       # 搜索框
│   │
│   ├── canvas/                 # 画布组件
│   │   ├── Canvas.vue          # 主画布组件
│   │   ├── CanvasGrid.vue      # 网格背景
│   │   ├── CanvasItem.vue      # 画布项
│   │   ├── SelectionBox.vue    # 选择框
│   │   ├── ContextMenu.vue     # 右键菜单
│   │   ├── DragPreview.vue     # 拖拽预览
│   │   └── DropZone.vue        # 放置区域
│   │
│   ├── inspector/              # 属性面板
│   │   ├── Inspector.vue       # 主属性面板
│   │   ├── PropertyForm.vue    # 属性表单
│   │   ├── DataSourceConfig.vue# 数据源配置
│   │   ├── StyleConfig.vue     # 样式配置
│   │   ├── LayoutConfig.vue    # 布局配置
│   │   └── ConfigPreview.vue   # 配置预览
│   │
│   └── common/                 # 通用组件
│       ├── LoadingSpinner.vue  # 加载动画
│       ├── EmptyState.vue      # 空状态
│       ├── ErrorDisplay.vue    # 错误显示
│       ├── ConfirmDialog.vue   # 确认对话框
│       └── Toast.vue           # 消息提示
│
├── composables/                # 组合式函数
│   ├── index.ts                # 组合函数导出
│   ├── usePanel.ts             # 面板状态管理
│   ├── useCanvas.ts            # 画布操作
│   ├── useDragDrop.ts          # 拖拽功能
│   ├── useSelection.ts         # 选择功能
│   ├── useClipboard.ts         # 剪贴板操作
│   ├── useHistory.ts           # 历史记录/撤销重做
│   ├── useKeyboard.ts          # 键盘快捷键
│   └── usePlugin.ts            # 插件操作
│
├── utils/                      # 工具函数
│   ├── index.ts                # 工具函数导出
│   ├── layout.ts               # 布局计算
│   ├── geometry.ts             # 几何计算
│   ├── color.ts                # 颜色处理
│   ├── format.ts               # 格式化工具
│   ├── validation.ts           # 验证工具
│   ├── storage.ts              # 存储工具
│   └── migration.ts            # 数据迁移工具
│
├── constants/                  # 常量定义
│   ├── index.ts                # 常量导出
│   ├── events.ts               # 事件常量
│   ├── config.ts               # 配置常量
│   ├── themes.ts               # 主题常量
│   └── plugins.ts              # 插件常量
│
└── adapters/                   # 适配器层
    ├── index.ts                # 适配器导出
    ├── LegacyAdapter.ts        # 旧版本适配器
    ├── DataAdapter.ts          # 数据适配器
    └── ComponentAdapter.ts     # 组件适配器
```

### 2.2 目录职责详细说明

#### 2.2.1 types/ - 类型定义层
**职责**: 提供完整的 TypeScript 类型定义和接口规范

- **index.ts**: 统一导出所有类型，提供便捷的类型导入
- **core.ts**: 核心数据结构类型 (PanelState, CanvasItem, Position 等)
- **plugin.ts**: 插件系统类型 (PluginInterface, CardPlugin, PluginConfig 等)
- **canvas.ts**: 画布相关类型 (DragData, SelectionState, GridConfig 等)
- **events.ts**: 事件系统类型 (EventMap, EventHandler, EventBusInterface 等)
- **api.ts**: API 接口类型 (ApiRequest, ApiResponse, ErrorResponse 等)

#### 2.2.2 core/ - 核心服务层
**职责**: 提供系统的核心服务和基础设施

- **PanelStore.ts**: 
  - 集中式状态管理
  - 状态变更的统一入口
  - 状态持久化和恢复
  - 撤销/重做功能

- **EventBus.ts**:
  - 组件间通信的事件总线
  - 类型安全的事件发布/订阅
  - 事件生命周期管理
  - 事件中间件支持

- **CanvasManager.ts**:
  - 画布操作的核心逻辑
  - 布局计算和碰撞检测
  - 拖拽处理和位置计算
  - 选择和多选管理

- **LifecycleManager.ts**:
  - 组件生命周期管理
  - 资源的创建和销毁
  - 内存泄漏防护
  - 性能监控

- **ErrorBoundary.ts**:
  - 全局错误捕获和处理
  - 错误恢复机制
  - 错误日志和上报
  - 用户友好的错误提示

#### 2.2.3 services/ - 业务服务层
**职责**: 提供具体的业务逻辑服务

- **CardService.ts**:
  - 卡片的增删改查
  - 卡片配置管理
  - 卡片模板处理
  - 卡片版本控制

- **DataService.ts**:
  - 数据源连接管理
  - 数据获取和处理
  - 数据缓存和同步
  - 实时数据更新

- **ApiService.ts**:
  - 后端 API 调用封装
  - 请求/响应拦截器
  - 错误处理和重试
  - 数据序列化

- **ConfigService.ts**:
  - 配置数据管理
  - 默认配置处理
  - 配置验证和转换
  - 配置导入/导出

- **StorageService.ts**:
  - 本地存储管理
  - 数据序列化/反序列化
  - 存储配额管理
  - 数据清理策略

- **ValidationService.ts**:
  - 数据验证规则
  - 表单验证
  - 配置有效性检查
  - 错误消息生成

#### 2.2.4 plugins/ - 插件系统层
**职责**: 提供可扩展的插件机制

- **PluginManager.ts**:
  - 插件的注册和管理
  - 插件生命周期控制
  - 依赖关系处理
  - 版本兼容性检查

- **CardRegistry.ts**:
  - 卡片插件注册中心
  - 卡片类型管理
  - 卡片元数据维护
  - 卡片搜索和过滤

- **CardPlugin.ts**:
  - 卡片插件基类
  - 插件接口规范
  - 通用插件功能
  - 插件开发模板

- **ThemePlugin.ts**:
  - 主题插件基类
  - 主题系统接口
  - 样式变量管理
  - 主题切换逻辑

- **PluginLoader.ts**:
  - 动态插件加载
  - 插件资源管理
  - 懒加载支持
  - 热重载功能

#### 2.2.5 components/ - UI组件层
**职责**: 提供具体的用户界面组件

**toolbar/ - 工具栏组件**
- 模式切换、主题选择、操作按钮等
- 响应用户操作，触发相应的事件
- 状态展示和用户反馈

**library/ - 组件库**
- 可拖拽的组件展示
- 分类和搜索功能
- 组件预览和说明

**canvas/ - 画布组件**
- 网格画布渲染
- 拖拽交互处理
- 选择和编辑功能
- 右键菜单支持

**inspector/ - 属性面板**
- 动态配置表单生成
- 实时配置预览
- 数据源配置界面

**common/ - 通用组件**
- 可复用的基础组件
- 统一的视觉风格
- 标准化的交互模式

#### 2.2.6 composables/ - 组合式函数层
**职责**: 提供可复用的逻辑组合函数

- **usePanel.ts**: 面板状态和操作的组合函数
- **useCanvas.ts**: 画布操作相关的逻辑复用
- **useDragDrop.ts**: 拖拽功能的标准化实现
- **useSelection.ts**: 选择功能的逻辑抽象
- **useClipboard.ts**: 剪贴板操作的封装
- **useHistory.ts**: 撤销/重做功能的实现
- **useKeyboard.ts**: 键盘快捷键的处理
- **usePlugin.ts**: 插件操作的组合函数

#### 2.2.7 utils/ - 工具函数层
**职责**: 提供纯函数工具和计算逻辑

- **layout.ts**: 布局算法和位置计算
- **geometry.ts**: 几何运算和碰撞检测
- **color.ts**: 颜色处理和转换
- **format.ts**: 数据格式化工具
- **validation.ts**: 数据验证函数
- **storage.ts**: 存储相关工具
- **migration.ts**: 数据迁移和版本兼容

#### 2.2.8 constants/ - 常量定义层
**职责**: 提供系统常量和配置

- **events.ts**: 事件名称常量
- **config.ts**: 默认配置常量
- **themes.ts**: 主题相关常量
- **plugins.ts**: 插件相关常量

#### 2.2.9 adapters/ - 适配器层
**职责**: 提供兼容性和数据转换

- **LegacyAdapter.ts**: 旧版本数据适配
- **DataAdapter.ts**: 不同数据源适配
- **ComponentAdapter.ts**: 组件兼容性适配

## 3. 核心接口设计

### 3.1 主组件接口 (PanelV2.vue)

```typescript
interface PanelV2Props {
  // 面板ID
  panelId: string
  // 初始模式
  mode?: 'edit' | 'preview'
  // 主题配置
  theme?: string
  // 只读模式
  readonly?: boolean
  // 自定义配置
  config?: PanelConfig
}

interface PanelV2Events {
  // 模式变更
  'mode-change': { mode: 'edit' | 'preview' }
  // 保存操作
  'save': { data: PanelData }
  // 加载完成
  'loaded': { data: PanelData }
  // 错误事件
  'error': { error: Error }
}

interface PanelV2Methods {
  // 保存面板
  save(): Promise<void>
  // 加载面板
  load(panelId: string): Promise<void>
  // 导出数据
  export(): PanelData
  // 导入数据
  import(data: PanelData): void
  // 切换模式
  setMode(mode: 'edit' | 'preview'): void
}
```

### 3.2 状态管理接口

```typescript
interface PanelState {
  // 基础状态
  mode: 'edit' | 'preview'
  loading: boolean
  error: Error | null
  
  // 面板数据
  panelId: string
  theme: string
  canvasItems: CanvasItem[]
  
  // 交互状态
  selectedIds: string[]
  dragState: DragState
  clipboard: ClipboardData
  
  // 历史记录
  history: HistoryState
  
  // UI 状态
  sidebarCollapsed: {
    left: boolean
    right: boolean
  }
}
```

### 3.3 事件系统接口

```typescript
interface EventMap {
  // 画布事件
  'canvas:item-add': { item: CanvasItem }
  'canvas:item-remove': { ids: string[] }
  'canvas:item-update': { id: string, updates: Partial<CanvasItem> }
  'canvas:item-select': { ids: string[] }
  'canvas:layout-change': { items: CanvasItem[] }
  
  // 拖拽事件
  'drag:start': { source: DragSource, data: any }
  'drag:over': { target: DropTarget, position: Position }
  'drag:drop': { target: DropTarget, data: any }
  'drag:end': { success: boolean }
  
  // 面板事件
  'panel:mode-change': { mode: 'edit' | 'preview' }
  'panel:theme-change': { theme: string }
  'panel:save': { data: PanelData }
  'panel:load': { data: PanelData }
  
  // 插件事件
  'plugin:register': { plugin: Plugin }
  'plugin:unregister': { id: string }
  'plugin:error': { id: string, error: Error }
}
```

### 3.4 插件系统接口

```typescript
interface CardPlugin {
  // 基础信息
  id: string
  name: string
  version: string
  description: string
  author: string
  
  // 分类信息
  category: 'builtin' | 'chart' | 'data' | 'media' | 'custom'
  tags: string[]
  
  // 组件定义
  component: Component
  configForm?: Component
  
  // 视觉信息
  icon: string
  poster: string
  preview?: string
  
  // 默认配置
  defaultConfig: Record<string, any>
  defaultSize: { width: number, height: number }
  minSize: { width: number, height: number }
  maxSize?: { width: number, height: number }
  
  // 数据需求
  dataRequirements?: DataRequirement[]
  
  // 生命周期钩子
  onInstall?(context: PluginContext): void
  onUninstall?(context: PluginContext): void
  onCreate?(instance: ComponentInstance): void
  onDestroy?(instance: ComponentInstance): void
  
  // 数据处理
  processData?(data: any, config: any): any
  validateConfig?(config: any): ValidationResult
  
  // 能力声明
  capabilities?: PluginCapability[]
}
```

## 4. 数据流设计

### 4.1 单向数据流

```
用户操作 → EventBus → 服务层处理 → 状态更新 → UI重新渲染
```

### 4.2 状态同步机制

```typescript
// 状态变更流程
class PanelStore {
  // 1. 接收操作请求
  dispatch(action: Action): void
  
  // 2. 调用对应的服务
  private async handleAction(action: Action): Promise<void>
  
  // 3. 更新状态
  private setState(updates: Partial<PanelState>): void
  
  // 4. 触发订阅者更新
  private notifySubscribers(): void
  
  // 5. 持久化状态
  private persist(): void
}
```

### 4.3 组件通信模式

```typescript
// 父子组件通信: Props + Events
// 跨组件通信: EventBus + Store
// 插槽通信: SlotProps

// 示例: 画布与工具栏通信
// 工具栏 → EventBus → 画布
eventBus.emit('canvas:clear-selection')

// 画布 → Store → 工具栏 (响应式更新)
store.setState({ selectedIds: [] })
```

## 5. 扩展机制设计

### 5.1 插件注册机制

```typescript
// 自动注册
const plugins = import.meta.glob('./plugins/*/index.ts', { eager: true })
Object.values(plugins).forEach(module => {
  pluginManager.register(module.default)
})

// 手动注册
pluginManager.register({
  id: 'custom-chart',
  name: '自定义图表',
  component: CustomChart,
  // ... 其他配置
})
```

### 5.2 主题扩展机制

```typescript
// 主题插件接口
interface ThemePlugin {
  id: string
  name: string
  variables: Record<string, string>
  styles?: string
  components?: Record<string, ComponentTheme>
}

// 主题注册
themeManager.register({
  id: 'dark-blue',
  name: '深蓝主题',
  variables: {
    '--primary-color': '#1e40af',
    '--bg-color': '#0f172a'
  }
})
```

### 5.3 数据源扩展

```typescript
// 数据源插件
interface DataSourcePlugin {
  id: string
  name: string
  type: 'api' | 'websocket' | 'mqtt' | 'custom'
  connect(config: DataSourceConfig): Promise<DataConnection>
  disconnect(connection: DataConnection): Promise<void>
  query(connection: DataConnection, query: Query): Promise<QueryResult>
}
```

## 6. 性能优化策略

### 6.1 渲染优化
- 虚拟滚动支持大量组件
- 组件懒加载和按需渲染
- 防抖/节流的事件处理
- 智能的重渲染优化

### 6.2 内存管理
- 自动的事件监听器清理
- 组件实例的生命周期管理
- 数据缓存的 LRU 策略
- WeakMap/WeakSet 的合理使用

### 6.3 数据流优化
- 状态更新的批处理
- 选择性的状态订阅
- 数据变更的增量更新
- 异步操作的取消机制

## 7. 错误处理策略

### 7.1 错误边界
```typescript
class ErrorBoundary {
  // 组件级错误捕获
  captureComponentError(error: Error, component: string): void
  
  // 插件错误隔离
  isolatePluginError(pluginId: string, error: Error): void
  
  // 数据错误恢复
  recoverFromDataError(error: DataError): void
  
  // 用户友好的错误提示
  showUserFriendlyError(error: Error): void
}
```

### 7.2 错误恢复机制
- 自动保存和数据恢复
- 插件错误隔离
- 优雅降级策略
- 错误上报和监控

## 8. 测试策略

### 8.1 单元测试
- 核心服务的单元测试
- 工具函数的测试覆盖
- 组合函数的逻辑测试
- 插件接口的合约测试

### 8.2 集成测试
- 组件间交互测试
- 事件系统测试
- 数据流测试
- 插件系统测试

### 8.3 端到端测试
- 关键业务流程测试
- 拖拽交互测试
- 数据持久化测试
- 跨浏览器兼容性测试

---

*本架构设计文档为 PanelV2 系统的技术蓝图，定义了系统的整体结构、组件职责、接口规范和扩展机制。*