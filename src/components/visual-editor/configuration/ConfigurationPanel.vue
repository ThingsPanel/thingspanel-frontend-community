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
        <div class="header-actions">
          <n-button size="tiny" quaternary :type="showAdvanced ? 'primary' : 'default'" @click="toggleAdvancedMode">
            {{ showAdvanced ? $t('config.hideAdvanced') : $t('config.showAdvanced') }}
          </n-button>
          <n-dropdown :options="configActionsOptions" trigger="click" @select="handleConfigAction">
            <n-button size="tiny" quaternary>
              <template #icon>
                <n-icon><SettingsIcon /></n-icon>
              </template>
            </n-button>
          </n-dropdown>
        </div>
      </div>

      <!-- 配置标签页 -->
      <n-tabs v-model:value="activeTab" type="line" animated size="small" class="config-tabs">
        <!-- 基础配置标签页 -->
        <n-tab-pane name="base" :tab="$t('config.tabs.base')">
          <BaseConfigForm
            v-model="baseConfig"
            :widget="selectedWidget"
            :readonly="readonly"
            :show-advanced="showAdvanced"
            @validate="handleValidation"
            @toggle-advanced="toggleAdvancedMode"
          />
        </n-tab-pane>

        <!-- 组件配置标签页 -->
        <n-tab-pane name="component" :tab="$t('config.tabs.component')">
          <ComponentConfigForm
            v-model="componentConfig"
            :widget="selectedWidget"
            :readonly="readonly"
            :show-advanced="showAdvanced"
            @validate="handleValidation"
            @toggle-advanced="toggleAdvancedMode"
          />
        </n-tab-pane>

        <!-- V6数据源配置标签页 - 纯粹的数据协调 -->
        <n-tab-pane name="dataSource" :tab="$t('config.tabs.dataSource')">
          <div class="v6-data-config">
            <!-- V6: 检查组件定义中的dataSources -->
            <div v-if="componentDefinition?.dataSources?.length > 0" class="v6-data-mapping">
              <!-- 新的DataSourceConfigForm组件 -->
              <DataSourceConfigForm
                ref="dataSourceFormRef"
                :data-sources="componentDefinition.dataSources"
                :selected-widget-id="selectedWidget?.id"
                v-on="getDataSourceEventListeners()"
              />
            </div>

            <!-- 无数据源需求时的提示 -->
            <div v-else class="no-data-source-hint">
              <n-empty description="当前组件无需配置数据源" size="small">
                <template #icon>
                  <n-icon><DocumentOutline /></n-icon>
                </template>
                <template #extra>
                  <n-text depth="3">组件使用静态配置或预设数据</n-text>
                </template>
              </n-empty>
            </div>
          </div>
        </n-tab-pane>

        <!-- 交互配置标签页 -->
        <n-tab-pane name="interaction" :tab="$t('config.tabs.interaction')">
          <InteractionConfigForm
            v-model="interactionConfig"
            :widget="selectedWidget"
            :readonly="readonly"
            :show-advanced="showAdvanced"
            @validate="handleValidation"
            @toggle-advanced="toggleAdvancedMode"
          />
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

    <!-- 配置导入导出对话框 -->
    <n-modal v-model:show="showImportExportDialog" :title="importExportTitle">
      <n-card style="width: 600px" :bordered="false" size="huge">
        <template v-if="importExportMode === 'export'">
          <n-space vertical>
            <n-input v-model:value="exportedConfig" type="textarea" :rows="12" readonly class="config-json" />
            <n-space>
              <n-button type="primary" @click="copyToClipboard">
                {{ $t('config.copy') }}
              </n-button>
              <n-button @click="showImportExportDialog = false">
                {{ $t('common.close') }}
              </n-button>
            </n-space>
          </n-space>
        </template>

        <template v-else>
          <n-space vertical>
            <n-input
              v-model:value="importConfigText"
              type="textarea"
              :rows="12"
              :placeholder="$t('config.import.placeholder')"
              class="config-json"
            />
            <n-space>
              <n-button type="primary" @click="importConfiguration">
                {{ $t('config.import.confirm') }}
              </n-button>
              <n-button @click="showImportExportDialog = false">
                {{ $t('common.cancel') }}
              </n-button>
            </n-space>
          </n-space>
        </template>
      </n-card>
    </n-modal>
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

