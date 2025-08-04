<script lang="ts" setup>
import { inject, onMounted } from 'vue'
import type { IConfigCtx } from '@/card2.1/core/types/legacy'
import { $t } from '@/locales'

const ctx = inject<IConfigCtx>('config-ctx')!

onMounted(() => {
  // 设置默认配置
  if (ctx.config.showHeader === undefined) {
    ctx.config.showHeader = true
  }
  if (ctx.config.bordered === undefined) {
    ctx.config.bordered = true
  }
  if (ctx.config.striped === undefined) {
    ctx.config.striped = false
  }
  if (ctx.config.size === undefined) {
    ctx.config.size = 'medium'
  }
})
</script>

<template>
  <div class="table-config">
    <n-form :model="ctx.config" label-placement="left">
      <n-form-item :label="$t('common.showHeader')">
        <n-switch v-model:value="ctx.config.showHeader" />
      </n-form-item>
      
      <n-form-item :label="$t('common.bordered')">
        <n-switch v-model:value="ctx.config.bordered" />
      </n-form-item>
      
      <n-form-item :label="$t('common.striped')">
        <n-switch v-model:value="ctx.config.striped" />
      </n-form-item>
      
      <n-form-item :label="$t('common.size')">
        <n-select 
          v-model:value="ctx.config.size" 
          :options="[
            { label: $t('common.small'), value: 'small' },
            { label: $t('common.medium'), value: 'medium' },
            { label: $t('common.large'), value: 'large' }
          ]"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<style scoped>
.table-config :deep(.n-form-item) {
  margin-bottom: 16px;
}
</style>
