<template>
  <div class="multi-data-source-manager">
    <!-- 管理器头部 -->
    <div class="manager-header">
      <div class="header-info">
        <n-icon size="18" class="header-icon">
          <ServerOutline />
        </n-icon>
        <div class="header-content">
          <h3 class="header-title">数据源管理</h3>
          <n-text depth="3" class="header-subtitle">
            {{ enabledDataSourcesCount }}/{{ maxDataSources }} 个数据源已启用
          </n-text>
        </div>
      </div>

      <n-space size="small">
        <n-button
          size="small"
          :loading="testingAll"
          :disabled="enabledDataSourcesCount === 0"
          ghost
          @click="testAllDataSources"
        >
          <template #icon>
            <n-icon><PlayCircleOutline /></n-icon>
          </template>
          测试所有
        </n-button>
        <n-button size="small" :disabled="dataSources.length >= maxDataSources" type="primary" @click="addDataSource">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          添加数据源
        </n-button>
      </n-space>
    </div>

    <!-- 数据源需求提示 -->
    <div v-if="componentRequirements" class="requirements-info">
      <n-alert type="info" :show-icon="false" size="small">
        <template #header>
          <n-space align="center" size="small">
            <n-icon size="14"><InformationCircleOutline /></n-icon>
            <span>组件数据需求</span>
          </n-space>
        </template>
        <div class="requirements-content">
          <p class="requirements-text">
            该组件需要 {{ componentRequirements.minDataSources }}-{{ componentRequirements.maxDataSources }} 个数据源，
            当前已配置 {{ dataSources.length }} 个
          </p>
          <div v-if="componentRequirements.dataSources.length > 0" class="required-sources">
            <n-space size="small" wrap>
              <n-tag
                v-for="req in componentRequirements.dataSources"
                :key="req.id"
                :type="req.required ? 'error' : 'info'"
                size="small"
              >
                {{ req.name }} ({{ req.structureType || req.type }})
                <span v-if="req.required">*</span>
              </n-tag>
            </n-space>
          </div>
        </div>
      </n-alert>
    </div>

    <!-- 数据源列表 -->
    <div class="data-sources-list">
      <div v-if="dataSources.length === 0" class="empty-state">
        <n-empty size="medium" description="暂无数据源">
          <template #icon>
            <ServerOutline />
          </template>
          <template #extra>
            <n-text depth="3" class="empty-hint">点击"添加数据源"开始配置组件的数据绑定</n-text>
          </template>
        </n-empty>
      </div>

      <div v-else class="sources-grid">
        <div
          v-for="(dataSource, index) in dataSources"
          :key="dataSource.id"
          class="data-source-item"
          :class="{
            'source-disabled': !dataSource.enabled,
            'source-active': activeDataSourceIndex === index,
            'source-has-error': dataSource.validationErrors?.length > 0
          }"
        >
          <!-- 数据源头部 -->
          <div class="source-header" @click="toggleDataSource(index)">
            <div class="source-info">
              <div class="source-title-row">
                <n-space align="center" size="small">
                  <n-icon size="14" class="source-icon">
                    <DocumentTextOutline />
                  </n-icon>
                  <span class="source-name">{{ dataSource.name }}</span>
                  <n-tag size="tiny" :type="getDataSourceStatusType(dataSource)">
                    {{ getDataSourceStatusText(dataSource) }}
                  </n-tag>
                </n-space>
              </div>

              <div class="source-metadata">
                <n-space size="small" wrap>
                  <n-text depth="3" class="metadata-item">创建: {{ formatDate(dataSource.createdAt) }}</n-text>
                  <n-text v-if="dataSource.updatedAt > dataSource.createdAt" depth="3" class="metadata-item">
                    更新: {{ formatDate(dataSource.updatedAt) }}
                  </n-text>
                  <n-text v-if="getJsonDataSize(dataSource.jsonData)" depth="3" class="metadata-item">
                    大小: {{ getJsonDataSize(dataSource.jsonData) }}
                  </n-text>
                </n-space>
              </div>
            </div>

            <div class="source-actions" @click.stop>
              <n-space size="small">
                <n-switch
                  v-model:value="dataSource.enabled"
                  size="small"
                  @update:value="() => updateDataSource(index)"
                />

                <n-dropdown :options="getDataSourceActions(index)" @select="key => handleDataSourceAction(key, index)">
                  <n-button size="tiny" quaternary>
                    <template #icon>
                      <n-icon><EllipsisHorizontalOutline /></n-icon>
                    </template>
                  </n-button>
                </n-dropdown>
              </n-space>
            </div>
          </div>

          <!-- 展开的编辑区域 -->
          <div v-if="activeDataSourceIndex === index" class="source-content">
            <n-tabs type="line" animated size="small">
              <!-- JSON数据编辑 -->
              <n-tab-pane name="json" tab="JSON数据">
                <div class="tab-content">
                  <JsonDataSourceEditor
                    v-model="dataSource.jsonData"
                    @structure-change="structure => handleStructureChange(index, structure)"
                    @validation-change="(isValid, error) => handleJsonValidation(index, isValid, error)"
                  />
                </div>
              </n-tab-pane>

              <!-- 字段映射 -->
              <n-tab-pane name="mapping" tab="字段映射">
                <div class="tab-content">
                  <PathMappingEditor
                    :model-value="dataSource.fieldMappings || []"
                    :target-fields="getTargetFields(index)"
                    :source-data="getParsedJsonData(dataSource.jsonData)"
                    @update:model-value="value => updateFieldMappings(index, value)"
                    @mapping-change="result => handleMappingChange(index, result)"
                    @validation-change="(isValid, errors) => handleMappingValidation(index, isValid, errors)"
                  />
                </div>
              </n-tab-pane>

              <!-- 数据预览 -->
              <n-tab-pane name="preview" tab="数据预览">
                <div class="tab-content">
                  <div class="preview-section">
                    <div class="preview-header">
                      <h4 class="preview-title">
                        <n-icon size="14"><EyeOutline /></n-icon>
                        数据预览
                      </h4>
                      <n-button size="small" :loading="dataSource.isRefreshing" ghost @click="refreshPreview(index)">
                        <template #icon>
                          <n-icon><RefreshOutline /></n-icon>
                        </template>
                        刷新
                      </n-button>
                    </div>

                    <div class="preview-content">
                      <!-- 原始数据预览 -->
                      <div class="preview-block">
                        <h5 class="block-title">原始JSON数据</h5>
                        <div class="json-preview">
                          <pre class="json-code">{{ formatJsonPreview(dataSource.jsonData) }}</pre>
                        </div>
                      </div>

                      <!-- 映射结果预览 -->
                      <div v-if="dataSource.fieldMappings?.length > 0" class="preview-block">
                        <h5 class="block-title">字段映射结果</h5>
                        <div class="mapping-preview">
                          <div v-if="dataSource.mappingResult" class="mapping-result">
                            <pre class="json-code">{{ JSON.stringify(dataSource.mappingResult, null, 2) }}</pre>
                          </div>
                          <div v-else class="no-mapping-result">
                            <n-text depth="3">请先配置字段映射</n-text>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </n-tab-pane>

              <!-- 高级设置 -->
              <n-tab-pane name="settings" tab="设置">
                <div class="tab-content">
                  <div class="settings-form">
                    <div class="form-section">
                      <h4 class="section-title">基础设置</h4>

                      <div class="form-item">
                        <label class="form-label">数据源名称</label>
                        <n-input
                          v-model:value="dataSource.name"
                          placeholder="为数据源设置一个有意义的名称"
                          @update:value="() => updateDataSource(index)"
                        />
                      </div>

                      <div class="form-item">
                        <label class="form-label">描述信息</label>
                        <n-input
                          v-model:value="dataSource.description"
                          type="textarea"
                          :rows="2"
                          placeholder="描述这个数据源的用途和内容"
                          @update:value="() => updateDataSource(index)"
                        />
                      </div>
                    </div>

                    <div class="form-section">
                      <h4 class="section-title">状态信息</h4>

                      <div class="status-grid">
                        <div class="status-item">
                          <span class="status-label">数据源ID:</span>
                          <n-text class="status-value" depth="3">{{ dataSource.id }}</n-text>
                        </div>
                        <div class="status-item">
                          <span class="status-label">创建时间:</span>
                          <n-text class="status-value" depth="3">{{ formatDateTime(dataSource.createdAt) }}</n-text>
                        </div>
                        <div class="status-item">
                          <span class="status-label">最后更新:</span>
                          <n-text class="status-value" depth="3">{{ formatDateTime(dataSource.updatedAt) }}</n-text>
                        </div>
                        <div class="status-item">
                          <span class="status-label">数据有效性:</span>
                          <n-tag size="tiny" :type="dataSource.isJsonValid ? 'success' : 'error'">
                            {{ dataSource.isJsonValid ? '有效' : '无效' }}
                          </n-tag>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </n-tab-pane>
            </n-tabs>
          </div>
        </div>
      </div>
    </div>

    <!-- 全局配置面板 -->
    <div v-if="dataSources.length > 0" class="global-config">
      <n-card size="small" :bordered="false">
        <template #header>
          <n-space align="center" size="small">
            <n-icon size="14"><SettingsOutline /></n-icon>
            <span>全局配置</span>
          </n-space>
        </template>

        <div class="global-actions">
          <n-space>
            <n-button size="small" :disabled="dataSources.length === 0" @click="exportConfiguration">
              <template #icon>
                <n-icon><DownloadOutline /></n-icon>
              </template>
              导出配置
            </n-button>

            <n-button size="small" @click="importConfiguration">
              <template #icon>
                <n-icon><CloudUploadOutline /></n-icon>
              </template>
              导入配置
            </n-button>

            <n-button size="small" :disabled="dataSources.length === 0" type="error" ghost @click="clearAllDataSources">
              <template #icon>
                <n-icon><TrashOutline /></n-icon>
              </template>
              清空所有
            </n-button>
          </n-space>
        </div>
      </n-card>
    </div>

    <!-- 导入配置弹窗 -->
    <n-modal v-model:show="showImportModal" title="导入数据源配置">
      <n-card style="width: 600px" title="导入配置文件" :bordered="false" size="small">
        <div class="import-content">
          <n-upload ref="uploadRef" accept=".json" :max="1" :show-file-list="false" @before-upload="handleImportFile">
            <n-upload-dragger>
              <div class="upload-content">
                <n-icon size="48" :depth="3">
                  <CloudUploadOutline />
                </n-icon>
                <n-text class="upload-text">点击或拖拽JSON配置文件到此区域上传</n-text>
              </div>
            </n-upload-dragger>
          </n-upload>

          <div v-if="importPreview" class="import-preview">
            <h4>配置预览</h4>
            <pre class="import-json">{{ JSON.stringify(importPreview, null, 2) }}</pre>
          </div>
        </div>

        <template #footer>
          <n-space justify="end">
            <n-button @click="showImportModal = false">取消</n-button>
            <n-button type="primary" :disabled="!importPreview" @click="confirmImport">确认导入</n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 多数据源管理器组件
 * 提供完整的数据源管理功能，包括添加、编辑、删除、预览等
 */

