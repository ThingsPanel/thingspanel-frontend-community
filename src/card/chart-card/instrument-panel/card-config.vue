<script lang="ts" setup>
import { inject } from 'vue';
import type { IConfigCtx } from '@/components/panel/card';
import { $t } from '@/locales';

const ctx = inject<IConfigCtx>('config-ctx')!;
</script>

<template>
  <NForm :model="ctx.config">
    <NFormItem :label="$t('device_template.table_header.unit')">
      <NInput v-model:value="ctx.config.unit" :placeholder="$t('device_template.table_header.pleaseEnterTheUnit')" />
    </NFormItem>
    <NFormItem :label="$t('generate.min-value')">
      <NInputNumber v-model:value="ctx.config.min" :placeholder="$t('generate.InputMinValue')" />
    </NFormItem>
    <NFormItem :label="$t('generate.max-value')">
      <NInputNumber v-model:value="ctx.config.max" :placeholder="$t('generate.inputMaxValue')" />
    </NFormItem>
  </NForm>
</template>
