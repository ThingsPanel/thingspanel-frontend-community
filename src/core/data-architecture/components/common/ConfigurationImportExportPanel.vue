<!--
配置导入导出面板组件
独立的UI组件，提供配置的导入导出功能
-->
<template>
  <n-space align="center">
    <!-- 导出按钮组 -->
    <n-dropdown :options="exportOptions" :disabled="isProcessing" @select="handleExportSelect">
      <n-button type="primary" size="small" :loading="isProcessing">
        <template #icon>
          <n-icon><DownloadOutlined /></n-icon>
        </template>
        {{ $t('common.export') }}
        <template #suffix>
          <n-icon size="14"><DownOutlined /></n-icon>
        </template>
      </n-button>
    </n-dropdown>

    <!-- 导入按钮 -->
    <n-button type="info" size="small" :loading="isProcessing" @click="triggerFileInput">
      <template #icon>
        <n-icon><UploadOutlined /></n-icon>
      </template>
      {{ $t('common.import') }}
    </n-button>

    <!-- 隐藏的文件输入 -->
    <input ref="fileInputRef" type="file" accept=".json" style="display: none" @change="handleImportFileSelect" />

    <!-- 导入预览模态框 -->
    <n-modal
      v-model:show="showImportModal"
      preset="card"
      :title="$t('configuration.import.previewTitle')"
      size="large"
      :bordered="false"
      :segmented="false"
      style="width: 90%; max-width: 800px"
    >
      <div v-if="importPreview" class="import-preview">
        <!-- 基本信息 -->
        <n-card size="small" :title="$t('configuration.import.basicInfo')">
          <n-descriptions :column="2" size="small">
            <n-descriptions-item :label="$t('configuration.import.version')">
              {{ importPreview.basicInfo.version }}
            </n-descriptions-item>
            <n-descriptions-item :label="$t('configuration.import.exportTime')">
              {{ formatDateTime(importPreview.basicInfo.exportTime) }}
            </n-descriptions-item>
            <n-descriptions-item :label="$t('configuration.import.componentType')">
              {{ importPreview.basicInfo.componentType || $t('common.notSpecified') }}
            </n-descriptions-item>
            <n-descriptions-item :label="$t('configuration.import.source')">
              {{ importPreview.basicInfo.exportSource }}
            </n-descriptions-item>
          </n-descriptions>
        </n-card>

        <!-- 配置统计 -->
        <n-card size="small" :title="$t('configuration.import.statistics')">
          <n-space>
            <n-tag type="info">
              {{ $t('configuration.import.dataSourceCount') }}: {{ importPreview.statistics.dataSourceCount }}
            </n-tag>
            <n-tag type="success">
              {{ $t('configuration.import.interactionCount') }}: {{ importPreview.statistics.interactionCount }}
            </n-tag>
            <n-tag type="warning">
              {{ $t('configuration.import.httpConfigCount') }}: {{ importPreview.statistics.httpConfigCount }}
            </n-tag>
          </n-space>
        </n-card>

        <!-- 依赖分析 -->
        <n-card
          v-if="importPreview.dependencies && importPreview.dependencies.length > 0"
          size="small"
          :title="$t('configuration.import.dependencies')"
        >
          <n-space vertical size="small">
            <n-text depth="3">{{ $t('configuration.import.dependenciesHint') }}</n-text>
            <div class="dependency-list">
              <n-tag v-for="dep in importPreview.dependencies" :key="dep" type="info" size="small">
                {{ dep.substring(0, 8) }}...
              </n-tag>
            </div>
          </n-space>
        </n-card>

        <!-- 冲突检测 -->
        <n-alert
          v-if="importPreview.conflicts && importPreview.conflicts.length > 0"
          type="warning"
          :title="$t('configuration.import.conflictsFound')"
          style="margin: 16px 0"
        >
          <ul>
            <li v-for="conflict in importPreview.conflicts" :key="conflict">
              {{ conflict }}
            </li>
          </ul>
        </n-alert>

        <n-alert v-else type="success" :title="$t('configuration.import.noConflicts')" style="margin: 16px 0" />
      </div>

      <template #action>
        <n-space>
          <n-button @click="showImportModal = false">
            {{ $t('common.cancel') }}
          </n-button>
          <n-button
            type="primary"
            :loading="isProcessing"
            :disabled="importPreview?.conflicts.length > 0"
            @click="handleConfirmImport"
          >
            {{ $t('common.confirm') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 单数据源导出选择模态框 -->
    <n-modal
      v-model:show="showSingleDataSourceModal"
      preset="card"
      :title="$t('configuration.export.selectDataSource')"
      size="medium"
      :bordered="false"
      :segmented="false"
      style="width: 90%; max-width: 600px"
    >
      <div v-if="availableDataSources.length > 0" class="datasource-selection">
        <n-text depth="3">{{ $t('configuration.export.selectDataSourceHint') }}</n-text>

        <div class="datasource-list" style="margin-top: 16px">
          <n-card
            v-for="source in availableDataSources"
            :key="source.sourceId"
            size="small"
            hoverable
            :class="['datasource-item', { 'has-data': source.hasData, 'empty-data': !source.hasData }]"
            style="margin-bottom: 8px; cursor: pointer"
            @click="() => handleSingleDataSourceExport(source.sourceId)"
          >
            <div class="datasource-info">
              <div class="datasource-header">
                <n-text strong>{{ source.sourceId }}</n-text>
                <n-tag :type="source.hasData ? 'success' : 'default'" size="small">
                  {{ source.hasData ? t('configuration.export.hasData') : t('configuration.export.noData') }}
                </n-tag>
              </div>
              <div class="datasource-details">
                <n-text depth="3">{{ t('configuration.export.dataItemCount') }}: {{ source.dataItemCount }}</n-text>
                <n-text depth="3">{{ t('configuration.export.position') }}: {{ source.sourceIndex + 1 }}</n-text>
              </div>
            </div>
          </n-card>
        </div>
      </div>

      <template #action>
        <n-space>
          <n-button @click="showSingleDataSourceModal = false">
            {{ $t('common.cancel') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 单数据源导入预览模态框 -->
    <n-modal
      v-model:show="showSingleDataSourceImportModal"
      preset="dialog"
      :title="t('configuration.import.singleDataSourcePreview')"
      style="width: 600px"
      :show-icon="false"
    >
      <div v-if="singleDataSourceImportPreview">
        <n-space vertical>
          <!-- 源信息 -->
          <n-card :title="t('configuration.import.sourceInfo')" size="small">
            <n-descriptions :column="2" size="small">
              <n-descriptions-item :label="t('configuration.export.dataSource')">
                {{ singleDataSourceImportPreview.sourceDataSourceId }}
              </n-descriptions-item>
              <n-descriptions-item :label="t('configuration.import.version')">
                {{ singleDataSourceImportPreview.version }}
              </n-descriptions-item>
              <n-descriptions-item :label="t('configuration.import.exportTime')">
                {{ new Date(singleDataSourceImportPreview.exportTime).toLocaleString() }}
              </n-descriptions-item>
              <n-descriptions-item :label="t('configuration.export.dataItems')">
                {{ singleDataSourceImportPreview.configurationCount }}
              </n-descriptions-item>
            </n-descriptions>
          </n-card>

          <!-- 目标信息 -->
          <n-card :title="t('configuration.import.targetInfo')" size="small">
            <n-form-item :label="t('configuration.import.selectTargetSlot')">
              <n-select
                v-model:value="selectedTargetSlot"
                :options="targetSlotOptions"
                :placeholder="t('configuration.import.selectTargetSlot')"
              >
                <template #option="{ node, option }">
                  <div style="display: flex; justify-content: space-between; align-items: center">
                    <span>{{ option.label }}</span>
                    <n-tag :type="option.occupied ? 'warning' : 'success'" size="small">
                      {{
                        option.occupied ? t('configuration.import.slotOccupied') : t('configuration.import.slotEmpty')
                      }}
                    </n-tag>
                  </div>
                </template>
              </n-select>
            </n-form-item>

            <n-alert
              v-if="selectedTargetSlot && targetSlotOptions.find(slot => slot.value === selectedTargetSlot)?.occupied"
              type="warning"
              :title="t('configuration.import.slotOccupied')"
              style="margin-top: 8px"
            >
              所选槽位已有数据，导入将会覆盖现有配置
            </n-alert>
          </n-card>
        </n-space>
      </div>

      <template #action>
        <n-space>
          <n-button @click="showSingleDataSourceImportModal = false">
            {{ $t('common.cancel') }}
          </n-button>
          <n-button
            type="primary"
            :disabled="!selectedTargetSlot || isProcessing"
            :loading="isProcessing"
            @click="handleSingleDataSourceImport"
          >
            {{ t('configuration.import.importToSlot') }}
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </n-space>
</template>

<script setup lang="ts">
/**
 * 配置导入导出面板组件
 * 提供独立的配置导入导出UI功能
 */

import { ref, computed, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import {
  NSpace,
  NButton,
  NIcon,
  NModal,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NText,
  NAlert,
  NDropdown,
  NSelect,
  NForm,
  NFormItem
} from 'naive-ui'
import { DownloadOutlined, UploadOutlined, DownOutlined } from '@vicons/antd'

import {
  configurationExporter,
  configurationImporter,
  singleDataSourceExporter,
  singleDataSourceImporter
} from '../../utils/ConfigurationImportExport'
import type { ImportPreview, SingleDataSourceImportPreview } from '@/core/data-architecture/utils/ConfigurationImportExport'

// Props定义
interface Props {
  /** 当前配置数据 */
  configuration: Record<string, any>
  /** 组件ID */
  componentId: string
  /** 组件类型（可选） */
  componentType?: string
  /** 配置管理器实例 */
  configurationManager?: any
}

const props = withDefaults(defineProps<Props>(), {
  componentType: '',
  configurationManager: undefined
})

// Emits定义
const emit = defineEmits<{
  /** 导出成功事件 */
  exportSuccess: [data: any]
  /** 导入成功事件 */
  importSuccess: [data: any]
  /** 操作失败事件 */
  operationError: [error: Error]
}>()

const { t } = useI18n()
const message = useMessage()

// 响应式数据
const isProcessing = ref(false)
const showImportModal = ref(false)
const showSingleDataSourceModal = ref(false)
const showSingleDataSourceImportModal = ref(false)
const importFile = ref<File | null>(null)
const importPreview = ref<ImportPreview | null>(null)
const singleDataSourceImportPreview = ref<SingleDataSourceImportPreview | null>(null)
const fileInputRef = ref<HTMLInputElement>()
const availableDataSources = ref<
  Array<{
    sourceId: string
    sourceIndex: number
    hasData: boolean
    dataItemCount: number
  }>
>([])
const targetSlotOptions = ref<
  Array<{
    label: string
    value: string
    disabled: boolean
    occupied: boolean
  }>
>([])
const selectedTargetSlot = ref<string>('')

// 导出选项
const exportOptions = computed(() => [
  {
    label: t('configuration.export.fullConfiguration'),
    key: 'full',
    icon: () => h(NIcon, null, { default: () => h(DownloadOutlined) })
  },
  {
    label: t('configuration.export.singleDataSource'),
    key: 'single',
    icon: () => h(NIcon, null, { default: () => h(DownloadOutlined) })
  }
])

/**
 * 处理配置导出
 */
const handleExportConfiguration = async (): Promise<void> => {
  if (isProcessing.value) return

  try {
    isProcessing.value = true

    if (!props.configurationManager) {
      throw new Error(t('configuration.export.noManagerError'))
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [ConfigurationExportPanel] 开始导出配置', {
      componentId: props.componentId,
      componentType: props.componentType
    })
    }

    // 执行导出
    const exportResult = await configurationExporter.exportConfiguration(
      props.componentId,
      props.configurationManager,
      props.componentType
    )

    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '')
    const fileName = `config_${props.componentId.substring(0, 8)}_${timestamp}.json`

    // 下载文件
    const blob = new Blob([JSON.stringify(exportResult, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)

    message.success(t('configuration.export.success'))
    emit('exportSuccess', exportResult)

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [ConfigurationExportPanel] 配置导出成功', {
      fileName,
      dataSize: JSON.stringify(exportResult).length
    })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [ConfigurationExportPanel] 配置导出失败:', error)
    message.error(`${t('configuration.export.error')}: ${errorMessage}`)
    emit('operationError', error instanceof Error ? error : new Error(errorMessage))
  } finally {
    isProcessing.value = false
  }
}

/**
 * 处理导出选择
 */
const handleExportSelect = (key: string): void => {
  if (key === 'full') {
    handleExportConfiguration()
  } else if (key === 'single') {
    handleShowSingleDataSourceExport()
  }
}

/**
 * 显示单数据源导出选择
 */
const handleShowSingleDataSourceExport = async (): Promise<void> => {
  if (!props.configurationManager) {
    message.error(t('configuration.export.noManagerError'))
    return
  }

  try {
    // 获取可用的数据源列表
    availableDataSources.value = singleDataSourceExporter.getAvailableDataSources(
      props.componentId,
      props.configurationManager
    )

    if (availableDataSources.value.length === 0) {
      message.warning(t('configuration.export.noDataSources'))
      return
    }

    showSingleDataSourceModal.value = true
  } catch (error) {
    console.error('❌ [ConfigurationExportPanel] 获取数据源列表失败:', error)
    message.error(t('configuration.export.getDataSourcesError'))
  }
}

/**
 * 处理单数据源导出
 */
const handleSingleDataSourceExport = async (sourceId: string): Promise<void> => {
  if (isProcessing.value) return

  try {
    isProcessing.value = true

    if (!props.configurationManager) {
      throw new Error(t('configuration.export.noManagerError'))
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [ConfigurationExportPanel] 开始导出单数据源', {
      componentId: props.componentId,
      sourceId
    })
    }

    // 执行单数据源导出
    const exportResult = await singleDataSourceExporter.exportSingleDataSource(
      props.componentId,
      sourceId,
      props.configurationManager,
      props.componentType
    )

    // 生成文件名
    const timestamp = new Date().toISOString().slice(0, 16).replace(/[:-]/g, '')
    const fileName = `datasource_${sourceId}_${timestamp}.json`

    // 下载文件
    const blob = new Blob([JSON.stringify(exportResult, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName
    link.click()
    URL.revokeObjectURL(url)

    message.success(t('configuration.export.success'))
    emit('exportSuccess', exportResult)

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [ConfigurationExportPanel] 单数据源导出成功', {
      sourceId,
      fileName,
      dataSize: JSON.stringify(exportResult).length
    })
    }

    // 关闭模态框
    showSingleDataSourceModal.value = false
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [ConfigurationExportPanel] 单数据源导出失败:', error)
    message.error(`${t('configuration.export.error')}: ${errorMessage}`)
    emit('operationError', error instanceof Error ? error : new Error(errorMessage))
  } finally {
    isProcessing.value = false
  }
}