import { ref, computed, watch, nextTick } from 'vue'
import {
  NButton,
  NIcon,
  NText,
  NSpace,
  NAlert,
  NTag,
  NEmpty,
  NSwitch,
  NDropdown,
  NTabs,
  NTabPane,
  NInput,
  NCard,
  NModal,
  NUpload,
  NUploadDragger,
  useMessage,
  DropdownOption
} from 'naive-ui'
import {
  ServerOutline,
  PlayCircleOutline,
  AddOutline,
  InformationCircleOutline,
  DocumentTextOutline,
  EllipsisHorizontalOutline,
  EyeOutline,
  RefreshOutline,
  SettingsOutline,
  DownloadOutline,
  CloudUploadOutline,
  TrashOutline
} from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'
import JsonDataSourceEditor from './JsonDataSourceEditor.vue'
import PathMappingEditor from './PathMappingEditor.vue'
import type {
  JsonDataSourceConfig,
  ComponentFieldRequirement,
  ComponentDataSourceRequirements,
  ParsedJsonStructure,
  FieldMappingRule
} from '../../core/data-source-config-types'

import { DATA_SOURCE_CONFIG_CONSTANTS } from '../../core/data-source-config-types'

// 扩展数据源配置，添加运行时状态
interface ExtendedJsonDataSourceConfig extends JsonDataSourceConfig {
  isJsonValid: boolean
  jsonStructure?: ParsedJsonStructure | null
  fieldMappings?: FieldMappingRule[]
  mappingResult?: any
  validationErrors?: string[]
  isRefreshing?: boolean
  description?: string
}

