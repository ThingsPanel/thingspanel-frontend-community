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
              <!-- 🔄 使用v-model双向绑定取代手动事件处理 -->
              <component
                :is="layer.component"
                ref="dataSourceConfigRef"
                v-model="dataSourceConfig"
                :data-sources="componentDataSources"
                :selected-widget-id="selectedWidget?.id"
                :component-id="selectedWidget?.id"
                :component-type="selectedWidget?.type"
                :preview-mode="props.previewMode"
                :global-polling-enabled="props.globalPollingEnabled"
                @request-current-data="handleCurrentDataRequest"
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
import { $t } from '@/locales'
import { smartDeepClone } from '@/utils/deep-clone'

// 导入配置组件注册中心
import { getVisibleConfigLayers, getConfigLayer } from './component-registry'

// 导入配置管理器和类型
import { configurationIntegrationBridge as configurationManager } from './ConfigurationIntegrationBridge'
import { getComponentDataRequirements } from '../core/component-data-requirements'
import type {
  WidgetConfiguration,
  ComponentConfiguration,
  DataSourceConfiguration,
  InteractionConfiguration,
  ValidationResult
} from './types'
import type { VisualEditorWidget } from '../types'

// 🔄 重构：移除直接导入执行器管理器，改为事件通信

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
  /** 是否为预览模式 - 轮询功能仅在预览模式下生效 */
  previewMode?: boolean
  /** 全局轮询开关 - 用于性能控制 */
  globalPollingEnabled?: boolean
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
  previewMode: false,
  globalPollingEnabled: true,
  showWidgetTitles: false
})

const emit = defineEmits<Emits>()

// 消息提示
const message = useMessage()

// 获取配置层级定义 - 传入组件ID和widget实例以检查数据源需求
const configLayers = computed(() => getVisibleConfigLayers(props.selectedWidget?.id, props.selectedWidget))

// 响应式状态 - 默认显示第一个可见层级
// 🚨 避免在初始化时依赖 computed 值，使用静态默认值
const activeTab = ref('base')

// 多数据源数据状态
const multiDataSourceData = ref<Record<string, any>>({})

// 🔄 dataMappingConfig 已被 dataSourceConfig computed 取代

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

// 🔄 重构：dataSourceConfig为computed属性，与ConfigurationManager直接同步
const dataSourceConfig = computed<DataSourceConfiguration | null>({
  get: () => {
    if (!props.selectedWidget) return null
    const config = configurationManager.getConfiguration(props.selectedWidget.id)
    return config?.dataSource || null
  },
  set: value => {
    // 🚨 防止循环更新：如果正在从ConfigurationManager更新，不再同步回去
    if (isUpdatingFromManager) {
      return
    }

    if (props.selectedWidget && value) {
      // 🚨 设置标志防止监听器重复触发
      isUpdatingFromManager = true

      try {
        // 确保类型和元数据正确
        const enhancedValue = {
          // 保持原有类型，不硬编码为 'data-source-bindings'
          type: value.type || 'data-source-bindings',
          enabled: true,
          ...value,
          metadata: {
            componentType: props.selectedWidget.type,
            updatedAt: Date.now(),
            source: 'data-source-config-form',
            ...value.metadata
          }
        }
        configurationManager.updateConfiguration(props.selectedWidget.id, 'dataSource', enhancedValue)

        // 🔄 重构：发出数据源配置更新事件，由外部系统负责数据执行
        const eventData = {
          componentId: props.selectedWidget.id,
          componentType: props.selectedWidget.type,
          config: enhancedValue,
          action: 'config-updated'
        }
        emit('data-source-manager-update', eventData)
      } finally {
        // 🔥 修复：延迟重置标志，避免异步问题导致的递归更新
        nextTick(() => {
          setTimeout(() => {
            isUpdatingFromManager = false
          }, 50) // 50ms延迟确保所有响应式更新完成
        })
      }
    }
  }
})

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
    // 🔥 处理多数据源：为每个 dataFields 项创建独立的数据源配置
    if (definition.dataRequirements.dataFields && Array.isArray(definition.dataRequirements.dataFields)) {
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
          description: field.description || `${field.name} ${$t('visualEditor.dataSource')}`,
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
  return [
    {
      key: 'main',
      name: $t('visualEditor.primaryDataSource'),
      type: 'object',
      fieldsToMap: ['value', 'label', 'status', 'timestamp'],
      fieldMappings: {
        value: { path: 'value', type: 'number', description: $t('visualEditor.dataValue') },
        label: { path: 'label', type: 'string', description: $t('visualEditor.dataLabel') },
        status: { path: 'status', type: 'string', description: $t('visualEditor.dataStatus') },
        timestamp: { path: 'timestamp', type: 'string', description: $t('visualEditor.dataTimestamp') }
      },
      expectedDataFormat: 'object',
      validationRules: {},
      description: $t('visualEditor.componentDataSource') + '，' + $t('visualEditor.supportVariousFormats')
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
      return exampleFromMappings
    }
  }

  // 2. 检查组件元数据中的测试数据
  if (componentDefinition.value?.metadata?.testData) {
    const testData = componentDefinition.value.metadata.testData[dataSource.key]
    if (testData) {
      return testData
    }
  }

  // 3. 使用通用默认数据
  return null // 返回 null，让 DataSourceConfigForm 使用自己的默认数据生成逻辑
}

