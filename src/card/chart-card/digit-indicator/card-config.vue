<script lang="ts" setup>
import { inject } from 'vue'
import type { IConfigCtx } from '@/components/panel/card'
import { $t } from '@/locales'
import IconSelector from '@/components/common/icon-selector.vue'

const ctx = inject<IConfigCtx>('config-ctx')!

const setIcon = icon => {
  ctx.config.iconName = icon // 更新配置
}
</script>

<template>
  <NForm :model="ctx.config">
    <NFormItem :label="单位">
      <NInput v-model:value="ctx.config.unit" :placeholder="请输入单位" />
    </NFormItem>
    <NFormItem :label="颜色">
      <NColorPicker v-model:value="ctx.config.color" :show-alpha="false" />
    </NFormItem>
    <IconSelector default-icon="Water" @icon-selected="setIcon" />
  </NForm>
</template>