// 组件属性定义
interface Props {
  /** 数据源配置列表 */
  modelValue: JsonDataSourceConfig[]
  /** 组件数据需求 */
  componentRequirements?: ComponentDataSourceRequirements
  /** 最大数据源数量 */
  maxDataSources?: number
  /** 是否只读 */
  readonly?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: JsonDataSourceConfig[]): void
  (e: 'data-sources-change', dataSources: JsonDataSourceConfig[]): void
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
const dataSources = ref<ExtendedJsonDataSourceConfig[]>([])
const activeDataSourceIndex = ref(-1)
const testingAll = ref(false)
const showImportModal = ref(false)
const importPreview = ref<any>(null)
const uploadRef = ref()

// 计算属性
const enabledDataSourcesCount = computed(() => {
  return dataSources.value.filter(ds => ds.enabled).length
})

// 初始化数据源列表
const initializeDataSources = () => {
  dataSources.value = props.modelValue.map(ds => ({
    ...ds,
    isJsonValid: false,
    jsonStructure: null,
    fieldMappings: [],
    mappingResult: null,
    validationErrors: [],
    isRefreshing: false,
    description: ds.description || ''
  }))

  // 验证现有数据源
  dataSources.value.forEach((ds, index) => {
    if (ds.jsonData) {
      validateJsonData(index, ds.jsonData)
    }
  })
}

