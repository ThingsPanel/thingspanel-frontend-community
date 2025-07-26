/**
 * @file 核心类型定义
 * @description PanelV2-Clean 核心数据结构类型定义
 */

/**
 * 基础尺寸接口
 */
export interface Size {
  width: number
  height: number
}

/**
 * 基础位置接口
 */
export interface Position {
  x: number
  y: number
}

/**
 * 基础矩形区域接口
 */
export interface Rect extends Position, Size {}

/**
 * 看板元信息接口
 */
export interface PanelMeta {
  /** 看板ID */
  id: string
  /** 看板名称 */
  name: string
  /** 版本号 */
  version: string
  /** 创建时间 */
  createdAt: string
  /** 更新时间 */
  updatedAt: string
  /** 描述信息 */
  description?: string
  /** 标签 */
  tags?: string[]
  /** 当前使用的渲染引擎 */
  renderEngine: string
  /** 是否从V1迁移 */
  migratedFromV1?: boolean
}

/**
 * 看板配置接口
 */
export interface PanelConfig {
  /** 布局配置 */
  layout: {
    /** 网格列数 */
    gridColumns: number
    /** 单元格高度 */
    cellHeight: number
    /** 间距 */
    margin: number
    /** 内边距 */
    padding: number
  }

  /** 外观配置 */
  appearance: {
    /** 背景颜色 */
    backgroundColor: string
    /** 主题类型 */
    theme: 'light' | 'dark' | 'auto'
  }

  /** 数据配置 */
  data: {
    /** 全局数据源 */
    globalDataSource: string
    /** 共享变量 */
    sharedVariables: string
    /** API配置 */
    apiConfig: {
      timeout: number
      refreshInterval: number
    }
    /** 实时数据配置 */
    realTimeConfig: {
      enabled: boolean
    }
  }

  /** 交互配置 */
  interaction: {
    /** 是否允许拖拽 */
    allowDrag: boolean
    /** 是否允许调整大小 */
    allowResize: boolean
    /** 是否允许编辑 */
    allowEdit: boolean
    /** 是否允许删除 */
    allowDelete: boolean
    /** 全局点击行为 */
    globalClickBehavior: {
      type: 'blur' | 'none'
      clearSelection: boolean
    }
  }

  /** 元数据 */
  meta: {
    title: string
    version: string
    createTime: string
    updateTime: string
  }
}

/**
 * 节点布局接口
 */
export interface NodeLayout {
  /** X坐标 */
  x: number
  /** Y坐标 */
  y: number
  /** 宽度（网格单位） */
  w: number
  /** 高度（网格单位） */
  h: number
  /** 最小宽度 */
  minW?: number
  /** 最小高度 */
  minH?: number
  /** 最大宽度 */
  maxW?: number
  /** 最大高度 */
  maxH?: number
  /** 是否锁定位置 */
  locked?: boolean
}

/**
 * 节点基础配置接口
 */
export interface NodeBaseConfig {
  /** 布局信息 */
  layout: NodeLayout

  /** 状态配置 */
  state: {
    /** 是否锁定 */
    locked: boolean
    /** 是否隐藏 */
    hidden: boolean
    /** 是否禁用 */
    disabled: boolean
  }

  /** 外观配置 */
  appearance: {
    /** 边框配置 */
    border: {
      width: number
      style: 'solid' | 'dashed' | 'dotted' | 'none'
      color: string
      radius: number
    }
    /** 透明度 */
    opacity: number
  }
}

/**
 * 节点交互配置接口
 */
export interface NodeInteractionConfig {
  /** 点击行为 */
  onClick: {
    type: 'none' | 'link' | 'modal' | 'custom'
    data?: any
  }

  /** 悬停行为 */
  onHover: {
    /** 是否高亮 */
    highlight: boolean
    /** 高亮颜色 */
    highlightColor?: string
  }
}

/**
 * 节点内容配置接口（由具体组件定义）
 */
export interface NodeContentConfig {
  [key: string]: any
}

/**
 * 节点样式配置接口
 */
export interface NodeStyleConfig {
  /** 背景样式 */
  background?: {
    color?: string
    image?: string
    gradient?: string
  }

  /** 阴影样式 */
  shadow?: {
    enabled: boolean
    color: string
    blur: number
    offsetX: number
    offsetY: number
  }

  /** 自定义CSS */
  customCSS?: string
}

/**
 * 数据绑定接口
 */
