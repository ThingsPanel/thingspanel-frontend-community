<template>
  <n-form size="small" label-placement="left" label-width="60">
    <n-form-item :label="$t('visualEditor.linkProperty')">
      <n-input
        :value="properties.src"
        :placeholder="$t('visualEditor.imagePlaceholder')"
        @update:value="updateProperty('src', $event)"
      />
    </n-form-item>
    <n-form-item :label="$t('visualEditor.altProperty')">
      <n-input :value="properties.alt" @update:value="updateProperty('alt', $event)" />
    </n-form-item>
    <n-form-item :label="$t('visualEditor.fitProperty')">
      <n-select
        :value="properties.objectFit"
        :options="fitOptions"
        @update:value="updateProperty('objectFit', $event)"
      />
    </n-form-item>
  </n-form>
</template>

<script setup lang="ts">
import { $t } from '@/locales'

interface Props {
  properties: {
    src: string
    alt: string
    objectFit: string
  }
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [properties: Record<string, any>]
}>()

const fitOptions = [
  { label: $t('visualEditor.coverFit'), value: 'cover' },
  { label: $t('visualEditor.containFit'), value: 'contain' },
  { label: $t('visualEditor.fillFit'), value: 'fill' }
]

const updateProperty = (key: string, value: any) => {
  emit('update', { [key]: value })
}
</script>
