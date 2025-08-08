/**
 * 面板管理 Composable
 * 提取原始 panel-manage.vue 的核心逻辑，供 Visual Editor 使用
 */

import { ref, reactive, computed, watch } from 'vue'
import { useDialog, useMessage } from 'naive-ui'
import { useFullscreen } from '@vueuse/core'
import type { ICardView, ICardData, PanelConfig } from '@/card2.1/core/types/legacy'
import type {} from '../types/layout'
import { usePanelConfigAdapter } from '@/card2.1/core/adapters/PanelConfigAdapter'
import { useThemeIntegration } from '../theme/ThemeIntegration'
import { deviceTemplateSelect } from '@/service/api'
import { useAppStore } from '@/store/modules/app'
import { useWebsocketUtil } from '@/utils/websocketUtil'
import { createLogger } from '@/utils/logger'

const logger = createLogger('PanelManager')

// ====== 面板管理选项 ======

export interface PanelManagerOptions {
  panelId: string
  enableAutoSave?: boolean
  autoSaveInterval?: number // 自动保存间隔（秒）
  enableWebSocket?: boolean
  enableFullscreen?: boolean
  enableThemeSwitch?: boolean
}

// ====== 面板状态类型 ======

export interface PanelState {
  // 基础状态
  isLoading: boolean
  isSaving: boolean
  isEditing: boolean
  hasUnsavedChanges: boolean

  // 面板数据
  panelData: Panel.Board | null
  layout: ICardView[]
  theme: string

  // UI 状态
  showingCardList: boolean
  editingCard: boolean
  fullscreen: boolean

  // 设备选项
  deviceOptions: any[]
}

// ====== 编辑操作类型 ======

export type EditOperation = 'add-card' | 'remove-card' | 'move-card' | 'resize-card' | 'edit-config' | 'change-theme'

export interface EditHistory {
  id: string
  operation: EditOperation
  timestamp: number
  beforeState: any
  afterState: any
  description: string
}

// ====== 主要 Composable ======

