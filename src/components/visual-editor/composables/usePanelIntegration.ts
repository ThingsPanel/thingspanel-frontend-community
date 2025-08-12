/**
 * Visual Editor 面板集成 Composable
 * 提供面板保存/加载逻辑与 Visual Editor 的无缝集成
 */

import { ref, computed, watch, nextTick } from 'vue'
import { useMessage } from 'naive-ui'
import type { LayoutContainer, LayoutItem } from '../types/layout'
import type { ICardView, PanelConfig } from '@/card2.1/core/types/legacy'
import { usePanelConfigAdapter } from '@/card2.1/core/adapters/PanelConfigAdapter'
import { useThemeIntegration } from '../theme/ThemeIntegration'
import usePanelManager from './usePanelManager'
import { createLogger } from '@/utils/logger'

const logger = createLogger('PanelIntegration')

// ====== 集成选项 ======

export interface PanelIntegrationOptions {
  // 面板ID
  panelId: string

  // 自动同步选项
  autoSync?: boolean
  syncInterval?: number // 毫秒

  // 转换选项
  preserveLegacyData?: boolean
  enableBidirectionalSync?: boolean

  // 错误处理
  retryCount?: number
  retryDelay?: number // 毫秒
}

// ====== 同步状态 ======

export interface SyncState {
  isLoading: boolean
  isSaving: boolean
  isInSync: boolean
  lastSyncTime: Date | null
  error: string | null
  pendingChanges: boolean
}

// ====== 数据转换接口 ======

export interface DataConverter {
  // Panel -> Visual Editor
  panelToEditor(panelConfig: PanelConfig): LayoutContainer
  cardViewsToLayoutItems(cardViews: ICardView[]): LayoutItem[]

  // Visual Editor -> Panel
  editorToPanel(container: LayoutContainer): PanelConfig
  layoutItemsToCardViews(layoutItems: LayoutItem[]): ICardView[]

  // 验证
  validatePanelConfig(config: PanelConfig): { valid: boolean; errors: string[] }
  validateLayoutContainer(container: LayoutContainer): { valid: boolean; errors: string[] }
}

// ====== 主要 Composable ======

