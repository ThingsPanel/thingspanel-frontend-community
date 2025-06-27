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
    <NFormItem :label="$t('page.general.unit')">
      <NInput v-model:value="ctx.config.unit" :placeholder="$t('page.general.enterUnit')" />
    </NFormItem>
    <NFormItem :label="$t('page.general.minimum')">
      <NInputNumber v-model:value="ctx.config.min" :placeholder="$t('page.general.minimum')" />
    </NFormItem>
    <NFormItem :label="$t('page.general.maximum')">
      <NInputNumber v-model:value="ctx.config.max" :placeholder="$t('page.general.maximum')" />
    </NFormItem>
    <NFormItem :label="$t('page.general.step')">
      <NInputNumber v-model:value="ctx.config.step" :placeholder="$t('page.general.step')" :step="0.1" />
    </NFormItem>
    <NFormItem :label="$t('page.general.decimalPlaces')">
      <NInputNumber
        v-model:value="ctx.config.decimals"
        :placeholder="$t('page.general.decimalPlaces')"
        :precision="0"
        :min="0"
        :max="10"
      />
    </NFormItem>
  </NForm>
</template>