// 数据源操作
const addDataSource = () => {
  if (dataSources.value.length >= props.maxDataSources) {
    message.warning(`最多只能添加 ${props.maxDataSources} 个数据源`)
    return
  }

  const newDataSource: ExtendedJsonDataSourceConfig = {
    id: generateDataSourceId(),
    name: `${DATA_SOURCE_CONFIG_CONSTANTS.DEFAULT_JSON_SOURCE_NAME_PREFIX}${dataSources.value.length + 1}`,
    jsonData: '',
    enabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    isJsonValid: false,
    jsonStructure: null,
    fieldMappings: [],
    mappingResult: null,
    validationErrors: [],
    isRefreshing: false,
    description: ''
  }

  dataSources.value.push(newDataSource)
  activeDataSourceIndex.value = dataSources.value.length - 1
  updateDataSources()
}

const removeDataSource = (index: number) => {
  dataSources.value.splice(index, 1)
  if (activeDataSourceIndex.value >= index) {
    activeDataSourceIndex.value = Math.max(-1, activeDataSourceIndex.value - 1)
  }
  updateDataSources()
  message.success('数据源已删除')
}

const duplicateDataSource = (index: number) => {
  if (dataSources.value.length >= props.maxDataSources) {
    message.warning(`最多只能添加 ${props.maxDataSources} 个数据源`)
    return
  }

  const source = dataSources.value[index]
  const duplicated: ExtendedJsonDataSourceConfig = {
    ...source,
    id: generateDataSourceId(),
    name: `${source.name} (副本)`,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  dataSources.value.push(duplicated)
  activeDataSourceIndex.value = dataSources.value.length - 1
  updateDataSources()
  message.success('数据源已复制')
}

const toggleDataSource = (index: number) => {
  activeDataSourceIndex.value = activeDataSourceIndex.value === index ? -1 : index
}

const updateDataSource = (index: number) => {
  const dataSource = dataSources.value[index]
  dataSource.updatedAt = new Date()
  updateDataSources()
}

// 数据源操作菜单
const getDataSourceActions = (index: number): DropdownOption[] => [
  {
    label: '复制',
    key: 'duplicate',
    icon: () =>
      h(NIcon, () =>
        h(
          'svg',
          { viewBox: '0 0 24 24' },
          h('path', {
            d: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
            fill: 'currentColor'
          })
        )
      )
  },
  {
    label: '删除',
    key: 'delete',
    icon: () => h(NIcon, () => h(TrashOutline))
  }
]

const handleDataSourceAction = (key: string, index: number) => {
  switch (key) {
    case 'duplicate':
      duplicateDataSource(index)
      break
    case 'delete':
      removeDataSource(index)
      break
  }
}

// 数据源状态管理
const getDataSourceStatusType = (dataSource: ExtendedJsonDataSourceConfig) => {
  if (!dataSource.enabled) return 'default'
  if (dataSource.validationErrors?.length > 0) return 'error'
  if (dataSource.isJsonValid && dataSource.jsonData) return 'success'
  return 'warning'
}

const getDataSourceStatusText = (dataSource: ExtendedJsonDataSourceConfig) => {
  if (!dataSource.enabled) return '已禁用'
  if (dataSource.validationErrors?.length > 0) return '有错误'
  if (dataSource.isJsonValid && dataSource.jsonData) return '正常'
  if (!dataSource.jsonData) return '未配置'
  return '无效'
}

// JSON数据处理
const validateJsonData = (index: number, jsonData: string) => {
  const dataSource = dataSources.value[index]

  if (!jsonData.trim()) {
    dataSource.isJsonValid = false
    dataSource.jsonStructure = null
    return
  }

  try {
    JSON.parse(jsonData)
    dataSource.isJsonValid = true
  } catch (error) {
    dataSource.isJsonValid = false
  }
}

const handleStructureChange = (index: number, structure: ParsedJsonStructure | null) => {
  const dataSource = dataSources.value[index]
  dataSource.jsonStructure = structure
  updateDataSource(index)
}

const handleJsonValidation = (index: number, isValid: boolean, error?: string) => {
  const dataSource = dataSources.value[index]
  dataSource.isJsonValid = isValid

  if (error) {
    dataSource.validationErrors = [error]
  } else {
    dataSource.validationErrors = []
  }

  updateDataSource(index)
}

const getParsedJsonData = (jsonData: string): any => {
  try {
    return JSON.parse(jsonData)
  } catch {
    return null
  }
}

// 字段映射处理
const getTargetFields = (index: number): ComponentFieldRequirement[] => {
  // 这里应该根据组件需求返回目标字段
  // 暂时返回示例字段
  return [
    { name: 'id', type: 'string', description: '唯一标识', required: true, example: 'item_001' },
    { name: 'name', type: 'string', description: '名称', required: true, example: '示例名称' },
    { name: 'value', type: 'number', description: '数值', required: true, example: 123.45 },
    { name: 'status', type: 'string', description: '状态', required: false, example: 'active' }
  ]
}

const handleMappingChange = (index: number, result: any) => {
  const dataSource = dataSources.value[index]
  dataSource.mappingResult = result
  updateDataSource(index)
}

const handleMappingValidation = (index: number, isValid: boolean, errors: string[]) => {
  const dataSource = dataSources.value[index]
  if (!isValid) {
    dataSource.validationErrors = [...(dataSource.validationErrors || []), ...errors]
  }
  updateDataSource(index)
}

// 测试功能
const testAllDataSources = async () => {
  testingAll.value = true

  try {
    const enabledSources = dataSources.value.filter(ds => ds.enabled)
    let successCount = 0

    for (const dataSource of enabledSources) {
      if (dataSource.jsonData && dataSource.isJsonValid) {
        successCount++
      }
    }

    message.success(`测试完成：${successCount}/${enabledSources.length} 个数据源正常`)
  } catch (error) {
    message.error('测试失败：' + (error instanceof Error ? error.message : '未知错误'))
  } finally {
    testingAll.value = false
  }
}

const refreshPreview = async (index: number) => {
  const dataSource = dataSources.value[index]
  dataSource.isRefreshing = true

  try {
    // 这里可以添加数据刷新逻辑
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟异步操作
    message.success('预览数据已刷新')
  } catch (error) {
    message.error('刷新失败：' + (error instanceof Error ? error.message : '未知错误'))
  } finally {
    dataSource.isRefreshing = false
  }
}

// 配置导入导出
const exportConfiguration = () => {
  const config = {
    version: DATA_SOURCE_CONFIG_CONSTANTS.CONFIG_VERSION,
    dataSources: dataSources.value.map(ds => ({
      id: ds.id,
      name: ds.name,
      jsonData: ds.jsonData,
      enabled: ds.enabled,
      description: ds.description,
      fieldMappings: ds.fieldMappings,
      createdAt: ds.createdAt,
      updatedAt: ds.updatedAt
    })),
    exportedAt: new Date().toISOString()
  }

  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `data-sources-config-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)

  message.success('配置已导出')
}

const importConfiguration = () => {
  showImportModal.value = true
}

const handleImportFile = (data: { file: File }) => {
  const reader = new FileReader()

  reader.onload = e => {
    try {
      const result = e.target?.result as string
      const config = JSON.parse(result)

      // 验证配置格式
      if (!config.dataSources || !Array.isArray(config.dataSources)) {
        throw new Error('无效的配置文件格式')
      }

      importPreview.value = config
    } catch (error) {
      message.error('文件解析失败：' + (error instanceof Error ? error.message : '未知错误'))
      importPreview.value = null
    }
  }

  reader.readAsText(data.file)
  return false // 阻止默认上传行为
}

const confirmImport = () => {
  if (!importPreview.value) return

  try {
    const newDataSources: ExtendedJsonDataSourceConfig[] = importPreview.value.dataSources.map((ds: any) => ({
      ...ds,
      id: ds.id || generateDataSourceId(),
      createdAt: new Date(ds.createdAt || Date.now()),
      updatedAt: new Date(ds.updatedAt || Date.now()),
      isJsonValid: false,
      jsonStructure: null,
      mappingResult: null,
      validationErrors: [],
      isRefreshing: false
    }))

    dataSources.value = newDataSources

    // 验证导入的数据
    dataSources.value.forEach((ds, index) => {
      if (ds.jsonData) {
        validateJsonData(index, ds.jsonData)
      }
    })

    updateDataSources()
    showImportModal.value = false
    importPreview.value = null
    message.success(`成功导入 ${newDataSources.length} 个数据源`)
  } catch (error) {
    message.error('导入失败：' + (error instanceof Error ? error.message : '未知错误'))
  }
}

const clearAllDataSources = () => {
  if (dataSources.value.length === 0) return

  dataSources.value = []
  activeDataSourceIndex.value = -1
  updateDataSources()
  message.success('所有数据源已清空')
}

// 工具函数
const generateDataSourceId = (): string => {
  return `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('zh-CN')
}

const formatDateTime = (date: Date): string => {
  return new Date(date).toLocaleString('zh-CN')
}

const getJsonDataSize = (jsonData: string): string => {
  if (!jsonData) return ''
  const size = new Blob([jsonData]).size
  if (size < 1024) return `${size}B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`
  return `${(size / 1024 / 1024).toFixed(1)}MB`
}

const formatJsonPreview = (jsonData: string): string => {
  if (!jsonData) return '无数据'

  try {
    const parsed = JSON.parse(jsonData)
    const preview = JSON.stringify(parsed, null, 2)

    // 限制预览长度
    if (preview.length > 500) {
      return preview.substring(0, 500) + '\n...\n(数据被截断)'
    }

    return preview
  } catch {
    return '无效的JSON数据'
  }
}

// 更新字段映射
const updateFieldMappings = (index: number, fieldMappings: any[]) => {
  if (dataSources.value[index]) {
    dataSources.value[index].fieldMappings = fieldMappings
    // 更新时间戳
    dataSources.value[index].updatedAt = new Date().toISOString()
    updateDataSources()
  }
}

// 数据同步
const updateDataSources = () => {
  const cleanedDataSources: JsonDataSourceConfig[] = dataSources.value.map(ds => ({
    id: ds.id,
    name: ds.name,
    jsonData: ds.jsonData,
    enabled: ds.enabled,
    fieldMappings: ds.fieldMappings,
    createdAt: ds.createdAt,
    updatedAt: ds.updatedAt
  }))

  emit('update:modelValue', cleanedDataSources)
  emit('data-sources-change', cleanedDataSources)

  // 验证整体配置
  validateOverallConfiguration()
}

const validateOverallConfiguration = () => {
  const errors: string[] = []

  // 检查数据源数量
  if (props.componentRequirements) {
    const enabledCount = enabledDataSourcesCount.value
    if (enabledCount < props.componentRequirements.minDataSources) {
      errors.push(`至少需要 ${props.componentRequirements.minDataSources} 个数据源`)
    }
    if (enabledCount > props.componentRequirements.maxDataSources) {
      errors.push(`最多只能启用 ${props.componentRequirements.maxDataSources} 个数据源`)
    }
  }

  // 检查各个数据源的错误
  dataSources.value.forEach((ds, index) => {
    if (ds.enabled && ds.validationErrors?.length > 0) {
      errors.push(`数据源 ${index + 1} (${ds.name}): ${ds.validationErrors.join(', ')}`)
    }
  })

  emit('validation-change', errors.length === 0, errors)
}

// Vue helper
const h = (tag: any, props?: any, children?: any) => {
  // 简单的createElement助手
  return { tag, props, children }
}

// 监听props变化
watch(
  () => props.modelValue,
  newValue => {
    if (
      JSON.stringify(newValue) !==
      JSON.stringify(
        dataSources.value.map(ds => ({
          id: ds.id,
          name: ds.name,
          jsonData: ds.jsonData,
          enabled: ds.enabled,
          createdAt: ds.createdAt,
          updatedAt: ds.updatedAt
        }))
      )
    ) {
      initializeDataSources()
    }
  },
  { deep: true }
)

// 初始化
initializeDataSources()
</script>

<style scoped>
.multi-data-source-manager {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* === 管理器头部 === */
.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--card-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  color: var(--primary-color);
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.header-subtitle {
  font-size: 12px;
}

/* === 需求信息 === */
.requirements-info {
  margin: 0;
}

.requirements-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.requirements-text {
  margin: 0;
  font-size: 13px;
}

.required-sources {
  margin-top: 4px;
}

/* === 数据源列表 === */
.data-sources-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  padding: 48px 16px;
  text-align: center;
}

.empty-hint {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.4;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.sources-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* === 数据源项 === */
.data-source-item {
  background: var(--card-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: all 0.2s ease;
}

.source-disabled {
  opacity: 0.6;
}

.source-active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color-suppl);
}

.source-has-error {
  border-color: var(--error-color);
}

.source-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.source-header:hover {
  background: var(--hover-color);
}

.source-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.source-title-row {
  display: flex;
  align-items: center;
}

.source-icon {
  color: var(--primary-color);
}

.source-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
}

