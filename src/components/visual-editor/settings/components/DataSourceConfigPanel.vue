<template>
  <div class="data-source-config-panel">
    <!-- 配置面板头部 -->
    <div class="panel-header">
      <div class="header-info">
        <n-icon size="18" class="header-icon">
          <SettingsOutline />
        </n-icon>
        <div class="header-content">
          <h2 class="header-title">数据源配置</h2>
          <n-text depth="3" class="header-subtitle">为组件配置数据源和字段映射</n-text>
        </div>
      </div>

      <div class="header-status">
        <n-space align="center" size="small">
          <n-tag :type="configurationStatusType" size="small" :bordered="false">
            {{ configurationStatusText }}
          </n-tag>
          <n-button
            v-if="hasConfiguration && isValidConfiguration"
            size="small"
            type="primary"
            @click="applyConfiguration"
          >
            <template #icon>
              <n-icon><CheckmarkOutline /></n-icon>
            </template>
            应用配置
          </n-button>
        </n-space>
      </div>
    </div>

    <!-- 组件需求信息 -->
    <div v-if="componentRequirements" class="requirements-section">
      <n-card size="small" :bordered="false">
        <template #header>
          <n-space align="center" size="small">
            <n-icon size="16"><DocumentTextOutline /></n-icon>
            <span>组件数据需求</span>
          </n-space>
        </template>

        <div class="requirements-content">
          <div class="requirements-overview">
            <div class="requirement-item">
              <span class="requirement-label">组件名称:</span>
              <n-text class="requirement-value">{{ componentRequirements.componentName }}</n-text>
            </div>

            <div class="requirement-item">
              <span class="requirement-label">数据源数量:</span>
              <n-text class="requirement-value">
                {{ componentRequirements.minDataSources }}-{{ componentRequirements.maxDataSources }} 个
              </n-text>
            </div>

            <div v-if="componentRequirements.description" class="requirement-item">
              <span class="requirement-label">描述:</span>
              <n-text class="requirement-value">{{ componentRequirements.description }}</n-text>
            </div>
          </div>

          <!-- 详细数据源需求 -->
          <div v-if="componentRequirements.dataSources.length > 0" class="detailed-requirements">
            <h4 class="requirements-subtitle">数据源详细要求</h4>
            <div class="requirements-grid">
              <div v-for="(req, index) in componentRequirements.dataSources" :key="req.id" class="requirement-card">
                <div class="card-header">
                  <div class="card-title">
                    <span class="source-name">{{ req.name }}</span>
                    <n-tag size="tiny" :type="req.required ? 'error' : 'info'">
                      {{ req.required ? '必需' : '可选' }}
                    </n-tag>
                  </div>
                  <n-tag size="tiny" type="default">{{ req.structureType || req.type }}</n-tag>
                </div>

                <div v-if="req.description" class="card-description">
                  <n-text depth="3">{{ req.description }}</n-text>
                </div>

                <div v-if="req.usage" class="card-usage">
                  <n-text depth="3">
                    <strong>用途:</strong>
                    {{ req.usage }}
                  </n-text>
                </div>

                <!-- 字段要求 -->
                <div v-if="req.fields && req.fields.length > 0" class="fields-requirements">
                  <h5 class="fields-title">字段要求</h5>
                  <div class="fields-list">
                    <div v-for="field in req.fields.slice(0, 3)" :key="field.name" class="field-item">
                      <span class="field-name">{{ field.name }}</span>
                      <n-tag size="tiny" :type="getFieldTypeColor(field.type)">
                        {{ field.type }}
                      </n-tag>
                      <span v-if="field.required" class="field-required">*</span>
                    </div>
                    <div v-if="req.fields.length > 3" class="more-fields">
                      <n-text depth="3">... 还有 {{ req.fields.length - 3 }} 个字段</n-text>
                    </div>
                  </div>
                </div>

                <!-- 配置状态 -->
                <div class="config-status">
                  <n-space align="center" size="small">
                    <n-icon size="12" :class="getConfigStatusClass(req.id)">
                      <CheckmarkCircleOutline v-if="isDataSourceConfigured(req.id)" />
                      <WarningOutline v-else />
                    </n-icon>
                    <n-text depth="3" class="status-text" :class="getConfigStatusClass(req.id)">
                      {{ getConfigStatusText(req.id) }}
                    </n-text>
                  </n-space>
                </div>
              </div>
            </div>
          </div>
        </div>
      </n-card>
    </div>

    <!-- 配置状态概览 -->
    <div v-if="hasConfiguration" class="status-overview">
      <n-card size="small" :bordered="false">
        <template #header>
          <n-space align="center" size="small">
            <n-icon size="16"><BarChartOutline /></n-icon>
            <span>配置状态概览</span>
          </n-space>
        </template>

        <div class="status-grid">
          <div class="status-item">
            <div class="status-number">{{ totalDataSources }}</div>
            <div class="status-label">总数据源</div>
          </div>

          <div class="status-item">
            <div class="status-number success">{{ enabledDataSources }}</div>
            <div class="status-label">已启用</div>
          </div>

          <div class="status-item">
            <div class="status-number warning">{{ dataSourcesWithData }}</div>
            <div class="status-label">已配置数据</div>
          </div>

          <div class="status-item">
            <div class="status-number info">{{ dataSourcesWithMappings }}</div>
            <div class="status-label">已配置映射</div>
          </div>
        </div>

        <!-- 验证结果显示 -->
        <div v-if="validationErrors.length > 0" class="validation-results">
          <n-alert type="error" :show-icon="false" size="small">
            <template #header>
              <n-space align="center" size="small">
                <n-icon size="14"><WarningOutline /></n-icon>
                <span>配置问题</span>
              </n-space>
            </template>
            <div class="error-list">
              <div v-for="(error, index) in validationErrors.slice(0, 3)" :key="index" class="error-item">
                {{ error }}
              </div>
              <div v-if="validationErrors.length > 3" class="more-errors">
                <n-text depth="3">... 还有 {{ validationErrors.length - 3 }} 个问题</n-text>
              </div>
            </div>
          </n-alert>
        </div>
      </n-card>
    </div>

    <!-- 主要配置区域 -->
    <div class="main-config-area">
      <MultiDataSourceManager
        v-model="dataSourcesConfig"
        :component-requirements="componentRequirements"
        :max-data-sources="maxDataSources"
        :readonly="readonly"
        @data-sources-change="handleDataSourcesChange"
        @validation-change="handleValidationChange"
      />
    </div>

    <!-- 快速操作区域 -->
    <div v-if="hasConfiguration" class="quick-actions">
      <n-card size="small" :bordered="false">
        <template #header>
          <n-space align="center" size="small">
            <n-icon size="16"><FlashOutline /></n-icon>
            <span>快速操作</span>
          </n-space>
        </template>

        <n-space size="small">
          <n-button size="small" :disabled="!canPreview" @click="previewAllMappings">
            <template #icon>
              <n-icon><EyeOutline /></n-icon>
            </template>
            预览所有映射
          </n-button>

          <n-button size="small" :loading="validating" @click="validateAllConfigurations">
            <template #icon>
              <n-icon><ShieldCheckmarkOutline /></n-icon>
            </template>
            验证所有配置
          </n-button>

          <n-button size="small" :disabled="!hasConfiguration" type="warning" ghost @click="resetAllConfigurations">
            <template #icon>
              <n-icon><RefreshOutline /></n-icon>
            </template>
            重置配置
          </n-button>
        </n-space>
      </n-card>
    </div>

    <!-- 预览结果弹窗 -->
    <n-modal v-model:show="showPreviewModal" title="数据源映射预览" class="mapping-preview-modal">
      <n-card style="width: 800px" title="完整映射结果预览" :bordered="false" size="small">
        <div class="preview-content">
          <div v-if="previewResults.length > 0" class="preview-results">
            <div v-for="(result, index) in previewResults" :key="index" class="result-section">
              <h4 class="result-title">{{ result.name }}</h4>
              <div class="result-display">
                <pre class="result-json">{{ JSON.stringify(result.data, null, 2) }}</pre>
              </div>

              <div v-if="result.errors && result.errors.length > 0" class="result-errors">
                <n-alert v-for="(error, errorIndex) in result.errors" :key="errorIndex" type="error" size="small">
                  {{ error }}
                </n-alert>
              </div>
            </div>
          </div>

          <div v-else class="no-preview">
            <n-empty size="medium" description="无可预览的数据">
              <template #icon>
                <EyeOutline />
              </template>
            </n-empty>
          </div>
        </div>

        <template #footer>
          <n-space justify="end">
            <n-button @click="showPreviewModal = false">关闭</n-button>
            <n-button
              type="primary"
              :disabled="previewResults.length === 0 || hasPreviewErrors"
              @click="applyPreviewResults"
            >
              应用到组件
            </n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据源配置主面板组件
 * 作为数据源配置的统一入口，集成多数据源管理和组件需求显示
 */

