// 配置类型定义

export interface PanelConfig {
  // 布局配置
  layout: {
    gridColumns: number // 网格列数
    cellHeight: number // 单元格高度
    margin: number // 卡片间距
    padding: number // 画布内边距
  }

  // 外观配置
  appearance: {
    backgroundColor: string // 背景色
    backgroundImage?: string // 背景图
    theme?: string // 主题标识
  }

  // 数据配置（重要：全局数据源，可传递给所有卡片）
  data: {
    globalDataSource: string // 全局数据源配置（JSON字符串）
    sharedVariables: string // 共享变量（JSON字符串）
    apiConfig?: {
      baseUrl?: string // API基础URL
      headers?: Record<string, string> // 请求头
      timeout?: number // 超时时间
      refreshInterval?: number // 刷新间隔
    }
    realTimeConfig?: {
      enabled: boolean // 是否启用实时数据
      websocketUrl?: string // WebSocket连接地址
      eventTypes?: string[] // 监听的事件类型
    }
  }

  // 交互配置
  interaction: {
    allowDrag: boolean // 允许拖拽
    allowResize: boolean // 允许调整大小
    allowEdit: boolean // 允许编辑
    allowDelete: boolean // 允许删除
    globalClickBehavior?: {
      type: 'none' | 'blur' | 'select'
      clearSelection?: boolean
    }
  }

  // 元信息
  meta: {
    title: string // 看板标题
    description?: string // 看板描述
    version: string // 版本号
    createTime?: string // 创建时间
    updateTime?: string // 更新时间
  }
}

export interface NodeLayout {
  x: number // X位置（网格单位）
  y: number // Y位置（网格单位）
  w: number // 宽度（占几列）
  h: number // 高度（占几行）
  minW?: number // 最小宽度
  minH?: number // 最小高度
  maxW?: number // 最大宽度
  maxH?: number // 最大高度
}

export interface NodeBaseConfig {
  // 布局配置（与看板渲染器相关）
  layout: NodeLayout

  // 状态配置
  state: {
    locked: boolean // 是否锁定（不可拖拽调整）
    hidden: boolean // 是否隐藏
    disabled: boolean // 是否禁用
    zIndex?: number // 层级
  }

  // 外观配置
  appearance: {
    className?: string // 自定义CSS类
    border?: {
      width?: number
      style?: string
      color?: string
      radius?: number
    }
    shadow?: {
      x?: number
      y?: number
      blur?: number
      color?: string
    }
    opacity?: number // 透明度
  }
}

export interface NodeInteractionConfig {
  // 点击行为
  onClick?: {
    type: 'none' | 'navigate' | 'popup' | 'action' | 'custom'
    target?: string // 跳转目标或动作目标
    params?: Record<string, any> // 参数
    confirm?: boolean // 是否需要确认
  }

  // 双击行为
  onDoubleClick?: {
    type: 'none' | 'edit' | 'fullscreen' | 'custom'
    action?: string
  }

  // 悬停行为
  onHover?: {
    tooltip?: string // 提示内容
    position?: 'top' | 'bottom' | 'left' | 'right'
    highlight: boolean // 是否高亮
    delay?: number // 延迟显示（毫秒）
  }

  // 动画配置
  animation?: {
    entrance?: {
      type: string // 动画类型
      duration?: number // 持续时间
      delay?: number // 延迟时间
    }
    hover?: {
      type: string
      duration?: number
    }
    click?: {
      type: string
      duration?: number
    }
  }

  // 数据联动配置
  dataLink?: {
    triggers: string[] // 触发事件类型
    targets: string[] // 影响的目标节点ID
    action: 'update' | 'highlight' | 'filter' | 'refresh' | 'custom'
    params?: Record<string, any>
    condition?: string // 触发条件
  }
}

// 节点内部配置（由各个组件渲染器定义）
export interface NodeContentConfig {
  [key: string]: ConfigItem
}

export interface ConfigItem {
  value: any // 配置值
  type: string // 配置类型
  label: string // 显示标签
  description?: string // 描述
  required?: boolean // 是否必填
  default?: any // 默认值
  options?: Array<{
    // 选项（用于select等）
    label: string
    value: any
  }>
  min?: number // 最小值
  max?: number // 最大值
  step?: number // 步长
  format?: string // 格式化
  validator?: (value: any) => boolean | string // 验证器
}

// 完整的节点配置
export interface NodeConfig {
  base: NodeBaseConfig // 基础配置
  interaction: NodeInteractionConfig // 交互配置
  content: NodeContentConfig // 内容配置
}

// 配置表单控件类型
export type InspectorControlType =
  | 'text-input'
  | 'textarea'
  | 'number-input'
  | 'color-picker'
  | 'select'
  | 'multi-select'
  | 'switch'
  | 'checkbox'
  | 'radio'
  | 'slider'
  | 'date-picker'
  | 'time-picker'
  | 'file-upload'
  | 'json-editor'
  | 'code-editor'
  | 'custom'

// 配置表单控件定义
export interface InspectorControl {
  type: InspectorControlType
  props?: Record<string, any> // 控件属性
  events?: Record<string, (...args: any[]) => void> // 控件事件
  validator?: (value: any) => boolean | string
  formatter?: (value: any) => any
}
