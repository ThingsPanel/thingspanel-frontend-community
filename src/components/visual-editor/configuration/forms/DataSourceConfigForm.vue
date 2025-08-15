<template>
  <div class="data-source-config-form">
    <n-collapse :default-expanded-names="[props.dataSources[0]?.key]" accordion>
      <n-collapse-item v-for="dataSource in props.dataSources" :key="dataSource.key" :name="dataSource.key">
        <template #header>
          <div class="data-source-header">
            <span>{{ dataSource.name || dataSource.key }} ({{ getDataTypeText(dataSource) }})</span>
            <!-- 🔥 新增：示例数据提示图标 -->
            <n-tooltip placement="right" trigger="hover">
              <template #trigger>
                <n-icon size="16" class="example-data-icon">
                  <InformationCircleOutline />
                </n-icon>
              </template>
              <div class="example-data-tooltip">
                <div class="tooltip-title">示例数据格式:</div>
                <div class="example-code-container">
                  <pre class="example-code">{{ getExampleDataCode(dataSource) }}</pre>
                </div>
              </div>
            </n-tooltip>
          </div>
        </template>
        <!-- 数据源配置内容 -->
        <div class="data-source-content">
          <n-space vertical :size="16">
            <!-- 原始数据管理 -->
            <div>
              <n-text strong>原始数据管理:</n-text>
              <n-space vertical :size="8" style="margin-top: 8px">
                <!-- 添加原始数据按钮 - 弹窗形式 -->
                <n-button type="dashed" size="small" class="add-data-btn" @click="openAddRawDataModal(dataSource.key)">
                  <template #icon>
                    <n-icon size="14">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                      </svg>
                    </n-icon>
                  </template>
                  添加数据项
                </n-button>

                <!-- 原始数据列表 -->
                <div v-if="dataValues[dataSource.key]?.rawDataList?.length > 0" class="raw-data-list">
                  <n-text depth="3" style="font-size: 12px">
                    原始数据列表 ({{ dataValues[dataSource.key].rawDataList.length }} 项):
                  </n-text>
                  <n-space vertical :size="4" style="margin-top: 4px">
                    <div
                      v-for="rawDataItem in dataValues[dataSource.key].rawDataList"
                      :key="rawDataItem.id"
                      class="raw-data-item-compact"
                    >
                      <n-space align="center" justify="space-between">
                        <span class="raw-data-name">{{ rawDataItem.name }}</span>
                        <n-space :size="4">
                          <n-button
                            size="tiny"
                            quaternary
                            type="info"
                            class="compact-btn"
                            @click="viewRawDataDetail(dataSource.key, rawDataItem.id)"
                          >
                            查看
                          </n-button>
                          <n-button
                            size="tiny"
                            quaternary
                            type="error"
                            class="compact-btn"
                            @click="deleteRawData(dataSource.key, rawDataItem.id)"
                          >
                            删除
                          </n-button>
                        </n-space>
                      </n-space>
                    </div>
                  </n-space>
                </div>
                <n-text v-else depth="3" style="font-size: 12px">暂无原始数据项</n-text>
              </n-space>
            </div>

            <!-- 操作按钮 -->
            <n-space :size="8">
              <n-button @click="resetData(dataSource.key)">重置为默认</n-button>
              <n-button type="info" @click="showCurrentFinalData(dataSource.key)">查看当前数据源最终数据</n-button>
            </n-space>
          </n-space>
        </div>
      </n-collapse-item>
    </n-collapse>
  </div>

  <!-- 添加原始数据弹窗 - 经济简洁设计 -->
  <n-modal v-model:show="showAddRawDataModal" preset="dialog" title="添加数据项" style="width: 500px">
    <n-space vertical :size="16">
      <div>
        <n-text depth="2">为数据源 "{{ currentDataSourceKey }}" 添加新的数据项</n-text>
      </div>

      <!-- 数据项名称 -->
      <n-form-item label="数据项名称" size="small">
        <n-input
          v-model:value="newRawDataName"
          placeholder="请输入数据项名称，例如：用户数据、设备状态等"
          clearable
          @keyup.enter="addRawData"
        />
      </n-form-item>

      <!-- 未来可以在这里添加更多复杂配置 -->
      <n-alert type="info" size="small" :show-icon="false">
        <template #header>
          <span style="font-size: 12px">💡 提示</span>
        </template>
        数据项将以空对象初始化，您可以稍后通过其他方式配置具体内容。
      </n-alert>
    </n-space>

    <template #action>
      <n-space :size="8">
        <n-button size="small" @click="showAddRawDataModal = false">取消</n-button>
        <n-button size="small" type="primary" :disabled="!newRawDataName.trim()" @click="addRawData">确认添加</n-button>
      </n-space>
    </template>
  </n-modal>

  <!-- 查看最终数据弹窗 -->
  <n-modal v-model:show="showFinalDataModal" preset="dialog" title="当前数据源最终数据" style="width: 600px">
    <n-space vertical :size="12">
      <n-text>数据源 "{{ currentDataSourceKey }}" 的当前最终数据：</n-text>
      <n-code
        :code="currentFinalData"
        language="json"
        :show-line-numbers="true"
        style="max-height: 400px; overflow-y: auto"
      />
    </n-space>
    <template #action>
      <n-button @click="showFinalDataModal = false">关闭</n-button>
    </template>
  </n-modal>

  <!-- 查看原始数据详情弹窗 -->
  <n-modal v-model:show="showRawDataDetailModal" preset="dialog" title="原始数据详情" style="width: 600px">
    <n-space vertical :size="12">
      <n-text>数据项 "{{ currentRawDataName }}" 的详细内容：</n-text>
      <n-code
        :code="currentRawDataDetail"
        language="json"
        :show-line-numbers="true"
        style="max-height: 400px; overflow-y: auto"
      />
    </n-space>
    <template #action>
      <n-button @click="showRawDataDetailModal = false">关闭</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
