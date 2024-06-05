<script lang="ts" setup>
import { inject } from 'vue';
import type { IConfigCtx } from '@/components/panel/card';
import { $t } from '@/locales';
import icons from './icon';

const ctx = inject<IConfigCtx>('config-ctx')!;
</script>

<template>
  <NForm :model="ctx.config">
    <NFormItem label="选择icon">
      <div class="flex space-x-3">
        <div
          v-for="item in icons"
          :key="item.name"
          :class="`text-lg cursor-pointer p-1 rounded border ${
            item.name === ctx.config.icon ? 'border-blue-500' : 'border-transparent'
          }`"
          @click="ctx.config.icon = item.name"
        >
          <component :is="item.value" />
        </div>
      </div>
    </NFormItem>
    <NFormItem :label="$t('generate.color')">
      <NColorPicker v-model:value="ctx.config.color" :show-alpha="false" />
    </NFormItem>
  </NForm>
</template>
