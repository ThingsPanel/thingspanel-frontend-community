# PanelV2 可视化看板系统架构设计方案

> **升级，而非重构** - 面向未来的企业级可视化看板架构

## 1. 核心设计理念

### 1.1 升级架构原则
- **彻底分层分离**：第一层纯UI布局，第二层各种引擎
- **完全可插拔**：任何组件都可以独立替换和扩展
- **极致数据驱动**：一切皆配置，零硬编码
- **响应式设计**：自适应容器，动态布局，性能优先
- **开发者友好**：清晰的接口，完整的类型定义，简单的扩展API
- **企业级可靠**：完整的错误处理，状态管理，数据校验

### 1.2 革命性两层架构

#### 第一层：纯净编辑器底座（Pure Infrastructure Layer）
**唯一职责**：UI布局管理 + 数据传递管道
- ✅ 管理toolbar/sidebar/canvas/inspector四大区域布局
- ✅ 响应式断点和自适应布局
- ✅ 数据总线和事件总线
- ✅ 生命周期管理和状态同步
- ❌ **绝不涉及**：业务逻辑、渲染实现、配置细节、主题样式

#### 第二层：专业引擎层（Professional Engine Layer）
**职责**：各种专业"引擎"的具体实现
- 🎯 **节点注册引擎**：管理组件树形结构和注册系统
- 🎯 **渲染引擎**：当前GridStack布局，预留多引擎扩展接口
- 🎯 **配置引擎**：JSON Schema驱动的动态表单生成器
- 🎯 **工具引擎**：可扩展的工具集和快捷键管理
- 🎯 **主题引擎**：响应外部主题系统的适配接口
- 🎯 **数据引擎**：节点数据管理、状态同步、变更监听

### 1.3 V2与V1的明确边界

#### V1保持现状
- 📦 现有的panel组件继续维护，功能稳定
- 🔧 继续服务现有业务，不做破坏性变更
- 📈 作为V2的参考实现和功能对照

#### V2独立发展  
- 🚀 全新的架构设计，不受V1实现约束
- 🎨 专注于可扩展性和开发体验
- 🔮 为下一代可视化需求做技术储备
- 🤝 数据格式可转换，支持V1到V2的迁移路径

#### 共存策略
- 🏗️ V2作为新项目的首选技术方案
- 🔄 V1项目可选择性迁移到V2
- 📊 两个版本共享设计思路但技术独立
- ⚖️ 根据项目复杂度和需求选择合适版本

## 2. 核心数据结构设计

### 2.1 整体看板数据结构
```typescript
interface PanelV2Data {
  // 看板元信息
  meta: {
    id: string
    name: string
    version: '2.0'
    createdAt: string
    updatedAt: string
    description?: string
    tags?: string[]
    // 当前使用的渲染引擎
    renderEngine: 'gridstack' | string  // 预留扩展
    // V1兼容标识
    migratedFromV1?: boolean
  }
  
  // 看板级配置（全局设置）
  config: PanelConfig
  
  // 节点数据集合
  nodes: NodeData[]
  
  // 运行时状态（不持久化，仅内存）
  runtime: {
    selectedNodeIds: string[]
    viewMode: 'edit' | 'preview' | 'fullscreen'
    viewport: {
      zoom: number
      offsetX: number
      offsetY: number
    }
    clipboard?: NodeData[]
    isDirty: boolean  // 是否有未保存的修改
    lastSaveTime?: number
  }
  
  // 扩展数据（插件使用）
  extensions?: Record<string, any>
}
```

### 2.2 节点定义与组件映射

```typescript
// 完整的节点数据结构
interface NodeData {
  // 基础标识
  id: string
  type: string  // 对应ComponentDefinition的type
  name: string
  
  // 布局信息（由渲染引擎管理）
  layout: {
    x: number
    y: number
    w: number
    h: number
    minW?: number
    minH?: number
    maxW?: number
    maxH?: number
    locked?: boolean  // 是否锁定位置
  }
  
  // 节点配置（分层设计）
  config: {
    // 基础配置（位置、可见性等）
    base: NodeBaseConfig
    // 交互配置（点击、悬停等）
    interaction: NodeInteractionConfig  
    // 内容配置（组件特定的业务配置）
    content: NodeContentConfig
  }
  
  // 样式配置（响应主题）
  style: NodeStyleConfig
  
  // 数据绑定（可选）
  dataBind?: {
    source: string    // 数据源标识
    fields: string[]  // 绑定字段
    transform?: string // 数据变换函数
  }
  
  // 元数据
  meta: {
    createTime: number
    updateTime: number
    version: string
    tags?: string[]
  }
}

// 组件定义标准（注册时使用）
interface ComponentDefinition {
  // 组件标识
  type: string
  name: string
  category: string
  
  // Vue组件
  component: Component
  
  // 配置Schema（JSON Schema格式）
  configSchema: {
    base: ConfigSchema      // 基础配置schema
    interaction: ConfigSchema // 交互配置schema  
    content: ConfigSchema   // 内容配置schema
  }
  
  // 默认配置
  defaults: {
    layout: { w: number, h: number, minW?: number, minH?: number }
    config: { base: any, interaction: any, content: any }
    style: NodeStyleConfig
  }
  
  // 组件元信息
  meta: {
    title: string
    description?: string
    icon?: string
    poster?: string  // 预览图
    version: string
    author?: string
    keywords?: string[]
  }
  
  // 响应式配置
  responsive: {
    autoResize: boolean
    maintainAspectRatio?: boolean
    resizeHandles?: Array<'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'>
  }
}

// 分类树结构
interface CategoryTree {
  id: string
  name: string
  icon?: string
  order: number
  children?: CategoryTree[]
  // 该分类下的组件类型
  componentTypes?: string[]
}
```

## 3. 革命性分层架构详设

### 3.1 第一层：纯净编辑器底座

#### 3.1.1 纯UI布局管理器
```typescript
interface PureLayoutManager {
  // 四大核心区域管理
  regions: {
    toolbar: {
      visible: boolean
      height: number
      position: 'top' | 'bottom'
      collapsible: boolean
    }
    sidebar: {
      visible: boolean  
      width: number
      position: 'left' | 'right'
      resizable: boolean
      collapsible: boolean
    }
    canvas: {
      flex: number
      padding: number
      background: 'transparent'  // 不负责样式
    }
    inspector: {
      visible: boolean
      width: number  
      position: 'left' | 'right'
      resizable: boolean
      collapsible: boolean
    }
  }
  
  // 响应式断点（纯布局，不涉及样式）
  breakpoints: {
    mobile: number
    tablet: number 
    desktop: number
    ultrawide: number
  }
  
  // 自适应行为
  responsive: {
    autoCollapse: boolean  // 小屏自动折叠sidebar
    stackOnMobile: boolean // 移动端堆叠布局
    minCanvasWidth: number // 画布最小宽度
  }
}
```