// 导入配置表单组件
import BaseConfigForm from './forms/BaseConfigForm.vue'
import ComponentConfigForm from './forms/ComponentConfigForm.vue'
import InteractionConfigForm from './forms/InteractionConfigForm.vue'
import DataSourceConfigForm from './forms/DataSourceConfigForm.vue'

// 导入配置管理器和类型
import { configurationManager } from './ConfigurationManager'
import { getComponentDataRequirements } from '../core/component-data-requirements'
import type {
  WidgetConfiguration,
  BaseConfiguration,
  ComponentConfiguration,
  DataSourceConfiguration,
  InteractionConfiguration,
  ValidationResult
} from './types'
import type { VisualEditorWidget } from '../types'

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
}

const props = withDefaults(defineProps<Props>(), {
  selectedWidget: null,
  readonly: false,
  showWidgetTitles: false
})

const emit = defineEmits<Emits>()

// 消息提示
const message = useMessage()

// 响应式状态
const activeTab = ref('base')
const showAdvanced = ref(false)
const showImportExportDialog = ref(false)
const importExportMode = ref<'import' | 'export'>('export')
const exportedConfig = ref('')
const importConfigText = ref('')

// 多数据源数据状态
const multiDataSourceData = ref<Record<string, any>>({})

// V6数据映射配置状态 - 初始化正确的结构
const dataMappingConfig = ref<any>({
  dataSourceBindings: {}
})

// DataSourceConfigForm 组件引用
const dataSourceFormRef = ref<any>(null)

// 配置数据
const baseConfig = ref<BaseConfiguration>({
  showTitle: false,
  title: '',
  opacity: 1,
  visible: true,
  customClassName: '',
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
  padding: { top: 0, right: 0, bottom: 0, left: 0 }
})

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
const widgetDisplayName = computed(() => {
  if (!props.selectedWidget) return ''
  return props.selectedWidget.metadata?.card2Definition?.name || props.selectedWidget.type || 'Unknown Component'
})

