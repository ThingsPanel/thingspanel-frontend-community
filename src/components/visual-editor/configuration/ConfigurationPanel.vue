·
<template>
  <div class="configuration-panel">
    <!-- 全局设置 (无选中组件时显示) -->
    <div v-if="!selectedWidget" class="global-settings">
      <h3 class="panel-title">{{ $t('config.global.title') }}</h3>

      <!-- 画布全局设置 -->
      <n-form label-placement="left" label-width="auto" size="small" class="global-form">
        <n-form-item :label="$t('config.global.showWidgetTitles')">
          <n-switch :value="showWidgetTitles" @update:value="onToggleWidgetTitles" />
        </n-form-item>

        <n-form-item v-if="gridConfig" :label="$t('config.global.gridConfig')">
          <n-space vertical size="small">
            <div class="grid-config-item">
              <span>{{ $t('config.global.columns') }}:</span>
              <n-input-number
                v-model:value="gridConfig.colNum"
                :min="1"
                :max="48"
                size="small"
                @update:value="handleGridConfigChange"
              />
            </div>
            <div class="grid-config-item">
              <span>{{ $t('config.global.rowHeight') }}:</span>
              <n-input-number
                v-model:value="gridConfig.rowHeight"
                :min="20"
                :max="200"
                size="small"
                @update:value="handleGridConfigChange"
              />
            </div>
          </n-space>
        </n-form-item>
      </n-form>
    </div>

    <!-- 组件配置 (选中组件时显示) -->
    <div v-else class="widget-configuration">
      <!-- 配置面板标题 -->
      <div class="config-header">
        <h3 class="panel-title">{{ widgetDisplayName }} {{ $t('config.widget.settings') }}</h3>
      </div>

      <!-- 配置标签页 - 动态结构 -->
      <n-tabs v-model:value="activeTab" type="line" animated size="small" class="config-tabs">
        <!-- 动态生成配置标签页 -->
        <n-tab-pane v-for="layer in configLayers" :key="layer.name" :name="layer.name" :tab="$t(layer.label)">
          <!-- Base配置特殊处理 -->
          <template v-if="layer.name === 'base'">
            <component
              :is="layer.component"
              v-model="baseConfig"
              :node-id="selectedWidget?.id || ''"
              :readonly="readonly"
              @apply="handleBaseConfigApply"
              @reset="handleBaseConfigReset"
            />
          </template>

          <!-- 组件配置特殊处理 -->
          <template v-else-if="layer.name === 'component'">
            <component
              :is="layer.component"
              v-model="componentConfig"
              :widget="selectedWidget"
              :readonly="readonly"
              @validate="handleValidation"
              @update="handleComponentConfigUpdate"
            />
          </template>

          <!-- 数据源配置特殊处理 -->
          <template v-else-if="layer.name === 'dataSource'">
            <div class="data-source-config">
              <!-- 使用现有的数据源配置组件 -->
              <component
                :is="layer.component"
                ref="dataSourceConfigRef"
                :data-sources="componentDataSources"
                :selected-widget-id="selectedWidget?.id"
                :initial-config="dataSourceConfig?.config"
                @update="handleDataSourceConfigUpdate"
              />
            </div>
          </template>

          <!-- 交互配置特殊处理 -->
          <template v-else-if="layer.name === 'interaction'">
            <component
              :is="layer.component"
              v-model="interactionConfigList"
              :component-id="selectedWidget?.id"
              :component-type="selectedWidget?.type"
              :readonly="readonly"
              @validate="handleValidation"
              @change="handleInteractionConfigChange"
            />
          </template>

          <!-- 默认通用处理 -->
          <template v-else>
            <component :is="layer.component" v-bind="getLayerProps(layer)" @validate="handleValidation" />
          </template>
        </n-tab-pane>
      </n-tabs>

      <!-- 配置状态信息 -->
      <div v-if="configurationStatus" class="config-status">
        <n-alert v-if="!configurationStatus.valid" type="error" :title="$t('config.status.error')" size="small">
          <ul v-if="configurationStatus.errors">
            <li v-for="error in configurationStatus.errors" :key="error.field">
              {{ error.field }}: {{ error.message }}
            </li>
          </ul>
        </n-alert>

        <n-alert
          v-else-if="configurationStatus.warnings?.length"
          type="warning"
          :title="$t('config.status.warning')"
          size="small"
        >
          <ul>
            <li v-for="warning in configurationStatus.warnings" :key="warning.field">
              {{ warning.field }}: {{ warning.message }}
            </li>
          </ul>
        </n-alert>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
/**
 * V6配置面板组件 - 纯粹的数据协调器
 * 简化的配置面板，直接传递definition和配置数据，专注于协调数据流
 */

import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import {
  NTabs,
  NTabPane,
  NForm,
  NFormItem,
  NInputNumber,
  NSwitch,
  NSpace,
  NButton,
  NIcon,
  NDropdown,
  NModal,
  NCard,
  NInput,
  NAlert,
  NEmpty,
  NDivider,
  useMessage
} from 'naive-ui'
import { Settings as SettingsIcon, DocumentOutline } from '@vicons/ionicons5'