#### 3.1.2 纯净数据传递管道
```typescript
interface PureDataPipeline {
  // 唯一数据源
  state: Ref<PanelV2Data>
  
  // 纯净事件总线（不涉及业务逻辑）
  events: {
    emit(event: string, payload: any): void
    on(event: string, handler: (payload: any) => void): void
    off(event: string, handler: Function): void
    once(event: string, handler: (payload: any) => void): void
  }
  
  // 基础数据操作（只传递，不处理）
  operations: {
    // 看板级操作
    updatePanel(update: Partial<PanelV2Data>): void
    // 节点级操作  
    addNode(node: NodeData): void
    updateNode(id: string, update: Partial<NodeData>): void
    removeNode(id: string): void
    // 选择操作
    selectNodes(ids: string[]): void
    clearSelection(): void
  }
  
  // 数据变更监听（纯通知，不处理）
  watchers: {
    onPanelChange: (newPanel: PanelV2Data, oldPanel: PanelV2Data) => void
    onNodeChange: (nodeId: string, newNode: NodeData, oldNode: NodeData) => void
    onSelectionChange: (selectedIds: string[]) => void
  }
  
  // 数据持久化接口（委托给外部）
  persistence: {
    save?: (data: PanelV2Data) => Promise<void>
    load?: (id: string) => Promise<PanelV2Data>
    autosave?: boolean
  }
}
```

#### 3.1.3 生命周期管理器
```typescript
interface LifecycleManager {
  // 编辑器生命周期
  phases: {
    'before-mount': LifecycleHook[]
    'mounted': LifecycleHook[]
    'before-unmount': LifecycleHook[]
    'unmounted': LifecycleHook[]
  }
  
  // 面板生命周期
  panelPhases: {
    'panel-created': LifecycleHook[]
    'panel-loaded': LifecycleHook[]
    'panel-saved': LifecycleHook[]
    'panel-destroyed': LifecycleHook[]
  }
  
  // 节点生命周期
  nodePhases: {
    'node-added': LifecycleHook[]
    'node-updated': LifecycleHook[]
    'node-removed': LifecycleHook[]
    'node-selected': LifecycleHook[]
  }
  
  // 注册钩子
  registerHook(phase: string, hook: LifecycleHook): void
  unregisterHook(phase: string, hook: LifecycleHook): void
  
  // 触发钩子
  trigger(phase: string, context: any): Promise<void>
}

type LifecycleHook = (context: any) => void | Promise<void>
```
```

### 3.2 第二层：专业引擎层详设

#### 3.2.1 主题引擎 - 响应外部主题系统
```typescript
interface ThemeEngine {
  // 主题适配器（响应外部主题而非创建主题）
  adapter: {
    // 监听外部主题变更（如naive-ui主题切换）
    listenToExternalTheme(callback: (theme: ExternalTheme) => void): void
    // 获取当前外部主题
    getCurrentTheme(): ExternalTheme
    // 订阅主题变更事件
    subscribe(event: 'theme-change', handler: ThemeChangeHandler): void
    unsubscribe(event: 'theme-change', handler: ThemeChangeHandler): void
  }
  
  // 主题变量映射（将外部主题转换为内部CSS变量）
  mapping: {
    // 主题变量映射表
    variableMap: Record<string, string>
    // 动态映射函数
    mapThemeVariables(externalTheme: ExternalTheme): CSSVariables
    // 应用主题变量到DOM
    applyThemeVariables(variables: CSSVariables, scope?: string): void
  }
  
  // 组件样式隔离
  isolation: {
    // 为PanelV2创建隔离的样式作用域
    createStyleScope(scopeId: string): StyleScope
    // 在作用域内应用主题
    applyToScope(scope: StyleScope, variables: CSSVariables): void
    // 清理作用域
    destroyScope(scopeId: string): void
  }
}

interface ExternalTheme {
  name: string
  type: 'light' | 'dark' | 'auto'
  colors: {
    primary: string
    success: string
    warning: string
    error: string
    info: string
    // 背景色系
    bodyColor: string
    cardColor: string
    modalColor: string
    // 文字色系
    textColorBase: string
    textColor1: string
    textColor2: string
    textColor3: string
    // 边框色系
    borderColor: string
    dividerColor: string
  }
  // 其他主题属性...
}

interface CSSVariables {
  '--panel-bg-color': string
  '--panel-card-color': string
  '--panel-text-color': string
  '--panel-border-color': string
  '--panel-primary-color': string
  // 更多内部变量...
}

// 默认主题映射配置
const DEFAULT_THEME_MAPPING = {
  '--panel-bg-color': 'bodyColor',
  '--panel-card-color': 'cardColor', 
  '--panel-text-color': 'textColorBase',
  '--panel-border-color': 'borderColor',
  '--panel-primary-color': 'primaryColor'
}
```

#### 3.2.2 工具引擎 - 可扩展工具集管理
```typescript
interface ToolEngine {
  // 工具注册表
  registry: {
    // 预制工具集
    builtInTools: Map<string, ToolDefinition>
    // 自定义工具集  
    customTools: Map<string, ToolDefinition>
    // 插件工具集
    pluginTools: Map<string, ToolDefinition>
  }
  
  // 工具管理
  manager: {
    // 注册工具
    registerTool(tool: ToolDefinition): void
    unregisterTool(toolId: string): void
    // 获取工具
    getTool(toolId: string): ToolDefinition | null
    getToolsByCategory(category: ToolCategory): ToolDefinition[]
    // 工具启用控制（编程时选择）
    enableTool(toolId: string): void
    disableTool(toolId: string): void
    isToolEnabled(toolId: string): boolean
  }
  
  // 快捷键系统
  shortcuts: {
    // 绑定快捷键
    bindShortcut(key: string, toolId: string): void
    unbindShortcut(key: string): void
    // 快捷键监听
    startListening(): void
    stopListening(): void
    // 快捷键冲突检测
    detectConflicts(): ShortcutConflict[]
  }
  
  // 工具执行
  executor: {
    // 执行工具
    execute(toolId: string, context: EditorContext): Promise<ToolResult>
    // 批量执行
    executeBatch(toolIds: string[], context: EditorContext): Promise<ToolResult[]>
    // 工具执行历史
    getExecutionHistory(): ToolExecution[]
    clearHistory(): void
  }
}

interface ToolDefinition {
  // 基础信息
  id: string
  name: string
  description?: string
  icon: string
  category: ToolCategory
  version: string
  
