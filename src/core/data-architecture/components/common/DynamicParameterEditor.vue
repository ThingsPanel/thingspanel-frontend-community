<!--
  动态参数编辑器组件 v3.0
  采用主行-详情分离的设计，优化了UI布局和交互体验
-->
<script setup lang="ts">
/**
 * DynamicParameterEditor - 智能参数编辑器 v3.0
 *
 * 设计理念：
 * - 主行/详情分离：主列表保持简洁，仅显示核心信息，点击“配置”展开详细面板。
 * - 模式化编辑：通过“模板”切换不同的值输入模式（手动、下拉、属性、组件）。
 * - 交互优化：对于复杂的组件模板，使用抽屉（Drawer）进行编辑，避免破坏布局。
 */

import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NButton,
  NCheckbox,
  NInput,
  NSelect,
  NSpace,
  NTag,
  NText,
  NDrawer,
  NDrawerContent,
  NIcon,
  NDropdown,
  NAlert,
  NCard,
  NForm,
  NFormItem,
  NRadioGroup,
  NRadio,
  NDivider,
  useMessage
} from 'naive-ui'
import { type EnhancedParameter } from '@/core/data-architecture/types/parameter-editor'
import { generateVariableName } from '@/core/data-architecture/types/http-config'
import {
  getRecommendedTemplates,
  getTemplateById,
  ParameterTemplateType
} from '@/core/data-architecture/components/common/templates/index'

// 导入组件模板使用的组件（简化版）
import DeviceMetricsSelector from '@/components/device-selectors/DeviceMetricsSelector.vue'
import DeviceDispatchSelector from '@/components/device-selectors/DeviceDispatchSelector.vue'
import ComponentPropertySelector from '@/core/data-architecture/components/common/ComponentPropertySelector.vue'
import AddParameterFromDevice from '@/core/data-architecture/components/common/AddParameterFromDevice.vue'
// 导入新的统一设备配置选择器
import UnifiedDeviceConfigSelector from '@/core/data-architecture/components/device-selectors/UnifiedDeviceConfigSelector.vue'
// 导入设备参数选择器
import DeviceParameterSelector from '@/core/data-architecture/components/device-selectors/DeviceParameterSelector.vue'
// 导入参数组管理工具
import { globalParameterGroupManager } from '@/core/data-architecture/utils/device-parameter-generator'
import {
  Sparkles as SparkleIcon,
  AddCircleOutline as AddIcon,
  PhonePortraitOutline,
  PhonePortraitOutline as DeviceIcon,
  CreateOutline as EditOutline,
  TrashOutline,
  LinkOutline
} from '@vicons/ionicons5'

// 组件映射表（简化版）
const componentMap = {
  DeviceMetricsSelector,
  DeviceDispatchSelector,
  ComponentPropertySelector
}

// Props接口
interface Props {
  modelValue: EnhancedParameter[]
  parameterType: 'header' | 'query' | 'path'
  title?: string
  addButtonText?: string
  keyPlaceholder?: string
  valuePlaceholder?: string
  showDataType?: boolean
  showEnabled?: boolean
  customClass?: string
  maxParameters?: number // 最大参数数量限制
  currentApiInfo?: any // 当前选择的内部接口信息，用于接口模板功能
  currentComponentId?: string // 🔥 新增：当前组件ID，用于属性绑定
}

// Emits接口
interface Emits {
  (e: 'update:modelValue', value: EnhancedParameter[]): void
}

const props = withDefaults(defineProps<Props>(), {
  title: '参数配置',
  addButtonText: '添加参数',
  keyPlaceholder: '参数名',
  valuePlaceholder: '参数值',
  showDataType: true,
  showEnabled: true,
  customClass: ''
})

const emit = defineEmits<Emits>()
const { t } = useI18n()
const message = useMessage()

// 🔥 新增：添加参数抽屉控制
const showAddParamDrawer = ref(false)
// 🔥 新增：新参数的临时配置
const newParamConfig = ref({
  key: '',
  configType: 'manual' as 'manual' | 'property' | 'device',
  value: '',
  description: '',
  // 属性绑定相关
  propertyBinding: null as any,
  // 设备配置相关
  deviceConfig: null as any
})

// 当前正在编辑的参数索引，-1表示没有参数处于编辑状态
const editingIndex = ref(-1)
// 控制组件模板编辑抽屉的显示
const isDrawerVisible = ref(false)
// 控制从设备添加参数抽屉的显示
const isAddFromDeviceDrawerVisible = ref(false)
// 控制统一设备配置选择器显示
const isUnifiedDeviceConfigVisible = ref(false)
const isEditingDeviceConfig = ref(false)

// 控制新的设备参数选择器显示（保留兼容）
const isDeviceParameterSelectorVisible = ref(false)
// 当前在抽屉中编辑的参数的临时状态
const drawerParam = ref<EnhancedParameter | null>(null)
// 编辑中的参数组信息
const editingGroupInfo = ref<{
  groupId: string
  preSelectedDevice?: any
  preSelectedMetric?: any
  preSelectedMode?: any
} | null>(null)

/**
 * 🔥 修改：参数添加选项 - 支持接口模板导入
 */
const addParameterOptions = computed(() => {
  console.log('🔍 [addParameterOptions] computed 被执行')
  console.log('🔍 [addParameterOptions] props.currentApiInfo:', props.currentApiInfo)

  const baseOptions = [
    {
      label: '手动输入',
      key: 'manual',
      description: '直接输入固定参数值'
    },
    {
      label: '组件属性绑定',
      key: 'property',
      description: '绑定到组件属性（运行时获取值）'
    },
    {
      label: '设备配置',
      key: 'device',
      description: '选择设备和对应的指标数据'
    }
  ]

  // 如果有内部接口信息且有预制参数，添加"应用接口模板"选项
  if (props.currentApiInfo && props.currentApiInfo.commonParams && props.currentApiInfo.commonParams.length > 0) {
    console.log('✨ [addParameterOptions] 检测到 commonParams，添加接口模板选项')
    console.log('✨ [addParameterOptions] commonParams 数量:', props.currentApiInfo.commonParams.length)
    baseOptions.unshift({
      label: `✨ 应用接口模板 (${props.currentApiInfo.commonParams.length}个参数)`,
      key: 'api-template',
      description: '自动导入内部接口的预制参数'
    })
  } else {
    console.log('⚠️ [addParameterOptions] 未检测到 commonParams，不添加接口模板选项')
  }

  console.log('🔍 [addParameterOptions] 最终选项:', baseOptions)
  return baseOptions
})

/**
 * 数据类型选项
 */
const dataTypeOptions = [
  { label: '字符串', value: 'string' },
  { label: '数字', value: 'number' },
  { label: '布尔值', value: 'boolean' },
  { label: 'JSON', value: 'json' }
]

/**
 * 获取推荐的模板列表
 */
const recommendedTemplates = computed(() => {
  return getRecommendedTemplates(props.parameterType)
})

/**
 * 是否可以添加更多参数
 */
const canAddMoreParameters = computed(() => {
  if (props.maxParameters === undefined) return true
  return props.modelValue.length < props.maxParameters
})

/**
 * 🔥 新增：确保所有参数都有稳定ID的计算属性
 * 用于修复历史参数的兼容性问题并防止焦点丢失
 */
const parametersWithStableIds = computed(() => {
  return props.modelValue.map((param, index) => ensureParameterHasId(param, index))
})

