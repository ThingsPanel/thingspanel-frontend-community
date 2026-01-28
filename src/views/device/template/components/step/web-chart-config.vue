<script setup lang="tsx">
/**
 * Web图表配置步骤
 * 显示预览，点击编辑按钮打开ThingsVis编辑器弹窗
 */

import { ref, onMounted } from 'vue'
import { NButton, NModal, NCard, NEmpty } from 'naive-ui'
import { $t } from '@/locales'
import { getTemplat, putTemplat } from '@/service/api'
import ThingsVisEditor from '@/components/thingsvis/ThingsVisEditor.vue'
import { extractPlatformFields } from '@/utils/thingsvis/platform-fields'
import type { PlatformField } from '@/utils/thingsvis/types'

const emit = defineEmits(['update:stepCurrent', 'update:modalVisible'])

const props = defineProps({
  stepCurrent: {
    type: Number,
    required: true
  },
  modalVisible: {
    type: Boolean,
    required: true
  },
  deviceTemplateId: {
    type: String,
    required: true
  }
})

// 编辑器引用
const editorRef = ref<InstanceType<typeof ThingsVisEditor>>()

// 状态
const loading = ref(true)
const saving = ref(false)
const showEditorModal = ref(false)
const initialConfig = ref<any>(null)
const platformFields = ref<PlatformField[]>([])
const hasConfig = ref(false)

// 取消
const cancellation: () => void = () => {
  emit('update:modalVisible')
}

// 上一步
const back: () => void = () => {
  emit('update:stepCurrent', 2)
}

// 打开编辑器
const openEditor = () => {
  showEditorModal.value = true
}

// 下一步 (直接跳过，不强制编辑)
const next = () => {
  emit('update:stepCurrent', 4)
}

// 处理保存
const handleSave = async (payload: any) => {
  console.log('[web-chart-config] handleSave 被调用:', payload)
  
  if (saving.value) {
    console.log('[web-chart-config] 正在保存中，跳过')
    return
  }

  saving.value = true
  try {
    console.log('[web-chart-config] 开始保存，deviceTemplateId:', props.deviceTemplateId)
    
    // 获取当前模板数据
    const res = await getTemplat(props.deviceTemplateId)
    console.log('[web-chart-config] 获取模板成功:', res.data)

    // 保存到 web_chart_config 和 app_chart_config 字段
    // 根据用户要求，两个字段都保存同一份完整的配置数据
    const configStr = JSON.stringify(payload)
    await putTemplat({
      ...res.data,
      web_chart_config: configStr,
      app_chart_config: configStr
    })
    console.log('[web-chart-config] 保存成功 (web & app)')

    window.$message?.success($t('common.saveSuccess'))

    // 更新状态
    initialConfig.value = payload
    hasConfig.value = true
    
    // 关闭弹窗
    showEditorModal.value = false
  } catch (error) {
    console.error('[web-chart-config] 保存失败:', error)
    window.$message?.error($t('common.saveFailed'))
  } finally {
    saving.value = false
  }
}

// 加载模板数据
const loadTemplateData = async () => {
  loading.value = true
  try {
    const res = await getTemplat(props.deviceTemplateId)

    if (res.data) {
      // 提取平台字段
      platformFields.value = extractPlatformFields(res.data)

      // 加载已有配置
      if (res.data.web_chart_config) {
        try {
          const config = JSON.parse(res.data.web_chart_config)
          initialConfig.value = config
          hasConfig.value = true
        } catch (e) {
          console.warn('解析 web_chart_config 失败', e)
          initialConfig.value = null
          hasConfig.value = false
        }
      }
    }
  } catch (error) {
    console.error('加载模板数据失败:', error)
    window.$message?.error($t('common.fetchDataFailed'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadTemplateData()
})
</script>

<template>
  <div class="step-web-chart">
    <!-- 预览区域 -->
    <NCard title="Web 图表配置" class="preview-card">
      <template #header-extra>
        <NButton type="primary" @click="openEditor">
          {{ hasConfig ? '编辑配置' : '创建配置' }}
        </NButton>
      </template>

      <!-- 有配置时显示预览 -->
      <div v-if="hasConfig && initialConfig" class="preview-area">
        <ThingsVisEditor
          mode="viewer"
          :initial-config="initialConfig"
          :platform-fields="platformFields"
          height="400px"
        />
      </div>

      <!-- 无配置时提示 -->
      <NEmpty v-else description="暂无图表配置，点击上方按钮创建" />
    </NCard>

    <!-- 操作按钮 -->
    <div class="actions-bar">
      <NButton type="primary" @click="next">
        {{ $t('device_template.nextStep') }}
      </NButton>
      <NButton class="m-r3" ghost type="primary" @click="back">
        {{ $t('device_template.back') }}
      </NButton>
      <NButton class="m-r3" @click="cancellation">
        {{ $t('generate.cancel') }}
      </NButton>
    </div>

    <!-- 编辑器弹窗 -->
    <NModal
      v-model:show="showEditorModal"
      preset="card"
      title="编辑 Web 图表配置"
      :style="{ width: '90vw', height: '90vh' }"
      :segmented="{ content: 'soft' }"
    >
      <div class="editor-modal-content">
        <ThingsVisEditor
          ref="editorRef"
          mode="editor"
          :initial-config="initialConfig"
          :platform-fields="platformFields"
          :loading="loading"
          height="calc(90vh - 180px)"
          @save="handleSave"
        />
      </div>

      <template #footer>
        <div class="modal-footer">
          <NButton @click="showEditorModal = false">取消</NButton>
          <NButton
            type="primary"
            :loading="saving"
            @click="editorRef?.triggerSave()"
          >
            保存配置
          </NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style lang="scss" scoped>
.step-web-chart {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-card {
  min-height: 400px;
}

.preview-area {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.actions-bar {
  display: flex;
  flex-direction: row-reverse;
  gap: 12px;
  margin-top: 16px;
}

.editor-modal-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