/**
 * 数据源配置表单 - 极简重写版本
 * 目标：实现基础数据流闭环
 */

import { ref, reactive, watch, computed, onMounted } from 'vue'
import {
  NCollapse,
  NCollapseItem,
  NSpace,
  NText,
  NCode,
  NButton,
  NTooltip,
  NIcon,
  NModal,
  NCard,
  NInput,
  NList,
  NListItem,
  NThing,
  NTime,
  NFormItem,
  NAlert
} from 'naive-ui'
import { InformationCircleOutline } from '@vicons/ionicons5'
import { configurationManager } from '../ConfigurationManager'

interface DataSource {
  key: string
  name?: string
  description?: string
  fieldMappings?: Record<string, any>
  fieldsToMap?: Array<{ key: string; targetProperty: string }>
}

interface Props {
  selectedWidgetId?: string // 修改为匹配 ConfigurationPanel 传递的属性名
  dataSources: DataSource[]
}

interface Emits {
  (e: 'update', config: any): void
  (e: 'request-current-data', widgetId: string): void // 🔥 新增：请求当前数据
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 🔥 新增：原始数据项接口
interface RawDataItem {
  id: string
  name: string
  data: any
  createdAt: string
  isActive: boolean
}

// 🔥 修改：数据结构接口 - 原始数据项完全独立
interface DataSourceValue {
  currentData: any // 最终数据（完全独立）
  rawDataList: RawDataItem[] // 原始数据列表（完全独立，不影响最终数据）
}

// 数据存储 - 🔥 修改：支持原始数据列表
const dataValues = reactive<Record<string, DataSourceValue>>({})

// 🔥 弹窗状态管理
const showAddRawDataModal = ref(false)
const currentDataSourceKey = ref('')
const newRawDataName = ref('')

// 🔥 新增：查看最终数据相关状态
const showFinalDataModal = ref(false)
const currentFinalData = ref('')

// 🔥 新增：查看原始数据详情相关状态
const showRawDataDetailModal = ref(false)
const currentRawDataDetail = ref('')
const currentRawDataName = ref('')

/**
 * 获取数据类型文本描述
 */
const getDataTypeText = (dataSource: DataSource) => {
  // 根据 fieldsToMap 判断期望的数据类型
  if (dataSource.fieldsToMap && dataSource.fieldsToMap.length > 0) {
    const targetProperty = dataSource.fieldsToMap[0].targetProperty
    if (targetProperty.includes('array') || targetProperty.includes('Array')) {
      return '数组'
    }
    if (targetProperty.includes('object') || targetProperty.includes('Object')) {
      return '对象'
    }
  }

  // 根据 key 判断
  if (dataSource.key.toLowerCase().includes('array')) return '数组'
  if (dataSource.key.toLowerCase().includes('object')) return '对象'

  return '数据'
}

/**
 * 获取默认数据 - 🔥 修改：统一返回空对象
 */
const getDefaultData = (dataSourceKey: string) => {
  const dataSource = props.dataSources.find(ds => ds.key === dataSourceKey)
  if (!dataSource) return {}

  // 🔥 修复：优先从 fieldMappings 中获取 defaultValue
  if (dataSource.fieldMappings) {
    // 查找匹配的字段映射
    const targetFieldMapping = Object.values(dataSource.fieldMappings).find(
      (mapping: any) => mapping.targetField === dataSourceKey || mapping.type
    )

    if (targetFieldMapping && targetFieldMapping.defaultValue !== undefined) {
      console.log(`🔧 [DEBUG-Config] 使用组件定义的默认值 (${dataSourceKey}):`, targetFieldMapping.defaultValue)
      return targetFieldMapping.defaultValue
    }
  }

  // 🔥 修改：统一返回空对象，不再使用示例数据
  return {}
}

/**
 * 格式化显示数据 - 🔥 修改：显示当前激活的数据
 */
const getFormattedData = (dataSourceKey: string) => {
  const dataSourceValue = dataValues[dataSourceKey]

  // 🔥 调试：打印数据状态
  console.log(`🔧 [DEBUG-Config] getFormattedData(${dataSourceKey}):`, {
    dataSourceValue,
    hasCurrentData: !!dataSourceValue?.currentData,
    currentData: dataSourceValue?.currentData,
    dataValuesKeys: Object.keys(dataValues)
  })

  if (!dataSourceValue?.currentData) {
    console.warn(`⚠️ [DEBUG-Config] 数据源 ${dataSourceKey} 没有currentData，dataSourceValue:`, dataSourceValue)
    return '暂无数据'
  }

  try {
    return JSON.stringify(dataSourceValue.currentData, null, 2)
  } catch {
    return String(dataSourceValue.currentData)
  }
}

/**
 * 🔥 修改：获取示例数据代码用于悬停提示 - 统一返回空对象
 */
const getExampleDataCode = (dataSource: DataSource) => {
  // 从 fieldMappings 中获取 defaultValue
  if (dataSource.fieldMappings) {
    const firstMapping = Object.values(dataSource.fieldMappings)[0] as any
    if (firstMapping && firstMapping.defaultValue !== undefined) {
      try {
        return JSON.stringify(firstMapping.defaultValue, null, 2)
      } catch {
        return JSON.stringify(firstMapping.defaultValue)
      }
    }
  }

  // 🔥 修改：统一返回空对象格式
  return '{}'
}

/**
 * 重置数据为默认 - 🔥 修改：支持新的数据结构
 */
const resetData = (dataSourceKey: string) => {
  const defaultData = getDefaultData(dataSourceKey)

  // 🔥 修改：更新数据结构
  if (!dataValues[dataSourceKey]) {
    dataValues[dataSourceKey] = {
      currentData: defaultData,
      rawDataList: []
    }
  } else {
    dataValues[dataSourceKey].currentData = defaultData
  }

  console.log('🔧 [DEBUG-Config] 重置数据:', { dataSourceKey, data: dataValues[dataSourceKey] })
  sendUpdate()
}

// 上次发送的配置，用于防止重复发送
let lastSentConfig: string | null = null

/**
 * 发送配置更新 - 🔥 修改：原始数据项与最终数据完全分离
 */
const sendUpdate = () => {
  const dataSourceBindings: Record<string, any> = {}

  // 构建数据源绑定 - 🔥 修改：只发送最终数据，原始数据项仅保存不影响最终数据
  props.dataSources.forEach(dataSource => {
    const dataSourceValue = dataValues[dataSource.key]
    if (dataSourceValue?.currentData !== undefined) {
      dataSourceBindings[dataSource.key] = {
        rawData: JSON.stringify(dataSourceValue.currentData), // 只有最终数据会影响组件
        // 🔥 修改：原始数据项仅作为独立存储，不影响最终数据
        rawDataList: dataSourceValue.rawDataList || [],
        metadata: {
          hasRawDataList: dataSourceValue.rawDataList?.length > 0
          // 移除 activeRawDataId，因为原始数据项不影响最终数据
        }
      }
    }
  })

  const config = { dataSourceBindings }
  const configHash = JSON.stringify(config)

  // 🔥 关键修复：只在配置真正变化时才发送
  if (configHash !== lastSentConfig) {
    console.log('🔧 [DEBUG-Config] 检测到配置变化，发送更新:', {
      selectedWidgetId: props.selectedWidgetId,
      bindingKeys: Object.keys(dataSourceBindings),
      hasDataChanged: configHash !== lastSentConfig,
      config
    })

    lastSentConfig = configHash
    emit('update', config)
  } else {
    console.log('🔧 [DEBUG-Config] 配置未变化，跳过发送:', {
      selectedWidgetId: props.selectedWidgetId,
      bindingKeys: Object.keys(dataSourceBindings)
    })
  }
}

/**
 * 初始化数据 - 🔥 修复：优先使用当前运行时数据
 */
const initializeData = () => {
  console.log('🔧 [DEBUG-Config] 初始化数据源数据:', {
    selectedWidgetId: props.selectedWidgetId,
    dataSourcesCount: props.dataSources.length,
    dataSourceKeys: props.dataSources.map(ds => ds.key)
  })

  // 🔥 重置配置缓存，允许新的配置发送
  lastSentConfig = null

  // 🔥 核心修复：先请求当前运行时数据
  if (props.selectedWidgetId) {
    console.log('🔄 [DataSourceConfigForm] 请求当前运行时数据:', props.selectedWidgetId)
    emit('request-current-data', props.selectedWidgetId)

    // 给父组件一点时间响应，然后再尝试恢复
    setTimeout(() => {
      attemptDataRestore()
    }, 50)
  } else {
    // 没有选中组件，使用默认数据
    useDefaultData()
  }
}

/**
 * 尝试数据恢复（从存储的配置）
 */
const attemptDataRestore = () => {
  let hasRestoredData = false

  if (props.selectedWidgetId) {
    try {
      console.log('🔍 [DEBUG-Restore] 开始尝试恢复配置:', props.selectedWidgetId)
      const savedConfig = configurationManager.getConfiguration(props.selectedWidgetId)
      console.log('🔍 [DEBUG-Restore] ConfigurationManager返回的完整配置:', savedConfig)

      // 尝试从多种数据结构恢复
      let dataSourceBindings = null

      if (savedConfig?.dataSource?.config?.dataSourceBindings) {
        dataSourceBindings = savedConfig.dataSource.config.dataSourceBindings
        console.log('🔧 [DEBUG-Config] 从dataSource.config恢复数据:', dataSourceBindings)
      } else if (savedConfig?.dataSourceBindings) {
        dataSourceBindings = savedConfig.dataSourceBindings
        console.log('🔧 [DEBUG-Config] 从dataSourceBindings直接恢复数据:', dataSourceBindings)
      }

      if (dataSourceBindings && Object.keys(dataSourceBindings).length > 0) {
        // 恢复每个数据源的保存数据
        Object.entries(dataSourceBindings).forEach(([key, binding]: [string, any]) => {
          if (binding?.rawData) {
            try {
              // 🔥 修复：检查保存的数据结构格式
              const parsedRawData = JSON.parse(binding.rawData)

              // 🔥 修复：根据数据结构决定如何恢复
              if (parsedRawData && typeof parsedRawData === 'object' && parsedRawData.currentData !== undefined) {
                // 新数据结构：包含 currentData 和 rawDataList
                dataValues[key] = {
                  currentData: parsedRawData.currentData,
                  rawDataList: parsedRawData.rawDataList || []
                }
                console.log(`🔧 [DEBUG-Config] 恢复新数据结构 ${key}:`, dataValues[key])
              } else {
                // 旧数据结构：直接是数据内容
                dataValues[key] = {
                  currentData: parsedRawData,
                  rawDataList: []
                }
                console.log(`🔧 [DEBUG-Config] 恢复旧数据结构并转换 ${key}:`, dataValues[key])
              }

              // 🔥 修复：同时从原始数据列表配置中恢复
              if (binding.rawDataList) {
                dataValues[key].rawDataList = binding.rawDataList
                console.log(`🔧 [DEBUG-Config] 恢复原始数据列表 ${key}:`, binding.rawDataList)
              }

              hasRestoredData = true
            } catch (error) {
              console.warn(`⚠️ [DEBUG-Config] 恢复数据源 ${key} 失败:`, error)
              // 🔥 修复：恢复失败时使用默认数据结构
              const defaultData = getDefaultData(key)
              dataValues[key] = {
                currentData: defaultData,
                rawDataList: []
              }
            }
          }
        })
      }
    } catch (error) {
      console.warn('⚠️ [DEBUG-Config] 配置恢复失败:', error)
    }
  }

  // 如果没有恢复到数据，使用默认数据
  if (!hasRestoredData) {
    useDefaultData()
  }

  // 🔥 修复：只在没有恢复到数据时发送初始配置
  // 恢复数据时不发送，避免重复发送相同配置
  if (!hasRestoredData) {
    console.log('🔧 [DEBUG-Config] 使用默认数据，发送初始配置')
    sendUpdate()
  } else {
    console.log('🔧 [DEBUG-Config] 数据已恢复，不发送重复配置')
    // 🔥 修复：更新 lastSentConfig 以避免后续重复发送
    const dataSourceBindings: Record<string, any> = {}
    props.dataSources.forEach(dataSource => {
      const dataSourceValue = dataValues[dataSource.key]
      if (dataSourceValue?.currentData !== undefined) {
        dataSourceBindings[dataSource.key] = {
          rawData: JSON.stringify(dataSourceValue.currentData),
          rawDataList: dataSourceValue.rawDataList || [],
          metadata: {
            hasRawDataList: dataSourceValue.rawDataList?.length > 0
            // 移除 activeRawDataId，因为原始数据项不影响最终数据
          }
        }
      }
    })
    lastSentConfig = JSON.stringify({ dataSourceBindings })
  }
}

/**
 * 使用默认数据 - 🔥 修改：支持新的数据结构
 */
const useDefaultData = () => {
  console.log('🔥 [DEBUG-Config] 使用默认数据初始化 - 新数据结构')
  props.dataSources.forEach(dataSource => {
    const defaultData = getDefaultData(dataSource.key)
    dataValues[dataSource.key] = {
      currentData: defaultData,
      rawDataList: []
    }
    console.log(`🔧 [DEBUG-Config] 初始化数据源: ${dataSource.key}`, dataValues[dataSource.key])
  })
}

// 🔥 原始数据管理函数

/**
 * 打开添加原始数据弹窗
 */
const openAddRawDataModal = (dataSourceKey: string) => {
  currentDataSourceKey.value = dataSourceKey
  newRawDataName.value = ''
  showAddRawDataModal.value = true
}

/**
 * 快速添加原始数据 - 极简交互，直接添加（备用）
 */
const quickAddRawData = (dataSourceKey: string) => {
  // 🔥 修复：确保数据源存在且rawDataList是数组
  if (!dataValues[dataSourceKey]) {
    dataValues[dataSourceKey] = {
      currentData: getDefaultData(dataSourceKey),
      rawDataList: []
    }
  }

  if (!dataValues[dataSourceKey].rawDataList || !Array.isArray(dataValues[dataSourceKey].rawDataList)) {
    dataValues[dataSourceKey].rawDataList = []
  }

  // 生成简洁的数据项名称
  const itemCount = dataValues[dataSourceKey].rawDataList.length + 1
  const itemName = `数据项${itemCount}`

  // 创建新的原始数据项
  const newRawDataItem: RawDataItem = {
    id: `raw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: itemName,
    data: {}, // 空对象，完全独立
    createdAt: new Date().toISOString(),
    isActive: false
  }

  // 添加到列表
  dataValues[dataSourceKey].rawDataList.push(newRawDataItem)

  console.log('🔧 [DEBUG-Config] 快速添加数据项:', {
    dataSourceKey,
    itemName,
    totalCount: dataValues[dataSourceKey].rawDataList.length
  })
}

/**
 * 添加原始数据（弹窗版本）- 🔥 支持复杂配置
 */
const addRawData = () => {
  if (!newRawDataName.value.trim()) {
    console.warn('原始数据名称不能为空')
    return
  }

  const dataSourceKey = currentDataSourceKey.value

  // 🔥 修复：确保数据源存在且rawDataList是数组
  if (!dataValues[dataSourceKey]) {
    dataValues[dataSourceKey] = {
      currentData: getDefaultData(dataSourceKey),
      rawDataList: []
    }
  }

  if (!dataValues[dataSourceKey].rawDataList || !Array.isArray(dataValues[dataSourceKey].rawDataList)) {
    dataValues[dataSourceKey].rawDataList = []
  }

  // 创建新的原始数据项 - 使用用户输入的名称
  const newRawDataItem: RawDataItem = {
    id: `raw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: newRawDataName.value.trim(),
    data: {}, // 空对象，完全独立
    createdAt: new Date().toISOString(),
    isActive: false
  }

  // 添加到列表
  dataValues[dataSourceKey].rawDataList.push(newRawDataItem)

  console.log('🔧 [DEBUG-Config] 添加数据项（弹窗版本）:', {
    dataSourceKey,
    newItem: newRawDataItem,
    totalCount: dataValues[dataSourceKey].rawDataList.length
  })

  // 关闭弹窗并重置表单
  showAddRawDataModal.value = false
  newRawDataName.value = ''

  // 🔥 原始数据项不影响最终数据，不调用 sendUpdate()
  console.log('🔧 [DEBUG-Config] 数据项已添加，不影响最终数据')
}

/**
 * 删除原始数据 - 🔥 修改：原始数据项完全独立，不影响最终数据
 */
const deleteRawData = (dataSourceKey: string, rawDataId: string) => {
  const dataSourceValue = dataValues[dataSourceKey]
  if (!dataSourceValue) return

  // 找到要删除的项的索引
  const itemIndex = dataSourceValue.rawDataList.findIndex(item => item.id === rawDataId)
  if (itemIndex === -1) return

  const deletedItem = dataSourceValue.rawDataList[itemIndex]

  // 删除项
  dataSourceValue.rawDataList.splice(itemIndex, 1)

  console.log('🔧 [DEBUG-Config] 删除独立原始数据项:', {
    dataSourceKey,
    rawDataId,
    deletedItem,
    remainingCount: dataSourceValue.rawDataList.length
  })

  // 🔥 修改：原始数据项不影响最终数据，所以不需要调用 sendUpdate()
  console.log('🔧 [DEBUG-Config] 原始数据项已删除，不影响最终数据')
}

// 🔥 新增：查看当前数据源最终数据
const showCurrentFinalData = (dataSourceKey: string) => {
  const dataSourceValue = dataValues[dataSourceKey]
  if (dataSourceValue?.currentData) {
    try {
      currentFinalData.value = JSON.stringify(dataSourceValue.currentData, null, 2)
    } catch {
      currentFinalData.value = String(dataSourceValue.currentData)
    }
  } else {
    currentFinalData.value = '暂无数据'
  }

  currentDataSourceKey.value = dataSourceKey
  showFinalDataModal.value = true
}

// 🔥 新增：查看原始数据详情
const viewRawDataDetail = (dataSourceKey: string, rawDataId: string) => {
  const dataSourceValue = dataValues[dataSourceKey]
  if (!dataSourceValue) return

  const targetItem = dataSourceValue.rawDataList.find(item => item.id === rawDataId)
  if (!targetItem) return

  try {
    currentRawDataDetail.value = JSON.stringify(targetItem.data, null, 2)
  } catch {
    currentRawDataDetail.value = String(targetItem.data)
  }

  currentRawDataName.value = targetItem.name
  showRawDataDetailModal.value = true
}

// 组件挂载时初始化
onMounted(() => {
  initializeData()
})

// 🔥 监听 selectedWidgetId 变化，重新初始化
watch(
  () => props.selectedWidgetId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      console.log('🔄 [DataSourceConfigForm] selectedWidgetId 变化，重新初始化:', { oldId, newId })
      initializeData()
    }
  },
  { immediate: false }
)