import { ref, computed, watch } from 'vue'
import { NCard, NButton, NIcon, NText, NSpace, NTag, NAlert, NModal, NEmpty, useMessage } from 'naive-ui'
import {
  SettingsOutline,
  DocumentTextOutline,
  CheckmarkOutline,
  BarChartOutline,
  CheckmarkCircleOutline,
  WarningOutline,
  FlashOutline,
  EyeOutline,
  ShieldCheckmarkOutline,
  RefreshOutline
} from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'
import MultiDataSourceManager from './MultiDataSourceManager.vue'
import type {
  JsonDataSourceConfig,
  ComponentDataSourceRequirements,
  ComponentFieldRequirement,
  FieldType
} from '../../core/data-source-config-types'

import { DATA_SOURCE_CONFIG_CONSTANTS } from '../../core/data-source-config-types'

// 组件属性定义
interface Props {
  /** 选中的组件 */
  selectedWidget: any
  /** 组件数据需求 */
  componentRequirements?: ComponentDataSourceRequirements
  /** 当前数据源配置 */
  modelValue?: JsonDataSourceConfig[]
  /** 最大数据源数量 */
  maxDataSources?: number
  /** 是否只读 */
  readonly?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: JsonDataSourceConfig[]): void
  (e: 'configuration-change', config: JsonDataSourceConfig[]): void
  (e: 'configuration-applied', data: any): void
  (e: 'validation-change', isValid: boolean, errors: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  maxDataSources: DATA_SOURCE_CONFIG_CONSTANTS.MAX_DATA_SOURCES,
  readonly: false
})

