/**
 * @file 纯净布局管理器接口定义
 * @description 定义第一层纯净编辑器底座的布局管理接口
 * 只负责UI布局管理，绝不涉及业务逻辑、渲染实现、配置细节
 */

/**
 * 布局区域配置接口
 */
export interface LayoutRegion {
  /** 区域是否可见 */
  visible: boolean
  /** 区域尺寸（宽度或高度，取决于区域类型） */
  size: number
  /** 区域位置（'top'|'bottom'|'left'|'right'） */
  position: 'top' | 'bottom' | 'left' | 'right'
  /** 是否可调整大小 */
  resizable: boolean
  /** 是否可折叠 */
  collapsible: boolean
  /** 最小尺寸限制 */
  minSize?: number
  /** 最大尺寸限制 */
  maxSize?: number
}

/**
 * 纯净布局管理器配置接口
 */
export interface PureLayoutConfig {
  /** 工具栏区域配置 */
  toolbar: LayoutRegion & {
    /** 工具栏高度 */
    height: number
  }

  /** 侧边栏区域配置 */
  sidebar: LayoutRegion & {
    /** 侧边栏宽度 */
    width: number
  }

  /** 画布区域配置 */
  canvas: {
    /** 画布内边距 */
    padding: number
    /** 画布背景（透明，不负责样式） */
    background: 'transparent'
    /** 是否占据剩余空间 */
    flex: number
  }

  /** 检查器区域配置 */
  inspector: LayoutRegion & {
    /** 检查器宽度 */
    width: number
  }

  /** 响应式断点配置 */
  breakpoints: {
    /** 移动端断点 */
    mobile: number
    /** 平板断点 */
    tablet: number
    /** 桌面断点 */
    desktop: number
    /** 超宽屏断点 */
    ultrawide: number
  }

  /** 自适应行为配置 */
  responsive: {
    /** 小屏时自动折叠侧边栏 */
    autoCollapse: boolean
    /** 移动端是否堆叠布局 */
    stackOnMobile: boolean
    /** 画布最小宽度 */
    minCanvasWidth: number
  }
}

/**
 * 布局区域状态接口
 */
export interface LayoutRegionState {
  /** 区域实际尺寸 */
  actualSize: {
    width: number
    height: number
  }
  /** 区域是否处于折叠状态 */
  collapsed: boolean
  /** 区域是否正在调整大小 */
  resizing: boolean
}

/**
 * 布局管理器状态接口
 */
export interface PureLayoutState {
  /** 各区域状态 */
  regions: {
    toolbar: LayoutRegionState
    sidebar: LayoutRegionState
    canvas: LayoutRegionState
    inspector: LayoutRegionState
  }
  /** 当前断点 */
  currentBreakpoint: 'mobile' | 'tablet' | 'desktop' | 'ultrawide'
  /** 容器总尺寸 */
  containerSize: {
    width: number
    height: number
  }
}

/**
 * 布局事件接口
 */
export interface LayoutEvents {
  /** 区域大小调整事件 */
  'region-resize': {
    region: 'toolbar' | 'sidebar' | 'canvas' | 'inspector'
    oldSize: number
    newSize: number
  }

  /** 区域可见性变化事件 */
  'region-visibility-change': {
    region: 'toolbar' | 'sidebar' | 'canvas' | 'inspector'
    visible: boolean
  }

  /** 断点变化事件 */
  'breakpoint-change': {
    from: string
    to: string
    containerSize: { width: number; height: number }
  }

  /** 布局配置变化事件 */
  'layout-config-change': {
    config: PureLayoutConfig
  }
}

/**
 * 纯净布局管理器接口
 * @description 第一层编辑器底座的核心接口，只负责布局管理
 */
export interface IPureLayoutManager {
  /** 当前布局配置 */
  readonly config: PureLayoutConfig

  /** 当前布局状态 */
  readonly state: PureLayoutState

  /**
   * 更新布局配置
   * @param config 新的布局配置
   */
  updateConfig(config: Partial<PureLayoutConfig>): void

  /**
   * 调整区域大小
   * @param region 区域名称
   * @param size 新的尺寸
   */
  resizeRegion(region: keyof PureLayoutConfig, size: number): void

  /**
   * 切换区域可见性
   * @param region 区域名称
   * @param visible 是否可见
   */
  toggleRegionVisibility(region: keyof PureLayoutConfig, visible?: boolean): void

  /**
   * 获取区域实际尺寸
   * @param region 区域名称
   * @returns 区域尺寸信息
   */
  getRegionSize(region: keyof PureLayoutConfig): { width: number; height: number }

  /**
   * 监听布局事件
   * @param event 事件名称
   * @param handler 事件处理器
   */
  on<K extends keyof LayoutEvents>(event: K, handler: (payload: LayoutEvents[K]) => void): void

  /**
   * 移除事件监听器
   * @param event 事件名称
   * @param handler 事件处理器
   */
  off<K extends keyof LayoutEvents>(event: K, handler: (payload: LayoutEvents[K]) => void): void

  /**
   * 发射布局事件
   * @param event 事件名称
   * @param payload 事件数据
   */
  emit<K extends keyof LayoutEvents>(event: K, payload: LayoutEvents[K]): void

  /**
   * 销毁布局管理器
   */
  destroy(): void
}

/**
 * 布局管理器创建选项
 */
export interface PureLayoutManagerOptions {
  /** 初始配置 */
  initialConfig?: Partial<PureLayoutConfig>
  /** 是否启用响应式 */
  responsive?: boolean
  /** 是否启用动画 */
  animated?: boolean
  /** 动画持续时间（毫秒） */
  animationDuration?: number
}