// 配置变更监听器清理函数
let configChangeCleanup: (() => void) | null = null

// 🔥 修复：增强防循环机制，使用多重保护
let isUpdatingFromManager = false
let lastSyncTime = 0
let lastSyncConfig: string | null = null

// 监听配置变化并同步到ConfigurationManager
// 🚨 注意：dataSourceConfig 被排除，因为它有自己的 computed setter 处理机制
watch(
  [baseConfig, componentConfig, interactionConfig],
  () => {
    // 防止循环更新的多重检查
    if (!props.selectedWidget || isUpdatingFromManager) {
      return
    }

    // 🔥 新增：防抖机制，避免短时间内重复同步
    const now = Date.now()
    if (now - lastSyncTime < 100) {
      return
    }

    // 🔥 新增：内容去重，避免相同配置重复同步
    const currentConfig = JSON.stringify({
      base: baseConfig.value,
      component: componentConfig.value,
      interaction: interactionConfig.value
    })

    if (currentConfig === lastSyncConfig) {
      return
    }
    lastSyncTime = now
    lastSyncConfig = currentConfig
    syncConfigurationToManager()
  },
  { deep: true }
)

// 🔄 V6监听器已被 dataSourceConfig computed 响应式系统取代

// 🔥 新增：执行器数据更新回调清理函数
let executorDataUpdateCleanup: (() => void) | null = null

