/**
 * GridPlus 核心 composable
 * 提供高性能网格布局的核心功能
 */

import { ref, computed, watch, nextTick, shallowRef, type Ref } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import type {
  GridPlusItem,
  GridPlusConfig,
  GridPlusProps,
  GridPlusEmits,
  Position,
  Size,
  Rect
} from '../types/gridplus-types'
import { DEFAULT_GRIDPLUS_CONFIG } from '../types/gridplus-types'
import { GridCalculator, createGridCalculator } from '../utils/grid-calculator'
import { createPerformanceMonitor, debounce, throttle } from '../utils/performance-utils'

/**
 * GridPlus 核心状态接口
 */
interface GridPlusCoreState {
  /** 内部布局数据 */
  internalLayout: Ref<GridPlusItem[]>
  /** 容器尺寸 */
  containerSize: Ref<Size>
  /** 是否正在拖拽 */
  isDragging: Ref<boolean>
  /** 是否正在调整大小 */
  isResizing: Ref<boolean>
  /** 当前拖拽的项目 */
  draggedItem: Ref<GridPlusItem | null>
  /** 拖拽偏移量 */
  dragOffset: Ref<Position>
  /** 是否已初始化 */
  initialized: Ref<boolean>
}

/**
 * GridPlus 核心方法接口
 */
interface GridPlusCoreMethods {
  /** 添加项目 */
  addItem: (type: string, options?: Partial<GridPlusItem>) => GridPlusItem
  /** 移除项目 */
  removeItem: (itemId: string) => GridPlusItem | null
  /** 更新项目 */
  updateItem: (itemId: string, updates: Partial<GridPlusItem>) => GridPlusItem | null
  /** 清空布局 */
  clearLayout: () => void
  /** 获取项目 */
  getItem: (itemId: string) => GridPlusItem | undefined
  /** 获取所有项目 */
  getAllItems: () => GridPlusItem[]
  /** 压缩布局 */
  compactLayout: () => void
  /** 调整布局适应容器 */
  adjustToContainer: (size: Size) => void
  /** 验证布局 */
  validateLayout: () => { isValid: boolean; errors: string[] }
}

/**
 * GridPlus 核心 composable
 */
