<script lang="ts" setup>
import { inject, onMounted, ref } from 'vue'
import { NColorPicker, NForm, NFormItem, NInput, NSelect } from 'naive-ui'
import type { IConfigCtx } from '@/components/panel/card'
import { $t } from '@/locales'
import IconSelector from '@/components/common/icon-selector.vue'

const ctx = inject<IConfigCtx>('config-ctx')!

const setIcon = (icon: string) => {
  ctx.config.iconName = icon
}

const dataTypeOptions = ref([
  { label: 'Attributes', value: 'attributes' },
  { label: 'Telemetry', value: 'telemetry' },
  { label: 'Command', value: 'command' }
])

onMounted(() => {
  // 设置配置项的默认值
  if (!ctx.config.iconName) ctx.config.iconName = 'Play'
  if (!ctx.config.buttonIconColor) ctx.config.buttonIconColor = '#FFFFFF'
  if (!ctx.config.buttonColor) ctx.config.buttonColor = '#ff4d4f'
  if (!ctx.config.buttonText) ctx.config.buttonText = $t('card.customData')
  if (!ctx.config.valueToSend) ctx.config.valueToSend = '1'
  if (!ctx.config.dataType) ctx.config.dataType = 'telemetry'
})
</script>

<template>
  <div>
    <NForm :model="ctx.config">
      <NFormItem :label="$t('card.buttonIcon')">
        <IconSelector :default-icon="ctx.config.iconName || 'Fan'" @icon-selected="setIcon" />
      </NFormItem>
      <NFormItem :label="$t('card.buttonIconColor')">
        <NColorPicker v-model:value="ctx.config.buttonIconColor" :show-alpha="false" />
      </NFormItem>
      <NFormItem :label="$t('card.buttonBgColor')">
        <NColorPicker v-model:value="ctx.config.buttonColor" :show-alpha="false" />
      </NFormItem>
      <NFormItem :label="$t('card.buttonText')">
        <NInput v-model:value="ctx.config.buttonText" />
      </NFormItem>
      <NFormItem :label="$t('card.sentData')">
        <NInput v-model:value="ctx.config.valueToSend" type="textarea" :autosize="{ minRows: 3, maxRows: 5 }" />
      </NFormItem>
      <NFormItem :label="$t('card.dataType')">
        <NSelect v-model:value="ctx.config.dataType" :options="dataTypeOptions" />
      </NFormItem>
    </NForm>
  </div>
</template>
