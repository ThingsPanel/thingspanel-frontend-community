/**
 * Card2.1 组件交互系统类型定义
 * 定义组件如何响应外部交互的类型系统
 * 优化后的简洁版本，移除了冗余和过时的类型定义
 */

// ============ 核心交互类型 ============

/**
 * 交互事件类型
 * 定义了所有支持的用户交互和系统事件类型
 */
export type InteractionEventType =
  | 'click'              // 鼠标点击事件
  | 'hover'              // 鼠标悬停事件
  | 'focus'              // 元素获得焦点事件
  | 'blur'               // 元素失去焦点事件
  | 'visibility'         // 元素可见性状态变化事件
  | 'dataChange'         // 组件数据属性值变化事件
  | 'conditional'        // 条件表达式满足时触发的事件
  | 'crossComponent'     // 跨组件通信事件
  | 'custom'             // 用户自定义事件类型

/**
 * 交互响应动作类型
 * 定义了交互触发后可执行的所有动作类型
 */
export type InteractionActionType =
  // 导航动作
  | 'navigateToUrl'            // URL跳转 (支持内部路由和外部链接)
  | 'jumpToPage'               // 页面跳转 (内部路由专用)
  
  // 数据操作动作
  | 'updateComponentData'      // 更新目标组件数据
  | 'modifyProperty'           // 修改组件属性
  
  // 视觉样式动作  
  | 'changeVisibility'         // 改变元素可见性 (visible/hidden)
  | 'changeBackgroundColor'    // 改变背景颜色
  | 'changeTextColor'          // 改变文字颜色
  | 'changeBorderColor'        // 改变边框颜色
  | 'changeSize'               // 改变尺寸 (width/height)
  | 'changeOpacity'            // 改变透明度 (0-1)
  | 'changeTransform'          // CSS变换操作 (scale/rotate/translate)
  | 'changeContent'            // 改变文本内容
  
  // 动画效果动作
  | 'triggerAnimation'         // 触发CSS动画或关键帧动画
  | 'flashColor'               // 颜色闪烁效果
  | 'pulseEffect'              // 脉冲动画效果
  | 'shakeEffect'              // 震动动画效果
  
  // 高级功能动作
  | 'conditionalStyle'         // 基于条件的样式应用
  | 'callFunction'             // 调用JavaScript函数
  | 'emitEvent'                // 发送自定义事件
  | 'playSound'                // 播放音效
  | 'showNotification'         // 显示通知消息
  
  // 兼容旧版本
  | 'jump'                     // URL跳转（兼容旧版本）
  | 'modify'                   // 修改目标组件属性（兼容旧版本）
  
  // 扩展动作
  | 'custom'                   // 用户自定义动作处理器


// 跳转类型枚举
export type JumpType = 'external' | 'internal'

// URL跳转配置
export interface JumpConfig {
  jumpType: JumpType // 跳转类型：external(外部URL) | internal(内部菜单)
  url?: string // 外部URL地址
  internalPath?: string // 内部菜单路径
  target?: '_self' | '_blank' | '_parent' | '_top' // 跳转目标
  windowFeatures?: string // 新窗口特性配置
}

// 属性修改配置
export interface ModifyConfig {
  targetComponentId: string // 目标组件ID
  targetProperty: string // 目标属性名
  updateValue: any // 更新值
  updateMode?: 'replace' | 'append' | 'prepend' // 更新模式
}

/**
 * 交互响应配置
 * 清理后的简化版本，移除了冗余的兼容性字段
 */
export interface InteractionResponse {
  /** 交互动作类型 */
  action: InteractionActionType
  /** URL跳转配置（当action为'jump'时） */
  jumpConfig?: JumpConfig
  /** 属性修改配置（当action为'modify'时） */
  modifyConfig?: ModifyConfig
  /** 延迟执行时间（毫秒） */
  delay?: number
  /** 响应配置名称 */
  name?: string
  /** 是否启用此响应 */
  enabled?: boolean
}

// 交互触发类型 - 区分是节点触发还是组件内部触发
export type InteractionTriggerType =
  | 'node' // 节点级别触发（整个节点响应事件）
  | 'component' // 组件内部触发（组件内部元素响应事件）

