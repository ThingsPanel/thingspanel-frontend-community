<script setup lang="ts">
/**
 * App 图表配置 Tab
 * 使用 PanelEditorV2 进行可视化编辑
 * 数据格式：{ version: "v2", web: { config: {...} }, app: { config: {...} } }
 * 保存到 web_chart_config 字段的 app 部分
 */

import { ref, inject, computed } from 'vue'
import type { Ref } from 'vue'
import { NSpin, NEmpty, NAlert } from 'naive-ui'
import PanelEditorV2 from '@/components/visual-editor/PanelEditorV2.vue'
import { putTemplat } from '@/service/api/system-data'
import { $t } from '@/locales'

const templateData = inject<Ref<any>>('templateData')!

const saving = ref(false)

// 🔥 编辑器配置状态
const editorConfig = ref<{ widgets: any[]; config: any } | undefined>()

// 🔥 是否为旧版数据（非 v2 格式）
const isLegacyData = ref(false)

// Visual Editor 需要一个唯一的 panelId
const panelId = computed(() => {
  return templateData.value?.id ? `template-${templateData.value.id}-app` : ''
})

/**
 * 🔥 解析 web_chart_config 并提取 App 配置
 */
const parseAppChartConfig = () => {
  if (!templateData.value?.web_chart_config) {
    // 没有配置，使用空配置
    editorConfig.value = {
      widgets: [],
      config: { gridConfig: {}, canvasConfig: {} }
    }
    return
  }

  try {
    const parsed = JSON.parse(templateData.value.web_chart_config)

    // 检查是否为 v2 格式
    if (parsed.version === 'v2' && parsed.app?.config) {
      // v2 格式，提取 app.config
      editorConfig.value = parsed.app.config
      isLegacyData.value = false
    } else {
      // 旧版数据或其他格式
      isLegacyData.value = true
      editorConfig.value = undefined
    }
  } catch (e) {
    console.error('❌ 解析 web_chart_config 失败:', e)
    // 解析失败，使用空配置
    editorConfig.value = {
      widgets: [],
      config: { gridConfig: {}, canvasConfig: {} }
    }
  }
}

// 初始化时解析配置
parseAppChartConfig()

/**
 * 🔥 自定义保存处理函数
 * 保存到 web_chart_config 的 app 部分
 */
const handleCustomSave = async (editorState: any) => {
  if (saving.value) return

  saving.value = true
  try {
    // 1. 读取现有配置（保留 web 部分）
    let existingConfig: any = { version: 'v2', web: {}, app: {} }
    if (templateData.value?.web_chart_config) {
      try {
        const parsed = JSON.parse(templateData.value.web_chart_config)
        if (parsed.version === 'v2') {
          existingConfig = parsed
        }
      } catch (e) {
        // 旧版数据或解析失败，忽略
      }
    }

    // 2. 更新 app 部分（保存看板产生的完整数据）
    existingConfig.app = {
      config: editorState, // editorState 是 {widgets: [...], config: {...}}
      updatedAt: new Date().toISOString()
    }

    // 3. 保存到 web_chart_config 字段
    const response = await putTemplat({
      ...templateData.value,
      web_chart_config: JSON.stringify(existingConfig)
    })

    if (response.error) {
      throw new Error(response.error)
    }

    // 更新 templateData
    if (templateData.value) {
      templateData.value.web_chart_config = JSON.stringify(existingConfig)
    }
  } finally {
    saving.value = false
  }
}

/**
 * 监听保存成功事件
 */
const handleSaveSuccess = () => {
  window.$message?.success($t('common.saveSuccess'))
}

/**
 * 监听保存失败事件
 */
const handleSaveError = (error: any) => {
  console.error('保存 App 图表配置失败:', error)
  window.$message?.error($t('common.saveFailed'))
}

/**
 * 🔥 重新创建配置
 */
const handleRecreate = () => {
  isLegacyData.value = false
  editorConfig.value = {
    widgets: [],
    config: { gridConfig: {}, canvasConfig: {} }
  }
}
</script>

<template>
  <div class="tab-content">
    <NSpin :show="saving">
      <!-- 旧版数据提示 -->
      <div v-if="isLegacyData" class="legacy-data-warning">
        <NAlert type="warning" :title="$t('device_template.legacyDataDetected') || '检测到旧版数据'" closable>
          <template #default>
            {{ $t('device_template.legacyDataMessage') || '当前配置为旧版格式，无法直接编辑。请重新创建配置。' }}
          </template>
          <template #action>
            <n-button size="small" @click="handleRecreate">
              {{ $t('device_template.recreate') || '重新创建' }}
            </n-button>
          </template>
        </NAlert>
      </div>

      <!-- panelId 为空时的提示 -->
      <div v-else-if="!panelId" class="empty-state">
        <n-empty :description="$t('common.loadError')" />
      </div>

      <!-- 正常编辑器 -->
      <div v-else-if="editorConfig" class="editor-wrapper">
        <PanelEditorV2
          :key="`app-${panelId}`"
          :panel-id="panelId"
          :initial-config="editorConfig"
          :custom-save-handler="handleCustomSave"
          :show-toolbar="true"
          :show-page-header="false"
          mode="template"
          @save-success="handleSaveSuccess"
          @save-error="handleSaveError"
        />
      </div>
    </NSpin>
  </div>
</template>

<style scoped lang="scss">
.tab-content {
  padding: 0;
  min-height: 600px;
  position: relative;
}

.legacy-data-warning {
  padding: 16px;
}

.editor-wrapper {
  width: 100%;
  height: 100%;
  min-height: 600px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}
</style>
