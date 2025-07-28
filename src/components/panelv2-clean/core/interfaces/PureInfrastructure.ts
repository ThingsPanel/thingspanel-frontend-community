/**
 * @file 纯净基础设施层 - 核心接口定义
 * @description 定义第一层的核心职责边界和标准化接口
 * 这一层是纯粹的"架子"，不关心具体业务实现
 */

// ==================== 数据协议定义 ====================

/**
 * 组件树数据结构（左侧列表区数据）
 */
export interface ComponentTreeData {
  /** 分类列表 */
  categories: Array<{
    id: string
    name: string
    icon?: string
    order: number
    components: ComponentListItem[]
  }>
  /** 搜索状态 */
  searchState: {
    keyword: string
    activeCategory: string | null
    filteredComponents: ComponentListItem[]
  }
  /** 展开状态 */
  expandState: Record<string, boolean>
}

/**
 * 组件列表项
 */
export interface ComponentListItem {
  id: string
  name: string
  category: string
  icon?: string
  description?: string
  tags?: string[]
  dragData: {
    type: string
    payload: any
  }
}

/**
 * 面板状态数据（中间编辑区数据）
 */
export interface PanelStateData {
  /** 面板基础信息 */
  info: {
    id: string
    name: string
    description?: string
    version: string
    createdAt: number
    updatedAt: number
  }
  /** 节点列表 */
  nodes: NodeData[]
  /** 选中状态 */
  selection: {
    selectedIds: string[]
    lastSelectedId: string | null
    multiSelectMode: boolean
  }
  /** 视图状态 */
  viewport: {
    zoom: number
    offsetX: number
    offsetY: number
    gridVisible: boolean
    snapToGrid: boolean
  }
  /** 操作状态 */
  operationState: {
    isDragging: boolean
    isResizing: boolean
    dragOverNodeId: string | null
  }
}

/**
 * 节点数据
 */
export interface NodeData {
  id: string
  type: string
  name: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  config: Record<string, any>
  style: Record<string, any>
  children?: string[]
  meta: {
    createTime: number
    updateTime: number
    version: string
  }
}

/**
 * 配置面板数据（右侧配置区数据）
 */
export interface ConfigPanelData {
  /** 当前配置目标 */
  target: {
    type: 'node' | 'panel' | 'selection' | null
    id: string | null
    data: any
  }
  /** 配置表单定义 */
  formSchema: ConfigFormSchema | null
  /** 配置分组 */
  groups: Array<{
    id: string
    name: string
    order: number
    collapsed: boolean
    fields: string[]
  }>
  /** 验证状态 */
  validation: {
    errors: Record<string, string[]>
    warnings: Record<string, string[]>
    isValid: boolean
  }
}

/**
 * 配置表单schema
 */
export interface ConfigFormSchema {
  fields: ConfigFieldDefinition[]
  layout: 'tabs' | 'groups' | 'flat'
  validation: ValidationRule[]
}

/**
 * 配置字段定义
 */
export interface ConfigFieldDefinition {
  key: string
  type: 'text' | 'number' | 'color' | 'select' | 'switch' | 'slider' | 'image'
  label: string
  defaultValue?: any
  options?: any[]
  validation?: FieldValidationRule[]
  dependencies?: string[]
  group?: string
  order: number
}

/**
 * 工具栏状态数据（顶部工具条数据）
 */
export interface ToolbarStateData {
  /** 工具分组 */
  groups: Array<{
    id: string
    name: string
    order: number
    collapsed: boolean
    tools: ToolDefinition[]
  }>
  /** 快捷操作状态 */
  quickActions: {
    canSave: boolean
    canUndo: boolean
    canRedo: boolean
    canClear: boolean
    isDirty: boolean
  }
  /** 视图控制 */
  viewControls: {
    zoom: number
    gridVisible: boolean
    snapEnabled: boolean
    previewMode: boolean
  }
}

/**
 * 工具定义
 */
export interface ToolDefinition {
  id: string
  name: string
  icon: string
  type: 'button' | 'toggle' | 'dropdown' | 'slider'
  action: string
  enabled: boolean
  active?: boolean
  options?: any[]
  shortcut?: string
}

// ==================== 验证规则 ====================

export interface ValidationRule {
  field: string
  rules: FieldValidationRule[]
}

export interface FieldValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message: string
  validator?: (value: any) => boolean
}

// ==================== 数据变更事件 ====================

/**
 * 数据变更事件
 */
export interface DataChangeEvent {
  type: 'componentTree' | 'panelState' | 'configPanel' | 'toolbar'
  operation: 'create' | 'update' | 'delete' | 'batch'
  targetId: string
  oldValue?: any
  newValue?: any
  timestamp: number
  source: string
}

/**
 * 批量变更事件
 */
export interface BatchChangeEvent {
  batchId: string
  changes: DataChangeEvent[]
  operation: 'start' | 'end' | 'abort'
  timestamp: number
}

// ==================== 第一层核心接口 ====================

/**
 * 纯净基础设施层核心接口
 * 这是第一层的总接口，定义了所有基础能力
 */
export interface PureInfrastructure {
  /** 布局管理器 - 四区域布局框架 */
  layout: LayoutManager
  
