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
    <NFormItem :label="$t('device_template.table_header.unit')">
      <NInput v-model:value="ctx.config.unit" :placeholder="$t('device_template.table_header.pleaseEnterTheUnit')" />
    </NFormItem>
    <NFormItem :label="$t('generate.min-value')">
      <NInputNumber v-model:value="ctx.config.min" :placeholder="$t('generate.min-value')" />
    </NFormItem>
    <NFormItem :label="$t('generate.max-value')">
      <NInputNumber v-model:value="ctx.config.max" :placeholder="$t('generate.max-value')" />
    </NFormItem>
    <NFormItem :label="$t('generate.step')">
      <NInputNumber v-model:value="ctx.config.step" :placeholder="$t('generate.step')" :step="0.1" />
    </NFormItem>
    <NFormItem :label="$t('generate.decimals')">
      <NInputNumber
        v-model:value="ctx.config.decimals"
        :placeholder="$t('generate.decimals')"
        :precision="0"
        :min="0"
        :max="10"
      />
    </NFormItem>
  </NForm>
</template>
