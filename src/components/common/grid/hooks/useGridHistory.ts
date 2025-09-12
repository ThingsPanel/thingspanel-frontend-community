/**
 * Grid 历史记录管理 Hook
 * 提供撤销/重做功能和历史记录管理
 */

import { ref, computed } from 'vue'
import type { GridLayoutPlusItem } from '../gridLayoutPlusTypes'
import { cloneLayout } from '../gridLayoutPlusUtils'

export interface UseGridHistoryOptions {
  /** 是否启用历史记录 */
  enabled?: boolean
  /** 历史记录最大长度 */
  maxLength?: number
  /** 自动保存时间间隔(ms) */
  autoSaveInterval?: number
}

/**
 * 网格历史记录管理Hook
 * 提供完整的撤销/重做功能
 */
export function useGridHistory(options: UseGridHistoryOptions = {}) {
  const {
    enabled = true,
    maxLength = 50,
    autoSaveInterval = 0 // 0表示禁用自动保存
  } = options

  // 历史记录状态
  const history = ref<GridLayoutPlusItem[][]>([])
  const historyIndex = ref(-1)
  const isRecording = ref(true)

  // 自动保存定时器
  let autoSaveTimer: NodeJS.Timeout | null = null

  // 计算属性
  const canUndo = computed(() => enabled && historyIndex.value > 0)
  const canRedo = computed(() => enabled && historyIndex.value < history.value.length - 1)
  const historyLength = computed(() => history.value.length)
  const currentHistoryIndex = computed(() => historyIndex.value)

  /**
   * 保存布局到历史记录
   */
  const saveToHistory = (layout: GridLayoutPlusItem[]) => {
    if (!enabled || !isRecording.value || layout.length === 0) return

    try {
      const currentLayout = cloneLayout(layout)

      // 检查是否与当前历史记录相同
      if (history.value.length > 0) {
        const lastHistoryLayout = history.value[historyIndex.value]
        if (lastHistoryLayout && JSON.stringify(lastHistoryLayout) === JSON.stringify(currentLayout)) {
          return // 布局没有变化，不保存
        }
      }

      // 如果当前不在历史记录末尾，删除后面的记录
      if (historyIndex.value < history.value.length - 1) {
        history.value = history.value.slice(0, historyIndex.value + 1)
      }

      // 添加新记录
      history.value.push(currentLayout)
      historyIndex.value = history.value.length - 1

      // 限制历史记录长度
      if (history.value.length > maxLength) {
        history.value.shift()
        historyIndex.value = history.value.length - 1
      }

      console.debug(`[GridHistory] Saved to history. Index: ${historyIndex.value}, Total: ${history.value.length}`)
    } catch (err) {
      console.error('[GridHistory] Failed to save to history:', err)
    }
  }

  /**
   * 撤销到上一个状态
   */
  const undo = (): GridLayoutPlusItem[] | null => {
    if (!canUndo.value) {
      console.error('[GridHistory] Cannot undo: no previous state available')
      return null
    }

    try {
      historyIndex.value--
      const previousLayout = history.value[historyIndex.value]
      console.debug(`[GridHistory] Undo to index: ${historyIndex.value}`)
      return cloneLayout(previousLayout)
    } catch (err) {
      console.error('[GridHistory] Failed to undo:', err)
      return null
    }
  }

  /**
   * 重做到下一个状态
   */
  const redo = (): GridLayoutPlusItem[] | null => {
    if (!canRedo.value) {
      console.error('[GridHistory] Cannot redo: no next state available')
      return null
    }

    try {
      historyIndex.value++
      const nextLayout = history.value[historyIndex.value]
      console.debug(`[GridHistory] Redo to index: ${historyIndex.value}`)
      return cloneLayout(nextLayout)
    } catch (err) {
      console.error('[GridHistory] Failed to redo:', err)
      return null
    }
  }

  /**
   * 跳转到指定历史记录
   */
  const jumpToHistory = (index: number): GridLayoutPlusItem[] | null => {
    if (!enabled || index < 0 || index >= history.value.length) {
      console.error(`[GridHistory] Invalid history index: ${index}`)
      return null
    }

    try {
      historyIndex.value = index
      const targetLayout = history.value[index]
      console.debug(`[GridHistory] Jump to index: ${index}`)
      return cloneLayout(targetLayout)
    } catch (err) {
      console.error('[GridHistory] Failed to jump to history:', err)
      return null
    }
  }

  /**
   * 获取历史记录摘要
   */
  const getHistorySummary = () => {
    return history.value.map((layout, index) => ({
      index,
      timestamp: Date.now(), // 简化版，实际应该存储真实时间戳
      itemCount: layout.length,
      isCurrent: index === historyIndex.value
    }))
  }

  /**
   * 清空历史记录
   */
  const clearHistory = () => {
    history.value = []
    historyIndex.value = -1
    console.debug('[GridHistory] History cleared')
  }

  /**
   * 暂停历史记录
   */
  const pauseRecording = () => {
    isRecording.value = false
    console.debug('[GridHistory] Recording paused')
  }

  /**
   * 恢复历史记录
   */
  const resumeRecording = () => {
    isRecording.value = true
    console.debug('[GridHistory] Recording resumed')
  }

  /**
   * 开始自动保存
   */
  const startAutoSave = (layoutRef: { value: GridLayoutPlusItem[] }) => {
    if (autoSaveInterval <= 0 || !enabled) return

    stopAutoSave() // 停止之前的定时器

    autoSaveTimer = setInterval(() => {
      if (isRecording.value && layoutRef.value.length > 0) {
        saveToHistory(layoutRef.value)
      }
    }, autoSaveInterval)

    console.debug(`[GridHistory] Auto save started with ${autoSaveInterval}ms interval`)
  }

  /**
   * 停止自动保存
   */
  const stopAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
      console.debug('[GridHistory] Auto save stopped')
    }
  }

  /**
   * 初始化历史记录
   */
  const initHistory = (initialLayout: GridLayoutPlusItem[]) => {
    if (!enabled || initialLayout.length === 0) return

    history.value = [cloneLayout(initialLayout)]
    historyIndex.value = 0
    console.debug('[GridHistory] History initialized')
  }

  return {
    // 状态
    canUndo,
    canRedo,
    historyLength,
    currentHistoryIndex,
    isRecording,

    // 方法
    saveToHistory,
    undo,
    redo,
    jumpToHistory,
    getHistorySummary,
    clearHistory,
    pauseRecording,
    resumeRecording,
    startAutoSave,
    stopAutoSave,
    initHistory
  }
}