// 导入配置组件注册中心
import { getVisibleConfigLayers, getConfigLayer } from './component-registry'

// 导入配置管理器和类型
import { configurationManager } from './ConfigurationManager'
import { getComponentDataRequirements } from '../core/component-data-requirements'
import type {
  WidgetConfiguration,
  ComponentConfiguration,
  DataSourceConfiguration,
  InteractionConfiguration,
  ValidationResult
} from './types'
import type { VisualEditorWidget } from '../types'

// 🔥 新增：导入执行器管理器
import { componentExecutorManager } from '@/core/data-source-system/managers/ComponentExecutorManager'

interface Props {
  /** 选中的组件 */
  selectedWidget: VisualEditorWidget | null
  /** 网格配置 */
  gridConfig?: any
  /** 网格配置变更回调 */
  onGridConfigChange?: (config: any) => void
  /** 是否显示组件标题 */
  showWidgetTitles?: boolean
  /** 切换显示标题回调 */
  onToggleWidgetTitles?: (value: boolean) => void
  /** 是否只读模式 */
  readonly?: boolean
}

interface Emits {
  (e: 'toggle-widget-titles', value: boolean): void
  (e: 'grid-config-change', config: any): void
  (e: 'multi-data-source-update', widgetId: string, dataSources: Record<string, any>): void
  (e: 'multi-data-source-config-update', widgetId: string, config: any): void
  (e: 'request-current-data', widgetId: string): void
  (
    e: 'data-source-manager-update',
    payload: { componentId: string; componentType: string; config: any; action: string }
  ): void
}

const props = withDefaults(defineProps<Props>(), {
  selectedWidget: null,
  readonly: false,
  showWidgetTitles: false
})

const emit = defineEmits<Emits>()

// 消息提示
const message = useMessage()

// 获取配置层级定义
const configLayers = computed(() => getVisibleConfigLayers())

// 响应式状态 - 默认显示第一个可见层级
const activeTab = ref(configLayers.value[0]?.name || 'base')

// 多数据源数据状态
const multiDataSourceData = ref<Record<string, any>>({})

// V6数据映射配置状态 - 初始化正确的结构
const dataMappingConfig = ref<any>({
  dataSourceBindings: {}
})

// DataSourceConfigForm 组件引用
const dataSourceFormRef = ref<any>(null)

// DataSourceConfigForm 组件引用（现有系统）
const dataSourceConfigRef = ref<any>(null)

// 配置数据
const baseConfig = ref({})
const componentConfig = ref<ComponentConfiguration>({
  properties: {},
  styles: {},
  behavior: {},
  validation: { required: [], rules: {} }
})

const dataSourceConfig = ref<DataSourceConfiguration | null>(null)

const interactionConfig = ref<InteractionConfiguration>({})

// 配置状态
const configurationStatus = ref<ValidationResult | null>(null)

// 计算属性
const interactionConfigList = computed({
  get: () => {
    // 从 interactionConfig 中提取 configs 数组，如果没有则返回空数组
    return interactionConfig.value.configs || []
  },
  set: newConfigs => {
    // 将配置数组存储到 interactionConfig 中
    interactionConfig.value = {
      ...interactionConfig.value,
      configs: newConfigs,
      enabled: true,
      metadata: {
        ...interactionConfig.value.metadata,
        updatedAt: Date.now()
      }
    }
  }
})
const widgetDisplayName = computed(() => {
  if (!props.selectedWidget) return ''
  return props.selectedWidget.metadata?.card2Definition?.name || props.selectedWidget.type || 'Unknown Component'
})


// V6: 获取组件定义 - 直接从组件元数据获取
const componentDefinition = computed(() => {
  if (!props.selectedWidget) return null

  // V6: 优先从Card2.1组件元数据获取定义
  const card2Definition = props.selectedWidget.metadata?.card2Definition
  if (card2Definition) {
    return card2Definition
  }

  // 回退到传统的数据需求获取方式
  return getComponentDataRequirements(props.selectedWidget.type)
})

