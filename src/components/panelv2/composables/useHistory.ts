// src/components/panelv2/composables/useHistory.ts

import { ref, computed } from 'vue'
import type { PanelState } from '../types'

export interface HistoryAction {
  type: string
  timestamp: number
  beforeState: PanelState
  afterState?: PanelState
  description?: string
}

export function useHistory(maxSize = 50) {
  const history = ref<HistoryAction[]>([])
  const currentIndex = ref(-1)

  // 计算属性
  const canUndo = computed(() => currentIndex.value >= 0)
  const canRedo = computed(() => currentIndex.value < history.value.length - 1)

  // 记录历史状态
  const recordHistory = (type: string, beforeState: PanelState, afterState?: PanelState, description?: string) => {
    const action: HistoryAction = {
      type,
      timestamp: Date.now(),
      beforeState: JSON.parse(JSON.stringify(beforeState)),
      afterState: afterState ? JSON.parse(JSON.stringify(afterState)) : undefined,
      description
    }

    // 如果当前不在历史记录的末尾，删除后面的记录
    if (currentIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, currentIndex.value + 1)
    }

    // 添加新的历史记录
    history.value.push(action)
    currentIndex.value = history.value.length - 1

    // 限制历史记录数量
    if (history.value.length > maxSize) {
      history.value = history.value.slice(-maxSize)
      currentIndex.value = history.value.length - 1
    }
  }

  // 撤销操作
  const undo = (): HistoryAction | null => {
    if (!canUndo.value) return null

    const action = history.value[currentIndex.value]
    currentIndex.value--
    return action
  }

  // 重做操作
  const redo = (): HistoryAction | null => {
    if (!canRedo.value) return null

    currentIndex.value++
    const action = history.value[currentIndex.value]
    return action
  }

  // 获取当前历史记录
  const getCurrentAction = (): HistoryAction | null => {
    if (currentIndex.value >= 0 && currentIndex.value < history.value.length) {
      return history.value[currentIndex.value]
    }
    return null
  }

  // 清空历史记录
  const clearHistory = () => {
    history.value = []
    currentIndex.value = -1
  }

  // 获取历史记录列表（用于UI显示）
  const getHistoryList = () => {
    return history.value.map((action, index) => ({
      ...action,
      isCurrent: index === currentIndex.value,
      canRestore: true
    }))
  }

  // 跳转到特定历史记录
  const jumpToHistory = (index: number): HistoryAction | null => {
    if (index < 0 || index >= history.value.length) return null

    currentIndex.value = index
    return history.value[index]
  }

  return {
    // 状态
    canUndo,
    canRedo,

    // 方法
    recordHistory,
    undo,
    redo,
    getCurrentAction,
    clearHistory,
    getHistoryList,
    jumpToHistory,

    // 原始数据（用于调试）
    history: computed(() => history.value),
    currentIndex: computed(() => currentIndex.value)
  }
}
