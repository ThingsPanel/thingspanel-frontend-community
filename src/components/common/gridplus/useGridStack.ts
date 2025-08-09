// e:\wbh\things2\thingspanel-frontend-community\src\components\common\gridplus\useGridStack.ts

import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed, Ref } from 'vue'
import { GridStack, GridStackNode, GridStackWidget } from 'gridstack'
import type { GridItem, GridConfig } from './types'

/**
 * @description 封装 GridStack.js 功能的 Vue 3 Composition API Hook
 * @param gridStackRef GridStack 容器的模板引用
 * @param props 组件的 props
 * @param emit 组件的 emits
 * @param createItemContent Function to create the HTML content for a grid item
 */
export function useGridStack(
  gridStackRef: Ref<HTMLElement | null>,
  props: any, // 实际项目中应替换为具体的 Props 类型
  emit: any, // 实际项目中应替换为具体的 Emits 类型
  createItemContent: (item: GridItem) => HTMLElement
) {
  const gridStack = ref<GridStack | null>(null)

  /**
   * @description 初始化 GridStack 实例
   */
  const initGrid = () => {
    if (gridStack.value || !gridStackRef.value) return

    const options: GridConfig = {
      ...props.config,
      column: props.config.column || 12,
      cellHeight: props.config.cellHeight || 30,
      margin: props.config.margin || 10,
      disableDrag: props.readonly,
      disableResize: props.readonly,
      float: true // 允许小部件浮动
    }

    gridStack.value = GridStack.init(options, gridStackRef.value)
    loadItems(props.items)
    setupEventListeners()
  }

  /**
   * @description 销毁 GridStack 实例
   */
  const destroyGrid = () => {
    if (gridStack.value) {
      gridStack.value.destroy(false) // false 表示不删除 DOM 元素
      gridStack.value = null
    }
  }

  /**
   * @description 加载或更新网格项
   * @param newItems 新的项目数组
   */
  const loadItems = (newItems: GridItem[]) => {
    if (!gridStack.value) return

    gridStack.value.batchUpdate()
    gridStack.value.removeAll(false) // 移除现有项，但不删除 DOM

    newItems.forEach(item => {
      const widgetOptions: GridStackWidget = {
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        id: item.id
      }
      const itemEl = createItemContent(item)
      gridStack.value?.addWidget(itemEl, widgetOptions)
    })

    gridStack.value.batchUpdate(false)
  }

  /**
   * @description 设置 GridStack 的事件监听器
   */
  const setupEventListeners = () => {
    if (!gridStack.value) return

    // 监听布局变化
    gridStack.value.on('change', (event, items: GridStackNode[]) => {
      const updatedItems = items.map(node => ({
        id: node.id,
        x: node.x,
        y: node.y,
        w: node.w,
        h: node.h
      }))
      emit('update:items', updatedItems)
      emit('layout-change', updatedItems)
    })

    // 其他事件监听...
    gridStack.value.on('dragstart', (event, el) => emit('drag-start', el.getAttribute('gs-id')))
    gridStack.value.on('resizestart', (event, el) => emit('resize-start', el.getAttribute('gs-id')))
  }

  // --- Watchers ---

  // 监听 items 数组的变化
  watch(
    () => props.items,
    newItems => {
      if (gridStack.value) {
        loadItems(newItems)
      }
    },
    { deep: true }
  )

  // 监听列数变化
  watch(
    () => props.config.column,
    newColumn => {
      if (gridStack.value) {
        gridStack.value.column(newColumn, 'moveScale')
      }
    }
  )

  // 监听只读状态变化
  watch(
    () => props.readonly,
    isReadonly => {
      if (gridStack.value) {
        gridStack.value.setStatic(isReadonly)
      }
    }
  )

  // --- Lifecycle Hooks ---

  onMounted(() => {
    nextTick(() => {
      initGrid()
    })
  })

  onBeforeUnmount(() => {
    destroyGrid()
  })

  // 暴露给组件实例的方法
  const getItems = () => {
    if (!gridStack.value) return []
    return gridStack.value.save() // gridstack.save() 返回所有项的序列化数据
  }

  const compact = () => {
    gridStack.value?.compact()
  }

  const addItem = (item: GridItem) => {
    if (!gridStack.value) return
    const itemEl = createItemContent(item)
    gridStack.value.addWidget(itemEl, item)
  }

  const removeItem = (id: string) => {
    if (!gridStack.value) return
    const itemEl = gridStack.value.getGridItems().find(el => el.getAttribute('gs-id') === id)
    if (itemEl) {
      gridStack.value.removeWidget(itemEl, false)
    }
  }

  const updateItem = (id: string, newProps: Partial<GridItem>) => {
    if (!gridStack.value) return
    const itemEl = gridStack.value.getGridItems().find(el => el.getAttribute('gs-id') === id)
    if (itemEl) {
      gridStack.value.update(itemEl, newProps)
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
