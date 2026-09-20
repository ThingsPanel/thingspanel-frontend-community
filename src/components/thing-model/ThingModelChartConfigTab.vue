<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { NButton, NCard, NEmpty, NIcon, NModal, NSpin, NSpace } from 'naive-ui'
import { CloseOutline, ContractOutline, ExpandOutline } from '@vicons/ionicons5'
import { thingModelApi } from '@/service/thingmodel/thing-model'
import { thingModelItemApi } from '@/service/thingmodel/thing-model-item'
import type { ThingModel, ThingModelItem } from '@/service/thingmodel/types'
import type { PlatformField } from '@/utils/thingsvis/types'
import ThingsVisWidget from '@/components/thingsvis/ThingsVisWidget.vue'
import { $t } from '@/locales'

const props = defineProps<{
  thingModelId: string
  type: 'web' | 'app'
  readonly?: boolean
}>()

const loading = ref(false)
const saving = ref(false)
const showEditorModal = ref(false)
const isEditorFullscreen = ref(false)
const editorRef = ref<InstanceType<typeof ThingsVisWidget>>()
const initialConfig = ref<any>(null)
const hasConfig = ref(false)
const platformFields = ref<PlatformField[]>([])
const widgetKey = ref(0)

const configField = computed(() => (props.type === 'web' ? 'web_chart_config' : 'app_chart_config'))
const title = computed(() => (props.type === 'web' ? 'Web 图表配置' : 'App 图表配置'))

const platformDevices = computed(() => {
  if (!platformFields.value.length) return []
  return [{
    deviceId: '__template__',
    deviceName: '当前物模型',
    groupId: '__template__',
    groupName: '物模型字段',
    fields: platformFields.value,
    presets: []
  }]
})

const editorCardStyle = computed(() => ({
  width: isEditorFullscreen.value ? '100vw' : 'min(94vw, 1800px)',
  height: isEditorFullscreen.value ? '100vh' : 'min(92vh, 1120px)'
}))

const editorWidgetHeight = computed(() =>
  isEditorFullscreen.value ? 'calc(100vh - 170px)' : 'calc(min(92vh, 1120px) - 170px)'
)

function valueKindToType(kind?: string): 'number' | 'string' | 'boolean' | 'json' {
  if (kind === 'INT' || kind === 'FLOAT') return 'number'
  if (kind === 'BOOL') return 'boolean'
  return 'string'
}

function itemTypeToDataType(type?: string): 'attribute' | 'telemetry' | 'command' | 'event' {
  if (type === 'EVENT') return 'event'
  if (type === 'COMMAND') return 'command'
  return 'telemetry'
}

function itemsToPlatformFields(items: ThingModelItem[]): PlatformField[] {
  return items
    .filter(item => !!item.identifier)
    .map(item => ({
      id: item.identifier,
      name: item.name_i18n?.default || item.identifier,
      type: valueKindToType(item.value_type?.kind),
      dataType: itemTypeToDataType(item.type),
      unit: (item.value_type as any)?.constraint?.unit,
      description: item.description_i18n?.default
    })) as PlatformField[]
}

async function loadConfig() {
  if (!props.thingModelId) return
  loading.value = true
  try {
    const [modelRes, itemsRes] = await Promise.all([
      thingModelApi.get(props.thingModelId),
      thingModelItemApi.list(props.thingModelId, { page: 1, page_size: 500 })
    ])
    const model = ((modelRes as any).data ?? modelRes) as ThingModel
    const items: ThingModelItem[] = (itemsRes as any).data?.items || []
    platformFields.value = itemsToPlatformFields(items)

    const rawConfig = model?.[configField.value as keyof ThingModel]
    if (rawConfig && typeof rawConfig === 'object' && Object.keys(rawConfig as object).length > 0) {
      initialConfig.value = rawConfig
      hasConfig.value = true
    } else {
      initialConfig.value = null
      hasConfig.value = false
    }
  } catch {
    window.$message?.error($t('common.loadFailure'))
  } finally {
    loading.value = false
  }
}

async function handleSave(payload: any) {
  if (saving.value || props.readonly) return
  saving.value = true
  try {
    const cleanedPayload = JSON.parse(JSON.stringify(payload))
    if (Array.isArray(cleanedPayload.dataSources)) {
      cleanedPayload.dataSources.forEach((ds: any) => {
        if (ds.type === 'PLATFORM_FIELD' && ds.config) {
          delete ds.config.deviceId
        }
      })
    }
    const modelRes = await thingModelApi.get(props.thingModelId)
    const model = ((modelRes as any).data ?? modelRes) as ThingModel
    await thingModelApi.update(props.thingModelId, {
      ...model,
      [configField.value]: cleanedPayload
    })
    window.$message?.success($t('common.saveSuccess'))
    initialConfig.value = cleanedPayload
    hasConfig.value = true
    widgetKey.value++
    showEditorModal.value = false
  } catch {
    window.$message?.error($t('common.saveFailed'))
  } finally {
    saving.value = false
  }
}

watch(() => [props.thingModelId, props.type], loadConfig)
watch(showEditorModal, visible => {
  if (!visible) isEditorFullscreen.value = false
})
onMounted(loadConfig)
</script>

<template>
  <NSpin :show="loading">
    <NCard :title="title">
      <template #header-extra>
        <NButton v-if="!readonly" type="primary" size="small" @click="showEditorModal = true">
          {{ hasConfig ? '编辑配置' : '创建配置' }}
        </NButton>
      </template>

      <div v-if="hasConfig && initialConfig" class="preview-area">
        <ThingsVisWidget
          :key="widgetKey"
          mode="viewer"
          :config="initialConfig"
          :platform-fields="platformFields"
          :platform-devices="platformDevices"
          device-id="__template__"
          height="600px"
        />
      </div>
      <NEmpty
        v-else-if="!loading"
        :description="readonly ? '暂无图表配置' : '暂无图表配置，点击上方按钮创建'"
      />
    </NCard>

    <!-- Editor Modal -->
    <NModal v-model:show="showEditorModal" :mask-closable="false">
      <div class="chart-editor-shell" :class="{ 'chart-editor-shell--fullscreen': isEditorFullscreen }">
        <NCard
          :title="'编辑 ' + title"
          :bordered="false"
          :class="['chart-editor-card', { 'chart-editor-card--fullscreen': isEditorFullscreen }]"
          :style="editorCardStyle"
        >
          <template #header-extra>
            <NSpace align="center" size="small">
              <NButton quaternary circle @click="isEditorFullscreen = !isEditorFullscreen">
                <template #icon>
                  <NIcon>
                    <ContractOutline v-if="isEditorFullscreen" />
                    <ExpandOutline v-else />
                  </NIcon>
                </template>
              </NButton>
              <NButton quaternary circle @click="showEditorModal = false">
                <template #icon>
                  <NIcon><CloseOutline /></NIcon>
                </template>
              </NButton>
            </NSpace>
          </template>

          <div class="editor-modal-content">
            <ThingsVisWidget
              ref="editorRef"
              mode="editor"
              :config="initialConfig"
              :platform-fields="platformFields"
              :platform-devices="platformDevices"
              device-id="__template__"
              :height="editorWidgetHeight"
              @save="handleSave"
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
  </NSpin>
</template>

<style lang="scss" scoped>
.preview-area {
  width: 100%;
  min-height: 300px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow-y: auto;
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

:deep(.editor-modal-content .thingsvis-widget-container) {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
