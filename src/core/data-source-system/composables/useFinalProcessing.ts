import { ref, computed, watch } from 'vue'
import { debounce } from 'lodash-es'
import type { RawDataItem, FinalProcessingType } from '../types'
// import { defaultScriptEngine } from '@/utils/script-engine' // 假设有一个脚本引擎

/**
 * @description 管理最终数据处理逻辑
 * @param dataValues 响应式的核心数据状态
 * @param activeDataSourceKey 当前激活的数据源 key
 * @param rawDataList 当前数据源的原始数据列表
 * @param triggerConfigUpdate 触发配置更新的回调函数
 */
export function useFinalProcessing(
  dataValues: any,
  activeDataSourceKey: string,
  rawDataList: any,
  triggerConfigUpdate: () => void
) {
  // 当前数据源的最终处理类型
  const finalProcessingType = computed<FinalProcessingType>({
    get: () => dataValues[activeDataSourceKey]?.finalProcessingType || 'custom-script',
    set: value => {
      if (dataValues[activeDataSourceKey]) {
        dataValues[activeDataSourceKey].finalProcessingType = value
        triggerConfigUpdate() // 类型变化时立即更新
      }
    }
  })

  // 当前数据源的最终处理脚本
  const finalProcessingScript = computed<string>({
    get: () => dataValues[activeDataSourceKey]?.finalProcessingScript || '',
    set: value => {
      if (dataValues[activeDataSourceKey]) {
        dataValues[activeDataSourceKey].finalProcessingScript = value
        debouncedUpdate() // 脚本变化时防抖更新
      }
    }
  })

  // 当前选择用于预览或处理的数据项索引
  const selectedDataItemIndex = computed<number>({
    get: () => dataValues[activeDataSourceKey]?.selectedDataItemIndex || 0,
    set: value => {
      if (dataValues[activeDataSourceKey]) {
        dataValues[activeDataSourceKey].selectedDataItemIndex = value
        triggerConfigUpdate()
      }
    }
  })

  // 最终数据的预览
  const finalDataPreview = ref<any>(null)

  /**
   * @description 更新最终数据，这是一个防抖函数，避免在用户输入时频繁触发
   */
  const updateFinalData = async () => {
    // 在这里实现数据处理和预览更新的逻辑
    // 1. 获取所有原始数据的已处理结果 (processedDataList)
    // 2. 根据 finalProcessingType 和 finalProcessingScript 计算最终数据
    // 3. 更新 finalDataPreview.value
    // 4. 更新 dataValues[activeDataSourceKey].currentData
    // 5. 触发配置更新
    triggerConfigUpdate()
  }

  const debouncedUpdate = debounce(updateFinalData, 500)

  // 监听原始数据列表或处理脚本的变化，以自动更新最终数据
  watch(
    [rawDataList, finalProcessingScript],
    () => {
      debouncedUpdate()
    },
    { deep: true }
  )

  return {
    finalProcessingType,
    finalProcessingScript,
    selectedDataItemIndex,
    finalDataPreview,
    updateFinalData
  }
}
