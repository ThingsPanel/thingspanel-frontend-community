<script lang="ts" setup>
import { computed, onMounted } from 'vue'
import { NColorPicker, NForm, NFormItem, NInput, NSelect } from 'naive-ui'
import { $t } from '@/locales'
import IconSelector from '@/components/common/icon-selector.vue'
import { DeviceDispatchSelector } from '@/components/device-selectors'

interface Props {
  modelValue?: {
    deviceId?: string
    deviceName?: string
    metricsId?: string
    metricsName?: string
    iconName?: string
    buttonIconColor?: string
    buttonColor?: string
    buttonText?: string
    valueToSend?: string
    dataType?: string
  }
}

interface Emits {
  'update:modelValue': [value: any]
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({})
})

const emit = defineEmits<Emits>()

const config = computed({
  get: () => props.modelValue || {},
  set: value => emit('update:modelValue', value)
})

const updateConfig = (key: string, value: any) => {
  emit('update:modelValue', {
    ...config.value,
    [key]: value
  })
}

const setIcon = (icon: string) => {
  updateConfig('iconName', icon)
}

const dataTypeOptions = [
  { label: 'Attributes', value: 'attributes' },
  { label: 'Telemetry', value: 'telemetry' },
  { label: 'Command', value: 'command' }
]

// 初始化默认值
const initDefaultValues = () => {
  const currentConfig = config.value
  const updates: Record<string, any> = {}

  if (!currentConfig.deviceId) updates.deviceId = ''
  if (!currentConfig.deviceName) updates.deviceName = ''
  if (!currentConfig.metricsId) updates.metricsId = ''
  if (!currentConfig.metricsName) updates.metricsName = ''
  if (!currentConfig.iconName) updates.iconName = 'Play'
  if (!currentConfig.buttonIconColor) updates.buttonIconColor = '#FFFFFF'
  if (!currentConfig.buttonColor) updates.buttonColor = '#ff4d4f'
  if (!currentConfig.buttonText) updates.buttonText = $t('card.customData')
  if (!currentConfig.valueToSend) updates.valueToSend = '1'
  if (!currentConfig.dataType) updates.dataType = 'telemetry'

  if (Object.keys(updates).length > 0) {
    emit('update:modelValue', { ...currentConfig, ...updates })
  }
}

// 在组件挂载时初始化默认值
onMounted(() => {
  initDefaultValues()
})
</script>

<template>
  <div>
    <NForm :model="config">
      <!-- 设备选择 -->
      <NFormItem :label="$t('generate.deviceAndMetrics')">
        <DeviceDispatchSelector
          v-model="config"
          @device-change="(deviceId, device) => updateConfig('deviceId', deviceId)"
          @data-type-change="val => updateConfig('dataType', val)"
          @metrics-change="(metricsId, metrics) => updateConfig('metricsId', metricsId)"
        />
      </NFormItem>

      <!-- 按钮配置 -->
      <NFormItem :label="$t('card.buttonIcon')">
        <IconSelector :default-icon="config.iconName || 'Fan'" @icon-selected="setIcon" />
      </NFormItem>
      <NFormItem :label="$t('card.buttonIconColor')">
        <NColorPicker
          :value="config.buttonIconColor"
          :show-alpha="false"
          @update:value="val => updateConfig('buttonIconColor', val)"
        />
      </NFormItem>
      <NFormItem :label="$t('card.buttonBgColor')">
        <NColorPicker
          :value="config.buttonColor"
          :show-alpha="false"
          @update:value="val => updateConfig('buttonColor', val)"
        />
      </NFormItem>
      <NFormItem :label="$t('card.buttonText')">
        <NInput :value="config.buttonText" @update:value="val => updateConfig('buttonText', val)" />
      </NFormItem>
      <NFormItem :label="$t('card.sentData')">
        <NInput
          :value="config.valueToSend"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 5 }"
          @update:value="val => updateConfig('valueToSend', val)"
        />
      </NFormItem>
    </NForm>
  </div>
</template>
