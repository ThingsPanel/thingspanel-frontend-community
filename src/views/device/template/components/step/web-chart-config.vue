<script setup lang="tsx">
/**
 * Web图表配置步骤
 * 显示预览，点击编辑按钮打开ThingsVis编辑器弹窗
 */

import { ref, computed, onMounted } from 'vue'
import { NButton, NModal, NCard, NEmpty, NSelect, NSpace, NSpin } from 'naive-ui'
import { $t } from '@/locales'
import { getTemplat, putTemplat, telemetryApi, attributesApi } from '@/service/api'
import { telemetryDataHistoryList } from '@/service/api/device'
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

// Ring buffer size for the chart editor: enables `{fieldId}__history` arrays so that
// line / area chart widgets can bind to time-series data during configuration.
const CHART_EDITOR_BUFFER_SIZE = 200
// Time window (ms) used when pre-filling the editor ring buffer with historical records.
const HISTORY_SEED_WINDOW_MS = CHART_EDITOR_BUFFER_SIZE * 60_000
// Aggregate window passed to the statistic API (1 point per minute).
const HISTORY_AGGREGATE_WINDOW = '1m'

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

// 🎨 iframe 高度设为足够大，确保内容完整渲染
const previewHeight = computed(() => {
  return '1200px'
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

/**
 * Pre-fill the editor widget ring buffer with historical telemetry records so that
 * line/area chart widgets render immediately instead of starting from an empty buffer.
 * No-op when there are no telemetry fields or the editor ref is not yet mounted.
 */
const seedEditorHistory = async () => {
  if (!editorRef.value) return
  const now = Date.now()
  const startTime = now - HISTORY_SEED_WINDOW_MS

  await Promise.allSettled(
    platformFields.value
      .filter(f => f.dataType === 'telemetry')
      .map(async field => {
        try {
          const { data, error } = await telemetryDataHistoryList({
            device_id: props.deviceTemplateId,
            key: field.id,
            start_time: String(startTime),
            end_time: String(now),
            aggregate_window: HISTORY_AGGREGATE_WINDOW,
          })
          if (error) {
            console.error('[web-chart-config] seedEditorHistory API error for field:', field.id, error)
            return
          }
          const records: Array<{ value: unknown; ts: number }> = (Array.isArray(data) ? data : []).map(
            (p: { x: number; y: unknown }) => ({ value: p.y, ts: p.x }),
          )
          if (records.length > 0) {
            editorRef.value?.pushHistory(field.id, records)
          }
        } catch (e) {
          console.error('[web-chart-config] seedEditorHistory failed for field:', field.id, e)
        }
      }),
  )
}

/**
 * Called when the editor ThingsVisWidget signals it is ready.
 * Seeds historical data into the ring buffer at this point (iframe is live).
 */
const handleEditorReady = () => {
  seedEditorHistory()
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

      <NSpin :show="loading" description="加载中...">
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
          :buffer-size="CHART_EDITOR_BUFFER_SIZE"
          height="calc(90vh - 160px)"
          @save="handleSave"
          @ready="handleEditorReady"
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
  max-height: calc(100vh - 350px);
  min-height: 300px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow-y: auto;
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
