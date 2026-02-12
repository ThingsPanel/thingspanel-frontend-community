<script setup lang="tsx">
/**
 * App图表配置步骤
 * 显示预览，点击编辑按钮打开ThingsVis编辑器弹窗
 */

import { ref, onMounted } from 'vue'
import { NButton, NModal, NCard, NEmpty, NSelect, NSpace, NSpin } from 'naive-ui'
import { $t } from '@/locales'
import { getTemplat, putTemplat, telemetryApi, attributesApi } from '@/service/api'
import ThingsVisWidget from '@/components/thingsvis/ThingsVisWidget.vue'
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
const editorRef = ref<InstanceType<typeof ThingsVisWidget>>()

// 状态
const loading = ref(true)
const saving = ref(false)
const showEditorModal = ref(false)
const initialConfig = ref<any>(null)
const platformFields = ref<PlatformField[]>([])
const hasConfig = ref(false)
const refreshInterval = ref(5000)

const refreshOptions = [
  { label: '手动刷新', value: 0 },
  { label: '5秒', value: 5000 },
  { label: '10秒', value: 10000 },
  { label: '30秒', value: 30000 },
  { label: '1分钟', value: 60000 }
]

// 取消
const cancellation: () => void = () => {
  emit('update:modalVisible')
}

// 上一步
const back: () => void = () => {
  emit('update:stepCurrent', 3)
}

// 打开编辑器
const openEditor = () => {
  showEditorModal.value = true
}

// 下一步 (完成)
const next = () => {
  emit('update:stepCurrent', 5)
}

// 处理保存
const handleSave = async (payload: any) => {
  if (saving.value) return

  saving.value = true
  try {
    // 获取当前模板数据
    const res = await getTemplat(props.deviceTemplateId)

    // 保存到 app_chart_config 字段
    // 将刷新频率合并到配置中
    const configToSave = {
      ...payload,
      refreshInterval: refreshInterval.value
    }

    await putTemplat({
      ...res.data,
      app_chart_config: JSON.stringify(configToSave)
    })

    window.$message?.success($t('common.saveSuccess'))

    // 更新状态
    initialConfig.value = payload
    hasConfig.value = true

    // 关闭弹窗
    showEditorModal.value = false
  } catch (error) {
    console.error('保存 App 图表配置失败:', error)
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
      // 提取平台字段（优先从物模型接口获取）
      const [telemetryRes, attributesRes] = await Promise.all([
        telemetryApi({ page: 1, page_size: 1000, device_template_id: props.deviceTemplateId }),
        attributesApi({ page: 1, page_size: 1000, device_template_id: props.deviceTemplateId })
      ])

      const telemetryList = Array.isArray(telemetryRes?.data?.list)
        ? telemetryRes.data.list
        : Array.isArray(telemetryRes?.data)
          ? telemetryRes.data
          : []

      const attributesList = Array.isArray(attributesRes?.data?.list)
        ? attributesRes.data.list
        : Array.isArray(attributesRes?.data)
          ? attributesRes.data
          : []

      const platformSource = {
        telemetry: telemetryList,
        attributes: attributesList
      }

      const extractedFields = extractPlatformFields(platformSource)
      platformFields.value = extractedFields.length > 0 ? extractedFields : extractPlatformFields(res.data)

      // 加载已有配置
      if (res.data.app_chart_config) {
        try {
          const config = JSON.parse(res.data.app_chart_config)
          initialConfig.value = config
          hasConfig.value = true
           // 恢复刷新频率配置
          if (config.refreshInterval !== undefined) {
             refreshInterval.value = config.refreshInterval
          }
        } catch (e) {
          console.warn('解析 app_chart_config 失败', e)
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
  <div class="step-app-chart">
    <!-- 预览区域 -->
    <NCard title="App 图表配置" class="preview-card">
      <template #header-extra>
        <NSpace align="center">
           <span>刷新频率：</span>

           <NSelect
              v-model:value="refreshInterval"
              :options="refreshOptions"
              size="small"
              style="width: 120px"
              placeholder="刷新频率"
            />
          <NButton type="primary" size="small" @click="openEditor">
            {{ hasConfig ? '编辑配置' : '创建配置' }}
          </NButton>
        </NSpace>
      </template>

      <NSpin :show="loading" description="加载中...">
        <!-- 有配置时显示预览 -->
        <div v-if="hasConfig && initialConfig" class="preview-area">
          <ThingsVisWidget
            mode="viewer"
            :config="initialConfig"
            :platform-fields="platformFields"
            height="400px"
          />
        </div>

        <!-- 无配置时提示 -->
        <NEmpty v-else-if="!loading" description="暂无图表配置，点击上方按钮创建" />
        <div v-else style="min-height: 200px" />
      </NSpin>
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
      title="编辑 App 图表配置"
      :style="{ width: '90vw', height: '90vh' }"
      :segmented="{ content: 'soft' }"
    >
      <div class="editor-modal-content">
        <ThingsVisWidget
          ref="editorRef"
          mode="editor"
          :config="initialConfig"
          :platform-fields="platformFields"
          height="calc(90vh - 120px)"
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
.step-app-chart {
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