  // 快捷键配置
  shortcut?: {
    key: string
    modifiers?: ('ctrl' | 'alt' | 'shift' | 'meta')[]
    description: string
  }
  
  // 工具行为
  action: (context: EditorContext) => Promise<ToolResult>
  
  // 启用条件
  enabled?: (context: EditorContext) => boolean
  visible?: (context: EditorContext) => boolean
  
  // 工具状态
  hasState?: boolean
  getState?: (context: EditorContext) => any
  setState?: (context: EditorContext, state: any) => void
  
  // 权限控制
  permissions?: string[]
  roles?: string[]
  
  // UI配置
  ui: {
    // 工具栏显示配置
    showInToolbar?: boolean
    toolbarGroup?: string
    toolbarOrder?: number
    // 右键菜单显示
    showInContextMenu?: boolean
    contextMenuOrder?: number
    // 自定义UI组件
    customComponent?: Component
  }
}

type ToolCategory = 'edit' | 'view' | 'layout' | 'data' | 'export' | 'debug' | 'plugin'

interface ToolResult {
  success: boolean
  message?: string
  data?: any
  error?: Error
}

// 预制工具集定义
const BUILT_IN_TOOLS: Record<string, ToolDefinition> = {
  // === 编辑类工具 ===
  UNDO: {
    id: 'undo',
    name: '撤销',
    icon: 'undo',
    category: 'edit',
    shortcut: { key: 'z', modifiers: ['ctrl'] },
    action: async (ctx) => ctx.dataEngine.undo(),
    enabled: (ctx) => ctx.dataEngine.canUndo(),
    ui: { showInToolbar: true, toolbarGroup: 'edit', toolbarOrder: 1 }
  },
  
  REDO: {
    id: 'redo', 
    name: '重做',
    icon: 'redo',
    category: 'edit',
    shortcut: { key: 'y', modifiers: ['ctrl'] },
    action: async (ctx) => ctx.dataEngine.redo(),
    enabled: (ctx) => ctx.dataEngine.canRedo(),
    ui: { showInToolbar: true, toolbarGroup: 'edit', toolbarOrder: 2 }
  },
  
  COPY: {
    id: 'copy',
    name: '复制',
    icon: 'copy', 
    category: 'edit',
    shortcut: { key: 'c', modifiers: ['ctrl'] },
    action: async (ctx) => ctx.clipboard.copy(ctx.selectedNodes),
    enabled: (ctx) => ctx.selectedNodes.length > 0,
    ui: { showInToolbar: true, showInContextMenu: true }
  },
  
  PASTE: {
    id: 'paste',
    name: '粘贴',
    icon: 'paste',
    category: 'edit', 
    shortcut: { key: 'v', modifiers: ['ctrl'] },
    action: async (ctx) => ctx.clipboard.paste(),
    enabled: (ctx) => ctx.clipboard.hasContent(),
    ui: { showInToolbar: true, showInContextMenu: true }
  },
  
  DELETE: {
    id: 'delete',
    name: '删除',
    icon: 'delete',
    category: 'edit',
    shortcut: { key: 'Delete' },
    action: async (ctx) => ctx.renderEngine.removeNodes(ctx.selectedNodes.map(n => n.id)),
    enabled: (ctx) => ctx.selectedNodes.length > 0,
    ui: { showInContextMenu: true }
  },
  
  // === 布局类工具 ===
  ALIGN_LEFT: {
    id: 'align-left',
    name: '左对齐', 
    icon: 'align-left',
    category: 'layout',
    action: async (ctx) => ctx.layoutEngine.alignNodes(ctx.selectedNodes, 'left'),
    enabled: (ctx) => ctx.selectedNodes.length > 1,
    ui: { showInToolbar: true, toolbarGroup: 'layout' }
  },
  
  ALIGN_CENTER: {
    id: 'align-center',
    name: '居中对齐',
    icon: 'align-center', 
    category: 'layout',
    action: async (ctx) => ctx.layoutEngine.alignNodes(ctx.selectedNodes, 'center'),
    enabled: (ctx) => ctx.selectedNodes.length > 1,
    ui: { showInToolbar: true, toolbarGroup: 'layout' }
  },
  
  // === 视图类工具 ===
  ZOOM_IN: {
    id: 'zoom-in',
    name: '放大',
    icon: 'zoom-in',
    category: 'view',
    shortcut: { key: '=', modifiers: ['ctrl'] },
    action: async (ctx) => ctx.renderEngine.zoomIn(),
    ui: { showInToolbar: true, toolbarGroup: 'view' }
  },
  
  ZOOM_OUT: {
    id: 'zoom-out', 
    name: '缩小',
    icon: 'zoom-out',
    category: 'view',
    shortcut: { key: '-', modifiers: ['ctrl'] },
    action: async (ctx) => ctx.renderEngine.zoomOut(),
    ui: { showInToolbar: true, toolbarGroup: 'view' }
  },
  
  ZOOM_FIT: {
    id: 'zoom-fit',
    name: '适应画布',
    icon: 'zoom-fit',
    category: 'view', 
    shortcut: { key: '0', modifiers: ['ctrl'] },
    action: async (ctx) => ctx.renderEngine.zoomToFit(),
    ui: { showInToolbar: true, toolbarGroup: 'view' }
  },
  
  // === 数据类工具 ===
  SAVE: {
    id: 'save',
    name: '保存',
    icon: 'save',
    category: 'data',
    shortcut: { key: 's', modifiers: ['ctrl'] },
    action: async (ctx) => ctx.dataEngine.save(),
    enabled: (ctx) => ctx.dataEngine.isDirty(),
    ui: { showInToolbar: true, toolbarGroup: 'data', toolbarOrder: 1 }
  },
  
  REFRESH: {
    id: 'refresh',
    name: '刷新',
    icon: 'refresh', 
    category: 'data',
    shortcut: { key: 'F5' },
    action: async (ctx) => ctx.dataEngine.reload(),
    ui: { showInToolbar: true, toolbarGroup: 'data' }
  },
  
  // === 导出类工具 ===
  EXPORT_JSON: {
    id: 'export-json',
    name: '导出JSON',
    icon: 'file-json',
    category: 'export',
    action: async (ctx) => ctx.exportEngine.exportAsJSON(),
    ui: { showInContextMenu: true }
  },
  
  EXPORT_IMAGE: {
    id: 'export-image',
    name: '导出图片',
    icon: 'image',
    category: 'export', 
    action: async (ctx) => ctx.exportEngine.exportAsImage(),
    ui: { showInContextMenu: true }
  }
}
```

#### 3.2.3 节点注册引擎 - 组件树形管理
```typescript
interface NodeRegistryEngine {
  // 组件注册表
  registry: {
    // 所有注册的组件定义
    components: Map<string, ComponentDefinition>
    // 分类映射
    categories: Map<string, CategoryDefinition>
    // 搜索索引
    searchIndex: SearchIndex
  }
  