  /** 数据管道 - 标准化数据传递 */
  pipeline: DataPipeline
  
  /** 生命周期管理 - 钩子框架 */
  lifecycle: LifecycleManager
  
  /** 导入导出门户 - 数据转换接口 */
  porter: ImportExportPorter
  
  /** 事件总线 - 跨区域通信 */
  eventBus: EventBus
  
  /** 扩展点管理 - 插件注册机制 */
  extensions: ExtensionPointManager
}

/**
 * 布局管理器接口
 * 负责四区域布局框架，不关心区域内具体内容
 */
export interface LayoutManager {
  /** 初始化布局 */
  initialize(container: HTMLElement, config: LayoutConfig): void
  
  /** 获取区域容器 */
  getRegion(region: 'toolbar' | 'sidebar' | 'canvas' | 'inspector'): HTMLElement
  
  /** 设置区域尺寸 */
  setRegionSize(region: string, size: RegionSize): void
  
  /** 切换区域可见性 */
  toggleRegion(region: string, visible: boolean): void
  
  /** 保存布局状态 */
  saveLayout(): LayoutState
  
  /** 恢复布局状态 */
  restoreLayout(state: LayoutState): void
  
  /** 响应式适配 */
  handleResize(): void
}

/**
 * 数据管道接口
 * 负责标准化数据传递协议，不关心数据具体内容
 */
export interface DataPipeline {
  /** 注册数据源 */
  registerSource<T>(sourceId: string, source: DataSource<T>): void
  
  /** 注册数据目标 */
  registerTarget<T>(targetId: string, target: DataTarget<T>): void
  
  /** 建立数据流 */
  createDataFlow(sourceId: string, targetId: string, transformer?: DataTransformer): void
  
  /** 推送数据变更 */
  pushChange(event: DataChangeEvent): void
  
  /** 开始批量操作 */
  startBatch(batchId: string): void
  
  /** 结束批量操作 */
  endBatch(batchId: string): void
  
  /** 监听数据变更 */
  onDataChange(callback: (event: DataChangeEvent) => void): void
}

/**
 * 导入导出门户接口
 * 定义数据转换的标准接口，不关心具体格式实现
 */
export interface ImportExportPorter {
  /** 注册导入器 */
  registerImporter(format: string, importer: DataImporter): void
  
  /** 注册导出器 */
  registerExporter(format: string, exporter: DataExporter): void
  
  /** 执行导入 */
  import(format: string, data: string, options?: ImportOptions): Promise<ImportResult>
  
  /** 执行导出 */
  export(format: string, options?: ExportOptions): Promise<string>
  
  /** 获取支持的格式 */
  getSupportedFormats(): { import: string[]; export: string[] }
}

/**
 * 扩展点管理器接口
 * 提供插件式扩展机制
 */
export interface ExtensionPointManager {
  /** 注册渲染引擎 */
  registerRenderer(type: string, renderer: Renderer): void
  
  /** 注册工具提供者 */
  registerToolProvider(category: string, provider: ToolProvider): void
  
  /** 注册数据处理器 */
  registerDataProcessor(type: string, processor: DataProcessor): void
  
  /** 获取已注册的扩展 */
  getExtensions(type: string): any[]
  
  /** 卸载扩展 */
  unregisterExtension(type: string, id: string): void
}

// ==================== 辅助类型定义 ====================

export interface LayoutConfig {
  responsive: boolean
  defaultSizes: Record<string, RegionSize>
  minSizes: Record<string, RegionSize>
  maxSizes: Record<string, RegionSize>
  collapsible: string[]
}

export interface RegionSize {
  width?: number | string
  height?: number | string
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
}

export interface LayoutState {
  sizes: Record<string, RegionSize>
  visibility: Record<string, boolean>
  responsive: boolean
  timestamp: number
}

export interface DataSource<T> {
  getData(): Promise<T>
  subscribe(callback: (data: T) => void): () => void
}

export interface DataTarget<T> {
  setData(data: T): Promise<void>
  validate?(data: T): ValidationResult
}

export interface DataTransformer {
  transform(data: any): any
  reverse?(data: any): any
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface DataImporter {
  import(data: string, options?: any): Promise<any>
  validate(data: string): ValidationResult
  getSupportedOptions(): any
}

export interface DataExporter {
  export(data: any, options?: any): Promise<string>
  getSupportedOptions(): any
}

export interface ImportResult {
  success: boolean
  data?: any
  errors?: string[]
  warnings?: string[]
}

export interface ImportOptions {
  overwrite?: boolean
  validate?: boolean
  merge?: boolean
  [key: string]: any
}

export interface ExportOptions {
  format?: 'json' | 'yaml' | 'xml'
  compress?: boolean
  includeMetadata?: boolean
  selection?: string[]
  [key: string]: any
}

export interface Renderer {
  type: string
  render(container: HTMLElement, data: any): void
  update(data: any): void
  destroy(): void
}

export interface ToolProvider {
  getTools(): ToolDefinition[]
  handleAction(action: string, context: any): void
}

export interface DataProcessor {
  process(data: any): any
  validate(data: any): ValidationResult
}