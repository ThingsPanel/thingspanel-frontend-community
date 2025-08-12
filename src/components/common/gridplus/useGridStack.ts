import { ref, watch, nextTick } from 'vue'
import type { Ref } from 'vue'
import { GridStack, GridStackElement, GridStackOptions, GridStackWidget } from 'gridstack'
import 'gridstack/dist/gridstack.css'

/**
 * GridStack 死循环修复补丁
 * 重写 GridStack 内部的排序函数以防止无限递归
 */
const patchGridStackEngine = () => {
  try {
    // 完全禁用碰撞检测系统 - 最激进的修复方案
    const engine = (GridStack as any).Engine?.prototype
    if (engine && !engine._superPatchedForVue) {
      
      // 1. 完全禁用碰撞检测
      if (engine._fixCollisions) {
        engine._fixCollisions = function() { return false }
      }
      
      // 2. 禁用所有布局算法
      if (engine.compact) {
        engine.compact = function() { return this }
      }
      
      // 3. 简化排序函数
      if (engine.sortNodes) {
        engine.sortNodes = function(nodes) {
          if (!Array.isArray(nodes)) return nodes
          return nodes.sort((a, b) => (a?.y || 0) - (b?.y || 0))
        }
      }
      
      // 4. 禁用moveNode复杂逻辑
      if (engine.moveNode) {
        const originalMove = engine.moveNode
        engine.moveNode = function(node, o) {
          if (!node || !o) return false
          // 只允许简单的位置更新，不触发布局算法
          node.x = o.x ?? node.x
          node.y = o.y ?? node.y  
          node.w = o.w ?? node.w
          node.h = o.h ?? node.h
          return true
        }
      }
      
      // 5. 禁用所有可能引起递归的函数
      const dangerousFunctions = ['_packNodes', '_sortNodes', '_notify', 'batchUpdate']
      dangerousFunctions.forEach(fname => {
        if (engine[fname]) {
          engine[fname] = function() { return this }
        }
      })
      
      engine._superPatchedForVue = true
      console.log('GridStack SUPER patched - all collision detection disabled')
    }

    // 全局禁用Utils排序
    const utilsObj = (window as any)._Utils || (GridStack as any).Utils
    if (utilsObj && utilsObj.sort && !utilsObj._superPatched) {
      utilsObj.sort = function(nodes) { return nodes || [] }
      utilsObj._superPatched = true
    }
    
  } catch (error) {
    console.error('Failed to super-patch GridStack:', error)
  }
}

// 立即应用补丁
patchGridStackEngine()

/**
 * @description 定义 useGridStack hook 的 Props 类型接口
 */
export interface GridPlusProps {
  items: GridStackWidget[]
  readonly?: boolean
  config?: GridStackOptions
  showGridInfo?: boolean
  enableCompactLayout?: boolean
}

/**
 * @description 定义 useGridStack hook 的 Emits 类型接口
 */
export interface GridPlusEmits {
  (e: 'change', items: GridStackWidget[]): void
  (e: 'added', items: GridStackWidget[]): void
  (e: 'removed', items: GridStackWidget[]): void
  (e: 'dragstop', node: GridStackWidget): void
  (e: 'resizestop', node: GridStackWidget): void
}

/**
 * @description 封装 GridStack.js 功能的 Vue Composition API
 * @param gridStackContainer - GridStack 容器元素的 Ref
 * @param props - 组件的 Props
 * @param emit - 组件的 Emits
 * @param createItemContent - 用于创建网格项内部内容的函数，为 Teleport 提供目标
 */
