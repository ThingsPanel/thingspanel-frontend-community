<script lang="ts" setup>
import { inject } from 'vue'
import type { IConfigCtx } from '@/components/panel/card'
import { $t } from '@/locales'

const ctx = inject<IConfigCtx>('config-ctx')!
</script>

<template>
  <NForm :model="ctx.config">
    <NFormItem :label="单位">
      <NInput v-model:value="ctx.config.unit" :placeholder="请输入单位" />
    </NFormItem>
    <NFormItem :label="最小值">
      <NInputNumber v-model:value="ctx.config.min" :placeholder="输入最小值" />
    </NFormItem>
    <NFormItem :label="最大值">
      <NInputNumber v-model:value="ctx.config.max" :placeholder="请输入最大值" />
    </NFormItem>
  </NForm>
</template>