export function useGridPlusCore(
  props: GridPlusProps,
  emit: (event: any, ...args: any[]) => void
): GridPlusCoreState &
  GridPlusCoreMethods & {
    /** 主题系统 */
    themeStore: any
    /** 网格配置 */
    gridConfig: Ref<GridPlusConfig>
    /** 网格计算器 */
    calculator: Ref<GridCalculator>
    /** 性能监控器 */
    performanceMonitor: any
    /** 计算属性 */
    computed: {
      isDarkTheme: Ref<boolean>
      containerStyle: Ref<Record<string, string>>
      gridHeight: Ref<number>
    }
  } {
  // ============= 状态管理 =============

  /** 内部布局数据 - 使用 shallowRef 优化性能 */
  const internalLayout = shallowRef<GridPlusItem[]>([...props.layout])

  /** 容器尺寸 */
  const containerSize = ref<Size>({ width: 0, height: 0 })

  /** 拖拽状态 */
  const isDragging = ref(false)
  const isResizing = ref(false)
  const draggedItem = ref<GridPlusItem | null>(null)
  const dragOffset = ref<Position>({ x: 0, y: 0 })

  /** 初始化状态 */
  const initialized = ref(false)

  // ============= 系统集成 =============

  /** 主题系统 */
  const themeStore = useThemeStore()

  /** 性能监控器 */
  const performanceMonitor = createPerformanceMonitor()

  // ============= 配置管理 =============

  /** 网格配置 - 合并默认配置和传入配置 */
  const gridConfig = computed<GridPlusConfig>(() => {
    const config = {
      ...DEFAULT_GRIDPLUS_CONFIG,
      ...props.config
    }

    // 调试日志
    if (import.meta.env.DEV) {
      console.log('🔧 GridPlus - 配置更新:', {
        propsConfig: props.config,
        finalConfig: config,
        readonly: props.readonly
      })
    }

    return config
  })

  /** 网格计算器 */
  const calculator = computed(() => {
    const calc = createGridCalculator(gridConfig.value)
    calc.updateContainerSize(containerSize.value.width, containerSize.value.height)
    return calc
  })

  // ============= 计算属性 =============

  /** 是否为暗色主题 */
  const isDarkTheme = computed(() => themeStore.darkMode)

  /** 容器样式 */
  const containerStyle = computed(() => {
    const style: Record<string, string> = {
      position: 'relative',
      width: '100%'
    }

    // 如果启用了虚拟滚动，设置固定高度
    if (gridConfig.value.enableVirtualScroll) {
      style.height = `${containerSize.value.height}px`
      style.overflow = 'auto'
    }

    return style
  })

  /** 网格总高度 */
  const gridHeight = computed(() => {
    return calculator.value.calcGridHeight(internalLayout.value)
  })

  // ============= 核心方法 =============

  /**
   * 生成唯一ID
   */
  const generateId = (): string => {
    return `gridplus-item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 添加项目
   */
  const addItem = (type: string, options?: Partial<GridPlusItem>): GridPlusItem => {
    performanceMonitor.startRenderMeasure()

    const newItem: GridPlusItem = {
      i: generateId(),
      x: 0,
      y: 0,
      w: 2,
      h: 2,
      type,
      ...options
    }

    // 查找可用位置
    const position = calculator.value.findAvailablePosition(newItem.w, newItem.h, internalLayout.value)

    newItem.x = position.x
    newItem.y = position.y

    // 添加到布局
    internalLayout.value = [...internalLayout.value, newItem]

    // 触发事件
    emit('item-add', newItem)
    emit('layout-change', internalLayout.value)
    emit('update:layout', internalLayout.value)

    performanceMonitor.endRenderMeasure()

    if (import.meta.env.DEV) {
      console.log('📍 GridPlus - 添加项目:', newItem)
    }

    return newItem
  }

  /**
   * 移除项目
   */
  const removeItem = (itemId: string): GridPlusItem | null => {
    performanceMonitor.startRenderMeasure()

    const index = internalLayout.value.findIndex(item => item.i === itemId)
    if (index === -1) return null

    const removedItem = internalLayout.value[index]
    internalLayout.value = internalLayout.value.filter((_, i) => i !== index)

    // 如果启用了压缩，重新压缩布局
    if (gridConfig.value.verticalCompact) {
      nextTick(() => compactLayout())
    }

    // 触发事件
    emit('item-delete', itemId)
    emit('layout-change', internalLayout.value)
    emit('update:layout', internalLayout.value)

    performanceMonitor.endRenderMeasure()

    if (import.meta.env.DEV) {
      console.log('🗑️ GridPlus - 移除项目:', removedItem)
    }

    return removedItem
  }

  /**
   * 更新项目
   */
  const updateItem = (itemId: string, updates: Partial<GridPlusItem>): GridPlusItem | null => {
    const item = internalLayout.value.find(i => i.i === itemId)
    if (!item) return null

    performanceMonitor.startRenderMeasure()

    // 更新项目数据
    Object.assign(item, updates)

    // 触发响应式更新
    internalLayout.value = [...internalLayout.value]

    // 触发事件
    emit('item-update', itemId, updates)
    emit('layout-change', internalLayout.value)
    emit('update:layout', internalLayout.value)

    performanceMonitor.endRenderMeasure()

    if (import.meta.env.DEV) {
      console.log('✏️ GridPlus - 更新项目:', { itemId, updates })
    }

    return item
  }

  /**
   * 清空布局
   */
  const clearLayout = (): void => {
    performanceMonitor.startRenderMeasure()

    internalLayout.value = []

    // 触发事件
    emit('layout-change', [])
    emit('update:layout', [])

    performanceMonitor.endRenderMeasure()

    if (import.meta.env.DEV) {
      console.log('🗑️ GridPlus - 清空布局')
    }
  }

  /**
   * 获取项目
   */
  const getItem = (itemId: string): GridPlusItem | undefined => {
    return internalLayout.value.find(item => item.i === itemId)
  }

  /**
   * 获取所有项目
   */
  const getAllItems = (): GridPlusItem[] => {
    return [...internalLayout.value]
  }

  /**
   * 压缩布局
   */
  const compactLayout = (): void => {
    if (!gridConfig.value.verticalCompact) return

    performanceMonitor.startLayoutMeasure()

    const compactedLayout = calculator.value.compactLayout(internalLayout.value)

    // 检查是否有变化
    const hasChanged = JSON.stringify(internalLayout.value) !== JSON.stringify(compactedLayout)

    if (hasChanged) {
      internalLayout.value = compactedLayout

      // 触发事件
      emit('layout-change', compactedLayout)
      emit('update:layout', compactedLayout)
    }

    performanceMonitor.endLayoutMeasure()

    if (import.meta.env.DEV) {
      console.log('📐 GridPlus - 布局压缩:', { hasChanged, itemCount: compactedLayout.length })
    }
  }

  /**
   * 调整布局适应容器
   */
  const adjustToContainer = (size: Size): void => {
    performanceMonitor.startLayoutMeasure()

    containerSize.value = { ...size }
    calculator.value.updateContainerSize(size.width, size.height)

    // 如果是响应式布局，可能需要调整列数
    if (gridConfig.value.responsive) {
      const { breakpoints, cols } = gridConfig.value
      let newColNum = gridConfig.value.colNum

      // 根据容器宽度确定断点
      for (const [breakpoint, width] of Object.entries(breakpoints)) {
        if (size.width >= width) {
          newColNum = cols[breakpoint] || newColNum
          break
        }
      }

      // 如果列数发生变化，调整布局
      if (newColNum !== gridConfig.value.colNum) {
        const adjustedLayout = calculator.value.autoAdjustLayout(internalLayout.value, newColNum)
        internalLayout.value = adjustedLayout

        // 触发断点变化事件
        emit('breakpoint-changed', getBreakpointName(size.width), adjustedLayout)
      }
    }

    performanceMonitor.endLayoutMeasure()

    if (import.meta.env.DEV) {
      console.log('📏 GridPlus - 容器尺寸调整:', size)
    }
  }

  /**
   * 验证布局
   */
  const validateLayout = (): { isValid: boolean; errors: string[] } => {
    return calculator.value.validateLayout(internalLayout.value)
  }

  /**
   * 获取断点名称
   */
  const getBreakpointName = (width: number): string => {
    const { breakpoints } = gridConfig.value

    for (const [name, minWidth] of Object.entries(breakpoints)) {
      if (width >= minWidth) {
        return name
      }
    }

    return 'xxs'
  }

  // ============= 监听器 =============

  /**
   * 监听 props.layout 变化
   */
  watch(
    () => props.layout,
    newLayout => {
      // 避免重复更新
      const hasChanged = JSON.stringify(internalLayout.value) !== JSON.stringify(newLayout)
      if (hasChanged) {
        internalLayout.value = [...newLayout]

        if (import.meta.env.DEV) {
          console.log('🔄 GridPlus - 外部布局更新:', newLayout.length)
        }
      }
    },
    { deep: true }
  )

  /**
   * 监听配置变化
   */
  watch(
    gridConfig,
    (newConfig, oldConfig) => {
      if (oldConfig && newConfig !== oldConfig) {
        // 如果列数发生变化，可能需要调整布局
        if (newConfig.colNum !== oldConfig.colNum) {
          const adjustedLayout = calculator.value.autoAdjustLayout(internalLayout.value, newConfig.colNum)
          internalLayout.value = adjustedLayout
        }

        // 如果启用了压缩且之前未启用，重新压缩布局
        if (newConfig.verticalCompact && !oldConfig.verticalCompact) {
          nextTick(() => compactLayout())
        }

        if (import.meta.env.DEV) {
          console.log('⚙️ GridPlus - 配置变更:', { newConfig, oldConfig })
        }
      }
    },
    { deep: true }
  )

  // ============= 性能优化 =============

  /**
   * 防抖的布局压缩
   */
  const debouncedCompact = debounce(compactLayout, gridConfig.value.debounceDelay || 100)

  /**
   * 节流的容器调整
   */
  const throttledAdjust = throttle(adjustToContainer, gridConfig.value.throttleDelay || 16)

  // ============= 生命周期 =============

  /**
   * 初始化
   */
  const initialize = (): void => {
    if (initialized.value) return

    // 启动性能监控
    if (gridConfig.value.enablePerformanceMonitoring) {
      performanceMonitor.startMonitoring()

      // 注册性能指标回调
      performanceMonitor.on('update', (metrics: any) => {
        emit('performance-metrics', metrics)
      })

      performanceMonitor.on('warning', (warning: any) => {
        emit('performance-warning', warning)
      })
    }

    // 验证初始布局
    const validation = validateLayout()
    if (!validation.isValid) {
      console.warn('GridPlus - 初始布局验证失败:', validation.errors)
    }

    initialized.value = true

    if (import.meta.env.DEV) {
      console.log('🚀 GridPlus - 组件初始化完成')
    }
  }

  /**
   * 销毁
   */
  const destroy = (): void => {
    if (gridConfig.value.enablePerformanceMonitoring) {
      performanceMonitor.stopMonitoring()
    }

    initialized.value = false

    if (import.meta.env.DEV) {
      console.log('💥 GridPlus - 组件销毁')
    }
  }

  // 自动初始化
  nextTick(() => {
    initialize()
  })

  // ============= 返回接口 =============

  return {
    // 状态
    internalLayout,
    containerSize,
    isDragging,
    isResizing,
    draggedItem,
    dragOffset,
    initialized,

    // 系统
    themeStore,
    gridConfig,
    calculator,
    performanceMonitor,

    // 方法
    addItem,
    removeItem,
    updateItem,
    clearLayout,
    getItem,
    getAllItems,
    compactLayout: debouncedCompact,
    adjustToContainer: throttledAdjust,
    validateLayout,

    // 计算属性
    computed: {
      isDarkTheme,
      containerStyle,
      gridHeight
    },

    // 内部方法（用于测试和调试）
    _internal: {
      initialize,
      destroy,
      generateId,
      getBreakpointName
    }
  }
}