export function usePanelManager(options: PanelManagerOptions) {
  const {
    panelId,
    enableAutoSave = true,
    autoSaveInterval = 30,
    enableWebSocket = true,
    enableFullscreen = true,
    enableThemeSwitch = true
  } = options

  // ====== 外部依赖 ======
  const dialog = useDialog()
  const message = useMessage()
  const _appStore = useAppStore() // 添加下划线前缀表示暂时未使用
  const adapter = usePanelConfigAdapter()
  const themeIntegration = useThemeIntegration()

  // ====== 响应式状态 ======
  const state = reactive<PanelState>({
    isLoading: false,
    isSaving: false,
    isEditing: false,
    hasUnsavedChanges: false,
    panelData: null,
    layout: [],
    theme: 'default',
    showingCardList: false,
    editingCard: false,
    fullscreen: false,
    deviceOptions: []
  })

  // 历史记录
  const editHistory = ref<EditHistory[]>([])
  const currentHistoryIndex = ref(-1)

  // 原始数据（用于比较是否有变更）
  const originalLayout = ref<ICardView[]>([])
  const originalTheme = ref('default')

  // 定时器引用
  let autoSaveTimer: NodeJS.Timeout | null = null
  let webSocketConnection: any = null

  // ====== 全屏功能 ======
  const fullscreenContainer = ref<HTMLElement>()
  const { isFullscreen, toggle: toggleFullscreen } = useFullscreen(fullscreenContainer, {
    requestFullscreen: enableFullscreen
  })

  // 同步全屏状态
  watch(isFullscreen, newValue => {
    state.fullscreen = newValue
  })

  // ====== 面板数据管理 ======

  /**
   * 加载面板数据
   */
  async function loadPanel(): Promise<boolean> {
    try {
      state.isLoading = true

      const config = await adapter.loadPanelConfig(panelId)
      if (!config) {
        throw new Error('面板配置加载失败')
      }

      // 更新状态
      state.panelData = {
        id: config.id,
        name: config.name,
        config: config.config
      } as Panel.Board
      state.layout = [...config.layout]
      state.theme = config.theme

      // 保存原始数据
      originalLayout.value = [...config.layout]
      originalTheme.value = config.theme

      // 应用主题
      if (enableThemeSwitch) {
        themeIntegration.switchToTheme(config.theme)
      }

      state.hasUnsavedChanges = false
      logger.info(`面板加载成功: ${config.name}`)

      return true
    } catch (error: any) {
      logger.error('面板加载失败:', error)
      message.error(error.message || '面板加载失败')
      return false
    } finally {
      state.isLoading = false
    }
  }

  /**
   * 保存面板数据
   */
  async function savePanel(): Promise<boolean> {
    if (!state.panelData) {
      message.warning('没有面板数据可保存')
      return false
    }

    try {
      state.isSaving = true

      const config: PanelConfig = {
        id: state.panelData.id,
        name: state.panelData.name || '未命名面板',
        layout: state.layout,
        theme: state.theme
      }

      const success = await adapter.savePanelConfig(config)
      if (!success) {
        throw new Error('面板保存失败')
      }

      // 更新原始数据
      originalLayout.value = [...state.layout]
      originalTheme.value = state.theme
      state.hasUnsavedChanges = false

      message.success('面板保存成功')
      logger.info('面板保存成功')

      return true
    } catch (error: any) {
      logger.error('面板保存失败:', error)
      message.error(error.message || '面板保存失败')
      return false
    } finally {
      state.isSaving = false
    }
  }

  /**
   * 检查是否有未保存的变更
   */
  function checkUnsavedChanges(): boolean {
    const layoutChanged = JSON.stringify(state.layout) !== JSON.stringify(originalLayout.value)
    const themeChanged = state.theme !== originalTheme.value

    state.hasUnsavedChanges = layoutChanged || themeChanged
    return state.hasUnsavedChanges
  }

  // ====== 编辑功能 ======

  /**
   * 添加卡片到布局
   */
  function addCard(cardData: ICardData): void {
    const newCardView: ICardView = {
      i: generateUniqueId(),
      x: 0,
      y: 0,
      w: cardData.layout?.w || 4,
      h: cardData.layout?.h || 3,
      minW: cardData.layout?.minW || 2,
      minH: cardData.layout?.minH || 2,
      data: cardData
    }

    // 计算新卡片位置
    const position = calculateNewCardPosition(newCardView.w, newCardView.h)
    newCardView.x = position.x
    newCardView.y = position.y

    state.layout.push(newCardView)

    // 记录编辑历史
    recordEditHistory('add-card', null, newCardView, `添加卡片: ${cardData.title}`)

    checkUnsavedChanges()
    logger.info(`添加卡片: ${cardData.title}`)
  }

  /**
   * 移除卡片
   */
  function removeCard(cardId: number): void {
    const index = state.layout.findIndex(item => item.i === cardId)
    if (index === -1) return

    const removedCard = state.layout[index]
    state.layout.splice(index, 1)

    // 记录编辑历史
    recordEditHistory('remove-card', removedCard, null, `移除卡片: ${removedCard.data?.title}`)

    checkUnsavedChanges()
    logger.info(`移除卡片: ${removedCard.data?.title}`)
  }

  /**
   * 更新卡片布局
   */
  function updateCardLayout(cardId: number, updates: Partial<ICardView>): void {
    const index = state.layout.findIndex(item => item.i === cardId)
    if (index === -1) return

    const oldCard = { ...state.layout[index] }
    Object.assign(state.layout[index], updates)

    // 记录编辑历史
    recordEditHistory('move-card', oldCard, state.layout[index], '移动/调整卡片')

    checkUnsavedChanges()
  }

  /**
   * 切换主题
   */
  function switchTheme(themeId: string): void {
    if (state.theme === themeId) return

    const oldTheme = state.theme
    state.theme = themeId

    if (enableThemeSwitch) {
      themeIntegration.switchToTheme(themeId)
    }

    // 记录编辑历史
    recordEditHistory('change-theme', oldTheme, themeId, `切换主题: ${themeId}`)

    checkUnsavedChanges()
    logger.info(`切换主题: ${themeId}`)
  }

  // ====== 编辑历史管理 ======

  /**
   * 记录编辑历史
   */
  function recordEditHistory(operation: EditOperation, beforeState: any, afterState: any, description: string): void {
    const historyItem: EditHistory = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      operation,
      timestamp: Date.now(),
      beforeState,
      afterState,
      description
    }

    // 如果当前不在历史记录末尾，删除后续记录
    if (currentHistoryIndex.value < editHistory.value.length - 1) {
      editHistory.value.splice(currentHistoryIndex.value + 1)
    }

    editHistory.value.push(historyItem)
    currentHistoryIndex.value = editHistory.value.length - 1

    // 限制历史记录数量
    if (editHistory.value.length > 50) {
      editHistory.value.shift()
      currentHistoryIndex.value--
    }
  }

  /**
   * 撤销操作
   */
  function undo(): boolean {
    if (currentHistoryIndex.value < 0) return false

    const historyItem = editHistory.value[currentHistoryIndex.value]
    applyHistoryItem(historyItem, true) // true 表示撤销
    currentHistoryIndex.value--

    checkUnsavedChanges()
    message.info(`撤销: ${historyItem.description}`)
    return true
  }

  /**
   * 重做操作
   */
  function redo(): boolean {
    if (currentHistoryIndex.value >= editHistory.value.length - 1) return false

    currentHistoryIndex.value++
    const historyItem = editHistory.value[currentHistoryIndex.value]
    applyHistoryItem(historyItem, false) // false 表示重做

    checkUnsavedChanges()
    message.info(`重做: ${historyItem.description}`)
    return true
  }

  /**
   * 应用历史记录项
   */
  function applyHistoryItem(historyItem: EditHistory, isUndo: boolean): void {
    const targetState = isUndo ? historyItem.beforeState : historyItem.afterState

    switch (historyItem.operation) {
      case 'add-card':
        if (isUndo) {
          // 撤销添加 = 删除
          const index = state.layout.findIndex(item => item.i === historyItem.afterState.i)
          if (index !== -1) state.layout.splice(index, 1)
        } else {
          // 重做添加
          state.layout.push(historyItem.afterState)
        }
        break

      case 'remove-card':
        if (isUndo) {
          // 撤销删除 = 添加回来
          state.layout.push(historyItem.beforeState)
        } else {
          // 重做删除
          const index = state.layout.findIndex(item => item.i === historyItem.beforeState.i)
          if (index !== -1) state.layout.splice(index, 1)
        }
        break

      case 'move-card':
      case 'resize-card': {
        const index = state.layout.findIndex(item => item.i === targetState.i)
        if (index !== -1) {
          Object.assign(state.layout[index], targetState)
        }
        break
      }

      case 'change-theme':
        state.theme = targetState
        if (enableThemeSwitch) {
          themeIntegration.switchToTheme(targetState)
        }
        break
    }
  }

  // ====== 工具函数 ======

  /**
   * 生成唯一ID
   */
  function generateUniqueId(): number {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    return timestamp * 1000 + random
  }

  /**
   * 计算新卡片位置
   */
  function calculateNewCardPosition(width: number, height: number): { x: number; y: number } {
    const colNum = 12 // 默认12列
    const occupiedPositions = new Set<string>()

    // 记录已占用位置
    state.layout.forEach(item => {
      for (let x = item.x; x < item.x + item.w; x++) {
        for (let y = item.y; y < item.y + item.h; y++) {
          occupiedPositions.add(`${x},${y}`)
        }
      }
    })

    // 查找可用位置
    for (let y = 0; y < 100; y++) {
      for (let x = 0; x <= colNum - width; x++) {
        let canPlace = true

        // 检查是否可以放置
        for (let dx = 0; dx < width && canPlace; dx++) {
          for (let dy = 0; dy < height && canPlace; dy++) {
            if (occupiedPositions.has(`${x + dx},${y + dy}`)) {
              canPlace = false
            }
          }
        }

        if (canPlace) {
          return { x, y }
        }
      }
    }

    return { x: 0, y: 0 } // 默认位置
  }

  /**
   * 获取设备选项
   */
  async function loadDeviceOptions(): Promise<void> {
    try {
      const { data, error } = await deviceTemplateSelect()
      if (!error && data) {
        state.deviceOptions = data
      }
    } catch (error) {
      logger.warn('获取设备选项失败:', error)
    }
  }

  // ====== 自动保存功能 ======

  /**
   * 启动自动保存
   */
  function startAutoSave(): void {
    if (!enableAutoSave || autoSaveTimer) return

    autoSaveTimer = setInterval(async () => {
      if (state.hasUnsavedChanges && !state.isSaving) {
        logger.info('执行自动保存...')
        await savePanel()
      }
    }, autoSaveInterval * 1000)

    logger.info(`自动保存已启动，间隔: ${autoSaveInterval}秒`)
  }

  /**
   * 停止自动保存
   */
  function stopAutoSave(): void {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
      logger.info('自动保存已停止')
    }
  }

  // ====== WebSocket 实时更新 ======

  /**
   * 启动 WebSocket 连接
   */
  function startWebSocket(): void {
    if (!enableWebSocket) return

    try {
      const { connectToServer } = useWebsocketUtil()
      webSocketConnection = connectToServer()

      // 监听面板更新事件
      webSocketConnection?.on('panel-updated', (data: any) => {
        if (data.panelId === panelId) {
          logger.info('收到面板更新通知')
          // 可以选择是否自动刷新
          dialog.info({
            title: '面板已更新',
            content: '检测到面板被其他用户更新，是否重新加载？',
            positiveText: '重新加载',
            negativeText: '忽略',
            onPositiveClick: () => {
              loadPanel()
            }
          })
        }
      })

      logger.info('WebSocket 连接已建立')
    } catch (error) {
      logger.warn('WebSocket 连接失败:', error)
    }
  }

  /**
   * 关闭 WebSocket 连接
   */
  function stopWebSocket(): void {
    if (webSocketConnection) {
      webSocketConnection.disconnect()
      webSocketConnection = null
      logger.info('WebSocket 连接已关闭')
    }
  }

  // ====== 计算属性 ======

  const canUndo = computed(() => currentHistoryIndex.value >= 0)
  const canRedo = computed(() => currentHistoryIndex.value < editHistory.value.length - 1)
  const panelTitle = computed(() => state.panelData?.name || '未命名面板')
  const layoutStats = computed(() => ({
    totalCards: state.layout.length,
    hasUnsavedChanges: state.hasUnsavedChanges,
    currentTheme: state.theme
  }))

  // ====== 生命周期管理 ======

  /**
   * 初始化面板管理器
   */
  async function initialize(): Promise<void> {
    logger.info(`初始化面板管理器: ${panelId}`)

    // 加载面板数据
    await loadPanel()

    // 加载设备选项
    await loadDeviceOptions()

    // 启动自动保存
    startAutoSave()

    // 启动 WebSocket
    startWebSocket()

    // 监听变更
    watch(() => state.layout, checkUnsavedChanges, { deep: true })
    watch(() => state.theme, checkUnsavedChanges)
  }

  /**
   * 清理资源
   */
  function dispose(): void {
    logger.info('清理面板管理器资源')

    stopAutoSave()
    stopWebSocket()

    // 清理状态
    editHistory.value = []
    currentHistoryIndex.value = -1
    state.layout = []
    state.panelData = null
  }

  // ====== 页面离开确认 ======

  /**
   * 设置页面离开确认
   */
  function setupBeforeUnload(): void {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (state.hasUnsavedChanges) {
        event.preventDefault()
        event.returnValue = '您有未保存的更改，确定要离开吗？'
        return event.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }

  // ====== 返回管理器接口 ======

  return {
    // 状态
    state: readonly(state),
    editHistory: readonly(editHistory),
    currentHistoryIndex: readonly(currentHistoryIndex),
    fullscreenContainer,

    // 计算属性
    canUndo,
    canRedo,
    panelTitle,
    layoutStats,
    isFullscreen,

    // 面板管理
    loadPanel,
    savePanel,
    checkUnsavedChanges,

    // 编辑功能
    addCard,
    removeCard,
    updateCardLayout,
    switchTheme,

    // 历史管理
    undo,
    redo,

    // UI 功能
    toggleFullscreen,

    // 生命周期
    initialize,
    dispose,
    setupBeforeUnload,

    // 工具方法
    generateUniqueId,
    calculateNewCardPosition,
    loadDeviceOptions
  }
}

export default usePanelManager
