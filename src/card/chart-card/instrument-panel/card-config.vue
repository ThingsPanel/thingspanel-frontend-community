<script lang="ts" setup>
import { inject } from 'vue'
import type { IConfigCtx } from '@/components/panel/card'
import { $t } from '@/locales'

const ctx = inject<IConfigCtx>('config-ctx')!
</script>

<template>
  <NForm :model="ctx.config">
    <NFormItem :label="$t('page.general.unit')">
      <NInput v-model:value="ctx.config.unit" :placeholder="$t('page.general.enterUnit')" />
    </NFormItem>
    <NFormItem :label="$t('page.general.minimum')">
      <NInputNumber v-model:value="ctx.config.min" :placeholder="$t('page.general.inputMinimum')" />
    </NFormItem>
    <NFormItem :label="$t('page.general.maximum')">
      <NInputNumber v-model:value="ctx.config.max" :placeholder="$t('page.general.enterMaxValue')" />
    </NFormItem>
  </NForm>
</template>