// 组件数据源信息 - 适配现有 DataSourceConfigForm 的数据格式
const componentDataSources = computed(() => {
  const definition = componentDefinition.value

  // 🔥 修复：处理 Card2.1 组件的 dataRequirements 格式
  if (definition?.dataRequirements) {
    console.log('🔧 [ConfigurationPanel] 从 dataRequirements 转换数据源配置:', definition.dataRequirements)

    // 🔥 处理多数据源：为每个 dataFields 项创建独立的数据源配置
    if (definition.dataRequirements.dataFields && Array.isArray(definition.dataRequirements.dataFields)) {
      console.log('🔧 [ConfigurationPanel] 检测到多数据源配置:', definition.dataRequirements.dataFields)

      return definition.dataRequirements.dataFields.map((field: any) => {
        // 为每个数据字段创建字段映射
        const fieldMappings: Record<string, any> = {
          [field.name]: {
            path: field.name,
            type: field.type,
            description: field.description || '',
            required: field.required || false
          }
        }

        // 如果有示例数据，添加到字段映射中
        if (field.example) {
          fieldMappings[field.name].example = field.example
        }

        return {
          key: field.name, // 使用字段名作为key（如 dataSource1, dataSource2）
          name: field.description || field.name, // 使用描述作为显示名称
          type: field.type || 'object',
          fieldsToMap: [
            {
              key: field.name,
              targetProperty: field.type || 'object'
            }
          ],
          fieldMappings,
          expectedDataFormat: field.type || 'object',
          validationRules: {},
          description: field.description || `${field.name} 数据源`,
          example: field.example // 传递示例数据
        }
      })
    }

    // 🔥 回退：处理单数据源格式（使用 primaryData）
    if (definition.dataRequirements.primaryData) {
      const primaryData = definition.dataRequirements.primaryData
      const fieldMappings: Record<string, any> = {
        [primaryData.name]: {
          path: primaryData.name,
          type: primaryData.type,
          description: primaryData.description || '',
          required: primaryData.required || false
        }
      }

      return [
        {
          key: primaryData.name || 'main',
          name: primaryData.description || primaryData.name || '主数据源',
          type: primaryData.type || 'object',
          fieldsToMap: [
            {
              key: primaryData.name,
              targetProperty: primaryData.type || 'object'
            }
          ],
          fieldMappings,
          expectedDataFormat: primaryData.type || 'object',
          validationRules: {},
          description: primaryData.description || '组件的主要数据源'
        }
      ]
    }

    // 🔥 最后回退：兼容旧格式 (fields/primary)
    const fieldsToMap = definition.dataRequirements.fields?.map((field: any) => ({
      key: field.name,
      targetProperty: field.type || 'string'
    })) || [
      { key: 'value', targetProperty: 'string' },
      { key: 'label', targetProperty: 'string' },
      { key: 'status', targetProperty: 'string' }
    ]
    const fieldMappings: Record<string, any> = {}

    // 构建字段映射
    definition.dataRequirements.fields?.forEach((field: any) => {
      fieldMappings[field.name] = {
        path: field.name,
        type: field.type,
        description: field.description || '',
        required: field.required || false
      }
    })

    return [
      {
        key: 'main',
        name: definition.dataRequirements.primary?.name || '主数据源',
        type: definition.dataRequirements.primary?.type || 'object',
        fieldsToMap,
        fieldMappings,
        expectedDataFormat: definition.dataRequirements.primary?.type || 'object',
        validationRules: {},
        description: definition.dataRequirements.primary?.description || '组件的主要数据源'
      }
    ]
  }

  // 🔥 处理标准的 dataSources 格式
  if (definition?.dataSources) {
    return definition.dataSources.map((dataSource: any) => ({
      key: dataSource.key || dataSource.name,
      name: dataSource.name,
      type: dataSource.type || 'unknown',
      fieldsToMap: dataSource.fieldsToMap || [],
      fieldMappings: dataSource.fieldMappings || {},
      expectedDataFormat: dataSource.expectedDataFormat,
      validationRules: dataSource.validationRules || {}
    }))
  }

  // 🔥 如果都没有找到，提供默认配置
  console.log('🔧 [ConfigurationPanel] 没有找到组件数据源定义，提供默认配置')
  return [
    {
      key: 'main',
      name: '主数据源',
      type: 'object',
      fieldsToMap: ['value', 'label', 'status', 'timestamp'],
      fieldMappings: {
        value: { path: 'value', type: 'number', description: '数值' },
        label: { path: 'label', type: 'string', description: '标签' },
        status: { path: 'status', type: 'string', description: '状态' },
        timestamp: { path: 'timestamp', type: 'string', description: '时间戳' }
      },
      expectedDataFormat: 'object',
      validationRules: {},
      description: '组件的主要数据源，支持各种数据格式'
    }
  ]
})

// 增强的数据源信息 - 包含完整的组件定义信息（保持向后兼容）
const enrichedDataSources = computed(() => {
  // 🔥 修复：使用 componentDataSources 的结果，确保一致性
  const basicDataSources = componentDataSources.value

  if (!basicDataSources || basicDataSources.length === 0) {
    return []
  }

  return basicDataSources.map(dataSource => ({
    ...dataSource,
    // 传递完整的字段映射规则
    fieldMappings: dataSource.fieldMappings || {},
    // 从组件定义中提取示例数据
    exampleData: extractExampleDataFromDefinition(dataSource),
    // 数据处理脚本（如果有）
    dataProcessScript: dataSource.dataProcessScript || '',
    // 传递标签信息
    label: dataSource.name || dataSource.key
  }))
})

/**
 * 从组件定义中提取示例数据
 * 优先级：fieldMappings.defaultValue > 组件config中的默认数据 > 通用示例
 */