  // 组件管理
  manager: {
    // 注册组件
    register(component: ComponentDefinition): Promise<void>
    unregister(type: string): Promise<void>
    batchRegister(components: ComponentDefinition[]): Promise<void>
    
    // 查询组件
    getComponent(type: string): ComponentDefinition | null
    getComponentsByCategory(categoryId: string): ComponentDefinition[]
    getAllComponents(): ComponentDefinition[]
    
    // 组件验证
    validate(component: ComponentDefinition): ValidationResult
    validateAll(): ValidationResult[]
  }
  
  // 分类管理
  categories: {
    // 创建分类
    createCategory(category: CategoryDefinition): void
    updateCategory(id: string, update: Partial<CategoryDefinition>): void
    deleteCategory(id: string): void
    
    // 分类查询
    getCategory(id: string): CategoryDefinition | null
    getRootCategories(): CategoryDefinition[]
    getCategoryTree(): CategoryTreeNode[]
    
    // 分类关联
    assignComponentToCategory(componentType: string, categoryId: string): void
    removeComponentFromCategory(componentType: string, categoryId: string): void
  }
  
  // 搜索功能
  search: {
    // 搜索组件
    searchComponents(query: SearchQuery): ComponentDefinition[]
    // 关键词索引
    buildSearchIndex(): void
    updateSearchIndex(component: ComponentDefinition): void
    // 搜索建议
    getSuggestions(partialQuery: string): string[]
  }
  
  // 树形结构生成
  tree: {
    // 生成完整树形结构（用于左侧面板显示）
    generateTree(options?: TreeOptions): CategoryTreeNode[]
    // 生成扁平列表（用于搜索结果）
    generateFlatList(options?: ListOptions): ComponentListItem[]
    // 过滤树形结构
    filterTree(tree: CategoryTreeNode[], predicate: (node: any) => boolean): CategoryTreeNode[]
  }
}

interface CategoryDefinition {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  parentId?: string
  order: number
  
  // 显示配置
  display: {
    collapsible: boolean
    defaultExpanded: boolean
    showCount: boolean
    customIcon?: Component
  }
  
  // 权限控制
  permissions?: {
    view?: string[]
    create?: string[]
    edit?: string[]
  }
  
  // 元数据
  meta: {
    createdAt: number
    updatedAt: number
    version: string
  }
}

interface CategoryTreeNode {
  id: string
  name: string
  icon?: string
  type: 'category' | 'component'
  children?: CategoryTreeNode[]
  
  // 分类特有属性
  categoryData?: CategoryDefinition
  componentData?: ComponentDefinition
  
  // UI状态
  expanded?: boolean
  visible?: boolean
  disabled?: boolean
  
  // 统计信息
  componentCount?: number
  totalCount?: number
}

interface SearchQuery {
  keyword: string
  categories?: string[]
  tags?: string[]
  author?: string
  version?: string
  
  // 搜索选项
  options: {
    fuzzy: boolean
    caseSensitive: boolean
    searchInDescription: boolean
    searchInKeywords: boolean
    maxResults: number
  }
}

interface SearchIndex {
  // 关键词索引
  keywords: Map<string, Set<string>>  // keyword -> component types
  // 分类索引
  categories: Map<string, Set<string>>  // category -> component types
  // 标签索引
  tags: Map<string, Set<string>>  // tag -> component types
  // 作者索引
  authors: Map<string, Set<string>>  // author -> component types
}

// 预制分类定义
const BUILT_IN_CATEGORIES: CategoryDefinition[] = [
  {
    id: 'basic',
    name: '基础组件',
    icon: 'layers',
    order: 1,
    display: { collapsible: true, defaultExpanded: true, showCount: true },
    meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
  },
  {
    id: 'chart',
    name: '图表组件', 
    icon: 'chart-bar',
    order: 2,
    display: { collapsible: true, defaultExpanded: true, showCount: true },
    meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
  },
  {
    id: 'form',
    name: '表单组件',
    icon: 'form',
    order: 3,
    display: { collapsible: true, defaultExpanded: false, showCount: true },
    meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
  },
  {
    id: 'media',
    name: '媒体组件',
    icon: 'image',
    order: 4,
    display: { collapsible: true, defaultExpanded: false, showCount: true },
    meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
  },
  {
    id: 'advanced',
    name: '高级组件',
    icon: 'puzzle',
    order: 5,
    display: { collapsible: true, defaultExpanded: false, showCount: true },
    meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
  },
  {
    id: 'plugin',
    name: '插件组件',
    icon: 'plugin',
    order: 6,
    display: { collapsible: true, defaultExpanded: false, showCount: true },
    meta: { createdAt: Date.now(), updatedAt: Date.now(), version: '1.0.0' }
  }
]
```

#### 3.2.4 渲染引擎 - 多引擎架构支持
```typescript
interface RenderEngine {
  // 渲染器管理
  manager: {
    // 当前激活的渲染器
    currentRenderer: CanvasRenderer | null
    // 可用渲染器注册表
    availableRenderers: Map<string, CanvasRendererClass>
    
    // 渲染器切换
    switchRenderer(type: string, config?: RendererConfig): Promise<void>
    getCurrentRendererType(): string | null
    
    // 渲染器注册
    registerRenderer(type: string, rendererClass: CanvasRendererClass): void
    unregisterRenderer(type: string): void
  }
  
  // 渲染操作
  operations: {
    // 初始化
    init(container: HTMLElement, config: RendererConfig): Promise<void>
    destroy(): Promise<void>
    
    // 节点操作
    addNode(node: NodeData): Promise<void>
    updateNode(nodeId: string, data: Partial<NodeData>): Promise<void>
    removeNode(nodeId: string): Promise<void>
    batchUpdateNodes(updates: Array<{id: string, data: Partial<NodeData>}>): Promise<void>
    
    // 布局操作
    layout(): Promise<void>
    autoLayout(algorithm?: LayoutAlgorithm): Promise<void>
    
    // 视图操作
    zoomIn(factor?: number): Promise<void>
    zoomOut(factor?: number): Promise<void>
    zoomToFit(): Promise<void>
    zoomToSelection(): Promise<void>
    setViewport(viewport: Viewport): Promise<void>
    
    // 选择操作
    selectNodes(nodeIds: string[]): void
    selectAll(): void
    clearSelection(): void
    getSelectedNodes(): string[]
  }
  
