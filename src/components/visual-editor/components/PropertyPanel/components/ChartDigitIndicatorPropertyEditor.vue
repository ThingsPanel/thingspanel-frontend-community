<template>
  <n-form size="small" label-placement="left" label-width="70">
    <n-form-item :label="$t('visualEditor.titleProperty')">
      <n-input :value="properties.title" @update:value="updateProperty('title', $event)" />
    </n-form-item>
    <n-form-item :label="$t('visualEditor.deviceIdProperty')">
      <n-input
        :value="properties.deviceId"
        :placeholder="$t('visualEditor.deviceIdPlaceholder')"
        @update:value="updateProperty('deviceId', $event)"
      />
    </n-form-item>
    <n-form-item :label="$t('visualEditor.metricsIdProperty')">
      <n-input
        :value="properties.metricsId"
        :placeholder="$t('visualEditor.metricsIdPlaceholder')"
        @update:value="updateProperty('metricsId', $event)"
      />
    </n-form-item>
    <n-form-item :label="$t('visualEditor.metricsTypeProperty')">
      <n-select
        :value="properties.metricsType"
        :options="metricsTypeOptions"
        @update:value="updateProperty('metricsType', $event)"
      />
    </n-form-item>
    <n-form-item :label="$t('visualEditor.iconProperty')">
      <n-input
        :value="properties.icon"
        :placeholder="$t('visualEditor.iconPlaceholder')"
        @update:value="updateProperty('icon', $event)"
      />
    </n-form-item>
    <n-form-item :label="$t('visualEditor.colorProperty')">
      <n-color-picker :value="properties.color" @update:value="updateProperty('color', $event)" />
    </n-form-item>
    <n-form-item :label="$t('visualEditor.backgroundColorProperty2')">
      <n-color-picker :value="properties.backgroundColor" @update:value="updateProperty('backgroundColor', $event)" />
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
import { $t } from '@/locales'

interface Props {
  properties: {
    title: string
    deviceId: string
    metricsId: string
    metricsType: string
    icon: string
    color: string
    backgroundColor: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [properties: Record<string, any>]
}>()

const metricsTypeOptions = [
  { label: $t('visualEditor.telemetryData'), value: 'telemetry' },
  { label: $t('visualEditor.attributesData'), value: 'attributes' }
]

const updateProperty = (key: string, value: any) => {
  if (value !== null) {
    emit('update', { [key]: value })
  }
}
</script>