function extractExampleDataFromDefinition(dataSource: any) {
  console.log('🔧 [DEBUG-DataSource] 解析数据源定义:', {
    key: dataSource.key,
    hasFieldMappings: !!dataSource.fieldMappings,
    fieldMappingsKeys: dataSource.fieldMappings ? Object.keys(dataSource.fieldMappings) : [],
    hasFieldsToMap: !!dataSource.fieldsToMap
  })

  // 1. 从 fieldMappings 的 defaultValue 构建示例数据
  if (dataSource.fieldMappings) {
    const exampleFromMappings: Record<string, any> = {}
    let hasDefaults = false

    Object.entries(dataSource.fieldMappings).forEach(([sourceKey, mapping]: [string, any]) => {
      if (mapping.defaultValue !== undefined) {
        exampleFromMappings[sourceKey] = mapping.defaultValue
        hasDefaults = true
      }
    })

    if (hasDefaults) {
      console.log('🔧 [DEBUG-DataSource] 使用 fieldMappings 默认值构建示例数据:', exampleFromMappings)
      return exampleFromMappings
    }
  }

  // 2. 检查组件元数据中的测试数据
  if (componentDefinition.value?.metadata?.testData) {
    const testData = componentDefinition.value.metadata.testData[dataSource.key]
    if (testData) {
      console.log('✅ 使用组件元数据测试数据:', testData)
      return testData
    }
  }

  // 3. 使用通用默认数据
  console.log('ℹ️ 使用通用默认示例数据')
  return null // 返回 null，让 DataSourceConfigForm 使用自己的默认数据生成逻辑
}


// 配置变更监听器清理函数
let configChangeCleanup: (() => void) | null = null

// 防循环标记
let isUpdatingFromManager = false

// 监听配置变化并同步到ConfigurationManager
watch(
  [baseConfig, componentConfig, dataSourceConfig, interactionConfig, dataMappingConfig],
  () => {
    // 防止循环更新：如果是从ConfigurationManager更新的，不再同步回去
    if (props.selectedWidget && !isUpdatingFromManager) {
      console.log(`🔧 [ConfigurationPanel] 配置变化触发同步: ${props.selectedWidget.id}`)
      syncConfigurationToManager()
    }
  },
  { deep: true }
)

// V6: 监听数据映射配置变化，自动处理持久化和应用
watch(
  dataMappingConfig,
  async newConfig => {
    if (!props.selectedWidget) return

    // 🔥 修复：防止配置加载时触发不必要的事件
    if (isUpdatingFromManager) {
      console.log('🔧 [V6ConfigPanel] 配置加载中，跳过自动应用:', newConfig)
      return
    }

    // 更新dataSourceConfig以保持持久化
    if (newConfig && Object.keys(newConfig).length > 0) {
      dataSourceConfig.value = {
        type: 'data-source-bindings',  // 🔧 修复：使用正确的类型
        enabled: true,
        config: { ...newConfig },
        metadata: {
          componentType: props.selectedWidget.type,
          mappingType: 'json-path',
          updatedAt: Date.now()
        }
      }

      console.log('🎯 [V6ConfigPanel] 数据映射配置变化，自动应用:', newConfig)

      // 🔥 新增：通过执行器管理器执行数据获取
      try {
        console.log('🚀 [V6ConfigPanel] 调用执行器管理器执行数据获取:', props.selectedWidget.id)

        const executionResult = await componentExecutorManager.updateComponentExecutor(
          props.selectedWidget.id,
          props.selectedWidget.type,
          newConfig
        )

        if (executionResult?.success) {
          console.log('✅ [V6ConfigPanel] 数据执行成功:', executionResult.data)
        } else {
          console.warn('⚠️ [V6ConfigPanel] 数据执行失败:', executionResult?.error)
        }
      } catch (error) {
        console.error('❌ [V6ConfigPanel] 执行器调用异常:', error)
      }

      // 保持原有的事件发射（向后兼容）
      emit('multi-data-source-config-update', props.selectedWidget.id, newConfig)
    } else {
      // 重置为空的正确结构，不是null
      dataSourceConfig.value = null

      // 🔥 新增：清理执行器
      if (props.selectedWidget) {
        componentExecutorManager.cleanupExecutor(props.selectedWidget.id)
      }
    }
  },
  { deep: true }
)

// 🔥 新增：执行器数据更新回调清理函数
let executorDataUpdateCleanup: (() => void) | null = null

// 生命周期
onMounted(() => {
  console.log('ConfigurationPanel 已挂载')

  // 🔥 新增：注册执行器数据更新回调
  executorDataUpdateCleanup = componentExecutorManager.onDataUpdate((componentId, data) => {
    console.log('🔄 [ConfigurationPanel] 收到执行器数据更新:', componentId, data)

    // 如果是当前选中的组件，发射数据更新事件
    if (props.selectedWidget?.id === componentId) {
      console.log('✅ [ConfigurationPanel] 发射组件数据更新事件:', componentId, data)
      emit('multi-data-source-update', componentId, data)
    }
  })
})

onUnmounted(() => {
  if (configChangeCleanup) {
    configChangeCleanup()
  }

  // 🔥 新增：清理执行器数据更新回调
  if (executorDataUpdateCleanup) {
    executorDataUpdateCleanup()
  }
})