const emit = defineEmits<Emits>()

// 国际化和消息
const { t } = useI18n()
const message = useMessage()

// 组件状态
const dataSourcesConfig = ref<JsonDataSourceConfig[]>([...props.modelValue])
const validationErrors = ref<string[]>([])
const isValidConfiguration = ref(false)
const validating = ref(false)
const showPreviewModal = ref(false)
const previewResults = ref<
  Array<{
    name: string
    data: any
    errors?: string[]
  }>
>([])

// 计算属性
const hasConfiguration = computed(() => dataSourcesConfig.value.length > 0)

const totalDataSources = computed(() => dataSourcesConfig.value.length)

const enabledDataSources = computed(() => {
  return dataSourcesConfig.value.filter(ds => ds.enabled).length
})

const dataSourcesWithData = computed(() => {
  return dataSourcesConfig.value.filter(ds => ds.enabled && ds.jsonData.trim()).length
})

const dataSourcesWithMappings = computed(() => {
  // 这里需要检查字段映射配置，暂时返回示例值
  return dataSourcesConfig.value.filter(ds => ds.enabled && ds.jsonData.trim()).length
})

const configurationStatusType = computed(() => {
  if (!hasConfiguration.value) return 'default'
  if (!isValidConfiguration.value) return 'error'
  if (validationErrors.value.length > 0) return 'warning'
  return 'success'
})

const configurationStatusText = computed(() => {
  if (!hasConfiguration.value) return '未配置'
  if (!isValidConfiguration.value) return '配置无效'
  if (validationErrors.value.length > 0) return '部分问题'
  return '配置完成'
})

const canPreview = computed(() => {
  return hasConfiguration.value && enabledDataSources.value > 0 && dataSourcesWithData.value > 0
})

const hasPreviewErrors = computed(() => {
  return previewResults.value.some(result => result.errors && result.errors.length > 0)
})

// 字段类型颜色映射
const getFieldTypeColor = (type: FieldType) => {
  switch (type) {
    case 'string':
      return 'info'
    case 'number':
      return 'success'
    case 'boolean':
      return 'warning'
    case 'date':
      return 'error'
    default:
      return 'default'
  }
}

// 数据源配置状态检查
const isDataSourceConfigured = (dataSourceId: string): boolean => {
  // 这里应该检查对应数据源ID的配置状态
  // 暂时返回示例逻辑
  return dataSourcesConfig.value.some(
    ds => ds.enabled && ds.jsonData.trim() && ds.id.includes(dataSourceId.toLowerCase())
  )
}

