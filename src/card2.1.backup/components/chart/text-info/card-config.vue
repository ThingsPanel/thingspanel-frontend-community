<script lang="ts" setup>
import { inject, onMounted } from 'vue'
import type { IConfigCtx } from '@/card2.1/core/types/legacy'
import { $t } from '@/locales'

const ctx = inject<IConfigCtx>('config-ctx')!

onMounted(() => {
  // 设置默认配置
  if (ctx.config.content === undefined) {
    ctx.config.content = $t('card.defaultTextContent') || '默认文本内容'
  }
  if (ctx.config.fontSize === undefined) {
    ctx.config.fontSize = 16
  }
  if (ctx.config.textAlign === undefined) {
    ctx.config.textAlign = 'left'
  }
})
</script>

<template>
  <div class="text-info-config">
    <n-form :model="ctx.config" label-placement="left">
      <n-form-item :label="$t('common.content')">
        <n-input
          v-model:value="ctx.config.content"
          type="textarea"
          :placeholder="$t('common.pleaseEnterContent')"
          :autosize="{ minRows: 3, maxRows: 6 }"
        />
      </n-form-item>

      <n-form-item :label="$t('common.fontSize')">
        <n-input-number v-model:value="ctx.config.fontSize" :min="12" :max="48" :placeholder="$t('common.fontSize')" />
      </n-form-item>

      <n-form-item :label="$t('common.textAlign')">
        <n-select
          v-model:value="ctx.config.textAlign"
          :options="[
            { label: $t('common.left'), value: 'left' },
            { label: $t('common.center'), value: 'center' },
            { label: $t('common.right'), value: 'right' }
          ]"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<style scoped>
.text-info-config :deep(.n-form-item) {
  margin-bottom: 16px;
}
</style>