// 方法实现

/**
 * 加载组件配置
 */
const loadWidgetConfiguration = async (widgetId: string) => {
  console.log('ConfigurationPanel - 加载组件配置:', widgetId)

  // 设置防循环标记
  isUpdatingFromManager = true

  try {
    let config = configurationManager.getConfiguration(widgetId)

    if (!config) {
      // 初始化默认配置
      configurationManager.initializeConfiguration(widgetId)
      config = configurationManager.getConfiguration(widgetId)
      console.log('ConfigurationPanel - 已初始化默认配置')
    }

    if (config) {
      // 🔧 现在加载所有层级的配置
      baseConfig.value = { ...config.base }
      componentConfig.value = { ...config.component }
      dataSourceConfig.value = config.dataSource ? { ...config.dataSource } : null
      interactionConfig.value = { ...config.interaction }

      // 🔍 [DEBUG-配置面板] 标签页切换时的完整配置打印
      console.log('🔍 [DEBUG-配置面板] 加载配置时的完整对象:', {
        widgetId,
        fullConfig: JSON.parse(JSON.stringify(config)),
        dataSourceConfig: config.dataSource ? JSON.parse(JSON.stringify(config.dataSource)) : null,
        hasDataSourceBindings: !!(config.dataSource?.config?.dataSourceBindings)
      })

      // V6: 直接恢复数据映射配置
      if (config.dataSource?.config) {
        dataMappingConfig.value = { ...config.dataSource.config }
        console.log('✅ [ConfigurationPanel] 恢复数据映射配置:', dataMappingConfig.value)
        console.log('🔍 [ConfigurationPanel] 检查dataSourceBindings:', config.dataSource.config.dataSourceBindings)
      } else {
        dataMappingConfig.value = { dataSourceBindings: {} }
        console.log('ℹ️ [ConfigurationPanel] 使用默认空配置')
      }

      // 🔥 新增：如果有保存的数据源配置，重新执行数据获取
      if (config.dataSource?.config && Object.keys(config.dataSource.config).length > 0) {
        console.log('🔄 [ConfigurationPanel] 恢复配置后重新执行数据获取')
        
        try {
          const executionResult = await componentExecutorManager.updateComponentExecutor(
            widgetId,
            props.selectedWidget?.type || '',
            config.dataSource.config
          )
          
          if (executionResult?.success) {
            console.log('✅ [ConfigurationPanel] 配置恢复后数据执行成功')
          }
        } catch (error) {
          console.warn('⚠️ [ConfigurationPanel] 配置恢复后数据执行失败:', error)
        }
      }

      console.log('ConfigurationPanel - 配置加载完成:', config)
    }
  } catch (error) {
    console.error('加载组件配置失败:', error)
    message.error('配置加载失败')
  } finally {
    // 重置防循环标记
    setTimeout(() => {
      isUpdatingFromManager = false
    }, 0)
  }
}

/**
 * 处理来自ConfigurationManager的配置变化
 */
const handleConfigurationChange = (config: WidgetConfiguration) => {
  console.log('ConfigurationPanel - 接收到配置变化:', config)

  // 设置防循环标记
  isUpdatingFromManager = true

  try {
    // 更新本地配置状态
    // 🔧 现在加载所有层级的配置
    baseConfig.value = { ...config.base }
    componentConfig.value = { ...config.component }
    dataSourceConfig.value = config.dataSource ? { ...config.dataSource } : null
    interactionConfig.value = { ...config.interaction }

    // V6: 简化配置变化处理
    if (config.dataSource?.config) {
      dataMappingConfig.value = { ...config.dataSource.config }
    } else {
      dataMappingConfig.value = { dataSourceBindings: {} }
    }

    console.log('ConfigurationPanel - 本地配置已更新')
  } finally {
    // 重置防循环标记
    setTimeout(() => {
      isUpdatingFromManager = false
    }, 0)
  }
}

/**
 * 同步本地配置到ConfigurationManager
 */