/**
 * 创建默认参数 - 添加唯一ID确保Vue追踪
 */
const createDefaultParameter = (): EnhancedParameter => ({
  key: '',
  value: '',
  enabled: true,
  isDynamic: false, // 🔥 新增：默认为静态参数
  valueMode: ParameterTemplateType.MANUAL,
  selectedTemplate: 'manual',
  dataType: 'string',
  variableName: '',
  description: '',
  // 🔥 添加唯一ID确保Vue正确追踪
  _id: `param_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
})

/**
 * 🔥 重构：打开添加参数抽屉
 */
const openNewParamForm = () => {
  // 重置配置
  newParamConfig.value = {
    key: '',
    configType: 'manual',
    value: '',
    description: '',
    propertyBinding: null,
    deviceConfig: null
  }
  showAddParamDrawer.value = true
}

/**
 * 🔥 重构：取消添加参数
 */
const cancelNewParam = () => {
  showAddParamDrawer.value = false
  newParamConfig.value = {
    key: '',
    configType: 'manual',
    value: '',
    description: '',
    propertyBinding: null,
    deviceConfig: null
  }
}

/**
 * 🔥 新增：处理抽屉内属性绑定的变化
 */
const handleNewParamPropertyChange = (value: any) => {
  console.log('🔍 [handleNewParamPropertyChange] 属性绑定值变化:', value)
  newParamConfig.value.propertyBinding = value
}

/**
 * 🔥 新增：处理抽屉内设备配置的变化
 */
const handleNewParamDeviceConfigChange = (config: any) => {
  console.log('🔍 [handleNewParamDeviceConfigChange] 设备配置变化:', config)
  newParamConfig.value.deviceConfig = config
}

/**
 * 🔥 重构：确认添加新参数
 */
const confirmNewParam = () => {
  // 验证 key 不能为空
  if (!newParamConfig.value.key || !newParamConfig.value.key.trim()) {
    message.error('参数名(key)不能为空！')
    return
  }

  // 验证 key 不能重复
  const hasDuplicate = props.modelValue.some(p => p.key === newParamConfig.value.key.trim())
  if (hasDuplicate) {
    message.error(`参数 key "${newParamConfig.value.key}" 已存在，不允许重复！`)
    return
  }

  // 根据配置类型创建参数
  const newParam = createDefaultParameter()
  newParam.key = newParamConfig.value.key.trim()
  newParam.description = newParamConfig.value.description || `${newParam.key}参数`

  // 根据配置类型设置参数
  switch (newParamConfig.value.configType) {
    case 'manual':
      newParam.valueMode = ParameterTemplateType.MANUAL
      newParam.selectedTemplate = 'manual'
      newParam.value = newParamConfig.value.value
      newParam.isDynamic = false
      break
    case 'property':
      newParam.valueMode = ParameterTemplateType.COMPONENT
      newParam.selectedTemplate = 'component-property-binding'
      newParam.value = newParamConfig.value.propertyBinding || ''
      newParam.isDynamic = true
      break
    case 'device':
      newParam.valueMode = ParameterTemplateType.COMPONENT
      newParam.selectedTemplate = 'device-metrics-selector'
      newParam.value = newParamConfig.value.deviceConfig || ''
      newParam.isDynamic = true
      break
  }

  // 添加到参数列表
  const updatedParams = [...props.modelValue, newParam]
  emit('update:modelValue', updatedParams)

  // 关闭抽屉
  showAddParamDrawer.value = false

  message.success(`参数 "${newParam.key}" 添加成功！`)
}

/**
 * 添加新参数 - 强制响应式更新（保留旧方法，向后兼容）
 * @deprecated 使用新的 openNewParamForm 替代
 */
const addParameter = () => {
  openNewParamForm()
}

/**
 * 处理添加参数的下拉选项 - 支持接口模板导入
 */
const handleSelectAddOption = (key: string) => {
  console.log('🔍 [DynamicParameterEditor] handleSelectAddOption 被调用，key:', key)
  console.log('🔍 [DynamicParameterEditor] currentApiInfo:', props.currentApiInfo)

  // 🔥 新增：处理接口模板导入
  if (key === 'api-template' || key === 'apply-interface-template') {
    console.log('✨ [DynamicParameterEditor] 触发接口模板导入')
    handleTemplateImport()
    return
  }

  // 检查参数数量限制
  if (!canAddMoreParameters.value) {
    return
  }

  const newParam = createDefaultParameter()

  switch (key) {
    case 'manual':
      // 手动输入：使用默认的手动输入模板
      newParam.selectedTemplate = 'manual'
      newParam.valueMode = ParameterTemplateType.MANUAL
      break

    case 'property':
      // 🔥 修复：属性绑定 - 立即显示面板
      newParam.selectedTemplate = 'component-property-binding'
      newParam.valueMode = ParameterTemplateType.COMPONENT
      newParam.isDynamic = true // 🔥 关键修复：设置为动态参数

      // 添加参数
      const updatedParams = [...props.modelValue, newParam]
      emit('update:modelValue', updatedParams)

      // 立即设置编辑状态并打开抽屉
      const newParamIndex = updatedParams.length - 1
      editingIndex.value = newParamIndex

      nextTick(() => {
        // 直接打开组件属性选择抽屉
        openComponentDrawer(newParam)
      })
      return // 提前返回，避免重复处理

    case 'device':
      // 🔥 修复：设备配置 - 打开统一设备配置选择器
      isUnifiedDeviceConfigVisible.value = true
      isEditingDeviceConfig.value = false // 新建模式
      return // 提前返回，避免重复处理

    default:
      // 默认使用手动输入
      newParam.selectedTemplate = 'manual'
      newParam.valueMode = ParameterTemplateType.MANUAL
  }

  // 添加参数并自动展开编辑
  const updatedParams = [...props.modelValue, newParam]
  emit('update:modelValue', updatedParams)

  // 使用 nextTick 确保DOM更新后再设置编辑状态
  nextTick(() => {
    editingIndex.value = updatedParams.length - 1
  })
}

/**
 * 处理接口模板导入 - 根据当前选择的接口生成参数 - 强制响应式更新
 */
const handleTemplateImport = () => {
  console.log('📥 [handleTemplateImport] 开始执行')
  console.log('📥 [handleTemplateImport] currentApiInfo:', props.currentApiInfo)
  console.log('📥 [handleTemplateImport] modelValue:', props.modelValue)

  if (!props.currentApiInfo) {
    console.warn('⚠️ [handleTemplateImport] currentApiInfo 为空，使用默认参数')
    // 提供默认的deviceId参数作为占位
    const defaultParam = createDefaultParameter()
    defaultParam.key = 'deviceId'
    defaultParam.description = '设备ID（通用参数）'
    defaultParam.selectedTemplate = 'manual'
    defaultParam.valueMode = ParameterTemplateType.MANUAL

    const updatedParams = [...props.modelValue, defaultParam]

    // 🔥 立即发射更新事件
    emit('update:modelValue', updatedParams)

    // 🔥 强制刷新组件状态
    nextTick(() => {
      editingIndex.value = updatedParams.length - 1
    })

    return
  }

  // 根据接口信息生成参数
  const apiInfo = props.currentApiInfo
  let templateParams: EnhancedParameter[] = []

  console.log('📥 [handleTemplateImport] apiInfo.commonParams:', apiInfo.commonParams)
  console.log('📥 [handleTemplateImport] apiInfo.pathParamNames:', apiInfo.pathParamNames)

  // 从commonParams生成参数
  if (apiInfo.commonParams && apiInfo.commonParams.length > 0) {
    const pathParamNames = apiInfo.pathParamNames || []
    let filteredParams = apiInfo.commonParams

    // 🔥 关键修复：根据 parameterType 决定过滤规则
    if (props.parameterType === 'query') {
      // 查询参数：过滤掉路径参数
      filteredParams = apiInfo.commonParams.filter(param => !pathParamNames.includes(param.name))
      console.log('📥 [handleTemplateImport] 查询参数模式，过滤掉路径参数')
    } else if (props.parameterType === 'path') {
      // 路径参数：只保留路径参数
      filteredParams = apiInfo.commonParams.filter(param => pathParamNames.includes(param.name))
      console.log('📥 [handleTemplateImport] 路径参数模式，只保留路径参数')
    } else {
      // header 等其他类型：保留所有参数
      console.log('📥 [handleTemplateImport] 其他参数模式，保留所有参数')
    }

    console.log('📥 [handleTemplateImport] filteredParams（过滤后）:', filteredParams)

    templateParams = filteredParams.map(param => {
      const enhancedParam = createDefaultParameter()
      enhancedParam.key = param.name
      enhancedParam.description = param.description || `${param.name}参数`
      enhancedParam.dataType =
        param.type === 'string'
          ? 'string'
          : param.type === 'number'
            ? 'number'
            : param.type === 'boolean'
              ? 'boolean'
              : param.type === 'object'
                ? 'string' // object类型转为string
                : 'string'
      enhancedParam.selectedTemplate = 'manual'
      enhancedParam.valueMode = ParameterTemplateType.MANUAL
      // 🔥 新增：使用example作为初始值
      enhancedParam.value = param.example || ''
      enhancedParam.defaultValue = param.example
      return enhancedParam
    })
  } else {
    console.log('📥 [handleTemplateImport] 无 commonParams，使用默认参数')
    // 根据接口类型提供合理的默认参数
    const defaultParam = createDefaultParameter()

    if (apiInfo.url.includes('device')) {
      defaultParam.key = 'deviceId'
      defaultParam.description = '设备ID'
    } else if (apiInfo.url.includes('group')) {
      defaultParam.key = 'groupId'
      defaultParam.description = '分组ID'
    } else if (apiInfo.url.includes('user')) {
      defaultParam.key = 'userId'
      defaultParam.description = '用户ID'
    } else {
      defaultParam.key = 'id'
      defaultParam.description = '标识符'
    }

    defaultParam.selectedTemplate = 'manual'
    defaultParam.valueMode = ParameterTemplateType.MANUAL
    templateParams = [defaultParam]
  }

  console.log('📥 [handleTemplateImport] 生成的 templateParams:', templateParams)

  // 🔥 关键修复：智能合并 - 检查重复key，相同key则替换而非重复添加
  const existingKeys = new Set(props.modelValue.map(p => p.key))
  const newParams: EnhancedParameter[] = []
  const replacedKeys: string[] = []

  templateParams.forEach(templateParam => {
    if (existingKeys.has(templateParam.key)) {
      // 已存在相同key，记录为替换而不是新增
      replacedKeys.push(templateParam.key)
      console.log(`📥 [handleTemplateImport] 检测到重复key: ${templateParam.key}，将替换现有参数`)
    } else {
      // 新的key，添加到新参数列表
      newParams.push(templateParam)
    }
  })

  // 构建最终参数列表：保留所有现有参数（包括被替换的），然后追加新参数
  const updatedParams = [
    ...props.modelValue.map(existingParam => {
      // 如果这个参数的key在模板中，用模板参数替换
      const templateParam = templateParams.find(tp => tp.key === existingParam.key)
      if (templateParam) {
        console.log(`📥 [handleTemplateImport] 替换参数: ${existingParam.key}`)
        return { ...templateParam, _id: existingParam._id } // 保留原有_id
      }
      return existingParam
    }),
    ...newParams // 追加真正新增的参数
  ]

  console.log('📥 [handleTemplateImport] 合并后的 updatedParams:', updatedParams)
  if (replacedKeys.length > 0) {
    console.log(`📥 [handleTemplateImport] 替换了 ${replacedKeys.length} 个重复参数:`, replacedKeys)
  }
  if (newParams.length > 0) {
    console.log(`📥 [handleTemplateImport] 新增了 ${newParams.length} 个参数`)
  }

  // 🔥 立即发射更新事件
  emit('update:modelValue', updatedParams)

  // 🔥 强制刷新组件状态
  nextTick(() => {
    // 自动展开最新添加的参数进行编辑
    if (templateParams.length > 0) {
      editingIndex.value = updatedParams.length - templateParams.length
    }
    console.log('✅ [handleTemplateImport] 完成，editingIndex 设置为:', editingIndex.value)
  })
}

/**
 * 删除参数 - 强制响应式更新
 */
const removeParameter = (index: number) => {
  const updatedParams = props.modelValue.filter((_, i) => i !== index)

  // 🔥 立即发射更新事件
  emit('update:modelValue', updatedParams)

  // 🔥 强制刷新组件状态
  nextTick(() => {
    // 如果删除的是正在编辑的项，则关闭编辑状态
    if (editingIndex.value === index) {
      editingIndex.value = -1
    }
  })
}

/**
 * 处理从设备添加的参数
 */
const handleAddFromDevice = (params: any[]) => {
  if (params && params.length > 0) {
    // 检查参数数量限制
    const currentCount = props.modelValue.length
    const availableSlots = props.maxParameters ? props.maxParameters - currentCount : Infinity

    if (availableSlots <= 0) {
      return
    }

    // 转换设备参数为标准参数格式
    const newParams = params.slice(0, availableSlots).map(param => ({
      key: param.key || param.metricsId || '',
      value: param.source ? `${param.source.deviceName}.${param.source.metricsName}` : param.value || '',
      enabled: true,
      valueMode: ParameterTemplateType.COMPONENT,
      selectedTemplate: 'device-dispatch-selector',
      dataType: 'string',
      variableName: param.source ? generateVariableName(param.key || param.metricsId || '') : '',
      description: param.source ? `设备: ${param.source.deviceName}, 指标: ${param.source.metricsName}` : ''
    }))

    // 合并到现有参数列表
    const updatedParams = [...props.modelValue, ...newParams]
    emit('update:modelValue', updatedParams)

    // 自动展开最新添加的参数进行编辑
    if (newParams.length > 0) {
      nextTick(() => {
        editingIndex.value = updatedParams.length - 1
      })
    }
  }

  isAddFromDeviceDrawerVisible.value = false
}

/**
 * 🔥 新增：处理新的设备参数选择器完成事件
 */
const handleDeviceParametersSelected = (parameters: EnhancedParameter[]) => {
  // 合并到现有参数列表
  const updatedParams = [...props.modelValue, ...parameters]
  emit('update:modelValue', updatedParams)

  // 自动展开第一个新添加的参数进行编辑
  if (parameters.length > 0) {
    nextTick(() => {
      editingIndex.value = updatedParams.length - parameters.length
    })
  }

  // 关闭选择器
  isDeviceParameterSelectorVisible.value = false
}

/**
 * 🔥 新增：处理统一设备配置生成的参数 - 强制响应式更新
 */
const handleUnifiedDeviceConfigGenerated = (parameters: EnhancedParameter[]) => {
  let finalParams: EnhancedParameter[]

  if (isEditingDeviceConfig.value) {
    // 编辑模式：先移除现有的设备相关参数，再添加新的参数
    const updatedParams = removeDeviceRelatedParameters()
    finalParams = [...updatedParams, ...parameters]
  } else {
    // 新建模式：合并参数，自动去重
    finalParams = mergeParametersWithDeduplication(parameters)
  }

  // 🔥 立即发射更新事件
  emit('update:modelValue', finalParams)

  // 🔥 强制刷新组件状态
  nextTick(() => {
    // 自动展开第一个新添加的参数进行编辑
    if (parameters.length > 0) {
      editingIndex.value = finalParams.length - parameters.length
    }
  })

  // 关闭选择器
  isUnifiedDeviceConfigVisible.value = false
  isEditingDeviceConfig.value = false
}

/**
 * 🔥 移除现有的设备相关参数
 */
const removeDeviceRelatedParameters = () => {
  const deviceRelatedKeys = ['deviceId', 'metric', 'deviceLocation', 'deviceStatus']
  return props.modelValue.filter(param => !deviceRelatedKeys.includes(param.key))
}

/**
 * 🔥 合并参数并去重（同键参数只保留新的） - 强制响应式更新
 */
const mergeParametersWithDeduplication = (newParameters: EnhancedParameter[]) => {
  const newParamKeys = new Set(newParameters.map(p => p.key))

  // 移除现有参数中与新参数同键的参数
  const filteredExisting = props.modelValue.filter(param => !newParamKeys.has(param.key))

  // 合并
  const mergedParams = [...filteredExisting, ...newParameters]

  return mergedParams
}

/**
 * 🔥 检测是否已存在设备相关参数
 */
const getExistingDeviceParameters = () => {
  const deviceRelatedKeys = ['deviceId', 'metric', 'deviceLocation', 'deviceStatus']
  return props.modelValue.filter(param => deviceRelatedKeys.includes(param.key))
}

/**
 * 🔥 处理设备配置编辑/新建
 */
const editDeviceConfig = () => {
  const existingParams = getExistingDeviceParameters()
  if (existingParams.length > 0) {
    isEditingDeviceConfig.value = true
  } else {
    isEditingDeviceConfig.value = false
  }
  isUnifiedDeviceConfigVisible.value = true
}

/**
 * 🔥 新增：处理参数组更新事件（编辑模式）
 */
const handleParametersUpdated = (data: { groupId: string; parameters: EnhancedParameter[] }) => {
  // 找到原参数组的参数并替换
  const groupParams = globalParameterGroupManager.getGroupParameters(data.groupId, props.modelValue)
  const groupParamIds = groupParams.map(p => p._id)

  // 移除原参数组的参数
  let updatedParams = props.modelValue.filter(param => !groupParamIds.includes(param._id))

  // 添加新的参数
  updatedParams = [...updatedParams, ...data.parameters]

  emit('update:modelValue', updatedParams)

  // 关闭选择器
  isDeviceParameterSelectorVisible.value = false
  editingGroupInfo.value = null
}

/**
 * 🔥 新增：检查参数是否属于设备参数组
 */
const isDeviceParameterGroup = (param: EnhancedParameter): boolean => {
  return param.parameterGroup?.groupId !== undefined && param.deviceContext?.sourceType === 'device-selection'
}

/**
 * 🔥 新增：获取参数的显示标签（带参数组信息）
 */
const getParameterDisplayLabel = (param: EnhancedParameter): string => {
  if (!isDeviceParameterGroup(param)) {
    return param.key || '未命名参数'
  }

  const role = param.parameterGroup?.role
  const groupInfo = globalParameterGroupManager.getGroup(param.parameterGroup!.groupId)
  const sourceType = groupInfo?.sourceType

  let prefix = ''
  switch (sourceType) {
    case 'device-id':
      prefix = '📱 设备'
      break
    case 'device-metric':
      prefix = '📊 指标'
      break
    case 'telemetry':
      prefix = '📡 遥测'
      break
    default:
      prefix = '🔧 参数'
  }

  let suffix = ''
  if (role === 'primary') suffix = ' (主)'
  else if (role === 'secondary') suffix = ' (次)'

  return `${prefix}: ${param.key}${suffix}`
}

/**
 * 🔥 新增：处理参数组编辑
 */
const editParameterGroup = (param: EnhancedParameter) => {
  if (!isDeviceParameterGroup(param)) return

  const groupId = param.parameterGroup!.groupId
  const groupInfo = globalParameterGroupManager.getGroup(groupId)

  if (!groupInfo) {
    return
  }

  // 准备编辑信息
  editingGroupInfo.value = {
    groupId,
    preSelectedDevice: groupInfo.sourceConfig.selectedDevice,
    preSelectedMetric: groupInfo.sourceConfig.selectedMetric,
    preSelectedMode: groupInfo.sourceType
  }

  // 打开设备参数选择器
  isDeviceParameterSelectorVisible.value = true
}

/**
 * 🔥 新增：删除整个参数组
 */
const deleteParameterGroup = (param: EnhancedParameter) => {
  if (!isDeviceParameterGroup(param)) return

  const groupId = param.parameterGroup!.groupId
  const groupParams = globalParameterGroupManager.getGroupParameters(groupId, props.modelValue)
  const groupParamIds = groupParams.map(p => p._id)

  // 移除所有相关参数
  const updatedParams = props.modelValue.filter(param => !groupParamIds.includes(param._id))
  emit('update:modelValue', updatedParams)

  // 清理参数组管理器
  globalParameterGroupManager.removeGroup(groupId)
}

/**
 * 切换参数的编辑状态
 */
const toggleEditMode = (index: number) => {
  editingIndex.value = editingIndex.value === index ? -1 : index
}

// 🔥 新增：防抖定时器用于延迟更新参数key
const updateKeyTimers = new Map<string, NodeJS.Timeout>()

/**
 * 更新指定索引的参数
 */
const updateParameter = (param: EnhancedParameter, index: number) => {
  const updatedParams = [...props.modelValue]
  updatedParams[index] = { ...param }

  emit('update:modelValue', updatedParams)
}

/**
 * 🔥 新增：更新参数key的防抖处理
 * 避免每次输入都触发重新渲染导致焦点丢失
 */
const updateParameterKey = (param: EnhancedParameter, index: number, newKey: string) => {
  // 立即更新本地显示，避免输入延迟
  const updatedParams = [...props.modelValue]
  updatedParams[index] = { ...param, key: newKey }
  emit('update:modelValue', updatedParams)

  // 清除之前的定时器
  const timerId = param._id || `param-${index}`
  if (updateKeyTimers.has(timerId)) {
    clearTimeout(updateKeyTimers.get(timerId)!)
    updateKeyTimers.delete(timerId)
  }
}

/**
 * 🔥 严格模式：检查参数key是否重复
 * 失去焦点时检查key的有效性（非空 + 不重复）
 */
const ensureParameterKeyNotEmpty = (param: EnhancedParameter, index: number) => {
  const trimmedKey = param.key?.trim() || ''

  // 检查1：key不能为空
  if (!trimmedKey) {
    const defaultKey = `param${index + 1}`
    updateParameter({ ...param, key: defaultKey }, index)
    return
  }

  // 检查2：严格模式 - key不能重复
  const hasDuplicate = props.modelValue.some((p, i) => {
    return i !== index && p.key === trimmedKey
  })

  if (hasDuplicate) {
    // 检测到重复key，强制回滚到默认值并提示用户
    const defaultKey = `param${index + 1}`
    updateParameter({ ...param, key: defaultKey }, index)

    // 使用 Naive UI 的 message 提示用户
    message.error(`参数 key "${trimmedKey}" 已存在，不允许重复！已自动重置为 "${defaultKey}"`)
    console.error(`❌ [严格模式] 参数 key "${trimmedKey}" 重复，已强制重置为 "${defaultKey}"`)
  }
}

/**
 * 🔥 新增：更新参数value的防抖处理
 * 立即更新显示，避免输入延迟
 */
const updateParameterValue = (param: EnhancedParameter, index: number, newValue: string) => {
  // 立即更新显示，保持输入的流畅性
  const updatedParams = [...props.modelValue]
  updatedParams[index] = { ...param, value: newValue }
  emit('update:modelValue', updatedParams)
}

/**
 * 🔥 新增：确保所有参数都有稳定的_id
 * 用于兼容没有_id的历史参数
 */
const ensureParameterHasId = (param: EnhancedParameter, index: number): EnhancedParameter => {
  if (!param._id) {
    return {
      ...param,
      // 🔥 关键修复：确保isDynamic字段有正确的值
      isDynamic:
        param.isDynamic !== undefined
          ? param.isDynamic
          : param.valueMode === 'component' ||
            param.selectedTemplate === 'component-property-binding' ||
            // 检测绑定路径格式
            (typeof param.value === 'string' &&
              param.value.includes('.') &&
              param.value.split('.').length >= 3 &&
              param.value.length > 10),
      _id: `param_legacy_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 6)}`
    }
  }
  return param
}

/**
 * 处理模板变化
 */
const onTemplateChange = (param: EnhancedParameter, index: number, templateId: string) => {
  const template = getTemplateById(templateId)
  if (!template) return

  // 🔥 修复：如果选择的是设备配置模板，打开统一设备配置选择器
  if (templateId === 'device-metrics-selector') {
    // 关闭当前参数编辑
    editingIndex.value = -1

    // 打开统一设备配置选择器，设置为编辑模式
    isUnifiedDeviceConfigVisible.value = true
    isEditingDeviceConfig.value = true

    return // 不继续普通的模板切换逻辑
  }

  const updatedParam = { ...param }
  updatedParam.selectedTemplate = templateId
  updatedParam.valueMode = template.type

  // 🔥 修复：区分value和defaultValue，避免错误赋值导致字符串拼接问题
  if (template.type === ParameterTemplateType.COMPONENT) {
    // 组件属性绑定：不修改现有的value（用户输入的绑定路径）
    // 只有在value为空时才使用模板默认值作为初始值
    if (!updatedParam.value && template.defaultValue !== undefined) {
      updatedParam.value = template.defaultValue
    }
    // 确保defaultValue字段正确设置
    if (template.defaultValue !== undefined && !updatedParam.defaultValue) {
      updatedParam.defaultValue = template.defaultValue
    }
  } else {
    // 其他模板类型：直接使用模板默认值
    if (template.defaultValue !== undefined) {
      updatedParam.value = template.defaultValue
    }
  }

  if (template.type === ParameterTemplateType.PROPERTY) {
    if (param.key) {
      updatedParam.variableName = generateVariableName(param.key)
      updatedParam.description = updatedParam.description || `${getTypeDisplayName()}参数：${param.key}`
    }
    updatedParam.isDynamic = true // 🔥 关键修复：设置为动态参数
  } else if (template.type === ParameterTemplateType.COMPONENT) {
    // 🔥 修复：属性绑定模板 - 确保编辑状态和抽屉立即显示
    updatedParam.isDynamic = true // 🔥 关键修复：设置为动态参数
    editingIndex.value = index

    // 先更新参数
    updateParameter(updatedParam, index)

    // 立即打开抽屉，不依赖 nextTick
    nextTick(() => {
      openComponentDrawer(updatedParam)
    })
    return // 提前返回，避免重复调用 updateParameter
  } else {
    updatedParam.variableName = ''
    updatedParam.description = ''
    updatedParam.isDynamic = false // 🔥 关键修复：其他模板为静态参数
  }

  updateParameter(updatedParam, index)
}

/**
 * 打开组件编辑抽屉
 */
const openComponentDrawer = (param: EnhancedParameter) => {
  drawerParam.value = { ...param }
  isDrawerVisible.value = true
}

/**
 * 处理组件属性选择变更
 * 当用户在组件属性选择器中选择了属性时调用
 */
const handleComponentPropertyChange = (bindingPath: string, propertyInfo?: any) => {
  if (!drawerParam.value) {
    console.warn(`⚠️ [DynamicParameterEditor] drawerParam 为空，忽略属性变更`)
    return
  }

  // 🔥 增强的绑定路径验证：更严格的格式检查
  const isValidBindingPath =
    bindingPath === '' ||
    (typeof bindingPath === 'string' &&
      bindingPath.includes('.') &&
      bindingPath.split('.').length >= 3 && // 至少包含组件ID.layer.property
      bindingPath.length > 10 && // 绑定路径通常较长
      !/^\d{1,4}$/.test(bindingPath) && // 拒绝短数字字符串（如"12"、"789"）
      !bindingPath.includes('undefined') && // 拒绝包含undefined的路径
      !bindingPath.includes('null') && // 拒绝包含null的路径
      /^[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_.-]+$/.test(bindingPath)) // 基本格式验证

  if (!isValidBindingPath && bindingPath !== '') {
    console.error(`❌ [DynamicParameterEditor] 检测到无效的bindingPath格式，执行自动恢复:`, {
      输入值: bindingPath,
      值类型: typeof bindingPath,
      值长度: typeof bindingPath === 'string' ? bindingPath.length : '非字符串',
      预期格式: 'componentId.layer.propertyName',
      当前参数: {
        key: drawerParam.value.key,
        当前value: drawerParam.value.value,
        variableName: drawerParam.value.variableName
      }
    })

    // 🔥 自动恢复机制：尝试从variableName重建正确的绑定路径
    if (drawerParam.value.variableName && drawerParam.value.variableName.includes('_')) {
      const lastUnderscoreIndex = drawerParam.value.variableName.lastIndexOf('_')
      if (lastUnderscoreIndex > 0) {
        const componentId = drawerParam.value.variableName.substring(0, lastUnderscoreIndex)
        const propertyName = drawerParam.value.variableName.substring(lastUnderscoreIndex + 1)
        const recoveredPath = `${componentId}.base.${propertyName}`

        // 使用恢复的路径替代错误的输入
        bindingPath = recoveredPath
      } else {
        console.error(`❌ [DynamicParameterEditor] 无法从variableName恢复绑定路径，拒绝更新`)
        return
      }
    } else {
      // 无法恢复，保持当前值不变
      console.error(`❌ [DynamicParameterEditor] 无变量名可用于恢复，拒绝设置无效绑定路径`)
      return
    }
  }

  // 记录值的变更历史，便于调试
  const oldValue = drawerParam.value.value

  // 更新抽屉中参数的绑定值
  drawerParam.value.value = bindingPath

  // 更新参数描述和变量名
  if (propertyInfo && bindingPath) {
    drawerParam.value.description = `绑定到组件属性: ${propertyInfo.componentName} -> ${propertyInfo.propertyLabel}`
    drawerParam.value.variableName = `${propertyInfo.componentId}_${propertyInfo.propertyName}`
  } else if (bindingPath === '') {
    // 清空绑定时，也清理相关字段
    drawerParam.value.description = ''
    drawerParam.value.variableName = ''
  }
}

/**
 * 保存从抽屉中所做的更改
 */
const saveDrawerChanges = () => {
  if (drawerParam.value && editingIndex.value !== -1) {
    updateParameter(drawerParam.value, editingIndex.value)
  }
  isDrawerVisible.value = false
  drawerParam.value = null
}

/**
 * 获取参数类型显示名称
 */
const getTypeDisplayName = () => {
  const names = { header: '请求头', query: '查询', path: '路径' }
  return names[props.parameterType]
}

/**
 * 获取当前模板的下拉选项
 */
const getCurrentTemplateOptions = (param: EnhancedParameter) => {
  if (param.valueMode !== ParameterTemplateType.DROPDOWN || !param.selectedTemplate) return []
  const template = getTemplateById(param.selectedTemplate)
  return template?.options || []
}

/**
 * 检查模板是否允许自定义输入
 */
const isCustomInputAllowed = (param: EnhancedParameter) => {
  if (param.valueMode !== ParameterTemplateType.DROPDOWN || !param.selectedTemplate) return false
  const template = getTemplateById(param.selectedTemplate)
  return template?.allowCustom || false
}

/**
 * 获取组件模板配置
 * 🔥 修复：动态注入currentComponentId到ComponentPropertySelector
 */
const getComponentTemplate = (param: EnhancedParameter | null) => {
  if (!param || !param.selectedTemplate) return null
  const template = getTemplateById(param.selectedTemplate)
  const config = template?.componentConfig
  if (!config) return null

  const component =
    typeof config.component === 'string'
      ? componentMap[config.component as keyof typeof componentMap]
      : config.component

  // 🔥 关键修复：为ComponentPropertySelector动态注入currentComponentId
  let enhancedProps = { ...config.props }

  if (
    config.component === 'ComponentPropertySelector' ||
    (typeof config.component === 'string' && config.component === 'ComponentPropertySelector')
  ) {
    enhancedProps = {
      ...enhancedProps,
      currentComponentId: props.currentComponentId, // 🔥 传递当前组件ID
      autoDetectComponentId: true // 🔥 保持自动检测功能
    }
  }

  return {
    ...config,
    component,
    props: enhancedProps // 🔥 使用增强后的props
  }
}

// 🔥 移除循环更新的watch监听器，避免值被错误覆盖
// 原因：这个watch会监听drawerParam.value.value的变化，然后重新设置自己，可能导致数据损坏
// ComponentPropertySelector通过v-model:value和@change事件已经正确处理了数据更新
</script>

<template>
  <div :class="['dynamic-parameter-editor-v3-enhanced', customClass]">
    <!-- 🔥 重构：简化的标题和添加按钮区 -->
    <div class="editor-header-enhanced">
      <span v-if="title" class="editor-title">{{ title }}</span>

      <n-space :size="8">
        <!-- 单个添加参数按钮 -->
        <n-button size="small" type="primary" :disabled="!canAddMoreParameters" @click="openNewParamForm">
          <template #icon>
            <n-icon><add-icon /></n-icon>
          </template>
          添加参数
        </n-button>

        <!-- 应用接口模板（独立功能，保留） -->
        <n-button
          v-if="currentApiInfo"
          size="small"
          type="success"
          :disabled="!canAddMoreParameters"
          @click="() => handleSelectAddOption('apply-interface-template')"
        >
          <template #icon>
            <n-icon><SparkleIcon /></n-icon>
          </template>
          应用接口模板
        </n-button>
      </n-space>
    </div>

    <!-- 设备参数提示（如果存在设备相关参数） -->
    <div v-if="getExistingDeviceParameters().length > 0" class="device-config-info">
      <n-alert type="info" size="small" :show-icon="false">
        <template #header>
          <n-space align="center">
            <n-icon size="16"><DeviceIcon /></n-icon>
            <span>当前设备配置</span>
          </n-space>
        </template>
        <n-space>
          <n-tag v-for="param in getExistingDeviceParameters()" :key="param.key" size="small" type="info">
            {{ param.key }}: {{ param.value }}
          </n-tag>
        </n-space>
        <template #action>
          <n-button size="small" text type="primary" @click="editDeviceConfig">重新配置</n-button>
        </template>
      </n-alert>
    </div>

    <!-- 🎯 重构：参数列表 - 一行展开所有配置项 -->
    <div v-if="parametersWithStableIds.length > 0" class="parameter-list-inline">
      <div
        v-for="(param, index) in parametersWithStableIds"
        :key="param._id"
        class="parameter-item-inline"
        :class="{
          'is-device-param-group': isDeviceParameterGroup(param),
          'is-primary-param': isDeviceParameterGroup(param) && param.parameterGroup!.role === 'primary',
          'is-secondary-param': isDeviceParameterGroup(param) && param.parameterGroup!.role !== 'primary'
        }"
        :data-param-type="param.valueMode || 'manual'"
      >
        <!-- 参数组标识 -->
        <div v-if="isDeviceParameterGroup(param)" class="param-group-indicator">
          <n-icon size="14" color="#2080f0">
            <PhonePortraitOutline />
          </n-icon>
        </div>

        <!-- 启用checkbox -->
        <n-checkbox
          v-if="showEnabled"
          :checked="param.enabled"
          @update:checked="value => updateParameter({ ...param, enabled: value }, index)"
        />

        <!-- 参数名输入 -->
        <n-input
          :value="param.key"
          :placeholder="keyPlaceholder"
          size="small"
          class="param-key-input-inline"
          @input="value => updateParameterKey(param, index, value)"
          @blur="() => ensureParameterKeyNotEmpty(param, index)"
        />

        <!-- 类型选择（下拉） -->
        <n-select
          :value="param.selectedTemplate"
          :options="
            recommendedTemplates.map(t => ({
              label: t.name,
              value: t.id
            }))
          "
          size="small"
          class="param-type-select-inline"
          @update:value="templateId => onTemplateChange(param, index, templateId)"
        />

        <!-- 值输入区域（根据类型动态显示） -->
        <div class="param-value-input-inline">
          <!-- 手动输入 -->
          <n-input
            v-if="param.valueMode === 'manual'"
            :value="param.value"
            :placeholder="valuePlaceholder"
            size="small"
            @input="value => updateParameterValue(param, index, value)"
          />

          <!-- 属性绑定 -->
          <div v-else-if="param.valueMode === 'property'" class="property-binding-inline">
            <n-input
              :value="param.value"
              placeholder="示例值"
              size="small"
              @input="value => updateParameterValue(param, index, value)"
            />
          </div>

          <!-- 组件绑定（属性/设备） -->
          <div v-else-if="param.valueMode === 'component'" class="component-binding-inline">
            <n-input :value="param.value || '(点击配置)'" size="small" readonly />
            <n-button size="small" type="primary" text @click="openComponentDrawer(param)">配置</n-button>
          </div>

          <!-- 下拉选择 -->
          <n-select
            v-else-if="param.valueMode === 'dropdown'"
            :value="param.value"
            :options="getCurrentTemplateOptions(param)"
            :filterable="isCustomInputAllowed(param)"
            :tag="isCustomInputAllowed(param)"
            size="small"
            placeholder="选择或输入值"
            @update:value="value => updateParameter({ ...param, value: value }, index)"
          />
        </div>

        <!-- 操作按钮 - 使用小图标 -->
        <n-space class="param-actions-inline" :size="4">
          <!-- 普通参数 - 只显示删除图标 -->
          <template v-if="!isDeviceParameterGroup(param)">
            <n-button size="small" type="error" quaternary circle @click="removeParameter(index)">
              <template #icon>
                <n-icon><TrashOutline /></n-icon>
              </template>
            </n-button>
          </template>

          <!-- 参数组（主参数） - 编辑和删除图标 -->
          <template v-else-if="param.parameterGroup!.role === 'primary'">
            <n-button size="small" type="info" quaternary circle @click="editParameterGroup(param)">
              <template #icon>
                <n-icon><EditOutline /></n-icon>
              </template>
            </n-button>
            <n-button size="small" type="error" quaternary circle @click="deleteParameterGroup(param)">
              <template #icon>
                <n-icon><TrashOutline /></n-icon>
              </template>
            </n-button>
          </template>

          <!-- 参数组（子参数） -->
          <template v-else>
            <n-text depth="3" style="font-size: 11px">设备组</n-text>
          </template>
        </n-space>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <n-text depth="3">暂无参数，点击"{{ addButtonText }}"添加</n-text>
    </div>

    <!-- 🔥 新增：添加参数抽屉 -->
    <n-drawer v-model:show="showAddParamDrawer" :width="550" placement="right">
      <n-drawer-content title="添加参数" closable>
        <n-space vertical :size="16">
          <!-- 第一步：参数名(key) -->
          <div>
            <n-text strong>参数名 (Key)</n-text>
            <n-text depth="3" style="font-size: 12px; margin-left: 8px">*必填</n-text>
            <n-input
              v-model:value="newParamConfig.key"
              placeholder="请输入参数名，如: device_id"
              size="medium"
              clearable
              style="margin-top: 8px"
            />
          </div>

          <!-- 第二步：配置类型（只有key不为空时显示） -->
          <div v-if="newParamConfig.key && newParamConfig.key.trim()">
            <n-divider />

            <div>
              <n-text strong>配置类型</n-text>
              <n-radio-group v-model:value="newParamConfig.configType" size="medium" style="margin-top: 8px">
                <n-space vertical>
                  <n-radio value="manual">
                    <n-space align="center">
                      <n-icon size="18" color="#18a058"><n-icon>✍️</n-icon></n-icon>
                      <span>手动输入</span>
                    </n-space>
                  </n-radio>
                  <n-radio value="property">
                    <n-space align="center">
                      <n-icon size="18" color="#2080f0"><LinkOutline /></n-icon>
                      <span>属性绑定</span>
                    </n-space>
                  </n-radio>
                  <n-radio value="device">
                    <n-space align="center">
                      <n-icon size="18" color="#f0a020"><DeviceIcon /></n-icon>
                      <span>设备配置</span>
                    </n-space>
                  </n-radio>
                </n-space>
              </n-radio-group>
            </div>

            <n-divider />

            <!-- 根据配置类型显示不同的表单 -->
            <!-- 手动输入表单 -->
            <div v-if="newParamConfig.configType === 'manual'">
              <n-space vertical :size="12">
                <div>
                  <n-text strong>参数值</n-text>
                  <n-input
                    v-model:value="newParamConfig.value"
                    placeholder="请输入参数值"
                    size="medium"
                    clearable
                    style="margin-top: 8px"
                  />
                </div>

                <div>
                  <n-text strong>描述（可选）</n-text>
                  <n-input
                    v-model:value="newParamConfig.description"
                    placeholder="请输入参数描述"
                    size="medium"
                    type="textarea"
                    :rows="3"
                    clearable
                    style="margin-top: 8px"
                  />
                </div>
              </n-space>
            </div>

            <!-- 属性绑定表单 - 复用现有组件 -->
            <div v-else-if="newParamConfig.configType === 'property'">
              <n-text strong>属性绑定配置</n-text>
              <div style="margin-top: 12px">
                <ComponentPropertySelector
                  :value="newParamConfig.propertyBinding"
                  :current-component-id="currentComponentId"
                  @change="handleNewParamPropertyChange"
                />
              </div>

              <n-divider />

              <div>
                <n-text strong>描述（可选）</n-text>
                <n-input
                  v-model:value="newParamConfig.description"
                  placeholder="请输入参数描述"
                  size="medium"
                  type="textarea"
                  :rows="2"
                  clearable
                  style="margin-top: 8px"
                />
              </div>
            </div>

            <!-- 设备配置表单 - 复用现有组件 -->
            <div v-else-if="newParamConfig.configType === 'device'">
              <n-text strong>设备配置</n-text>
              <div style="margin-top: 12px">
                <UnifiedDeviceConfigSelector
                  :parameter-type="parameterType"
                  :existing-parameters="modelValue"
                  @confirm="handleNewParamDeviceConfigChange"
                />
              </div>

              <n-divider />

              <div>
                <n-text strong>描述（可选）</n-text>
                <n-input
                  v-model:value="newParamConfig.description"
                  placeholder="请输入参数描述"
                  size="medium"
                  type="textarea"
                  :rows="2"
                  clearable
                  style="margin-top: 8px"
                />
              </div>
            </div>
          </div>
        </n-space>

        <template #footer>
          <n-space justify="end">
            <n-button @click="cancelNewParam">取消</n-button>
            <n-button
              type="primary"
              :disabled="!newParamConfig.key || !newParamConfig.key.trim()"
              @click="confirmNewParam"
            >
              确认添加
            </n-button>
          </n-space>
        </template>
      </n-drawer-content>
    </n-drawer>

    <!-- 从设备添加参数抽屉 -->
    <n-drawer v-model:show="isAddFromDeviceDrawerVisible" :width="500">
      <n-drawer-content title="从设备添加参数" closable>
        <AddParameterFromDevice @add="handleAddFromDevice" @cancel="isAddFromDeviceDrawerVisible = false" />
      </n-drawer-content>
    </n-drawer>

    <!-- 组件编辑抽屉 -->
    <n-drawer v-model:show="isDrawerVisible" :width="500" :on-after-leave="() => (drawerParam = null)">
      <n-drawer-content :title="`编辑 ${getComponentTemplate(drawerParam)?.name || '参数'}`" closable>
        <template v-if="drawerParam">
          <!-- 组件属性选择器 -->
          <component
            :is="getComponentTemplate(drawerParam)?.component"
            v-if="getComponentTemplate(drawerParam)?.component"
            :value="drawerParam.value"
            v-bind="getComponentTemplate(drawerParam)?.props || {}"
            @change="handleComponentPropertyChange"
          />
          <div v-else>组件加载失败</div>

          <!-- 默认值输入框 -->
          <div v-if="drawerParam.selectedTemplate === 'component-property-binding'" style="margin-top: 16px">
            <n-divider />
            <div style="margin-bottom: 8px">
              <n-text strong>默认值设置</n-text>
              <n-text depth="3" style="font-size: 12px; margin-left: 8px">当绑定的组件属性为空时使用</n-text>
            </div>
            <n-input v-model:value="drawerParam.defaultValue" placeholder="请输入默认值（可选）" clearable />
            <n-text depth="3" style="font-size: 12px; margin-top: 4px; display: block">
              💡 提示：如果组件属性值为空（null、undefined或空字符串），将使用此默认值
            </n-text>
          </div>
        </template>
        <template #footer>
          <n-button @click="isDrawerVisible = false">取消</n-button>
          <n-button type="primary" @click="saveDrawerChanges">确定</n-button>
        </template>
      </n-drawer-content>
    </n-drawer>

    <!-- 🔥 统一设备配置选择器 -->
    <n-drawer v-model:show="isUnifiedDeviceConfigVisible" width="650" placement="right">
      <n-drawer-content title="设备配置" closable>
        <UnifiedDeviceConfigSelector
          :existing-parameters="getExistingDeviceParameters()"
          :edit-mode="isEditingDeviceConfig"
          @parameters-generated="handleUnifiedDeviceConfigGenerated"
          @cancel="
            () => {
              isUnifiedDeviceConfigVisible = false
              isEditingDeviceConfig = false
            }
          "
        />
      </n-drawer-content>
    </n-drawer>

    <!-- 🔥 新的设备参数选择器（保留兼容） -->
    <DeviceParameterSelector
      :visible="isDeviceParameterSelectorVisible"
      :editing-group-id="editingGroupInfo?.groupId"
      :pre-selected-device="editingGroupInfo?.preSelectedDevice"
      :pre-selected-metric="editingGroupInfo?.preSelectedMetric"
      :pre-selected-mode="editingGroupInfo?.preSelectedMode"
      @update:visible="isDeviceParameterSelectorVisible = $event"
      @parameters-selected="handleDeviceParametersSelected"
      @parameters-updated="handleParametersUpdated"
    />
  </div>
</template>

<style scoped>
/* 🎯 优化2：增强版编辑器样式 */
.dynamic-parameter-editor-v3-enhanced {
  width: 100%;
  font-size: 12px;
}

/* 兼容旧版class名 */
.dynamic-parameter-editor-v3 {
  width: 100%;
  font-size: 12px;
}

/* 🎯 优化2：增强的编辑器头部 */
.editor-header-enhanced {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: linear-gradient(135deg, var(--primary-color-suppl) 0%, transparent 100%);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.editor-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color-1);
}

/* 🔥 新增参数表单区域 */
.new-param-form {
  margin-bottom: 16px;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.config-form-content {
  margin-top: 8px;
}

/* 🔥 设备配置信息区域 */
.device-config-info {
  margin-bottom: 16px;
}

.parameter-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 🎯 优化2：参数类型视觉分组 - 通过边框颜色区分 */
.parameter-item {
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-left-width: 3px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

/* 🎯 优化2：手动参数 - 蓝色边框 */
.parameter-item:has([data-param-type='manual']) {
  border-left-color: var(--info-color);
}

/* 🎯 优化2：属性绑定参数 - 绿色边框 */
.parameter-item:has([data-param-type='property']) {
  border-left-color: var(--success-color);
}

/* 🎯 优化2：组件绑定参数 - 绿色边框（深色） */
.parameter-item:has([data-param-type='component']) {
  border-left-color: var(--success-color);
  background: linear-gradient(90deg, var(--success-color-suppl) 0%, var(--card-color) 20%);
}

.parameter-item.is-editing {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-suppl);
  border-left-width: 4px;
}

/* 🔥 参数组样式增强 */
.parameter-item.is-device-param-group {
  border-left: 3px solid var(--primary-color);
  background: linear-gradient(90deg, var(--primary-color-suppl) 0%, var(--card-color) 30%);
}

.parameter-item.is-primary-param {
  border-left-color: var(--primary-color);
  box-shadow: 0 2px 4px rgba(32, 128, 240, 0.1);
}

.parameter-item.is-secondary-param {
  border-left-color: var(--info-color);
  margin-left: 16px;
  position: relative;
}

.parameter-item.is-secondary-param::before {
  content: '';
  position: absolute;
  left: -16px;
  top: 50%;
  width: 12px;
  height: 1px;
  background: var(--border-color);
  transform: translateY(-50%);
}

.parameter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

.param-key-input {
  width: 150px;
}

/* 🔥 参数组指示器样式 */
.param-group-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: var(--primary-color-suppl);
  border-radius: 4px;
  flex-shrink: 0;
}

/* 参数值显示区域增强 */
.param-value-display {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
}

.param-value-summary {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text-color-3);
}

/* 参数角色标识 */
.param-role-tag {
  flex-shrink: 0;
  font-size: 10px;
  padding: 2px 6px;
}

.param-actions {
  margin-left: auto;
  flex-shrink: 0;
}

.details-panel {
  padding: 12px;
  border-top: 1px solid var(--border-color);
  background: var(--body-color);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: grid;
  grid-template-columns: 80px 1fr;
  align-items: center;
  gap: 8px;
}

.detail-label {
  font-weight: 500;
  color: var(--text-color-2);
}

.component-placeholder {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: var(--action-color);
  border-radius: 4px;
  width: 100%;
}

/* 简化版的属性绑定提示样式 */
.property-binding-tip {
  margin-top: 8px;
}

.property-binding-tip :deep(.n-alert) {
  --n-padding: 8px 12px;
  --n-font-size: 12px;
}

.property-binding-tip :deep(.n-alert__header) {
  display: flex;
  align-items: center;
  font-weight: 500;
}

/* 简化版样式 */
.property-input-simple {
  width: 100%;
}

.component-simple {
  display: flex;
  align-items: center;
  padding: 4px;
  background: var(--success-color-suppl);
  border-radius: 4px;
}

.empty-state {
  padding: 24px;
  text-align: center;
  background: var(--body-color);
  border: 1px dashed var(--border-color);
  border-radius: 6px;
}

/* 🎯 新增：一行展开的参数列表样式 */
.parameter-list-inline {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.parameter-item-inline {
  display: grid;
  grid-template-columns: auto auto 250px 180px 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-left-width: 3px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.parameter-item-inline:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

/* 参数类型视觉分组 - 通过边框颜色 */
.parameter-item-inline[data-param-type='manual'] {
  border-left-color: var(--info-color);
}

.parameter-item-inline[data-param-type='property'] {
  border-left-color: var(--success-color);
  background: linear-gradient(90deg, var(--success-color-suppl) 0%, var(--card-color) 15%);
}

.parameter-item-inline[data-param-type='component'] {
  border-left-color: var(--warning-color);
  background: linear-gradient(90deg, var(--warning-color-suppl) 0%, var(--card-color) 15%);
}

/* 参数组样式 */
.parameter-item-inline.is-device-param-group {
  border-left-color: var(--primary-color);
  border-left-width: 4px;
}

.parameter-item-inline.is-secondary-param {
  margin-left: 20px;
  opacity: 0.95;
}

/* 参数名输入框 */
.param-key-input-inline {
  width: 100%;
}

/* 类型选择下拉 */
.param-type-select-inline {
  width: 100%;
}

/* 值输入区域 */
.param-value-input-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.property-binding-inline,
.component-binding-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.component-binding-inline .n-input {
  flex: 1;
}

/* 操作按钮 */
.param-actions-inline {
  flex-shrink: 0;
}
</style>
