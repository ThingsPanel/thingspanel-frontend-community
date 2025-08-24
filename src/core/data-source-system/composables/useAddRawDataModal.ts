import { ref, reactive, computed } from 'vue'
import type { RawDataItem, RawDataItemType } from '../types'
import { cloneDeep } from 'lodash-es'

/**
 * @description 管理“添加/编辑原始数据”模态框的状态和逻辑
 * @param hooks 用于与父组件的 useRawData hook 交互
 */
export function useAddRawDataModal(hooks: {
  generateConfigFromType: (type: RawDataItemType) => { name: string; config: any }
  addRawData: (item: Omit<RawDataItem, 'id'>) => void
  saveEdit: (item: RawDataItem) => void
  resetEditMode: () => void
}) {
  // 模态框的显示状态
  const isModalVisible = ref(false)
  // 当前正在编辑或添加的原始数据项
  const currentRawData = ref<Partial<RawDataItem>>({})
  // 模态框的标题，根据是添加还是编辑动态变化
  const modalTitle = computed(() => ((currentRawData.value as RawDataItem).id ? '编辑原始数据' : '添加原始数据'))

  /**
   * @description 打开模态框以添加新的原始数据项
   * @param type 要添加的数据项类型
   */
  const openModalForAdd = (type: RawDataItemType) => {
    const { name, config } = hooks.generateConfigFromType(type)
    currentRawData.value = {
      name,
      type,
      config,
      // 初始化其他可能需要的字段
      filterPath: '$',
      processScript: 'return data;'
    }
    isModalVisible.value = true
  }

  /**
   * @description 打开模态框以编辑现有的原始数据项
   * @param item 要编辑的数据项
   */
  const openModalForEdit = (item: RawDataItem) => {
    currentRawData.value = cloneDeep(item)
    isModalVisible.value = true
  }

  /**
   * @description 处理模态框的确认操作（保存或添加）
   */
  const handleConfirm = () => {
    if (!currentRawData.value.name || !currentRawData.value.type) {
      // 在这里可以添加表单验证逻辑，例如使用消息提示组件
      console.error('Data item name and type are required.')
      return
    }

    if ((currentRawData.value as RawDataItem).id) {
      // 编辑模式
      hooks.saveEdit(currentRawData.value as RawDataItem)
    } else {
      // 添加模式
      hooks.addRawData(currentRawData.value as Omit<RawDataItem, 'id'>)
    }
    closeModal()
  }

  /**
   * @description 关闭模态框并重置状态
   */
  const closeModal = () => {
    isModalVisible.value = false
    currentRawData.value = {}
    hooks.resetEditMode() // 确保父组件中的编辑状态也被重置
  }

  return {
    isModalVisible,
    currentRawData,
    modalTitle,
    openModalForAdd,
    openModalForEdit,
    handleConfirm,
    closeModal
  }
}
