/**
 * 弹窗管理 Composable
 * 统一管理数据源配置过程中的各种弹窗状态、数据传递和生命周期
 */

import { ref, reactive, computed, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import type { RawDataItem, SystemApiItem, ModalType, ModalConfig } from '../types'

// 弹窗状态接口
export interface ModalState {
  /** 弹窗类型 */
  type: ModalType | null
  /** 是否显示 */
  visible: boolean
  /** 弹窗标题 */
  title: string
  /** 弹窗大小 */
  size: 'small' | 'medium' | 'large' | 'huge'
  /** 是否可关闭 */
  closable: boolean
  /** 是否显示遮罩 */
  maskClosable: boolean
  /** 加载状态 */
  loading: boolean
  /** 传递的数据 */
  data: any
  /** 回调函数 */
  callbacks: {
    onConfirm?: (data: any) => void | Promise<void>
    onCancel?: () => void
    onClose?: () => void
  }
}

// 弹窗配置选项
export interface UseModalManagementOptions {
  /** 默认弹窗大小 */
  defaultSize?: ModalState['size']
  /** 是否默认可关闭 */
  defaultClosable?: boolean
  /** 是否默认遮罩可关闭 */
  defaultMaskClosable?: boolean
  /** 最大同时打开的弹窗数 */
  maxConcurrentModals?: number
}

/**
 * 弹窗管理 Composable
 */
export function useModalManagement(options: UseModalManagementOptions = {}) {
  const { t } = useI18n()

  // 默认选项
  const {
    defaultSize = 'medium',
    defaultClosable = true,
    defaultMaskClosable = true,
    maxConcurrentModals = 3
  } = options

  // 弹窗状态管理
  const modalStates = reactive<Record<string, ModalState>>({})

  // 弹窗栈（用于管理多个弹窗的z-index）
  const modalStack = ref<string[]>([])

  // 全局加载状态
  const globalLoading = ref(false)

  // 计算属性
  const activeModals = computed(() => {
    return Object.entries(modalStates)
      .filter(([, state]) => state.visible)
      .map(([id, state]) => ({ id, ...state }))
  })

  const hasActiveModals = computed(() => {
    return activeModals.value.length > 0
  })

  const topModalId = computed(() => {
    return modalStack.value[modalStack.value.length - 1]
  })

  /**
   * 创建弹窗状态
   */
  const createModalState = (id: string, type: ModalType, config: Partial<ModalConfig> = {}): ModalState => {
    return {
      type,
      visible: false,
      title: config.title || getDefaultTitle(type),
      size: config.size || defaultSize,
      closable: config.closable ?? defaultClosable,
      maskClosable: config.maskClosable ?? defaultMaskClosable,
      loading: false,
      data: config.data || null,
      callbacks: {
        onConfirm: config.onConfirm,
        onCancel: config.onCancel,
        onClose: config.onClose
      }
    }
  }

  /**
   * 获取默认标题
   */
  const getDefaultTitle = (type: ModalType): string => {
    const titleMap: Record<ModalType, string> = {
      'add-raw-data': t('dataSource.modal.addRawData'),
      'edit-raw-data': t('dataSource.modal.editRawData'),
      'view-raw-data': t('dataSource.modal.viewRawData'),
      'delete-raw-data': t('dataSource.modal.deleteRawData'),
      'import-raw-data': t('dataSource.modal.importRawData'),
      'export-raw-data': t('dataSource.modal.exportRawData'),
      'system-api-list': t('dataSource.modal.systemApiList'),
      'data-preview': t('dataSource.modal.dataPreview'),
      'script-editor': t('dataSource.modal.scriptEditor'),
      'config-import': t('dataSource.modal.configImport'),
      'config-export': t('dataSource.modal.configExport'),
      'validation-result': t('dataSource.modal.validationResult'),
      confirm: t('dataSource.modal.confirm')
    }
    return titleMap[type] || t('dataSource.modal.default')
  }

  /**
   * 打开弹窗
   */
  const openModal = async (id: string, type: ModalType, config: Partial<ModalConfig> = {}): Promise<void> => {
    // 检查是否超过最大弹窗数
    if (activeModals.value.length >= maxConcurrentModals) {
      window.$message?.warning(t('dataSource.modal.tooManyModals', { max: maxConcurrentModals }))
      return
    }

    // 创建或更新弹窗状态
    modalStates[id] = createModalState(id, type, config)

    await nextTick()

    // 显示弹窗
    modalStates[id].visible = true

    // 添加到弹窗栈
    if (!modalStack.value.includes(id)) {
      modalStack.value.push(id)
    }
  }

  /**
   * 关闭弹窗
   */
  const closeModal = async (id: string, result?: any): Promise<void> => {
    const modal = modalStates[id]
    if (!modal) return

    // 执行关闭回调
    if (modal.callbacks.onClose) {
      try {
        await modal.callbacks.onClose()
      } catch (error: any) {
        console.warn('Modal close callback error:', error)
      }
    }

    // 隐藏弹窗
    modal.visible = false

    // 从弹窗栈移除
    const stackIndex = modalStack.value.indexOf(id)
    if (stackIndex >= 0) {
      modalStack.value.splice(stackIndex, 1)
    }

    await nextTick()

    // 清理弹窗状态
    delete modalStates[id]
  }

  /**
   * 确认弹窗
   */
  const confirmModal = async (id: string, data?: any): Promise<void> => {
    const modal = modalStates[id]
    if (!modal) return

    modal.loading = true

    try {
      if (modal.callbacks.onConfirm) {
        await modal.callbacks.onConfirm(data)
      }
      await closeModal(id, data)
    } catch (error: any) {
      modal.loading = false
      window.$message?.error(t('dataSource.modal.confirmError', { error: error.message }))
      throw error
    }
  }

  /**
   * 取消弹窗
   */
  const cancelModal = async (id: string): Promise<void> => {
    const modal = modalStates[id]
    if (!modal) return

    try {
      if (modal.callbacks.onCancel) {
        await modal.callbacks.onCancel()
      }
      await closeModal(id)
    } catch (error: any) {
      console.warn('Modal cancel callback error:', error)
      await closeModal(id)
    }
  }

  /**
   * 更新弹窗数据
   */
  const updateModalData = (id: string, data: any) => {
    const modal = modalStates[id]
    if (modal) {
      modal.data = data
    }
  }

  /**
   * 设置弹窗加载状态
   */
  const setModalLoading = (id: string, loading: boolean) => {
    const modal = modalStates[id]
    if (modal) {
      modal.loading = loading
    }
  }

  /**
   * 关闭所有弹窗
   */
  const closeAllModals = async (): Promise<void> => {
    const activeModalIds = [...modalStack.value]

    for (const id of activeModalIds) {
      await closeModal(id)
    }
  }

  // 特定弹窗的便捷方法

  /**
   * 打开添加原始数据弹窗
   */
  const openAddRawDataModal = (onConfirm: (data: RawDataItem) => void | Promise<void>) => {
    return openModal('add-raw-data', 'add-raw-data', {
      title: t('dataSource.modal.addRawData'),
      size: 'large',
      onConfirm
    })
  }

  /**
   * 打开编辑原始数据弹窗
   */
  const openEditRawDataModal = (item: RawDataItem, onConfirm: (data: RawDataItem) => void | Promise<void>) => {
    return openModal('edit-raw-data', 'edit-raw-data', {
      title: t('dataSource.modal.editRawData'),
      size: 'large',
      data: item,
      onConfirm
    })
  }

  /**
   * 打开查看原始数据弹窗
   */
  const openViewRawDataModal = (item: RawDataItem) => {
    return openModal('view-raw-data', 'view-raw-data', {
      title: t('dataSource.modal.viewRawData'),
      size: 'large',
      data: item,
      closable: true
    })
  }

  /**
   * 打开删除确认弹窗
   */
  const openDeleteConfirmModal = (itemName: string, onConfirm: () => void | Promise<void>) => {
    return openModal('delete-confirm', 'confirm', {
      title: t('dataSource.modal.deleteConfirm'),
      size: 'small',
      data: {
        message: t('dataSource.modal.deleteConfirmMessage', { name: itemName }),
        type: 'warning'
      },
      onConfirm
    })
  }

  /**
   * 打开系统API列表弹窗
   */
  const openSystemApiListModal = (apis: SystemApiItem[], onConfirm: (api: SystemApiItem) => void | Promise<void>) => {
    return openModal('system-api-list', 'system-api-list', {
      title: t('dataSource.modal.systemApiList'),
      size: 'large',
      data: { apis },
      onConfirm
    })
  }

  /**
   * 打开数据预览弹窗
   */
  const openDataPreviewModal = (data: any, title?: string) => {
    return openModal('data-preview', 'data-preview', {
      title: title || t('dataSource.modal.dataPreview'),
      size: 'large',
      data: { previewData: data }
    })
  }

  /**
   * 打开脚本编辑器弹窗
   */
  const openScriptEditorModal = (
    script: string,
    language: 'javascript' | 'typescript',
    onConfirm: (script: string) => void | Promise<void>
  ) => {
    return openModal('script-editor', 'script-editor', {
      title: t('dataSource.modal.scriptEditor'),
      size: 'huge',
      data: { script, language },
      onConfirm
    })
  }

  /**
   * 打开配置导入弹窗
   */
  const openConfigImportModal = (onConfirm: (config: any) => void | Promise<void>) => {
    return openModal('config-import', 'config-import', {
      title: t('dataSource.modal.configImport'),
      size: 'large',
      onConfirm
    })
  }

  /**
   * 打开配置导出弹窗
   */
  const openConfigExportModal = (config: any) => {
    return openModal('config-export', 'config-export', {
      title: t('dataSource.modal.configExport'),
      size: 'large',
      data: { config }
    })
  }

  /**
   * 打开验证结果弹窗
   */
  const openValidationResultModal = (result: any, onConfirm?: () => void | Promise<void>) => {
    return openModal('validation-result', 'validation-result', {
      title: t('dataSource.modal.validationResult'),
      size: 'medium',
      data: { result },
      onConfirm
    })
  }

  /**
   * 获取弹窗状态
   */
  const getModalState = (id: string): ModalState | undefined => {
    return modalStates[id]
  }

  /**
   * 检查弹窗是否打开
   */
  const isModalOpen = (id: string): boolean => {
    return modalStates[id]?.visible ?? false
  }

  /**
   * 获取所有活动弹窗的ID
   */
  const getActiveModalIds = (): string[] => {
    return [...modalStack.value]
  }

  /**
   * 设置全局加载状态
   */
  const setGlobalLoading = (loading: boolean) => {
    globalLoading.value = loading
  }

  /**
   * 批量操作：关闭指定类型的所有弹窗
   */
  const closeModalsByType = async (type: ModalType): Promise<void> => {
    const modalsToClose = Object.entries(modalStates)
      .filter(([, state]) => state.type === type && state.visible)
      .map(([id]) => id)

    for (const id of modalsToClose) {
      await closeModal(id)
    }
  }

  /**
   * 创建弹窗链（按顺序打开弹窗）
   */
  const createModalChain = (
    chains: Array<{
      id: string
      type: ModalType
      config: Partial<ModalConfig>
    }>
  ) => {
    let currentIndex = 0

    const openNext = async () => {
      if (currentIndex >= chains.length) return

      const current = chains[currentIndex]
      currentIndex++

      await openModal(current.id, current.type, {
        ...current.config,
        onConfirm: async data => {
          if (current.config.onConfirm) {
            await current.config.onConfirm(data)
          }
          await closeModal(current.id)
          await openNext() // 打开下一个弹窗
        },
        onCancel: async () => {
          if (current.config.onCancel) {
            await current.config.onCancel()
          }
          await closeModal(current.id)
          // 取消时不继续链条
        }
      })
    }

    return { start: openNext }
  }

  /**
   * 弹窗间数据传递
   */
  const transferModalData = (fromId: string, toId: string, dataMapper?: (data: any) => any) => {
    const fromModal = modalStates[fromId]
    const toModal = modalStates[toId]

    if (fromModal && toModal) {
      const transferData = dataMapper ? dataMapper(fromModal.data) : fromModal.data
      toModal.data = transferData
    }
  }

  /**
   * 弹窗状态持久化（可选）
   */
  const saveModalState = (id: string) => {
    const modal = modalStates[id]
    if (modal) {
      try {
        localStorage.setItem(
          `modal_${id}`,
          JSON.stringify({
            type: modal.type,
            title: modal.title,
            size: modal.size,
            data: modal.data
          })
        )
      } catch (error) {
        console.warn('Failed to save modal state:', error)
      }
    }
  }

  /**
   * 恢复弹窗状态
   */
  const restoreModalState = (id: string): boolean => {
    try {
      const saved = localStorage.getItem(`modal_${id}`)
      if (saved) {
        const state = JSON.parse(saved)
        modalStates[id] = createModalState(id, state.type, state)
        return true
      }
    } catch (error) {
      console.warn('Failed to restore modal state:', error)
    }
    return false
  }

  /**
   * 获取弹窗使用统计
   */
  const getModalStats = () => {
    return {
      totalModals: Object.keys(modalStates).length,
      activeModals: activeModals.value.length,
      modalStack: [...modalStack.value],
      globalLoading: globalLoading.value
    }
  }

  /**
   * 重置所有弹窗状态
   */
  const resetAllModals = async () => {
    await closeAllModals()
    Object.keys(modalStates).forEach(id => {
      delete modalStates[id]
    })
    modalStack.value = []
    globalLoading.value = false
  }

  // 键盘快捷键处理
  const handleKeydown = (event: KeyboardEvent) => {
    // ESC键关闭顶层弹窗
    if (event.key === 'Escape' && topModalId.value) {
      const topModal = modalStates[topModalId.value]
      if (topModal && topModal.closable) {
        cancelModal(topModalId.value)
      }
    }
  }

  // 注册全局键盘事件
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
  }

  // 返回composable接口
  return {
    // 状态
    modalStates,
    modalStack,
    globalLoading,

    // 计算属性
    activeModals,
    hasActiveModals,
    topModalId,

    // 基础弹窗操作
    openModal,
    closeModal,
    confirmModal,
    cancelModal,

    // 弹窗数据管理
    updateModalData,
    setModalLoading,
    transferModalData,

    // 批量操作
    closeAllModals,
    closeModalsByType,
    resetAllModals,

    // 特定弹窗快捷方法
    openAddRawDataModal,
    openEditRawDataModal,
    openViewRawDataModal,
    openDeleteConfirmModal,
    openSystemApiListModal,
    openDataPreviewModal,
    openScriptEditorModal,
    openConfigImportModal,
    openConfigExportModal,
    openValidationResultModal,

    // 高级功能
    createModalChain,

    // 状态查询
    getModalState,
    isModalOpen,
    getActiveModalIds,
    getModalStats,

    // 全局状态
    setGlobalLoading,

    // 持久化
    saveModalState,
    restoreModalState
  }
}