// 简化的交互配置
export interface InteractionConfig {
  event: InteractionEventType
  responses: InteractionResponse[]
  enabled?: boolean // 是否启用此交互
  priority?: number // 优先级，数字越大优先级越高
  name?: string // 交互配置名称

  // dataChange事件专用配置
  watchedProperty?: string // 被监听的组件属性名（仅dataChange事件使用）
  condition?: DataChangeCondition // 条件配置（仅dataChange事件使用）
}

/**
 * 数据变化条件配置
 * 统一的条件配置系统
 */
export interface DataChangeCondition {
  /** 监听的属性名 */
  property?: string
  /** 比较运算符 */
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual' | 'contains' | 'startsWith' | 'endsWith'
  /** 比较值 */
  value: any
  /** 范围最小值（用于范围比较） */
  minValue?: any
  /** 范围最大值（用于范围比较） */
  maxValue?: any
}

// 组件交互状态
export interface ComponentInteractionState {
  backgroundColor?: string
  textColor?: string
  borderColor?: string
  width?: string | number
  height?: string | number
  opacity?: number
  transform?: string
  visibility?: 'visible' | 'hidden'
  content?: any
  isAnimating?: boolean
}

// 交互管理器接口
export interface IInteractionManager {
  // 注册组件的交互配置
  registerComponent(componentId: string, configs: InteractionResponse[]): void

  // 移除组件的交互配置
  unregisterComponent(componentId: string): void

  // 触发交互事件
  triggerEvent(componentId: string, event: InteractionEventType, data?: any): void

  // 获取组件的交互状态
  getComponentState(componentId: string): ComponentInteractionState | undefined

  // 重置组件的交互状态
  resetComponentState(componentId: string): void

  // 批量更新多个组件的交互配置
  updateComponentConfigs(componentId: string, configs: InteractionResponse[]): void
}

// 交互事件数据
export interface InteractionEventData {
  source?: string // 事件来源
  timestamp: Date // 事件时间戳
  data?: any // 额外数据
  position?: { x: number; y: number } // 事件位置
}

// 交互响应结果
export interface InteractionResponseResult {
  success: boolean
  componentId: string
  action: InteractionActionType
  oldValue?: any
  newValue?: any
  error?: string
}


// ============ 类型别名和简化接口 ============

/**
 * 比较运算符类型别名
 * 从DataChangeCondition中提取的运算符类型
 */
export type ComparisonOperator = DataChangeCondition['operator']

/**
 * 交互触发器类型
 * 区分节点级别和组件级别的触发
 */
export type InteractionTrigger = 'node' | 'component'

/**
 * 交互事件简化类型
 * 常用的事件数据接口
 */
export interface InteractionEvent {
  /** 事件类型 */
  type: InteractionEventType
  /** 事件来源组件ID */
  sourceId: string
  /** 事件时间戳 */
  timestamp: Date
  /** 事件附加数据 */
  data?: any
}

/**
 * 交互响应简化类型
 * 常用的响应结果接口
 */
export interface InteractionResult {
  /** 是否成功执行 */
  success: boolean
  /** 执行的动作类型 */
  action: InteractionActionType
  /** 目标组件ID */
  targetId?: string
  /** 错误信息（如果失败） */
  error?: string
}

// ============ 组件交互能力定义 ============

/**
 * 交互区域定义
 * 定义组件内可交互的区域
 */
export interface InteractionZone {
  /** 区域唯一标识 */
  id: string
  /** 区域显示名称 */
  name: string
  /** 区域描述 */
  description?: string
  /** 区域选择器（CSS selector或特殊标识） */
  selector?: string
  /** 支持的事件类型 */
  supportedEvents?: InteractionEventType[]
}

/**
 * 组件交互能力声明
 * 定义组件的完整交互能力
 */
export interface ComponentInteractionCapability {
  /** 组件支持的事件类型 */
  supportedEvents: InteractionEventType[]
  
  /** 组件可触发的动作类型 */
  availableActions: InteractionActionType[]
  
  /** 可被其他组件监听的属性列表 */
  watchableProperties: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array'
    description?: string
    defaultValue?: any
  }>
  
  /** 交互区域定义（可选） */
  interactionZones?: InteractionZone[]
  
  /** 默认交互配置（可选） */
  defaultInteractions?: InteractionConfig[]
}
