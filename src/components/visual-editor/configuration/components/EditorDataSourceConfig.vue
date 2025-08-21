<template>
  <div class="editor-data-source-config">
    <!-- 📊 数据源配置状态概览 -->
    <div class="config-overview">
      <n-space justify="space-between" align="center">
        <n-text strong>{{ $t('dataSource.config.title') }}</n-text>
        <n-space :size="8">
          <!-- 数据源状态指示器 -->
          <n-badge v-if="hasDataSources" :value="dataSourceCount" type="info" :max="99">
            <n-tag type="primary" size="small" round>
              {{ $t('dataSource.status.configured') }}
            </n-tag>
          </n-badge>
          <n-tag v-else type="default" size="small" round>
            {{ $t('dataSource.status.none') }}
          </n-tag>

          <!-- 触发器状态 -->
          <n-tag v-if="hasActiveTriggers" type="success" size="small" round>
            {{ $t('dataSource.triggers.active') }}
          </n-tag>
        </n-space>
      </n-space>
    </div>

    <!-- 🎯 智能推荐区域 -->
    <div v-if="recommendedDataSources.length > 0" class="recommendations">
      <n-text depth="2" style="font-size: 12px; margin-bottom: 8px; display: block">
        {{ $t('dataSource.recommendations.title') }}
      </n-text>
      <n-space :size="4">
        <n-tag
          v-for="rec in recommendedDataSources"
          :key="rec.key"
          type="info"
          size="small"
          :bordered="false"
          class="recommendation-tag"
          @click="addRecommendedDataSource(rec)"
        >
          <template #icon>
            <n-icon :component="getDataSourceIcon(rec.type)" />
          </template>
          {{ rec.name }}
        </n-tag>
      </n-space>
    </div>

    <!-- 📋 组件数据需求声明 -->
    <div v-if="componentDataRequirements.length > 0" class="component-requirements">
      <n-text strong style="font-size: 14px; margin-bottom: 12px; display: block">
        {{ $t('dataSource.requirements.title') }}
      </n-text>

      <!-- 遍历组件声明的数据源需求 -->
      <n-space vertical :size="16">
        <div v-for="requirement in componentDataRequirements" :key="requirement.key" class="requirement-item">
          <n-card :bordered="false" size="small" class="requirement-card">
            <!-- 需求标题和配置状态 -->
            <template #header>
              <n-space justify="space-between" align="center">
                <n-space align="center" :size="8">
                  <n-icon :component="getDataSourceIcon(requirement.supportedTypes[0])" />
                  <span>{{ requirement.name }}</span>
                  <n-tag v-if="requirement.required" type="warning" size="tiny">
                    {{ $t('common.required') }}
                  </n-tag>
                </n-space>

                <!-- 配置状态和操作 -->
                <n-space :size="8">
                  <n-tag :type="isRequirementConfigured(requirement) ? 'success' : 'default'" size="small">
                    {{ isRequirementConfigured(requirement) ? $t('common.configured') : $t('common.unconfigured') }}
                  </n-tag>

                  <n-button
                    size="tiny"
                    type="primary"
                    :secondary="isRequirementConfigured(requirement)"
                    @click="configureDataSource(requirement)"
                  >
                    {{ isRequirementConfigured(requirement) ? $t('common.edit') : $t('common.configure') }}
                  </n-button>
                </n-space>
              </n-space>
            </template>

            <!-- 需求描述 -->
            <n-text depth="3" style="font-size: 12px">{{ requirement.description }}</n-text>

            <!-- 字段映射预览 -->
            <div v-if="isRequirementConfigured(requirement)" class="field-mappings-preview">
              <n-divider style="margin: 12px 0 8px 0" />
              <n-text depth="2" style="font-size: 11px; margin-bottom: 6px; display: block">
                {{ $t('dataSource.fieldMappings.preview') }}:
              </n-text>
              <n-space vertical :size="2">
                <div v-for="(mapping, field) in requirement.fieldMappings" :key="field" class="field-mapping-item">
                  <n-text code style="font-size: 10px">{{ field }} → {{ mapping.targetField }}</n-text>
                </div>
              </n-space>
            </div>
          </n-card>
        </div>
      </n-space>
    </div>

    <!-- ⚠️ 无数据源需求提示 -->
    <div v-else class="no-requirements">
      <n-empty size="small" :description="$t('dataSource.noRequirements')">
        <template #icon>
          <n-icon><ServerOutline /></n-icon>
        </template>
        <template #extra>
          <n-button size="small" @click="showAdvancedConfig = true">
            {{ $t('dataSource.advanced.configure') }}
          </n-button>
        </template>
      </n-empty>
    </div>

    <!-- 🔧 高级数据源配置（手动配置） -->
    <n-collapse v-if="showAdvancedConfig" class="advanced-config">
      <n-collapse-item name="advanced" :title="$t('dataSource.advanced.title')">
        <component
          :is="DataSourceConfigForm"
          :data-sources="manualDataSources"
          :selected-widget-id="selectedWidgetId"
          @update="handleManualDataSourceUpdate"
          @request-current-data="handleCurrentDataRequest"
        />
      </n-collapse-item>
    </n-collapse>

    <!-- 🔄 实时数据预览 -->
    <div v-if="hasConfiguredDataSources" class="data-preview">
      <n-divider />
      <n-space justify="space-between" align="center" style="margin-bottom: 12px">
        <n-text strong style="font-size: 14px">{{ $t('dataSource.preview.title') }}</n-text>
        <n-space :size="8">
          <n-button size="small" :loading="isRefreshing" @click="refreshPreviewData">
            {{ $t('dataSource.preview.refresh') }}
          </n-button>
          <n-switch v-model:value="autoRefresh" size="small" @update:value="toggleAutoRefresh">
            <template #checked>{{ $t('dataSource.preview.autoRefresh') }}</template>
            <template #unchecked>{{ $t('dataSource.preview.manual') }}</template>
          </n-switch>
        </n-space>
      </n-space>

      <!-- 数据预览内容 -->
      <div class="preview-content">
        <n-code
          :code="previewDataDisplay"
          language="json"
          :hljs="false"
          style="font-size: 11px; max-height: 200px; overflow-y: auto"
        />
      </div>
    </div>

    <!-- 📊 数据源执行状态 -->
    <div v-if="hasConfiguredDataSources" class="execution-status">
      <n-divider />
      <n-text strong style="font-size: 14px; margin-bottom: 8px; display: block">
        {{ $t('dataSource.execution.status') }}
      </n-text>
      <n-space vertical :size="4">
        <div v-for="(status, key) in executionStatus" :key="key" class="status-item">
          <n-space justify="space-between" align="center">
            <n-space align="center" :size="8">
              <n-icon :color="getStatusColor(status.status)" :component="getStatusIcon(status.status)" />
              <n-text>{{ key }}</n-text>
            </n-space>
            <n-space align="center" :size="8">
              <n-text depth="3" style="font-size: 11px">
                {{ formatLastUpdate(status.lastUpdate) }}
              </n-text>
              <n-tag :type="getStatusType(status.status)" size="tiny">
                {{ $t(`dataSource.status.${status.status}`) }}
              </n-tag>
            </n-space>
          </n-space>
        </div>
      </n-space>
    </div>
  </div>

  <!-- 🔧 数据源配置弹窗 -->
  <n-modal
    v-model:show="showConfigModal"
    preset="card"
    :title="$t('dataSource.configModal.title')"
    style="width: 800px; max-height: 80vh"
    :bordered="false"
    size="huge"
    :closable="true"
    :mask-closable="false"
  >
    <div v-if="currentConfigRequirement" class="config-modal-content">
      <!-- 配置表单内容 -->
      <component
        :is="DataSourceConfigForm"
        :data-sources="[adaptRequirementToDataSource(currentConfigRequirement)]"
        :selected-widget-id="selectedWidgetId"
        @update="handleConfigModalUpdate"
        @request-current-data="handleCurrentDataRequest"
      />
    </div>

    <template #footer>
      <n-space justify="end">
        <n-button @click="showConfigModal = false">
          {{ $t('common.cancel') }}
        </n-button>
        <n-button type="primary" @click="saveConfiguration">
          {{ $t('common.save') }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
/**
 * 编辑器数据源配置组件
 * 专为Visual Editor设计的数据源配置界面，集成智能推荐和实时预览
 */

import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import {
  NSpace,
  NText,
  NBadge,
  NTag,
  NIcon,
  NCard,
  NDivider,
  NButton,
  NEmpty,
  NCollapse,
  NCollapseItem,
  NModal,
  NCode,
  NSwitch,
  useMessage
} from 'naive-ui'
import {
  ServerOutline,
  CloudOutline,
  GitNetworkOutline,
  DocumentTextOutline,
  PlayOutline,
  PauseOutline,
  CheckmarkCircleOutline,
  WarningOutline,
  CloseCircleOutline
} from '@vicons/ionicons5'

// 导入数据源系统组件和工具
import { DataSourceConfigForm } from '@/core/data-source-system'
import type { DataSourceRequirement, ComponentDataRequirement } from '@/core/data-source-system/types/simple-types'

// 导入国际化
import { $t } from '@/locales'

interface Props {
  /** 选中的组件ID */
  selectedWidgetId: string
  /** 组件类型 */
  componentType?: string
  /** 组件定义中的数据源需求 */
  dataSources?: DataSourceRequirement[]
  /** 只读模式 */
  readonly?: boolean
}

interface Emits {
  (e: 'update', config: any): void
  (e: 'request-current-data', widgetId: string): void
}

const props = withDefaults(defineProps<Props>(), {
  dataSources: () => [],
  readonly: false
})

const emit = defineEmits<Emits>()

// 响应式状态
const message = useMessage()
const showConfigModal = ref(false)
const showAdvancedConfig = ref(false)
const currentConfigRequirement = ref<DataSourceRequirement | null>(null)
const autoRefresh = ref(false)
const isRefreshing = ref(false)

// 数据源配置状态
const configuredDataSources = ref<Record<string, any>>({})
const executionStatus = ref<Record<string, any>>({})
const previewData = ref<any>({})

// 自动刷新定时器
let refreshTimer: number | null = null

// 计算属性
const componentDataRequirements = computed<DataSourceRequirement[]>(() => {
  return props.dataSources || []
})

const recommendedDataSources = computed(() => {
  // 基于组件类型推荐数据源
  const recommendations = []

  if (props.componentType?.includes('chart') || props.componentType?.includes('data')) {
    recommendations.push(
      { key: 'api-data', name: 'API数据', type: 'api' },
      { key: 'realtime', name: '实时数据', type: 'websocket' }
    )
  }

  if (props.componentType?.includes('device') || props.componentType?.includes('iot')) {
    recommendations.push(
      { key: 'device-status', name: '设备状态', type: 'mqtt' },
      { key: 'sensor-data', name: '传感器数据', type: 'api' }
    )
  }

  return recommendations
})

const hasDataSources = computed(() => Object.keys(configuredDataSources.value).length > 0)
const dataSourceCount = computed(() => Object.keys(configuredDataSources.value).length)
const hasActiveTriggers = computed(() => {
  return Object.values(executionStatus.value).some((status: any) => status.status === 'running')
})

const hasConfiguredDataSources = computed(() => hasDataSources.value)

const previewDataDisplay = computed(() => {
  if (Object.keys(previewData.value).length === 0) {
    return $t('dataSource.preview.noData')
  }
  return JSON.stringify(previewData.value, null, 2)
})

// 手动配置的数据源结构
const manualDataSources = computed(() => {
  return [
    {
      key: 'manual',
      name: '手动配置数据源',
      description: '手动配置数据源，适用于自定义数据需求',
      supportedTypes: ['static', 'api', 'websocket', 'script'],
      fieldMappings: {},
      required: false
    }
  ]
})

// 方法实现
const getDataSourceIcon = (type: string) => {
  const iconMap = {
    api: CloudOutline,
    websocket: GitNetworkOutline,
    static: DocumentTextOutline,
    script: DocumentTextOutline,
    mqtt: GitNetworkOutline
  }
  return iconMap[type] || ServerOutline
}

const getStatusIcon = (status: string) => {
  const iconMap = {
    running: PlayOutline,
    stopped: PauseOutline,
    success: CheckmarkCircleOutline,
    error: CloseCircleOutline,
    warning: WarningOutline
  }
  return iconMap[status] || ServerOutline
}

const getStatusColor = (status: string) => {
  const colorMap = {
    running: '#18a058',
    stopped: '#909399',
    success: '#18a058',
    error: '#d03050',
    warning: '#f0a020'
  }
  return colorMap[status] || '#909399'
}

const getStatusType = (status: string) => {
  const typeMap = {
    running: 'success',
    stopped: 'default',
    success: 'success',
    error: 'error',
    warning: 'warning'
  }
  return typeMap[status] || 'default'
}

const isRequirementConfigured = (requirement: DataSourceRequirement): boolean => {
  return requirement.key in configuredDataSources.value
}

const configureDataSource = (requirement: DataSourceRequirement) => {
  currentConfigRequirement.value = requirement
  showConfigModal.value = true
}

const adaptRequirementToDataSource = (requirement: DataSourceRequirement) => {
  return {
    ...requirement
    // 确保兼容 DataSourceConfigForm 的接口
  }
}

const addRecommendedDataSource = (recommendation: any) => {
  // 基于推荐创建数据源配置
  const syntheticRequirement: DataSourceRequirement = {
    key: recommendation.key,
    name: recommendation.name,
    description: `推荐的${recommendation.name}数据源`,
    supportedTypes: [recommendation.type],
    fieldMappings: {},
    required: false
  }

  configureDataSource(syntheticRequirement)
}

const handleManualDataSourceUpdate = (config: any) => {
  console.log('📊 [EditorDataSourceConfig] 手动数据源更新:', config)
  emit('update', config)
}

const handleConfigModalUpdate = (config: any) => {
  console.log('📊 [EditorDataSourceConfig] 配置弹窗更新:', config)

  if (currentConfigRequirement.value) {
    configuredDataSources.value[currentConfigRequirement.value.key] = config
  }
}

const handleCurrentDataRequest = (widgetId: string) => {
  emit('request-current-data', widgetId)
}

const saveConfiguration = () => {
  if (currentConfigRequirement.value) {
    const config = configuredDataSources.value[currentConfigRequirement.value.key]
    if (config) {
      emit('update', { [currentConfigRequirement.value.key]: config })
      showConfigModal.value = false
      message.success($t('dataSource.config.saveSuccess'))
    }
  }
}

const refreshPreviewData = async () => {
  isRefreshing.value = true
  try {
    // 请求最新的预览数据
    emit('request-current-data', props.selectedWidgetId)

    // 模拟数据加载延迟
    await new Promise(resolve => setTimeout(resolve, 500))

    message.success($t('dataSource.preview.refreshSuccess'))
  } catch (error) {
    message.error($t('dataSource.preview.refreshError'))
  } finally {
    isRefreshing.value = false
  }
}

const toggleAutoRefresh = (enabled: boolean) => {
  if (enabled) {
    refreshTimer = window.setInterval(refreshPreviewData, 5000)
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
  }
}

const formatLastUpdate = (timestamp?: number): string => {
  if (!timestamp) return $t('common.never')

  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) return $t('common.justNow')
  if (diff < 3600000) return $t('common.minutesAgo', { minutes: Math.floor(diff / 60000) })
  if (diff < 86400000) return $t('common.hoursAgo', { hours: Math.floor(diff / 3600000) })

  return new Date(timestamp).toLocaleString()
}