/**
 * 触发文件选择
 */
const triggerFileInput = (): void => {
  fileInputRef.value?.click()
}

/**
 * 处理导入文件选择
 */
const handleImportFileSelect = (event: Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  if (!file.name.endsWith('.json')) {
    message.error(t('configuration.import.invalidFileType'))
    return
  }

  importFile.value = file
  handlePreviewImport()
}

/**
 * 处理导入预览
 */
const handlePreviewImport = async (): Promise<void> => {
  if (!importFile.value) return

  try {
    isProcessing.value = true

    const fileContent = await readFileAsText(importFile.value)
    const importData = JSON.parse(fileContent)

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [ConfigurationExportPanel] 生成导入预览', {
      fileName: importFile.value.name,
      fileSize: importFile.value.size,
      dataType: importData.type
    })
    }

    // 判断是否为单数据源文件
    if (importData.type === 'singleDataSource') {
      // 处理单数据源导入
      await handleSingleDataSourceImportPreview(importData)
    } else {
      // 处理完整配置导入
      await handleFullConfigurationImportPreview(importData)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [ConfigurationExportPanel] 导入预览失败:', error)
    message.error(`${t('configuration.import.previewError')}: ${errorMessage}`)
    emit('operationError', error instanceof Error ? error : new Error(errorMessage))
  } finally {
    isProcessing.value = false
  }
}