const getConfigStatusClass = (dataSourceId: string): string => {
  return isDataSourceConfigured(dataSourceId) ? 'configured' : 'not-configured'
}

const getConfigStatusText = (dataSourceId: string): string => {
  return isDataSourceConfigured(dataSourceId) ? '已配置' : '未配置'
}

// 事件处理
const handleDataSourcesChange = (dataSources: JsonDataSourceConfig[]) => {
  dataSourcesConfig.value = dataSources
  emit('update:modelValue', dataSources)
  emit('configuration-change', dataSources)
}

const handleValidationChange = (isValid: boolean, errors: string[]) => {
  isValidConfiguration.value = isValid
  validationErrors.value = errors
  emit('validation-change', isValid, errors)
}

// 操作方法
const applyConfiguration = () => {
  if (!isValidConfiguration.value) {
    message.warning('配置无效，无法应用')
    return
  }

  try {
    // 生成最终的数据绑定结果
    const finalData = generateFinalData()
    emit('configuration-applied', finalData)
    message.success('数据源配置已应用到组件')
  } catch (error) {
    message.error('应用配置失败：' + (error instanceof Error ? error.message : '未知错误'))
  }
}

const generateFinalData = (): any => {
  // 这里应该根据数据源配置和字段映射生成最终数据
  // 暂时返回示例数据结构
  const result: any = {}

  dataSourcesConfig.value
    .filter(ds => ds.enabled && ds.jsonData.trim())
    .forEach((ds, index) => {
      try {
        const jsonData = JSON.parse(ds.jsonData)
        result[`dataSource${index + 1}`] = jsonData
      } catch (error) {
        console.warn(`数据源 ${ds.name} JSON解析失败:`, error)
      }
    })

  return result
}

const previewAllMappings = async () => {
  if (!canPreview.value) {
    message.warning('没有可预览的数据源配置')
    return
  }

  const results: Array<{ name: string; data: any; errors?: string[] }> = []

  dataSourcesConfig.value
    .filter(ds => ds.enabled && ds.jsonData.trim())
    .forEach(ds => {
      try {
        const jsonData = JSON.parse(ds.jsonData)
        results.push({
          name: ds.name,
          data: jsonData,
          errors: []
        })
      } catch (error) {
        results.push({
          name: ds.name,
          data: null,
          errors: [`JSON解析失败: ${error instanceof Error ? error.message : '未知错误'}`]
        })
      }
    })

  previewResults.value = results
  showPreviewModal.value = true
}

const validateAllConfigurations = async () => {
  validating.value = true

  try {
    const errors: string[] = []

    // 检查组件需求满足情况
    if (props.componentRequirements) {
      const enabledCount = enabledDataSources.value
      if (enabledCount < props.componentRequirements.minDataSources) {
        errors.push(`至少需要 ${props.componentRequirements.minDataSources} 个启用的数据源`)
      }
      if (enabledCount > props.componentRequirements.maxDataSources) {
        errors.push(`最多只能启用 ${props.componentRequirements.maxDataSources} 个数据源`)
      }
    }

    // 检查每个数据源的有效性
    dataSourcesConfig.value.forEach((ds, index) => {
      if (ds.enabled) {
        if (!ds.jsonData.trim()) {
          errors.push(`数据源 ${index + 1} (${ds.name}): 缺少JSON数据`)
        } else {
          try {
            JSON.parse(ds.jsonData)
          } catch {
            errors.push(`数据源 ${index + 1} (${ds.name}): JSON格式无效`)
          }
        }
      }
    })

    validationErrors.value = errors
    isValidConfiguration.value = errors.length === 0

    if (errors.length === 0) {
      message.success('所有配置验证通过')
    } else {
      message.warning(`发现 ${errors.length} 个配置问题`)
    }
  } catch (error) {
    message.error('验证失败：' + (error instanceof Error ? error.message : '未知错误'))
  } finally {
    validating.value = false
  }
}

const resetAllConfigurations = () => {
  dataSourcesConfig.value = []
  validationErrors.value = []
  isValidConfiguration.value = false
  emit('update:modelValue', [])
  emit('configuration-change', [])
  message.info('所有配置已重置')
}