// 生命周期
onMounted(() => {
  console.log('📊 [EditorDataSourceConfig] 组件已挂载', {
    selectedWidgetId: props.selectedWidgetId,
    componentType: props.componentType,
    dataSources: props.dataSources?.length || 0
  })
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})

// 监听props变化
watch(
  () => props.selectedWidgetId,
  (newId, oldId) => {
    if (newId !== oldId) {
      // 重置状态
      configuredDataSources.value = {}
      executionStatus.value = {}
      previewData.value = {}
      showConfigModal.value = false
      currentConfigRequirement.value = null
    }
  }
)
</script>

<style scoped>
.editor-data-source-config {
  padding: 0;
  height: 100%;
  overflow-y: auto;
}

.config-overview {
  padding: 12px;
  background: var(--n-color-target);
  border-radius: 6px;
  margin-bottom: 16px;
}

.recommendations {
  margin-bottom: 16px;
  padding: 0 4px;
}

.recommendation-tag {
  cursor: pointer;
  transition: all 0.2s ease;
}

.recommendation-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.component-requirements {
  margin-bottom: 16px;
}

.requirement-item {
  position: relative;
}

.requirement-card {
  border: 1px solid var(--n-border-color);
  transition: all 0.2s ease;
}

.requirement-card:hover {
  border-color: var(--n-color-primary);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.field-mappings-preview {
  font-family: var(--n-font-family-mono);
}

.field-mapping-item {
  padding: 2px 0;
  border-left: 2px solid var(--n-color-primary);
  padding-left: 6px;
  margin: 2px 0;
}

.no-requirements {
  margin: 32px 0;
}

.advanced-config {
  margin-top: 16px;
}

.data-preview {
  margin-top: 16px;
}

.preview-content {
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.execution-status {
  margin-top: 16px;
}

.status-item {
  padding: 8px;
  background: var(--n-color-target);
  border-radius: 4px;
  margin: 4px 0;
}

.config-modal-content {
  max-height: 60vh;
  overflow-y: auto;
}

/* 滚动条样式 */
.editor-data-source-config::-webkit-scrollbar {
  width: 6px;
}

.editor-data-source-config::-webkit-scrollbar-track {
  background: var(--n-scrollbar-track-color);
  border-radius: 3px;
}

.editor-data-source-config::-webkit-scrollbar-thumb {
  background: var(--n-scrollbar-thumb-color);
  border-radius: 3px;
}

.editor-data-source-config::-webkit-scrollbar-thumb:hover {
  background: var(--n-scrollbar-thumb-color-hover);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .config-overview {
    padding: 8px;
  }

  .requirement-card {
    margin: 8px 0;
  }
}
</style>
