<script lang="ts" setup>
import { inject } from 'vue'
import type { IConfigCtx } from '@/card2.1/core/types/legacy'
import { $t } from '@/locales'

const ctx = inject<IConfigCtx>('config-ctx')!
</script>

<template>
  <div>
    <div class="title">{{ $t('generate.set-default-device-open-status') }}</div>
    <NForm :model="ctx.config">
      <NFormItem :label="$t('generate.open')">
        <n-input v-model:value="ctx.config.active0" :placeholder="$t('generate.open') + '1'" />
      </NFormItem>
      <NFormItem :label="$t('generate.close')">
        <n-input v-model:value="ctx.config.active1" :placeholder="$t('generate.close') + '0'" />
      </NFormItem>
    </NForm>
  </div>
</template>

<style lang="scss">
.title {
  font-weight: 900;
  font-size: 20px;
  margin-bottom: 20px;
}

.n-input-number > .n-input > .n-input-wrapper > .n-input__suffix {
  display: none !important;
}

.btn {
  margin-left: 20px;
}
</style>
