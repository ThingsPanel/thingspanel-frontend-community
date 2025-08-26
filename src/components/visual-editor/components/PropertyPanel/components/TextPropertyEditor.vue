<template>
  <n-form size="small" label-placement="left" label-width="60">
    <n-form-item :label="$t('visualEditor.content')">
      <n-input :value="properties.content" @update:value="updateProperty('content', $event)" />
    </n-form-item>
    <n-form-item :label="$t('visualEditor.fontSizeProperty')">
      <n-input-number :value="properties.fontSize" @update:value="updateProperty('fontSize', $event)" />
    </n-form-item>
    <n-form-item :label="$t('visualEditor.colorProperty')">
      <n-input :value="properties.color" @update:value="updateProperty('color', $event)" />
    </n-form-item>
    <n-form-item :label="$t('visualEditor.alignProperty')">
      <n-select
        :value="properties.textAlign"
        :options="alignOptions"
        @update:value="updateProperty('textAlign', $event)"
      />
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
import { $t } from '@/locales'

interface Props {
  properties: {
    content: string
    fontSize: number
    color: string
    textAlign: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [properties: Record<string, any>]
}>()

const alignOptions = [
  { label: $t('visualEditor.leftAlign'), value: 'left' },
  { label: $t('visualEditor.centerAlign'), value: 'center' },
  { label: $t('visualEditor.rightAlign'), value: 'right' }
]

const updateProperty = (key: string, value: any) => {
  emit('update', { [key]: value })
}
</script>
