<script lang="ts" setup>
import { inject, onMounted } from 'vue'
import { NColorPicker, NForm, NFormItem, NInput } from 'naive-ui'
import type { IConfigCtx } from '@/card2.1/core/types/legacy'
import { $t } from '@/locales'
import IconSelector from '@/components/common/icon-selector.vue'

const ctx = inject<IConfigCtx>('config-ctx')!
const setActiveIcon = (icon: string) => {
  ctx.config.activeIconName = icon
}

const setInactiveIcon = (icon: string) => {
  ctx.config.inactiveIconName = icon
}

onMounted(() => {
  // 设置配置项的默认值
  if (!ctx.config.activeIconName) ctx.config.activeIconName = 'BulbOutline'
  if (!ctx.config.inactiveIconName) ctx.config.inactiveIconName = 'Bulb'
  if (!ctx.config.activeColor) ctx.config.activeColor = '#FFA500'
  if (!ctx.config.inactiveColor) ctx.config.inactiveColor = '#808080'
})
</script>

<template>
  <div>
    <NForm :model="ctx.config">
      <NFormItem :label="$t('generate.stateOnIcon')">
        <IconSelector default-icon="BulbOutline" @icon-selected="setActiveIcon" />
      </NFormItem>
      <NFormItem :label="$t('generate.stateOnColor')">
        <NColorPicker v-model:value="ctx.config.activeColor" :show-alpha="false" />
      </NFormItem>
      <NFormItem :label="$t('generate.stateOffIcon')">
        <IconSelector default-icon="Bulb" @icon-selected="setInactiveIcon" />
      </NFormItem>
      <NFormItem :label="$t('generate.stateOffColor')">
        <NColorPicker v-model:value="ctx.config.inactiveColor" :show-alpha="false" />
      </NFormItem>
      <div class="title">{{ $t('generate.set-default-device-open-status') }}</div>
      <NFormItem :label="$t('generate.open')">
        <NInput v-model:value="ctx.config.active0" :placeholder="$t('generate.open') + '1'" />
      </NFormItem>
      <NFormItem :label="$t('generate.close')">
        <NInput v-model:value="ctx.config.active1" :placeholder="$t('generate.close') + '0'" />
      </NFormItem>
    </NForm>
  </div>
</template>

<style lang="scss">
.title {
  font-weight: 900;
  margin-bottom: 20px;
}

.n-input-number > .n-input > .n-input-wrapper > .n-input__suffix {
  display: none !important;
}

.btn {
  margin-left: 20px;
}
</style>
