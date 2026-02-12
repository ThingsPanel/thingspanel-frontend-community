<script setup lang="tsx">
/**
 * Web图表配置步骤
 * 显示预览，点击编辑按钮打开ThingsVis编辑器弹窗
 */

import { ref, computed, onMounted } from 'vue'
import { NButton, NModal, NCard, NEmpty, NSelect, NSpace } from 'naive-ui'
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
const widgetKey = ref(0)
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

// 🎨 计算预览高度（根据画布大小）
const previewHeight = computed(() => {
  if (!initialConfig.value?.canvas) return '400px'
  const canvas = initialConfig.value.canvas
  // 使用画布的实际高度，最小 300px，最大 600px
  const height = Math.min(Math.max(canvas.height || 400, 300), 600)
  return `${height}px`
})

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

    // 只保存到 web_chart_config 字段
    // 将刷新频率合并到配置中
    const configToSave = {
      ...payload,
      refreshInterval: refreshInterval.value
    }
    const configStr = JSON.stringify(configToSave)
    await putTemplat({
      ...res.data,
      web_chart_config: configStr
    })
    console.log('[web-chart-config] 保存成功 (web)')

    window.$message?.success($t('common.saveSuccess'))

    // 更新状态
    initialConfig.value = payload
    hasConfig.value = true
    widgetKey.value++ // 强制刷新预览


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
  console.log('[web-chart-config] 🔄 开始加载模板数据, deviceTemplateId:', props.deviceTemplateId)
  loading.value = true
  try {
    const res = await getTemplat(props.deviceTemplateId)
    console.log('[web-chart-config] 📦 模板数据获取成功:', res.data)

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
      // 仅保留遥测和属性，过滤掉命令类型
      const filtered = (extractedFields.length > 0 ? extractedFields : extractPlatformFields(res.data))
        .filter((f: PlatformField) => f.dataType !== 'command')
      platformFields.value = filtered
      console.log('[web-chart-config] 🏷️ 平台字段提取完成:', platformFields.value.length, '个字段')

      // 加载已有配置
      if (res.data.web_chart_config) {
        console.log('[web-chart-config] 📄 发现 web_chart_config 字段')
        try {
          const config = JSON.parse(res.data.web_chart_config)
          initialConfig.value = config
          hasConfig.value = true
          // 恢复刷新频率配置
          if (config.refreshInterval !== undefined) {
             refreshInterval.value = config.refreshInterval
          }

          // 🔍 详细日志
          console.log('[web-chart-config] ✅ 配置解析成功')
        } catch (e) {
          console.warn('[web-chart-config] ❌ 解析 web_chart_config 失败', e)
          initialConfig.value = null
          hasConfig.value = false
        }
      } else {
        console.log('[web-chart-config] ℹ️ 没有找到 web_chart_config，这是新配置')
      }
    }
  } catch (error) {
    console.error('[web-chart-config] ❌ 加载模板数据失败:', error)
    window.$message?.error($t('common.fetchDataFailed'))
  } finally {
    loading.value = false
    console.log('[web-chart-config] ✅ 数据加载完成')
  }
}

onMounted(() => {
  console.log('[web-chart-config] 🚀 组件已挂载')
  loadTemplateData()
})
</script>

<template>
  <div class="step-web-chart">
    <!-- 预览区域 -->
    <NCard title="Web 图表配置" class="preview-card">
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

      <!-- 有配置时显示预览 -->
      <div v-if="hasConfig && initialConfig" class="preview-area">
        <ThingsVisWidget
          :key="widgetKey"
          mode="viewer"
          :config="initialConfig"
          :platform-fields="platformFields"
          :height="previewHeight"
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
      <div class="editor-modal-content" style="overflow: hidden;">
        <ThingsVisWidget
          ref="editorRef"
          mode="editor"
          :config="initialConfig"
          :platform-fields="platformFields"
          height="calc(90vh - 160px)"
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
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 300px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: auto;
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
