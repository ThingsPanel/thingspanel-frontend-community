/**
 * @file 纯净布局管理器
 * @description 第一层布局管理器 - 纯粹的四区域布局架子，不关心区域内具体内容
 */

import { ref, reactive, nextTick } from 'vue'
import type {
  LayoutManager as ILayoutManager,
  LayoutConfig,
  RegionSize,
  LayoutState
} from './interfaces/PureInfrastructure'

/**
 * 区域定义
 */
const REGIONS = {
  TOOLBAR: 'toolbar',
  SIDEBAR: 'sidebar', 
  CANVAS: 'canvas',
  INSPECTOR: 'inspector'
} as const

type RegionType = typeof REGIONS[keyof typeof REGIONS]

/**
 * 默认布局配置
 */
const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  responsive: true,
  defaultSizes: {
    toolbar: { height: 60 },
    sidebar: { width: 280 },
    canvas: { width: 'auto', height: 'auto' },
    inspector: { width: 320 }
  },
  minSizes: {
    toolbar: { height: 50 },
    sidebar: { width: 200, minWidth: 150 },
    canvas: { width: 400, height: 300 },
    inspector: { width: 250, minWidth: 200 }
  },
  maxSizes: {
    sidebar: { width: 500 },
    inspector: { width: 600 }
  },
  collapsible: ['sidebar', 'inspector']
}

/**
 * 纯净布局管理器实现
 */
export class PureLayoutManager implements ILayoutManager {
  /** 根容器 */
  private rootContainer: HTMLElement | null = null
  
  /** 区域容器映射 */
  private regionContainers = new Map<string, HTMLElement>()
  
  /** 布局配置 */
  private config = reactive<LayoutConfig>({ ...DEFAULT_LAYOUT_CONFIG })
  
  /** 当前布局状态 */
  private layoutState = reactive<LayoutState>({
    sizes: {},
    visibility: {
      toolbar: true,
      sidebar: true,
      canvas: true,
      inspector: true
    },
    responsive: true,
    timestamp: Date.now()
  })
  