  // 事件处理
  events: {
    // 节点事件
    onNodeClick(nodeId: string, event: MouseEvent): void
    onNodeDoubleClick(nodeId: string, event: MouseEvent): void
    onNodeContextMenu(nodeId: string, event: MouseEvent): void
    
    // 布局事件
    onLayoutChange(changes: LayoutChange[]): void
    onViewportChange(viewport: Viewport): void
    
    // 选择事件
    onSelectionChange(selectedIds: string[]): void
  }
  
  // 导出功能
  export: {
    // 导出为图片
    exportAsImage(options?: ImageExportOptions): Promise<Blob>
    // 导出为SVG
    exportAsSVG(options?: SVGExportOptions): Promise<string>
    // 导出布局数据
    exportLayoutData(): Promise<LayoutData[]>
  }
}

// 通用渲染器接口
interface CanvasRenderer {
  readonly type: string
  readonly version: string
  readonly capabilities: RendererCapabilities
  
  // 生命周期
  init(container: HTMLElement, config: RendererConfig): Promise<void>
  destroy(): Promise<void>
  
  // 节点管理
  addNode(node: NodeData): Promise<void>
  removeNode(nodeId: string): Promise<void>
  updateNode(nodeId: string, data: Partial<NodeData>): Promise<void>
  
  // 布局管理
  layout(): Promise<void>
  setViewport(viewport: Viewport): Promise<void>
  
  // 选择管理
  selectNodes(nodeIds: string[]): void
  clearSelection(): void
  
  // 事件处理
  on(event: RendererEvent, handler: EventHandler): void
  off(event: RendererEvent, handler: EventHandler): void
  
  // 导出能力
  exportImage(): Promise<Blob>
  exportData(): Promise<any>
}

interface RendererCapabilities {
  // 支持的功能
  features: {
    drag: boolean          // 拖拽支持
    resize: boolean        // 调整大小
    rotate: boolean        // 旋转支持
    zIndex: boolean        // 层级控制
    grouping: boolean      // 分组支持
    snapping: boolean      // 对齐辅助
    guides: boolean        // 参考线
    animation: boolean     // 动画支持
  }
  
  // 性能特性
  performance: {
    maxNodes: number       // 最大节点数
    virtualScrolling: boolean  // 虚拟滚动
    lazyRendering: boolean     // 懒渲染
    hardwareAcceleration: boolean  // 硬件加速
  }
  
  // 导出格式
  exportFormats: ('png' | 'jpg' | 'svg' | 'pdf')[]
}

// GridStack渲染器实现
interface GridStackRenderer extends CanvasRenderer {
  readonly type: 'gridstack'
  gridstack: GridStack
  
  // GridStack特有配置
  updateGridConfig(config: {
    columns?: number
    cellHeight?: number | 'auto'
    margin?: number | string
    animate?: boolean
    float?: boolean
    disableDrag?: boolean
    disableResize?: boolean
  }): void
  
  // GridStack特有操作
  compact(doSort?: boolean): void
  enableMove(enable: boolean): void
  enableResize(enable: boolean): void
  
  // 响应式支持
  setResponsiveMode(enabled: boolean): void
  updateBreakpoints(breakpoints: ResponsiveBreakpoints): void
}

// 预留扩展：3D渲染器接口
interface ThreeJSRenderer extends CanvasRenderer {
  readonly type: 'threejs'
  scene: THREE.Scene
  camera: THREE.Camera
  renderer: THREE.WebGLRenderer
  
  // 3D特有操作
  setCamera(type: 'perspective' | 'orthographic'): void
  setCameraPosition(x: number, y: number, z: number): void
  addLight(light: THREE.Light): void
  
  // 3D布局
  arrange3D(layout: Layout3D): Promise<void>
  setDepth(nodeId: string, depth: number): void
}

// 预留扩展：SVG渲染器接口  
interface SVGRenderer extends CanvasRenderer {
  readonly type: 'svg'
  svgElement: SVGElement
  
  // SVG特有操作
  addDefs(defs: SVGDefsElement): void
  createGroup(id: string): SVGGElement
  applyTransform(nodeId: string, transform: SVGTransform): void
}

interface RendererConfig {
  // 通用配置
  common: {
    background?: string
    showGrid?: boolean
    gridSize?: number
    showGuides?: boolean
    snapToGrid?: boolean
    snapDistance?: number
  }
  
  // 特定渲染器配置
  [key: string]: any
}

interface Viewport {
  zoom: number
  offsetX: number
  offsetY: number
  width: number
  height: number
}

interface LayoutChange {
  nodeId: string
  oldLayout: any
  newLayout: any
  type: 'move' | 'resize' | 'add' | 'remove'
}

type RendererEvent = 
  | 'node-added' 
  | 'node-removed' 
  | 'node-updated'
  | 'layout-changed'
  | 'viewport-changed'
  | 'selection-changed'
  | 'node-click'
  | 'node-double-click'
  | 'node-context-menu'

type EventHandler = (event: any) => void

// 渲染器工厂
class RendererFactory {
  private static renderers = new Map<string, CanvasRendererClass>()
  
  static register(type: string, rendererClass: CanvasRendererClass): void {
    this.renderers.set(type, rendererClass)
  }
  
  static create(type: string, container: HTMLElement, config: RendererConfig): CanvasRenderer {
    const RendererClass = this.renderers.get(type)
    if (!RendererClass) {
      throw new Error(`Unknown renderer type: ${type}`)
    }
    return new RendererClass(container, config)
  }
  
  static getAvailableTypes(): string[] {
    return Array.from(this.renderers.keys())
  }
}

// 预注册内置渲染器
RendererFactory.register('gridstack', GridStackRenderer)
// 未来扩展
// RendererFactory.register('threejs', ThreeJSRenderer)
// RendererFactory.register('svg', SVGRenderer)
```

#### 3.2.5 配置引擎 - JSON Schema驱动表单
```typescript
interface ConfigEngine {
  // Schema管理
  schema: {
    // 注册配置Schema
    registerSchema(componentType: string, schema: ConfigSchemaDefinition): void
    unregisterSchema(componentType: string): void
    
    // 获取Schema
    getSchema(componentType: string): ConfigSchemaDefinition | null
    getSchemasByCategory(category: string): ConfigSchemaDefinition[]
    
    // 合并Schema（支持继承）
    mergeSchemas(base: ConfigSchemaDefinition, override: ConfigSchemaDefinition): ConfigSchemaDefinition
    
    // Schema验证
    validateSchema(schema: ConfigSchemaDefinition): ValidationResult
  }
  