const syncConfigurationToManager = async () => {
  if (!props.selectedWidget) return

  try {
    const config: WidgetConfiguration = {
      base: { ...baseConfig.value }, // 🔧 现在包含base配置
      component: { ...componentConfig.value },
      dataSource: dataSourceConfig.value ? { ...dataSourceConfig.value } : {},
      interaction: { ...interactionConfig.value },
      metadata: {
        version: '1.0.0',
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    }

    configurationManager.setConfiguration(props.selectedWidget.id, config)
  } catch (error) {
    console.error('配置同步失败:', error)
  }
}

/**
 * 重置本地配置
 */
const resetLocalConfiguration = () => {
  // 🔧 重置所有配置层级
  baseConfig.value = {}
  componentConfig.value = {
    properties: {},
    styles: {},
    behavior: {},
    validation: { required: [], rules: {} }
  }

  dataSourceConfig.value = null
  interactionConfig.value = { configs: [], enabled: true }
  configurationStatus.value = null

  // V6: 重置数据映射配置为正确结构
  dataMappingConfig.value = { dataSourceBindings: {} }
  console.log('🔧 [V6ConfigPanel] 本地配置已重置')
}

/**
 * 处理验证结果
 */
const handleValidation = (result: ValidationResult) => {
  configurationStatus.value = result
}

/**
 * 处理多数据源数据更新
 */
const handleDataSourceUpdate = (data: Record<string, any>) => {
  console.log(`🔧 [ConfigurationPanel] 多数据源数据更新:`, data)

  // 更新本地数据状态
  multiDataSourceData.value = { ...data }

  // 发射事件给父组件，传递给实际的组件
  if (props.selectedWidget) {
    emit('multi-data-source-update', props.selectedWidget.id, data)
    console.log(`🔧 [ConfigurationPanel] 发射多数据源更新事件: ${props.selectedWidget.id}`, data)
  }
}

/**
 * 处理动态数据源更新
 */
const handleDynamicDataSourceUpdate = (key: string, data: any) => {
  console.log(`🔧 [ConfigurationPanel] 动态数据源更新 ${key}:`, data)

  // 更新本地数据状态
  multiDataSourceData.value = {
    ...multiDataSourceData.value,
    [key]: data
  }

  // 同时更新 ConfigurationManager 中的数据源配置
  if (props.selectedWidget) {
    // 创建符合 Card2Wrapper 期望的数据结构
    const dataSourceBindings: Record<string, any> = {}

    // 将每个数据源的数据包装成 Card2Wrapper 期望的格式
    Object.entries(multiDataSourceData.value).forEach(([dataSourceKey, data]) => {
      dataSourceBindings[dataSourceKey] = {
        rawData: JSON.stringify(data), // Card2Wrapper 期望的 rawData 字段
        fieldMappings: {}, // 字段映射（暂时为空）
        filterPath: '' // 过滤路径（暂时为空，后续扩展）
      }
    })

    // 创建或更新数据源配置
    const dataSourceConfig: DataSourceConfiguration = {
      type: 'data-source-bindings',
      enabled: true,
      config: {
        dataSourceBindings
      },
      metadata: {
        updatedAt: Date.now()
      }
    }

    // 更新 ConfigurationManager
    configurationManager.updateConfiguration(props.selectedWidget.id, 'dataSource', dataSourceConfig)

    // 发射事件给父组件
    emit('multi-data-source-update', props.selectedWidget.id, multiDataSourceData.value)
    console.log(`🔧 [ConfigurationPanel] 发射动态数据源更新事件: ${props.selectedWidget.id}`, { [key]: data })
    console.log(`🔧 [ConfigurationPanel] 已更新 ConfigurationManager 数据源配置`)
  }
}

/**
 * 获取初始数据源值（从已保存的配置中恢复）
 */
const getInitialDataSourceValues = () => {
  if (!props.selectedWidget) {
    return {}
  }

  const config = configurationManager.getConfiguration(props.selectedWidget.id)
  const initialData: Record<string, string> = {}

  if (config?.dataSource?.type === 'data-source-bindings' && config.dataSource.config?.dataSourceBindings) {
    Object.entries(config.dataSource.config.dataSourceBindings).forEach(([key, binding]: [string, any]) => {
      if (binding.rawData) {
        initialData[key] = binding.rawData // 直接使用保存的 JSON 字符串
      }
    })
  }

  console.log('🔍 [ConfigurationPanel] 获取初始数据源值:', initialData)
  return initialData
}

/**
 * 处理来自 DataSourceConfigForm 的配置更新
 */
const handleDataSourceConfigUpdate = async (config: any) => {
  console.log('🔧 [ConfigurationPanel] 处理数据源配置更新:', config)

  if (props.selectedWidget) {
    // 将现有数据源系统的配置格式适配到编辑器
    const enhancedConfig = {
      type: 'data-source-bindings',
      enabled: true,
      config: config,
      metadata: {
        componentType: props.selectedWidget.type,
        updatedAt: Date.now(),
        source: 'data-source-config-form'
      }
    }

    // 更新到本地配置状态
    dataSourceConfig.value = enhancedConfig

    // 🔥 关键修复：保存配置到ConfigurationManager
    try {
      configurationManager.updateConfiguration(props.selectedWidget.id, 'dataSource', enhancedConfig)
      console.log('✅ [ConfigurationPanel] 配置已保存到ConfigurationManager')
    } catch (error) {
      console.error('❌ [ConfigurationPanel] 保存配置失败:', error)
    }

    // 🔥 新增：直接调用ComponentExecutorManager执行数据获取
    try {
      console.log('🚀 [ConfigurationPanel] 调用执行器管理器执行数据获取:', props.selectedWidget.id)
      
      const executionResult = await componentExecutorManager.updateComponentExecutor(
        props.selectedWidget.id,
        props.selectedWidget.type,
        config
      )

      if (executionResult?.success) {
        console.log('✅ [ConfigurationPanel] 数据执行成功:', executionResult.data)
      } else {
        console.warn('⚠️ [ConfigurationPanel] 数据执行失败:', executionResult?.error)
      }
    } catch (error) {
      console.error('❌ [ConfigurationPanel] 执行器调用异常:', error)
    }

    // 🔥 新增：同步到编辑器数据源管理器
    try {
      // 通过 emit 事件通知父组件（PanelEditor）更新数据源管理器
      emit('data-source-manager-update', {
        componentId: props.selectedWidget.id,
        componentType: props.selectedWidget.type,
        config: config,
        action: 'update'
      })

      console.log('✅ [ConfigurationPanel] 已通知父组件更新数据源管理器')
    } catch (error) {
      console.error('❌ [ConfigurationPanel] 通知数据源管理器更新失败:', error)
    }

    // 发射配置更新事件 - 优先处理 dataSourceBindings
    if (config.dataSourceBindings) {
      emit('multi-data-source-config-update', props.selectedWidget.id, config)
    } else {
      // 兼容其他格式
      emit('multi-data-source-config-update', props.selectedWidget.id, config)
    }

    console.log('🔧 [ConfigurationPanel] 数据源配置已更新:', enhancedConfig)
  }
}

/**
 * 处理来自 EditorDataSourceConfig 的配置更新（保持向后兼容）
 */
const handleEditorDataSourceUpdate = (config: any) => {
  console.log('🔧 [ConfigurationPanel] 处理编辑器数据源配置更新（向后兼容）:', config)
  // 重定向到新的处理方法
  handleDataSourceConfigUpdate(config)
}

/**
 * 处理当前数据请求 - 🔥 提供运行时数据给配置面板
 */
const handleCurrentDataRequest = (widgetId: string) => {
  console.log('🔄 [ConfigurationPanel] 处理当前数据请求:', widgetId)

  // 请求父组件（PanelEditor）提供当前运行时数据
  emit('request-current-data', widgetId)
}

/**
 * 获取动态数据源事件监听器
 */
const getDataSourceEventListeners = () => {
  const listeners: Record<string, Function> = {}

  // 监听通用的 update 事件（来自新的 DataSourceConfigForm）
  listeners['update'] = (config: any) => {
    console.log('🔧 [ConfigurationPanel] 接收到数据源配置更新:', config)
    handleDataSourceConfigUpdate(config)
  }

  // 🔥 新增：监听请求当前数据事件
  listeners['request-current-data'] = (widgetId: string) => {
    console.log('🔄 [ConfigurationPanel] 收到当前数据请求:', widgetId)
    handleCurrentDataRequest(widgetId)
  }

  // 保持对原有动态事件的兼容
  if (componentDefinition.value?.dataSources) {
    componentDefinition.value.dataSources.forEach(dataSource => {
      const eventName = `update:${dataSource.key}`
      listeners[eventName] = (data: any) => {
        handleDynamicDataSourceUpdate(dataSource.key, data)
      }
    })
  }

  console.log('🔧 [ConfigurationPanel] 生成动态事件监听器:', Object.keys(listeners))
  return listeners
}

// V6: 移除handleDataMappingConfigUpdate - 数据变化自动处理

// V6: 移除handlePreviewUpdate - SimpleDataMappingForm内部处理预览

/**
 * 处理Base配置应用
 */
const handleBaseConfigApply = (config: any) => {
  console.log('🔧 [ConfigurationPanel] Base配置应用:', config)
  if (props.selectedWidget) {
    configurationManager.updateConfiguration(props.selectedWidget.id, 'base', config)
  }
}

/**
 * 处理组件配置更新 - 性能优化：防抖批量更新 + 减少日志
 */
let componentConfigUpdateTimer: number | null = null
let isConfigUpdating = false
const handleComponentConfigUpdate = (config: any) => {
  if (!props.selectedWidget?.id || isConfigUpdating) return

  // 立即更新Widget properties以获得即时反馈
  if (props.selectedWidget.metadata?.isCard2Component && props.selectedWidget.properties) {
    Object.assign(props.selectedWidget.properties, config)
  }

  // 防抖保存到configurationManager
  if (componentConfigUpdateTimer) {
    clearTimeout(componentConfigUpdateTimer)
  }

  componentConfigUpdateTimer = window.setTimeout(() => {
    isConfigUpdating = true

    try {
      if (props.selectedWidget.metadata?.isCard2Component) {
        // 更新组件配置层级
        configurationManager.updateConfiguration(props.selectedWidget.id, 'component', {
          properties: config,
          styles: {},
          behavior: {},
          validation: { required: [], rules: {} }
        })
      } else {
        // 传统组件配置保存
        configurationManager.updateConfiguration(props.selectedWidget.id, 'component', config)
      }
    } catch (error) {
      console.error('❌ [ConfigurationPanel] 保存组件配置失败:', error)
    } finally {
      isConfigUpdating = false
      componentConfigUpdateTimer = null
    }
  }, 300) // 增加到300ms防抖，与配置表单保持一致
}

/**
 * 处理交互配置更新
 */
const handleInteractionConfigChange = (configs: any[]) => {
  if (!props.selectedWidget?.id) return

  console.log('🔧 [ConfigurationPanel] 交互配置更新:', configs)

  // 通过计算属性setter自动更新本地交互配置
  interactionConfigList.value = configs

  // 保存到配置管理器 - 现在传递完整的交互配置对象
  configurationManager.updateConfiguration(props.selectedWidget.id, 'interaction', interactionConfig.value)
}

/**
 * 处理Base配置重置
 */
const handleBaseConfigReset = () => {
  console.log('🔧 [ConfigurationPanel] Base配置重置')
  baseConfig.value = {}
}

/**
 * 获取层级的props
 */
const getLayerProps = (layer: any) => {
  const commonProps = {
    readonly: props.readonly
  }

  switch (layer.name) {
    case 'base':
      return {
        ...commonProps,
        modelValue: baseConfig.value,
        nodeId: props.selectedWidget?.id || ''
      }
    case 'component':
      return {
        ...commonProps,
        modelValue: componentConfig.value,
        widget: props.selectedWidget
      }
    case 'dataSource':
      return {
        ...commonProps,
        selectedWidgetId: props.selectedWidget?.id || '',
        componentType: props.selectedWidget?.type,
        dataSources: enrichedDataSources.value,
        modelValue: dataSourceConfig.value
      }
    case 'interaction':
      return {
        ...commonProps,
        modelValue: interactionConfig.value,
        widget: props.selectedWidget
      }
    default:
      return commonProps
  }
}

/**
 * 处理网格配置变化
 */
const handleGridConfigChange = () => {
  if (props.gridConfig) {
    // 优先使用事件发射
    emit('grid-config-change', props.gridConfig)
    // 兼容属性回调
    if (props.onGridConfigChange) {
      props.onGridConfigChange(props.gridConfig)
    }
  }
}

/**
 * 切换显示标题
 */
const onToggleWidgetTitles = (value: boolean) => {
  // 优先使用事件发射
  emit('toggle-widget-titles', value)
  // 兼容属性回调
  if (props.onToggleWidgetTitles) {
    props.onToggleWidgetTitles(value)
  }
}


// 监听选中组件变化 - 在所有函数定义后执行
watch(
  () => props.selectedWidget,
  async (newWidget, oldWidget) => {
    if (newWidget?.id === oldWidget?.id) return

    // 清理旧的监听器
    if (configChangeCleanup) {
      configChangeCleanup()
      configChangeCleanup = null
    }

    if (newWidget) {
      await loadWidgetConfiguration(newWidget.id)

      // 监听配置变化
      configChangeCleanup = configurationManager.onConfigurationChange(newWidget.id, handleConfigurationChange)
    } else {
      // 清空配置
      resetLocalConfiguration()
    }
  },
  { immediate: true }
)

// 🔥 新增：监听标签页切换，重新加载配置
watch(
  activeTab,
  async (newTab, oldTab) => {
    console.log('🔄 [ConfigurationPanel] 标签页切换:', { oldTab, newTab })
    
    // 如果有选中的组件且标签页确实发生了变化
    if (props.selectedWidget && newTab !== oldTab && newTab) {
      console.log('🔄 [ConfigurationPanel] 标签页切换触发配置重载:', props.selectedWidget.id)
      await loadWidgetConfiguration(props.selectedWidget.id)
    }
  }
)
</script>

<style scoped>
.configuration-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.global-settings,
.widget-configuration {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--text-color);
}

