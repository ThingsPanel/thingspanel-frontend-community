<script lang="ts" setup>
import { inject } from 'vue';
import type { IConfigCtx } from '@/components/panel/card';
import { $t } from '@/locales';

const ctx = inject<IConfigCtx>('config-ctx')!;
</script>

<template>
  <NForm :model="ctx.config">
    <NFormItem path="username" :label="$t('generate.user')">
      <NInput v-model:value="ctx.config.username" />
    </NFormItem>
    <NFormItem path="age" :label="$t('generate.age')">
      <NInput v-model:value="ctx.config.age" @keydown.enter.prevent />
    </NFormItem>
  </NForm>
</template>