.source-metadata {
  display: flex;
  flex-wrap: wrap;
}

.metadata-item {
  font-size: 11px;
  white-space: nowrap;
}

.source-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* === 数据源内容区域 === */
.source-content {
  border-top: 1px solid var(--divider-color);
  background: var(--hover-color);
}

.tab-content {
  padding: 16px;
}

/* === 预览区域 === */
.preview-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.block-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color-2);
  margin: 0;
}

.json-preview,
.mapping-preview {
  background: var(--code-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.json-code {
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

.mapping-result {
  /* 样式继承自json-preview */
}

.no-mapping-result {
  padding: 24px;
  text-align: center;
}

/* === 设置表单 === */
.settings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 8px 0;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--divider-color);
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-2);
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: var(--hover-color);
  border-radius: 4px;
}

.status-label {
  font-size: 11px;
  color: var(--text-color-2);
  font-weight: 500;
}

.status-value {
  font-size: 11px;
  font-family: monospace;
}

/* === 全局配置 === */
.global-config {
  margin-top: 8px;
}

.global-actions {
  display: flex;
  justify-content: center;
}

/* === 导入弹窗 === */
.import-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px;
}

.upload-text {
  font-size: 14px;
  text-align: center;
  color: var(--text-color-2);
}

.import-preview {
  max-height: 300px;
  overflow-y: auto;
}

.import-preview h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 8px 0;
}

.import-json {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  line-height: 1.4;
  margin: 0;
  padding: 12px;
  background: var(--code-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  white-space: pre-wrap;
  word-break: break-word;
}

/* === 响应式设计 === */
@media (max-width: 768px) {
  .manager-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .source-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .source-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .preview-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .global-actions {
    justify-content: flex-start;
  }

  .global-actions :deep(.n-space) {
    flex-wrap: wrap;
  }
}

/* === 主题适配 === */
[data-theme='dark'] .data-source-item {
  background: var(--card-color-dark);
  border-color: var(--border-color-dark);
}

[data-theme='dark'] .source-header:hover {
  background: var(--hover-color-dark);
}

[data-theme='dark'] .source-content {
  border-color: var(--divider-color-dark);
  background: var(--hover-color-dark);
}
</style>
