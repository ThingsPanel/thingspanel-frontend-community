<script lang="ts" setup>
import { computed } from 'vue'
import { $t } from '@/locales'
import IconSelector from '@/components/common/icon-selector.vue'

interface Props {
  modelValue?: {
    unit?: string
    color?: string
    iconName?: string
    title?: string
    value?: string | number
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
  set: (value) => emit('update:modelValue', value)
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
</script>

<template>
  <NForm :model="config">
    <NFormItem :label="$t('common.title')">
      <NInput 
        :value="config.title" 
        :placeholder="$t('card.humidity')"
        @update:value="(val) => updateConfig('title', val)" 
      />
    </NFormItem>
    <NFormItem :label="$t('device_template.table_header.unit')">
      <NInput 
        :value="config.unit" 
        :placeholder="$t('device_template.table_header.pleaseEnterTheUnit')" 
        @update:value="(val) => updateConfig('unit', val)"
      />
    </NFormItem>
    <NFormItem :label="$t('generate.color')">
      <NColorPicker 
        :value="config.color" 
        :show-alpha="false" 
        @update:value="(val) => updateConfig('color', val)"
      />
    </NFormItem>
    <NFormItem label="值">
      <NInput 
        :value="config.value" 
        placeholder="45"
        @update:value="(val) => updateConfig('value', val)"
      />
    </NFormItem>
    <IconSelector default-icon="Water" @icon-selected="setIcon" />
  </NForm>
</template>