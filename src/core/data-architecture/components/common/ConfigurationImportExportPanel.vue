<!--
配置导入导出面板组件
独立的UI组件，提供配置的导入导出功能
-->
<template>
  <n-space align="center">
    <!-- 导出按钮 -->
    <n-button 
      type="primary" 
      size="small" 
      :loading="isProcessing"
      @click="handleExportConfiguration"
    >
      <template #icon>
        <n-icon><DownloadOutlined /></n-icon>
      </template>
      {{ $t('common.export') }}
    </n-button>

    <!-- 导入按钮 -->
    <n-button 
      type="info" 
      size="small" 
      :loading="isProcessing"
      @click="triggerFileInput"
    >
      <template #icon>
        <n-icon><UploadOutlined /></n-icon>
      </template>
      {{ $t('common.import') }}
    </n-button>

    <!-- 隐藏的文件输入 -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleImportFileSelect"
    >

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
        <n-card v-if="importPreview.dependencies.length > 0" size="small" :title="$t('configuration.import.dependencies')">
          <n-space vertical size="small">
            <n-text depth="3">{{ $t('configuration.import.dependenciesHint') }}</n-text>
            <div class="dependency-list">
              <n-tag 
                v-for="dep in importPreview.dependencies" 
                :key="dep" 
                type="info" 
                size="small"
              >
                {{ dep.substring(0, 8) }}...
              </n-tag>
            </div>
          </n-space>
        </n-card>

        <!-- 冲突检测 -->
        <n-alert 
          v-if="importPreview.conflicts.length > 0"
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

        <n-alert 
          v-else
          type="success"
          :title="$t('configuration.import.noConflicts')"
          style="margin: 16px 0"
        />
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
  </n-space>
</template>

<script setup lang="ts">
/**
 * 配置导入导出面板组件
 * 提供独立的配置导入导出UI功能
 */

import { ref, computed } from 'vue'
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
  NAlert
} from 'naive-ui'
import { DownloadOutlined, UploadOutlined } from '@vicons/antd'

import { configurationExporter, configurationImporter } from '../../utils/ConfigurationImportExport'
import type { ImportPreview } from '../../utils/ConfigurationImportExport'

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
const importFile = ref<File | null>(null)
const importPreview = ref<ImportPreview | null>(null)
const fileInputRef = ref<HTMLInputElement>()

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

    console.log('🔄 [ConfigurationExportPanel] 开始导出配置', {
      componentId: props.componentId,
      componentType: props.componentType
    })

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

    console.log('✅ [ConfigurationExportPanel] 配置导出成功', {
      fileName,
      dataSize: JSON.stringify(exportResult).length
    })

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

    console.log('🔄 [ConfigurationExportPanel] 生成导入预览', {
      fileName: importFile.value.name,
      fileSize: importFile.value.size
    })

    // 生成预览
    importPreview.value = configurationImporter.generateImportPreview(
      importData,
      props.componentId,
      props.configuration
    )

    showImportModal.value = true

    console.log('✅ [ConfigurationExportPanel] 导入预览生成成功', importPreview.value)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('❌ [ConfigurationExportPanel] 生成导入预览失败:', error)
    message.error(`${t('configuration.import.previewError')}: ${errorMessage}`)
    emit('operationError', error instanceof Error ? error : new Error(errorMessage))
  } finally {
    isProcessing.value = false
  }
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

    console.log('🔄 [ConfigurationExportPanel] 开始导入配置', {
      componentId: props.componentId,
      hasConflicts: importPreview.value.conflicts.length > 0
    })

    // 执行导入
    const importResult = configurationImporter.importConfiguration(
      importData,
      props.componentId,
      props.configuration
    )

    message.success(t('configuration.import.success'))
    emit('importSuccess', importResult)

    // 关闭模态框并清理
    showImportModal.value = false
    importFile.value = null
    importPreview.value = null

    console.log('✅ [ConfigurationExportPanel] 配置导入成功', importResult)

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