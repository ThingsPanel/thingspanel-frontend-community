<script lang="ts" setup>
import { inject } from 'vue'
import type { IConfigCtx } from '@/components/panel/card'
import { $t } from '@/locales'

const ctx = inject<IConfigCtx>('config-ctx')!
</script>

<template>
  <div>
    <div class="title">{{ $t('page.general.device') }}</div>
    <NForm :model="ctx.config">
      <NFormItem :label="$t('page.general.turnOn')">
        <n-input v-model:value="ctx.config.active0" :placeholder="$t('page.general.turnOn')" + '1'" />
      </NFormItem>
      <NFormItem :label="$t('page.general.turnOff')">
        <n-input v-model:value="ctx.config.active1" :placeholder="$t('page.general.turnOff')" + '0'" />
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