export function usePanelIntegration(options: PanelIntegrationOptions) {
  const {
    panelId,
    autoSync = true,
    syncInterval = 30000, // 30秒
    preserveLegacyData = true,
    enableBidirectionalSync = true,
    retryCount = 3,
    retryDelay = 1000
  } = options

  // ====== 外部依赖 ======
  const message = useMessage()
  const adapter = usePanelConfigAdapter()
  const themeIntegration = useThemeIntegration()
  const panelManager = usePanelManager({ panelId })

  // ====== 响应式状态 ======
  const syncState = ref<SyncState>({
    isLoading: false,
    isSaving: false,
    isInSync: true,
    lastSyncTime: null,
    error: null,
    pendingChanges: false
  })

  // Visual Editor 数据
  const editorContainer = ref<LayoutContainer | null>(null)
  const editorItems = ref<LayoutItem[]>([])

  // 同步定时器
  let syncTimer: NodeJS.Timeout | null = null

  // ====== 数据转换器 ======

  const dataConverter: DataConverter = {
    // Panel 配置转换为 Visual Editor 容器
    panelToEditor(panelConfig: PanelConfig): LayoutContainer {
      return {
        id: panelConfig.id,
        name: panelConfig.name,
        items: this.cardViewsToLayoutItems(panelConfig.layout),
        gridConfig: {
          cols: 12,
          rowHeight: 60,
          margin: [10, 10],
          containerPadding: [20, 20]
        },
        size: {
          width: 1200,
          height: 800
        },
        theme: panelConfig.theme,
        interaction: {
          allowDrop: true,
          allowResize: true,
          allowDrag: true,
          showGrid: true,
          snapToGrid: true
        },
        meta: {
          version: '2.1.0',
          description: `从面板 ${panelConfig.name} 转换`,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    },

    // CardView 数组转换为 LayoutItem 数组
    cardViewsToLayoutItems(cardViews: ICardView[]): LayoutItem[] {
      return cardViews.map(cardView => {
        const layoutItem: LayoutItem = {
          id: String(cardView.i),
          type: cardView.data?.cardId || 'unknown',
          position: {
            x: cardView.x * 100, // 转换为像素坐标
            y: cardView.y * 60 // 基于行高计算
          },
          size: {
            width: cardView.w * 100,
            height: cardView.h * 60
          },
          constraints: {
            minSize: {
              width: (cardView.minW || 2) * 100,
              height: (cardView.minH || 2) * 60
            },
            resizable: true,
            draggable: true,
            snapToGrid: true
          },
          config: cardView.data?.config || {},
          dataSource: cardView.data?.dataSource,
          style: {
            backgroundColor: 'var(--theme-color-surface)',
            borderColor: 'var(--theme-color-border)',
            borderWidth: 1,
            borderRadius: 8,
            opacity: 1
          },
          meta: {
            name: cardView.data?.title || '未命名组件',
            description: `从卡片 ${cardView.data?.cardId} 转换`,
            category: cardView.data?.type || 'unknown',
            createdAt: new Date(),
            updatedAt: new Date()
          },
          legacy: {
            cardView,
            cardData: cardView.data
          }
        }

        return layoutItem
      })
    },

    // Visual Editor 容器转换为 Panel 配置
    editorToPanel(container: LayoutContainer): PanelConfig {
      return {
        id: container.id,
        name: container.name,
        layout: this.layoutItemsToCardViews(container.items),
        theme: container.theme || 'default'
      }
    },

    // LayoutItem 数组转换为 CardView 数组
    layoutItemsToCardViews(layoutItems: LayoutItem[]): ICardView[] {
      return layoutItems.map(item => {
        // 如果有 legacy 数据，优先使用
        if (item.legacy?.cardView) {
          const cardView = { ...item.legacy.cardView }

          // 更新位置和尺寸
          cardView.x = Math.round(item.position.x / 100)
          cardView.y = Math.round(item.position.y / 60)
          cardView.w = Math.round(item.size.width / 100)
          cardView.h = Math.round(item.size.height / 60)

          // 更新配置
          if (cardView.data) {
            cardView.data.config = { ...cardView.data.config, ...item.config }
          }

          return cardView
        }

        // 创建新的 CardView
        const cardView: ICardView = {
          i: parseInt(item.id) || Date.now(),
          x: Math.round(item.position.x / 100),
          y: Math.round(item.position.y / 60),
          w: Math.round(item.size.width / 100),
          h: Math.round(item.size.height / 60),
          minW: Math.round((item.constraints.minSize?.width || 200) / 100),
          minH: Math.round((item.constraints.minSize?.height || 120) / 60),
          data: {
            cardId: item.type,
            config: item.config || {},
            title: item.meta?.name || '未命名组件',
            dataSource: item.dataSource
          }
        }

        return cardView
      })
    },

    // 验证 Panel 配置
    validatePanelConfig(config: PanelConfig): { valid: boolean; errors: string[] } {
      const errors: string[] = []

      if (!config.id) errors.push('面板ID不能为空')
      if (!config.name) errors.push('面板名称不能为空')
      if (!Array.isArray(config.layout)) errors.push('布局数据必须是数组')
      if (!config.theme) errors.push('主题不能为空')

      // 验证布局项
      config.layout.forEach((item, index) => {
        if (typeof item.i === 'undefined') errors.push(`布局项 ${index} 缺少ID`)
        if (typeof item.x !== 'number') errors.push(`布局项 ${index} X坐标无效`)
        if (typeof item.y !== 'number') errors.push(`布局项 ${index} Y坐标无效`)
        if (typeof item.w !== 'number' || item.w <= 0) errors.push(`布局项 ${index} 宽度无效`)
        if (typeof item.h !== 'number' || item.h <= 0) errors.push(`布局项 ${index} 高度无效`)
      })

      return { valid: errors.length === 0, errors }
    },

    // 验证 Layout 容器
    validateLayoutContainer(container: LayoutContainer): { valid: boolean; errors: string[] } {
      const errors: string[] = []

      if (!container.id) errors.push('容器ID不能为空')
      if (!container.name) errors.push('容器名称不能为空')
      if (!Array.isArray(container.items)) errors.push('布局项必须是数组')
      if (!container.gridConfig) errors.push('网格配置不能为空')

      // 验证布局项
      container.items.forEach((item, index) => {
        if (!item.id) errors.push(`布局项 ${index} 缺少ID`)
        if (!item.type) errors.push(`布局项 ${index} 缺少类型`)
        if (!item.position) errors.push(`布局项 ${index} 缺少位置信息`)
        if (!item.size) errors.push(`布局项 ${index} 缺少尺寸信息`)
        if (!item.constraints) errors.push(`布局项 ${index} 缺少约束信息`)
      })

      return { valid: errors.length === 0, errors }
    }
  }

  // ====== 同步功能 ======

  /**
   * 从面板系统加载数据到 Visual Editor
   */
  async function loadFromPanel(): Promise<boolean> {
    try {
      syncState.value.isLoading = true
      syncState.value.error = null

      // 使用 PanelManager 加载数据
      const success = await panelManager.loadPanel()
      if (!success) {
        throw new Error('面板数据加载失败')
      }

      // 获取面板数据
      const panelData = panelManager.state.panelData
      const layout = panelManager.state.layout
      const theme = panelManager.state.theme

      if (!panelData) {
        throw new Error('面板数据为空')
      }

      // 转换数据格式
      const panelConfig: PanelConfig = {
        id: panelData.id,
        name: panelData.name || '未命名面板',
        layout,
        theme
      }

      // 验证数据
      const validation = dataConverter.validatePanelConfig(panelConfig)
      if (!validation.valid) {
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`)
      }

      // 转换为 Visual Editor 格式
      const container = dataConverter.panelToEditor(panelConfig)
      editorContainer.value = container
      editorItems.value = container.items

      // 应用主题
      themeIntegration.switchToTheme(theme)
      themeIntegration.applyThemeToContainer(container)
      themeIntegration.applyThemeToItems(container.items)

      syncState.value.isInSync = true
      syncState.value.lastSyncTime = new Date()
      syncState.value.pendingChanges = false

      logger.info('从面板系统加载数据成功')
      return true
    } catch (error: any) {
      syncState.value.error = error.message || '加载失败'
      logger.error('从面板系统加载数据失败:', error)
      message.error(error.message || '加载失败')
      return false
    } finally {
      syncState.value.isLoading = false
    }
  }

  /**
   * 从 Visual Editor 保存数据到面板系统
   */
  async function saveToPanel(): Promise<boolean> {
    if (!editorContainer.value) {
      message.warning('没有可保存的数据')
      return false
    }

    try {
      syncState.value.isSaving = true
      syncState.value.error = null

      // 验证容器数据
      const validation = dataConverter.validateLayoutContainer(editorContainer.value)
      if (!validation.valid) {
        throw new Error(`数据验证失败: ${validation.errors.join(', ')}`)
      }

      // 转换为面板格式
      const panelConfig = dataConverter.editorToPanel(editorContainer.value)

      // 使用适配器保存
      const success = await adapter.savePanelConfig(panelConfig)
      if (!success) {
        throw new Error('保存到面板系统失败')
      }

      syncState.value.isInSync = true
      syncState.value.lastSyncTime = new Date()
      syncState.value.pendingChanges = false

      logger.info('保存到面板系统成功')
      message.success('保存成功')
      return true
    } catch (error: any) {
      syncState.value.error = error.message || '保存失败'
      logger.error('保存到面板系统失败:', error)
      message.error(error.message || '保存失败')
      return false
    } finally {
      syncState.value.isSaving = false
    }
  }

  /**
   * 双向同步数据
   */
  async function syncData(): Promise<boolean> {
    if (syncState.value.pendingChanges) {
      // 有待保存的更改，先保存
      return await saveToPanel()
    } else {
      // 没有更改，加载最新数据
      return await loadFromPanel()
    }
  }

  /**
   * 重试操作
   */
  async function retryOperation(operation: () => Promise<boolean>, maxRetries: number = retryCount): Promise<boolean> {
    for (let i = 0; i <= maxRetries; i++) {
      const success = await operation()
      if (success) return true

      if (i < maxRetries) {
        logger.info(`操作失败，${retryDelay}ms 后重试 (${i + 1}/${maxRetries})`)
        await new Promise(resolve => setTimeout(resolve, retryDelay))
      }
    }

    logger.error(`操作重试 ${maxRetries} 次后仍然失败`)
    return false
  }

  // ====== 自动同步 ======

  /**
   * 启动自动同步
   */
  function startAutoSync(): void {
    if (!autoSync || syncTimer) return

    syncTimer = setInterval(async () => {
      if (!syncState.value.isLoading && !syncState.value.isSaving) {
        await syncData()
      }
    }, syncInterval)

    logger.info(`自动同步已启动，间隔: ${syncInterval}ms`)
  }

  /**
   * 停止自动同步
   */
  function stopAutoSync(): void {
    if (syncTimer) {
      clearInterval(syncTimer)
      syncTimer = null
      logger.info('自动同步已停止')
    }
  }

  // ====== 变更监听 ======

  /**
   * 监听 Visual Editor 数据变更
   */
  function watchEditorChanges(): void {
    // 监听容器变更
    watch(
      () => editorContainer.value,
      () => {
        syncState.value.pendingChanges = true
        syncState.value.isInSync = false
      },
      { deep: true }
    )

    // 监听布局项变更
    watch(
      () => editorItems.value,
      () => {
        if (editorContainer.value) {
          editorContainer.value.items = [...editorItems.value]
          syncState.value.pendingChanges = true
          syncState.value.isInSync = false
        }
      },
      { deep: true }
    )
  }

  // ====== Visual Editor 操作接口 ======

  /**
   * 添加布局项
   */
  function addLayoutItem(item: LayoutItem): void {
    editorItems.value.push(item)
    logger.info(`添加布局项: ${item.meta?.name || item.id}`)
  }

  /**
   * 移除布局项
   */
  function removeLayoutItem(itemId: string): void {
    const index = editorItems.value.findIndex(item => item.id === itemId)
    if (index !== -1) {
      const removed = editorItems.value.splice(index, 1)[0]
      logger.info(`移除布局项: ${removed.meta?.name || removed.id}`)
    }
  }

  /**
   * 更新布局项
   */
  function updateLayoutItem(itemId: string, updates: Partial<LayoutItem>): void {
    const index = editorItems.value.findIndex(item => item.id === itemId)
    if (index !== -1) {
      Object.assign(editorItems.value[index], updates)
      logger.info(`更新布局项: ${itemId}`)
    }
  }

  /**
   * 获取布局项
   */
  function getLayoutItem(itemId: string): LayoutItem | undefined {
    return editorItems.value.find(item => item.id === itemId)
  }

  // ====== 计算属性 ======

  const canSave = computed(
    () => !syncState.value.isSaving && syncState.value.pendingChanges && editorContainer.value !== null
  )

  const canLoad = computed(() => !syncState.value.isLoading && !syncState.value.isSaving)

  const syncStatus = computed(() => {
    if (syncState.value.isLoading) return 'loading'
    if (syncState.value.isSaving) return 'saving'
    if (syncState.value.error) return 'error'
    if (syncState.value.pendingChanges) return 'pending'
    if (syncState.value.isInSync) return 'synced'
    return 'unknown'
  })

  // ====== 生命周期管理 ======

  /**
   * 初始化集成
   */
  async function initialize(): Promise<void> {
    logger.info(`初始化面板集成: ${panelId}`)

    // 初始化 PanelManager
    await panelManager.initialize()

    // 加载初始数据
    await loadFromPanel()

    // 启动变更监听
    watchEditorChanges()

    // 启动自动同步
    startAutoSync()
  }

  /**
   * 清理资源
   */
  function dispose(): void {
    logger.info('清理面板集成资源')

    stopAutoSync()
    panelManager.dispose()

    // 清理状态
    editorContainer.value = null
    editorItems.value = []
    syncState.value = {
      isLoading: false,
      isSaving: false,
      isInSync: true,
      lastSyncTime: null,
      error: null,
      pendingChanges: false
    }
  }

  // ====== 返回集成接口 ======

  return {
    // 状态
    syncState: readonly(syncState),
    editorContainer: readonly(editorContainer),
    editorItems: readonly(editorItems),

    // 计算属性
    canSave,
    canLoad,
    syncStatus,

    // 同步功能
    loadFromPanel,
    saveToPanel,
    syncData,
    retryOperation,

    // Visual Editor 操作
    addLayoutItem,
    removeLayoutItem,
    updateLayoutItem,
    getLayoutItem,

    // 自动同步控制
    startAutoSync,
    stopAutoSync,

    // 数据转换器
    dataConverter,

    // 生命周期
    initialize,
    dispose,

    // PanelManager 访问
    panelManager
  }
}

export default usePanelIntegration