/**
 * 处理完整配置导入预览
 */
const handleFullConfigurationImportPreview = async (importData: any): Promise<void> => {
  // 生成预览
  importPreview.value = configurationImporter.generateImportPreview(
    importData,
    props.componentId,
    props.configurationManager || {},
    props.configuration
  )

  showImportModal.value = true
}

/**
 * 处理单数据源导入预览
 */
const handleSingleDataSourceImportPreview = async (importData: any): Promise<void> => {
  if (!props.configurationManager) {
    throw new Error(t('configuration.export.noManagerError'))
  }

  // 生成单数据源导入预览
  singleDataSourceImportPreview.value = singleDataSourceImporter.generateImportPreview(
    importData,
    props.componentId,
    props.configurationManager
  )

  // 获取目标组件的可用槽位
  await loadTargetSlotOptions()

  showSingleDataSourceImportModal.value = true
}

/**
 * 加载目标槽位选项
 */
const loadTargetSlotOptions = async (): Promise<void> => {
  if (!props.configurationManager) {
    return
  }

  try {
    // 获取当前组件的可用数据源槽位
    const availableSources = singleDataSourceExporter.getAvailableDataSources(
      props.componentId,
      props.configurationManager
    )

    targetSlotOptions.value = availableSources.map(source => ({
      label: `${t('configuration.export.dataSource')} ${source.sourceIndex + 1} (${source.sourceId})`,
      value: source.sourceId,
      disabled: false,
      occupied: source.hasData
    }))
  } catch (error) {
    console.error('❌ [ConfigurationExportPanel] 加载槽位选项失败:', error)
  }
}