  // 表单渲染器
  renderer: {
    // 渲染配置表单
    renderForm(schema: ConfigSchemaDefinition, data: any, options?: RenderOptions): VNode
    
    // 渲染单个字段
    renderField(fieldSchema: FieldSchema, value: any, path: string): VNode
    
    // 表单组件注册
    registerComponent(type: string, component: Component): void
    getComponent(type: string): Component | null
    
    // 自定义渲染器
    registerRenderer(type: string, renderer: FieldRenderer): void
  }
  
  // 数据绑定
  binding: {
    // 双向绑定
    bindData(schema: ConfigSchemaDefinition, data: Ref<any>): FormBinding
    unbindData(binding: FormBinding): void
    
    // 数据变更监听
    watchChanges(binding: FormBinding, callback: (path: string, value: any) => void): void
    
    // 批量更新
    batchUpdate(binding: FormBinding, updates: Record<string, any>): void
  }
  
  // 验证系统
  validation: {
    // 实时验证
    validate(schema: ConfigSchemaDefinition, data: any): ValidationResult
    validateField(fieldSchema: FieldSchema, value: any): FieldValidationResult
    
    // 自定义验证器
    registerValidator(name: string, validator: CustomValidator): void
    
    // 异步验证
    validateAsync(schema: ConfigSchemaDefinition, data: any): Promise<ValidationResult>
  }
  
  // 条件显示
  conditional: {
    // 计算字段可见性
    isFieldVisible(fieldSchema: FieldSchema, data: any): boolean
    
    // 计算字段启用状态
    isFieldEnabled(fieldSchema: FieldSchema, data: any): boolean
    
    // 依赖关系解析
    resolveDependencies(schema: ConfigSchemaDefinition): DependencyGraph
  }
}

interface ConfigSchemaDefinition {
  // Schema元信息
  $schema?: string
  $id?: string
  title?: string
  description?: string
  version?: string
  
  // 根对象类型（通常是object）
  type: 'object'
  
  // 字段定义
  properties: Record<string, FieldSchema>
  
  // 必填字段
  required?: string[]
  
  // 字段顺序
  propertyOrder?: string[]
  
  // 分组配置
  groups?: SchemaGroup[]
  
  // 全局配置
  options?: {
    theme?: string
    layout?: 'vertical' | 'horizontal' | 'inline'
    labelWidth?: number
    showHelp?: boolean
    collapsible?: boolean
  }
}

interface FieldSchema {
  // 基础类型
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'null'
  
  // 字段信息
  title?: string
  description?: string
  default?: any
  
  // 约束条件
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  format?: string
  
  // 枚举选项
  enum?: any[]
  enumNames?: string[]
  
  // 对象类型
  properties?: Record<string, FieldSchema>
  additionalProperties?: boolean | FieldSchema
  
  // 数组类型
  items?: FieldSchema
  minItems?: number
  maxItems?: number
  uniqueItems?: boolean
  
  // UI配置
  ui?: {
    // 组件类型
    component?: string
    // 组件属性
    componentProps?: Record<string, any>
    // 布局配置
    layout?: {
      span?: number
      offset?: number
      labelCol?: number
      wrapperCol?: number
    }
    // 样式类
    className?: string
    style?: Record<string, any>
    // 占位符
    placeholder?: string
    // 帮助文本
    help?: string
    // 标签配置
    label?: {
      text?: string
      tooltip?: string
      required?: boolean
    }
  }
  
  // 条件显示
  dependencies?: Record<string, FieldDependency>
  
  // 验证规则
  validation?: {
    rules?: ValidationRule[]
    asyncRules?: AsyncValidationRule[]
    trigger?: 'change' | 'blur' | 'submit'
  }
}

interface SchemaGroup {
  key: string
  title: string
  description?: string
  fields: string[]
  
  // 分组UI配置
  ui?: {
    collapsible?: boolean
    defaultExpanded?: boolean
    icon?: string
    layout?: 'card' | 'fieldset' | 'tabs'
  }
}

interface FieldDependency {
  // 依赖字段路径
  source: string
  
  // 条件类型
  condition: 'equals' | 'not-equals' | 'contains' | 'not-contains' | 'greater' | 'less' | 'exists' | 'not-exists'
  
  // 条件值
  value?: any
  
  // 作用类型
  effect: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'optional'
}

interface ValidationRule {
  type: 'required' | 'pattern' | 'min' | 'max' | 'length' | 'custom'
  value?: any
  message?: string
  validator?: (value: any, data: any) => boolean | string
}

interface AsyncValidationRule {
  type: string
  validator: (value: any, data: any) => Promise<boolean | string>
  debounce?: number
}

// 内置表单组件
const BUILT_IN_FORM_COMPONENTS = {
  // 基础输入
  'text-input': {
    component: 'NInput',
    props: { type: 'text' }
  },
  'textarea': {
    component: 'NInput',
    props: { type: 'textarea', rows: 3 }
  },
  'number-input': {
    component: 'NInputNumber',
    props: {}
  },
  'password-input': {
    component: 'NInput',
    props: { type: 'password', showPasswordOn: 'click' }
  },
  
  // 选择器
  'select': {
    component: 'NSelect',
    props: { clearable: true }
  },
  'multi-select': {
    component: 'NSelect',
    props: { multiple: true, clearable: true }
  },
  'radio-group': {
    component: 'NRadioGroup',
    props: {}
  },
  'checkbox-group': {
    component: 'NCheckboxGroup',
    props: {}
  },
  
  // 开关和滑块
  'switch': {
    component: 'NSwitch',
    props: {}
  },
  'slider': {
    component: 'NSlider',
    props: {}
  },
  'rate': {
    component: 'NRate',
    props: {}
  },
  
  // 颜色和日期
  'color-picker': {
    component: 'NColorPicker',
    props: { showAlpha: true }
  },
  'date-picker': {
    component: 'NDatePicker',
    props: { type: 'date' }
  },
  'time-picker': {
    component: 'NTimePicker',
    props: {}
  },
  
  // 上传和文件
  'upload': {
    component: 'NUpload',
    props: { max: 1 }
  },
  'image-upload': {
    component: 'NUpload',
    props: { accept: 'image/*', listType: 'image-card' }
  },
  
  // 复杂组件
  'code-editor': {
    component: 'CodeEditor',
    props: { language: 'json' }
  },
  'json-editor': {
    component: 'JsonEditor',
    props: {}
  },
  'expression-editor': {
    component: 'ExpressionEditor',
    props: {}
  }
}

