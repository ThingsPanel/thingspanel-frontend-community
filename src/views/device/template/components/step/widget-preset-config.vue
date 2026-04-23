<script setup lang="tsx">
import { ref, watch, onMounted } from 'vue'
import { NModal, NButton } from 'naive-ui'
import { $t } from '@/locales'
import { getTemplat, putTemplat } from '@/service/api'
import ThingsVisWidget from '@/components/thingsvis/ThingsVisWidget.vue'
import type { PlatformField } from '@/utils/thingsvis/types'
import {
  buildPresetEditorConfig,
  extractFirstNodeFromWidgetConfig,
  getTemplatePresetEntries,
  getTemplatePresetKey,
  parseTemplateChartConfig
} from '@/utils/thingsvis/template-presets'

const emit = defineEmits(['update:presetModalVisible'])

const props = defineProps({
  presetModalVisible: {
    type: Boolean,
    required: true
  },
  deviceTemplateId: {
    type: String,
    required: true
  },
  property: {
    type: Object as () => { id: string; name: string; identifier: string; dataType: string; unit?: string },
    required: true
  },
  propertyType: {
    type: String as () => 'telemetry' | 'attributes',
    required: true
  }
})

// Editor reference
const editorRef = ref<InstanceType<typeof ThingsVisWidget>>()

// State
const loading = ref(false)
const saving = ref(false)
const platformFields = ref<PlatformField[]>([])
const initialConfig = ref<any>(null)

// Load preset data
const loadPresetData = async () => {
  loading.value = true
  try {
    const res = await getTemplat(props.deviceTemplateId)
    if (res.data) {
      // 1. Prepare platform fields (only showing the current property)
      platformFields.value = [
        {
          id: props.property.identifier,
          name: props.property.name,
          dataType: props.propertyType,
          unit: props.property.unit
        }
      ]

      // 2. Parse existing config
      const presetArr = getTemplatePresetEntries(
        res.data.web_chart_config,
        props.propertyType,
        props.property.identifier
      )

      // 3. Build a minimal ThingsVis dashboard config from the snippet
      if (presetArr && presetArr.length > 0) {
        initialConfig.value = buildPresetEditorConfig(presetArr[0]?.widget)
      } else {
        // Empty canvas ready for configuration
        initialConfig.value = null
      }
    }
  } catch (err) {
    console.error('[widget-preset-config] Failed to load preset:', err)
  } finally {
    loading.value = false
  }
}

watch(
  () => props.presetModalVisible,
  (visible) => {
    if (visible && props.deviceTemplateId && props.property.identifier) {
      loadPresetData()
    } else {
      initialConfig.value = null
    }
  },
  { immediate: true }
)

// Handle Save
const handleSave = async (payload: any) => {
  if (saving.value) return
  saving.value = true
  
  try {
    // 1. Get current template data
    const res = await getTemplat(props.deviceTemplateId)
    const rawConfig = parseTemplateChartConfig(res.data.web_chart_config)
    const presets = rawConfig.device_widget_presets || {}

    // 2. Extract the first widget from the payload
    const firstNode = extractFirstNodeFromWidgetConfig(payload)
    const presetKey = getTemplatePresetKey(props.propertyType, props.property.identifier)

    if (firstNode) {
      // Create or update preset
      presets[presetKey] = [
        {
          id: `preset_${presetKey}`,
          name: `${props.property.name}卡片预设`,
          widget: firstNode
        }
      ]
    } else {
      // Empty canvas = clear preset
      delete presets[presetKey]
    }
    
    // 3. Update the template
    rawConfig.device_widget_presets = presets
    await putTemplat({
      ...res.data,
      web_chart_config: JSON.stringify(rawConfig)
    })
    
    window.$message?.success($t('common.saveSuccess'))
    emit('update:presetModalVisible', false)
  } catch (error) {
    console.error('[widget-preset-config] Save Failed:', error)
    window.$message?.error($t('common.saveFailed'))
  } finally {
    saving.value = false
  }
}

const close = () => {
  emit('update:presetModalVisible', false)
}
</script>

<template>
  <NModal
    :show="presetModalVisible"
    preset="card"
    :title="`${property.name} — 组件预设配置`"
    :style="{ width: '90vw', height: '90vh' }"
    :segmented="{ content: 'soft' }"
    @update:show="close"
  >
    <div class="preset-editor-content" v-if="presetModalVisible">
      <ThingsVisWidget
        v-if="!loading"
        ref="editorRef"
        mode="editor"
        :config="initialConfig"
        :platform-fields="platformFields"
        device-id="__template__"
        height="calc(90vh - 160px)"
        @save="handleSave"
      />
    </div>

    <template #footer>
      <div class="modal-footer">
        <NButton @click="close">{{ $t('generate.cancel') }}</NButton>
        <NButton type="primary" :loading="saving" @click="editorRef?.triggerSave()">
          {{ $t('common.save') }}
        </NButton>
      </div>
    </template>
  </NModal>
</template>

<style lang="scss" scoped>
.preset-editor-content {
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