/**
 * 执行单数据源导入
 */
const handleSingleDataSourceImport = async (): Promise<void> => {
  if (!importFile.value || !singleDataSourceImportPreview.value || !selectedTargetSlot.value) {
    return
  }

  try {
    isProcessing.value = true

    const fileContent = await readFileAsText(importFile.value)
    const importData = JSON.parse(fileContent)

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [ConfigurationExportPanel] 开始单数据源导入', {
      fileName: importFile.value.name,
      targetSlot: selectedTargetSlot.value
    })
    }

    // 执行导入
    await singleDataSourceImporter.importSingleDataSource(
      importData,
      props.componentId,
      selectedTargetSlot.value,
      props.configurationManager
    )

    message.success(t('configuration.import.success'))
    emit('importSuccess', importData)

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [ConfigurationExportPanel] 单数据源导入成功', {
      targetSlot: selectedTargetSlot.value
    })
    }

    // 关闭模态框
    showSingleDataSourceImportModal.value = false
    resetImportState()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [ConfigurationExportPanel] 单数据源导入失败:', error)
    message.error(`${t('configuration.import.error')}: ${errorMessage}`)
    emit('operationError', error instanceof Error ? error : new Error(errorMessage))
  } finally {
    isProcessing.value = false
  }
}

/**
 * 重置导入状态
 */