.global-form {
  padding: 0 8px;
}

.grid-config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-tabs {
  flex: 1;
  overflow: hidden;
}

.config-tabs :deep(.n-tabs-content) {
  height: calc(100% - 32px);
  overflow: hidden;
  padding: 0;
}

/* 只对特定的配置类型添加padding */
.config-tabs :deep(.n-tab-pane) {
  height: 100%;
}

/* 基础配置和其他需要padding的配置 */
.config-tabs :deep(.n-tab-pane:not([name='component'])) {
  padding: 8px;
  overflow-y: auto;
}

/* 组件配置占满全部空间，不需要padding */
.config-tabs :deep(.n-tab-pane[name='component']) {
  padding: 0;
  height: 100%;
  overflow: hidden;
}

.config-status {
  padding: 8px;
  border-top: 1px solid var(--border-color);
}

.config-json {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

/* 滚动条样式 */
.config-tabs :deep(.n-tabs-content)::-webkit-scrollbar {
  width: 6px;
}

.config-tabs :deep(.n-tabs-content)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.config-tabs :deep(.n-tabs-content)::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.config-tabs :deep(.n-tabs-content)::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .config-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .grid-config-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

/* V6样式 - 简化的数据配置区域 */
.v6-data-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.v6-data-mapping {
  padding: 4px;
}

.no-data-source-hint {
  padding: 8px;
}

/* 数据源配置样式 */
.data-source-config {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.data-source-config :deep(.n-scrollbar) {
  flex: 1;
}

.data-source-config :deep(.n-scrollbar-content) {
  padding: 8px;
  min-height: 100%;
}
</style>
