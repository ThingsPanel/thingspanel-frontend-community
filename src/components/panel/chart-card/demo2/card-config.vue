<script lang="ts" setup>
import { inject } from 'vue';
import type { IConfigCtx } from '@/components/panel/card';
import { $t } from '@/locales';

const ctx = inject<IConfigCtx>('config-ctx')!;

const options = [
  {
    label: '06:00',
    value: '06:00'
  },
  {
    label: '07:00',
    value: '07:00'
  },
  {
    label: '08:00',
    value: '08:00'
  },
  {
    label: '09:00',
    value: '09:00'
  },
  {
    label: '10:00',
    value: '10:00'
  },
  {
    label: '11:00',
    value: '11:00'
  },
  {
    label: '12:00',
    value: '12:00'
  }
];
</script>

<template>
  <NForm :model="ctx.config">
    <NFormItem label="选择icon">
      <NSelect v-model:value="ctx.config.times" multiple :options="options" />
    </NFormItem>
    <NFormItem :label="$t('generate.color')">
      <NColorPicker v-model:value="ctx.config.color" :show-alpha="false" />
    </NFormItem>
  </NForm>
</template>