const resetImportState = (): void => {
  importFile.value = null
  importPreview.value = null
  singleDataSourceImportPreview.value = null
  selectedTargetSlot.value = ''
  targetSlotOptions.value = []
}

/**
 * 确认导入配置
 */
const handleConfirmImport = async (): Promise<void> => {
  if (!importFile.value || !importPreview.value) return

  try {
    isProcessing.value = true

    const fileContent = await readFileAsText(importFile.value)
    const importData = JSON.parse(fileContent)

    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [ConfigurationExportPanel] 开始导入配置', {
      componentId: props.componentId,
      hasConflicts: importPreview.value.conflicts.length > 0
    })
    }

    // 执行导入
    const importResult = configurationImporter.importConfiguration(
      importData,
      props.componentId,
      props.configurationManager
    )

    message.success(t('configuration.import.success'))
    emit('importSuccess', importResult)

    // 关闭模态框并清理
    showImportModal.value = false
    importFile.value = null
    importPreview.value = null

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ [ConfigurationExportPanel] 配置导入成功', importResult)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [ConfigurationExportPanel] 配置导入失败:', error)
    message.error(`${t('configuration.import.error')}: ${errorMessage}`)
    emit('operationError', error instanceof Error ? error : new Error(errorMessage))
  } finally {
    isProcessing.value = false
  }
}

/**
 * 读取文件内容
 */
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error(t('configuration.import.fileReadError')))
    reader.readAsText(file)
  })
}

/**
 * 格式化日期时间
 */
const formatDateTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}
</script>

<style scoped>
.import-preview {
  max-height: 500px;
  overflow-y: auto;
}

.import-preview > .n-card {
  margin-bottom: 16px;
}

.import-preview > .n-card:last-child {
  margin-bottom: 0;
}

.dependency-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .import-preview {
    max-height: 400px;
  }
}
</style>