const importExportTitle = computed(() => {
  return importExportMode.value === 'export' ? '导出配置' : '导入配置'
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

// 配置操作选项
const configActionsOptions = [
  {
    label: '导出配置',
    key: 'export',
    icon: 'download'
  },
  {
    label: '导入配置',
    key: 'import',
    icon: 'upload'
  },
  {
    label: '重置配置',
    key: 'reset',
    icon: 'refresh'
  },
  {
    label: '应用预设',
    key: 'preset',
    icon: 'template',
    children: [
      { label: '默认预设', key: 'preset-default' },
      { label: '简洁预设', key: 'preset-minimal' },
      { label: '完整预设', key: 'preset-full' }
    ]
  }
]

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
  newConfig => {
    if (!props.selectedWidget) return

    // 更新dataSourceConfig以保持持久化
    if (newConfig && Object.keys(newConfig).length > 0) {
      dataSourceConfig.value = {
        type: 'data-mapping',
        enabled: true,
        config: { ...newConfig },
        metadata: {
          componentType: props.selectedWidget.type,
          mappingType: 'json-path',
          updatedAt: Date.now()
        }
      }

      console.log('🎯 [V6ConfigPanel] 数据映射配置变化，自动应用:', newConfig)
      emit('multi-data-source-config-update', props.selectedWidget.id, newConfig)
    } else {
      // 重置为空的正确结构，不是null
      dataSourceConfig.value = null
    }
  },
  { deep: true }
)

// 生命周期
onMounted(() => {
  console.log('ConfigurationPanel 已挂载')
})

onUnmounted(() => {
  if (configChangeCleanup) {
    configChangeCleanup()
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
      baseConfig.value = { ...config.base }
      componentConfig.value = { ...config.component }
      dataSourceConfig.value = config.dataSource ? { ...config.dataSource } : null
      interactionConfig.value = { ...config.interaction }

      // V6: 直接恢复数据映射配置
      if (config.dataSource?.config) {
        dataMappingConfig.value = { ...config.dataSource.config }
        console.log('V6ConfigPanel - 恢复数据映射配置:', dataMappingConfig.value)
      } else {
        dataMappingConfig.value = { dataSourceBindings: {} }
      }

      // V6: DataSourceConfigForm 现在自己负责数据回显，不需要手动调用
      // 只需要传递 selectedWidgetId，组件会自动从 ConfigurationManager 加载数据

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
      base: { ...baseConfig.value },
      component: { ...componentConfig.value },
      dataSource: dataSourceConfig.value ? { ...dataSourceConfig.value } : null,
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
  baseConfig.value = {
    showTitle: false,
    title: '',
    opacity: 1,
    visible: true,
    customClassName: '',
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    padding: { top: 0, right: 0, bottom: 0, left: 0 }
  }

  componentConfig.value = {
    properties: {},
    styles: {},
    behavior: {},
    validation: { required: [], rules: {} }
  }

  dataSourceConfig.value = null
  interactionConfig.value = {}
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
        filterPath: '', // 过滤路径（暂时为空，后续扩展）
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
 * 获取动态数据源事件监听器
 */
const getDataSourceEventListeners = () => {
  const listeners: Record<string, Function> = {}

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
 * 切换高级模式
 */
const toggleAdvancedMode = () => {
  showAdvanced.value = !showAdvanced.value
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

/**
 * 处理配置操作
 */
const handleConfigAction = (key: string) => {
  switch (key) {
    case 'export':
      exportConfiguration()
      break
    case 'import':
      showImportDialog()
      break
    case 'reset':
      resetConfiguration()
      break
    case 'preset-default':
    case 'preset-minimal':
    case 'preset-full':
      applyPreset(key.replace('preset-', ''))
      break
  }
}

/**
 * 导出配置
 */
const exportConfiguration = () => {
  if (!props.selectedWidget) return

  try {
    exportedConfig.value = configurationManager.exportConfiguration(props.selectedWidget.id)
    importExportMode.value = 'export'
    showImportExportDialog.value = true
  } catch (error) {
    message.error('配置导出失败')
  }
}

/**
 * 显示导入对话框
 */
const showImportDialog = () => {
  importConfigText.value = ''
  importExportMode.value = 'import'
  showImportExportDialog.value = true
}

/**
 * 导入配置
 */
const importConfiguration = () => {
  if (!props.selectedWidget) return

  try {
    const success = configurationManager.importConfiguration(props.selectedWidget.id, importConfigText.value)

    if (success) {
      message.success('配置导入成功')
      showImportExportDialog.value = false
      importConfigText.value = ''
    } else {
      message.error('配置导入失败，请检查配置格式')
    }
  } catch (error) {
    message.error('配置导入失败')
  }
}

/**
 * 复制到剪贴板
 */
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(exportedConfig.value)
    message.success('配置已复制到剪贴板')
  } catch (error) {
    message.error('复制失败')
  }
}

/**
 * 重置配置
 */
const resetConfiguration = () => {
  if (!props.selectedWidget) return

  configurationManager.resetConfiguration(props.selectedWidget.id)
  message.success('配置已重置')
}

/**
 * 应用预设
 */
const applyPreset = (presetName: string) => {
  if (!props.selectedWidget) return

  const success = configurationManager.applyPreset(props.selectedWidget.id, presetName)
  if (success) {
    message.success(`已应用 ${presetName} 预设`)
  } else {
    message.error('预设应用失败')
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
  overflow-y: auto;
  padding: 8px;
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
</style>
