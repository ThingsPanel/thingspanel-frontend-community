import { ref, reactive, computed, type Ref } from 'vue'
import type { RawDataItem, RawDataItemType, DataSourceValue } from '../types'
import { generateUUID } from '@/utils/common/tool'
import { cloneDeep } from 'lodash-es'

/**
 * @description 管理原始数据项 (Raw Data) 的增删改查逻辑
 * @param dataValues 响应式的核心数据状态
 * @param activeDataSourceKey 当前激活的数据源 key (响应式引用)
 * @param triggerConfigUpdate 触发配置更新的回调函数
 */
export function useRawData(
  dataValues: Record<string, DataSourceValue>,
  activeDataSourceKey: Ref<string>,
  triggerConfigUpdate: () => void
) {
  // 当前激活数据源的原始数据列表
  const rawDataList = computed(() => dataValues[activeDataSourceKey.value]?.rawDataList || [])

  // 编辑模式相关状态
  const isEditMode = ref(false)
  const editingItemId = ref<string | null>(null)

  /**
   * @description 生成唯一的原始数据项名称
   * @param baseName 基础名称，如 'json-data'
   * @returns 唯一的名称，如 'json-data-2'
   */
  const generateUniqueName = (baseName: string): string => {
    let count = 1
    let newName = `${baseName}-${count}`
    while (rawDataList.value.some((item: RawDataItem) => item.name === newName)) {
      count++
      newName = `${baseName}-${count}`
    }
    return newName
  }

  /**
   * @description 根据类型生成默认的原始数据项配置
   * @param type 原始数据项类型
   * @returns 包含名称和配置的对象
   */
  const generateConfigFromType = (type: RawDataItemType) => {
    const name = generateUniqueName(`${type.toLowerCase()}-data`)
    let config = {}
    switch (type) {
      case 'JSON':
        config = { content: '{ "key": "value" }' }
        break
      case 'HTTP':
        config = {
          url: 'https://api.example.com/data',
          method: 'GET',
          headers: [],
          params: [],
          bodyType: 'none',
          body: null
        }
        break
      case 'WebSocket':
        config = { url: 'wss://echo.websocket.org' }
        break
    }
    return { name, config }
  }

  /**
   * @description 添加一个新的原始数据项
   * @param item 待添加的原始数据项
   */
  const addRawData = (item: Omit<RawDataItem, 'id'>) => {
    const newItem: RawDataItem = {
      ...item,
      id: generateUUID()
    }
    dataValues[activeDataSourceKey.value].rawDataList.push(newItem)
    triggerConfigUpdate()
  }

  /**
   * @description 删除一个原始数据项
   * @param itemId 要删除的项的 ID
   */
  const deleteRawData = (itemId: string) => {
    const list = dataValues[activeDataSourceKey.value].rawDataList
    const index = list.findIndex((item: RawDataItem) => item.id === itemId)
    if (index !== -1) {
      list.splice(index, 1)
      triggerConfigUpdate()
    }
  }

  /**
   * @description 进入编辑模式
   * @param item 要编辑的项
   */
  const editRawData = (item: RawDataItem) => {
    isEditMode.value = true
    editingItemId.value = item.id
    // 返回一个克隆对象，防止直接修改原始状态
    return cloneDeep(item)
  }

  /**
   * @description 保存编辑后的数据项
   * @param updatedItem 更新后的项
   */
  const saveEdit = (updatedItem: RawDataItem) => {
    const list = dataValues[activeDataSourceKey.value].rawDataList
    const index = list.findIndex((item: RawDataItem) => item.id === editingItemId.value)
    if (index !== -1) {
      list[index] = updatedItem
      resetEditMode()
      triggerConfigUpdate()
    }
  }

  /**
   * @description 重置/退出编辑模式
   */
  const resetEditMode = () => {
    isEditMode.value = false
    editingItemId.value = null
  }

  return {
    rawDataList,
    isEditMode,
    editingItemId,
    generateUniqueName,
    generateConfigFromType,
    addRawData,
    deleteRawData,
    editRawData,
    saveEdit,
    resetEditMode
  }
}
