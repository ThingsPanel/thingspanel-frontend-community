/**
 * @file 基础状态管理
 * @description PanelV2-Clean 的基础Pinia状态管理
 * 重点是数据传递层的正确性，保持简单和高效
 */

import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { nanoid } from 'nanoid'
import type { PanelV2Data, NodeData, PanelConfig } from '../types/core'
import { globalDataPipeline } from '../core/PureDataPipeline'
import { globalLifecycleManager } from '../core/LifecycleManager'
import { globalEventBus } from '../core/EventBus'
import { DataOperationType } from '../core/interfaces/DataPipeline'
import { LifecyclePhase } from '../core/interfaces/Lifecycle'

/**
 * 基础面板状态管理Store
 */
export const usePanelCleanStore = defineStore('panelClean', () => {
  // ==================== 响应式状态 ====================

  /** 当前面板数据 */
  const panelData = ref<PanelV2Data>({
    meta: {
      id: nanoid(),
      name: '新建看板',
      version: '2.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      renderEngine: 'gridstack'
    },
    config: getDefaultPanelConfig(),
    nodes: [],
    runtime: {
      selectedNodeIds: [],
      viewMode: 'edit',
      viewport: { zoom: 1, offsetX: 0, offsetY: 0 },
      isDirty: false
    }
  })

  /** 历史操作记录（用于撤销重做） */
  const operationHistory = reactive({
    past: [] as PanelV2Data[],
    future: [] as PanelV2Data[],
    maxSize: 50
  })

  /** Store状态统计 */
  const storeStats = reactive({
    totalOperations: 0,
    lastOperationTime: 0,
    nodesCount: 0,
    selectedCount: 0
  })

  // ==================== 计算属性 ====================

  /** 选中的节点数据 */
  const selectedNodes = computed(() => {
    return panelData.value.nodes.filter(node => panelData.value.runtime.selectedNodeIds.includes(node.id))
  })

  /** 是否可以撤销 */
  const canUndo = computed(() => operationHistory.past.length > 0)

  /** 是否可以重做 */
  const canRedo = computed(() => operationHistory.future.length > 0)

  /** 是否有未保存的更改 */
  const isDirty = computed(() => panelData.value.runtime.isDirty)

  // ==================== 核心操作方法 ====================

  /**
   * 添加节点
   */
  async function addNode(nodeData: Partial<NodeData>): Promise<void> {
    const newNode: NodeData = {
      id: nanoid(),
      type: nodeData.type || 'unknown',
      name: nodeData.name || '新节点',
      layout: {
        x: 0,
        y: 0,
        w: 4,
        h: 2,
        ...nodeData.layout
      },
      config: {
        base: getDefaultNodeBaseConfig(nodeData.layout || {}),
        interaction: getDefaultNodeInteractionConfig(),
        content: nodeData.config?.content || {}
      },
      style: getDefaultNodeStyleConfig(),
      meta: {
        createTime: Date.now(),
        updateTime: Date.now(),
        version: '1.0'
      },
      ...nodeData
    }

    try {
      // 通过数据管道执行操作
      await globalDataPipeline.execute({
        id: nanoid(),
        type: DataOperationType.ADD,
        payload: newNode,
        target: { type: 'node', id: newNode.id }
      })

      // 记录历史状态
      recordHistoryState()

      // 更新状态
      panelData.value.nodes.push(newNode)
      panelData.value.runtime.selectedNodeIds = [newNode.id]
      panelData.value.runtime.isDirty = true
      panelData.value.meta.updatedAt = new Date().toISOString()

      // 更新统计
      updateStats()

      // 触发生命周期
      await globalLifecycleManager.trigger(LifecyclePhase.NODE_ADDED, {
        type: 'node',
        targetId: newNode.id,
        data: newNode,
        timestamp: Date.now(),
        source: 'store'
      })

      console.log('PanelCleanStore: 节点添加成功', { nodeId: newNode.id, nodeType: newNode.type })
    } catch (error) {
      console.error('PanelCleanStore: 节点添加失败', error)
      throw error
    }
  }

  /**
   * 更新节点
   */
  async function updateNode(nodeId: string, updates: Partial<NodeData>): Promise<void> {
    const nodeIndex = panelData.value.nodes.findIndex(node => node.id === nodeId)
    if (nodeIndex === -1) {
      throw new Error(`节点 ${nodeId} 不存在`)
    }

    const oldNode = panelData.value.nodes[nodeIndex]

    try {
      // 通过数据管道执行操作
      await globalDataPipeline.execute({
        id: nanoid(),
        type: DataOperationType.UPDATE,
        payload: updates,
        target: { type: 'node', id: nodeId }
      })

      // 记录历史状态
      recordHistoryState()

      // 更新节点数据
      const updatedNode = {
        ...oldNode,
        ...updates,
        meta: {
          ...oldNode.meta,
          updateTime: Date.now()
        }
      }

      panelData.value.nodes[nodeIndex] = updatedNode
      panelData.value.runtime.isDirty = true
      panelData.value.meta.updatedAt = new Date().toISOString()

      // 更新统计
      updateStats()

      // 触发生命周期
      await globalLifecycleManager.trigger(LifecyclePhase.NODE_UPDATED, {
        type: 'node',
        targetId: nodeId,
        data: { oldNode, newNode: updatedNode },
        timestamp: Date.now(),
        source: 'store'
      })

      console.log('PanelCleanStore: 节点更新成功', { nodeId, updates })
    } catch (error) {
      console.error('PanelCleanStore: 节点更新失败', error)
      throw error
    }
  }

  /**
   * 删除节点
   */
  async function removeNode(nodeId: string): Promise<void> {
    const nodeIndex = panelData.value.nodes.findIndex(node => node.id === nodeId)
    if (nodeIndex === -1) {
      throw new Error(`节点 ${nodeId} 不存在`)
    }

    const nodeToDelete = panelData.value.nodes[nodeIndex]

    try {
      // 通过数据管道执行操作
      await globalDataPipeline.execute({
        id: nanoid(),
        type: DataOperationType.DELETE,
        payload: nodeToDelete,
        target: { type: 'node', id: nodeId }
      })

      // 记录历史状态
      recordHistoryState()

      // 删除节点
      panelData.value.nodes.splice(nodeIndex, 1)

      // 更新选中状态
      const selectedIndex = panelData.value.runtime.selectedNodeIds.indexOf(nodeId)
      if (selectedIndex > -1) {
        panelData.value.runtime.selectedNodeIds.splice(selectedIndex, 1)
      }

      panelData.value.runtime.isDirty = true
      panelData.value.meta.updatedAt = new Date().toISOString()

      // 更新统计
      updateStats()

      // 触发生命周期
      await globalLifecycleManager.trigger(LifecyclePhase.NODE_REMOVED, {
        type: 'node',
        targetId: nodeId,
        data: nodeToDelete,
        timestamp: Date.now(),
        source: 'store'
      })

      console.log('PanelCleanStore: 节点删除成功', { nodeId })
    } catch (error) {
      console.error('PanelCleanStore: 节点删除失败', error)
      throw error
    }
  }

  /**
   * 选择节点
   */
  async function selectNodes(nodeIds: string[]): Promise<void> {
    const validNodeIds = nodeIds.filter(id => panelData.value.nodes.some(node => node.id === id))

    const previousSelection = [...panelData.value.runtime.selectedNodeIds]
    panelData.value.runtime.selectedNodeIds = validNodeIds

    // 更新统计
    updateStats()

    // 发射全局事件
    globalEventBus.emit('selection-changed', {
      previousSelection,
      currentSelection: validNodeIds,
      selectedNodes: selectedNodes.value
    })

    // 触发生命周期（如果有选中的节点）
    if (validNodeIds.length > 0) {
      await globalLifecycleManager.trigger(LifecyclePhase.NODE_SELECTED, {
        type: 'node',
        targetId: validNodeIds[0], // 主选中节点
        data: { selectedIds: validNodeIds, selectedNodes: selectedNodes.value },
        timestamp: Date.now(),
        source: 'store'
      })
    }

    console.log('PanelCleanStore: 节点选择已更新', {
      from: previousSelection,
      to: validNodeIds
    })
  }

  /**
   * 更新面板配置
   */
  async function updatePanelConfig(configUpdates: Partial<PanelConfig>): Promise<void> {
    try {
      // 通过数据管道执行操作
      await globalDataPipeline.execute({
        id: nanoid(),
        type: DataOperationType.UPDATE,
        payload: configUpdates,
        target: { type: 'panel', id: panelData.value.meta.id }
      })

      // 记录历史状态
      recordHistoryState()

      // 更新配置
      panelData.value.config = {
        ...panelData.value.config,
        ...configUpdates
      }

      panelData.value.runtime.isDirty = true
      panelData.value.meta.updatedAt = new Date().toISOString()

      // 更新统计
      updateStats()

      console.log('PanelCleanStore: 面板配置更新成功', configUpdates)
    } catch (error) {
      console.error('PanelCleanStore: 面板配置更新失败', error)
      throw error
    }
  }

  // ==================== 历史操作方法 ====================

  /**
   * 撤销操作
   */
  async function undo(): Promise<boolean> {
    if (!canUndo.value) return false

    try {
      // 保存当前状态到future
      operationHistory.future.unshift(JSON.parse(JSON.stringify(panelData.value)))

      // 恢复past状态
      const previousState = operationHistory.past.pop()!
      panelData.value = JSON.parse(JSON.stringify(previousState))

      // 限制future大小
      if (operationHistory.future.length > operationHistory.maxSize) {
        operationHistory.future = operationHistory.future.slice(0, operationHistory.maxSize)
      }

      // 更新统计
      updateStats()

      // 发射全局事件
      globalEventBus.emit('operation-undo', {
        timestamp: Date.now(),
        nodesCount: panelData.value.nodes.length
      })

      console.log('PanelCleanStore: 撤销操作成功')
      return true
    } catch (error) {
      console.error('PanelCleanStore: 撤销操作失败', error)
      return false
    }
  }

  /**
   * 重做操作
   */
  async function redo(): Promise<boolean> {
    if (!canRedo.value) return false

    try {
      // 保存当前状态到past
      operationHistory.past.push(JSON.parse(JSON.stringify(panelData.value)))

      // 恢复future状态
      const futureState = operationHistory.future.shift()!
      panelData.value = JSON.parse(JSON.stringify(futureState))

      // 限制past大小
      if (operationHistory.past.length > operationHistory.maxSize) {
        operationHistory.past = operationHistory.past.slice(-operationHistory.maxSize)
      }

      // 更新统计
      updateStats()

      // 发射全局事件
      globalEventBus.emit('operation-redo', {
        timestamp: Date.now(),
        nodesCount: panelData.value.nodes.length
      })

      console.log('PanelCleanStore: 重做操作成功')
      return true
    } catch (error) {
      console.error('PanelCleanStore: 重做操作失败', error)
      return false
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 记录历史状态
   */
  function recordHistoryState(): void {
    // 深拷贝当前状态
    const currentState = JSON.parse(JSON.stringify(panelData.value))
    operationHistory.past.push(currentState)

    // 清空future（新操作会清空重做历史）
    operationHistory.future = []

    // 限制历史记录大小
    if (operationHistory.past.length > operationHistory.maxSize) {
      operationHistory.past = operationHistory.past.slice(-operationHistory.maxSize)
    }
  }

  /**
   * 更新统计信息
   */
  function updateStats(): void {
    storeStats.totalOperations++
    storeStats.lastOperationTime = Date.now()
    storeStats.nodesCount = panelData.value.nodes.length
    storeStats.selectedCount = panelData.value.runtime.selectedNodeIds.length
  }

  /**
   * 清空所有数据
   */
  function clearAll(): void {
    panelData.value.nodes = []
    panelData.value.runtime.selectedNodeIds = []
    panelData.value.runtime.isDirty = false
    operationHistory.past = []
    operationHistory.future = []
    updateStats()
    console.log('PanelCleanStore: 所有数据已清空')
  }

  /**
   * 获取Store统计信息
   */
  function getStats() {
    return {
      ...storeStats,
      historySize: operationHistory.past.length,
      futureSize: operationHistory.future.length,
      canUndo: canUndo.value,
      canRedo: canRedo.value
    }
  }

  // 返回Store的公共接口
  return {
    // 状态
    panelData,
    selectedNodes,
    canUndo,
    canRedo,
    isDirty,

    // 方法
    addNode,
    updateNode,
    removeNode,
    selectNodes,
    updatePanelConfig,
    undo,
    redo,
    clearAll,
    getStats
  }
})

// ==================== 默认配置生成函数 ====================

function getDefaultPanelConfig(): PanelConfig {
  return {
    layout: {
      gridColumns: 12,
      cellHeight: 70,
      margin: 8,
      padding: 16
    },
    appearance: {
      backgroundColor: '#f5f5f5',
      theme: 'light'
    },
    data: {
      globalDataSource: '{}',
      sharedVariables: '{}',
      apiConfig: {
        timeout: 5000,
        refreshInterval: 30000
      },
      realTimeConfig: {
        enabled: false
      }
    },
    interaction: {
      allowDrag: true,
      allowResize: true,
      allowEdit: true,
      allowDelete: true,
      globalClickBehavior: {
        type: 'blur',
        clearSelection: true
      }
    },
    meta: {
      title: '新建看板',
      version: '2.0',
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    }
  }
}

function getDefaultNodeBaseConfig(layout: any) {
  return {
    layout: {
      x: 0,
      y: 0,
      w: 4,
      h: 2,
      ...layout
    },
    state: {
      locked: false,
      hidden: false,
      disabled: false
    },
    appearance: {
      border: {
        width: 1,
        style: 'solid' as const,
        color: '#e8e8e8',
        radius: 4
      },
      opacity: 1
    }
  }
}

function getDefaultNodeInteractionConfig() {
  return {
    onClick: { type: 'none' as const },
    onHover: { highlight: false }
  }
}

function getDefaultNodeStyleConfig() {
  return {
    background: {
      color: '#ffffff'
    },
    shadow: {
      enabled: false,
      color: 'rgba(0,0,0,0.1)',
      blur: 4,
      offsetX: 0,
      offsetY: 2
    }
  }
}