// 生命周期
onMounted(() => {
  // 🔄 重构：移除直接的执行器监听器，数据更新通过事件机制处理
  // 数据更新将通过PanelEditor的事件系统传递，不在此处直接监听
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
  // 设置防循环标记
  isUpdatingFromManager = true

  try {
    let config = configurationManager.getConfiguration(widgetId)

    if (!config) {
      // 初始化默认配置
      configurationManager.initializeConfiguration(widgetId)
      config = configurationManager.getConfiguration(widgetId)
    }

    if (config) {
      // 🔧 现在加载所有层级的配置
      baseConfig.value = { ...config.base }
      componentConfig.value = { ...config.component }
      // 🚨 不直接设置 dataSourceConfig，因为它是 computed 属性
      // dataSourceConfig 会通过 getter 自动从 ConfigurationManager 获取最新值
      interactionConfig.value = { ...config.interaction }
      // 🔄 重构：如果有保存的数据源配置，通过事件通知执行数据获取
      if (config.dataSource?.config && Object.keys(config.dataSource.config).length > 0) {
        // 发出事件让PanelEditor处理数据执行
        emit('data-source-manager-update', {
          componentId: widgetId,
          componentType: props.selectedWidget?.type || '',
          config: config.dataSource.config,
          action: 'config-restored'
        })
      }
    }
  } catch (error) {
    message.error($t('visualEditor.configLoadFailed'))
  } finally {
    // 🔥 修复：延迟重置防循环标记，确保Vue响应式更新完成
    nextTick(() => {
      setTimeout(() => {
        isUpdatingFromManager = false
      }, 50) // 50ms延迟确保所有响应式更新完成
    })
  }
}

/**
 * 处理来自ConfigurationManager的配置变化
 */
const handleConfigurationChange = (config: WidgetConfiguration) => {
  // 设置防循环标记
  isUpdatingFromManager = true

  try {
    // 更新本地配置状态
    // 🔧 现在加载所有层级的配置
    baseConfig.value = { ...config.base }
    componentConfig.value = { ...config.component }
    // dataSourceConfig 是 computed 属性，会自动通过 getter 从 ConfigurationManager 获取
    // 不需要手动设置：dataSourceConfig.value = config.dataSource ? { ...config.dataSource } : null
    interactionConfig.value = { ...config.interaction }

    // V6: 数据源配置由dataSourceConfig computed属性管理
    // dataMappingConfig已移除，配置通过dataSourceConfig.value处理
  } finally {
    // 🔥 修复：延迟重置防循环标记，确保Vue响应式更新完成
    nextTick(() => {
      setTimeout(() => {
        isUpdatingFromManager = false
      }, 50) // 50ms延迟确保所有响应式更新完成
    })
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
  } catch (error) {}
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

  // V6: 数据源配置重置由dataSourceConfig computed属性处理
  // dataMappingConfig已移除
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
  // 更新本地数据状态
  multiDataSourceData.value = { ...data }

  // 发射事件给父组件，传递给实际的组件
  if (props.selectedWidget) {
    emit('multi-data-source-update', props.selectedWidget.id, data)
  }
}

/**
 * 处理动态数据源更新
 */
const handleDynamicDataSourceUpdate = (key: string, data: any) => {
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
  return initialData
}

// 🔄 handleDataSourceConfigUpdate 已被 dataSourceConfig computed setter 取代

/**
 * 处理来自 EditorDataSourceConfig 的配置更新（保持向后兼容）
 */
const handleEditorDataSourceUpdate = (config: any) => {
  // 重定向到新的处理方法
  handleDataSourceConfigUpdate(config)
}

/**
 * 处理当前数据请求 - 🔥 提供运行时数据给配置面板
 */
const handleCurrentDataRequest = (widgetId: string) => {
  // 请求父组件（PanelEditor）提供当前运行时数据
  emit('request-current-data', widgetId)
}

// 🔄 getDataSourceEventListeners 已被 v-model 和响应式系统取代

// V6: 移除handleDataMappingConfigUpdate - 数据变化自动处理

// V6: 移除handlePreviewUpdate - SimpleDataMappingForm内部处理预览

/**
 * 处理Base配置应用
 */
const handleBaseConfigApply = (config: any) => {
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

  // 通过计算属性setter自动更新本地交互配置
  interactionConfigList.value = configs

  // 保存到配置管理器 - 现在传递完整的交互配置对象
  configurationManager.updateConfiguration(props.selectedWidget.id, 'interaction', interactionConfig.value)
}

/**
 * 处理Base配置重置
 */
const handleBaseConfigReset = () => {
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

// 🔥 监听 configLayers 变化，确保 activeTab 指向有效的标签页
watch(
  configLayers,
  newLayers => {
    if (newLayers.length > 0) {
      // 如果当前 activeTab 不在新的层级列表中，切换到第一个可用的
      const currentTabExists = newLayers.some(layer => layer.name === activeTab.value)
      if (!currentTabExists) {
        activeTab.value = newLayers[0].name
      }
    }
  },
  { immediate: true }
)

// 🚨 移除标签页切换时的配置重载，避免循环依赖
// 配置的加载应该由组件选择变化触发，而不是标签页切换
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
