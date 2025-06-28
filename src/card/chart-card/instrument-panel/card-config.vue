<script lang="ts" setup>
import { inject } from 'vue'
import type { IConfigCtx } from '@/components/panel/card'
import { $t } from '@/locales'

const ctx = inject<IConfigCtx>('config-ctx')!
</script>

<template>
  <NForm :model="ctx.config">
    <NFormItem :label="$t('card.general.unit')">
      <NInput v-model:value="ctx.config.unit" :placeholder="$t('card.general.enterUnit')" />
    </NFormItem>
    <NFormItem :label="$t('card.general.minimum')">
      <NInputNumber v-model:value="ctx.config.min" :placeholder="$t('card.general.inputMinimum')" />
    </NFormItem>
    <NFormItem :label="$t('card.general.maximum')">
      <NInputNumber v-model:value="ctx.config.max" :placeholder="$t('card.general.enterMaxValue')" />
    </NFormItem>
  </NForm>
</template>
