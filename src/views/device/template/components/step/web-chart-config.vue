<script setup lang="tsx">
/**
 * Web图表配置步骤
 * 显示预览，点击编辑按钮打开ThingsVis编辑器弹窗
 */

import { ref, computed, onMounted, watch } from 'vue'
import { NButton, NModal, NCard, NEmpty, NSelect, NSpace, NSpin, NIcon } from 'naive-ui'
import { ExpandOutline, ContractOutline, CloseOutline } from '@vicons/ionicons5'
import { $t } from '@/locales'
import { getTemplat, putTemplat, telemetryApi, attributesApi, eventsApi, commandsApi } from '@/service/api'
import { telemetryDataHistoryList } from '@/service/api/device'
import ThingsVisWidget from '@/components/thingsvis/ThingsVisWidget.vue'
import { extractPlatformFields } from '@/utils/thingsvis/platform-fields'
import { normalizeThingsVisHistoryBindings } from '@/utils/thingsvis/normalize-history-bindings'
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
// 将当前模板字段包装为一个虚拟设备条目，供 Field Picker 的「Device Fields」选项使用
const platformDevices = computed(() => {
  if (!platformFields.value.length) return []
  return [{
    deviceId: '__template__',
    deviceName: '当前设备模板',
    groupName: '当前设备模板',
    fields: platformFields.value,
    presets: []
  }]
})

const loading = ref(true)
const saving = ref(false)
const widgetKey = ref(0)
const showEditorModal = ref(false)
const isEditorFullscreen = ref(false)
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
  isEditorFullscreen.value = false
  showEditorModal.value = true
}

const toggleEditorFullscreen = () => {
  isEditorFullscreen.value = !isEditorFullscreen.value
}

const editorCardStyle = computed(() => ({
  width: isEditorFullscreen.value ? '100vw' : 'min(94vw, 1800px)',
  height: isEditorFullscreen.value ? '100vh' : 'min(92vh, 1120px)'
}))