// 配置Schema示例：文本卡片
const TEXT_CARD_SCHEMA: ConfigSchemaDefinition = {
  title: '文本卡片配置',
  type: 'object',
  groups: [
    {
      key: 'basic',
      title: '基础配置',
      fields: ['title', 'content', 'textAlign'],
      ui: { defaultExpanded: true }
    },
    {
      key: 'style',
      title: '样式配置', 
      fields: ['fontSize', 'fontWeight', 'color', 'backgroundColor'],
      ui: { collapsible: true }
    },
    {
      key: 'interaction',
      title: '交互配置',
      fields: ['clickable', 'clickAction', 'hoverEffect'],
      ui: { collapsible: true }
    }
  ],
  properties: {
    title: {
      type: 'string',
      title: '标题',
      default: '文本标题',
      ui: {
        component: 'text-input',
        placeholder: '请输入标题'
      },
      validation: {
        rules: [{ type: 'required', message: '标题不能为空' }]
      }
    },
    content: {
      type: 'string',
      title: '内容',
      default: '这是文本内容',
      ui: {
        component: 'textarea',
        componentProps: { rows: 4 },
        placeholder: '请输入内容'
      }
    },
    textAlign: {
      type: 'string',
      title: '文本对齐',
      default: 'left',
      enum: ['left', 'center', 'right', 'justify'],
      enumNames: ['左对齐', '居中', '右对齐', '两端对齐'],
      ui: {
        component: 'radio-group'
      }
    },
    fontSize: {
      type: 'number',
      title: '字体大小',
      default: 14,
      minimum: 12,
      maximum: 48,
      ui: {
        component: 'slider',
        componentProps: { marks: { 12: '12px', 24: '24px', 48: '48px' } }
      }
    },
    fontWeight: {
      type: 'string',
      title: '字体粗细',
      default: 'normal',
      enum: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
      enumNames: ['正常', '粗体', '100', '200', '300', '400', '500', '600', '700', '800', '900'],
      ui: {
        component: 'select'
      }
    },
    color: {
      type: 'string',
      title: '文字颜色',
      default: '#333333',
      format: 'color',
      ui: {
        component: 'color-picker'
      }
    },
    backgroundColor: {
      type: 'string',  
      title: '背景颜色',
      default: 'transparent',
      format: 'color',
      ui: {
        component: 'color-picker',
        componentProps: { showAlpha: true }
      }
    },
    clickable: {
      type: 'boolean',
      title: '启用点击',
      default: false,
      ui: {
        component: 'switch'
      }
    },
    clickAction: {
      type: 'string',
      title: '点击行为',
      default: 'none',
      enum: ['none', 'link', 'modal', 'custom'],
      enumNames: ['无', '跳转链接', '弹出模态', '自定义'],
      dependencies: {
        clickable: {
          source: 'clickable',
          condition: 'equals',
          value: true,
          effect: 'show'
        }
      },
      ui: {
        component: 'select'
      }
    },
    hoverEffect: {
      type: 'boolean',
      title: '悬停效果',
      default: true,
      ui: {
        component: 'switch'
      }
    }
  },
  required: ['title', 'content']
}
```

#### 3.2.6 数据引擎 - 状态管理和同步
```typescript
interface NodeRegistry {
  // 分类管理
  categories: NodeCategory[]
  
  // 组件注册
  register(component: ComponentDefinition): void
  unregister(type: string): void
  
  // 查询接口
  getByType(type: string): ComponentDefinition | null
  getByCategory(categoryId: string): ComponentDefinition[]
  search(keyword: string): ComponentDefinition[]
  
  // 树形结构生成
  generateTree(): NodeTreeItem[]
  
  // 验证接口
  validate(component: ComponentDefinition): ValidationResult
}
```

#### 3.2.3 看板渲染器接口
```typescript
interface CanvasRenderer {
  // 渲染器标识
  readonly type: string
  
  // 初始化
  init(container: HTMLElement, config: RendererConfig): Promise<void>
  destroy(): void
  
  // 节点管理
  addNode(node: NodeData): Promise<void>
  removeNode(nodeId: string): Promise<void>
  updateNode(nodeId: string, data: Partial<NodeData>): Promise<void>
  
  // 布局操作
  layout(): Promise<void>
  setViewport(viewport: Viewport): Promise<void>
  
  // 选择管理
  selectNodes(nodeIds: string[]): void
  clearSelection(): void
  
  // 事件处理
  on(event: RendererEvent, handler: EventHandler): void
  off(event: RendererEvent, handler: EventHandler): void
  
  // 导出能力
  exportImage(): Promise<Blob>
  exportData(): Promise<any>
}

// GridStack渲染器实现
interface GridStackRenderer extends CanvasRenderer {
  gridstack: GridStack
  
  // GridStack特有配置
  updateGridConfig(config: {
    columns?: number
    cellHeight?: number
    margin?: number
    animate?: boolean
  }): void
}
```

#### 3.2.4 配置器（JSON驱动表单）
```typescript
interface ConfigRenderer {
  // 根据Schema渲染表单
  render(schema: ConfigSchema, data: any): VNode
  
  // 表单组件注册
  registerComponent(type: string, component: Component): void
  
  // 验证
  validate(schema: ConfigSchema, data: any): ValidationResult
  
  // 事件处理
  onChange(path: string, value: any): void
  onValidate(errors: ValidationError[]): void
}

interface ConfigSchema {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'enum'
  title?: string
  description?: string
  
  // 对象类型
  properties?: Record<string, ConfigSchema>
  required?: string[]
  
  // 数组类型
  items?: ConfigSchema
  minItems?: number
  maxItems?: number
  
  // 字符串/数字类型
  minimum?: number
  maximum?: number
  pattern?: string
  
  // 枚举类型
  enum?: any[]
  enumLabels?: string[]
  
  // UI渲染相关
  component?: string
  componentProps?: Record<string, any>
  
  // 条件显示
  dependencies?: {
    [key: string]: {
      condition: 'equals' | 'not-equals' | 'contains'
      value: any
    }
  }
}
```

#### 3.2.5 节点渲染器（自适应容器）
```typescript
interface NodeRenderer {
  // 容器管理
  container: HTMLElement
  
  // 自适应机制
  resize(size: { width: number, height: number }): void
  getContentSize(): { width: number, height: number }
  
  // 生命周期
  mount(vueComponent: Component, props: any): void
  unmount(): void
  update(props: any): void
  
  // 事件代理
  emit(event: string, data: any): void
  on(event: string, handler: Function): void
}

// 自适应策略
interface ResponsiveStrategy {
  // 初始大小计算
  calculateInitialSize(component: ComponentDefinition): { w: number, h: number }
  
  // 容器变化响应
  onContainerResize(newSize: Size, oldSize: Size): void
  
  // 内容变化响应
  onContentChange(): void
  
