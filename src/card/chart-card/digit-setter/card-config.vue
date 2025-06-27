<script lang="ts" setup>
import { inject, onMounted } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber } from 'naive-ui'
import type { IConfigCtx } from '@/components/panel/card'
import { $t } from '@/locales'

const ctx = inject<IConfigCtx>('config-ctx')!

onMounted(() => {
  if (ctx.config.min === undefined) ctx.config.min = 0
  if (ctx.config.max === undefined) ctx.config.max = 100
  if (ctx.config.step === undefined) ctx.config.step = 0.1
  if (ctx.config.decimals === undefined) ctx.config.decimals = 1
})
</script>

<template>
  <NForm :model="ctx.config">
    <NFormItem :label="单位">
      <NInput v-model:value="ctx.config.unit" :placeholder="请输入单位" />
    </NFormItem>
    <NFormItem :label="最小值">
      <NInputNumber v-model:value="ctx.config.min" :placeholder="最小值" />
    </NFormItem>
    <NFormItem :label="最大值">
      <NInputNumber v-model:value="ctx.config.max" :placeholder="最大值" />
    </NFormItem>
    <NFormItem :label="步长">
      <NInputNumber v-model:value="ctx.config.step" :placeholder="步长" :step="0.1" />
    </NFormItem>
    <NFormItem :label="小数位数">
      <NInputNumber
        v-model:value="ctx.config.decimals"
        :placeholder="小数位数"
        :precision="0"
        :min="0"
        :max="10"
      />
    </NFormItem>
  </NForm>
</template>
