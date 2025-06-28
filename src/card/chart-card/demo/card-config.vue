<script lang="ts" setup>
import { inject } from 'vue'
import type { IConfigCtx } from '@/components/panel/card'
import { $t } from '@/locales'
import IconSelector from './icon-selector.vue'

const ctx = inject<IConfigCtx>('config-ctx')!

const setIcon = icon => {
  ctx.config.iconName = icon // 更新配置
}
</script>

<template>
  <NForm :model="ctx.config">
    <NFormItem :label="$t('card.general.unit')">
      <NInput v-model:value="ctx.config.unit" :placeholder="$t('card.general.enterUnit')" />
    </NFormItem>
    <NFormItem :label="$t('card.general.color')">
      <NColorPicker v-model:value="ctx.config.color" :show-alpha="false" />
    </NFormItem>
    <IconSelector @icon-selected="setIcon" />
  </NForm>
</template>