export function useGridStack(
  gridStackContainer: Ref<HTMLElement | null>,
  props: GridPlusProps,
  emit: GridPlusEmits,
  createItemContent: (item: GridStackWidget) => HTMLElement
) {
  // GridStack 实例的 Ref
  const gridStack = ref<GridStack | null>(null)

  // 内部状态标志：防止响应式循环
  let isUpdatingFromProps = false

  /**
   * @description GridStack 'change' 事件的回调处理函数
   * 当用户拖拽或调整卡片大小时触发，用于更新布局
   */
  const onGridChange = () => {
    if (!gridStack.value || isUpdatingFromProps) return
    
    // 安全模式：暂时不处理change事件，避免卡死
    console.log('GridStack change event (safe mode - disabled)')
    return
    
    // TODO: 待GridStack稳定后重新启用
    /*
    try {
      const serializedData = gridStack.value.save(false)
      emit('change', serializedData || [])
    } catch (error) {
      console.warn('GridStack change processing disabled due to instability')
    }
    */
  }

  /**
   * @description 从 props.items 加载或更新 GridStack 中的项目
   * 这是实现单向数据流（Props -> GridStack）的核心
   */
  const loadOrUpdateItems = () => {
    if (!gridStack.value) return

    // 设置标志位，表明正在从props更新
    isUpdatingFromProps = true

    // 暂时移除 'change' 事件监听器，防止无限循环
    gridStack.value.off('change', onGridChange)

    // 移除所有现有网格项，准备重新加载
    gridStack.value.removeAll(false) // false = 不触发事件

    // 使用 nextTick 确保在 DOM 更新后执行
    nextTick(() => {
      if (!gridStack.value) return

      // 关键修复：使用非响应式的深拷贝数据，完全断开Vue响应式链
      const plainItems = JSON.parse(JSON.stringify(props.items))

      // 临时启用acceptWidgets来添加项目
      if (gridStack.value) {
        gridStack.value.setStatic(false, false) // 暂时取消静态模式
      }

      // 遍历非响应式数据，为每个项目添加 widget
      plainItems.forEach((item: GridStackWidget) => {
        if (!gridStack.value) return

        const content = createItemContent(item)
        // 使用最简单的方式添加widget，避免触发复杂的算法
        gridStack.value.addWidget({
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
          id: item.id,
          content: content.outerHTML
        })
      })

      // 恢复静态模式（如果是只读的话）
      if (gridStack.value && props.readonly) {
        gridStack.value.setStatic(true, false)
      }

      // 在下一次 DOM 更新后重新添加 'change' 事件监听器
      nextTick(() => {
        if (gridStack.value) {
          gridStack.value.on('change', onGridChange)
          // 重置标志位
          isUpdatingFromProps = false
        }
      })
    })
  }

  /**
   * @description 初始化 GridStack 实例
   */
  const initGrid = () => {
    if (!gridStackContainer.value) return

    // 应用GridStack死循环修复补丁
    patchGridStackEngine()

    const options: GridStackOptions = {
      // 基础配置（最简配置）
      column: props.config?.column || 12,
      cellHeight: props.config?.cellHeight || 100,
      margin: props.config?.margin || 10,

      // 完全禁用所有危险功能
      float: false,           // 禁用浮动布局
      animate: false,         // 禁用所有动画  
      rtl: false,            // 禁用RTL
      
      // 禁用碰撞检测和自动排列
      acceptWidgets: false,   // 禁用拖拽添加
      removable: false,       // 禁用删除
      alwaysShowResizeHandle: false,
      oneColumnMode: false,   // 禁用单列模式
      disableOneColumnMode: true,
      
      // 禁用所有自动功能
      staticGrid: false,      // 先不使用静态模式，后续手动控制
      
      // 网格限制
      minRow: 0,
      maxRow: 100,
      
      // 完全禁用拖拽和调整大小（先禁用，测试基础功能）
      disableDrag: true,
      disableResize: true
    }

    gridStack.value = GridStack.init(options, gridStackContainer.value)

    // 初始加载布局
    loadOrUpdateItems()

    // 绑定事件监听器，使用防抖处理
    let changeTimeout: NodeJS.Timeout | null = null
    const debouncedChange = () => {
      if (changeTimeout) clearTimeout(changeTimeout)
      changeTimeout = setTimeout(onGridChange, 16) // ~60fps
    }

    gridStack.value.on('change', debouncedChange)
    gridStack.value.on('added', (_event, items) => {
      const nodes = items.map(i => i.gridstackNode).filter(Boolean) as GridStackWidget[]
      if (nodes.length > 0) {
        emit('added', nodes)
      }
    })
    gridStack.value.on('removed', (_event, items) => {
      const nodes = items.map(i => i.gridstackNode).filter(Boolean) as GridStackWidget[]
      if (nodes.length > 0) {
        emit('removed', nodes)
      }
    })
    gridStack.value.on('dragstop', (_event, el) => {
      const node = (el as GridStackElement).gridstackNode
      if (node) emit('dragstop', node as GridStackWidget)
    })
    gridStack.value.on('resizestop', (_event, el) => {
      const node = (el as GridStackElement).gridstackNode
      if (node) emit('resizestop', node as GridStackWidget)
    })
  }

  /**
   * @description 销毁 GridStack 实例，释放资源
   */
  const destroyGrid = () => {
    if (gridStack.value) {
      gridStack.value.destroy()
      gridStack.value = null
    }
  }

  // --- Watchers ---

  // 监听只读状态的变化
  watch(
    () => props.readonly,
    isReadonly => {
      if (gridStack.value) {
        gridStack.value.enableMove(!isReadonly)
        gridStack.value.enableResize(!isReadonly)
      }
    }
  )

  // 监听列数的变化
  watch(
    () => props.config?.column,
    newColumn => {
      if (gridStack.value && newColumn) {
        gridStack.value.column(newColumn)
      }
    }
  )

  // 防抖监听器：防止频繁触发重新加载
  let reloadTimeout: NodeJS.Timeout | null = null
  const debouncedReload = () => {
    if (reloadTimeout) clearTimeout(reloadTimeout)
    reloadTimeout = setTimeout(() => {
      if (gridStack.value) {
        loadOrUpdateItems()
      }
    }, 100) // 100ms防抖
  }

  // 监听外部数据源 props.items 的变化
  watch(
    () => props.items,
    (newItems, oldItems) => {
      // 如果数组长度没有变化且引用相同，可能是GridStack内部触发的，跳过
      if (newItems === oldItems) return

      if (gridStack.value) {
        debouncedReload()
      }
    },
    { deep: false } // 只监听数组引用变化，不深度监听内容变化
  )

  // --- 暴露给外部的 API 方法 ---

  /**
   * @description 获取所有网格项的节点数据
   */
  const getItems = (): GridStackWidget[] => {
    if (!gridStack.value) return []
    return gridStack.value.getGridItems().map(item => item.gridstackNode as GridStackWidget)
  }

  /**
   * @description 紧凑布局，移除垂直方向的空隙
   * 暂时禁用，因为可能触发碰撞检测死循环
   */
  const compact = () => {
    console.warn('Compact layout is disabled to prevent infinite recursion')
    // gridStack.value?.compact()
  }

  /**
   * @description 添加一个新项到 GridStack
   */
  const addItem = (item: GridStackWidget) => {
    if (!gridStack.value) return

    // 设置更新标志
    isUpdatingFromProps = true

    // 暂时关闭change事件，防止无限循环
    gridStack.value.off('change', onGridChange)

    // 临时取消静态模式
    gridStack.value.setStatic(false, false)

    const content = createItemContent(item)
    // 使用最简单的数据结构避免触发复杂算法
    gridStack.value.addWidget({
      x: item.x || 0,
      y: item.y || 0,
      w: item.w || 4,
      h: item.h || 3,
      id: item.id,
      content: content.outerHTML
    })

    // 恢复模式设置
    if (props.readonly) {
      gridStack.value.setStatic(true, false)
    }

    // 重新绑定change事件并重置标志
    nextTick(() => {
      if (gridStack.value) {
        gridStack.value.on('change', onGridChange)
        isUpdatingFromProps = false
      }
    })
  }

  /**
   * @description 移除指定 ID 的项
   */
  const removeItem = (id: string) => {
    if (!gridStack.value) return
    const itemToRemove = gridStack.value.getGridItems().find(item => item.gridstackNode?.id === id)
    if (itemToRemove) {
      gridStack.value.removeWidget(itemToRemove)
    }
  }

  /**
   * @description 更新指定 ID 的项
   */
  const updateItem = (id: string, options: GridStackWidget) => {
    const itemToUpdate = gridStack.value?.getGridItems().find(item => item.gridstackNode?.id === id)
    if (itemToUpdate) {
      // 关键: 传递 options 的深拷贝, 避免 gridstack 直接修改 vue 的响应式对象
      gridStack.value?.update(itemToUpdate, JSON.parse(JSON.stringify(options)))
    }
  }

  return {
    gridStack,
    initGrid,
    destroyGrid,
    getItems,
    compact,
    addItem,
    removeItem,
    updateItem
  }
}