// 监听 props 变化，重新初始化
watch(
  () => props.dataSources,
  () => {
    initializeData()
  },
  { deep: true }
)

// 🔥 调试：监听dataValues变化
watch(
  () => dataValues,
  newDataValues => {
    console.log('🔧 [DEBUG-Config] dataValues变化:', {
      keys: Object.keys(newDataValues),
      values: newDataValues
    })
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.data-source-config-form {
  width: 100%;
}

.data-source-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.example-data-icon {
  color: var(--text-color-3);
  margin-left: 8px;
  cursor: help;
  transition: color 0.2s;
}

.example-data-icon:hover {
  color: var(--primary-color);
}

.example-data-tooltip {
  max-width: 350px;
  padding: 4px 0;
}

.tooltip-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 8px;
  opacity: 0.9;
}

.example-code-container {
  background: var(--code-color, var(--card-color));
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.example-code {
  margin: 0;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-color);
  background: transparent;
  overflow-x: auto;
  white-space: pre;
  max-height: 200px;
  overflow-y: auto;
}

/* 明暗主题适配 */
[data-theme='dark'] .example-code-container {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .example-code {
  color: rgba(255, 255, 255, 0.9);
}

[data-theme='light'] .example-code-container {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme='light'] .example-code {
  color: rgba(0, 0, 0, 0.85);
}

/* 滚动条美化 */
.example-code::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.example-code::-webkit-scrollbar-track {
  background: transparent;
}

.example-code::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.example-code::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-3);
}

.data-source-content {
  padding: 16px;
  background: var(--card-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

/* 添加按钮样式 - 极简经济设计 */
.add-data-btn {
  width: 100%;
  border-style: dashed;
  border-width: 1px;
  background: transparent;
  transition: all 0.2s ease;
  font-size: 12px;
  height: 28px;
  color: var(--text-color-3);
}

.add-data-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: var(--primary-color-hover);
}

.add-data-btn:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-pressed);
}

/* 原始数据列表样式 */
.raw-data-list {
  max-height: 200px;
  overflow-y: auto;
}

.raw-data-item-compact {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  margin-bottom: 3px;
  transition: all 0.15s;
  background-color: var(--card-color);
  font-size: 12px;
}

.raw-data-item-compact:hover {
  border-color: var(--primary-color);
  background-color: var(--hover-color);
}

/* 紧凑按钮样式 */
.compact-btn {
  min-width: 36px;
  height: 20px;
  font-size: 10px;
  padding: 0 6px;
  border-radius: 3px;
}

.compact-btn:hover {
  transform: none;
  box-shadow: none;
}

.raw-data-name {
  font-weight: 500;
  color: var(--text-color);
}
</style>