  /** 响应式断点 */
  private breakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1440
  }
  
  /** ResizeObserver实例 */
  private resizeObserver: ResizeObserver | null = null
  
  /** 拖拽状态 */
  private dragState = {
    isDragging: false,
    dragType: '' as 'sidebar' | 'inspector' | '',
    startX: 0,
    startY: 0,
    startSize: 0
  }

  constructor() {
    console.log('PureLayoutManager: 纯净布局管理器已初始化')
    this.setupEventListeners()
  }

  /**
   * 初始化布局
   */
  initialize(container: HTMLElement, config?: Partial<LayoutConfig>): void {
    try {
      console.log('PureLayoutManager: 开始初始化布局')
      
      this.rootContainer = container
      
      // 合并配置
      if (config) {
        Object.assign(this.config, config)
      }
      
      // 创建布局结构
      this.createLayoutStructure()
      
      // 应用初始样式
      this.applyLayoutStyles()
      
      // 设置响应式监听
      this.setupResponsiveLayout()
      
      // 恢复保存的布局状态
      this.restoreLayoutFromStorage()
      
      console.log('PureLayoutManager: 布局初始化完成')
      
    } catch (error) {
      console.error('PureLayoutManager: 初始化失败', error)
      throw error
    }
  }

  /**
   * 获取区域容器
   */
  getRegion(region: RegionType): HTMLElement {
    const container = this.regionContainers.get(region)
    if (!container) {
      throw new Error(`PureLayoutManager: 区域 ${region} 不存在`)
    }
    return container
  }

  /**
   * 设置区域尺寸
   */
  setRegionSize(region: string, size: RegionSize): void {
    try {
      const container = this.regionContainers.get(region)
      if (!container) {
        console.warn(`PureLayoutManager: 区域 ${region} 不存在`)
        return
      }
      
      // 更新状态
      this.layoutState.sizes[region] = { ...size }
      
      // 应用样式
      this.applyRegionSize(container, size)
      
      // 触发重新布局
      this.triggerRelayout()
      
      console.log(`PureLayoutManager: 已设置区域 ${region} 尺寸`, size)
      
    } catch (error) {
      console.error(`PureLayoutManager: 设置区域 ${region} 尺寸失败`, error)
    }
  }

  /**
   * 切换区域可见性
   */
  toggleRegion(region: string, visible: boolean): void {
    try {
      const container = this.regionContainers.get(region)
      if (!container) {
        console.warn(`PureLayoutManager: 区域 ${region} 不存在`)
        return
      }
      
      // 检查是否可折叠
      if (!visible && !this.config.collapsible.includes(region)) {
        console.warn(`PureLayoutManager: 区域 ${region} 不可折叠`)
        return
      }
      
      // 更新可见性状态
      this.layoutState.visibility[region] = visible
      
      // 应用样式
      container.style.display = visible ? '' : 'none'
      
      // 添加/移除折叠类
      container.classList.toggle('collapsed', !visible)
      
      // 触发重新布局
      this.triggerRelayout()
      
      console.log(`PureLayoutManager: 区域 ${region} 可见性设置为 ${visible}`)
      
    } catch (error) {
      console.error(`PureLayoutManager: 切换区域 ${region} 可见性失败`, error)
    }
  }

  /**
   * 保存布局状态
   */
  saveLayout(): LayoutState {
    const state: LayoutState = {
      sizes: { ...this.layoutState.sizes },
      visibility: { ...this.layoutState.visibility },
      responsive: this.layoutState.responsive,
      timestamp: Date.now()
    }
    
    // 保存到本地存储
    try {
      localStorage.setItem('panelv2-layout-state', JSON.stringify(state))
    } catch (error) {
      console.warn('PureLayoutManager: 保存布局状态到本地存储失败', error)
    }
    
    console.log('PureLayoutManager: 布局状态已保存', state)
    return state
  }

  /**
   * 恢复布局状态
   */
  restoreLayout(state: LayoutState): void {
    try {
      console.log('PureLayoutManager: 开始恢复布局状态', state)
      
      // 恢复尺寸
      Object.entries(state.sizes).forEach(([region, size]) => {
        this.setRegionSize(region, size)
      })
      
      // 恢复可见性
      Object.entries(state.visibility).forEach(([region, visible]) => {
        this.toggleRegion(region, visible)
      })
      
      // 更新状态
      Object.assign(this.layoutState, state)
      
      console.log('PureLayoutManager: 布局状态恢复完成')
      
    } catch (error) {
      console.error('PureLayoutManager: 恢复布局状态失败', error)
    }
  }

  /**
   * 响应式适配
   */
  handleResize(): void {
    if (!this.rootContainer) return
    
    const width = this.rootContainer.clientWidth
    let currentBreakpoint = 'desktop'
    
    if (width <= this.breakpoints.mobile) {
      currentBreakpoint = 'mobile'
    } else if (width <= this.breakpoints.tablet) {
      currentBreakpoint = 'tablet'
    }
    
    console.log(`PureLayoutManager: 响应式适配 - ${currentBreakpoint} (${width}px)`)
    
    // 移动端自动折叠侧边栏
    if (currentBreakpoint === 'mobile') {
      if (this.layoutState.visibility.sidebar) {
        this.toggleRegion('sidebar', false)
      }
      if (this.layoutState.visibility.inspector) {
        this.toggleRegion('inspector', false)
      }
    }
    
    // 更新CSS变量
    this.updateResponsiveVariables(currentBreakpoint)
    
    // 触发重新布局
    this.triggerRelayout()
  }

  // ==================== 私有方法 ====================

  /**
   * 创建布局结构
   */
  private createLayoutStructure(): void {
    if (!this.rootContainer) return
    
    console.log('PureLayoutManager: 创建布局结构')
    
    // 清空容器
    this.rootContainer.innerHTML = ''
    
    // 添加布局容器类
    this.rootContainer.classList.add('pure-layout-container')
    
    // 创建主布局HTML结构
    this.rootContainer.innerHTML = `
      <div class="pure-layout" data-layout="four-regions">
        <!-- 顶部工具栏区域 -->
        <div class="layout-region layout-toolbar" data-region="toolbar">
          <div class="region-content" data-region-content="toolbar"></div>
        </div>
        
        <!-- 主体区域 -->
        <div class="layout-main">
          <!-- 左侧边栏区域 -->
          <div class="layout-region layout-sidebar" data-region="sidebar">
            <div class="region-content" data-region-content="sidebar"></div>
            <div class="region-resizer" data-resizer="sidebar"></div>
          </div>
          
          <!-- 中央画布区域 -->
          <div class="layout-region layout-canvas" data-region="canvas">
            <div class="region-content" data-region-content="canvas"></div>
          </div>
          
          <!-- 右侧检查器区域 -->
          <div class="layout-region layout-inspector" data-region="inspector">
            <div class="region-resizer" data-resizer="inspector"></div>
            <div class="region-content" data-region-content="inspector"></div>
          </div>
        </div>
      </div>
    `
    
    // 收集区域容器引用
    this.collectRegionContainers()
    
    // 设置拖拽处理
    this.setupResizeHandlers()
  }

  /**
   * 收集区域容器引用
   */
  private collectRegionContainers(): void {
    if (!this.rootContainer) return
    
    Object.values(REGIONS).forEach(region => {
      const container = this.rootContainer!.querySelector(`[data-region-content="${region}"]`) as HTMLElement
      if (container) {
        this.regionContainers.set(region, container)
        console.log(`PureLayoutManager: 已注册区域容器 ${region}`)
      }
    })
  }

  /**
   * 应用布局样式
   */
  private applyLayoutStyles(): void {
    if (!this.rootContainer) return
    
    // 应用默认尺寸
    Object.entries(this.config.defaultSizes).forEach(([region, size]) => {
      this.layoutState.sizes[region] = size
      const container = this.regionContainers.get(region)
      if (container) {
        this.applyRegionSize(container.parentElement!, size)
      }
    })
    
    // 注入CSS变量和样式
    this.injectLayoutStyles()
  }

  /**
   * 应用区域尺寸
   */
  private applyRegionSize(element: HTMLElement, size: RegionSize): void {
    if (size.width !== undefined) {
      element.style.width = typeof size.width === 'number' ? `${size.width}px` : size.width
    }
    if (size.height !== undefined) {
      element.style.height = typeof size.height === 'number' ? `${size.height}px` : size.height
    }
    if (size.minWidth !== undefined) {
      element.style.minWidth = `${size.minWidth}px`
    }
    if (size.minHeight !== undefined) {
      element.style.minHeight = `${size.minHeight}px`
    }
    if (size.maxWidth !== undefined) {
      element.style.maxWidth = `${size.maxWidth}px`
    }
    if (size.maxHeight !== undefined) {
      element.style.maxHeight = `${size.maxHeight}px`
    }
  }

  /**
   * 注入布局样式
   */
  private injectLayoutStyles(): void {
    const styleId = 'pure-layout-styles'
    let styleElement = document.getElementById(styleId) as HTMLStyleElement
    
    if (!styleElement) {
      styleElement = document.createElement('style')
      styleElement.id = styleId
      document.head.appendChild(styleElement)
    }
    
    styleElement.textContent = `
      .pure-layout-container {
        width: 100%;
        height: 100%;
        overflow: hidden;
        position: relative;
      }
      
      .pure-layout {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
      }
      
      .layout-region {
        position: relative;
        background: var(--region-bg, #ffffff);
        border: var(--region-border, 1px solid #e0e0e0);
      }
      
      .layout-toolbar {
        flex-shrink: 0;
        border-bottom: var(--toolbar-border, 1px solid #e0e0e0);
        z-index: 100;
      }
      
      .layout-main {
        display: flex;
        flex: 1;
        min-height: 0;
      }
      
      .layout-sidebar {
        flex-shrink: 0;
        border-right: var(--sidebar-border, 1px solid #e0e0e0);
        z-index: 50;
      }
      
      .layout-canvas {
        flex: 1;
        min-width: 0;
        position: relative;
        overflow: hidden;
      }
      
      .layout-inspector {
        flex-shrink: 0;
        border-left: var(--inspector-border, 1px solid #e0e0e0);
        z-index: 50;
      }
      
      .region-content {
        width: 100%;
        height: 100%;
        overflow: auto;
        position: relative;
      }
      
      .region-resizer {
        position: absolute;
        background: transparent;
        transition: background-color 0.2s;
        z-index: 1000;
      }
      
      .layout-sidebar .region-resizer {
        top: 0;
        right: -2px;
        width: 4px;
        height: 100%;
        cursor: col-resize;
      }
      
      .layout-inspector .region-resizer {
        top: 0;
        left: -2px;
        width: 4px;
        height: 100%;
        cursor: col-resize;
      }
      
      .region-resizer:hover,
      .region-resizer.dragging {
        background-color: var(--resizer-active-color, #0066cc);
      }
      
      .layout-region.collapsed {
        display: none;
      }
      
      /* 响应式样式 */
      @media (max-width: 768px) {
        .layout-main {
          flex-direction: column;
        }
        
        .layout-sidebar,
        .layout-inspector {
          order: 2;
          border: var(--mobile-region-border, 1px solid #e0e0e0);
        }
      }
    `
  }

  /**
   * 设置拖拽处理器
   */
  private setupResizeHandlers(): void {
    if (!this.rootContainer) return
    
    const resizers = this.rootContainer.querySelectorAll('.region-resizer')
    
    resizers.forEach(resizer => {
      const resizerType = resizer.getAttribute('data-resizer') as 'sidebar' | 'inspector'
      
      resizer.addEventListener('mousedown', (e) => {
        this.startResize(e as MouseEvent, resizerType)
      })
    })
  }

  /**
   * 开始拖拽调整尺寸
   */
  private startResize(e: MouseEvent, type: 'sidebar' | 'inspector'): void {
    e.preventDefault()
    
    const container = this.regionContainers.get(type)?.parentElement
    if (!container) return
    
    this.dragState = {
      isDragging: true,
      dragType: type,
      startX: e.clientX,
      startY: e.clientY,
      startSize: type === 'sidebar' ? container.clientWidth : container.clientWidth
    }
    
    document.addEventListener('mousemove', this.handleResize)
    document.addEventListener('mouseup', this.endResize)
    
    // 添加拖拽状态类
    container.classList.add('resizing')
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  /**
   * 处理拖拽调整
   */
  private handleResize = (e: MouseEvent): void => {
    if (!this.dragState.isDragging) return
    
    const { dragType, startX, startSize } = this.dragState
    const deltaX = e.clientX - startX
    
    let newSize: number
    if (dragType === 'sidebar') {
      newSize = startSize + deltaX
    } else {
      newSize = startSize - deltaX
    }
    
    // 应用尺寸限制
    const minSize = this.config.minSizes[dragType]?.width || 150
    const maxSize = this.config.maxSizes[dragType]?.width || 600
    
    newSize = Math.max(minSize, Math.min(maxSize, newSize))
    
    // 更新尺寸
    this.setRegionSize(dragType, { width: newSize })
  }

  /**
   * 结束拖拽调整
   */
  private endResize = (): void => {
    if (!this.dragState.isDragging) return
    
    const container = this.regionContainers.get(this.dragState.dragType)?.parentElement
    if (container) {
      container.classList.remove('resizing')
    }
    
    document.removeEventListener('mousemove', this.handleResize)
    document.removeEventListener('mouseup', this.endResize)
    
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    
    this.dragState.isDragging = false
    
    // 保存布局状态
    this.saveLayout()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 窗口尺寸变化
    window.addEventListener('resize', this.handleResize.bind(this))
    
    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '1':
            e.preventDefault()
            this.toggleRegion('sidebar', !this.layoutState.visibility.sidebar)
            break
          case '2':
            e.preventDefault()
            this.toggleRegion('inspector', !this.layoutState.visibility.inspector)
            break
        }
      }
    })
  }

  /**
   * 设置响应式布局
   */
  private setupResponsiveLayout(): void {
    if (!this.rootContainer) return
    
    this.resizeObserver = new ResizeObserver(() => {
      this.handleResize()
    })
    
    this.resizeObserver.observe(this.rootContainer)
  }

  /**
   * 更新响应式变量
   */
  private updateResponsiveVariables(breakpoint: string): void {
    if (!this.rootContainer) return
    
    this.rootContainer.style.setProperty('--current-breakpoint', breakpoint)
    this.rootContainer.setAttribute('data-breakpoint', breakpoint)
  }

  /**
   * 触发重新布局
   */
  private triggerRelayout(): void {
    if (!this.rootContainer) return
    
    // 强制重新计算布局
    nextTick(() => {
      this.rootContainer!.style.display = 'none'
      this.rootContainer!.offsetHeight // 强制回流
      this.rootContainer!.style.display = ''
    })
  }

  /**
   * 从本地存储恢复布局
   */
  private restoreLayoutFromStorage(): void {
    try {
      const savedState = localStorage.getItem('panelv2-layout-state')
      if (savedState) {
        const state = JSON.parse(savedState) as LayoutState
        this.restoreLayout(state)
      }
    } catch (error) {
      console.warn('PureLayoutManager: 从本地存储恢复布局失败', error)
    }
  }

  /**
   * 销毁布局管理器
   */
  destroy(): void {
    // 清理事件监听器
    window.removeEventListener('resize', this.handleResize.bind(this))
    document.removeEventListener('mousemove', this.handleResize)
    document.removeEventListener('mouseup', this.endResize)
    
    // 清理ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }
    
    // 清理DOM
    this.regionContainers.clear()
    this.rootContainer = null
    
    console.log('PureLayoutManager: 布局管理器已销毁')
  }
}

/**
 * 创建纯净布局管理器实例
 */
export const createPureLayoutManager = (): PureLayoutManager => {
  return new PureLayoutManager()
}