  // 约束条件
  constraints: {
    minSize: Size
    maxSize?: Size
    aspectRatio?: number
    snapToGrid: boolean
  }
}
```

## 4. 关键问题解决方案

### 4.1 基础配置分层策略

#### 编辑器底座层配置
```typescript
interface EditorBaseConfig {
  // UI布局
  layout: EditorLayout
  
  // 全局交互行为
  interaction: {
    allowDrag: boolean
    allowResize: boolean
    allowDelete: boolean
    multiSelect: boolean
    contextMenu: boolean
  }
  
  // 性能配置
  performance: {
    virtualScrolling: boolean
    lazyLoading: boolean
    maxNodes: number
  }
}
```

#### 看板渲染器层配置
```typescript
interface RendererConfig {
  // 渲染器通用配置
  common: {
    background: string
    grid: boolean
    guides: boolean
    snap: boolean
  }
  
  // 特定渲染器配置
  gridstack?: GridStackConfig
  threejs?: ThreeJSConfig
  svg?: SVGConfig
  canvas?: CanvasConfig
}
```

#### 节点层配置
```typescript
interface NodeConfig {
  // 布局配置（由渲染器管理）
  layout: any  // 格式由具体渲染器定义
  
  // UI配置（由节点渲染器管理）
  style: {
    border?: BorderConfig
    shadow?: ShadowConfig
    background?: BackgroundConfig
    opacity?: number
    transform?: TransformConfig
  }
  
  // 业务配置（由具体组件定义）
  content: Record<string, any>
  
  // 交互配置
  interaction: {
    selectable: boolean
    draggable: boolean
    resizable: boolean
    clickThrough: boolean
    events: EventConfig[]
  }
}
```

### 4.2 自适应渲染机制

#### ResizeObserver策略
```typescript
class AdaptiveNodeContainer {
  private resizeObserver: ResizeObserver
  private contentElement: HTMLElement
  private wrapperElement: HTMLElement
  
  constructor(private nodeRenderer: NodeRenderer) {
    this.setupResizeObserver()
    this.setupResponsiveContainer()
  }
  
  private setupResizeObserver() {
    this.resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        this.handleResize(entry.contentRect)
      }
    })
  }
  
  private handleResize(rect: DOMRectReadOnly) {
    // 通知Vue组件容器大小变化
    this.nodeRenderer.emit('container-resize', {
      width: rect.width,
      height: rect.height
    })
    
    // 更新CSS变量
    this.updateCSSVariables(rect)
  }
  
  private updateCSSVariables(rect: DOMRectReadOnly) {
    const root = this.wrapperElement
    root.style.setProperty('--container-width', `${rect.width}px`)
    root.style.setProperty('--container-height', `${rect.height}px`)
  }
}
```

#### Vue组件响应式接口
```typescript
// 组件可以通过这个接口获取容器信息
interface NodeComponentContext {
  // 容器尺寸（响应式）
  containerSize: Ref<{ width: number, height: number }>
  
  // 更新容器需求尺寸
  requestResize(size: { width?: number, height?: number }): void
  
  // 获取渲染器配置
  getRendererConfig(): RendererConfig
  
  // 事件发射
  emit(event: string, data: any): void
}

// 使用示例
export default defineComponent({
  setup() {
    const nodeContext = inject<NodeComponentContext>('nodeContext')
    
    // 响应容器变化
    watch(nodeContext.containerSize, (newSize) => {
      // 组件自适应逻辑
    })
    
    return { nodeContext }
  }
})
```

## 5. 数据流设计

### 5.1 配置数据流
```
用户操作配置器 
  → 配置Schema验证 
  → 编辑器底座状态更新 
  → 目标渲染器接收更新 
  → UI重新渲染
```

### 5.2 交互事件流
```
用户交互事件 
  → 事件管理器处理 
  → 编辑器底座状态变更 
  → 相关组件同步更新 
  → UI反馈
```

### 5.3 节点生命周期
```
拖拽创建 
  → 节点注册器提供默认数据 
  → 看板渲染器添加布局 
  → 节点渲染器挂载组件 
  → 配置器显示配置表单
```

## 6. 扩展机制设计

### 6.1 插件接口
```typescript
interface PanelPlugin {
  name: string
  version: string
  
  // 节点扩展
  registerNodes?(): ComponentDefinition[]
  
  // 工具扩展
  registerTools?(): ToolDefinition[]
  
  // 渲染器扩展
  registerRenderer?(): CanvasRenderer
  
  // 配置组件扩展
  registerConfigComponents?(): ComponentDefinition[]
  
  // 生命周期
  install?(app: App): void
  uninstall?(): void
}
```

### 6.2 渲染器扩展示例
```typescript
// 3D渲染器扩展
class ThreeJSRenderer implements CanvasRenderer {
  readonly type = 'threejs'
  private scene: THREE.Scene
  private camera: THREE.Camera
  private renderer: THREE.WebGLRenderer
  
  async init(container: HTMLElement, config: RendererConfig) {
    // Three.js初始化逻辑
  }
  
  async addNode(node: NodeData) {
    // 在3D空间中添加节点
  }
  
  // ... 其他接口实现
}
```

## 7. 技术实现建议

### 7.1 技术栈选择
- **框架**：Vue 3 + TypeScript
- **状态管理**：Pinia
- **布局渲染**：GridStack.js（当前）
- **样式方案**：CSS Variables + CSS-in-JS
- **构建工具**：Vite

### 7.2 开发阶段规划

#### Phase 1：基础架构（2周）
- [ ] 编辑器底座UI布局
- [ ] 基础状态管理
- [ ] GridStack渲染器
- [ ] 简单配置器

#### Phase 2：核心功能（3周）
- [ ] JSON Schema配置器
- [ ] 节点自适应机制
- [ ] 事件管理器
- [ ] 基础工具集

#### Phase 3：扩展能力（2周）
- [ ] 插件系统
- [ ] 多渲染器支持
- [ ] 高级配置功能

### 7.3 性能优化策略
- **虚拟滚动**：大量节点时使用虚拟滚动
- **懒加载**：配置组件按需加载
- **缓存策略**：渲染结果缓存
- **批量更新**：状态变更批量处理

## 8. 总结

这个架构设计确保了：

1. **清晰的分层**：每层职责明确，边界清晰
2. **高可扩展性**：支持多种渲染器、多种节点类型
3. **数据驱动**：配置完全由JSON Schema驱动
4. **技术无关**：可以集成任何前端技术栈
5. **性能可控**：具备多种性能优化手段

核心创新点在于将"基础配置"和"基础交互"正确分配到各个层级，确保了系统的可维护性和可扩展性。