const applyPreviewResults = () => {
  if (hasPreviewErrors.value) {
    message.warning('预览结果中存在错误，无法应用')
    return
  }

  try {
    const combinedData = previewResults.value.reduce((acc, result) => {
      acc[result.name] = result.data
      return acc
    }, {} as any)

    emit('configuration-applied', combinedData)
    showPreviewModal.value = false
    message.success('预览结果已应用到组件')
  } catch (error) {
    message.error('应用预览结果失败：' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 监听props变化
watch(
  () => props.modelValue,
  newValue => {
    if (JSON.stringify(newValue) !== JSON.stringify(dataSourcesConfig.value)) {
      dataSourcesConfig.value = [...newValue]
    }
  },
  { deep: true }
)

// 初始化时进行验证
watch(
  () => dataSourcesConfig.value,
  () => {
    // 延迟验证，避免频繁触发
    setTimeout(() => {
      validateAllConfigurations()
    }, 500)
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.data-source-config-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* === 面板头部 === */
.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: var(--card-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  color: var(--primary-color);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.header-subtitle {
  font-size: 13px;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* === 需求信息区域 === */
.requirements-section {
  margin: 0;
}

.requirements-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.requirements-overview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.requirement-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.requirement-label {
  font-size: 13px;
  color: var(--text-color-2);
  font-weight: 500;
  min-width: 80px;
}

.requirement-value {
  font-size: 13px;
}

.detailed-requirements {
  margin-top: 16px;
}

.requirements-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 12px 0;
}

.requirements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

/* === 需求卡片 === */
.requirement-card {
  padding: 12px;
  background: var(--hover-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.source-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
}

.card-description,
.card-usage {
  font-size: 12px;
  line-height: 1.4;
}

/* === 字段要求 === */
.fields-requirements {
  margin-top: 8px;
}

.fields-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-2);
  margin: 0 0 6px 0;
}

.fields-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.field-name {
  font-size: 11px;
  font-family: monospace;
  color: var(--text-color);
}

.field-required {
  color: var(--error-color);
  font-weight: bold;
}

.more-fields {
  margin-top: 4px;
}

/* === 配置状态 === */
.config-status {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--divider-color);
}

.configured {
  color: var(--success-color);
}

.not-configured {
  color: var(--warning-color);
}

.status-text {
  font-size: 11px;
}

/* === 状态概览 === */
.status-overview {
  margin: 0;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.status-item {
  text-align: center;
  padding: 12px;
  background: var(--hover-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.status-number {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 4px;
}

.status-number.success {
  color: var(--success-color);
}

.status-number.warning {
  color: var(--warning-color);
}

.status-number.info {
  color: var(--info-color);
}

.status-label {
  font-size: 12px;
  color: var(--text-color-2);
}

/* === 验证结果 === */
.validation-results {
  margin-top: 16px;
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.error-item {
  font-size: 12px;
  line-height: 1.4;
}

.more-errors {
  margin-top: 4px;
}

/* === 主配置区域 === */
.main-config-area {
  flex: 1;
}

/* === 快速操作 === */
.quick-actions {
  margin: 0;
}

/* === 预览弹窗 === */
.mapping-preview-modal :deep(.n-card) {
  max-height: 80vh;
}

.preview-content {
  max-height: 600px;
  overflow-y: auto;
}

.preview-results {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.result-display {
  background: var(--code-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.result-json {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  line-height: 1.4;
  margin: 0;
  padding: 12px;
  color: var(--text-color);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 200px;
  overflow-y: auto;
}

.result-errors {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.no-preview {
  padding: 48px;
  text-align: center;
}

/* === 响应式设计 === */
@media (max-width: 768px) {
  .panel-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .header-status {
    width: 100%;
    justify-content: flex-start;
  }

  .requirements-grid {
    grid-template-columns: 1fr;
  }

  .status-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .field-item {
    flex-wrap: wrap;
  }
}

/* === 主题适配 === */
[data-theme='dark'] .requirement-card {
  background: var(--hover-color-dark);
  border-color: var(--border-color-dark);
}

[data-theme='dark'] .status-item {
  background: var(--hover-color-dark);
  border-color: var(--border-color-dark);
}

[data-theme='dark'] .result-display {
  background: var(--code-color-dark);
  border-color: var(--border-color-dark);
}
</style>
