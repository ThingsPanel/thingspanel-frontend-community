// 第一层：纯净编辑器底座 - 布局管理器
// 职责：仅负责UI布局管理，不涉及业务逻辑

import { reactive, ref, computed, type Ref } from 'vue'

/**
 * 纯净布局管理器 - 第一层核心组件
 * 只负责四大区域的布局管理，不涉及任何业务逻辑
 */
export interface PureLayoutManager {
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
      background: 'transparent' // 不负责样式
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
    autoCollapse: boolean // 小屏自动折叠sidebar
    stackOnMobile: boolean // 移动端堆叠布局
    minCanvasWidth: number // 画布最小宽度
  }
}

/**
 * 布局管理器实现
 */
export class LayoutManager implements PureLayoutManager {
  // 区域配置
  public regions = reactive({
    toolbar: {
      visible: true,
      height: 48,
      position: 'top' as const,
      collapsible: false
    },
    sidebar: {
      visible: true,
      width: 240,
      position: 'left' as const,
      resizable: true,
      collapsible: true
    },
    canvas: {
      flex: 1,
      padding: 16,
      background: 'transparent' as const
    },
    inspector: {
      visible: true,
      width: 320,
      position: 'right' as const,
      resizable: true,
      collapsible: true
    }
  })

  // 响应式断点
  public breakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1440,
    ultrawide: 1920
  }

  // 自适应配置
  public responsive = reactive({
    autoCollapse: true,
    stackOnMobile: true,
    minCanvasWidth: 400
  })

  // 当前视窗信息
  private viewport = ref({
    width: window.innerWidth,
    height: window.innerHeight
  })

  // 当前断点
  public currentBreakpoint = computed(() => {
    const width = this.viewport.value.width
    if (width <= this.breakpoints.mobile) return 'mobile'
    if (width <= this.breakpoints.tablet) return 'tablet'
    if (width <= this.breakpoints.desktop) return 'desktop'
    return 'ultrawide'
  })

  constructor() {
    this.initializeViewportTracking()
    this.initializeResponsiveBehavior()
  }

  /**
   * 初始化视窗追踪
   */
  private initializeViewportTracking() {
    const updateViewport = () => {
      this.viewport.value = {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }

    window.addEventListener('resize', updateViewport)
    updateViewport()
  }

  /**
   * 初始化响应式行为
   */
  private initializeResponsiveBehavior() {
    // 监听断点变化
    const unwatch = computed(() => this.currentBreakpoint.value)
    unwatch.effect = breakpoint => {
      this.handleBreakpointChange(breakpoint)
    }
  }

  /**
   * 处理断点变化
   */
  private handleBreakpointChange(breakpoint: string) {
    if (!this.responsive.autoCollapse) return

    switch (breakpoint) {
      case 'mobile':
        // 移动端自动折叠侧边栏和检查器
        this.regions.sidebar.visible = false
        this.regions.inspector.visible = false
        break

      case 'tablet':
        // 平板端保持侧边栏，折叠检查器
        this.regions.sidebar.visible = true
        this.regions.inspector.visible = false
        break

      case 'desktop':
      case 'ultrawide':
        // 桌面端恢复所有面板
        this.regions.sidebar.visible = true
        this.regions.inspector.visible = true
        break
    }
  }

  /**
   * 切换侧边栏可见性
   */
  public toggleSidebar() {
    this.regions.sidebar.visible = !this.regions.sidebar.visible
  }

  /**
   * 切换检查器可见性
   */
  public toggleInspector() {
    this.regions.inspector.visible = !this.regions.inspector.visible
  }

  /**
   * 设置侧边栏宽度
   */
  public setSidebarWidth(width: number) {
    this.regions.sidebar.width = Math.max(200, Math.min(400, width))
  }

  /**
   * 设置检查器宽度
   */
  public setInspectorWidth(width: number) {
    this.regions.inspector.width = Math.max(280, Math.min(500, width))
  }

  /**
   * 获取计算后的样式配置
   * 返回CSS-in-JS对象，供第一层UI组件使用
   */
  public getComputedStyles() {
    const { toolbar, sidebar, canvas, inspector } = this.regions

    return {
      root: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        minHeight: 0
      },

      toolbar: toolbar.visible
        ? {
            height: `${toolbar.height}px`,
            flexShrink: 0,
            order: toolbar.position === 'top' ? 0 : 2
          }
        : { display: 'none' },

      mainContainer: {
        display: 'flex',
        flex: 1,
        minHeight: 0,
        order: 1
      },

      sidebar: sidebar.visible
        ? {
            width: `${sidebar.width}px`,
            flexShrink: 0,
            order: sidebar.position === 'left' ? 0 : 2,
            transition: 'width 0.3s ease'
          }
        : { display: 'none' },

      canvas: {
        flex: canvas.flex,
        padding: `${canvas.padding}px`,
        minWidth: `${this.responsive.minCanvasWidth}px`,
        order: 1,
        overflow: 'hidden'
      },

      inspector: inspector.visible
        ? {
            width: `${inspector.width}px`,
            flexShrink: 0,
            order: inspector.position === 'right' ? 2 : 0,
            transition: 'width 0.3s ease'
          }
        : { display: 'none' }
    }
  }

  /**
   * 获取当前布局状态
   */
  public getLayoutState() {
    return {
      regions: { ...this.regions },
      viewport: { ...this.viewport.value },
      breakpoint: this.currentBreakpoint.value,
      timestamp: Date.now()
    }
  }

  /**
   * 恢复布局状态
   */
  public restoreLayoutState(state: any) {
    if (state.regions) {
      Object.assign(this.regions, state.regions)
    }
  }

  /**
   * 重置为默认布局
   */
  public resetToDefault() {
    this.regions.toolbar.visible = true
    this.regions.toolbar.height = 48
    this.regions.sidebar.visible = true
    this.regions.sidebar.width = 240
    this.regions.inspector.visible = true
    this.regions.inspector.width = 320
    this.regions.canvas.padding = 16
  }
}

/**
 * 创建布局管理器实例
 */
export function createLayoutManager(): LayoutManager {
  return new LayoutManager()
}