const editorWidgetHeight = computed(() =>
  isEditorFullscreen.value ? 'calc(100vh - 170px)' : 'calc(min(92vh, 1120px) - 170px)'
)

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
            time_range: 'custom'
          })
          if (error) {
            console.error('[web-chart-config] seedEditorHistory API error for field:', field.id, error)
            return
          }
          const records: Array<{ value: unknown; ts: number }> = (Array.isArray(data) ? data : []).map(
            (p: { x: number; y: unknown }) => ({ value: p.y, ts: p.x })
          )
          if (records.length > 0) {
            editorRef.value?.pushHistory(field.id, records, '__template__')
          }
        } catch (e) {
          console.error('[web-chart-config] seedEditorHistory failed for field:', field.id, e)
        }
      })
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
  if (saving.value) {
    return
  }

  saving.value = true
  try {
    // 获取当前模板数据
    const res = await getTemplat(props.deviceTemplateId)

    // ⚠️ CRITICAL: 清理 PLATFORM_FIELD datasource 中的 deviceId
    // 这些 ID 在编辑时是模板/虚拟设备 ID，不应该被保存到配置中
    // 运行时会根据真实设备ID动态注入
    const cleanedPayload = normalizeThingsVisHistoryBindings(JSON.parse(JSON.stringify(payload)))
    if (cleanedPayload.dataSources && Array.isArray(cleanedPayload.dataSources)) {
      cleanedPayload.dataSources.forEach((ds: any) => {
        if (ds.type === 'PLATFORM_FIELD' && ds.config) {
          // ✅ 移除编辑时的虚拟 deviceId，让运行时注入真实设备 ID
          delete ds.config.deviceId
        }
      })
    }

    // 只保存到 web_chart_config 字段
    // 将刷新频率合并到配置中
    const configToSave = {
      ...cleanedPayload,
      refreshInterval: refreshInterval.value
    }
    const configStr = JSON.stringify(configToSave)
    await putTemplat({
      ...res.data,
      web_chart_config: configStr
    })

    window.$message?.success($t('common.saveSuccess'))

    // 更新状态
    initialConfig.value = configToSave
    hasConfig.value = true
    widgetKey.value++ // 强制刷新预览

    // 关闭弹窗
    showEditorModal.value = false
  } catch (error) {
    console.error('保存 Web 图表配置失败:', error)
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
      // Fetch all platform field types from model APIs: telemetry, attributes, events, commands.
      const [telemetryRes, attributesRes, eventsRes, commandsRes] = await Promise.all([
        telemetryApi({ page: 1, page_size: 1000, device_template_id: props.deviceTemplateId }),
        attributesApi({ page: 1, page_size: 1000, device_template_id: props.deviceTemplateId }),
        eventsApi({ page: 1, page_size: 1000, device_template_id: props.deviceTemplateId }),
        commandsApi({ page: 1, page_size: 1000, device_template_id: props.deviceTemplateId })
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

      const eventsList = Array.isArray(eventsRes?.data?.list)
        ? eventsRes.data.list
        : Array.isArray(eventsRes?.data)
          ? eventsRes.data
          : []

      const commandsList = Array.isArray(commandsRes?.data?.list)
        ? commandsRes.data.list
        : Array.isArray(commandsRes?.data)
          ? commandsRes.data
          : []

      const platformSource = {
        telemetry: telemetryList,
        attributes: attributesList,
        events: eventsList,
        commands: commandsList
      }

      const extractedFields = extractPlatformFields(platformSource)
      platformFields.value = extractedFields.length > 0 ? extractedFields : extractPlatformFields(res.data)

      // 加载已有配置
      if (res.data.web_chart_config) {
        try {
          const config = normalizeThingsVisHistoryBindings(JSON.parse(res.data.web_chart_config))
          initialConfig.value = config
          hasConfig.value = true
          // 恢复刷新频率配置
          if (config.refreshInterval !== undefined) {
            refreshInterval.value = config.refreshInterval
          }
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

watch(showEditorModal, visible => {
  if (!visible) {
    isEditorFullscreen.value = false
  }
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
    <NModal v-model:show="showEditorModal" :mask-closable="false">
      <div class="chart-editor-shell" :class="{ 'chart-editor-shell--fullscreen': isEditorFullscreen }">
        <NCard
          title="编辑 Web 图表配置"
          :bordered="false"
          :class="['chart-editor-card', { 'chart-editor-card--fullscreen': isEditorFullscreen }]"
          :style="editorCardStyle"
        >
          <template #header-extra>
            <NSpace align="center" size="small">
              <NButton quaternary circle @click="toggleEditorFullscreen">
                <template #icon>
                  <NIcon>
                    <ContractOutline v-if="isEditorFullscreen" />
                    <ExpandOutline v-else />
                  </NIcon>
                </template>
              </NButton>
              <NButton quaternary circle @click="showEditorModal = false">
                <template #icon>
                  <NIcon>
                    <CloseOutline />
                  </NIcon>
                </template>
              </NButton>
            </NSpace>
          </template>

          <div class="editor-modal-content">
            <ThingsVisWidget
              ref="editorRef"
              mode="editor"
              :config="initialConfig"
              :platform-fields="[]"
              :platform-devices="platformDevices"
              :buffer-size="CHART_EDITOR_BUFFER_SIZE"
              :height="editorWidgetHeight"
              @save="handleSave"
              @ready="handleEditorReady"
            />
          </div>

          <template #footer>
            <div class="modal-footer">
              <NButton @click="showEditorModal = false">取消</NButton>
              <NButton type="primary" :loading="saving" @click="editorRef?.triggerSave()">保存配置</NButton>
            </div>
          </template>
        </NCard>
      </div>
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
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  display: flex;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.chart-editor-shell) {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
}

:deep(.chart-editor-shell--fullscreen) {
  padding: 0;
}

:deep(.chart-editor-card) {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 16px;
}

:deep(.chart-editor-card .n-card-header) {
  flex: 0 0 auto;
}

:deep(.chart-editor-card .n-card__content) {
  flex: 1 1 auto;
  min-height: 0;
  padding-top: 12px;
  display: flex;
  overflow: hidden;
}

:deep(.chart-editor-card .n-card__footer) {
  flex: 0 0 auto;
}

:deep(.chart-editor-card--fullscreen) {
  border-radius: 0;
}

:deep(.chart-editor-card--fullscreen .n-card__content) {
  padding-bottom: 12px;
}

:deep(.editor-modal-content .thingsvis-widget-container) {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