export interface DataBinding {
  /** 数据源标识 */
  source: string
  /** 绑定字段 */
  fields: string[]
  /** 数据变换函数 */
  transform?: string
}

/**
 * 节点元数据接口
 */
export interface NodeMeta {
  /** 创建时间 */
  createTime: number
  /** 更新时间 */
  updateTime: number
  /** 版本 */
  version: string
  /** 标签 */
  tags?: string[]
}

/**
 * 节点数据接口
 */
export interface NodeData {
  /** 节点ID */
  id: string
  /** 节点类型 */
  type: string
  /** 节点名称 */
  name: string

  /** 布局信息 */
  layout: NodeLayout

  /** 分层配置 */
  config: {
    /** 基础配置 */
    base: NodeBaseConfig
    /** 交互配置 */
    interaction: NodeInteractionConfig
    /** 内容配置 */
    content: NodeContentConfig
  }

  /** 样式配置 */
  style: NodeStyleConfig

  /** 数据绑定 */
  dataBind?: DataBinding

  /** 元数据 */
  meta: NodeMeta
}

/**
 * 运行时状态接口
 */
export interface RuntimeState {
  /** 选中的节点ID列表 */
  selectedNodeIds: string[]
  /** 视图模式 */
  viewMode: 'edit' | 'preview' | 'fullscreen'
  /** 视窗状态 */
  viewport: {
    zoom: number
    offsetX: number
    offsetY: number
  }
  /** 剪贴板数据 */
  clipboard?: NodeData[]
  /** 是否有未保存的修改 */
  isDirty: boolean
  /** 最后保存时间 */
  lastSaveTime?: number
}

/**
 * 完整看板数据接口
 */
export interface PanelV2Data {
  /** 看板元信息 */
  meta: PanelMeta

  /** 看板级配置 */
  config: PanelConfig

  /** 节点数据集合 */
  nodes: NodeData[]

  /** 运行时状态（不持久化，仅内存） */
  runtime: RuntimeState

  /** 扩展数据（插件使用） */
  extensions?: Record<string, any>
}

/**
 * 组件定义接口
 */
export interface ComponentDefinition {
  /** 组件类型标识 */
  type: string
  /** 组件名称 */
  name: string
  /** 组件分类 */
  category: string

  /** Vue组件 */
  component: any

  /** 配置Schema */
  configSchema: {
    /** 基础配置schema */
    base: any
    /** 交互配置schema */
    interaction: any
    /** 内容配置schema */
    content: any
  }

  /** 默认配置 */
  defaults: {
    layout: NodeLayout
    config: {
      base: Partial<NodeBaseConfig>
      interaction: Partial<NodeInteractionConfig>
      content: NodeContentConfig
    }
    style: NodeStyleConfig
  }

  /** 组件元信息 */
  meta: {
    title: string
    description?: string
    icon?: string
    poster?: string
    version: string
    author?: string
    keywords?: string[]
  }

  /** 响应式配置 */
  responsive?: {
    autoResize: boolean
    maintainAspectRatio?: boolean
    resizeHandles?: Array<'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw'>
  }
}

/**
 * 分类定义接口
 */
export interface CategoryDefinition {
  /** 分类ID */
  id: string
  /** 分类名称 */
  name: string
  /** 分类描述 */
  description?: string
  /** 分类图标 */
  icon?: string
  /** 分类颜色 */
  color?: string
  /** 父分类ID */
  parentId?: string
  /** 排序序号 */
  order: number

  /** 显示配置 */
  display: {
    collapsible: boolean
    defaultExpanded: boolean
    showCount: boolean
  }

  /** 权限控制 */
  permissions?: {
    view?: string[]
    create?: string[]
    edit?: string[]
  }

  /** 元数据 */
  meta: {
    createdAt: number
    updatedAt: number
    version: string
  }
}

/**
 * 分类树节点接口
 */
export interface CategoryTreeNode {
  /** 节点ID */
  id: string
  /** 节点名称 */
  name: string
  /** 节点图标 */
  icon?: string
  /** 节点类型 */
  type: 'category' | 'component'
  /** 子节点 */
  children?: CategoryTreeNode[]

  /** 分类特有属性 */
  categoryData?: CategoryDefinition
  /** 组件特有属性 */
  componentData?: ComponentDefinition

  /** UI状态 */
  expanded?: boolean
  visible?: boolean
  disabled?: boolean

  /** 统计信息 */
  componentCount?: number
  totalCount?: number
}
